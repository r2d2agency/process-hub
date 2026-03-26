import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { clientRoutes } from './routes/clients';
import { ruleRoutes } from './routes/rules';
import { publicationRoutes } from './routes/publications';
import { matchRoutes } from './routes/matches';
import { notificationRoutes } from './routes/notifications';
import { sourceRoutes } from './routes/sources';
import { integrationRoutes } from './routes/integrations';
import { dashboardRoutes } from './routes/dashboard';
import { usersRoutes } from './routes/users';
import { externalApiRoutes } from './routes/external-api';

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'change-me-in-production' });

  // Auth decorator
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Internal routes (JWT auth)
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(dashboardRoutes, { prefix: '/admin' });
  await app.register(clientRoutes, { prefix: '/clients' });
  await app.register(ruleRoutes, { prefix: '/monitor-rules' });
  await app.register(publicationRoutes, { prefix: '/publications' });
  await app.register(matchRoutes, { prefix: '/matches' });
  await app.register(notificationRoutes, { prefix: '/notifications' });
  await app.register(sourceRoutes, { prefix: '/admin/sources' });
  await app.register(integrationRoutes, { prefix: '/integrations' });
  await app.register(usersRoutes, { prefix: '/admin/users' });

  // External API (API Key or JWT)
  await app.register(externalApiRoutes, { prefix: '/api/v1' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = parseInt(process.env.PORT || '3000');
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Server running on port ${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
