import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, QrCode, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Cardápio", icon: UtensilsCrossed, path: "/cardapio" },
  { label: "Mesas", icon: QrCode, path: "/mesas" },
  { label: "WhatsApp", icon: MessageCircle, path: "/whatsapp" },
  { label: "Config", icon: Settings, path: "/configuracoes" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 safe-area-bottom">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors py-1 px-3",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
