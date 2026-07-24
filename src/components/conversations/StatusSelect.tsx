"use client";

import { useState } from "react";

interface StatusSelectProps {
  conversationId: string;
  currentStatus: string;
  onUpdate?: () => void;
}

export default function StatusSelect({
  conversationId,
  currentStatus,
  onUpdate,
}: StatusSelectProps) {

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);


  async function updateStatus(
    value: string
  ) {

    setStatus(value);
    setLoading(true);

    try {

      await fetch(
        `/api/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: value,
          }),
        }
      );


      onUpdate?.();


    } catch(error){

      console.error(
        "Erro ao atualizar status:",
        error
      );

    } finally {

      setLoading(false);

    }
  }



  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e)=>
        updateStatus(e.target.value)
      }
      className="
        rounded-md
        border
        bg-background
        px-3
        py-2
        text-sm
      "
    >

      <option value="OPEN">
        Aberto
      </option>

      <option value="PENDING">
        Pendente
      </option>

      <option value="DONE">
        Resolvido
      </option>

    </select>
  );
}