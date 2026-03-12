import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockPublications } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Publications() {
  const [search, setSearch] = useState("");
  const filtered = mockPublications.filter(p =>
    p.process.includes(search) || p.source.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase())
  );

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
              <Input placeholder="Buscar por processo, fonte..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Partes</TableHead>
                  <TableHead className="max-w-xs">Trecho</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(pub => (
                  <TableRow key={pub.id}>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono">{pub.source}</Badge></TableCell>
                    <TableCell className="text-sm">{pub.date}</TableCell>
                    <TableCell className="text-sm font-mono">{pub.process}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pub.parties}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{pub.excerpt}</TableCell>
                    <TableCell>
                      <Badge variant={pub.status === "processed" ? "default" : "secondary"} className="text-[10px]">
                        {pub.status === "processed" ? "Processado" : "Pendente"}
                      </Badge>
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
