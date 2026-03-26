import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';

export async function usersRoutes(app: FastifyInstance) {
  // List all users
  app.get('/', async () => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  });

  // Create user
  app.post('/', async (request, reply) => {
    const { name, email, password, role } = request.body as {
      name: string; email: string; password: string; role?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(400).send({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'user' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return reply.status(201).send(user);
  });

  // Update user
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, email, password, role } = request.body as {
      name?: string; email?: string; password?: string; role?: string;
    };

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      return user;
    } catch {
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }
  });

  // Delete user
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.user.delete({ where: { id } });
      return { success: true };
    } catch {
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }
  });

  // Get current user profile
  app.get('/me', async (request, reply) => {
    const { id } = request.user as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' });
    return user;
  });
}