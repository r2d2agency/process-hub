import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockStats, mockMatches, mockNotifications, mockSources } from "@/lib/mock-data";
import { Users, BookOpen, FileText, GitCompare, Bell, Database, AlertTriangle, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do monitoramento jurídico</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Clientes Ativos" value={mockStats.totalClients} icon={Users} variant="primary" change="+8 este mês" />
          <StatCard title="Regras Ativas" value={mockStats.activeRules} icon={BookOpen} variant="default" />
          <StatCard title="Publicações Hoje" value={mockStats.todayPublications} icon={FileText} variant="success" change="Última coleta: 08:00" />
          <StatCard title="Matches Hoje" value={mockStats.todayMatches} icon={GitCompare} variant="warning" change="12 pendentes" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-primary" />
                Últimos Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{match.clientName}</p>
                      <p className="text-xs text-muted-foreground">{match.rule} • {match.source}</p>
                    </div>
                    <Badge variant={match.notified ? "default" : "secondary"} className="text-[10px]">
                      {match.notified ? "Notificado" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notificações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{notif.client}</p>
                      <p className="text-xs text-muted-foreground">{notif.channel} • {new Date(notif.date).toLocaleString("pt-BR")}</p>
                    </div>
                    <Badge
                      variant={notif.status === "sent" ? "default" : notif.status === "error" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {notif.status === "sent" ? "Enviado" : notif.status === "error" ? "Erro" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Status das Fontes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockSources.map((source) => (
                <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                  {source.status === "active" ? (
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{source.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{source.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{source.totalPublications.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
