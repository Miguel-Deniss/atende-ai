"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  role: string;
  content: string;
}

interface ConversationState {
  handledBy: { id: string; name: string } | null;
}

export default function ConversationPage() {
  const params = useParams();

  const id = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);

  const [conversation, setConversation] = useState<ConversationState | null>(null);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const handled = Boolean(conversation?.handledBy);

  async function loadMessages() {
    const response = await fetch(`/api/conversations/${id}/messages`);

    const data = await response.json();

    if (data.success) {
      setMessages(data.data);
    }
  }

  async function loadConversation() {
    const response = await fetch(`/api/conversations/${id}`);

    const data = await response.json();

    if (data.success) {
      setConversation(data.data);
    }
  }

  useEffect(() => {
    if (id) {
      loadMessages();
      loadConversation();
    }
  }, [id]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    const es = new EventSource("/api/conversations/events");

    es.addEventListener("message", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data);
        if (payload?.conversationId === id) loadMessages();
      } catch {
        console.error("Erro ao processar evento");
      }
    });

    es.addEventListener("conversation", () => {
      loadConversation();
      loadMessages();
    });

    return () => es.close();
  }, [id]);

  async function takeover() {
    await fetch(`/api/conversations/${id}/takeover`, { method: "POST" });
    await loadConversation();
  }

  async function release() {
    await fetch(`/api/conversations/${id}/release`, { method: "POST" });
    await loadConversation();
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const text = input;

    setInput("");

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
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
        }),
      });

      const data = await response.json();

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat</h1>
        {handled ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-400">
              Atendida por {conversation?.handledBy?.name}
            </span>
            <button
              onClick={release}
              className="bg-gray-700 px-4 py-2 rounded"
            >
              Liberar
            </button>
          </div>
        ) : (
          <button onClick={takeover} className="bg-amber-500 px-4 py-2 rounded">
            Assumir
          </button>
        )}
      </div>

      {handled && (
        <p className="text-sm text-amber-300 mb-4">
          Atendimento humano ativo: suas respostas são enviadas direto ao WhatsApp,
          sem passar pela IA.
        </p>
      )}

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
