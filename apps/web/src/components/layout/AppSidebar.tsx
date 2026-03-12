import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, QrCode, MessageCircle, Settings, ChevronLeft, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/state/tenant-context";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", minPlan: "START" as const },
  { label: "Cardápio", icon: UtensilsCrossed, path: "/cardapio", minPlan: "START" as const },
  { label: "Mesas", icon: QrCode, path: "/mesas", minPlan: "MESA" as const },
  { label: "WhatsApp", icon: MessageCircle, path: "/whatsapp", minPlan: "ESSENCIAL" as const },
  { label: "Pipeline", icon: Crown, path: "/pipeline", minPlan: "PREMIUM" as const },
  { label: "Planos", icon: Crown, path: "/planos", minPlan: "START" as const },
  { label: "Config", icon: Settings, path: "/configuracoes", minPlan: "START" as const },
];

const planOrder = { START: 0, ESSENCIAL: 1, MESA: 2, PREMIUM: 3 };

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { tenant, loading } = useTenant();
  const currentPlan = tenant?.plan ?? "START";

  if (loading) {
    return (
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 h-screen sticky top-0 z-30",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <Skeleton className="h-8 w-8 rounded-lg" />
          {!collapsed && <Skeleton className="h-4 w-28" />}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-2 overflow-y-auto">
          {Array.from({ length: navItems.length }).map((_, index) => (
            <div key={index} className={cn("flex items-center gap-3 px-3 py-2.5", collapsed && "justify-center px-2")}>
              <Skeleton className="h-5 w-5 rounded-full" />
              {!collapsed && <Skeleton className="h-4 flex-1" />}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex items-center justify-center h-12 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 h-screen sticky top-0 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">CF</span>
            </div>
            <span className="font-heading font-bold text-foreground">Comanda Flow</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-heading font-bold text-sm">CF</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const locked = planOrder[item.minPlan] > planOrder[currentPlan];

          const content = (
            <Link
              to={locked ? "/planos" : item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                locked && "opacity-50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {locked && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {item.minPlan}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="right">
                {item.label} {locked && "(Upgrade)"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.path}>{content}</div>
          );
        })}
      </nav>

      {/* Trial banner */}
      {!collapsed && (tenant?.trialDaysLeft ?? 0) > 0 && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs font-medium text-foreground">Trial: {tenant?.trialDaysLeft} dias restantes</p>
          <Link to="/planos">
            <Button size="sm" className="w-full mt-2 text-xs h-8">Escolher Plano</Button>
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
