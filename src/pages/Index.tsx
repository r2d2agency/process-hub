import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { Users, BookOpen, FileText, GitCompare, Bell, Database, AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeRules: number;
  totalPublications: number;
  totalMatches: number;
  totalNotifications: number;
  pendingNotifications: number;
  sourcesActive: number;
  sourcesError: number;
  todayPublications: number;
  todayMatches: number;
}

interface MatchItem {
  id: string;
  createdAt: string;
  snippet?: string;
  rule: { value: string; type: string; client: { name: string } };
  publication: { source?: { name: string } };
}

interface NotificationItem {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  client: { name: string };
}

interface SourceItem {
  id: string;
  name: string;
  type: string;
  status: string;
  active: boolean;
  lastRunAt?: string;
}

const Index = () => {
  const { data: stats, isLoading: statsLoading } = useApiQuery<DashboardStats>(
    ["dashboard"], "/admin/dashboard"
  );
  const { data: matchesRes } = useApiQuery<{ data: MatchItem[] }>(
    ["dashboard-matches"], "/matches?limit=5"
  );
  const { data: notifsRes } = useApiQuery<{ data: NotificationItem[] }>(
    ["dashboard-notifications"], "/notifications?limit=5"
  );
  const { data: sources } = useApiQuery<SourceItem[]>(
    ["dashboard-sources"], "/admin/sources"
  );

  const matches = matchesRes?.data || [];
  const notifs = notifsRes?.data || [];
  const sourceList = sources || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do monitoramento jurídico</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              <StatCard title="Clientes Ativos" value={stats?.totalClients || 0} icon={Users} variant="primary" />
              <StatCard title="Regras Ativas" value={stats?.activeRules || 0} icon={BookOpen} variant="default" />
              <StatCard title="Publicações" value={stats?.totalPublications || 0} icon={FileText} variant="success" />
              <StatCard title="Matches" value={stats?.totalMatches || 0} icon={GitCompare} variant="warning" />
            </>
          )}
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
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum match encontrado</p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{match.rule.client.name}</p>
                        <p className="text-xs text-muted-foreground">{match.rule.type}: {match.rule.value}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(match.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              )}
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
              {notifs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
              ) : (
                <div className="space-y-3">
                  {notifs.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{notif.client.name}</p>
                        <p className="text-xs text-muted-foreground">{notif.channel} • {new Date(notif.createdAt).toLocaleString("pt-BR")}</p>
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
              )}
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
            {sourceList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma fonte cadastrada</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sourceList.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    {source.status === "active" || source.status === "idle" || source.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.type}</p>
                    </div>
                    {source.lastRunAt && (
                      <span className="text-xs text-muted-foreground">{new Date(source.lastRunAt).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
