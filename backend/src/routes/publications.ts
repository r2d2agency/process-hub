import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function publicationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { page = '1', limit = '20', sourceId } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = sourceId ? { sourceId } : {};

    const [data, total] = await Promise.all([
      prisma.publication.findMany({ where, skip, take: parseInt(limit), include: { source: true }, orderBy: { createdAt: 'desc' } }),
      prisma.publication.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });
}
