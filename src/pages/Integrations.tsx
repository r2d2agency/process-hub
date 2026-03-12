import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mail, Webhook, TestTube } from "lucide-react";

export default function Integrations() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground text-sm">Configure canais de notificação externos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <MessageSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">WhatsApp API</CardTitle>
                    <CardDescription>Integração com sistema externo</CardDescription>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">URL Base da API</Label>
                <Input placeholder="https://api.whatsapp.exemplo.com" defaultValue="https://api.meuwhatsapp.com/v1" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Token de Autenticação</Label>
                <Input type="password" defaultValue="••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Instance ID</Label>
                <Input placeholder="instance_abc123" defaultValue="inst_001" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Template da Mensagem</Label>
                <Textarea
                  rows={4}
                  defaultValue="Olá, {{nome_cliente}}. Nova publicação no {{nome_fonte}} em {{data_publicacao}}. Processo: {{numero_processo}}. Trecho: {{trecho}}"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Salvar</Button>
                <Button variant="outline"><TestTube className="w-4 h-4 mr-2" />Testar</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Email (SMTP)</CardTitle>
                      <CardDescription>Notificações por email</CardDescription>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configure o servidor SMTP para envio de emails de notificação.</p>
                <Button variant="outline" className="mt-4 w-full">Configurar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Webhook className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Webhook</CardTitle>
                      <CardDescription>Envio para endpoints externos</CardDescription>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configure webhooks para integrar com outros sistemas.</p>
                <Button variant="outline" className="mt-4 w-full">Configurar</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
