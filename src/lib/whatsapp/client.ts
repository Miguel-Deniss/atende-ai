import { prisma } from "@/lib/db/prisma";
import type { Client } from "@prisma/client";
import { normalizeBrazilianPhone } from "@/lib/clients/phone";

export async function findOrCreateWhatsAppClient(
  companyId: string,
  phone: string,
  whatsappName?: string
): Promise<Client> {
  const normalizedPhone = normalizeBrazilianPhone(phone);

  return prisma.client.upsert({
    where: { companyId_phone: { companyId, phone: normalizedPhone } },
    update: {
      ...(whatsappName ? { whatsappName } : {}),
      deletedAt: null,
    },
    create: {
      companyId,
      phone: normalizedPhone,
      name: whatsappName ?? "Cliente WhatsApp",
      whatsappName: whatsappName ?? null,
    },
  });
}
