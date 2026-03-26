import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { Play, Plus, Activity, Database, CheckCircle, Trash2 } from "lucide-react";

interface Source {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: string;
  active: boolean;
  lastRunAt?: string;
  createdAt: string;
  _count?: { publications: number };
}

export default function Sources() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "HTML", url: "" });

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: () => apiFetch("/admin/sources"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiFetch("/admin/sources", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sources"] }); toast({ title: "Fonte criada" }); setDialogOpen(false); setForm({ name: "", type: "HTML", url: "" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/sources/${id}/run`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sources"] }); toast({ title: "Coleta iniciada" }); },
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string; name: string; reachable: boolean; statusCode?: number; error?: string }>(`/admin/sources/${id}/validate`, { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({
        title: data.reachable ? "Fonte acessível ✓" : "Fonte inacessível ✗",
        description: data.reachable ? `Status HTTP: ${data.statusCode}` : data.error,
        variant: data.reachable ? "default" : "destructive",
      });
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean; total: number; created: number; skipped: number }>("/admin/sources/seed", { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Fontes populadas", description: `${data.created} criadas, ${data.skipped} já existiam` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const validateAllMutation = useMutation({
    mutationFn: () => apiFetch<any>("/admin/sources/validate-all", { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Validação concluída", description: `${data.reachable}/${data.total} fontes acessíveis` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sources"] }); toast({ title: "Fonte removida" }); },
  });

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { idle: "Aguardando", running: "Coletando", completed: "Concluído", error: "Erro", active: "Ativo" };
    return map[s] || s;
  };

  const statusVariant = (s: string) => {
    if (s === "error") return "destructive" as const;
    if (s === "running") return "secondary" as const;
    return "default" as const;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fontes Monitoradas</h1>
            <p className="text-muted-foreground text-sm">Tribunais e diários oficiais</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              <Database className="w-4 h-4 mr-2" />{seedMutation.isPending ? "Populando..." : "Popular Fontes"}
            </Button>
            <Button variant="outline" onClick={() => validateAllMutation.mutate()} disabled={validateAllMutation.isPending || sources.length === 0}>
              <CheckCircle className="w-4 h-4 mr-2" />{validateAllMutation.isPending ? "Validando..." : "Validar Todas"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nova Fonte</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Fonte</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ex: TJSP" /></div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="API">API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>Criar Fonte</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : sources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma fonte cadastrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Coleta</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map(source => (
                    <TableRow key={source.id}>
                      <TableCell className="text-sm font-medium">{source.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{source.type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{source.url || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(source.status)} className="text-[10px]">{statusLabel(source.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {source.lastRunAt ? new Date(source.lastRunAt).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Executar coleta" onClick={() => runMutation.mutate(source.id)}>
                            <Play className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Validar fonte" onClick={() => validateMutation.mutate(source.id)}>
                            <Activity className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
