import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { companySettingsSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        settings: true,
        aiConfig: {
          include: {
            services: true,
            faq: true,
          },
        },
      },
    });

    if (!company) return errorResponse("Empresa não encontrada", 404);

    return successResponse({
      companyName: company.name,
      phone: company.phone,
      address: company.address,
      hours: company.hours,
      welcomeMessage: company.welcomeMessage || company.aiConfig?.welcomeMessage,
      absenceMessage: company.absenceMessage || company.aiConfig?.absenceMessage,
      services: company.aiConfig?.services || [],
      faq: company.aiConfig?.faq || [],
      autoTransfer: company.settings?.autoTransfer ?? true,
      autoReminders: company.settings?.autoReminders ?? true,
      requireConfirmation: company.settings?.requireConfirmation ?? true,
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const parsed = companySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const { services, faq, welcomeMessage, absenceMessage, autoTransfer, autoReminders, requireConfirmation, companyName, phone, address, hours, ...rest } = parsed.data;

    const companyData: Record<string, unknown> = {};
    if (companyName !== undefined) companyData.name = companyName;
    if (phone !== undefined) companyData.phone = phone;
    if (address !== undefined) companyData.address = address;
    if (hours !== undefined) companyData.hours = hours;
    if (welcomeMessage !== undefined) companyData.welcomeMessage = welcomeMessage;
    if (absenceMessage !== undefined) companyData.absenceMessage = absenceMessage;

    if (Object.keys(companyData).length > 0) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: companyData,
      });
    }

    if (autoTransfer !== undefined || autoReminders !== undefined || requireConfirmation !== undefined) {
      const settingsData: Record<string, unknown> = {};
      if (autoTransfer !== undefined) settingsData.autoTransfer = autoTransfer;
      if (autoReminders !== undefined) settingsData.autoReminders = autoReminders;
      if (requireConfirmation !== undefined) settingsData.requireConfirmation = requireConfirmation;

      await prisma.companySettings.upsert({
        where: { companyId: user.companyId },
        update: settingsData,
        create: { companyId: user.companyId, ...settingsData },
      });
    }

    if (services || faq || welcomeMessage || absenceMessage) {
      const aiData: Record<string, unknown> = {};
      if (welcomeMessage !== undefined) aiData.welcomeMessage = welcomeMessage;
      if (absenceMessage !== undefined) aiData.absenceMessage = absenceMessage;

      const aiConfig = await prisma.aIConfig.upsert({
        where: { companyId: user.companyId },
        update: aiData,
        create: { companyId: user.companyId, ...aiData },
      });

      if (services) {
        await prisma.service.deleteMany({ where: { aiConfigId: aiConfig.id } });
        if (services.length > 0) {
          await prisma.service.createMany({
            data: services.map((s: { name: string; price: string }) => ({
              name: s.name,
              price: s.price,
              aiConfigId: aiConfig.id,
            })),
          });
        }
      }

      if (faq) {
        await prisma.fAQ.deleteMany({ where: { aiConfigId: aiConfig.id } });
        if (faq.length > 0) {
          await prisma.fAQ.createMany({
            data: faq.map((f: { question: string; answer: string }) => ({
              question: f.question,
              answer: f.answer,
              aiConfigId: aiConfig.id,
            })),
          });
        }
      }
    }

    await createLog({
      action: "AI_CONFIG_CHANGE",
      entity: "settings",
      entityId: user.companyId,
      description: "Configurações da empresa atualizadas",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Configurações salvas com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
