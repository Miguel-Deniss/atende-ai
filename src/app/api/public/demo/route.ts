import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { errorResponse, successResponse } from "@/lib/auth/api-response";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";
import { normalizeBrazilianPhone } from "@/lib/clients/phone";

const demoLeadSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(10).max(20),
    company: z.string().trim().max(160).optional(),
    consent: z.literal(true),
    website: z.string().max(0).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = await guardRateLimit(request, `demo:${ip}`);
  if (blocked) return blocked;

  const parsed = demoLeadSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Dados invalidos ou consentimento ausente", 400);

  let phone: string;
  try {
    phone = normalizeBrazilianPhone(parsed.data.phone);
  } catch {
    return errorResponse("Telefone invalido", 400);
  }

  const ipHash = crypto
    .createHash("sha256")
    .update(`${ip}:${process.env.SESSION_SECRET ?? "demo-lead"}`)
    .digest("hex");
  const retentionUntil = new Date();
  retentionUntil.setDate(retentionUntil.getDate() + 90);

  await prisma.demoLead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone,
      company: parsed.data.company || null,
      consentAt: new Date(),
      retentionUntil,
      ipHash,
    },
  });

  return successResponse(
    { message: "Solicitacao recebida. Nossa equipe entrara em contato para combinar um horario." },
    201
  );
}
