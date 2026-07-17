"use client";

import { motion } from "framer-motion";
import { MessageSquare, Bot, CalendarCheck, Bell } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Cliente envia mensagem",
    description: "O cliente manda uma mensagem no WhatsApp do seu negócio.",
    color: "from-blue-500 to-blue-400",
  },
  {
    icon: Bot,
    title: "IA responde automaticamente",
    description: "Nossa IA responde com informações precisas sobre seus serviços e horários.",
    color: "from-violet-500 to-violet-400",
  },
  {
    icon: CalendarCheck,
    title: "Cliente agenda um horário",
    description: "O cliente escolhe o melhor horário e confirma o agendamento.",
    color: "from-emerald-500 to-emerald-400",
  },
  {
    icon: Bell,
    title: "Você recebe a notificação",
    description: "A empresa recebe uma notificação com todos os detalhes do atendimento.",
    color: "from-amber-500 to-amber-400",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Como{" "}
            <span className="gradient-text">funciona</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Em apenas 4 passos simples, você automatiza todo o seu atendimento
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/20 via-blue-400/40 to-blue-500/20 -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative group"
              >
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 shadow-lg`}>
                      <div className="w-full h-full rounded-2xl bg-[#111827] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
