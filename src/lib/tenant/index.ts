import { prisma } from "@/lib/db/prisma";
import { isCompanyAdmin } from "@/lib/auth/permissions";

export async function validateCompanyAccess(
  companyId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, role: true, isActive: true },
  });

  if (!user) {
    return { allowed: false, reason: "Usuário não encontrado" };
  }

  if (!user.isActive) {
    return { allowed: false, reason: "Usuário inativo" };
  }

  if (user.companyId !== companyId) {
    return { allowed: false, reason: "Acesso negado a esta empresa" };
  }

  if (isCompanyAdmin(user.role)) {
    return { allowed: true };
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });

  if (!company || company.status !== "ACTIVE") {
    return { allowed: false, reason: "Empresa inativa ou suspensa" };
  }

  return { allowed: true };
}

export async function getCompanyData(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      settings: true,
      aiConfig: {
        include: {
          services: true,
          faq: true,
        },
      },
      _count: {
        select: {
          users: true,
          clients: true,
          appointments: true,
          conversations: true,
        },
      },
    },
  });
}
