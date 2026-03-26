import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";

export default function ProcessImport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setLoading(true);
    try {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const processos = lines.map((line) => {
        const [numero_processo, tribunal, prioridade] = line.split(";").map((s) => s.trim());
        return { numero_processo, tribunal: tribunal || "auto", prioridade: prioridade || "media" };
      });
      const res = await api.legalMonitoring.importProcesses(processos);
      setResult(res.data);
      toast.success(res.message);
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
          <h1 className="text-2xl font-bold text-foreground">Importação em Lote</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Processos para importar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cole os processos (um por linha)</Label>
              <p className="text-xs text-muted-foreground">
                Formato: <code className="bg-muted px-1 rounded">numero_cnj;tribunal;prioridade</code>
                <br />
                Exemplo: <code className="bg-muted px-1 rounded">1234567-89.2024.8.26.0100;tjsp;alta</code>
                <br />
                Tribunal e prioridade são opcionais (padrão: auto, media)
              </p>
              <Textarea
                rows={10}
                placeholder="0000001-00.2024.8.26.0100&#10;0000002-00.2024.5.02.0001;trt2;urgente"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <Button onClick={handleImport} disabled={loading || !text.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Importando..." : "Importar"}
            </Button>

            {result && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium text-foreground">Resultado: {result.success} importado(s)</p>
                {result.errors?.length > 0 && (
                  <div>
                    <p className="text-sm text-destructive font-medium">Erros:</p>
                    <ul className="text-sm text-destructive list-disc pl-5">
                      {result.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
