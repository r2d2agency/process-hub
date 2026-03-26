import { FastifyInstance } from 'fastify';
import { safeSystemLog, toErrorMessage } from '../lib/system-log';
import { prisma } from '../server';

const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br';
const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

/** Mapeamento completo de aliases dos tribunais no DataJud */
const TRIBUNAL_ALIASES: Record<string, string> = {
  // Superiores
  tst: 'api_publica_tst', tse: 'api_publica_tse', stj: 'api_publica_stj', stm: 'api_publica_stm',
  // Federais
  trf1: 'api_publica_trf1', trf2: 'api_publica_trf2', trf3: 'api_publica_trf3',
  trf4: 'api_publica_trf4', trf5: 'api_publica_trf5', trf6: 'api_publica_trf6',
  // Estaduais
  tjac: 'api_publica_tjac', tjal: 'api_publica_tjal', tjam: 'api_publica_tjam',
  tjap: 'api_publica_tjap', tjba: 'api_publica_tjba', tjce: 'api_publica_tjce',
  tjdft: 'api_publica_tjdft', tjes: 'api_publica_tjes', tjgo: 'api_publica_tjgo',
  tjma: 'api_publica_tjma', tjmg: 'api_publica_tjmg', tjms: 'api_publica_tjms',
  tjmt: 'api_publica_tjmt', tjpa: 'api_publica_tjpa', tjpb: 'api_publica_tjpb',
  tjpe: 'api_publica_tjpe', tjpi: 'api_publica_tjpi', tjpr: 'api_publica_tjpr',
  tjrj: 'api_publica_tjrj', tjrn: 'api_publica_tjrn', tjro: 'api_publica_tjro',
  tjrr: 'api_publica_tjrr', tjrs: 'api_publica_tjrs', tjsc: 'api_publica_tjsc',
  tjse: 'api_publica_tjse', tjsp: 'api_publica_tjsp', tjto: 'api_publica_tjto',
  // Trabalho
  trt1: 'api_publica_trt1', trt2: 'api_publica_trt2', trt3: 'api_publica_trt3',
  trt4: 'api_publica_trt4', trt5: 'api_publica_trt5', trt6: 'api_publica_trt6',
  trt7: 'api_publica_trt7', trt8: 'api_publica_trt8', trt9: 'api_publica_trt9',
  trt10: 'api_publica_trt10', trt11: 'api_publica_trt11', trt12: 'api_publica_trt12',
  trt13: 'api_publica_trt13', trt14: 'api_publica_trt14', trt15: 'api_publica_trt15',
  trt16: 'api_publica_trt16', trt17: 'api_publica_trt17', trt18: 'api_publica_trt18',
  trt19: 'api_publica_trt19', trt20: 'api_publica_trt20', trt21: 'api_publica_trt21',
  trt22: 'api_publica_trt22', trt23: 'api_publica_trt23', trt24: 'api_publica_trt24',
  // Eleitorais
  'tre-ac': 'api_publica_tre-ac', 'tre-al': 'api_publica_tre-al', 'tre-am': 'api_publica_tre-am',
  'tre-ap': 'api_publica_tre-ap', 'tre-ba': 'api_publica_tre-ba', 'tre-ce': 'api_publica_tre-ce',
  'tre-dft': 'api_publica_tre-dft', 'tre-es': 'api_publica_tre-es', 'tre-go': 'api_publica_tre-go',
  'tre-ma': 'api_publica_tre-ma', 'tre-mg': 'api_publica_tre-mg', 'tre-ms': 'api_publica_tre-ms',
  'tre-mt': 'api_publica_tre-mt', 'tre-pa': 'api_publica_tre-pa', 'tre-pb': 'api_publica_tre-pb',
  'tre-pe': 'api_publica_tre-pe', 'tre-pi': 'api_publica_tre-pi', 'tre-pr': 'api_publica_tre-pr',
  'tre-rj': 'api_publica_tre-rj', 'tre-rn': 'api_publica_tre-rn', 'tre-ro': 'api_publica_tre-ro',
  'tre-rr': 'api_publica_tre-rr', 'tre-rs': 'api_publica_tre-rs', 'tre-sc': 'api_publica_tre-sc',
  'tre-se': 'api_publica_tre-se', 'tre-sp': 'api_publica_tre-sp', 'tre-to': 'api_publica_tre-to',
  // Militar
  tjmmg: 'api_publica_tjmmg', tjmrs: 'api_publica_tjmrs', tjmsp: 'api_publica_tjmsp',
};

export async function datajudRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  /** GET /datajud/tribunais — Lista todos os tribunais disponíveis */
  app.get('/tribunais', async () => {
    const groups: Record<string, { key: string; label: string }[]> = {
      superiores: [
        { key: 'stj', label: 'STJ - Superior Tribunal de Justiça' },
        { key: 'tst', label: 'TST - Tribunal Superior do Trabalho' },
        { key: 'tse', label: 'TSE - Tribunal Superior Eleitoral' },
        { key: 'stm', label: 'STM - Superior Tribunal Militar' },
      ],
      federais: Array.from({ length: 6 }, (_, i) => ({
        key: `trf${i + 1}`, label: `TRF${i + 1} - Tribunal Regional Federal ${i + 1}ª Região`,
      })),
      estaduais: [
        'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DFT', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
        'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
      ].map(uf => ({ key: `tj${uf.toLowerCase()}`, label: `TJ${uf}` })),
      trabalho: Array.from({ length: 24 }, (_, i) => ({
        key: `trt${i + 1}`, label: `TRT${i + 1}`,
      })),
    };
    return groups;
  });

  /**
   * POST /datajud/consulta
   * 
   * Proxy para a API Pública do DataJud (Elasticsearch).
   * Body:
   * {
   *   "tribunal": "tjsp",                    // alias do tribunal (obrigatório)
   *   "numeroProcesso": "0001234-56.2024",    // número do processo (opcional)
   *   "query": "texto livre",                 // busca por texto (opcional)
   *   "dataInicio": "2024-01-01",             // filtro data início (opcional)
   *   "dataFim": "2024-12-31",               // filtro data fim (opcional)
   *   "size": 10,                             // resultados por página (max 20)
   *   "from": 0                               // offset para paginação
   * }
   */
  app.post('/consulta', async (request, reply) => {
    const body = request.body as any;
    const tribunalKey = (body.tribunal || '').toLowerCase();
    const alias = TRIBUNAL_ALIASES[tribunalKey];

    if (!alias) {
      return reply.status(400).send({
        error: `Tribunal "${body.tribunal}" não encontrado. Use GET /datajud/tribunais para ver a lista.`,
      });
    }

    const size = Math.min(body.size || 10, 20);
    const from = body.from || 0;

    // Build Elasticsearch query
    const must: any[] = [];

    if (body.numeroProcesso) {
      // Remove formatting to match
      const num = body.numeroProcesso.replace(/[.\-\/]/g, '');
      must.push({ match: { numeroProcesso: num } });
    }

    if (body.query) {
      must.push({
        multi_match: {
          query: body.query,
          fields: ['classe.nome', 'assuntos.nome', 'orgaoJulgador.nome', 'movimentos.nome'],
        },
      });
    }

    if (body.dataInicio || body.dataFim) {
      const range: any = {};
      if (body.dataInicio) range.gte = body.dataInicio;
      if (body.dataFim) range.lte = body.dataFim;
      must.push({ range: { dataAjuizamento: range } });
    }

    const esQuery = {
      size,
      from,
      query: must.length > 0 ? { bool: { must } } : { match_all: {} },
      sort: [{ dataAjuizamento: { order: 'desc' } }],
    };

    const url = `${DATAJUD_BASE}/${alias}/_search`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `APIKey ${DATAJUD_API_KEY}`,
        },
        body: JSON.stringify(esQuery),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown');
        await safeSystemLog(prisma, {
          level: 'error',
          source: 'datajud',
          message: `DataJud API error: ${response.status} - ${errText.substring(0, 500)}`,
          meta: { tribunal: tribunalKey, url, status: response.status },
        }, app.log);
        return reply.status(response.status).send({ error: `DataJud retornou ${response.status}`, details: errText.substring(0, 500) });
      }

      const data: any = await response.json();

      // Transform ES response to friendlier format
      const hits = data.hits?.hits || [];
      const total = data.hits?.total?.value || 0;

      const processos = hits.map((hit: any) => {
        const s = hit._source;
        return {
          id: hit._id,
          numeroProcesso: s.numeroProcesso,
          tribunal: s.tribunal,
          dataAjuizamento: s.dataAjuizamento,
          grau: s.grau,
          classe: s.classe,
          assuntos: s.assuntos || [],
          orgaoJulgador: s.orgaoJulgador,
          formato: s.formato,
          sistema: s.sistema,
          movimentos: (s.movimentos || []).slice(0, 20), // limit movements
        };
      });

      return { total, from, size, processos };
    } catch (error: any) {
      await safeSystemLog(prisma, {
        level: 'error',
        source: 'datajud',
        message: `Erro ao consultar DataJud: ${toErrorMessage(error)}`,
        meta: { tribunal: tribunalKey, url },
      }, app.log);
      return reply.status(500).send({ error: toErrorMessage(error) || 'Erro ao consultar DataJud' });
    }
  });

  /**
   * POST /datajud/consulta-processo
   * 
   * Consulta rápida por número de processo em TODOS os tribunais principais.
   * Busca em paralelo nos tribunais mais comuns.
   * Body: { "numeroProcesso": "0001234-56.2024.8.26.0100" }
   */
  app.post('/consulta-processo', async (request, reply) => {
    const { numeroProcesso } = request.body as { numeroProcesso: string };

    if (!numeroProcesso) {
      return reply.status(400).send({ error: 'Campo "numeroProcesso" é obrigatório' });
    }

    const num = numeroProcesso.replace(/[.\-\/]/g, '');

    // Determine tribunal from process number (format: NNNNNNN-DD.AAAA.J.TR.OOOO)
    // J = justiça (8=estadual, 5=trabalho, 4=federal, 6=eleitoral, 7=militar, 9=STJ/STF)
    // TR = tribunal (ex: 26=SP)
    const match = numeroProcesso.match(/\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2})\.\d{4}/);
    let tribunais: string[] = [];

    if (match) {
      const justica = match[1];
      const tr = match[2];
      const trNum = parseInt(tr);

      const estadualMap: Record<number, string> = {
        1: 'tjac', 2: 'tjal', 3: 'tjap', 4: 'tjam', 5: 'tjba', 6: 'tjce',
        7: 'tjdft', 8: 'tjes', 9: 'tjgo', 10: 'tjma', 11: 'tjmt', 12: 'tjms',
        13: 'tjmg', 14: 'tjpa', 15: 'tjpb', 16: 'tjpe', 17: 'tjpi', 18: 'tjpr',
        19: 'tjrj', 20: 'tjrn', 21: 'tjrs', 22: 'tjsc', 23: 'tjse', 24: 'tjsp',
        25: 'tjto', 26: 'tjsp', 27: 'tjrr', 28: 'tjro',
      };

      if (justica === '8') {
        // Justiça Estadual
        const tj = estadualMap[trNum];
        if (tj) tribunais = [tj];
      } else if (justica === '5') {
        tribunais = [`trt${trNum}`];
      } else if (justica === '4') {
        tribunais = [`trf${trNum}`];
      } else if (justica === '6') {
        // Eleitoral — try TSE
        tribunais = ['tse'];
      } else if (justica === '9') {
        tribunais = ['stj'];
      }
    }

    // Fallback: try most common tribunals
    if (tribunais.length === 0) {
      tribunais = ['tjsp', 'tjrj', 'tjmg', 'tjrs', 'tjpr', 'stj', 'trf3'];
    }

    const results: any[] = [];

    // Query in parallel (max 5)
    const promises = tribunais.slice(0, 5).map(async (t) => {
      const alias = TRIBUNAL_ALIASES[t];
      if (!alias) return null;

      try {
        const response = await fetch(`${DATAJUD_BASE}/${alias}/_search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${DATAJUD_API_KEY}`,
          },
          body: JSON.stringify({
            size: 5,
            query: { match: { numeroProcesso: num } },
            sort: [{ dataAjuizamento: { order: 'desc' } }],
          }),
        });

        if (!response.ok) return null;
        const data: any = await response.json();
        const hits = data.hits?.hits || [];
        return hits.map((hit: any) => ({
          tribunal: t.toUpperCase(),
          id: hit._id,
          ...hit._source,
          movimentos: (hit._source.movimentos || []).slice(0, 10),
        }));
      } catch {
        return null;
      }
    });

    const all = await Promise.all(promises);
    for (const r of all) {
      if (r) results.push(...r);
    }

    return { total: results.length, processos: results };
  });
}
