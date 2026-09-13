"use client";

import { motion } from "framer-motion";
import { Bot, CalendarCheck, MessageSquare, UserRoundCheck } from "lucide-react";

const stages = [
  { icon: MessageSquare, label: "Entrada", detail: "Mensagem recebida pela Meta Cloud API" },
  { icon: Bot, label: "IA", detail: "Intenção e serviço validados no cadastro" },
  { icon: CalendarCheck, label: "Agenda", detail: "Disponibilidade conferida antes de reservar" },
  { icon: UserRoundCheck, label: "Equipe", detail: "Takeover humano interrompe respostas da IA" },
];

export function DashboardPreview() {
  return (
    <section className="border-y border-white/10 bg-black py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Produto em contexto
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Uma operação contínua, da mensagem ao atendimento humano.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            A interface organiza o trabalho em estados claros. O exemplo abaixo descreve o fluxo do
            produto, sem métricas ou resultados simulados.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">Fluxo de atendimento</p>
              <p className="text-xs text-zinc-500">Representação funcional do produto</p>
            </div>
            <span className="text-xs text-zinc-500">Meta Cloud API</span>
          </div>

          <div className="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
            {stages.map((stage, index) => (
              <div key={stage.label} className="min-h-48 p-5">
                <div className="mb-8 flex items-center justify-between">
                  <stage.icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  <span className="font-mono text-xs text-zinc-600">0{index + 1}</span>
                </div>
                <p className="text-sm font-semibold text-white">{stage.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{stage.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
