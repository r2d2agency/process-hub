import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function sourceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  // List all sources
  app.get('/', async () => {
    return prisma.source.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { publications: true } } },
    });
  });

  // Create source
  app.post('/', async (request) => {
    const { name, type, url } = request.body as { name: string; type: string; url?: string };
    return prisma.source.create({ data: { name, type, url } });
  });

  // ===== STATIC ROUTES FIRST (before /:id) =====

  // Validate ALL sources
  app.post('/validate-all', async () => {
    const sources = await prisma.source.findMany({ where: { active: true } });
    const results = [];

    for (const source of sources) {
      if (!source.url) {
        results.push({ id: source.id, name: source.name, reachable: false, error: 'URL não configurada' });
        continue;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(source.url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'JurisMonitor/1.0' },
        });
        clearTimeout(timeout);

        const reachable = response.ok;
        await prisma.source.update({ where: { id: source.id }, data: { status: reachable ? 'active' : 'error' } });
        results.push({ id: source.id, name: source.name, reachable, statusCode: response.status });

        // Log result
        await prisma.systemLog.create({
          data: {
            level: reachable ? 'info' : 'warn',
            source: 'source-validation',
            message: `Validação: ${source.name} - ${reachable ? 'acessível' : 'inacessível'}`,
            meta: JSON.stringify({ sourceId: source.id, statusCode: response.status }),
          },
        });
      } catch (error: any) {
        await prisma.source.update({ where: { id: source.id }, data: { status: 'error' } });
        results.push({ id: source.id, name: source.name, reachable: false, error: error.message });

        await prisma.systemLog.create({
          data: {
            level: 'error',
            source: 'source-validation',
            message: `Erro ao validar ${source.name}: ${error.message}`,
            meta: JSON.stringify({ sourceId: source.id }),
          },
        });
      }
    }

    return { total: results.length, reachable: results.filter(r => r.reachable).length, results };
  });

  // Bulk seed all Brazilian court sources
  app.post('/seed', async () => {
    try {
      const sources = [
        { name: 'STF - Supremo Tribunal Federal', type: 'HTML', url: 'https://portal.stf.jus.br/servicos/dje/' },
        { name: 'STJ - Superior Tribunal de Justiça', type: 'HTML', url: 'https://scon.stj.jus.br/SCON/' },
        { name: 'TST - Tribunal Superior do Trabalho', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TSE - Tribunal Superior Eleitoral', type: 'HTML', url: 'https://www.tse.jus.br/servicos-judiciais/diario-da-justica-eletronico' },
        { name: 'STM - Superior Tribunal Militar', type: 'HTML', url: 'https://www.stm.jus.br/servicos-stm/diario-da-justica-eletronico' },
        { name: 'DOU - Diário Oficial da União', type: 'HTML', url: 'https://www.in.gov.br/leiturajornal' },
        { name: 'TRF1 - Tribunal Regional Federal 1ª Região', type: 'HTML', url: 'https://portal.trf1.jus.br/portaltrf1/comunicacao/diario-eletronico/' },
        { name: 'TRF2 - Tribunal Regional Federal 2ª Região', type: 'HTML', url: 'https://www10.trf2.jus.br/portal/diario-eletronico/' },
        { name: 'TRF3 - Tribunal Regional Federal 3ª Região', type: 'HTML', url: 'https://www.trf3.jus.br/documentos/deju/' },
        { name: 'TRF4 - Tribunal Regional Federal 4ª Região', type: 'HTML', url: 'https://www2.trf4.jus.br/trf4/diario/' },
        { name: 'TRF5 - Tribunal Regional Federal 5ª Região', type: 'HTML', url: 'https://www.trf5.jus.br/index.php?option=com_content&view=article&id=225' },
        { name: 'TRF6 - Tribunal Regional Federal 6ª Região', type: 'HTML', url: 'https://portal.trf6.jus.br/portal/consulta-processual/diario-eletronico' },
        { name: 'TJAC - Tribunal de Justiça do Acre', type: 'HTML', url: 'https://diario.tjac.jus.br/' },
        { name: 'TJAL - Tribunal de Justiça de Alagoas', type: 'HTML', url: 'https://www2.tjal.jus.br/cdje/consultaSimples.do' },
        { name: 'TJAM - Tribunal de Justiça do Amazonas', type: 'HTML', url: 'https://consultasaj.tjam.jus.br/cdje/consultaSimples.do' },
        { name: 'TJAP - Tribunal de Justiça do Amapá', type: 'HTML', url: 'https://tucujuris.tjap.jus.br/diario/' },
        { name: 'TJBA - Tribunal de Justiça da Bahia', type: 'HTML', url: 'https://www.tjba.jus.br/diario/' },
        { name: 'TJCE - Tribunal de Justiça do Ceará', type: 'HTML', url: 'https://esaj.tjce.jus.br/cdje/consultaSimples.do' },
        { name: 'TJDFT - Tribunal de Justiça do DF e Territórios', type: 'HTML', url: 'https://www.tjdft.jus.br/publicacoes/publicacao-oficial/diario-da-justica-eletronico' },
        { name: 'TJES - Tribunal de Justiça do Espírito Santo', type: 'HTML', url: 'https://sistemas.tjes.jus.br/ediariocontroller/publicacoes/consultarPublicacoes.faces' },
        { name: 'TJGO - Tribunal de Justiça de Goiás', type: 'HTML', url: 'https://www.tjgo.jus.br/index.php/diario-da-justica-eletronico' },
        { name: 'TJMA - Tribunal de Justiça do Maranhão', type: 'HTML', url: 'https://dijur.tjma.jus.br/' },
        { name: 'TJMG - Tribunal de Justiça de Minas Gerais', type: 'HTML', url: 'https://www.tjmg.jus.br/portal-tjmg/publicacoes/diario-do-judiciario/' },
        { name: 'TJMS - Tribunal de Justiça de Mato Grosso do Sul', type: 'HTML', url: 'https://www.tjms.jus.br/diario/' },
        { name: 'TJMT - Tribunal de Justiça de Mato Grosso', type: 'HTML', url: 'https://www.tjmt.jus.br/publicacoes' },
        { name: 'TJPA - Tribunal de Justiça do Pará', type: 'HTML', url: 'https://www.tjpa.jus.br/CMSPortal/VisualizarArquivo?idArquivo=908811' },
        { name: 'TJPB - Tribunal de Justiça da Paraíba', type: 'HTML', url: 'https://www.tjpb.jus.br/diario-da-justica' },
        { name: 'TJPE - Tribunal de Justiça de Pernambuco', type: 'HTML', url: 'https://www.tjpe.jus.br/web/diario-da-justica-eletronico' },
        { name: 'TJPI - Tribunal de Justiça do Piauí', type: 'HTML', url: 'https://www.tjpi.jus.br/djeonline/' },
        { name: 'TJPR - Tribunal de Justiça do Paraná', type: 'HTML', url: 'https://portal.tjpr.jus.br/publicacoes/' },
        { name: 'TJRJ - Tribunal de Justiça do Rio de Janeiro', type: 'HTML', url: 'https://www3.tjrj.jus.br/consultadje/' },
        { name: 'TJRN - Tribunal de Justiça do Rio Grande do Norte', type: 'HTML', url: 'https://diario.tjrn.jus.br/' },
        { name: 'TJRO - Tribunal de Justiça de Rondônia', type: 'HTML', url: 'https://www.tjro.jus.br/diario/' },
        { name: 'TJRR - Tribunal de Justiça de Roraima', type: 'HTML', url: 'https://diario.tjrr.jus.br/' },
        { name: 'TJRS - Tribunal de Justiça do Rio Grande do Sul', type: 'HTML', url: 'https://www.tjrs.jus.br/novo/informacoes-e-servicos/diario-da-justica/' },
        { name: 'TJSC - Tribunal de Justiça de Santa Catarina', type: 'HTML', url: 'https://busca.tjsc.jus.br/consultadje/' },
        { name: 'TJSE - Tribunal de Justiça de Sergipe', type: 'HTML', url: 'https://www.tjse.jus.br/portal/publicacoes/diario-da-justica' },
        { name: 'TJSP - Tribunal de Justiça de São Paulo', type: 'HTML', url: 'https://www.dje.tjsp.jus.br/cdje/consultaSimples.do' },
        { name: 'TJTO - Tribunal de Justiça do Tocantins', type: 'HTML', url: 'https://diario.tjto.jus.br/' },
        { name: 'TCU - Tribunal de Contas da União', type: 'HTML', url: 'https://pesquisa.apps.tcu.gov.br/#/diario/' },
        { name: 'TRT1 - Rio de Janeiro', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TRT2 - São Paulo', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TRT3 - Minas Gerais', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TRT4 - Rio Grande do Sul', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TRT5 - Bahia', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
        { name: 'TRT15 - Campinas', type: 'HTML', url: 'https://dejt.jt.jus.br/dejt/f/n/diariocon' },
      ];

      let created = 0;
      for (const s of sources) {
        const exists = await prisma.source.findFirst({ where: { name: s.name } });
        if (!exists) {
          await prisma.source.create({ data: s });
          created++;
        }
      }

      await prisma.systemLog.create({
        data: {
          level: 'info',
          source: 'seed',
          message: `Seed de fontes: ${created} criadas, ${sources.length - created} já existiam`,
        },
      });

      return { ok: true, total: sources.length, created, skipped: sources.length - created };
    } catch (error: any) {
      await prisma.systemLog.create({
        data: {
          level: 'error',
          source: 'seed',
          message: `Erro no seed de fontes: ${error.message}`,
        },
      }).catch(() => {});
      throw error;
    }
  });

  // ===== PARAMETRIC ROUTES =====

  // Run source (trigger scraping)
  app.post('/:id/run', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.source.update({ where: { id }, data: { status: 'running', lastRunAt: new Date() } });
    return { ok: true, message: 'Coleta iniciada' };
  });

  // Validate source (check if URL is reachable)
  app.post('/:id/validate', async (request) => {
    const { id } = request.params as { id: string };
    const source = await prisma.source.findUnique({ where: { id } });
    if (!source) return { id, name: 'Unknown', reachable: false, error: 'Fonte não encontrada' };

    if (!source.url) {
      return { id: source.id, name: source.name, reachable: false, error: 'URL não configurada' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(source.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'JurisMonitor/1.0' },
      });
      clearTimeout(timeout);

      const reachable = response.ok;
      await prisma.source.update({
        where: { id },
        data: { status: reachable ? 'active' : 'error' },
      });

      return { id: source.id, name: source.name, reachable, statusCode: response.status };
    } catch (error: any) {
      await prisma.source.update({ where: { id }, data: { status: 'error' } });
      return { id: source.id, name: source.name, reachable: false, error: error.message || 'Timeout ou erro de conexão' };
    }
  });

  // Delete source
  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.source.delete({ where: { id } });
    return { ok: true };
  });
}
