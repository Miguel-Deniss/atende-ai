import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 12);

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
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@atendeai.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      companyId: adminCompany.id,
      emailVerified: true,
    },
  });

  console.log("Database seeded successfully");
  console.log("Admin credentials: admin@atendeai.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
