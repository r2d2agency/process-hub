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
      } catch (error: any) {
        await prisma.source.update({ where: { id: source.id }, data: { status: 'error' } });
        results.push({ id: source.id, name: source.name, reachable: false, error: error.message });
      }
    }

    return { total: results.length, reachable: results.filter(r => r.reachable).length, results };
  });

  // Delete source
  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.source.delete({ where: { id } });
    return { ok: true };
  });
}
