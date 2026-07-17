"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Play, MessageSquareMore, Bot, CalendarCheck, Bell, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

const floatingIcons = [
  { Icon: MessageSquareMore, delay: 0, x: -120, y: -60 },
  { Icon: Bot, delay: 0.3, x: 140, y: -40 },
  { Icon: CalendarCheck, delay: 0.6, x: -80, y: 70 },
  { Icon: Bell, delay: 0.9, x: 160, y: 60 },
];

export function Hero() {
  const { toast } = useToast();
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name.trim() || !demoForm.email.trim() || !demoForm.phone.trim()) {
      toast("Preencha todos os campos obrigatórios", "error");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    const demos = JSON.parse(localStorage.getItem("atendeai_demos") || "[]");
    demos.push({ ...demoForm, date: new Date().toISOString() });
    localStorage.setItem("atendeai_demos", JSON.stringify(demos));
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setDemoOpen(false);
      setSent(false);
      setDemoForm({ name: "", email: "", phone: "", company: "" });
      toast("Demonstração agendada! Entraremos em contato em até 24h.");
    }, 1500);
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-blue-400 font-medium">
                IA disponível 24 horas por dia
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
            >
              Seu novo{" "}
              <span className="gradient-text">atendente virtual</span>
              <br />
              trabalha 24 horas por dia.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-gray-400 max-w-xl mb-8 leading-relaxed"
            >
              Automatize seu atendimento no WhatsApp com Inteligência Artificial.
              Responda clientes automaticamente, agende consultas, envie lembretes
              e aumente suas vendas sem contratar mais funcionários.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40">
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base group"
                onClick={() => setDemoOpen(true)}
              >
                <Play className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                Agendar Demonstração
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex items-center gap-6 mt-10"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0F172A] bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-white">+2.000 empresas</p>
                <p className="text-xs text-gray-500">já estão usando</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {floatingIcons.map(({ Icon, delay, x, y }) => (
              <motion.div
                key={delay}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + delay, duration: 0.4, type: "spring" }}
                className="absolute animate-float"
                style={{ animationDelay: `${delay}s` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-lg"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
              </motion.div>
            ))}

            <div className="relative">
              <div className="w-full aspect-[4/3] rounded-2xl glass overflow-hidden shadow-2xl shadow-black/30 border border-border/50">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-3 py-1 rounded-lg bg-secondary/80 text-xs text-gray-400">
                        atendeai.app/dashboard
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-48 space-y-2">
                      {["Dashboard", "Conversas", "Agenda", "Clientes"].map((item, i) => (
                        <div
                          key={item}
                          className={`px-3 py-2 rounded-lg text-xs ${
                            i === 0
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-gray-500 hover:text-gray-300"
                          } transition-colors`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Resumo</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Online
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Clientes", value: "1.247", change: "+12%" },
                          { label: "Conversas", value: "89", change: "+8%" },
                          { label: "Agendamentos", value: "34", change: "+23%" },
                          { label: "Taxa", value: "98%", change: "+2%" },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="px-3 py-2 rounded-xl bg-secondary/50 border border-border/30"
                          >
                            <p className="text-[10px] text-gray-500">{stat.label}</p>
                            <p className="text-sm font-bold text-white">{stat.value}</p>
                            <p className="text-[10px] text-emerald-400">{stat.change}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-16 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center">
                        <div className="flex items-end gap-1 h-8">
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div
                              key={i}
                              className="w-4 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400 transition-all hover:opacity-80"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 w-64 h-32 rounded-xl glass border border-border/50 p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <MessageSquareMore className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-300">Nova mensagem</span>
                </div>
                <p className="text-xs text-gray-500">
                  Olá! Gostaria de agendar um horário para hoje?
                </p>
                <div className="flex gap-1.5 mt-2">
                  <div className="px-2 py-0.5 rounded bg-blue-500/20 text-[10px] text-blue-400">
                    Responder
                  </div>
                  <div className="px-2 py-0.5 rounded bg-secondary text-[10px] text-gray-500">
                    Agendar
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Modal open={demoOpen} onClose={() => { if (!sending) setDemoOpen(false); }} title="Agendar Demonstração">
        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-white mb-1">Solicitação enviada!</p>
            <p className="text-sm text-gray-500">Entraremos em contato em até 24 horas.</p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">
              Preencha seus dados que entraremos em contato para agendar uma demonstração personalizada.
            </p>
            <div className="space-y-2">
              <Label htmlFor="demo-name">Nome *</Label>
              <Input id="demo-name" placeholder="Seu nome" value={demoForm.name}
                onChange={(e) => setDemoForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email *</Label>
              <Input id="demo-email" type="email" placeholder="seu@email.com" value={demoForm.email}
                onChange={(e) => setDemoForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-phone">Telefone *</Label>
              <Input id="demo-phone" placeholder="(11) 99999-8888" value={demoForm.phone}
                onChange={(e) => setDemoForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-company">Empresa</Label>
              <Input id="demo-company" placeholder="Nome da sua empresa" value={demoForm.company}
                onChange={(e) => setDemoForm((p) => ({ ...p, company: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Solicitar Demonstração"}
            </Button>
          </form>
        )}
      </Modal>
    </section>
  );
}
