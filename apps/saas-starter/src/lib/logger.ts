/**
 * Structured logging for Product Factory operations (deterministic, JSON lines).
 * Does not replace Core telemetry — product-side observability only.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogRecord = {
  level: LogLevel;
  msg: string;
  at: string;
  service: string;
  correlation_id?: string;
  data?: Record<string, unknown>;
};

const SERVICE = "grabber-product-factory";

function emit(level: LogLevel, msg: string, data?: Record<string, unknown>, correlation_id?: string) {
  const record: LogRecord = {
    level,
    msg,
    at: new Date().toISOString(),
    service: SERVICE,
    ...(correlation_id ? { correlation_id } : {}),
    ...(data ? { data } : {}),
  };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  return record;
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>, id?: string) =>
    emit("debug", msg, data, id),
  info: (msg: string, data?: Record<string, unknown>, id?: string) =>
    emit("info", msg, data, id),
  warn: (msg: string, data?: Record<string, unknown>, id?: string) =>
    emit("warn", msg, data, id),
  error: (msg: string, data?: Record<string, unknown>, id?: string) =>
    emit("error", msg, data, id),
};

export class FactoryError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: string[];

  constructor(
    code: string,
    message: string,
    opts: { status?: number; details?: string[] } = {},
  ) {
    super(message);
    this.name = "FactoryError";
    this.code = code;
    this.status = opts.status ?? 400;
    this.details = opts.details ?? [];
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export function toErrorResponse(err: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  if (err instanceof FactoryError) {
    logger.error(err.message, { code: err.code, details: err.details });
    return { status: err.status, body: err.toJSON() };
  }
  const message = err instanceof Error ? err.message : String(err);
  logger.error(message);
  return {
    status: 500,
    body: {
      ok: false,
      error: { code: "INTERNAL", message, details: [] },
    },
  };
}
