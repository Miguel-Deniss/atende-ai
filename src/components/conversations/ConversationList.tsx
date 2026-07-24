"use client";

import { useEffect, useState } from "react";
import ConversationItem from "./ConversationItem";
import { Conversation } from "./types";

interface ConversationListProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationList({
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadConversations() {
    try {
      const response = await fetch("/api/conversations");

      const json = await response.json();
      console.log("API CONVERSATIONS:", json);

      setConversations(json.data.conversations);
      console.log("CONVERSAS:", json.data.conversations);

    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando conversas...</div>;
  }

  if (conversations.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>;
  }

  return (
    <div>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          selected={selectedConversation?.id === conversation.id}
          onClick={() => onSelectConversation(conversation)}
        />
      ))}
    </div>
  );
}
