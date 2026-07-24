import ConversationFilters from "./ConversationFilters";
import ConversationList from "./ConversationList";
import ConversationSearch from "./ConversationSearch";

/**
 * Barra lateral do módulo de conversas.
 * Responsável apenas por organizar pesquisa, filtros e lista.
 */
import { Conversation } from "./types";

interface ConversationSidebarProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationSidebar({
  selectedConversation,
  onSelectConversation,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <p className="text-sm text-muted-foreground">Gerencie os atendimentos dos clientes</p>
      </div>

      {/* Pesquisa */}
      <div className="border-b border-border p-4">
        <ConversationSearch />
      </div>

      {/* Filtros */}
      <div className="border-b border-border p-4">
        <ConversationFilters />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
        />
      </div>
    </div>
  );
}
