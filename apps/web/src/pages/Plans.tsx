import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, HelpCircle } from "lucide-react";
import { getPlans } from "@/services/api";
import type { Plan } from "@/types";
import TopBar from "@/components/layout/TopBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTenant } from "@/state/tenant-context";

const faqs = [
  { q: "Posso mudar de plano a qualquer momento?", a: "Sim! Você pode fazer upgrade ou downgrade quando quiser." },
  { q: "O que acontece quando o trial acaba?", a: "Você volta para o plano Start (gratuito) e mantém seus dados." },
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O plano Start é 100% gratuito, sem cartão." },
  { q: "Como funciona o suporte?", a: "Planos pagos têm suporte prioritário via WhatsApp e email." },
];

export default function Plans() {
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getPlans()
      .then((response) => {
        if (!active) return;
        setPlans(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Não foi possível carregar os planos.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const isLoading = loading || tenantLoading;
  const currentPlanName = plans.find((plan) => plan.id === tenant?.plan)?.name ?? "...";

  return (
    <div>
      <TopBar title="Planos e Billing" subtitle="Escolha o melhor plano para seu negócio" />
      <div className="p-4 md:p-6 space-y-8">
        {isLoading && (
          <>
            <Card className="shadow-card border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-6 w-36" />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="shadow-card">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isLoading && (tenantError || error) && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{tenantError?.message ?? error}</p>
            </CardContent>
          </Card>
        )}

        {/* Current plan status */}
        {!isLoading && tenant && !tenantError && !error && (
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="font-heading font-bold text-foreground">{currentPlanName}</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">
                Trial: {tenant.trialDaysLeft} dias restantes
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Plans grid */}
        {!isLoading && !tenantError && !error && <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === tenant?.plan;
            return (
              <Card
                key={plan.id}
                className={`shadow-card hover:shadow-card-hover transition-all relative ${plan.popular ? "border-primary" : "border-border"} ${isCurrent ? "ring-2 ring-primary/20" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground border-0">Mais Popular</Badge>
                )}
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-heading font-extrabold text-foreground">
                      {plan.price === 0 ? "Grátis" : `R$${plan.price.toFixed(0)}`}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button variant={isCurrent ? "outline" : plan.popular ? "hero" : "default"} className="w-full" disabled={isCurrent}>
                    {isCurrent ? "Plano Atual" : "Assinar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>}

        {!isLoading && <Separator />}

        {/* FAQ */}
        {!isLoading && <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" /> Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>}
      </div>
    </div>
  );
}
