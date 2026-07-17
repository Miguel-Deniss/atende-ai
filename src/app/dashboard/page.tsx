"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { icon: Users, label: "Clientes Atendidos", value: "1.247", change: "+12%", color: "from-blue-500 to-blue-400" },
  { icon: MessageSquare, label: "Conversas Hoje", value: "89", change: "+8%", color: "from-violet-500 to-violet-400" },
  { icon: Calendar, label: "Agendamentos", value: "34", change: "+23%", color: "from-emerald-500 to-emerald-400" },
  { icon: TrendingUp, label: "Taxa de Resposta", value: "98%", change: "+2%", color: "from-amber-500 to-amber-400" },
];

const recentConversations = [
  { name: "Ana Silva", message: "Olá! Gostaria de agendar um horário para corte de cabelo.", time: "2 min", status: "success" },
  { name: "Carlos Lima", message: "Quanto custa a barba completa?", time: "15 min", status: "success" },
  { name: "Marina Costa", message: "Tem horário disponível amanhã de manhã?", time: "1h", status: "pending" },
  { name: "João Pedro", message: "Vocês fazem hidratação capilar?", time: "2h", status: "success" },
];

const upcomingAppointments = [
  { time: "09:00", name: "João Silva", service: "Corte de Cabelo" },
  { time: "10:30", name: "Maria Oliveira", service: "Barba" },
  { time: "14:00", name: "Pedro Santos", service: "Hidratação" },
  { time: "16:00", name: "Ana Costa", service: "Corte + Barba" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
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
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Agora
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <div
                    key={conv.name}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {conv.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{conv.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{conv.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-500">{conv.time}</span>
                      <div className={`w-2 h-2 rounded-full ${conv.status === "success" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    </div>
                  </div>
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
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt.time}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-sm font-medium text-blue-400 text-center">{appt.time}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{appt.name}</p>
                        <p className="text-xs text-gray-500">{appt.service}</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-3 px-2">
              {[
                { day: "Seg", value: 45 },
                { day: "Ter", value: 62 },
                { day: "Qua", value: 38 },
                { day: "Qui", value: 75 },
                { day: "Sex", value: 52 },
                { day: "Sáb", value: 88 },
                { day: "Dom", value: 25 },
              ].map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 transition-all duration-300"
                    style={{ height: `${item.value}%` }}
                  />
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
