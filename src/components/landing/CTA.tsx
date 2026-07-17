"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTA() {
  return (
    <section id="comecar" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/50 to-blue-500/5 p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/5 rounded-full blur-[60px]" />

          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Pronto para automatizar{" "}
            <span className="gradient-text">seu atendimento</span>?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Experimente gratuitamente e veja como a IA pode transformar seu negócio.
            Sem compromisso, sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-base shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
