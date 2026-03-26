import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Trash2 } from "lucide-react";

interface Rule {
  id: string;
  type: string;
  value: string;
  active: boolean;
  client: { id: string; name: string };
}

const typeLabels: Record<string, string> = {
  processo: "Processo", oab: "OAB", nome: "Nome", cpf_cnpj: "CPF/CNPJ", keyword: "Palavra-chave"
};

export default function Rules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", type: "keyword", value: "" });

  const { data: rules = [], isLoading } = useQuery<Rule[]>({
    queryKey: ["rules"],
    queryFn: () => apiFetch("/monitor-rules"),
  });

  const { data: clientsRes } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ["clients-select"],
    queryFn: () => apiFetch("/clients?limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiFetch("/monitor-rules", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rules"] }); toast({ title: "Regra criada" }); setDialogOpen(false); setForm({ clientId: "", type: "keyword", value: "" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/monitor-rules/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rules"] }); toast({ title: "Regra removida" }); },
  });

  const clients = clientsRes?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Regras de Monitoramento</h1>
            <p className="text-muted-foreground text-sm">Critérios de busca em publicações</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nova Regra</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Regra</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.clientId} onValueChange={v => setForm({ ...form, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Valor</Label><Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required /></div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>Criar Regra</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : rules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma regra cadastrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="text-sm font-medium">{rule.client?.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[rule.type] || rule.type}</Badge></TableCell>
                      <TableCell className="text-sm font-mono">{rule.value}</TableCell>
                      <TableCell><Badge className="text-[10px]">{rule.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}><Trash2 className="w-3 h-3" /></Button>
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
