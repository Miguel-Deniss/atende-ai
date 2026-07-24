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

  useEffect(() => {
    async function loadMessages() {
      const response = await fetch(`/api/conversations/${id}/messages`);

      const data = await response.json();

      console.log("MESSAGES:", data);

      if (data.success) {
        setMessages(data.data);
      }
    }

    if (id) {
      loadMessages();
    }
  }, [id]);

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>

      <div className="space-y-4">
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
      </div>
    </main>
  );
}
