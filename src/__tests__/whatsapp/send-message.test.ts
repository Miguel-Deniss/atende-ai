import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendWhatsAppMessage,
  WHATSAPP_GRAPH_VERSION,
} from "@/lib/whatsapp/send-message";

describe("sendWhatsAppMessage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve enviar mensagem usando phoneNumberId e accessToken da empresa", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await sendWhatsAppMessage({
      phoneNumberId: "PHONE_A",
      accessToken: "TOKEN_A",
      to: "5511999999999",
      message: "Olá!",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/PHONE_A/messages`,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer TOKEN_A",
        },
      })
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "5511999999999",
      type: "text",
      text: { body: "Olá!" },
    });
  });

  it("deve usar os dados de cada empresa (isolação de token)", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await sendWhatsAppMessage({
      phoneNumberId: "PHONE_A",
      accessToken: "TOKEN_A",
      to: "111",
      message: "m1",
    });
    await sendWhatsAppMessage({
      phoneNumberId: "PHONE_B",
      accessToken: "TOKEN_B",
      to: "222",
      message: "m2",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/PHONE_A/messages"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer TOKEN_A" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/PHONE_B/messages"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer TOKEN_B" }),
      })
    );
  });

  it("deve lançar erro quando a API retorna erro", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(
      sendWhatsAppMessage({
        phoneNumberId: "PHONE_A",
        accessToken: "TOKEN_A",
        to: "5511999999999",
        message: "Oi",
      })
    ).rejects.toThrow("WhatsApp API retornou 400");
  });

  it("deve lançar erro quando o fetch falha", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(
      sendWhatsAppMessage({
        phoneNumberId: "PHONE_A",
        accessToken: "TOKEN_A",
        to: "5511999999999",
        message: "Oi",
      })
    ).rejects.toThrow("network down");
  });
});
