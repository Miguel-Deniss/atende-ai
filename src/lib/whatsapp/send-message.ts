export interface SendWhatsAppMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  message: string;
}

export const WHATSAPP_GRAPH_VERSION = "v20.0";

export async function sendWhatsAppMessage({
  phoneNumberId,
  accessToken,
  to,
  message,
}: SendWhatsAppMessageParams): Promise<void> {
  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`WhatsApp API retornou ${response.status}: ${detail}`);
  }
}
