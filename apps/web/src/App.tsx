import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/state/auth-context";
import { CartProvider } from "@/state/cart-context";
import { TenantProvider } from "@/state/tenant-context";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MenuAdmin from "./pages/MenuAdmin";
import PublicMenu from "./pages/PublicMenu";
import Tables from "./pages/Tables";
import WhatsAppKit from "./pages/WhatsAppKit";
import Pipeline from "./pages/Pipeline";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TenantProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/m/:slug/menu" element={<PublicMenu />} />
                <Route path="/m/:slug/menu/:mesa" element={<PublicMenu />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/cardapio" element={<MenuAdmin />} />
                  <Route path="/mesas" element={<Tables />} />
                  <Route path="/whatsapp" element={<WhatsAppKit />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/planos" element={<Plans />} />
                  <Route path="/configuracoes" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
