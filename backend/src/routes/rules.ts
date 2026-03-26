import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function ruleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { clientId } = request.query as { clientId?: string };
    const where = clientId ? { clientId } : {};
    return prisma.monitorRule.findMany({ where, include: { client: true }, orderBy: { createdAt: 'desc' } });
  });

  app.post('/', async (request) => {
    const body = request.body as any;
    return prisma.monitorRule.create({ data: body });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.monitorRule.delete({ where: { id } });
    return { ok: true };
  });
}
