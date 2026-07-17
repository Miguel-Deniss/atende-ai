"use client";

import { motion } from "framer-motion";
import { Clock, Users, Bell, CalendarX, TrendingUp, Moon } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize tempo",
    description: "Automatize respostas repetitivas e foque no que realmente importa.",
    color: "from-blue-500 to-blue-400",
  },
  {
    icon: Users,
    title: "Atenda mais clientes",
    description: "Sua capacidade de atendimento multiplica sem contratar mais pessoas.",
    color: "from-violet-500 to-violet-400",
  },
  {
    icon: Bell,
    title: "Nunca esqueça um agendamento",
    description: "Lembretes automáticos garantem que seus clientes não percam horários.",
    color: "from-emerald-500 to-emerald-400",
  },
  {
    icon: CalendarX,
    title: "Reduza faltas",
    description: "Lembretes inteligentes diminuem significativamente as taxas de ausência.",
    color: "from-amber-500 to-amber-400",
  },
  {
    icon: TrendingUp,
    title: "Aumente suas vendas",
    description: "Atendimento rápido e eficiente converte mais clientes em vendas.",
    color: "from-rose-500 to-rose-400",
  },
  {
    icon: Moon,
    title: "Disponível 24 horas",
    description: "Seu negócio funciona mesmo enquanto você dorme.",
    color: "from-indigo-500 to-indigo-400",
  },
];

export function Benefits() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Benefícios que{" "}
            <span className="gradient-text">transformam</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Veja como o AtendeAI pode revolucionar seu negócio
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/30 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${benefit.color} p-0.5 mb-5`}>
                <div className="w-full h-full rounded-2xl bg-[#111827] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
