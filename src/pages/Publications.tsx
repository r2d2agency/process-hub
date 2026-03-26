import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { Search } from "lucide-react";

interface Publication {
  id: string;
  title?: string;
  content: string;
  publishedAt?: string;
  createdAt: string;
  source: { name: string; type: string };
}

export default function Publications() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Publication[]; total: number }>({
    queryKey: ["publications", search],
    queryFn: () => apiFetch(`/publications?limit=50${search ? `&search=${search}` : ""}`),
  });

  const publications = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publicações</h1>
          <p className="text-muted-foreground text-sm">Publicações coletadas e processadas</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : publications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma publicação encontrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="max-w-xs">Conteúdo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publications.map(pub => (
                    <TableRow key={pub.id}>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono">{pub.source?.name}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(pub.publishedAt || pub.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm font-medium">{pub.title || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{pub.content?.substring(0, 120)}</TableCell>
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
