import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function matchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (request) => {
    const { page = '1', limit = '20', ruleId } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = ruleId ? { ruleId } : {};

    const [data, total] = await Promise.all([
      prisma.match.findMany({ where, skip, take: parseInt(limit), include: { rule: { include: { client: true } }, publication: true }, orderBy: { createdAt: 'desc' } }),
      prisma.match.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });
}
