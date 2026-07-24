import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAIResponse(messages: AIMessage[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",

    messages: [
      {
        role: "system",
        content: `
Você é um atendente virtual.

Regras:
- Responda em português do Brasil.
- Seja educado.
- Seja objetivo.
- Ajude o cliente com dúvidas e agendamentos.
        `,
      },

      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
    ],
  });

  return response.choices[0].message.content ?? "Não consegui responder.";
}
