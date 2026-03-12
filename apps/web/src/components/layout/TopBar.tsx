import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/state/tenant-context";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div>
            <Skeleton className="h-5 w-32" />
            {subtitle && <Skeleton className="mt-2 h-3 w-48" />}
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
        </div>
        <Skeleton className="h-4 w-28" />
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-heading font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {(tenant?.trialDaysLeft ?? 0) > 0 && (
          <Badge variant="outline" className="text-xs border-warning text-warning hidden sm:inline-flex">
            Trial: {tenant?.trialDaysLeft} dias
          </Badge>
        )}
      </div>
      {tenant && (
        <Link
          to={`/m/${tenant.slug}/menu`}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ver Cardápio Público</span>
        </Link>
      )}
    </header>
  );
}
