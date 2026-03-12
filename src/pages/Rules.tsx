import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRules } from "@/lib/mock-data";
import { Plus, Pencil, Trash2 } from "lucide-react";

const typeLabels: Record<string, string> = {
  processo: "Processo", oab: "OAB", nome: "Nome", cpf_cnpj: "CPF/CNPJ", keyword: "Palavra-chave"
};

export default function Rules() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Regras de Monitoramento</h1>
            <p className="text-muted-foreground text-sm">Critérios de busca em publicações</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" />Nova Regra</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fontes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-sm font-medium">{rule.clientName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[rule.type]}</Badge></TableCell>
                    <TableCell className="text-sm font-mono">{rule.value}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{rule.sources.join(", ")}</TableCell>
                    <TableCell><Badge className="text-[10px]">Ativa</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                      </div>
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
