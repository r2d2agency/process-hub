import { PrismaClient } from '@prisma/client';

type LogLevel = 'info' | 'warn' | 'error';

type LogEntry = {
  level?: LogLevel;
  source: string;
  message: string;
  meta?: unknown;
};

type LoggerLike = {
  info?: (obj: unknown, msg?: string) => void;
  warn?: (obj: unknown, msg?: string) => void;
  error?: (obj: unknown, msg?: string) => void;
};

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'cookie', 'secret'];

export function sanitizeForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeForLog);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey));
        return [key, isSensitive ? '[REDACTED]' : sanitizeForLog(nestedValue)];
      })
    );
  }

  return value;
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'Erro interno';
}

function serializeMeta(meta: unknown) {
  if (meta === undefined) return undefined;
  if (typeof meta === 'string') return meta;
  return JSON.stringify(sanitizeForLog(meta));
}

export async function safeSystemLog(prisma: PrismaClient, entry: LogEntry, logger?: LoggerLike) {
  const level = entry.level || 'info';
  const data = {
    level,
    source: entry.source,
    message: entry.message,
    meta: serializeMeta(entry.meta),
  };

  try {
    await prisma.systemLog.create({ data });
  } catch (error) {
    const payload = { error: toErrorMessage(error), failedLog: data };
    if (level === 'error') logger?.error?.(payload, 'system_log_write_failed');
    else if (level === 'warn') logger?.warn?.(payload, 'system_log_write_failed');
    else logger?.info?.(payload, 'system_log_write_failed');
  }
}