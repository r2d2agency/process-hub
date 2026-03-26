import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { page = '1', limit = '20', clientId, status } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: parseInt(limit), include: { client: true }, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.post('/:id/resend', async (request) => {
    const { id } = request.params as { id: string };
    const notification = await prisma.notification.update({
      where: { id },
      data: { status: 'pending', sentAt: null },
    });
    return notification;
  });
}
