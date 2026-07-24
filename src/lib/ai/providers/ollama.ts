import ollama from "ollama";

export async function chat(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const response = await ollama.chat({
    model: "llama3.2",
    messages,
  });

  return response.message.content;
}