"use client";

import { motion } from "framer-motion";
import {
  Scissors,
  Stethoscope,
  Sparkles,
  Smile,
  Brain,
  Dumbbell,
  Wrench,
  UtensilsCrossed,
  UserRound,
  Store,
} from "lucide-react";

const niches = [
  { icon: Scissors, title: "Barbearias", color: "from-blue-500 to-blue-400" },
  { icon: Stethoscope, title: "Clínicas", color: "from-violet-500 to-violet-400" },
  { icon: Sparkles, title: "Salões", color: "from-pink-500 to-pink-400" },
  { icon: Smile, title: "Dentistas", color: "from-cyan-500 to-cyan-400" },
  { icon: Brain, title: "Psicólogos", color: "from-purple-500 to-purple-400" },
  { icon: Dumbbell, title: "Academias", color: "from-emerald-500 to-emerald-400" },
  { icon: Wrench, title: "Oficinas", color: "from-amber-500 to-amber-400" },
  { icon: UtensilsCrossed, title: "Restaurantes", color: "from-orange-500 to-orange-400" },
  { icon: UserRound, title: "Consultórios", color: "from-teal-500 to-teal-400" },
  { icon: Store, title: "Pequenos negócios", color: "from-indigo-500 to-indigo-400" },
];

export function Niches() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ideal para{" "}
            <span className="gradient-text">todo tipo de negócio</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Solução versátil que se adapta ao seu segmento
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {niches.map((niche, index) => (
            <motion.div
              key={niche.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-blue-500/30 transition-all duration-300 text-center cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${niche.color} p-0.5 mx-auto mb-4`}>
                <div className="w-full h-full rounded-xl bg-[#0F172A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <niche.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-white">{niche.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
