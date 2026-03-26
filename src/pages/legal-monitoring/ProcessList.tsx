import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Plus, Search, Pause, Play, Archive, Trash2, RefreshCw, Eye } from "lucide-react";

export default function ProcessList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [prioridadeFilter, setPrioridadeFilter] = useState("");

  const params: Record<string, string> = { page: String(page), per_page: "20" };
  if (search) params.numero_processo = search;
  if (statusFilter) params.status_monitoramento = statusFilter;
  if (prioridadeFilter) params.prioridade = prioridadeFilter;

  const { data, isLoading, refetch } = useApiQuery<any>(
    ["legal-monitoring-processes", String(page), search, statusFilter, prioridadeFilter],
    `/api/legal-monitoring/processes?${new URLSearchParams(params).toString()}`
  );

  const processes = data?.data || [];
  const meta = data?.meta;

  const handleAction = async (action: string, id: string) => {
    try {
      if (action === "pause") await api.legalMonitoring.pauseProcess(id);
      else if (action === "resume") await api.legalMonitoring.resumeProcess(id);
      else if (action === "archive") await api.legalMonitoring.archiveProcess(id);
      else if (action === "delete") {
        if (!confirm("Remover este processo?")) return;
        await api.legalMonitoring.deleteProcess(id);
      } else if (action === "reprocess") await api.legalMonitoring.reprocessProcess(id);
      toast.success("Ação executada com sucesso");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const priorityColors: Record<string, string> = {
    baixa: "secondary",
    media: "default",
    alta: "warning",
    urgente: "destructive",
  };

  const statusLabels: Record<string, string> = {
    ativo: "Ativo",
    pausado: "Pausado",
    arquivado: "Arquivado",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Processos Monitorados</h1>
          <div className="flex gap-2">
            <Link to="/legal-monitoring/import">
              <Button variant="outline" size="sm">Importar Lote</Button>
            </Link>
            <Link to="/legal-monitoring/new">
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Processo</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por número CNJ..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridadeFilter} onValueChange={(v) => { setPrioridadeFilter(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Tribunal</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Verificação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : processes.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum processo encontrado</TableCell></TableRow>
                ) : (
                  processes.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.numero_processo}</TableCell>
                      <TableCell><Badge variant="outline">{p.tribunal?.toUpperCase()}</Badge></TableCell>
                      <TableCell>{p.cliente_nome || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={priorityColors[p.prioridade] as any || "default"}>{p.prioridade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status_monitoramento === "ativo" ? "default" : "secondary"}>
                          {statusLabels[p.status_monitoramento] || p.status_monitoramento}
                        </Badge>
                        {p.possui_alerta_pendente && <Badge className="ml-1 bg-warning text-warning-foreground">!</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.ultima_verificacao_em ? new Date(p.ultima_verificacao_em).toLocaleString("pt-BR") : "Nunca"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link to={`/legal-monitoring/processes/${p.id}`}>
                            <Button variant="ghost" size="icon" title="Detalhes"><Eye className="w-4 h-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="Reprocessar" onClick={() => handleAction("reprocess", p.id)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          {p.status_monitoramento === "ativo" ? (
                            <Button variant="ghost" size="icon" title="Pausar" onClick={() => handleAction("pause", p.id)}>
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : p.status_monitoramento === "pausado" ? (
                            <Button variant="ghost" size="icon" title="Reativar" onClick={() => handleAction("resume", p.id)}>
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" title="Arquivar" onClick={() => handleAction("archive", p.id)}>
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Remover" onClick={() => handleAction("delete", p.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Página {meta.page} de {meta.total_pages} ({meta.total} processos)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                  <Button variant="outline" size="sm" disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)}>Próxima</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
