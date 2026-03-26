import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

export default function IntegrationLogs() {
  const { data, isLoading } = useApiQuery<any>(["legal-int-logs"], "/api/legal-monitoring/alerts?per_page=100");

  // Use a dedicated endpoint if available, for now reusing what we have
  // We'd ideally hit /api/legal-monitoring/processes/{id}/logs but this is module-wide

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "-";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Logs de Integração</h1>
        <p className="text-muted-foreground">Logs detalhados de comunicação com o DataJud e outras fontes estão disponíveis na página de detalhe de cada processo.</p>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Acesse os logs de integração através da aba "Logs" no detalhe de cada processo monitorado.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
