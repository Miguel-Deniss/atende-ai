"use client";

import { Message } from "./types";

interface ConversationMessagesProps {
  messages: Message[];
}

export default function ConversationMessages({
  messages,
}: ConversationMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      {messages.map((message) => {

        const isClient = message.role === "user";

        return (
          <div
            key={message.id}
            className={`flex ${
              isClient
                ? "justify-start"
                : "justify-end"
            }`}
          >

            <div
              className={`
                max-w-[70%]
                rounded-lg
                px-4
                py-2
                text-sm

                ${
                  isClient
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }
              `}
            >

              <p>
                {message.content}
              </p>

              <span className="mt-1 block text-xs opacity-70">
                {new Date(
                  message.createdAt
                ).toLocaleTimeString(
                  "pt-BR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>

            </div>

          </div>
        );
      })}

    </div>
  );
}