import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

interface Match {
  id: string;
  snippet?: string;
  createdAt: string;
  rule: { type: string; value: string; client: { name: string } };
  publication: { title?: string; content: string; source: { name: string } };
}

export default function MatchesPage() {
  const { data, isLoading } = useQuery<{ data: Match[]; total: number }>({
    queryKey: ["matches"],
    queryFn: () => apiFetch("/matches?limit=50"),
  });

  const matches = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground text-sm">Correspondências entre publicações e regras</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : matches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum match encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Trecho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{m.rule.client.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.rule.type}: {m.rule.value}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono">{m.publication.source?.name}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{m.snippet || m.publication.content?.substring(0, 80)}</TableCell>
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
