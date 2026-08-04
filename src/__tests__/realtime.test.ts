import { describe, it, expect, vi } from "vitest";
import { publish, subscribe } from "@/lib/realtime";

describe("realtime", () => {
  it("deve entregar eventos apenas para a empresa assinante", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubscribeA = subscribe("company-1", listenerA);
    subscribe("company-2", listenerB);

    publish("company-1", "message", { conversationId: "conv-1" });
    publish("company-2", "conversation", { id: "conv-2" });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerA).toHaveBeenCalledWith("message", {
      conversationId: "conv-1",
    });
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledWith("conversation", { id: "conv-2" });

    unsubscribeA();
  });

  it("não deve entregar mais eventos após unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe("company-1", listener);

    publish("company-1", "conversation", { id: "conv-1" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    publish("company-1", "conversation", { id: "conv-1" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
