import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockSources } from "@/lib/mock-data";
import { Play, RefreshCw } from "lucide-react";

export default function Sources() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fontes Monitoradas</h1>
          <p className="text-muted-foreground text-sm">Tribunais e diários oficiais</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Coleta</TableHead>
                  <TableHead className="text-right">Publicações</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell className="font-mono text-sm font-bold">{source.code}</TableCell>
                    <TableCell className="text-sm">{source.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{source.type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={source.status === "active" ? "default" : "destructive"} className="text-[10px]">
                        {source.status === "active" ? "Ativo" : "Erro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(source.lastRun).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right text-sm">{source.totalPublications.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Play className="w-3 h-3" /></Button>
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
