import { render, screen } from "@testing-library/react";
import * as api from "@/services/api";
import { AUTH_TOKEN_STORAGE_KEY } from "@/services/http";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/state/auth-context";
import ProtectedRoute from "@/routes/ProtectedRoute";

const AUTH_STORAGE_KEY = "comanda-flow.auth-user";
const storedUser = {
  id: "u1",
  name: "Carlos Silva",
  email: "carlos@generalburguer.com",
  role: "owner",
  tenantId: "t1",
} as const;

function renderWithRouter(initialEntry: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth" element={<div>auth page</div>} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <div>dashboard page</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated users to /auth", async () => {
    renderWithRouter("/dashboard");

    expect(await screen.findByText("auth page")).toBeInTheDocument();
  });

  it("renders protected content when a session exists", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(storedUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedUser));
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "test-token");

    renderWithRouter("/dashboard");

    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
  });
});
