import { type ElementType, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, User, MessageSquare, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/state/tenant-context";

interface Template {
  id: string;
  label: string;
  text: string;
  icon: ElementType;
}

export default function WhatsAppKit() {
  const { tenant, loading } = useTenant();
  const [configured, setConfigured] = useState<Set<string>>(new Set(["t1"]));
  const { toast } = useToast();

  const restaurantName = tenant?.name ?? "Seu Restaurante";
  const restaurantAddress = tenant?.address ?? "Seu endereço";
  const restaurantPhone = tenant?.phone ?? tenant?.whatsapp ?? "Seu telefone";
  const publicMenuUrl = tenant ? `https://app.comandaflow.com/m/${tenant.slug}/menu` : "https://app.comandaflow.com/m/seu-slug/menu";
  const deliveryAreas = tenant?.deliveryNeighborhoods.join(", ") || "Centro, Jardins, Vila Madalena, Pinheiros e Moema";
  const businessHours = "Seg-Sex 11h-23h | Sáb 11h-00h | Dom 12h-22h";

  const templates: Template[] = [
    {
      id: "t1",
      label: "Bio / Perfil",
      text: `*${restaurantName}* 🍔\n📍 ${restaurantAddress}\n📱 ${restaurantPhone}\n🕐 ${businessHours}\n\n📋 Cardápio: ${publicMenuUrl}`,
      icon: User,
    },
    {
      id: "t2",
      label: "Boas-vindas",
      text: `Olá! 👋 Bem-vindo(a) ao *${restaurantName}*!\n\nAcesse nosso cardápio digital:\n📋 ${publicMenuUrl}\n\nQualquer dúvida, estamos por aqui! 😊`,
      icon: MessageSquare,
    },
    {
      id: "t3",
      label: "Confirmação de Pedido",
      text: `✅ Pedido recebido!\n\nObrigado por pedir no *${restaurantName}*.\nSeu pedido está sendo preparado e logo sai! 🔥\n\nTempo estimado: ~30 minutos.`,
      icon: Check,
    },
  ];

  const quickReplies = [
    { id: "q1", text: `Olá! Tudo bem? Nosso cardápio está aqui: ${publicMenuUrl}` },
    { id: "q2", text: "Aceitamos Pix, cartão e dinheiro! 💳" },
    { id: "q3", text: "Nosso horário de funcionamento é de segunda a domingo." },
    { id: "q4", text: `Delivery disponível para: ${deliveryAreas}.` },
  ];

  const progress = Math.round((configured.size / (templates.length + quickReplies.length)) * 100);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  const toggleConfigured = (id: string) => {
    setConfigured((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      <TopBar title="Kit WhatsApp" subtitle="Configure seu atendimento pelo WhatsApp" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Progress */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso do Kit</span>
              <span className="text-sm font-heading font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile"><User className="w-3.5 h-3.5 mr-1" /> Perfil</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="w-3.5 h-3.5 mr-1" /> Mensagens</TabsTrigger>
            <TabsTrigger value="quick"><Zap className="w-3.5 h-3.5 mr-1" /> Respostas Rápidas</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {loading ? (
              <TemplateCardSkeleton />
            ) : (
              templates.filter((template) => template.id === "t1").map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  configured={configured.has(template.id)}
                  onCopy={() => handleCopy(template.text)}
                  onToggle={() => toggleConfigured(template.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-4">
            {loading ? (
              <>
                <TemplateCardSkeleton />
                <TemplateCardSkeleton />
              </>
            ) : (
              templates.filter((template) => template.id !== "t1").map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  configured={configured.has(template.id)}
                  onCopy={() => handleCopy(template.text)}
                  onToggle={() => toggleConfigured(template.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="quick" className="space-y-4 mt-4">
            {loading ? (
              <>
                <QuickReplySkeleton />
                <QuickReplySkeleton />
              </>
            ) : (
              quickReplies.map((quickReply) => (
                <Card key={quickReply.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Textarea value={quickReply.text} readOnly rows={2} className="text-sm resize-none bg-muted/50" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCopy(quickReply.text)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <div className="flex items-center">
                          <Checkbox id={quickReply.id} checked={configured.has(quickReply.id)} onCheckedChange={() => toggleConfigured(quickReply.id)} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TemplateCard({ template, configured, onCopy, onToggle }: { template: Template; configured: boolean; onCopy: () => void; onToggle: () => void }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <template.icon className="w-4 h-4 text-primary" />
          {template.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={template.text} readOnly rows={4} className="text-sm resize-none bg-muted/50 font-mono" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id={template.id} checked={configured} onCheckedChange={onToggle} />
            <Label htmlFor={template.id} className="text-xs text-muted-foreground">Configurado</Label>
          </div>
          <Button variant="outline" size="sm" onClick={onCopy}><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCardSkeleton() {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickReplySkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}
