"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: MessageSquare, label: "Conversas", active: false },
  { icon: Calendar, label: "Agenda", active: false },
  { icon: Users, label: "Clientes", active: false },
  { icon: Settings, label: "Configurações", active: false },
];

const recentConversations = [
  { name: "Ana Silva", message: "Olá! Gostaria de agendar...", time: "2 min", status: "success" },
  { name: "Carlos Lima", message: "Quanto custa o corte...", time: "15 min", status: "success" },
  { name: "Marina Costa", message: "Tem horário amanhã?", time: "1h", status: "pending" },
];

export function DashboardPreview() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Dashboard{" "}
            <span className="gradient-text">inteligente</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Acompanhe tudo em tempo real com um painel completo e intuitivo
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-blue-400/5 rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl border border-border/50 glass overflow-hidden shadow-2xl shadow-black/30">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-1 rounded-lg bg-secondary/50 text-xs text-gray-400">
                  atendeai.app/dashboard
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-border/50 p-4 bg-card/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">A</span>
                  </div>
                  <span className="text-sm font-semibold text-white">AtendeAI</span>
                </div>
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        item.active
                          ? "bg-blue-500/15 text-blue-400 font-medium"
                          : "text-gray-500 hover:text-gray-300 hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Visão Geral</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Atualizado agora
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Clientes Atendidos", value: "1.247", change: "+12%", icon: Users },
                    { label: "Conversas Hoje", value: "89", change: "+8%", icon: MessageSquare },
                    { label: "Agendamentos", value: "34", change: "+23%", icon: Calendar },
                    { label: "Taxa de Resposta", value: "98%", change: "+2%", icon: TrendingUp },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl bg-secondary/40 border border-border/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                          {stat.change}
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{stat.value}</p>
                      <p className="text-[10px] text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
                    <h4 className="text-sm font-medium text-white mb-3">Conversas Recentes</h4>
                    <div className="space-y-2">
                      {recentConversations.map((conv) => (
                        <div
                          key={conv.name}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-[10px] font-bold text-white">
                              {conv.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">{conv.name}</p>
                              <p className="text-[10px] text-gray-500">{conv.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">{conv.time}</span>
                            <CheckCircle2 className={`w-3 h-3 ${conv.status === "success" ? "text-emerald-400" : "text-amber-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
                    <h4 className="text-sm font-medium text-white mb-3">Agenda de Hoje</h4>
                    <div className="space-y-2">
                      {[
                        { time: "09:00", name: "João Silva", service: "Corte de Cabelo" },
                        { time: "10:30", name: "Maria Oliveira", service: "Barba" },
                        { time: "14:00", name: "Pedro Santos", service: "Hidratação" },
                        { time: "16:00", name: "Ana Costa", service: "Corte + Barba" },
                      ].map((appt) => (
                        <div
                          key={appt.time}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium text-blue-400 w-10">{appt.time}</div>
                            <div>
                              <p className="text-xs font-medium text-white">{appt.name}</p>
                              <p className="text-[10px] text-gray-500">{appt.service}</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
