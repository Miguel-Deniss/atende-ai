import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import { subscribe } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await requirePermission("company:view_conversations");
  if (response) return response;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          // conexão já fechada
        }
      };

      const unsubscribe = subscribe(user.companyId, (type, data) =>
        send(type, data)
      );

      send("ready", { ts: Date.now() });

      const heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() });
      }, 15000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // stream já fechado
        }
      };

      request.signal.addEventListener("abort", close);
      request.signal.addEventListener("close", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
