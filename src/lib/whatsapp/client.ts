import { prisma } from "@/lib/db/prisma";
import type { Client } from "@prisma/client";

export async function findOrCreateWhatsAppClient(
  companyId: string,
  phone: string,
  whatsappName?: string
): Promise<Client> {
  const existing = await prisma.client.findFirst({
    where: { companyId, phone },
  });

  if (existing) {
    if (whatsappName && existing.whatsappName !== whatsappName) {
      return prisma.client.update({
        where: { id: existing.id },
        data: { whatsappName },
      });
    }
    return existing;
  }

  return prisma.client.create({
    data: {
      companyId,
      phone,
      name: whatsappName ?? "Cliente WhatsApp",
      whatsappName: whatsappName ?? null,
    },
  });
}
