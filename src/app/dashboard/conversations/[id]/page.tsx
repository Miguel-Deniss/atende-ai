"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  role: string;
  content: string;
}

export default function ConversationPage() {
  const params = useParams();

  const id = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  async function loadMessages() {
    const response = await fetch(`/api/conversations/${id}/messages`);

    const data = await response.json();

    console.log("MESSAGES:", data);

    if (data.success) {
      setMessages(data.data);
    }
  }

  useEffect(() => {
    if (id) {
      loadMessages();
    }
  }, [id]);

  async function sendMessage() {
    if (!input.trim()) return;

    const text = input;

    setInput("");

    // mostra mensagem do usuário imediatamente

    setMessages((prev) => [
      ...prev,

      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        `/api/conversations/${id}/messages`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            content: text,
          }),
        }
      );

      const data = await response.json();

      console.log("RESPOSTA IA:", data);

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>

      <div className="space-y-4 mb-6">
        {messages.map((message) => (
          <div
            key={message.id}

            className={
              message.role === "assistant"
                ? "bg-blue-600 text-white p-4 rounded-lg max-w-xl"
                : "bg-gray-300 text-black p-4 rounded-lg max-w-xl ml-auto"
            }
          >
            <strong>{message.role}</strong>

            <p>{message.content}</p>
          </div>
        ))}

        {loading && <div className="bg-blue-600 p-4 rounded-lg max-w-xl">IA digitando...</div>}
      </div>

      <div className="flex gap-3">
        <input
          value={input}

          onChange={(e) => setInput(e.target.value)}

          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}

          placeholder="Digite uma mensagem..."

          className="flex-1 p-3 rounded text-black"
        />

        <button
          onClick={sendMessage}

          className="bg-blue-600 px-6 rounded"
        >
          Enviar
        </button>
      </div>
    </main>
  );
}
