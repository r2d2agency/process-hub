import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { Scale, Eye, AlertTriangle, Activity, RefreshCw, Clock } from "lucide-react";

export default function LegalMonitoringDashboard() {
  const { data, isLoading, refetch } = useApiQuery<any>(
    ["legal-monitoring-dashboard"],
    "/api/legal-monitoring/dashboard"
  );

  const dashboard = data?.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento Processual</h1>
            <p className="text-muted-foreground">Acompanhe processos judiciais em tempo real via DataJud</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Processos</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dashboard?.totalProcessos ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monitoramento Ativo</CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dashboard?.processosAtivos ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{dashboard?.comAlertaPendente ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Novos</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{dashboard?.eventosNovos ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Verificações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : !dashboard?.ultimasVerificacoes?.length ? (
              <p className="text-muted-foreground">Nenhuma verificação realizada ainda.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.ultimasVerificacoes.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.fonte}</p>
                        <p className="text-xs text-muted-foreground">{v.resumo_resultado || 'Sem resultado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={v.status === 'sucesso' ? 'default' : 'destructive'}>
                        {v.status}
                      </Badge>
                      {v.houve_mudanca && <Badge className="bg-success text-success-foreground">Nova</Badge>}
                      {v.tempo_execucao_ms && (
                        <span className="text-xs text-muted-foreground">{v.tempo_execucao_ms}ms</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
