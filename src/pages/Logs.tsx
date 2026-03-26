import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { ScrollText, RefreshCw } from "lucide-react";

interface SystemLog {
  id: string;
  level: string;
  source: string;
  message: string;
  meta?: string;
  createdAt: string;
}

export default function Logs() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery<{ logs: SystemLog[]; total: number; totalPages: number }>({
    queryKey: ["logs", page, level, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (level && level !== "all") params.set("level", level);
      if (search) params.set("search", search);
      return apiFetch(`/admin/logs?${params}`);
    },
    refetchInterval: 10000,
  });

  const levelVariant = (l: string) => {
    if (l === "error") return "destructive" as const;
    if (l === "warn") return "secondary" as const;
    return "default" as const;
  };

  const levelColor = (l: string) => {
    if (l === "error") return "text-red-400";
    if (l === "warn") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Logs do Sistema</h1>
            <p className="text-muted-foreground text-sm">Eventos e erros em tempo real</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Atualizar
          </Button>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Buscar nos logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
          <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos os níveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !data?.logs?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Data/Hora</TableHead>
                      <TableHead className="w-20">Nível</TableHead>
                      <TableHead className="w-32">Origem</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={levelVariant(log.level)} className="text-[10px] uppercase">
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.source}</TableCell>
                        <TableCell className={`text-sm ${levelColor(log.level)}`}>
                          {log.message}
                          {log.meta && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5 font-mono">{log.meta}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                    <span className="text-sm text-muted-foreground flex items-center">Página {page} de {data.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
