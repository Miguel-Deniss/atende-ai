export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  companyId?: string;
  action?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel: LogLevel =
  process.env.NODE_ENV === "production" ? "INFO" : "DEBUG";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
  const base = {
    t: entry.timestamp,
    lvl: entry.level,
    msg: entry.message,
  };

  const enriched: Record<string, unknown> = { ...base };
  if (entry.requestId) enriched.req = entry.requestId;
  if (entry.userId) enriched.uid = entry.userId;
  if (entry.companyId) enriched.cid = entry.companyId;
  if (entry.action) enriched.act = entry.action;
  if (entry.duration !== undefined) enriched.dur = `${entry.duration}ms`;
  if (entry.error) enriched.err = entry.error;
  if (entry.metadata) enriched.meta = entry.metadata;

  return JSON.stringify(enriched);
}

function createEntry(
  level: LogLevel,
  message: string,
  meta?: Partial<LogEntry>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  debug(message: string, meta?: Partial<LogEntry>) {
    if (!shouldLog("DEBUG")) return;
    const entry = createEntry("DEBUG", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.log(formatLog(entry));
    } else {
      console.debug(`[DEBUG] ${message}`, meta || "");
    }
  },

  info(message: string, meta?: Partial<LogEntry>) {
    if (!shouldLog("INFO")) return;
    const entry = createEntry("INFO", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.log(formatLog(entry));
    } else {
      console.info(`[INFO] ${message}`, meta || "");
    }
  },

  warn(message: string, meta?: Partial<LogEntry>) {
    if (!shouldLog("WARN")) return;
    const entry = createEntry("WARN", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.warn(formatLog(entry));
    } else {
      console.warn(`[WARN] ${message}`, meta || "");
    }
  },

  error(message: string, meta?: Partial<LogEntry>) {
    if (!shouldLog("ERROR")) return;
    const entry = createEntry("ERROR", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.error(formatLog(entry));
    } else {
      console.error(`[ERROR] ${message}`, meta || "");
    }
  },
};
