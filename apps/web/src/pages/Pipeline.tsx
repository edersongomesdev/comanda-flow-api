import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreVertical, Phone, MessageCircle, ArrowRight } from "lucide-react";
import { getPipelineLeads } from "@/services/api";
import type { PipelineLead } from "@/types";

const stages: { id: PipelineLead["stage"]; label: string; color: string }[] = [
  { id: "new", label: "Novos", color: "bg-secondary/10 text-secondary" },
  { id: "contacted", label: "Contatados", color: "bg-primary/10 text-primary" },
  { id: "negotiating", label: "Negociando", color: "bg-warning/10 text-warning" },
  { id: "closed", label: "Fechados", color: "bg-success/10 text-success" },
];

export default function Pipeline() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPipelineLeads().then((l) => { setLeads(l); setLoading(false); });
  }, []);

  const moveStage = (id: string, newStage: PipelineLead["stage"]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: newStage } : l)));
  };

  return (
    <div>
      <TopBar title="Pipeline de Vendas" subtitle="Gerencie seus leads e oportunidades" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{leads.length} leads no pipeline</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Atendimento</Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader><DialogTitle className="font-heading">Novo Atendimento</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div><Label>Nome</Label><Input placeholder="Nome do lead" /></div>
                <div><Label>Telefone</Label><Input placeholder="(00) 00000-0000" /></div>
                <div>
                  <Label>Origem</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Valor estimado (R$)</Label><Input type="number" placeholder="0" /></div>
                <Button type="submit" variant="hero" className="w-full">Criar Lead</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-[800px] md:min-w-0 md:grid md:grid-cols-4">
              {stages.map((stage) => {
                const stageLeads = leads.filter((l) => l.stage === stage.id);
                return (
                  <div key={stage.id} className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-heading font-bold text-sm text-foreground">{stage.label}</h3>
                      <Badge variant="outline" className="text-[10px]">{stageLeads.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {stageLeads.map((lead) => (
                        <Card key={lead.id} className="shadow-card hover:shadow-card-hover transition-all">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm text-foreground">{lead.name}</p>
                                <p className="text-xs text-muted-foreground">{lead.source}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3.5 h-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border z-50">
                                  {stages.filter((s) => s.id !== stage.id).map((s) => (
                                    <DropdownMenuItem key={s.id} onClick={() => moveStage(lead.id, s.id)}>
                                      <ArrowRight className="w-3.5 h-3.5 mr-2" /> Mover para {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm font-heading font-bold text-primary">R$ {lead.value}</p>
                            <div className="flex gap-1 mt-2">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Phone className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><MessageCircle className="w-3 h-3" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
