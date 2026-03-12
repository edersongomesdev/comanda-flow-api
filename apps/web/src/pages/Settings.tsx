import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, MapPin, CreditCard, Image, Globe, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/state/tenant-context";
import type { Tenant } from "@/types";

export default function Settings() {
  const { tenant, loading, error } = useTenant();
  const { toast } = useToast();
  const [formTenant, setFormTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (tenant) {
      setFormTenant(tenant);
    }
  }, [tenant]);

  const publicUrl = formTenant ? `https://app.comandaflow.com/m/${formTenant.slug}/menu` : "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div>
      <TopBar title="Configurações" subtitle="Personalize seu estabelecimento" />
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        {loading && (
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!loading && formTenant && (
        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="profile"><Building2 className="w-3.5 h-3.5 mr-1" /> Perfil</TabsTrigger>
            <TabsTrigger value="hours"><Clock className="w-3.5 h-3.5 mr-1" /> Horários</TabsTrigger>
            <TabsTrigger value="delivery"><MapPin className="w-3.5 h-3.5 mr-1" /> Delivery</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="w-3.5 h-3.5 mr-1" /> Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Perfil do Negócio</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome</Label><Input value={formTenant.name} onChange={(e) => setFormTenant({ ...formTenant, name: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={formTenant.phone} onChange={(e) => setFormTenant({ ...formTenant, phone: e.target.value })} /></div>
                </div>
                <div><Label>Endereço</Label><Input value={formTenant.address} onChange={(e) => setFormTenant({ ...formTenant, address: e.target.value })} /></div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <Button variant="outline" size="sm"><Image className="w-3.5 h-3.5 mr-1" /> Upload</Button>
                  </div>
                </div>
                <Button variant="hero" size="sm">Salvar Alterações</Button>
              </CardContent>
            </Card>

            {/* Slug / Domain */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Domínio / Slug</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Slug</Label>
                  <Input value={formTenant.slug} onChange={(e) => setFormTenant({ ...formTenant, slug: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex-1 font-mono truncate">{publicUrl}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy(publicUrl)}><Copy className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Horários de Funcionamento</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {formTenant.operatingHours.map((h, i) => (
                  <div key={h.day} className="flex items-center gap-3">
                    <Switch checked={h.active} onCheckedChange={(checked) => {
                      const hours = [...formTenant.operatingHours];
                      hours[i] = { ...h, active: checked };
                      setFormTenant({ ...formTenant, operatingHours: hours });
                    }} />
                    <span className="text-sm font-medium text-foreground w-20">{h.day}</span>
                    <Input value={h.open} className="w-20 h-8 text-xs" disabled={!h.active} />
                    <span className="text-xs text-muted-foreground">às</span>
                    <Input value={h.close} className="w-20 h-8 text-xs" disabled={!h.active} />
                  </div>
                ))}
                <Button variant="hero" size="sm" className="mt-2">Salvar Horários</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Bairros Atendidos</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formTenant.deliveryNeighborhoods.map((n) => (
                    <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Novo bairro" className="h-8 text-sm" />
                  <Button variant="outline" size="sm">Adicionar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Formas de Pagamento</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Pix", "Cartão Crédito", "Cartão Débito", "Dinheiro", "Vale Refeição"].map((method) => (
                    <div key={method} className="flex items-center gap-3">
                      <Switch defaultChecked={formTenant.paymentMethods.includes(method)} />
                      <span className="text-sm text-foreground">{method}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <Button variant="hero" size="sm">Salvar Pagamentos</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
