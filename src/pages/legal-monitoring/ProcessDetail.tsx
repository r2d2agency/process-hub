import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Pause, Play, Archive, Scale, Clock, AlertTriangle, Activity, FileText } from "lucide-react";

export default function ProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const [reprocessing, setReprocessing] = useState(false);

  const { data: processData, refetch } = useApiQuery<any>(["legal-process", id], `/api/legal-monitoring/processes/${id}`);
  const { data: movementsData, refetch: refetchMovements } = useApiQuery<any>(["legal-movements", id], `/api/legal-monitoring/processes/${id}/movements`);
  const { data: checksData } = useApiQuery<any>(["legal-checks", id], `/api/legal-monitoring/processes/${id}/checks`);
  const { data: eventsData } = useApiQuery<any>(["legal-events", id], `/api/legal-monitoring/processes/${id}/events`);
  const { data: alertsData } = useApiQuery<any>(["legal-alerts", id], `/api/legal-monitoring/processes/${id}/alerts`);
  const { data: logsData } = useApiQuery<any>(["legal-logs", id], `/api/legal-monitoring/processes/${id}/logs`);

  const process = processData?.data;
  const movements = movementsData?.data || [];
  const checks = checksData?.data || [];
  const events = eventsData?.data || [];
  const alerts = alertsData?.data || [];
  const logs = logsData?.data || [];

  const handleReprocess = async () => {
    if (!id) return;
    setReprocessing(true);
    try {
      const result = await api.legalMonitoring.reprocessProcess(id);
      toast.success(result.message || "Reprocessamento concluído");
      refetch();
      refetchMovements();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReprocessing(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!id) return;
    try {
      if (action === "pause") await api.legalMonitoring.pauseProcess(id);
      else if (action === "resume") await api.legalMonitoring.resumeProcess(id);
      else if (action === "archive") await api.legalMonitoring.archiveProcess(id);
      toast.success("Ação executada");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!process) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
      </DashboardLayout>
    );
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "-";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/legal-monitoring/processes">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-mono text-foreground">{process.numero_processo}</h1>
            <p className="text-sm text-muted-foreground">
              {process.tribunal?.toUpperCase()} • Fonte: {process.fonte_principal}
              {process.cliente_nome && ` • Cliente: ${process.cliente_nome}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReprocess} disabled={reprocessing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
              {reprocessing ? "Consultando..." : "Reprocessar"}
            </Button>
            {process.status_monitoramento === "ativo" ? (
              <Button variant="outline" size="sm" onClick={() => handleAction("pause")}><Pause className="w-4 h-4 mr-2" />Pausar</Button>
            ) : process.status_monitoramento === "pausado" ? (
              <Button variant="outline" size="sm" onClick={() => handleAction("resume")}><Play className="w-4 h-4 mr-2" />Reativar</Button>
            ) : null}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Badge variant={process.status_monitoramento === "ativo" ? "default" : "secondary"} className="mb-2">
                {process.status_monitoramento}
              </Badge>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Badge variant={process.prioridade === "urgente" ? "destructive" : process.prioridade === "alta" ? "warning" as any : "default"}>
                {process.prioridade}
              </Badge>
              <p className="text-xs text-muted-foreground">Prioridade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-lg font-bold text-foreground">{movements.length}</p>
              <p className="text-xs text-muted-foreground">Movimentações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm font-medium text-foreground">{fmtDate(process.ultima_verificacao_em)}</p>
              <p className="text-xs text-muted-foreground">Última Verificação</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="movements">
          <TabsList>
            <TabsTrigger value="movements"><Scale className="w-4 h-4 mr-1" />Movimentações ({movements.length})</TabsTrigger>
            <TabsTrigger value="checks"><Clock className="w-4 h-4 mr-1" />Verificações ({checks.length})</TabsTrigger>
            <TabsTrigger value="events"><Activity className="w-4 h-4 mr-1" />Eventos ({events.length})</TabsTrigger>
            <TabsTrigger value="alerts"><AlertTriangle className="w-4 h-4 mr-1" />Alertas ({alerts.length})</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="w-4 h-4 mr-1" />Logs ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="movements">
            <Card>
              <CardContent className="pt-6">
                {movements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma movimentação registrada. Clique em "Reprocessar" para consultar o DataJud.</p>
                ) : (
                  <div className="space-y-3">
                    {movements.map((m: any) => (
                      <div key={m.id} className="flex gap-4 p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {m.data_movimentacao ? new Date(m.data_movimentacao).toLocaleDateString("pt-BR") : "S/D"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{m.descricao_normalizada || m.descricao_original}</p>
                          {m.descricao_original !== m.descricao_normalizada && (
                            <p className="text-xs text-muted-foreground mt-1">{m.descricao_original}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">{m.fonte}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checks">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mudança</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checks.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{fmtDate(c.criado_em)}</TableCell>
                        <TableCell>{c.fonte}</TableCell>
                        <TableCell><Badge variant={c.status === "sucesso" ? "default" : "destructive"}>{c.status}</Badge></TableCell>
                        <TableCell>{c.houve_mudanca ? <Badge className="bg-success text-success-foreground">Sim</Badge> : "Não"}</TableCell>
                        <TableCell>{c.tempo_execucao_ms ? `${c.tempo_execucao_ms}ms` : "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.resumo_resultado || c.erro_resumido || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardContent className="pt-6">
                {events.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum evento detectado</p> : (
                  <div className="space-y-3">
                    {events.map((e: any) => (
                      <div key={e.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{e.titulo}</p>
                          <Badge>{e.tipo_evento}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{e.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">{fmtDate(e.criado_em)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{fmtDate(a.criado_em)}</TableCell>
                        <TableCell><Badge variant="outline">{a.canal}</Badge></TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{a.mensagem}</TableCell>
                        <TableCell><Badge variant={a.status_envio === "enviado" ? "default" : a.status_envio === "falha" ? "destructive" : "secondary"}>{a.status_envio}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{fmtDate(l.criado_em)}</TableCell>
                        <TableCell>{l.tipo_operacao}</TableCell>
                        <TableCell>{l.fonte}</TableCell>
                        <TableCell><Badge variant={l.status === "ok" ? "default" : "destructive"}>{l.status}</Badge></TableCell>
                        <TableCell className="text-sm text-destructive max-w-[200px] truncate">{l.erro || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
