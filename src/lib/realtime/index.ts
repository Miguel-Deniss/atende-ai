import { EventEmitter } from "events";

interface RealtimeEvent {
  companyId: string;
  type: string;
  data: unknown;
}

const emitter = new EventEmitter();
const CHANNEL = "atendeai:realtime";

export type RealtimeListener = (type: string, data: unknown) => void;

export function subscribe(
  companyId: string,
  listener: RealtimeListener
): () => void {
  const handler = (event: RealtimeEvent) => {
    if (event.companyId === companyId) {
      listener(event.type, event.data);
    }
  };

  emitter.on(CHANNEL, handler);

  return () => {
    emitter.off(CHANNEL, handler);
  };
}

export function publish(companyId: string, type: string, data: unknown): void {
  emitter.emit(CHANNEL, { companyId, type, data });
}
