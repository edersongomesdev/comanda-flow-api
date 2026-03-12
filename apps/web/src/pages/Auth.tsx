import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/state/auth-context";
import { mockPlans } from "@/data/mock";
import type { PlanId } from "@/types";
import { motion } from "framer-motion";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: "carlos@generalburguer.com", password: "demo123" });
  const [signupForm, setSignupForm] = useState<{ name: string; email: string; password: string; planId: PlanId }>({
    name: "Carlos Silva",
    email: "carlos@generalburguer.com",
    password: "demo123",
    planId: "MESA",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.email, loginForm.password);
    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(signupForm);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left - branding */}
      <div className="hidden md:flex gradient-hero relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60Z' fill='none' stroke='%23ff8c00' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px"
        }} />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-heading font-bold text-2xl">CF</span>
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Comanda Flow</h1>
          <p className="text-white/60 text-lg">Onde a Gestão Encontra o Ritmo.</p>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">CF</span>
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Comanda Flow</span>
          </Link>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Dados demo já preenchidos para teste.</p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input id="signup-name" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Escolha seu plano</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {mockPlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all ${signupForm.planId === plan.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                        onClick={() => setSignupForm({ ...signupForm, planId: plan.id })}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-heading font-bold text-sm text-foreground">{plan.name}</span>
                            {plan.popular && <Badge className="text-[9px] gradient-primary text-primary-foreground border-0 px-1">Top</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{plan.price === 0 ? "Grátis" : `R$${plan.price}/mês`}</p>
                          {signupForm.planId === plan.id && <Check className="w-4 h-4 text-primary mt-1" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
