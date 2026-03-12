import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Star, Pencil, Trash2, ImageIcon } from "lucide-react";
import { getMenuItems, getCategories } from "@/services/api";
import type { MenuItem, Category } from "@/types";

export default function MenuAdmin() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMenuItems(), getCategories()]).then(([mi, cat]) => {
      setItems(mi);
      setCategories(cat);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "all" || i.categoryId === activeCategory;
    return matchesSearch && matchesCat;
  });

  const bestSellers = items.filter((i) => i.bestSeller);

  return (
    <div>
      <TopBar title="Cardápio" subtitle="Gerencie seus itens e categorias" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar item..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader><DialogTitle className="font-heading">Novo Item</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setDialogOpen(false); }}>
                <div><Label>Nome</Label><Input placeholder="Ex: X-Burguer Especial" /></div>
                <div><Label>Descrição</Label><Textarea placeholder="Descrição do item..." rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Preço (R$)</Label><Input type="number" placeholder="0.00" step="0.01" /></div>
                  <div>
                    <Label>Categoria</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border z-50">
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Imagem</Label>
                  <Button type="button" variant="outline" size="sm"><ImageIcon className="w-4 h-4 mr-1" /> Upload</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="best-seller" />
                  <Label htmlFor="best-seller">Marcar como Best Seller</Label>
                </div>
                <Button type="submit" variant="hero" className="w-full">Salvar Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((c) => <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {/* Best Sellers */}
        {bestSellers.length > 0 && activeCategory === "all" && (
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Mais Vendidos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bestSellers.map((item) => (
                <Card key={item.id} className="shadow-card hover:shadow-card-hover transition-all group">
                  <CardContent className="p-4">
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-3">
                      <Utensils className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-foreground truncate">{item.name}</h4>
                    <p className="text-primary font-bold text-sm mt-1">R$ {item.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-2">Nenhum item encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro item ao cardápio.</p>
            <Button variant="hero" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Adicionar Item</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className="shadow-card hover:shadow-card-hover transition-all group relative">
                <CardContent className="p-4">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border z-50">
                        <DropdownMenuItem><Pencil className="w-3.5 h-3.5 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem><Star className="w-3.5 h-3.5 mr-2" /> {item.bestSeller ? "Remover Top" : "Marcar Top"}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-3">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  {item.bestSeller && <Badge className="mb-2 text-[10px] gradient-primary text-primary-foreground border-0">Top</Badge>}
                  <h4 className="font-heading font-bold text-sm text-foreground truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                  <p className="text-primary font-bold text-sm mt-2">R$ {item.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Utensils(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
