import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { Search, Scale, FileText, Calendar, ArrowRight, Loader2 } from "lucide-react";

interface Processo {
  id: string;
  numeroProcesso: string;
  tribunal: string;
  dataAjuizamento: string;
  grau: string;
  classe: { codigo: number; nome: string };
  assuntos: { codigo: number; nome: string }[];
  orgaoJulgador: { codigo: number; nome: string; codigoMunicipioIBGE?: number };
  formato?: { codigo: number; nome: string };
  sistema?: { codigo: number; nome: string };
  movimentos: {
    codigo: number;
    nome: string;
    dataHora: string;
    complementosTabelados?: { codigo: number; nome: string; descricao: string; valor: number }[];
  }[];
}

interface TribunalGroups {
  superiores: { key: string; label: string }[];
  federais: { key: string; label: string }[];
  estaduais: { key: string; label: string }[];
  trabalho: { key: string; label: string }[];
}

type SearchMode = "processo" | "tribunal";

export default function DatajudConsulta() {
  const { toast } = useToast();
  const [mode, setMode] = useState<SearchMode>("processo");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [query, setQuery] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: tribunais } = useQuery<TribunalGroups>({
    queryKey: ["datajud-tribunais"],
    queryFn: () => apiFetch("/datajud/tribunais"),
  });

  const consultaProcesso = useMutation({
    mutationFn: (num: string) =>
      apiFetch<{ total: number; processos: Processo[] }>("/datajud/consulta-processo", {
        method: "POST",
        body: JSON.stringify({ numeroProcesso: num }),
      }),
    onError: (err: any) =>
      toast({ title: "Erro na consulta", description: err.message, variant: "destructive" }),
  });

  const consultaTribunal = useMutation({
    mutationFn: (params: any) =>
      apiFetch<{ total: number; processos: Processo[] }>("/datajud/consulta", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onError: (err: any) =>
      toast({ title: "Erro na consulta", description: err.message, variant: "destructive" }),
  });

  const handleSearch = () => {
    if (mode === "processo") {
      if (!numeroProcesso.trim()) {
        toast({ title: "Informe o número do processo", variant: "destructive" });
        return;
      }
      consultaProcesso.mutate(numeroProcesso.trim());
    } else {
      if (!tribunal) {
        toast({ title: "Selecione um tribunal", variant: "destructive" });
        return;
      }
      consultaTribunal.mutate({
        tribunal,
        query: query || undefined,
        numeroProcesso: numeroProcesso || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        size: 10,
      });
    }
  };

  const isLoading = consultaProcesso.isPending || consultaTribunal.isPending;
  const results = mode === "processo" ? consultaProcesso.data : consultaTribunal.data;

  const allTribunais = tribunais
    ? [
        ...tribunais.superiores,
        ...tribunais.federais,
        ...tribunais.estaduais,
        ...tribunais.trabalho,
      ]
    : [];

  const formatCNJ = (num: string) => {
    if (!num || num.length !== 20) return num;
    return `${num.slice(0, 7)}-${num.slice(7, 9)}.${num.slice(9, 13)}.${num.slice(13, 14)}.${num.slice(14, 16)}.${num.slice(16)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consulta DataJud</h1>
          <p className="text-muted-foreground text-sm">
            API Pública do CNJ — Metadados de processos de todos os tribunais
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SearchMode)}>
              <TabsList>
                <TabsTrigger value="processo">
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Por Nº Processo
                </TabsTrigger>
                <TabsTrigger value="tribunal">
                  <Scale className="w-3.5 h-3.5 mr-1.5" /> Por Tribunal
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-4"
            >
              {mode === "processo" ? (
                <div className="space-y-2">
                  <Label>Número do Processo (CNJ)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={numeroProcesso}
                      onChange={(e) => setNumeroProcesso(e.target.value)}
                      placeholder="0001234-56.2024.8.26.0100"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span className="ml-2">Consultar</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O sistema identifica automaticamente o tribunal pelo número do processo
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Select value={tribunal} onValueChange={setTribunal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tribunal" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {tribunais && (
                          <>
                            <SelectItem value="__header_sup" disabled>— Superiores —</SelectItem>
                            {tribunais.superiores.map((t) => (
                              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                            ))}
                            <SelectItem value="__header_fed" disabled>— Federais —</SelectItem>
                            {tribunais.federais.map((t) => (
                              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                            ))}
                            <SelectItem value="__header_est" disabled>— Estaduais —</SelectItem>
                            {tribunais.estaduais.map((t) => (
                              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                            ))}
                            <SelectItem value="__header_trab" disabled>— Trabalho —</SelectItem>
                            {tribunais.trabalho.map((t) => (
                              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Processo (opcional)</Label>
                    <Input
                      value={numeroProcesso}
                      onChange={(e) => setNumeroProcesso(e.target.value)}
                      placeholder="0001234-56.2024.8.26.0100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Busca por texto (opcional)</Label>
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Classe, assunto, vara..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="space-y-2 flex-1">
                      <Label>Data início</Label>
                      <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Data fim</Label>
                      <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                      Consultar DataJud
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {results && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {results.total} processo{results.total !== 1 ? "s" : ""} encontrado{results.total !== 1 ? "s" : ""}
              </h2>
            </div>

            {results.processos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum processo encontrado com os critérios informados.
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {results.processos.map((processo, idx) => (
                  <AccordionItem key={processo.id || idx} value={processo.id || String(idx)} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex flex-col items-start gap-1 text-left flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">
                            {formatCNJ(processo.numeroProcesso)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {processo.tribunal || tribunal.toUpperCase()}
                          </Badge>
                          {processo.grau && (
                            <Badge variant="secondary" className="text-[10px]">{processo.grau}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {processo.classe?.nome && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {processo.classe.nome}
                            </span>
                          )}
                          {processo.dataAjuizamento && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Órgão Julgador</span>
                            <p className="font-medium text-xs">{processo.orgaoJulgador?.nome || "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Formato</span>
                            <p className="font-medium text-xs">{processo.formato?.nome || "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Sistema</span>
                            <p className="font-medium text-xs">{processo.sistema?.nome || "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Assuntos</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {processo.assuntos.length > 0
                                ? processo.assuntos.map((a, i) => (
                                    <Badge key={i} variant="secondary" className="text-[9px]">
                                      {a.nome}
                                    </Badge>
                                  ))
                                : <span className="text-xs">—</span>}
                            </div>
                          </div>
                        </div>

                        {/* Movements */}
                        {processo.movimentos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <ArrowRight className="w-3.5 h-3.5" /> Últimas Movimentações
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Data</TableHead>
                                  <TableHead className="text-xs">Código</TableHead>
                                  <TableHead className="text-xs">Movimentação</TableHead>
                                  <TableHead className="text-xs">Complemento</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {processo.movimentos.map((mov, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-xs whitespace-nowrap">
                                      {mov.dataHora ? new Date(mov.dataHora).toLocaleDateString("pt-BR") : "—"}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{mov.codigo}</TableCell>
                                    <TableCell className="text-xs">{mov.nome}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {mov.complementosTabelados?.map((c) => c.nome).join(", ") || "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
