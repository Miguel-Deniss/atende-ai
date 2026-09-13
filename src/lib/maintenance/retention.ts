import { prisma } from "@/lib/db/prisma";

export async function runRetentionCleanup(now = new Date()) {
  const webhookCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const loginCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sessionCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [demoLeads, webhookEvents, loginAttempts, sessions] = await prisma.$transaction([
    prisma.demoLead.deleteMany({ where: { retentionUntil: { lte: now } } }),
    prisma.webhookEvent.deleteMany({
      where: {
        createdAt: { lt: webhookCutoff },
        status: { in: ["processed", "dead_letter"] },
      },
    }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: loginCutoff } } }),
    prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: sessionCutoff } },
          { isRevoked: true, createdAt: { lt: sessionCutoff } },
        ],
      },
    }),
  ]);

  return {
    demoLeads: demoLeads.count,
    webhookEvents: webhookEvents.count,
    loginAttempts: loginAttempts.count,
    sessions: sessions.count,
  };
}
