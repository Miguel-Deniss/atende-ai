import { chat as ollamaChat } from "./providers/ollama";

export async function chat(
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[]
) {
  const provider = process.env.AI_PROVIDER ?? "ollama";

  switch (provider) {
    case "ollama":
      return ollamaChat(messages);

    default:
      throw new Error(
        `Provedor de IA não suportado: ${provider}`
      );
  }
}