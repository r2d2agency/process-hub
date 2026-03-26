import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { safeSystemLog, toErrorMessage } from './lib/system-log';
import { DataJudConnector } from './lib/datajud-connector';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queues
export const scrapeQueue = new Queue('scrape', { connection });
export const legalMonitoringQueue = new Queue('legal-monitoring', { connection });

// ── Original scrape worker ──
const scrapeWorker = new Worker(
  'scrape',
  async (job) => {
    const { sourceId } = job.data;
    console.log(`Processing source: ${sourceId}`);

    try {
      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) throw new Error('Source not found');

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

// ── Legal Monitoring Worker ──
const legalMonitoringWorker = new Worker(
  'legal-monitoring',
  async (job) => {
    const { type } = job.data;

    switch (type) {
      case 'check-process':
        await handleCheckProcess(job.data.processoId);
        break;
      case 'schedule-checks':
        await handleScheduleChecks();
        break;
      case 'retry-failed-alerts':
        await handleRetryFailedAlerts();
        break;
      default:
        console.warn(`Unknown job type: ${type}`);
    }
  },
  { connection, concurrency: 3 }
);

/**
 * Check a single process via DataJud
 */
async function handleCheckProcess(processoId: string) {
  console.log(`[legal-monitoring] Checking process: ${processoId}`);

  const [process] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM processos_monitorados WHERE id = $1::uuid AND status_monitoramento = 'ativo'`, processoId
  );
  if (!process) {
    console.log(`Process ${processoId} not found or not active, skipping`);
    return;
  }

  const startTime = Date.now();

  // Create verification
  const [verificacao] = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO verificacoes_processo (processo_monitorado_id, tipo_consulta, fonte, status, iniciou_em)
     VALUES ($1::uuid, 'datajud', 'datajud', 'executando'::check_status, NOW()) RETURNING *`,
    processoId
  );

  try {
    const movements = await DataJudConnector.fetchProcessMovements(
      process.numero_processo, process.tribunal
    );
    const elapsed = Date.now() - startTime;

    // Insert new movements
    let newCount = 0;
    for (const mov of movements) {
      try {
        const result = await prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO movimentacoes_processo (processo_monitorado_id, fonte, data_movimentacao, descricao_original, descricao_normalizada, hash_movimentacao, relevancia, origem_evento)
           VALUES ($1::uuid, $2, $3::timestamptz, $4, $5, $6, $7, $8)
           ON CONFLICT (processo_monitorado_id, hash_movimentacao) DO NOTHING
           RETURNING id`,
          processoId, mov.origemEvento, mov.dataMovimentacao, mov.descricaoOriginal,
          mov.descricaoNormalizada, mov.hashMovimentacao, mov.relevancia, mov.origemEvento
        );
        if (result.length > 0) newCount++;
      } catch { /* skip duplicates */ }
    }

    const houveMudanca = newCount > 0;

    // Update verification
    await prisma.$queryRawUnsafe(
      `UPDATE verificacoes_processo SET status = 'sucesso'::check_status, finalizou_em = NOW(), tempo_execucao_ms = $1, houve_mudanca = $2, resumo_resultado = $3 WHERE id = $4::uuid`,
      elapsed, houveMudanca, `${movements.length} movimentações, ${newCount} novas`, verificacao.id
    );

    // Update process
    await prisma.$queryRawUnsafe(
      `UPDATE processos_monitorados SET ultima_verificacao_em = NOW(), ultima_fonte_consultada = 'datajud', atualizado_em = NOW()
       ${houveMudanca ? ", ultima_movimentacao_em = NOW()" : ""} WHERE id = $1::uuid`, processoId
    );

    // Events + alerts if changed
    if (houveMudanca) {
      const [evento] = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO eventos_detectados (processo_monitorado_id, verificacao_id, tipo_evento, titulo, descricao, prioridade)
         VALUES ($1::uuid, $2::uuid, 'nova_movimentacao', 'Novas movimentações detectadas', $3, $4::monitoring_priority) RETURNING *`,
        processoId, verificacao.id, `${newCount} nova(s) movimentação(ões)`, process.prioridade || 'media'
      );

      await prisma.$queryRawUnsafe(
        `INSERT INTO alertas_processo (processo_monitorado_id, evento_detectado_id, canal, mensagem, prioridade)
         VALUES ($1::uuid, $2::uuid, $3::alert_channel, $4, $5::monitoring_priority)`,
        processoId, evento.id, process.canal_alerta_preferencial || 'email',
        `Processo ${process.numero_processo}: ${newCount} nova(s) movimentação(ões)`,
        process.prioridade || 'media'
      );

      await prisma.$queryRawUnsafe(
        `UPDATE processos_monitorados SET possui_alerta_pendente = true WHERE id = $1::uuid`, processoId
      );
    }

    // Log integration
    await prisma.$queryRawUnsafe(
      `INSERT INTO logs_integracao (processo_monitorado_id, fonte, tipo_operacao, status, response_resumido)
       VALUES ($1::uuid, 'datajud', 'check', 'ok', $2::jsonb)`,
      processoId, JSON.stringify({ movimentos: movements.length, novos: newCount })
    );

    await safeSystemLog(prisma, {
      source: 'legal-monitoring',
      message: `Verificação concluída: ${process.numero_processo} - ${newCount} novas movimentações`,
      meta: { processoId, movimentos: movements.length, novos: newCount },
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;

    await prisma.$queryRawUnsafe(
      `UPDATE verificacoes_processo SET status = 'erro'::check_status, finalizou_em = NOW(), tempo_execucao_ms = $1, erro_resumido = $2 WHERE id = $3::uuid`,
      elapsed, toErrorMessage(error), verificacao.id
    );

    await prisma.$queryRawUnsafe(
      `INSERT INTO logs_integracao (processo_monitorado_id, fonte, tipo_operacao, status, erro)
       VALUES ($1::uuid, 'datajud', 'check', 'erro', $2)`,
      processoId, toErrorMessage(error)
    );

    await safeSystemLog(prisma, {
      level: 'error',
      source: 'legal-monitoring',
      message: `Erro ao verificar processo ${process.numero_processo}: ${toErrorMessage(error)}`,
      meta: { processoId },
    });

    throw error;
  }
}

/**
 * Schedule eligible processes for checking
 */
async function handleScheduleChecks() {
  console.log('[legal-monitoring] Scheduling eligible processes...');

  // Find active processes that are due for checking
  const processes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, numero_processo, frequencia_monitoramento, ultima_verificacao_em
    FROM processos_monitorados
    WHERE status_monitoramento = 'ativo'
    AND (
      ultima_verificacao_em IS NULL
      OR (
        CASE frequencia_monitoramento
          WHEN '1h' THEN ultima_verificacao_em < NOW() - INTERVAL '1 hour'
          WHEN '3h' THEN ultima_verificacao_em < NOW() - INTERVAL '3 hours'
          WHEN '6h' THEN ultima_verificacao_em < NOW() - INTERVAL '6 hours'
          WHEN '12h' THEN ultima_verificacao_em < NOW() - INTERVAL '12 hours'
          WHEN '24h' THEN ultima_verificacao_em < NOW() - INTERVAL '24 hours'
          ELSE ultima_verificacao_em < NOW() - INTERVAL '6 hours'
        END
      )
    )
    ORDER BY ultima_verificacao_em ASC NULLS FIRST
    LIMIT 50
  `);

  for (const proc of processes) {
    await legalMonitoringQueue.add('check-process', {
      type: 'check-process',
      processoId: proc.id,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  console.log(`[legal-monitoring] Scheduled ${processes.length} processes for checking`);
  await safeSystemLog(prisma, {
    source: 'legal-monitoring',
    message: `Agendamento: ${processes.length} processos elegíveis para verificação`,
  });
}

/**
 * Retry failed alerts
 */
async function handleRetryFailedAlerts() {
  const alerts = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM alertas_processo WHERE status_envio = 'falha' AND criado_em > NOW() - INTERVAL '7 days' LIMIT 20`
  );

  for (const alert of alerts) {
    await prisma.$queryRawUnsafe(
      `UPDATE alertas_processo SET status_envio = 'pendente'::alert_send_status, erro_envio = NULL WHERE id = $1::uuid`,
      alert.id
    );
  }

  console.log(`[legal-monitoring] Retried ${alerts.length} failed alerts`);
}

// ── Scheduler: run every 5 minutes ──
setInterval(async () => {
  try {
    await legalMonitoringQueue.add('schedule-checks', { type: 'schedule-checks' }, {
      removeOnComplete: 10,
      removeOnFail: 10,
    });
  } catch (err) {
    console.error('[legal-monitoring] Failed to schedule:', err);
  }
}, 5 * 60 * 1000);

// Initial schedule on startup
setTimeout(async () => {
  try {
    await legalMonitoringQueue.add('schedule-checks', { type: 'schedule-checks' }, {
      removeOnComplete: 10,
      removeOnFail: 10,
    });
    console.log('[legal-monitoring] Initial scheduling done');
  } catch (err) {
    console.error('[legal-monitoring] Failed initial schedule:', err);
  }
}, 5000);

// Event handlers
scrapeWorker.on('completed', (job) => console.log(`Scrape job ${job.id} completed`));
scrapeWorker.on('failed', (job, err) => console.error(`Scrape job ${job?.id} failed:`, err));
legalMonitoringWorker.on('completed', (job) => console.log(`Legal monitoring job ${job.id} completed`));
legalMonitoringWorker.on('failed', (job, err) => console.error(`Legal monitoring job ${job?.id} failed:`, err));

console.log('Worker started: scrape + legal-monitoring queues');
