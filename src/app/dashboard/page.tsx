"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  cards: {
    totalClients: number;
    clientsThisMonth: number;
    totalConversations: number;
    conversationsToday: number;
    messagesToday: number;
    totalAppointments: number;
    appointmentsToday: number;
    unreadConversations: number;
    openConversations: number;
    responseRate: number;
  };
  chart: {
    day: string;
    date: string;
    appointments: number;
    conversations: number;
  }[];
  recentConversations: {
    id: string;
    name: string;
    phone: string;
    lastMessage: string;
    lastMessageAt: string;
    status: string;
    unread: boolean;
  }[];
  todayAppointments: {
    id: string;
    time: string;
    name: string;
    service: string;
    status: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Erro ao carregar o dashboard</p>
      </div>
    );
  }

  const maxChartValue = Math.max(...data.chart.map((c) => Math.max(c.appointments, c.conversations)), 1);

  const stats = [
    { icon: Users, label: "Clientes", value: data.cards.totalClients.toLocaleString("pt-BR"), change: `+${data.cards.clientsThisMonth} este mês`, color: "from-blue-500 to-blue-400" },
    { icon: MessageSquare, label: "Conversas Hoje", value: data.cards.conversationsToday.toLocaleString("pt-BR"), change: `${data.cards.unreadConversations} não lidas`, color: "from-violet-500 to-violet-400" },
    { icon: Calendar, label: "Agendamentos Hoje", value: data.cards.appointmentsToday.toLocaleString("pt-BR"), change: `${data.cards.totalAppointments} no total`, color: "from-emerald-500 to-emerald-400" },
    { icon: TrendingUp, label: "Taxa de Resposta", value: `${data.cards.responseRate}%`, change: `${data.cards.messagesToday} msg. hoje`, color: "from-amber-500 to-amber-400" },
  ];

  const formatRelative = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
        </div>
        <Link href="/dashboard/reports">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-1" /> Relatórios
          </Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50 hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} p-0.5`}>
                  <div className="w-full h-full rounded-xl bg-[#111827] flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  {stat.change}
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">Conversas Recentes</CardTitle>
                <Link href="/dashboard/conversations" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Ver todas</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.recentConversations.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhuma conversa ainda</p>
                )}
                {data.recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/dashboard/conversations/${conv.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(conv.name || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{conv.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{conv.lastMessage || "Sem mensagens"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-500">{formatRelative(conv.lastMessageAt)}</span>
                      <div className={`w-2 h-2 rounded-full ${conv.unread ? "bg-amber-400" : "bg-emerald-400"}`} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">Agenda de Hoje</CardTitle>
                <Link href="/dashboard/schedule" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Ver todas</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.todayAppointments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhum agendamento hoje</p>
                )}
                {data.todayAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href="/dashboard/schedule"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-sm font-medium text-blue-400 text-center">{appt.time}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{appt.name}</p>
                        <p className="text-xs text-gray-500">{appt.service}</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white">Atendimentos - Últimos 7 dias</CardTitle>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Agendamentos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 px-2 h-48">
              {data.chart.map((item) => (
                <div key={item.date} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                  <div className="w-full flex flex-col justify-end flex-1 gap-1">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-violet-500 to-violet-400 opacity-80"
                      style={{ height: `${(item.conversations / maxChartValue) * 100}%` }}
                      title={`${item.conversations} conversas`}
                    />
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-blue-500 to-blue-400"
                      style={{ height: `${(item.appointments / maxChartValue) * 100}%` }}
                      title={`${item.appointments} agendamentos`}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Agendamentos
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Conversas
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
