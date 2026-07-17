"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Eduardo",
    role: "Barbeiro - Barbearia Vintage",
    content: "Desde que comecei a usar o AtendeAI, nunca mais perdi um cliente. A IA responde rapidinho e meus agendamentos aumentaram 40%. Recomendo de olhos fechados!",
    rating: 5,
    initials: "CE",
    color: "from-blue-500 to-blue-400",
  },
  {
    name: "Ana Beatriz",
    role: "Dentista - Clínica Sorriso",
    content: "O melhor investimento que fiz no meu consultório. Reduzi as faltas em 80% com os lembretes automáticos e minhas pacientes adoram a facilidade de agendar pelo WhatsApp.",
    rating: 5,
    initials: "AB",
    color: "from-violet-500 to-violet-400",
  },
  {
    name: "Ricardo Oliveira",
    role: "CEO - Academia FitMais",
    content: "AtendeAI transformou nosso atendimento. Conseguiramos atender 3x mais alunos sem precisar contratar ninguém. Dashboard incrível e suporte excelente!",
    rating: 5,
    initials: "RO",
    color: "from-emerald-500 to-emerald-400",
  },
];

export function Testimonials() {
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
            O que nossos{" "}
            <span className="gradient-text">clientes dizem</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Empresários reais que transformaram seus negócios
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group p-8 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-blue-500/20 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-gray-300 leading-relaxed mb-6 text-sm">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-sm font-bold text-white`}>
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
