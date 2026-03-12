import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Clock, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm">Configurações gerais do sistema</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Agendamento de Coletas</CardTitle>
                  <CardDescription>Frequência de monitoramento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Cron Expression (coleta geral)</Label>
                <Input defaultValue="0 */2 * * *" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Timeout por fonte (ms)</Label>
                <Input type="number" defaultValue="30000" />
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Segurança</CardTitle>
                  <CardDescription>Configurações de autenticação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">JWT Secret</Label>
                <Input type="password" defaultValue="••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Token Expiration (horas)</Label>
                <Input type="number" defaultValue="24" />
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
