import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save, CheckCircle, XCircle } from "lucide-react";

export default function MonitoringSettings() {
  const { data: healthData } = useApiQuery<any>(["legal-health"], "/api/legal-monitoring/health");
  const health = healthData?.data;

  const [form, setForm] = useState({
    frequencia_padrao: "6h",
    canais_alerta_padrao: ["email"],
    ativo: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.legalMonitoring.updateSettings(form);
      toast.success("Configurações salvas");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações do Monitoramento</h1>

        {/* Health check */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status do Módulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">DataJud API</span>
                {health.datajud === "configured" ? (
                  <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Configurado</Badge>
                ) : (
                  <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />API Key ausente</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processos monitorados</span>
                <span className="font-medium text-foreground">{health.processosMonitorados}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tribunais suportados</span>
                <div className="flex gap-1">
                  {health.tribunaisSuportados?.map((t: string) => (
                    <Badge key={t} variant="outline">{t.toUpperCase()}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurações Padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Monitoramento ativo</Label>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </div>

            <div className="space-y-2">
              <Label>Frequência padrão</Label>
              <Select value={form.frequencia_padrao} onValueChange={(v) => setForm({ ...form, frequencia_padrao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="3h">3 horas</SelectItem>
                  <SelectItem value="6h">6 horas</SelectItem>
                  <SelectItem value="12h">12 horas</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
