import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { safeSystemLog, toErrorMessage } from './lib/system-log';

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue for scraping sources
export const scrapeQueue = new Queue('scrape', { connection });

// Worker that processes scrape jobs
const worker = new Worker(
  'scrape',
  async (job) => {
    const { sourceId } = job.data;
    console.log(`Processing source: ${sourceId}`);

    try {
      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) throw new Error('Source not found');

      // TODO: Implement actual scraping logic per source type
      // For now, mark as completed
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: 'completed', lastRunAt: new Date() },
      });

      await safeSystemLog(prisma, {
        source: 'worker',
        message: `Coleta concluída para fonte ${source.name}`,
        meta: { sourceId: source.id, jobId: job.id },
      });

      console.log(`Source ${sourceId} completed`);
    } catch (error) {
      console.error(`Error processing source ${sourceId}:`, error);
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: 'error' },
      });
      await safeSystemLog(prisma, {
        level: 'error',
        source: 'worker',
        message: `Erro ao processar fonte ${sourceId}: ${toErrorMessage(error)}`,
        meta: { sourceId, jobId: job.id },
      });
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Worker started, waiting for jobs...');
