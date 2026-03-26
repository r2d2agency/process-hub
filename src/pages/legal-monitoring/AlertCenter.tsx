import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function AlertCenter() {
  const { data, isLoading, refetch } = useApiQuery<any>(["legal-alerts-all"], "/api/legal-monitoring/alerts");
  const alerts = data?.data || [];

  const handleRetry = async (id: string) => {
    try {
      await api.legalMonitoring.retryAlert(id);
      toast.success("Alerta reenfileirado");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "-";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Central de Alertas</h1>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum alerta registrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{fmtDate(a.criado_em)}</TableCell>
                      <TableCell className="font-mono text-sm">{a.numero_processo || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{a.canal}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{a.mensagem}</TableCell>
                      <TableCell><Badge>{a.prioridade}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={a.status_envio === "enviado" ? "default" : a.status_envio === "falha" ? "destructive" : "secondary"}>
                          {a.status_envio}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.status_envio === "falha" && (
                          <Button variant="ghost" size="sm" onClick={() => handleRetry(a.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" />Reenviar
                          </Button>
                        )}
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
