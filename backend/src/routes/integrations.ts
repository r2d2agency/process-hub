import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function integrationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { clientId } = request.query as { clientId?: string };
    const where = clientId ? { clientId } : {};
    return prisma.integration.findMany({ where, include: { client: true } });
  });

  app.post('/whatsapp', async (request) => {
    const { clientId, apiKey, instanceName } = request.body as any;
    
    const existing = await prisma.integration.findFirst({
      where: { clientId, type: 'whatsapp' },
    });

    if (existing) {
      return prisma.integration.update({
        where: { id: existing.id },
        data: { config: { apiKey, instanceName }, active: true },
      });
    }

    return prisma.integration.create({
      data: { clientId, type: 'whatsapp', config: { apiKey, instanceName } },
    });
  });

  app.post('/test-send', async (request) => {
    const { clientId } = request.body as { clientId: string };
    // TODO: implement actual WhatsApp send
    return { ok: true, message: 'Mensagem de teste enviada' };
  });
}
