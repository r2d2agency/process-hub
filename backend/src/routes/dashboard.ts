import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: [(app as any).authenticate] }, async () => {
    const [clients, rules, publications, matches, notifications] = await Promise.all([
      prisma.client.count(),
      prisma.monitorRule.count(),
      prisma.publication.count(),
      prisma.match.count(),
      prisma.notification.count(),
    ]);

    return {
      totalClients: clients,
      activeRules: rules,
      totalPublications: publications,
      totalMatches: matches,
      totalNotifications: notifications,
    };
  });
}
