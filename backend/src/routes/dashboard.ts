import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: [(app as any).authenticate] }, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [clients, rules, publications, matches, notifications, sources, todayPubs, todayMatches, pendingNotifs] = await Promise.all([
      prisma.client.count(),
      prisma.monitorRule.count({ where: { active: true } }),
      prisma.publication.count(),
      prisma.match.count(),
      prisma.notification.count(),
      prisma.source.findMany({ where: { active: true }, select: { status: true } }),
      prisma.publication.count({ where: { createdAt: { gte: today } } }),
      prisma.match.count({ where: { createdAt: { gte: today } } }),
      prisma.notification.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalClients: clients,
      activeRules: rules,
      totalPublications: publications,
      totalMatches: matches,
      totalNotifications: notifications,
      todayPublications: todayPubs,
      todayMatches: todayMatches,
      pendingNotifications: pendingNotifs,
      sourcesActive: sources.filter(s => s.status !== 'error').length,
      sourcesError: sources.filter(s => s.status === 'error').length,
    };
  });
}
