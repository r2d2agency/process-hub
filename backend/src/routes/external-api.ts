import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

/**
 * External API — Webhook de entrada para sistemas externos.
 * Recebe movimentações processuais e cruza com regras cadastradas (CPF, OAB, keyword).
 * Quando há match, cria notificações e as envia pelas integrações configuradas.
 * 
 * Autenticação via API Key (X-API-Key header).
 */
export async function externalApiRoutes(app: FastifyInstance) {
  // API Key authentication
  app.addHook('preHandler', async (request, reply) => {
    const apiKey = request.headers['x-api-key'] as string;
    if (!apiKey || apiKey !== process.env.API_KEY) {
      reply.status(401).send({ error: 'Unauthorized. Provide valid X-API-Key header.' });
    }
  });

  /**
   * POST /api/v1/movements
   * 
   * Recebe uma movimentação processual de sistema externo.
   * Cruza com as regras ativas e gera notificações automáticas.
   * 
   * Body:
   * {
   *   "processNumber": "0001234-56.2024.8.26.0100",  // número do processo (CNJ)
   *   "court": "TJSP",                                 // tribunal
   *   "content": "Texto da movimentação...",            // conteúdo da publicação
   *   "title": "Intimação",                             // título (opcional)
   *   "publishedAt": "2024-01-15T10:00:00Z",           // data publicação (opcional)
   *   "sourceRef": "dje-sp",                            // referência da fonte (opcional)
   *   "involvedParties": [                              // partes envolvidas (opcional)
   *     { "name": "João Silva", "document": "123.456.789-00", "type": "cpf" },
   *     { "name": "Dra. Maria", "document": "12345/OAB-SP", "type": "oab" }
   *   ]
   * }
   */
  app.post('/movements', async (request) => {
    const body = request.body as any;

    if (!body.content) {
      return { error: 'Campo "content" é obrigatório', matched: false };
    }

    // 1. Find or create a source for external API
    let source = await prisma.source.findFirst({ where: { type: 'external-api' } });
    if (!source) {
      source = await prisma.source.create({
        data: { name: 'API Externa', type: 'external-api', status: 'active', active: true },
      });
    }

    // 2. Create the publication
    const publication = await prisma.publication.create({
      data: {
        sourceId: source.id,
        title: body.title || body.processNumber || 'Movimentação Externa',
        content: body.content,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        externalId: body.processNumber || null,
      },
    });

    // 3. Get all active rules
    const rules = await prisma.monitorRule.findMany({
      where: { active: true },
      include: { client: true },
    });

    // 4. Match against rules
    const matchedRules: any[] = [];
    const contentLower = body.content.toLowerCase();
    const fullText = `${body.content} ${body.processNumber || ''} ${body.title || ''}`.toLowerCase();

    // Also include involved parties documents in matching
    const involvedDocs = (body.involvedParties || []).map((p: any) => 
      (p.document || '').toLowerCase().replace(/[.\-\/]/g, '')
    );

    for (const rule of rules) {
      let matched = false;
      const valueLower = rule.value.toLowerCase();
      const valueClean = valueLower.replace(/[.\-\/]/g, '');

      switch (rule.type) {
        case 'cpf':
          // Match CPF in content or in involved parties
          matched = fullText.replace(/[.\-\/]/g, '').includes(valueClean) ||
                    involvedDocs.includes(valueClean);
          break;

        case 'oab':
          // Match OAB number in content or in involved parties
          matched = fullText.replace(/[.\-\/]/g, '').includes(valueClean) ||
                    involvedDocs.includes(valueClean);
          break;

        case 'cnj':
        case 'process':
          // Match process number
          matched = fullText.replace(/[.\-\/]/g, '').includes(valueClean);
          break;

        case 'keyword':
        default:
          // Keyword search in content
          matched = contentLower.includes(valueLower);
          break;
      }

      if (matched) {
        // Extract snippet around the match
        const idx = contentLower.indexOf(valueLower);
        const snippet = idx >= 0
          ? body.content.substring(Math.max(0, idx - 100), Math.min(body.content.length, idx + 200))
          : body.content.substring(0, 300);

        // Create match record
        const match = await prisma.match.create({
          data: {
            ruleId: rule.id,
            publicationId: publication.id,
            snippet,
          },
        });

        // Create notification for the client
        const notification = await prisma.notification.create({
          data: {
            clientId: rule.clientId,
            channel: 'whatsapp',
            subject: `Movimentação detectada: ${body.processNumber || rule.value}`,
            body: `Nova movimentação no processo ${body.processNumber || ''} (${body.court || 'N/A'}).\n\nRegra: ${rule.type} - ${rule.value}\n\nTrecho: ${snippet}`,
            status: 'pending',
          },
        });

        // Try to send via integrations
        await sendViaIntegrations(rule.clientId, notification.id, {
          clientName: rule.client.name,
          processNumber: body.processNumber,
          court: body.court,
          ruleType: rule.type,
          ruleValue: rule.value,
          snippet,
          title: body.title,
        });

        matchedRules.push({
          ruleId: rule.id,
          ruleType: rule.type,
          ruleValue: rule.value,
          clientId: rule.clientId,
          clientName: rule.client.name,
          matchId: match.id,
          notificationId: notification.id,
        });
      }
    }

    return {
      received: true,
      publicationId: publication.id,
      matched: matchedRules.length > 0,
      matchCount: matchedRules.length,
      matches: matchedRules,
    };
  });

  /**
   * POST /api/v1/movements/batch
   * 
   * Recebe múltiplas movimentações de uma vez.
   * Body: { movements: [...] }
   */
  app.post('/movements/batch', async (request) => {
    const { movements } = request.body as { movements: any[] };

    if (!Array.isArray(movements) || movements.length === 0) {
      return { error: 'Campo "movements" deve ser um array não vazio' };
    }

    const results = [];
    for (const mov of movements) {
      try {
        const result = await app.inject({
          method: 'POST',
          url: '/api/v1/movements',
          headers: request.headers as any,
          payload: mov,
        });
        results.push(JSON.parse(result.body));
      } catch (err: any) {
        results.push({ error: err.message, movement: mov.processNumber });
      }
    }

    return {
      total: movements.length,
      processed: results.filter(r => r.received).length,
      matched: results.filter(r => r.matched).length,
      results,
    };
  });

  /**
   * GET /api/v1/status
   * 
   * Retorna status do sistema e contagens.
   */
  app.get('/status', async () => {
    const [clients, rules, recentMatches, pendingNotifications] = await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.monitorRule.count({ where: { active: true } }),
      prisma.match.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.notification.count({ where: { status: 'pending' } }),
    ]);

    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      stats: {
        activeClients: clients,
        activeRules: rules,
        matchesLast24h: recentMatches,
        pendingNotifications,
      },
    };
  });
}

/**
 * Envia notificação pelas integrações configuradas do cliente.
 */
async function sendViaIntegrations(
  clientId: string,
  notificationId: string,
  data: {
    clientName: string;
    processNumber?: string;
    court?: string;
    ruleType: string;
    ruleValue: string;
    snippet: string;
    title?: string;
  }
) {
  try {
    const integrations = await prisma.integration.findMany({
      where: { clientId, active: true },
    });

    for (const integration of integrations) {
      const config = integration.config as any;

      if (integration.type === 'whatsapp' && config.apiKey) {
        try {
          // Send via WhatsApp API
          const message = `🔔 *Movimentação Processual*\n\n` +
            `👤 Cliente: ${data.clientName}\n` +
            `📋 Processo: ${data.processNumber || 'N/A'}\n` +
            `🏛️ Tribunal: ${data.court || 'N/A'}\n` +
            `🔍 Regra: ${data.ruleType} - ${data.ruleValue}\n` +
            `📄 ${data.title || 'Movimentação'}\n\n` +
            `📝 Trecho:\n${data.snippet}`;

          const response = await fetch(`${config.baseUrl || config.apiUrl}/message/sendText`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.apiKey,
            },
            body: JSON.stringify({
              number: (await prisma.client.findUnique({ where: { id: clientId } }))?.phone,
              text: message,
              instance: config.instanceName,
            }),
          });

          if (response.ok) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { status: 'sent', sentAt: new Date() },
            });
          } else {
            console.error('WhatsApp send failed:', await response.text());
            await prisma.notification.update({
              where: { id: notificationId },
              data: { status: 'error' },
            });
          }
        } catch (err) {
          console.error('WhatsApp integration error:', err);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'error' },
          });
        }
      }

      if (integration.type === 'webhook' && config.url) {
        try {
          await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
            body: JSON.stringify({
              event: 'movement_detected',
              clientId,
              ...data,
              notificationId,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error('Webhook integration error:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error sending via integrations:', err);
  }
}
