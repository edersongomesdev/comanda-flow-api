import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "@/services/supabase";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("carlos@generalburguer.com");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(email);
      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Se a conta existir no Supabase Auth, voce vai receber o link de redefinicao.",
      });
    } catch (error) {
      toast({
        title: "Nao foi possivel enviar o email",
        description: error instanceof Error ? error.message : "Falha inesperada ao solicitar a recuperacao.",
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
              <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <CardTitle className="font-heading text-3xl">Recuperar senha</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Digite seu email para receber o link de redefinicao pelo Supabase.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar link de redefinicao"}
                </Button>
              </form>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {emailSent
                  ? "Confira sua caixa de entrada e tambem a pasta de spam. O link abre a tela de redefinicao deste app."
                  : "Durante a transicao, so usuarios com identidade ja criada no Supabase vao receber o email."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
