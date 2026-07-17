"use client";

import { motion } from "framer-motion";
import {
  MessageSquareMore,
  Bot,
  CalendarCheck,
  Bell,
  BarChart3,
  History,
  Users,
  TrendingUp,
  Smartphone,
  Settings2,
} from "lucide-react";

const features = [
  {
    icon: MessageSquareMore,
    title: "Atendimento 24h",
    description: "Seus clientes são atendidos a qualquer hora, todos os dias da semana.",
  },
  {
    icon: Bot,
    title: "Inteligência Artificial",
    description: "IA treinada com as informações do seu negócio para respostas precisas.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento automático",
    description: "Clientes agendam horários diretamente pelo WhatsApp sem intervenção humana.",
  },
  {
    icon: Bell,
    title: "Lembretes automáticos",
    description: "Envie lembretes automáticos para reduzir faltas e aumentar a taxa de comparecimento.",
  },
  {
    icon: BarChart3,
    title: "Dashboard completo",
    description: "Acompanhe métricas e desempenho do seu atendimento em tempo real.",
  },
  {
    icon: History,
    title: "Histórico de clientes",
    description: "Todo o histórico de conversas fica salvo para consulta futura.",
  },
  {
    icon: Users,
    title: "Transferência para humano",
    description: "Quando necessário, a IA transfere o atendimento para um atendente real.",
  },
  {
    icon: TrendingUp,
    title: "Estatísticas",
    description: "Relatórios detalhados sobre volume de atendimentos e horários de pico.",
  },
  {
    icon: Smartphone,
    title: "Integração com WhatsApp",
    description: "Funciona direto no WhatsApp Web. Seus clientes não precisam baixar nada.",
  },
  {
    icon: Settings2,
    title: "Configuração personalizada",
    description: "Personalize respostas, horários e serviços de acordo com seu negócio.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa em{" "}
            <span className="gradient-text">um só lugar</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Recursos poderosos para transformar o atendimento do seu negócio
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
