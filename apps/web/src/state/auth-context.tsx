import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PlanId, User } from "@/types";
import { getCurrentUser, login as loginRequest, signup as signupRequest } from "@/services/api";
import { AUTH_TOKEN_STORAGE_KEY, HttpError } from "@/services/http";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; planId: PlanId }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = "comanda-flow.auth-user";

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }, []);

  const persistSession = useCallback((accessToken: string, nextUser: User) => {
    setUser(nextUser);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    const storedUser = readStoredUser();

    if (storedUser) {
      setUser(storedUser);
      setLoading(false);

      void getCurrentUser()
        .then((nextUser) => {
          persistSession(token, nextUser);
        })
        .catch((error: unknown) => {
          if (error instanceof HttpError && error.status === 401) {
            clearSession();
          }
        });

      return;
    }

    void getCurrentUser()
      .then((nextUser) => {
        persistSession(token, nextUser);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSession, persistSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const session = await loginRequest(email, password);
        persistSession(session.accessToken, session.user);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; planId: PlanId }) => {
      setIsLoading(true);
      try {
        const session = await signupRequest(data);
        persistSession(session.accessToken, session.user);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
