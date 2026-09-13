"use client";

import { motion } from "framer-motion";
import { Bot, CalendarCheck, MessageSquare, UserRoundCheck } from "lucide-react";

const steps = [
  { icon: MessageSquare, title: "Receber", description: "A mensagem chega pela Meta Cloud API." },
  { icon: Bot, title: "Entender", description: "A IA usa serviços e respostas cadastradas." },
  { icon: CalendarCheck, title: "Agendar", description: "O slot é validado e reservado no banco." },
  {
    icon: UserRoundCheck,
    title: "Assumir",
    description: "A equipe pode tomar a conversa sem disputa com a IA.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-black py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Como funciona
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Automação com saída clara para a equipe.
          </h2>
        </div>

        <div className="grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="border-b border-r border-white/10 p-6"
            >
              <div className="mb-10 flex items-center justify-between">
                <step.icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                <span className="font-mono text-xs text-zinc-600">0{index + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
