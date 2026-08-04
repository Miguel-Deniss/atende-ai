import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { findOrCreateWhatsAppClient } from "@/lib/whatsapp/client";

const mockedFindFirst = vi.mocked(prisma.client.findFirst);
const mockedCreate = vi.mocked(prisma.client.create);
const mockedUpdate = vi.mocked(prisma.client.update);

describe("findOrCreateWhatsAppClient", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
  });

  it("deve criar cliente novo com nome do perfil", async () => {
    mockedFindFirst.mockResolvedValue(null as never);
    mockedCreate.mockResolvedValue({
      id: "client-1",
      name: "João",
      whatsappName: "João",
    } as never);

    const result = await findOrCreateWhatsAppClient(
      "company-1",
      "5511999999999",
      "João"
    );

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        companyId: "company-1",
        phone: "5511999999999",
        name: "João",
        whatsappName: "João",
      },
    });
    expect(result.id).toBe("client-1");
  });

  it("deve criar cliente novo com fallback quando não há nome do perfil", async () => {
    mockedFindFirst.mockResolvedValue(null as never);
    mockedCreate.mockResolvedValue({ id: "client-2" } as never);

    await findOrCreateWhatsAppClient("company-1", "5511999999999");

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        companyId: "company-1",
        phone: "5511999999999",
        name: "Cliente WhatsApp",
        whatsappName: null,
      },
    });
  });

  it("deve retornar cliente existente sem alteração quando o nome é o mesmo", async () => {
    const existing = {
      id: "client-1",
      name: "João",
      whatsappName: "João",
    } as never;
    mockedFindFirst.mockResolvedValue(existing);

    const result = await findOrCreateWhatsAppClient(
      "company-1",
      "5511999999999",
      "João"
    );

    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("deve atualizar whatsappName quando o nome do perfil muda", async () => {
    mockedFindFirst.mockResolvedValue({
      id: "client-1",
      name: "João",
      whatsappName: "João Antigo",
    } as never);
    mockedUpdate.mockResolvedValue({
      id: "client-1",
      name: "João",
      whatsappName: "João",
    } as never);

    const result = await findOrCreateWhatsAppClient(
      "company-1",
      "5511999999999",
      "João"
    );

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "client-1" },
      data: { whatsappName: "João" },
    });
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result.whatsappName).toBe("João");
  });

  it("deve não atualizar quando o novo nome vem vazio", async () => {
    const existing = {
      id: "client-1",
      name: "João",
      whatsappName: "João",
    } as never;
    mockedFindFirst.mockResolvedValue(existing);

    await findOrCreateWhatsAppClient("company-1", "5511999999999", "");

    expect(mockedUpdate).not.toHaveBeenCalled();
  });
});
