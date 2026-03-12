import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, QrCode, MessageCircle, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { getDashboardSummary } from "@/services/api";
import type { DashboardSummary } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTenant } from "@/state/tenant-context";

const COLORS = ["hsl(24,85%,52%)", "hsl(230,55%,55%)", "hsl(30,75%,55%)", "hsl(142,60%,40%)"];
const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  menuViews: 0,
  menuViewsChange: 0,
  qrScans: 0,
  qrScansChange: 0,
  whatsappClicks: 0,
  whatsappClicksChange: 0,
  topItemClicks: 0,
  topItemClicksChange: 0,
  topItems: [],
  viewsByCategory: [],
  viewsByDay: [
    { day: "Seg", views: 0, clicks: 0 },
    { day: "Ter", views: 0, clicks: 0 },
    { day: "Qua", views: 0, clicks: 0 },
    { day: "Qui", views: 0, clicks: 0 },
    { day: "Sex", views: 0, clicks: 0 },
    { day: "Sáb", views: 0, clicks: 0 },
    { day: "Dom", views: 0, clicks: 0 },
  ],
};

export default function Dashboard() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const nextSummary = await getDashboardSummary();

        if (active) {
          setData(nextSummary);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard agora.");
          setData(EMPTY_DASHBOARD_SUMMARY);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const metrics = data ? [
    { label: "Visualizações do Cardápio", value: data.menuViews, change: data.menuViewsChange, icon: Eye },
    { label: "QR Codes Escaneados", value: data.qrScans, change: data.qrScansChange, icon: QrCode },
    { label: "Cliques no WhatsApp", value: data.whatsappClicks, change: data.whatsappClicksChange, icon: MessageCircle },
    { label: "Cliques em Top Itens", value: data.topItemClicks, change: data.topItemClicksChange, icon: TrendingUp },
  ] : [];

  return (
    <div>
      <TopBar title="Dashboard" subtitle="Visão geral do seu restaurante" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Info banner */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg px-4 py-3">
          <p className="text-sm text-muted-foreground">
            📊 Os dados abaixo representam <strong className="text-foreground">intenção de compra</strong>, não vendas finalizadas.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dashboard indisponivel</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          )) : metrics.map((m) => (
            <Card key={m.label} className="shadow-card hover:shadow-card-hover transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <m.icon className="w-5 h-5 text-primary" />
                  <Badge variant={m.change >= 0 ? "default" : "destructive"} className={`text-[10px] px-1.5 ${m.change >= 0 ? "bg-success/10 text-success border-0" : "bg-destructive/10 text-destructive border-0"}`}>
                    {m.change >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                    {Math.abs(m.change)}%
                  </Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">{m.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-heading">Visualizações por Dia</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data!.viewsByDay}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <ReTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="views" fill="hsl(24,85%,52%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicks" fill="hsl(230,55%,55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-heading">Por Categoria</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data!.viewsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {data!.viewsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {data!.viewsByCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{c.name}</span>
                        <span className="font-medium text-foreground ml-auto">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top items + Onboarding */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-heading">Top Itens Clicados</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-3">
                  {data!.topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full gradient-primary rounded-full" style={{ width: `${(item.clicks / data!.topItems[0].clicks) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.clicks}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-heading">Progresso de Onboarding</CardTitle></CardHeader>
            <CardContent>
              {tenantLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <Progress value={tenant?.onboardingProgress ?? 0} className="h-2 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">{tenant?.onboardingProgress ?? 0}% concluído</p>
                  <div className="flex flex-wrap gap-2">
                    {(tenant?.onboardingSteps ?? []).map((step) => (
                      <Badge key={step.id} variant={step.completed ? "default" : "outline"} className={step.completed ? "bg-success/10 text-success border-0" : ""}>
                        {step.completed ? "✓" : "○"} {step.label}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
