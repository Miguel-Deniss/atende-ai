"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const allConversations = [
  { name: "Ana Silva", message: "Olá! Gostaria de agendar um horário para corte de cabelo.", time: "14:32", status: "respondido" as const, unread: false },
  { name: "Carlos Lima", message: "Quanto custa a barba completa?", time: "14:15", status: "pendente" as const, unread: true },
  { name: "Marina Costa", message: "Tem horário disponível amanhã de manhã?", time: "13:50", status: "respondido" as const, unread: false },
  { name: "João Pedro", message: "Vocês fazem hidratação capilar?", time: "12:20", status: "respondido" as const, unread: false },
  { name: "Fernanda Santos", message: "Quero agendar escova e progressiva", time: "11:45", status: "pendente" as const, unread: true },
  { name: "Roberto Alves", message: "Preciso de um corte infantil para meu filho", time: "10:30", status: "respondido" as const, unread: false },
  { name: "Patrícia Lima", message: "Vocês trabalham com coloração?", time: "09:15", status: "respondido" as const, unread: false },
  { name: "Lucas Oliveira", message: "Bom dia! Gostaria de marcar uma barba", time: "08:00", status: "pendente" as const, unread: true },
];

type StatusFilter = "todas" | "respondido" | "pendente";

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  const filtered = useMemo(() => {
    let result = allConversations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "todas") {
      result = result.filter((c) => c.status === statusFilter);
    }
    result.sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return b.time.localeCompare(a.time);
    });
    return result;
  }, [search, statusFilter]);

  const filters: StatusFilter[] = ["todas", "pendente", "respondido"];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Conversas</h1>
        <p className="text-gray-500 text-sm">{filtered.length} conversa{filtered.length !== 1 ? "s" : ""}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Pesquisar conversas..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === f
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-gray-500 hover:text-gray-300 hover:bg-secondary/50"
                    }`}
                  >
                    {f === "todas" ? "Todas" : f === "pendente" ? "Pendentes" : "Respondidas"}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">Nenhuma conversa encontrada</p>
                <p className="text-sm text-gray-600 mt-1">Tente buscar por outro termo</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filtered.map((conv, index) => (
                  <motion.div
                    key={conv.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer group relative"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-sm font-bold text-white">
                        {conv.name.charAt(0)}
                      </div>
                      {conv.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0F172A]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${conv.unread ? "font-semibold text-white" : "font-medium text-gray-300"}`}>
                          {conv.name}
                        </p>
                        <span className="text-[10px] text-gray-500">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate max-w-[200px] ${conv.unread ? "text-gray-300" : "text-gray-500"}`}>
                          {conv.message}
                        </p>
                        <Badge
                          variant={conv.status === "respondido" ? "success" : "warning"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {conv.status === "respondido" ? "Respondido" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
