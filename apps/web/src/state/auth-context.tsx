import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { signup as signupRequest, getCurrentUser, login as loginRequest } from "@/services/api";
import type { PlanId, User } from "@/types";
import { AUTH_TOKEN_STORAGE_KEY, HttpError, getActiveAccessToken } from "@/services/http";
import {
  signInWithSupabasePassword,
  signOutSupabaseSession,
  subscribeToSupabaseAuth,
} from "@/services/supabase";

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

  const clearStoredSession = useCallback(() => {
    setUser(null);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }, []);

  const clearLegacySession = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }, []);

  const persistUser = useCallback((nextUser: User) => {
    setUser(nextUser);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const persistLegacySession = useCallback(
    (accessToken: string, nextUser: User) => {
      persistUser(nextUser);

      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    },
    [persistUser],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      if (typeof window === "undefined") {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      const token = await getActiveAccessToken();

      if (!token) {
        if (isMounted) {
          clearStoredSession();
          setLoading(false);
        }
        return;
      }

      const storedUser = readStoredUser();

      if (storedUser && isMounted) {
        setUser(storedUser);
        setLoading(false);
      }

      try {
        const nextUser = await getCurrentUser();

        if (isMounted) {
          persistUser(nextUser);
        }
      } catch (error) {
        if (
          isMounted &&
          (!(error instanceof HttpError) || error.status === 401)
        ) {
          clearStoredSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void hydrateSession();

    const unsubscribe = subscribeToSupabaseAuth((_event, session) => {
      if (typeof window === "undefined") {
        return;
      }

      const legacyToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      if (session?.access_token) {
        clearLegacySession();

        void getCurrentUser()
          .then((nextUser) => {
            persistUser(nextUser);
          })
          .catch(() => {
            clearStoredSession();
          });
        return;
      }

      if (!legacyToken) {
        clearStoredSession();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [clearLegacySession, clearStoredSession, persistUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        await signInWithSupabasePassword(email, password);
        clearLegacySession();
        const nextUser = await getCurrentUser();
        persistUser(nextUser);
      } catch (supabaseError) {
        await signOutSupabaseSession();
        try {
          const session = await loginRequest(email, password);
          persistLegacySession(session.accessToken, session.user);
        } catch (legacyError) {
          if (legacyError instanceof HttpError && legacyError.status === 410) {
            throw new Error(
              "Contas antigas ainda precisam ser migradas para o Supabase antes do login.",
            );
          }

          throw legacyError;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [clearLegacySession, persistLegacySession, persistUser],
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; planId: PlanId }) => {
      setIsLoading(true);
      try {
        const legacySession = await signupRequest(data);

        try {
          await signInWithSupabasePassword(data.email, data.password);
          clearLegacySession();
          const nextUser = await getCurrentUser();
          persistUser(nextUser);
        } catch (supabaseError) {
          persistLegacySession(legacySession.accessToken, legacySession.user);
          throw supabaseError;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [clearLegacySession, persistLegacySession, persistUser],
  );

  const logout = useCallback(() => {
    clearStoredSession();
    void signOutSupabaseSession();
  }, [clearStoredSession]);

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
