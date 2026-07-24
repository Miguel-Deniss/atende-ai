"use client";

import { Badge } from "@/components/ui/badge";
import { Conversation } from "./types";

interface ConversationItemProps {
  conversation: Conversation;
  selected?: boolean;
  onClick?: () => void;
}

export default function ConversationItem({
  conversation,
  selected = false,
  onClick,
}: ConversationItemProps) {
  const initial = conversation.name?.charAt(0).toUpperCase() ?? conversation.phone.charAt(0);

  return (
    <button
      onClick={onClick}
      className={`
        w-full
        p-4
        text-left
        transition-colors
        border-b
        border-border

        ${selected ? "bg-secondary" : "hover:bg-secondary/60"}
      `}
    >
      <div className="flex gap-3">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
            {initial}
          </div>

          {conversation.unread && (
            <div className="absolute right-0 top-0 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-background" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="truncate font-medium">{conversation.name ?? "Cliente sem nome"}</h3>

            <p className="text-xs text-muted-foreground">{conversation.phone}</p>

            <Badge variant="outline">{conversation.status}</Badge>
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {conversation.lastMessage ?? "Nenhuma mensagem"}
          </p>
        </div>
      </div>
    </button>
  );
}
