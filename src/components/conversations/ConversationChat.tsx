"use client";

import { useEffect, useState } from "react";
import { Conversation, Message } from "./types";
import ConversationInput from "./ConversationInput";
import StatusSelect from "./StatusSelect";

interface ConversationChatProps {
  conversation: Conversation | null;
}

export default function ConversationChat({ conversation }: ConversationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMessages() {
    if (!conversation) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/conversations/${conversation.id}/messages`);

      const json = await response.json();

      console.log("MESSAGES API:", json);

      setMessages(json.data);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [conversation]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Selecione uma conversa para iniciar o atendimento
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {conversation.name?.charAt(0) ?? "C"}
          </div>

          <div>
            <h2 className="font-semibold">{conversation.name ?? "Cliente"}</h2>

            <p className="text-sm text-muted-foreground">{conversation.phone}</p>
            <StatusSelect
              conversationId={conversation.id}
              currentStatus={conversation.status}
              onUpdate={loadMessages}
            />
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm text-muted-foreground">Carregando mensagens...</p>}

        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem.</p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`
                max-w-[70%]
                rounded-xl
                px-4
                py-2
                text-sm

                ${message.role === "user" ? "bg-secondary text-white" : "bg-blue-600 text-white"}
              `}
            >
              {message.content || "Mensagem vazia"}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <ConversationInput conversationId={conversation.id} onMessageSent={loadMessages} />
    </div>
  );
}
