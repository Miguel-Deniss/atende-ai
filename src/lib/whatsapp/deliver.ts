import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { sendWhatsAppMessage } from "./send-message";

export async function deliverWhatsAppMessage(
  companyId: string,
  to: string,
  message: string
): Promise<boolean> {
  const config = await prisma.whatsAppConfig.findFirst({
    where: { companyId, status: "CONNECTED" },
  });

  if (!config) return false;

  let accessToken: string;
  try {
    accessToken = decrypt(config.accessToken);
  } catch {
    return false;
  }

  try {
    await sendWhatsAppMessage({
      phoneNumberId: config.phoneNumberId,
      accessToken,
      to,
      message,
    });
    return true;
  } catch {
    return false;
  }
}
