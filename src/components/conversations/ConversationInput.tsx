"use client";

import { useState } from "react";

interface ConversationInputProps {
  conversationId: string;
  onMessageSent: () => void;
}

export default function ConversationInput({
  conversationId,
  onMessageSent,
}: ConversationInputProps) {

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);


  async function sendMessage() {

    if (!message.trim()) return;


    try {

      setSending(true);


      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: message,
          }),
        }
      );


      const json = await response.json();


      if (!json.success) {
        console.error(
          "Erro ao enviar mensagem:",
          json
        );
        return;
      }


      setMessage("");

      onMessageSent();


    } catch (error) {

      console.error(
        "Erro ao enviar mensagem:",
        error
      );

    } finally {

      setSending(false);

    }
  }



  return (
    <div className="border-t border-border p-4">

      <div className="flex gap-2">

        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Digite uma mensagem..."
          disabled={sending}
          className="
            flex-1
            rounded-lg
            border
            bg-background
            px-4
            py-2
            text-sm
          "
        />


        <button
          onClick={sendMessage}
          disabled={sending}
          className="
            rounded-lg
            bg-blue-600
            px-5
            text-sm
            font-medium
            text-white
            hover:bg-blue-700
            disabled:opacity-50
          "
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>

      </div>

    </div>
  );
}