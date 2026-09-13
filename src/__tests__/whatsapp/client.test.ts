import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { client: { upsert: vi.fn() } },
}));

import { prisma } from "@/lib/db/prisma";
import { findOrCreateWhatsAppClient } from "@/lib/whatsapp/client";

const mockedUpsert = vi.mocked(prisma.client.upsert);

describe("findOrCreateWhatsAppClient", () => {
  beforeEach(() => mockedUpsert.mockReset());

  it("normaliza o telefone e cria o cliente de forma atomica", async () => {
    mockedUpsert.mockResolvedValue({ id: "client-1", whatsappName: "Joao" } as never);

    const result = await findOrCreateWhatsAppClient("company-1", "(11) 99999-9999", "Joao");

    expect(mockedUpsert).toHaveBeenCalledWith({
      where: {
        companyId_phone: { companyId: "company-1", phone: "5511999999999" },
      },
      update: { whatsappName: "Joao", deletedAt: null },
      create: {
        companyId: "company-1",
        phone: "5511999999999",
        name: "Joao",
        whatsappName: "Joao",
      },
    });
    expect(result.id).toBe("client-1");
  });

  it("usa nome padrao e nao apaga o nome existente quando o perfil nao informa nome", async () => {
    mockedUpsert.mockResolvedValue({ id: "client-2" } as never);

    await findOrCreateWhatsAppClient("company-1", "5511999999999");

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { deletedAt: null },
        create: expect.objectContaining({
          name: "Cliente WhatsApp",
          whatsappName: null,
        }),
      })
    );
  });

  it("rejeita telefone invalido antes de acessar o banco", async () => {
    await expect(findOrCreateWhatsAppClient("company-1", "123")).rejects.toThrow(
      "Telefone invalido"
    );
    expect(mockedUpsert).not.toHaveBeenCalled();
  });
});
