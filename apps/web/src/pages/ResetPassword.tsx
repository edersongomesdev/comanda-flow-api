import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getSupabaseSession,
  signOutSupabaseSession,
  subscribeToSupabaseAuth,
  updateSupabasePassword,
} from "@/services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getSupabaseSession().then((session) => {
      if (isMounted) {
        setRecoveryReady(Boolean(session?.access_token));
      }
    });

    const unsubscribe = subscribeToSupabaseAuth((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || Boolean(session?.access_token)) {
        setRecoveryReady(true);
        return;
      }

      if (event === "SIGNED_OUT") {
        setRecoveryReady(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const helperText = useMemo(() => {
    if (recoveryReady === null) {
      return "Validando o link de recuperacao...";
    }

    if (recoveryReady) {
      return "Defina sua nova senha e finalize a recuperacao.";
    }

    return "O link de recuperacao esta expirado ou invalido. Solicite um novo email.";
  }, [recoveryReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!recoveryReady) {
      toast({
        title: "Link invalido",
        description: "Solicite um novo email de recuperacao antes de redefinir a senha.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Use pelo menos 6 caracteres para a nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "A confirmacao precisa ser igual a nova senha.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSupabasePassword(password);
      await signOutSupabaseSession();
      toast({
        title: "Senha atualizada",
        description: "Agora voce ja pode entrar com a nova senha.",
      });
      navigate("/auth", { replace: true });
    } catch (error) {
      toast({
        title: "Nao foi possivel redefinir a senha",
        description: error instanceof Error ? error.message : "Falha inesperada ao atualizar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-border/60 shadow-2xl shadow-black/5">
            <CardHeader className="space-y-4">
              <Link to="/auth/forgot-password" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar para recuperacao
              </Link>
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound className="h-5 w-5" />
                </div>
                <CardTitle className="font-heading text-3xl">Nova senha</CardTitle>
                <p className="text-sm text-muted-foreground">{helperText}</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">Nova senha</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={!recoveryReady || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password-confirm">Confirmar senha</Label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={!recoveryReady || isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!recoveryReady || isSubmitting}>
                  {isSubmitting ? "Atualizando..." : "Salvar nova senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
