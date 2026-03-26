import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/use-api-query";
import { ArrowLeft, Save } from "lucide-react";

export default function ProcessForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero_processo: "",
    tribunal: "auto",
    cliente_id: "",
    advogado_responsavel_id: "",
    tags: "",
    observacoes_internas: "",
    prioridade: "media",
    frequencia_monitoramento: "6h",
    canal_alerta_preferencial: "email",
  });

  const { data: clientsData } = useApiQuery<any>(["clients-list"], "/clients?page=1&limit=100");
  const clients = clientsData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        cliente_id: form.cliente_id || undefined,
        advogado_responsavel_id: form.advogado_responsavel_id || undefined,
      };
      await api.legalMonitoring.createProcess(payload);
      toast.success("Processo cadastrado com sucesso!");
      navigate("/legal-monitoring/processes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Processo</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Número CNJ *</Label>
                <Input
                  placeholder="0000000-00.0000.0.00.0000"
                  value={form.numero_processo}
                  onChange={(e) => setForm({ ...form, numero_processo: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Formato: NNNNNNN-DD.AAAA.J.TT.OOOO</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tribunal</Label>
                  <Select value={form.tribunal} onValueChange={(v) => setForm({ ...form, tribunal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático (detectar pelo número)</SelectItem>
                      <SelectItem value="tjsp">TJSP</SelectItem>
                      <SelectItem value="trt2">TRT2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={form.frequencia_monitoramento} onValueChange={(v) => setForm({ ...form, frequencia_monitoramento: v })}>
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

                <div className="space-y-2">
                  <Label>Canal de Alerta</Label>
                  <Select value={form.canal_alerta_preferencial} onValueChange={(v) => setForm({ ...form, canal_alerta_preferencial: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="sistema">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input placeholder="cível, urgente, trabalhista" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Observações Internas</Label>
                <Textarea placeholder="Notas sobre o processo..." value={form.observacoes_internas} onChange={(e) => setForm({ ...form, observacoes_internas: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Cadastrar Processo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
