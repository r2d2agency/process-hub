import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function sourceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async () => {
    return prisma.source.findMany({ orderBy: { createdAt: 'desc' } });
  });

  app.post('/:id/run', async (request) => {
    const { id } = request.params as { id: string };
    // TODO: enqueue BullMQ job
    await prisma.source.update({ where: { id }, data: { status: 'running', lastRunAt: new Date() } });
    return { ok: true, message: 'Coleta iniciada' };
  });
}
