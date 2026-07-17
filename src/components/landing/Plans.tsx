"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "R$ 59",
    period: "/mês",
    description: "Perfeito para começar",
    features: [
      "IA treinada para seu negócio",
      "Atendimento automático 24h",
      "Até 300 conversas/mês",
      "Lembretes automáticos",
      "Integração com WhatsApp",
    ],
    cta: "Começar",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 119",
    period: "/mês",
    description: "Mais popular",
    features: [
      "Tudo do Starter +",
      "Dashboard completo",
      "Agendamento automático",
      "Relatórios e estatísticas",
      "Até 2.000 conversas/mês",
      "Histórico de clientes",
    ],
    cta: "Começar",
    highlighted: true,
    badge: "Mais Popular",
  },
  {
    name: "Business",
    price: "R$ 249",
    period: "/mês",
    description: "Para crescer",
    features: [
      "Tudo do Pro +",
      "Multiatendentes",
      "Integrações avançadas",
      "Múltiplas unidades",
      "Suporte prioritário 24h",
      "Conversas ilimitadas",
    ],
    cta: "Começar",
    highlighted: false,
  },
];

export function Plans() {
  return (
    <section id="planos" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Planos{" "}
            <span className="gradient-text">simples e transparentes</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Escolha o plano ideal para o seu negócio
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                plan.highlighted
                  ? "border-blue-500/50 bg-gradient-to-b from-card to-blue-500/5 shadow-xl shadow-blue-500/10 scale-105 lg:scale-110"
                  : "border-border/50 bg-card/50 hover:border-blue-500/30"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-xs font-semibold text-white shadow-lg">
                    <Star className="w-3 h-3 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? "text-blue-400" : "text-emerald-400"
                    }`} />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="#comecar">
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full group"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
