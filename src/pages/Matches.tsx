import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockMatches } from "@/lib/mock-data";

export default function MatchesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground text-sm">Correspondências entre publicações e regras</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Regra</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Notificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMatches.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm font-medium">{m.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.rule}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono">{m.source}</Badge></TableCell>
                    <TableCell className="text-sm">{m.date}</TableCell>
                    <TableCell className="text-sm font-mono">{m.process}</TableCell>
                    <TableCell>
                      <Badge variant={m.notified ? "default" : "secondary"} className="text-[10px]">
                        {m.notified ? "Sim" : "Não"}
                      </Badge>
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
