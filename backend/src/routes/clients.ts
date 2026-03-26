import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function clientRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { page = '1', limit = '20', search } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.client.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.post('/', async (request) => {
    const body = request.body as any;
    return prisma.client.create({ data: body });
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    return prisma.client.update({ where: { id }, data: body });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.client.delete({ where: { id } });
    return { ok: true };
  });
}
