import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getTenant } from "@/services/api";
import { useAuth } from "@/state/auth-context";
import type { Tenant } from "@/types";

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshTenant = useCallback(async () => {
    if (!user) {
      setTenant(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextTenant = await getTenant();
      setTenant(nextTenant);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Falha ao carregar tenant."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setTenant(null);
      setError(null);
      setLoading(false);
      return;
    }

    void refreshTenant();
  }, [authLoading, user, refreshTenant]);

  const value = useMemo(
    () => ({ tenant, loading, error, refreshTenant }),
    [tenant, loading, error, refreshTenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}
