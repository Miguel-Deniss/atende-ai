import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    whatsAppConfig: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/security/encryption", () => ({
  decrypt: vi.fn(),
}));

vi.mock("@/lib/whatsapp/send-message", () => ({
  sendWhatsAppMessage: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { deliverWhatsAppMessage } from "@/lib/whatsapp/deliver";

describe("deliverWhatsAppMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve enviar usando o token descriptografado da empresa", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue({
      id: "config-1",
      phoneNumberId: "PHONE_A",
      accessToken: "encrypted-token",
      status: "CONNECTED",
    } as never);
    vi.mocked(decrypt).mockReturnValue("decrypted-token");
    vi.mocked(sendWhatsAppMessage).mockResolvedValue(undefined as never);

    const sent = await deliverWhatsAppMessage(
      "company-1",
      "5511999999999",
      "Olá"
    );

    expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
      where: { companyId: "company-1", status: "CONNECTED" },
    });
    expect(decrypt).toHaveBeenCalledWith("encrypted-token");
    expect(sendWhatsAppMessage).toHaveBeenCalledWith({
      phoneNumberId: "PHONE_A",
      accessToken: "decrypted-token",
      to: "5511999999999",
      message: "Olá",
    });
    expect(sent).toBe(true);
  });

  it("deve retornar false quando a empresa não tem WhatsApp configurado", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(null as never);

    const sent = await deliverWhatsAppMessage("company-1", "5511999999999", "Oi");

    expect(sent).toBe(false);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("deve retornar false quando o token não pode ser descriptografado", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue({
      id: "config-1",
      phoneNumberId: "PHONE_A",
      accessToken: "encrypted-token",
      status: "CONNECTED",
    } as never);
    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error("Invalid encrypted text format");
    });

    const sent = await deliverWhatsAppMessage("company-1", "5511999999999", "Oi");

    expect(sent).toBe(false);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("deve retornar false quando o envio falha", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue({
      id: "config-1",
      phoneNumberId: "PHONE_A",
      accessToken: "encrypted-token",
      status: "CONNECTED",
    } as never);
    vi.mocked(decrypt).mockReturnValue("decrypted-token");
    vi.mocked(sendWhatsAppMessage).mockRejectedValue(new Error("network down"));

    const sent = await deliverWhatsAppMessage("company-1", "5511999999999", "Oi");

    expect(sent).toBe(false);
  });
});
