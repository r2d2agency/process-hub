import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function logRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  // List logs with pagination and filters
  app.get('/', async (request) => {
    const { page = '1', limit = '50', level, source, search } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (level) where.level = level;
    if (source) where.source = source;
    if (search) where.message = { contains: search, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.systemLog.count({ where }),
    ]);

    return { logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
  });

  // Get distinct sources for filter
  app.get('/sources', async () => {
    const sources = await prisma.systemLog.findMany({
      select: { source: true },
      distinct: ['source'],
    });
    return sources.map((s) => s.source);
  });

  // Clear old logs
  app.delete('/clear', async (request) => {
    const { olderThanDays = '30' } = request.query as Record<string, string>;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));

    const result = await prisma.systemLog.deleteMany({ where: { createdAt: { lt: date } } });
    return { ok: true, deleted: result.count };
  });
}
