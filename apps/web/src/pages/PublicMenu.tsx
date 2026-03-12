import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingCart, Plus, Minus, Star, Send, Truck, Store, UtensilsCrossed } from "lucide-react";
import { getPublicMenu } from "@/services/api";
import { useCart } from "@/state/cart-context";
import type { MenuItem, Category, Modifier, Tenant } from "@/types";

function getTenantInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "CF";
}

export default function PublicMenu() {
  const { slug, mesa } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const { orderMode, setOrderMode, setTableNumber } = cart;

  useEffect(() => {
    if (!mesa) {
      setTableNumber(null);
      if (orderMode === "table") {
        setOrderMode("delivery");
      }
      return;
    }

    const parsedTableNumber = Number.parseInt(mesa, 10);

    if (!Number.isNaN(parsedTableNumber)) {
      setOrderMode("table");
      setTableNumber(parsedTableNumber);
    }
  }, [mesa, orderMode, setOrderMode, setTableNumber]);

  useEffect(() => {
    if (!slug) {
      setError("Cardápio não encontrado.");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError(null);
    setActiveCategory("all");
    setSearch("");

    getPublicMenu(slug)
      .then((response) => {
        if (!active) return;
        setTenant(response.tenant);
        setItems(response.items);
        setCategories(response.categories);
      })
      .catch((err) => {
        if (!active) return;
        setTenant(null);
        setItems([]);
        setCategories([]);
        setError(err instanceof Error ? err.message : "Não foi possível carregar o cardápio.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || i.categoryId === activeCategory;
    return matchSearch && matchCat && i.available;
  });

  const bestSellers = items.filter((i) => i.bestSeller && i.available);
  const isEmpty = !loading && !error && items.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Skeleton className="h-9 w-full" />
        </header>

        <div className="sticky top-[104px] z-20 bg-background border-b border-border">
          <div className="flex gap-2 px-4 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xs">CF</span>
              </div>
              <div>
                <h1 className="font-heading font-bold text-sm text-foreground">Cardápio Digital</h1>
                <p className="text-[10px] text-muted-foreground">Menu público</p>
              </div>
            </div>
            {mesa && <Badge variant="outline" className="text-xs">Mesa {mesa}</Badge>}
          </div>
        </header>

        <div className="p-4">
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
            <p className="text-sm text-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">{getTenantInitials(tenant?.name ?? "")}</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm text-foreground">{tenant?.name}</h1>
              <p className="text-[10px] text-muted-foreground">Cardápio Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mesa && <Badge variant="outline" className="text-xs">Mesa {mesa}</Badge>}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {cart.itemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card w-full sm:max-w-lg">
                <CartSheet tenantWhatsapp={tenant?.whatsapp ?? ""} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar no cardápio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </header>

      {/* Category tabs */}
      <div className="sticky top-[104px] z-20 bg-background border-b border-border">
        <ScrollArea className="w-full">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="h-auto px-4 py-2 bg-transparent justify-start w-max">
              <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
              {categories.map((c) => <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.name}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </ScrollArea>
      </div>

      <div className="p-4 space-y-6">
        {/* Best Sellers */}
        {bestSellers.length > 0 && activeCategory === "all" && (
          <div>
            <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Mais Pedidos
            </h2>
            <div className="space-y-3">
              {bestSellers.map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={() => { setSelectedItem(item); setDetailOpen(true); }} />
              ))}
            </div>
          </div>
        )}

        {/* All items */}
        {isEmpty ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum item disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <MenuItemCard key={item.id} item={item} onClick={() => { setSelectedItem(item); setDetailOpen(true); }} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum item encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {selectedItem && <ItemDetail item={selectedItem} onClose={() => setDetailOpen(false)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuItemCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex gap-3 p-3 bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all text-left">
      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <UtensilsCrossed className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-bold text-sm text-foreground">{item.name}</h3>
          {item.bestSeller && <Badge className="text-[9px] gradient-primary text-primary-foreground border-0 shrink-0">Top</Badge>}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
        <p className="text-primary font-bold text-sm mt-1">R$ {item.price.toFixed(2)}</p>
      </div>
    </button>
  );
}

function ItemDetail({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);

  const modTotal = selectedModifiers.reduce((s, m) => s + m.price, 0);
  const total = (item.price + modTotal) * qty;

  const handleAdd = () => {
    cart.addItem(item, qty, selectedModifiers, notes);
    onClose();
  };

  return (
    <div className="space-y-4 pb-4">
      <SheetHeader>
        <SheetTitle className="font-heading text-left">{item.name}</SheetTitle>
      </SheetHeader>
      <p className="text-sm text-muted-foreground">{item.description}</p>
      <p className="text-lg font-heading font-bold text-primary">R$ {item.price.toFixed(2)}</p>

      {item.modifierGroups.map((group) => (
        <div key={group.id}>
          <Separator className="my-3" />
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-heading font-bold text-sm text-foreground">{group.name}</h4>
            {group.required && <Badge variant="outline" className="text-[10px]">Obrigatório</Badge>}
          </div>
          {group.max === 1 ? (
            <RadioGroup onValueChange={(val) => {
              const mod = group.modifiers.find((m) => m.id === val);
              if (mod) {
                setSelectedModifiers((prev) => [...prev.filter((m) => !group.modifiers.some((gm) => gm.id === m.id)), mod]);
              }
            }}>
              {group.modifiers.map((mod) => (
                <div key={mod.id} className="flex items-center gap-2 py-1">
                  <RadioGroupItem value={mod.id} id={mod.id} />
                  <Label htmlFor={mod.id} className="text-sm flex-1">{mod.name}</Label>
                  {mod.price > 0 && <span className="text-xs text-primary">+R$ {mod.price.toFixed(2)}</span>}
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-1">
              {group.modifiers.map((mod) => (
                <div key={mod.id} className="flex items-center gap-2 py-1">
                  <Checkbox id={mod.id} onCheckedChange={(checked) => {
                    setSelectedModifiers((prev) => checked ? [...prev, mod] : prev.filter((m) => m.id !== mod.id));
                  }} />
                  <Label htmlFor={mod.id} className="text-sm flex-1">{mod.name}</Label>
                  {mod.price > 0 && <span className="text-xs text-primary">+R$ {mod.price.toFixed(2)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Separator />
      <div>
        <Label className="text-sm">Observações</Label>
        <Textarea placeholder="Ex: Sem cebola, bem passado..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="w-4 h-4" /></Button>
          <span className="font-heading font-bold text-foreground w-6 text-center">{qty}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(qty + 1)}><Plus className="w-4 h-4" /></Button>
        </div>
        <Button variant="hero" onClick={handleAdd} className="px-6">
          Adicionar · R$ {total.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}

function CartSheet({ tenantWhatsapp }: { tenantWhatsapp: string }) {
  const cart = useCart();
  const whatsappNumber = tenantWhatsapp.replace(/\D/g, "");

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      return;
    }

    const items = cart.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join("\n");
    const msg = `Olá! Gostaria de pedir:\n\n${items}\n\nTotal: R$ ${cart.total.toFixed(2)}\n\nModo: ${cart.orderMode === "table" ? `Mesa ${cart.tableNumber}` : cart.orderMode === "delivery" ? `Delivery - ${cart.neighborhood}` : "Retirada"}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="h-full flex flex-col">
      <SheetHeader>
        <SheetTitle className="font-heading">Seu Pedido</SheetTitle>
      </SheetHeader>

      {cart.items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-3 pr-2">
              {cart.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.menuItem.name}</p>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-muted-foreground">{item.modifiers.map((m) => m.name).join(", ")}</p>
                    )}
                    {item.notes && <p className="text-xs text-muted-foreground italic">"{item.notes}"</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cart.updateQuantity(i, Math.max(1, item.quantity - 1))}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cart.updateQuantity(i, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">R$ {((item.menuItem.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}</p>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs h-6 px-2 mt-1" onClick={() => cart.removeItem(i)}>Remover</Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border pt-4 mt-4 space-y-4">
            {/* Order mode */}
            <div className="flex gap-2">
              {[
                { mode: "delivery" as const, icon: Truck, label: "Delivery" },
                { mode: "pickup" as const, icon: Store, label: "Retirada" },
                { mode: "table" as const, icon: UtensilsCrossed, label: "Mesa" },
              ].map((m) => (
                <Button
                  key={m.mode}
                  variant={cart.orderMode === m.mode ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => cart.setOrderMode(m.mode)}
                  disabled={m.mode === "table" && !cart.tableNumber}
                >
                  <m.icon className="w-3.5 h-3.5 mr-1" />{m.label}
                </Button>
              ))}
            </div>

            {cart.orderMode === "delivery" && (
              <Input placeholder="Seu bairro" value={cart.neighborhood} onChange={(e) => cart.setNeighborhood(e.target.value)} className="h-9 text-sm" />
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-heading font-bold text-foreground">R$ {cart.total.toFixed(2)}</span>
            </div>

            <Button variant="hero" className="w-full" onClick={handleWhatsApp} disabled={!whatsappNumber}>
              <Send className="w-4 h-4 mr-2" /> Enviar no WhatsApp
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
