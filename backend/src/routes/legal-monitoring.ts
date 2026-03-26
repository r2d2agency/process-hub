import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import { DataJudConnector } from '../lib/datajud-connector';
import { DataJudEndpointResolver } from '../lib/datajud-endpoint-resolver';
import { safeSystemLog, toErrorMessage } from '../lib/system-log';

// Helper: standard response
function ok(data: any, message?: string) {
  return { success: true, message, data };
}
function fail(message: string, errors?: any) {
  return { success: false, message, errors };
}
function paginated(data: any[], meta: { page: number; per_page: number; total: number }) {
  return {
    success: true,
    data,
    meta: { ...meta, total_pages: Math.ceil(meta.total / meta.per_page) },
  };
}

export async function legalMonitoringRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('onRequest', (app as any).authenticate);

  // ── Dashboard ──
  app.get('/dashboard', async () => {
    const [totalProcessos, ativos, comAlerta, totalEventos, ultimasVerificacoes] =
      await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM processos_monitorados`),
        prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM processos_monitorados WHERE status_monitoramento = 'ativo'`),
        prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM processos_monitorados WHERE possui_alerta_pendente = true`),
        prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM eventos_detectados WHERE status = 'novo'`),
        prisma.$queryRawUnsafe<any[]>(`SELECT * FROM verificacoes_processo ORDER BY criado_em DESC LIMIT 10`),
      ]);

    return ok({
      totalProcessos: totalProcessos[0]?.count || 0,
      processosAtivos: ativos[0]?.count || 0,
      comAlertaPendente: comAlerta[0]?.count || 0,
      eventosNovos: totalEventos[0]?.count || 0,
      ultimasVerificacoes,
    });
  });

  // ── List processes ──
  app.get('/processes', async (request) => {
    const q = request.query as any;
    const page = parseInt(q.page || '1');
    const perPage = parseInt(q.per_page || '20');
    const offset = (page - 1) * perPage;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (q.numero_processo) {
      conditions.push(`numero_processo_normalizado LIKE $${idx++}`);
      params.push(`%${DataJudEndpointResolver.normalizeProcessNumber(q.numero_processo)}%`);
    }
    if (q.tribunal) { conditions.push(`tribunal = $${idx++}`); params.push(q.tribunal); }
    if (q.cliente_id) { conditions.push(`cliente_id = $${idx++}`); params.push(q.cliente_id); }
    if (q.status_monitoramento) { conditions.push(`status_monitoramento = $${idx++}::monitoring_status`); params.push(q.status_monitoramento); }
    if (q.prioridade) { conditions.push(`prioridade = $${idx++}::monitoring_priority`); params.push(q.prioridade); }
    if (q.possui_alerta_pendente === 'true') { conditions.push(`possui_alerta_pendente = true`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, c.name as cliente_nome FROM processos_monitorados p LEFT JOIN clients c ON c.id = p.cliente_id ${where} ORDER BY p.criado_em DESC LIMIT $${idx++} OFFSET $${idx++}`,
        ...params, perPage, offset
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int as count FROM processos_monitorados ${where}`,
        ...params
      ),
    ]);

    return paginated(rows, { page, per_page: perPage, total: countResult[0]?.count || 0 });
  });

  // ── Create process ──
  app.post('/processes', async (request, reply) => {
    const body = request.body as any;
    if (!body?.numero_processo) return reply.status(400).send(fail('numero_processo é obrigatório'));

    const numero = body.numero_processo.trim();
    if (!DataJudEndpointResolver.isValidCNJNumber(numero)) {
      return reply.status(400).send(fail('Número CNJ inválido. Formato esperado: NNNNNNN-DD.AAAA.J.TT.OOOO'));
    }

    let tribunal = (body.tribunal || 'auto').toLowerCase();
    if (tribunal === 'auto') {
      const detected = DataJudEndpointResolver.detectTribunalFromNumber(numero);
      if (!detected) return reply.status(400).send(fail('Não foi possível detectar o tribunal automaticamente. Informe manualmente.'));
      tribunal = detected;
    }

    if (!DataJudEndpointResolver.isTribunalSupported(tribunal)) {
      return reply.status(400).send(fail(`Tribunal '${tribunal}' não suportado. Suportados: ${DataJudEndpointResolver.getSupportedTribunals().join(', ')}`));
    }

    const normalized = DataJudEndpointResolver.normalizeProcessNumber(numero);

    // Check for duplicate
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM processos_monitorados WHERE numero_processo_normalizado = $1 AND cliente_id = $2`,
      normalized, body.cliente_id || null
    );
    if (existing.length > 0) {
      return reply.status(409).send(fail('Este processo já está cadastrado para este cliente'));
    }

    const [result] = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO processos_monitorados (numero_processo, numero_processo_normalizado, tribunal, fonte_principal, cliente_id, advogado_responsavel_id, tags, observacoes_internas, prioridade, frequencia_monitoramento, status_monitoramento, canal_alerta_preferencial)
       VALUES ($1, $2, $3, 'datajud', $4, $5, $6::text[], $7, $8::monitoring_priority, $9, 'ativo'::monitoring_status, $10::alert_channel)
       RETURNING *`,
      numero, normalized, tribunal,
      body.cliente_id || null,
      body.advogado_responsavel_id || null,
      body.tags || [],
      body.observacoes_internas || null,
      body.prioridade || 'media',
      body.frequencia_monitoramento || '6h',
      body.canal_alerta_preferencial || 'email'
    );

    await safeSystemLog(prisma, { source: 'legal-monitoring', message: `Processo cadastrado: ${numero} (${tribunal})`, meta: { processoId: result.id } }, app.log);

    return reply.status(201).send(ok(result, 'Processo cadastrado com sucesso'));
  });

  // ── Import batch ──
  app.post('/processes/import', async (request, reply) => {
    const body = request.body as any;
    if (!Array.isArray(body?.processos)) return reply.status(400).send(fail('Envie um array "processos"'));

    const results = { success: 0, errors: [] as string[] };
    for (const item of body.processos) {
      try {
        const numero = item.numero_processo?.trim();
        if (!numero || !DataJudEndpointResolver.isValidCNJNumber(numero)) {
          results.errors.push(`${numero || 'vazio'}: número CNJ inválido`);
          continue;
        }
        let tribunal = (item.tribunal || 'auto').toLowerCase();
        if (tribunal === 'auto') {
          tribunal = DataJudEndpointResolver.detectTribunalFromNumber(numero) || '';
          if (!tribunal) { results.errors.push(`${numero}: tribunal não detectado`); continue; }
        }
        const normalized = DataJudEndpointResolver.normalizeProcessNumber(numero);
        await prisma.$queryRawUnsafe(
          `INSERT INTO processos_monitorados (numero_processo, numero_processo_normalizado, tribunal, fonte_principal, cliente_id, prioridade, frequencia_monitoramento)
           VALUES ($1, $2, $3, 'datajud', $4, $5::monitoring_priority, $6)
           ON CONFLICT (numero_processo_normalizado, cliente_id) DO NOTHING`,
          numero, normalized, tribunal, item.cliente_id || null, item.prioridade || 'media', item.frequencia_monitoramento || '6h'
        );
        results.success++;
      } catch (e: any) {
        results.errors.push(`${item.numero_processo || '?'}: ${e.message}`);
      }
    }

    return ok(results, `Importação concluída: ${results.success} sucesso, ${results.errors.length} erros`);
  });

  // ── Process detail ──
  app.get('/processes/:id', async (request, reply) => {
    const { id } = request.params as any;
    const [row] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT p.*, c.name as cliente_nome FROM processos_monitorados p LEFT JOIN clients c ON c.id = p.cliente_id WHERE p.id = $1::uuid`, id
    );
    if (!row) return reply.status(404).send(fail('Processo não encontrado'));
    return ok(row);
  });

  // ── Update process ──
  app.put('/processes/:id', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const allowedFields: Record<string, string> = {
      observacoes_internas: 'text',
      prioridade: 'monitoring_priority',
      frequencia_monitoramento: 'text',
      canal_alerta_preferencial: 'alert_channel',
      tags: 'text[]',
    };

    for (const [key, cast] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx}::${cast}`);
        params.push(body[key]);
        idx++;
      }
    }

    if (fields.length === 0) return reply.status(400).send(fail('Nenhum campo para atualizar'));

    fields.push('atualizado_em = NOW()');
    params.push(id);
    const [row] = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE processos_monitorados SET ${fields.join(', ')} WHERE id = $${idx}::uuid RETURNING *`, ...params
    );
    if (!row) return reply.status(404).send(fail('Processo não encontrado'));
    return ok(row);
  });

  // ── Pause / Resume / Archive ──
  for (const [action, status] of [['pause', 'pausado'], ['resume', 'ativo'], ['archive', 'arquivado']] as const) {
    app.post(`/processes/:id/${action}`, async (request, reply) => {
      const { id } = request.params as any;
      const [row] = await prisma.$queryRawUnsafe<any[]>(
        `UPDATE processos_monitorados SET status_monitoramento = $1::monitoring_status, atualizado_em = NOW() WHERE id = $2::uuid RETURNING *`,
        status, id
      );
      if (!row) return reply.status(404).send(fail('Processo não encontrado'));
      return ok(row, `Processo ${action === 'pause' ? 'pausado' : action === 'resume' ? 'reativado' : 'arquivado'}`);
    });
  }

  // ── Delete process ──
  app.delete('/processes/:id', async (request, reply) => {
    const { id } = request.params as any;
    await prisma.$queryRawUnsafe(`DELETE FROM processos_monitorados WHERE id = $1::uuid`, id);
    return ok(null, 'Processo removido');
  });

  // ── Reprocess ──
  app.post('/processes/:id/reprocess', async (request, reply) => {
    const { id } = request.params as any;
    const [process] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM processos_monitorados WHERE id = $1::uuid`, id
    );
    if (!process) return reply.status(404).send(fail('Processo não encontrado'));

    try {
      const startTime = Date.now();

      // Create verification record
      const [verificacao] = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO verificacoes_processo (processo_monitorado_id, tipo_consulta, fonte, status, iniciou_em)
         VALUES ($1::uuid, 'datajud', 'datajud', 'executando'::check_status, NOW()) RETURNING *`,
        id
      );

      // Fetch from DataJud
      const movements = await DataJudConnector.fetchProcessMovements(process.numero_processo, process.tribunal);
      const elapsed = Date.now() - startTime;

      // Insert new movements (skip duplicates via ON CONFLICT)
      let newCount = 0;
      for (const mov of movements) {
        try {
          await prisma.$queryRawUnsafe(
            `INSERT INTO movimentacoes_processo (processo_monitorado_id, fonte, data_movimentacao, descricao_original, descricao_normalizada, hash_movimentacao, relevancia, origem_evento)
             VALUES ($1::uuid, $2, $3::timestamptz, $4, $5, $6, $7, $8)
             ON CONFLICT (processo_monitorado_id, hash_movimentacao) DO NOTHING`,
            id, mov.origemEvento, mov.dataMovimentacao, mov.descricaoOriginal, mov.descricaoNormalizada, mov.hashMovimentacao, mov.relevancia, mov.origemEvento
          );
          newCount++;
        } catch { /* duplicate, skip */ }
      }

      const houveMudanca = newCount > 0;

      // Update verification
      await prisma.$queryRawUnsafe(
        `UPDATE verificacoes_processo SET status = 'sucesso'::check_status, finalizou_em = NOW(), tempo_execucao_ms = $1, houve_mudanca = $2, resumo_resultado = $3 WHERE id = $4::uuid`,
        elapsed, houveMudanca, `${movements.length} movimentações encontradas, ${newCount} novas`, verificacao.id
      );

      // Update process timestamps
      await prisma.$queryRawUnsafe(
        `UPDATE processos_monitorados SET ultima_verificacao_em = NOW(), ultima_fonte_consultada = 'datajud', atualizado_em = NOW()
         ${houveMudanca ? ", ultima_movimentacao_em = NOW()" : ""} WHERE id = $1::uuid`, id
      );

      // Create event if changes detected
      if (houveMudanca) {
        await prisma.$queryRawUnsafe(
          `INSERT INTO eventos_detectados (processo_monitorado_id, verificacao_id, tipo_evento, titulo, descricao, prioridade)
           VALUES ($1::uuid, $2::uuid, 'nova_movimentacao', 'Novas movimentações detectadas', $3, $4::monitoring_priority)`,
          id, verificacao.id, `${newCount} nova(s) movimentação(ões) detectada(s)`, process.prioridade || 'media'
        );

        // Generate alert
        await prisma.$queryRawUnsafe(
          `INSERT INTO alertas_processo (processo_monitorado_id, canal, mensagem, prioridade)
           VALUES ($1::uuid, $2::alert_channel, $3, $4::monitoring_priority)`,
          id, process.canal_alerta_preferencial || 'email',
          `Processo ${process.numero_processo}: ${newCount} nova(s) movimentação(ões)`,
          process.prioridade || 'media'
        );

        await prisma.$queryRawUnsafe(
          `UPDATE processos_monitorados SET possui_alerta_pendente = true WHERE id = $1::uuid`, id
        );
      }

      // Log integration
      await prisma.$queryRawUnsafe(
        `INSERT INTO logs_integracao (processo_monitorado_id, fonte, tipo_operacao, status, request_resumido, response_resumido)
         VALUES ($1::uuid, 'datajud', 'reprocess', 'ok', $2::jsonb, $3::jsonb)`,
        id,
        JSON.stringify({ numero: process.numero_processo, tribunal: process.tribunal }),
        JSON.stringify({ movimentos: movements.length, novos: newCount })
      );

      return ok({ movimentacoes: movements.length, novas: newCount, houveMudanca }, 'Reprocessamento concluído');
    } catch (error: any) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO logs_integracao (processo_monitorado_id, fonte, tipo_operacao, status, erro)
         VALUES ($1::uuid, 'datajud', 'reprocess', 'erro', $2)`,
        id, toErrorMessage(error)
      );
      return reply.status(500).send(fail(`Erro ao reprocessar: ${toErrorMessage(error)}`));
    }
  });

  // ── History sub-routes ──
  app.get('/processes/:id/checks', async (request) => {
    const { id } = request.params as any;
    const q = request.query as any;
    const page = parseInt(q.page || '1');
    const perPage = parseInt(q.per_page || '20');
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM verificacoes_processo WHERE processo_monitorado_id = $1::uuid ORDER BY criado_em DESC LIMIT $2 OFFSET $3`,
      id, perPage, (page - 1) * perPage
    );
    return ok(rows);
  });

  app.get('/processes/:id/movements', async (request) => {
    const { id } = request.params as any;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM movimentacoes_processo WHERE processo_monitorado_id = $1::uuid ORDER BY data_movimentacao DESC NULLS LAST, criado_em DESC`,
      id
    );
    return ok(rows);
  });

  app.get('/processes/:id/events', async (request) => {
    const { id } = request.params as any;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM eventos_detectados WHERE processo_monitorado_id = $1::uuid ORDER BY criado_em DESC`, id
    );
    return ok(rows);
  });

  app.get('/processes/:id/alerts', async (request) => {
    const { id } = request.params as any;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM alertas_processo WHERE processo_monitorado_id = $1::uuid ORDER BY criado_em DESC`, id
    );
    return ok(rows);
  });

  app.get('/processes/:id/logs', async (request) => {
    const { id } = request.params as any;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM logs_integracao WHERE processo_monitorado_id = $1::uuid ORDER BY criado_em DESC`, id
    );
    return ok(rows);
  });

  // ── Alerts module-wide ──
  app.get('/alerts', async (request) => {
    const q = request.query as any;
    const page = parseInt(q.page || '1');
    const perPage = parseInt(q.per_page || '20');
    const statusFilter = q.status_envio ? `WHERE a.status_envio = '${q.status_envio}'` : '';
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.*, p.numero_processo, p.tribunal FROM alertas_processo a
       LEFT JOIN processos_monitorados p ON p.id = a.processo_monitorado_id
       ${statusFilter} ORDER BY a.criado_em DESC LIMIT $1 OFFSET $2`,
      perPage, (page - 1) * perPage
    );
    return ok(rows);
  });

  app.post('/alerts/:id/retry', async (request, reply) => {
    const { id } = request.params as any;
    const [row] = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE alertas_processo SET status_envio = 'pendente'::alert_send_status, erro_envio = NULL WHERE id = $1::uuid RETURNING *`, id
    );
    if (!row) return reply.status(404).send(fail('Alerta não encontrado'));
    return ok(row, 'Alerta reenviado para fila');
  });

  // ── Settings ──
  app.get('/settings', async (request) => {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM configuracoes_monitoramento LIMIT 50`);
    return ok(rows);
  });

  app.put('/settings', async (request) => {
    const body = request.body as any;
    const [row] = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO configuracoes_monitoramento (cliente_id, frequencia_padrao, canais_alerta_padrao, ativo)
       VALUES ($1::uuid, $2, $3::alert_channel[], $4)
       ON CONFLICT (cliente_id) DO UPDATE SET frequencia_padrao = $2, canais_alerta_padrao = $3::alert_channel[], ativo = $4, atualizado_em = NOW()
       RETURNING *`,
      body.cliente_id || null, body.frequencia_padrao || '6h', body.canais_alerta_padrao || ['email'], body.ativo !== false
    );
    return ok(row, 'Configurações salvas');
  });

  // ── Jobs endpoints ──
  app.post('/jobs/run-datajud-check', async (request, reply) => {
    const body = request.body as any;
    if (!body?.processo_monitorado_id) return reply.status(400).send(fail('processo_monitorado_id é obrigatório'));

    // Delegate to reprocess logic
    const fakeRequest = { params: { id: body.processo_monitorado_id }, body: {} } as any;
    // Just redirect internally
    const [process] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM processos_monitorados WHERE id = $1::uuid`, body.processo_monitorado_id
    );
    if (!process) return reply.status(404).send(fail('Processo não encontrado'));

    return reply.redirect(307, `/api/legal-monitoring/processes/${body.processo_monitorado_id}/reprocess`);
  });

  // ── Health ──
  app.get('/health', async () => {
    const datajudAvailable = DataJudConnector.isAvailable();
    const [count] = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM processos_monitorados`);
    return ok({
      status: 'ok',
      datajud: datajudAvailable ? 'configured' : 'missing_api_key',
      processosMonitorados: count?.count || 0,
      tribunaisSuportados: DataJudEndpointResolver.getSupportedTribunals(),
      timestamp: new Date().toISOString(),
    });
  });
}
