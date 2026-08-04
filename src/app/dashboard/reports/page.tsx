"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, MessageSquare, MessagesSquare, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportsData {
  range: string;
  totals: {
    clients: number;
    clientsThisMonth: number;
    clientsChange: number;
    appointments: number;
    appointmentsThisMonth: number;
    appointmentsChange: number;
    conversations: number;
    conversationsThisMonth: number;
    conversationsChange: number;
    messages: number;
  };
  services: { service: string; count: number; percentage: number }[];
  peakHours: { hour: string; count: number }[];
  conversationStatus: Record<string, number>;
}

export default function DashboardReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const load = async (r: string) => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/reports?range=${r}`, { credentials: "include" });
    const d = await res.json();
    if (d.success) setData(d.data);
    setLoading(false);
  };

  useEffect(() => { load(range); }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-400">Erro ao carregar relatórios</p>;
  }

  const maxHour = Math.max(...data.peakHours.map((h) => h.count), 1);
  const maxService = Math.max(...data.services.map((s) => s.count), 1);
  const totalConversations = Object.values(data.conversationStatus).reduce((a, b) => a + b, 0);

  const rangeLabel = data.range === "7d" ? "7 dias" : data.range === "90d" ? "90 dias" : "30 dias";

  const cards = [
    { icon: Users, label: "Clientes", value: data.totals.clients, change: data.totals.clientsChange, color: "from-blue-500 to-blue-400", detail: `${data.totals.clientsThisMonth} este mês` },
    { icon: Calendar, label: "Agendamentos", value: data.totals.appointments, change: data.totals.appointmentsChange, color: "from-emerald-500 to-emerald-400", detail: `${data.totals.appointmentsThisMonth} este mês` },
    { icon: MessageSquare, label: "Conversas", value: data.totals.conversations, change: data.totals.conversationsChange, color: "from-violet-500 to-violet-400", detail: `${data.totals.conversationsThisMonth} este mês` },
    { icon: MessagesSquare, label: "Mensagens", value: data.totals.messages, change: null, color: "from-amber-500 to-amber-400", detail: "total acumulado" },
  ];

  const statusLabels: Record<string, string> = {
    OPEN: "Abertas",
    PENDING: "Pendentes",
    DONE: "Concluídas",
    CLOSED: "Fechadas",
  };

  const statusColors: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    OPEN: "success",
    PENDING: "warning",
    DONE: "secondary",
    CLOSED: "secondary",
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Relatórios</h1>
        <p className="text-gray-500 text-sm">Análise de volume de atendimentos, serviços e horários de pico</p>
      </motion.div>

      <div className="flex gap-2">
        {["7d", "30d", "90d"].map((r) => (
          <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>
            {r === "7d" ? "7 dias" : r === "30d" ? "30 dias" : "90 dias"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} p-0.5`}>
                    <div className="w-full h-full rounded-xl bg-[#111827] flex items-center justify-center">
                      <card.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  {card.change !== null && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${card.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {card.change >= 0 ? "+" : ""}{card.change}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">{card.value.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-[10px] text-gray-600 mt-1">{card.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Serviços mais procurados ({rangeLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.services.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum agendamento no período</p>
            ) : (
              <div className="space-y-3">
                {data.services.map((s) => (
                  <div key={s.service}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{s.service}</span>
                      <span className="text-gray-400">{s.count} ({s.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${(s.count / maxService) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Horários de pico ({rangeLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-1 h-40">
              {data.peakHours.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.hour} - ${h.count} agendamentos`}>
                  <div
                    className={`w-full rounded-t-lg ${h.count > 0 ? "bg-gradient-to-t from-blue-500 to-blue-400" : "bg-gray-800"}`}
                    style={{ height: `${(h.count / maxHour) * 100}%` }}
                  />
                  {Number(h.hour.slice(0, 2)) % 4 === 0 && (
                    <span className="text-[9px] text-gray-600">{h.hour.slice(0, 2)}h</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Agora você sabe os melhores horários para anunciar e escalar a equipe.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Status das conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.conversationStatus).map(([status, count]) => {
              const pct = totalConversations > 0 ? Math.round((count / totalConversations) * 100) : 0;
              return (
                <div key={status} className="p-4 rounded-xl bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={statusColors[status] || "secondary"}>{statusLabels[status] || status}</Badge>
                    <span className="text-lg font-bold text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{pct}% do total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
