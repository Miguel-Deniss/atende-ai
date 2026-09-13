import { EventEmitter } from "node:events";
import { Client, Pool } from "pg";
import { logger } from "@/lib/logger/structured";

interface RealtimeEvent {
  companyId: string;
  type: string;
  data: unknown;
  source?: string;
}

const emitter = new EventEmitter();
const CHANNEL = "atendeai_realtime";
const EVENT_NAME = "realtime";
const instanceId = crypto.randomUUID();
let listenerClient: Client | null = null;
let connecting = false;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

export type RealtimeListener = (type: string, data: unknown) => void;

async function connectListener(): Promise<void> {
  if (process.env.NODE_ENV === "test" || listenerClient || connecting) return;
  connecting = true;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    client.on("notification", (notification) => {
      if (!notification.payload) return;
      try {
        const event = JSON.parse(notification.payload) as RealtimeEvent;
        if (event.source !== instanceId) emitter.emit(EVENT_NAME, event);
      } catch {
        logger.warn("Evento realtime invalido descartado", { action: "realtime_invalid_event" });
      }
    });
    client.on("error", () => {
      listenerClient = null;
      setTimeout(() => void connectListener(), 1000);
    });
    listenerClient = client;
  } catch (error) {
    await client.end().catch(() => undefined);
    logger.error("Falha ao conectar canal realtime do PostgreSQL", {
      action: "realtime_connect_failed",
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
    setTimeout(() => void connectListener(), 2000);
  } finally {
    connecting = false;
  }
}

export function subscribe(companyId: string, listener: RealtimeListener): () => void {
  void connectListener();
  const handler = (event: RealtimeEvent) => {
    if (event.companyId === companyId) listener(event.type, event.data);
  };
  emitter.on(EVENT_NAME, handler);
  return () => emitter.off(EVENT_NAME, handler);
}

export function publish(companyId: string, type: string, data: unknown): void {
  const event: RealtimeEvent = { companyId, type, data, source: instanceId };
  emitter.emit(EVENT_NAME, event);
  if (process.env.NODE_ENV === "test") return;

  const payload = JSON.stringify(event);
  if (Buffer.byteLength(payload) > 7900) {
    logger.warn("Evento realtime excedeu o limite do PostgreSQL", {
      action: "realtime_event_too_large",
      companyId,
    });
    return;
  }
  void pool.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]).catch((error: unknown) => {
    logger.error("Falha ao publicar evento realtime", {
      action: "realtime_publish_failed",
      companyId,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  });
}
