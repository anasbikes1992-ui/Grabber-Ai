type LogLevel = "info" | "warn" | "error";

type LogContext = {
  event: string;
  requestId?: string;
  details?: Record<string, unknown>;
};

export function log(level: LogLevel, context: LogContext) {
  let details: Record<string, unknown> = {};
  try {
    details = JSON.parse(JSON.stringify(context.details || {})) as Record<string, unknown>;
  } catch {
    details = { serialization_error: true };
  }

  const entry = {
    ts: new Date().toISOString(),
    level,
    event: context.event,
    request_id: context.requestId || "n/a",
    details,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }
  console.info(JSON.stringify(entry));
}
