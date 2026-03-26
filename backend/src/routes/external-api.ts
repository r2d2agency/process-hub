import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

/**
 * External API routes — designed for integration with external systems.
 * Authentication via API key (X-API-Key header) or JWT Bearer token.
 */
export async function externalApiRoutes(app: FastifyInstance) {
  // API Key or JWT authentication
  app.addHook('preHandler', async (request, reply) => {
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey && apiKey === process.env.API_KEY) {
      return; // valid API key
    }
    // fallback to JWT
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized. Provide X-API-Key header or Bearer token.' });
    }
  });

  // ==================== CLIENTS ====================
  app.get('/clients', async (request) => {
    const { page = '1', limit = '20', search } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.client.count({ where }),
    ]);
    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.get('/clients/:id', async (request) => {
    const { id } = request.params as { id: string };
    const client = await prisma.client.findUnique({
      where: { id },
      include: { rules: true, notifications: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!client) return { error: 'Client not found' };
    return client;
  });

  app.post('/clients', async (request) => {
    const body = request.body as any;
    return prisma.client.create({ data: { name: body.name, document: body.document, email: body.email, phone: body.phone } });
  });

  app.put('/clients/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    return prisma.client.update({ where: { id }, data: body });
  });

  app.delete('/clients/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.client.delete({ where: { id } });
    return { ok: true };
  });

  // ==================== RULES ====================
  app.get('/rules', async (request) => {
    const { clientId } = request.query as { clientId?: string };
    const where = clientId ? { clientId } : {};
    return prisma.monitorRule.findMany({ where, include: { client: true }, orderBy: { createdAt: 'desc' } });
  });

  app.post('/rules', async (request) => {
    const body = request.body as any;
    return prisma.monitorRule.create({ data: { clientId: body.clientId, type: body.type, value: body.value } });
  });

  app.delete('/rules/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.monitorRule.delete({ where: { id } });
    return { ok: true };
  });

  // ==================== PUBLICATIONS ====================
  app.get('/publications', async (request) => {
    const { page = '1', limit = '20', sourceId } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = sourceId ? { sourceId } : {};
    const [data, total] = await Promise.all([
      prisma.publication.findMany({ where, skip, take: parseInt(limit), include: { source: true }, orderBy: { createdAt: 'desc' } }),
      prisma.publication.count({ where }),
    ]);
    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // ==================== MATCHES ====================
  app.get('/matches', async (request) => {
    const { page = '1', limit = '20', clientId, ruleId } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (ruleId) where.ruleId = ruleId;
    if (clientId) where.rule = { clientId };
    const [data, total] = await Promise.all([
      prisma.match.findMany({ where, skip, take: parseInt(limit), include: { rule: { include: { client: true } }, publication: { include: { source: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.match.count({ where }),
    ]);
    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // ==================== NOTIFICATIONS ====================
  app.get('/notifications', async (request) => {
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

  // ==================== SOURCES STATUS ====================
  app.get('/sources/status', async () => {
    const sources = await prisma.source.findMany({
      where: { active: true },
      select: { id: true, name: true, type: true, status: true, lastRunAt: true, url: true },
      orderBy: { name: 'asc' },
    });
    return {
      total: sources.length,
      active: sources.filter(s => s.status === 'active' || s.status === 'completed').length,
      error: sources.filter(s => s.status === 'error').length,
      sources,
    };
  });

  // ==================== DASHBOARD STATS ====================
  app.get('/stats', async () => {
    const [clients, rules, publications, matches, notifications, sources] = await Promise.all([
      prisma.client.count(),
      prisma.monitorRule.count(),
      prisma.publication.count(),
      prisma.match.count(),
      prisma.notification.count(),
      prisma.source.findMany({ where: { active: true }, select: { status: true } }),
    ]);
    return {
      totalClients: clients,
      activeRules: rules,
      totalPublications: publications,
      totalMatches: matches,
      totalNotifications: notifications,
      sourcesActive: sources.filter(s => s.status !== 'error').length,
      sourcesError: sources.filter(s => s.status === 'error').length,
    };
  });
}
