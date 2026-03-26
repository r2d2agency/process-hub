import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { RefreshCw } from "lucide-react";

interface Notification {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  client: { name: string };
}

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Notification[]; total: number }>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications?limit=50"),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}/resend`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); toast({ title: "Reenviado" }); },
  });

  const notifications = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground text-sm">Central de notificações enviadas e pendentes</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma notificação</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="text-sm font-medium">{n.client.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{n.channel}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={n.status === "sent" ? "default" : n.status === "error" ? "destructive" : "secondary"} className="text-[10px]">
                          {n.status === "sent" ? "Enviado" : n.status === "error" ? "Erro" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        {n.status !== "sent" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resendMutation.mutate(n.id)}>
                            <RefreshCw className="w-3 h-3" />
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
