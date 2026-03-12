import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, QrCode, Copy, ExternalLink, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { createTable, deleteTable, getTables } from "@/services/api";
import { HttpError } from "@/services/http";
import type { Table } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/state/tenant-context";

function sortTablesByNumber(nextTables: Table[]) {
  return [...nextTables].sort((left, right) => left.number - right.number);
}

function getNextTableNumber(tables: Table[]) {
  const usedNumbers = new Set(tables.map((table) => table.number));
  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return nextNumber;
}

function readHttpErrorDetails(error: HttpError) {
  if (typeof error.data === "string") {
    return error.data;
  }

  try {
    return JSON.stringify(error.data ?? {});
  } catch {
    return "";
  }
}

function isMaxTablesError(error: unknown) {
  if (!(error instanceof HttpError)) {
    return false;
  }

  const details = `${error.message} ${readHttpErrorDetails(error)}`.toLowerCase();

  return (
    details.includes("maxtables") ||
    details.includes("max tables") ||
    details.includes("table limit") ||
    details.includes("limite de mesas") ||
    (details.includes("limite") && details.includes("mesa")) ||
    (details.includes("limit") && details.includes("table"))
  );
}

function getTablesErrorMessage(action: "create" | "delete" | "load", error: unknown) {
  if (action === "create" && isMaxTablesError(error)) {
    return "Voce atingiu o limite de mesas do seu plano. Exclua uma mesa ou faça upgrade para continuar.";
  }

  if (error instanceof HttpError && error.message.trim()) {
    return error.message;
  }

  if (action === "delete") {
    return "Nao foi possivel excluir a mesa agora.";
  }

  if (action === "load") {
    return "Nao foi possivel carregar as mesas agora.";
  }

  return "Nao foi possivel criar a mesa agora.";
}

export default function Tables() {
  const { tenant, loading: tenantLoading } = useTenant();
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  async function refreshTables() {
    const nextTables = await getTables();
    setTables(sortTablesByNumber(nextTables));
  }

  useEffect(() => {
    let active = true;

    async function loadTables() {
      try {
        const nextTables = await getTables();

        if (active) {
          setTables(sortTablesByNumber(nextTables));
        }
      } catch (error) {
        if (active) {
          setFeedbackMessage(getTablesErrorMessage("load", error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTables();

    return () => {
      active = false;
    };
  }, []);

  const stats = {
    total: tables.length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    totalClicks: tables.reduce((s, t) => s + t.clicks, 0),
  };

  const planAllowsTables = tenant?.plan === "MESA" || tenant?.plan === "PREMIUM";
  const mutationInFlight = creating || deletingTableId !== null;

  async function handleCreateTable() {
    if (!planAllowsTables || mutationInFlight) {
      return;
    }

    setFeedbackMessage(null);
    setCreating(true);

    try {
      await createTable(getNextTableNumber(tables));
      await refreshTables();
    } catch (error) {
      const message = getTablesErrorMessage("create", error);
      setFeedbackMessage(message);
      toast({
        title: isMaxTablesError(error) ? "Limite do plano atingido" : "Nao foi possivel criar a mesa",
        description: message,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTable() {
    if (!tableToDelete || mutationInFlight) {
      return;
    }

    setFeedbackMessage(null);
    setDeletingTableId(tableToDelete.id);

    try {
      await deleteTable(tableToDelete.id);
      await refreshTables();
      setTableToDelete(null);
    } catch (error) {
      const message = getTablesErrorMessage("delete", error);
      setFeedbackMessage(message);
      toast({
        title: "Nao foi possivel excluir a mesa",
        description: message,
      });
    } finally {
      setDeletingTableId(null);
    }
  }

  return (
    <div>
      <TopBar title="Mesas e QR Codes" subtitle="Gerencie as mesas do seu estabelecimento" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-card"><CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card className="shadow-card"><CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-primary">{stats.occupied}</p>
            <p className="text-xs text-muted-foreground">Ocupadas</p>
          </CardContent></Card>
          <Card className="shadow-card"><CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{stats.totalClicks}</p>
            <p className="text-xs text-muted-foreground">Scans Total</p>
          </CardContent></Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "list")}>
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs px-2"><LayoutGrid className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2"><List className="w-3.5 h-3.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
          {tenantLoading ? (
            <Skeleton className="h-9 w-28" />
          ) : planAllowsTables ? (
            <Button variant="hero" size="sm" onClick={handleCreateTable} disabled={mutationInFlight}>
              <Plus className="w-4 h-4 mr-1" />
              {creating ? "Criando..." : "Nova Mesa"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="opacity-50">
              <Plus className="w-4 h-4 mr-1" /> Nova Mesa
              <Badge variant="outline" className="ml-2 text-[9px]">Plano Mesa</Badge>
            </Button>
          )}
        </div>

        {feedbackMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acao nao concluida</AlertTitle>
            <AlertDescription>{feedbackMessage}</AlertDescription>
          </Alert>
        )}

        {/* Tables grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" : "space-y-3"}>
            {tables.map((table) => (
              <Card key={table.id} className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className={view === "grid" ? "p-4 text-center" : "p-4 flex items-center gap-4"}>
                  {view === "grid" && (
                    <>
                      <img src={table.qrCode} alt={`QR Mesa ${table.number}`} className="w-24 h-24 mx-auto mb-3 rounded-lg" loading="lazy" />
                      <h3 className="font-heading font-bold text-foreground">Mesa {table.number}</h3>
                      <Badge variant={table.status === "occupied" ? "default" : "outline"} className={`mt-1 text-[10px] ${table.status === "occupied" ? "bg-primary/10 text-primary border-0" : ""}`}>
                        {table.status === "occupied" ? "Ocupada" : "Livre"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">{table.clicks} scans</p>
                      <div className="flex gap-1 mt-3 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setTableToDelete(table)}
                          disabled={mutationInFlight}
                          aria-label={`Excluir mesa ${table.number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                  {view === "list" && (
                    <>
                      <QrCode className="w-8 h-8 text-primary shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-heading font-bold text-sm text-foreground">Mesa {table.number}</h3>
                        <p className="text-xs text-muted-foreground">{table.clicks} scans</p>
                      </div>
                      <Badge variant={table.status === "occupied" ? "default" : "outline"} className={`text-[10px] ${table.status === "occupied" ? "bg-primary/10 text-primary border-0" : ""}`}>
                        {table.status === "occupied" ? "Ocupada" : "Livre"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setTableToDelete(table)}
                          disabled={mutationInFlight}
                          aria-label={`Excluir mesa ${table.number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Counter QR */}
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="p-6 text-center">
            <QrCode className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-heading font-bold text-foreground mb-1">QR Code do Balcão</h3>
            <p className="text-xs text-muted-foreground mb-3">Para clientes que pedem no balcão, sem mesa.</p>
            <Button variant="outline" size="sm"><Copy className="w-3.5 h-3.5 mr-1" /> Copiar Link do Balcão</Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={Boolean(tableToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingTableId) {
            setTableToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mesa</AlertDialogTitle>
            <AlertDialogDescription>
              {tableToDelete ? `A mesa ${tableToDelete.number} sera removida permanentemente.` : "Confirme a exclusao da mesa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTableId !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteTable();
              }}
              disabled={deletingTableId !== null}
            >
              {deletingTableId !== null ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
