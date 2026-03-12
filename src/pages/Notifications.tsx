import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockNotifications } from "@/lib/mock-data";
import { RefreshCw } from "lucide-react";

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground text-sm">Central de notificações enviadas e pendentes</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNotifications.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="text-sm font-medium">{n.client}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{n.channel}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        variant={n.status === "sent" ? "default" : n.status === "error" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {n.status === "sent" ? "Enviado" : n.status === "error" ? "Erro" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(n.date).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-center">{n.attempts}</TableCell>
                    <TableCell>
                      {n.status !== "sent" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7"><RefreshCw className="w-3 h-3" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
