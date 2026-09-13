import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensurePlans } from "../src/lib/billing/plans";

const prisma = new PrismaClient();

async function main() {
  await ensurePlans();

  const adminPasswordRaw = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPasswordRaw) {
    console.log("Planos sincronizados. Admin nao criado: SEED_ADMIN_PASSWORD ausente.");
    return;
  }

  const adminPassword = await bcrypt.hash(adminPasswordRaw, 12);

  const adminCompany = await prisma.company.upsert({
    where: { slug: "atendeai-admin" },
    update: {},
    create: {
      name: "AtendeAI Admin",
      slug: "atendeai-admin",
      status: "ACTIVE",
      planType: "BUSINESS",
      subscriptionStatus: "ACTIVE",
      settings: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@atendeai.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      name: "Super Admin",
      email: "admin@atendeai.com",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      companyId: adminCompany.id,
      emailVerified: true,
    },
  });

  console.log("Planos sincronizados e usuario administrativo criado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
