import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Uso: npm run db:promote-admin -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  if (user.role === "SUPER_ADMIN") {
    console.log(`${email} já é SUPER_ADMIN. Nada a fazer.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "SUPER_ADMIN" },
  });

  console.log(
    `✅ ${email} promovido para SUPER_ADMIN (role anterior: ${user.role}).`
  );
  console.log("Faça logout e login novamente para obter o novo token de acesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
