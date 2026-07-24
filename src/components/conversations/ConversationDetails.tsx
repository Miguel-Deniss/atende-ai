"use client";

import { Conversation } from "./types";
import StatusSelect from "./StatusSelect";

interface ConversationDetailsProps {
  conversation: Conversation | null;
}

/**
 * Painel lateral com detalhes da conversa ativa.
 * Exibe informações do contato e histórico.
 */

export default function ConversationDetails({ conversation }: ConversationDetailsProps) {
  if (!conversation) {
    return (
      <div className="w-72 border-l p-4 text-sm text-muted-foreground">Selecione uma conversa</div>
    );
  }

  return (
    <div className="w-72 border-l p-5">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div
          className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-primary
          text-xl
          font-bold
          text-primary-foreground
        "
        >
          {conversation.name?.charAt(0) ?? "C"}
        </div>

        <h2 className="mt-3 font-semibold">{conversation.name ?? "Cliente"}</h2>

        <p className="text-sm text-muted-foreground">{conversation.phone}</p>
      </div>

      {/* Informações do cliente */}
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Status da conversa</p>

          <StatusSelect
            conversationId={conversation.id}
            currentStatus={conversation.status}
            onUpdate={() => window.location.reload()}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Email</p>

          <p className="text-sm">{conversation.client?.email ?? "Não informado"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Último serviço</p>

          <p className="text-sm">{conversation.client?.lastService ?? "Não informado"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Observações</p>

          <p className="text-sm">{conversation.client?.notes ?? "Nenhuma observação"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Status do cliente</p>

          <p className="text-sm font-medium">{conversation.client?.status ?? "Ativo"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Última mensagem</p>

          <p className="text-sm">{conversation.lastMessage ?? "Nenhuma mensagem"}</p>
        </div>
      </div>
    </div>
  );
}
