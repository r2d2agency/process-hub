-- Legal Monitoring Module

CREATE TYPE monitoring_status AS ENUM ('ativo', 'pausado', 'arquivado');
CREATE TYPE monitoring_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE check_status AS ENUM ('pendente', 'executando', 'sucesso', 'erro', 'timeout');
CREATE TYPE event_status AS ENUM ('novo', 'lido', 'resolvido');
CREATE TYPE alert_send_status AS ENUM ('pendente', 'enviado', 'falha', 'cancelado');
CREATE TYPE alert_channel AS ENUM ('email', 'whatsapp', 'webhook', 'sistema');

-- 1. processos_monitorados
CREATE TABLE processos_monitorados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT NOT NULL,
  numero_processo_normalizado TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  fonte_principal TEXT NOT NULL DEFAULT 'datajud',
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  advogado_responsavel_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  observacoes_internas TEXT,
  prioridade monitoring_priority NOT NULL DEFAULT 'media',
  frequencia_monitoramento TEXT NOT NULL DEFAULT '6h',
  status_monitoramento monitoring_status NOT NULL DEFAULT 'ativo',
  canal_alerta_preferencial alert_channel NOT NULL DEFAULT 'email',
  ultima_verificacao_em TIMESTAMPTZ,
  ultima_movimentacao_em TIMESTAMPTZ,
  ultima_fonte_consultada TEXT,
  possui_alerta_pendente BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proc_mon_cliente ON processos_monitorados(cliente_id);
CREATE INDEX idx_proc_mon_status ON processos_monitorados(status_monitoramento);
CREATE INDEX idx_proc_mon_numero ON processos_monitorados(numero_processo_normalizado);
CREATE UNIQUE INDEX idx_proc_mon_unique ON processos_monitorados(numero_processo_normalizado, cliente_id);

-- 2. verificacoes_processo
CREATE TABLE verificacoes_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_monitorado_id UUID NOT NULL REFERENCES processos_monitorados(id) ON DELETE CASCADE,
  tipo_consulta TEXT NOT NULL DEFAULT 'datajud',
  fonte TEXT NOT NULL DEFAULT 'datajud',
  status check_status NOT NULL DEFAULT 'pendente',
  iniciou_em TIMESTAMPTZ,
  finalizou_em TIMESTAMPTZ,
  tempo_execucao_ms INTEGER,
  houve_mudanca BOOLEAN DEFAULT false,
  resumo_resultado TEXT,
  payload_resumido JSONB,
  erro_resumido TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verif_processo ON verificacoes_processo(processo_monitorado_id);

-- 3. movimentacoes_processo
CREATE TABLE movimentacoes_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_monitorado_id UUID NOT NULL REFERENCES processos_monitorados(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL DEFAULT 'datajud',
  data_movimentacao TIMESTAMPTZ,
  descricao_original TEXT NOT NULL,
  descricao_normalizada TEXT,
  hash_movimentacao TEXT NOT NULL,
  relevancia TEXT DEFAULT 'normal',
  origem_evento TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mov_processo ON movimentacoes_processo(processo_monitorado_id);
CREATE UNIQUE INDEX idx_mov_hash ON movimentacoes_processo(processo_monitorado_id, hash_movimentacao);

-- 4. eventos_detectados
CREATE TABLE eventos_detectados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_monitorado_id UUID NOT NULL REFERENCES processos_monitorados(id) ON DELETE CASCADE,
  verificacao_id UUID REFERENCES verificacoes_processo(id) ON DELETE SET NULL,
  tipo_evento TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade monitoring_priority NOT NULL DEFAULT 'media',
  status event_status NOT NULL DEFAULT 'novo',
  dados_extras JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evento_processo ON eventos_detectados(processo_monitorado_id);
CREATE INDEX idx_evento_status ON eventos_detectados(status);

-- 5. alertas_processo
CREATE TABLE alertas_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_monitorado_id UUID NOT NULL REFERENCES processos_monitorados(id) ON DELETE CASCADE,
  evento_detectado_id UUID REFERENCES eventos_detectados(id) ON DELETE SET NULL,
  canal alert_channel NOT NULL DEFAULT 'email',
  mensagem TEXT NOT NULL,
  prioridade monitoring_priority NOT NULL DEFAULT 'media',
  status_envio alert_send_status NOT NULL DEFAULT 'pendente',
  enviado_em TIMESTAMPTZ,
  erro_envio TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerta_processo ON alertas_processo(processo_monitorado_id);
CREATE INDEX idx_alerta_status ON alertas_processo(status_envio);

-- 6. logs_integracao
CREATE TABLE logs_integracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_monitorado_id UUID REFERENCES processos_monitorados(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL DEFAULT 'datajud',
  tipo_operacao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  request_resumido JSONB,
  response_resumido JSONB,
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_integ_processo ON logs_integracao(processo_monitorado_id);
CREATE INDEX idx_log_integ_criado ON logs_integracao(criado_em);

-- 7. configuracoes_monitoramento
CREATE TABLE configuracoes_monitoramento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  frequencia_padrao TEXT NOT NULL DEFAULT '6h',
  canais_alerta_padrao alert_channel[] DEFAULT '{email}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
