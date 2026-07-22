"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Star, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useState, useEffect } from "react";

const planData = {
  starter: { name: "Starter", price: "R$ 59", period: "/mês", features: ["IA treinada para seu negócio", "Atendimento automático 24h", "Até 300 conversas/mês", "Lembretes automáticos"] },
  pro: { name: "Pro", price: "R$ 119", period: "/mês", features: ["IA treinada para seu negócio", "Atendimento automático 24h", "Até 2.000 conversas/mês", "Dashboard completo", "Agendamento automático", "Relatórios e estatísticas", "Histórico de clientes", "Lembretes automáticos"] },
  business: { name: "Business", price: "R$ 249", period: "/mês", features: ["IA treinada para seu negócio", "Atendimento automático 24h", "Conversas ilimitadas", "Dashboard completo", "Agendamento automático", "Relatórios e estatísticas", "Multiatendentes", "Integrações avançadas", "Múltiplas unidades", "Suporte prioritário 24h"] },
};

type PlanKey = keyof typeof planData;

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("pro");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  useEffect(() => {
    fetch("/api/subscription", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.planType) {
          setCurrentPlan(d.data.planType.toLowerCase() as PlanKey);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  const handlePlanChange = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: selectedPlan.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPlan(selectedPlan);
        toast(`Plano alterado para ${planData[selectedPlan].name} com sucesso!`);
      } else {
        toast(data.error || "Erro ao alterar plano", "error");
      }
    } catch {
      toast("Erro ao conectar com o servidor", "error");
    }
    setProcessing(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Minha assinatura</h1>
        <p className="text-gray-500 text-sm">Gerencie seu plano e pagamentos.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-card/50 border-border/50 max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Plano Atual</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Detalhes da sua assinatura</p>
              </div>
              <Badge variant="success" className="capitalize">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-white">{planData[currentPlan].price}</span>
              <span className="text-sm text-gray-500">{planData[currentPlan].period}</span>
              <span className="ml-2 text-xs text-gray-500">
                Próxima cobrança: {nextBilling.toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mb-6">
              {planData[currentPlan].features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <h2 className="text-lg font-semibold text-white mb-4">Trocar de Plano</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.keys(planData) as PlanKey[]).map((key) => {
            const plan = planData[key];
            const isCurrent = key === currentPlan;
            return (
              <Card key={key}
                className={`bg-card/50 border-border/50 transition-all duration-300 ${isCurrent ? "border-blue-500/50 ring-1 ring-blue-500/20" : "hover:border-blue-500/30 cursor-pointer"}`}
                onClick={() => !isCurrent && setSelectedPlan(key)}>
                <CardContent className="p-6 text-center">
                  {isCurrent && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-xs font-semibold text-white mb-3">
                      <Star className="w-3 h-3 fill-current" />
                      Plano atual
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-white mb-4">{plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span></p>
                  <ul className="text-left space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-gray-600">+{plan.features.length - 4} mais recursos</li>
                    )}
                  </ul>
                  {!isCurrent && (
                    <Button variant="default" className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedPlan(key); }}>
                      Assinar {plan.name} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <Modal open={selectedPlan !== null} onClose={() => setSelectedPlan(null)}
        title={`Alterar para ${selectedPlan ? planData[selectedPlan].name : ""}`}>
        {selectedPlan && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <p className="text-sm font-medium text-white">Resumo da alteração</p>
              <p className="text-lg font-bold text-blue-400 mt-1">
                {planData[currentPlan].name} → {planData[selectedPlan].name}
              </p>
              <p className="text-sm text-gray-400 mt-1">{planData[selectedPlan].price}{planData[selectedPlan].period}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              Pagamento processado com segurança via Stripe
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedPlan(null)} disabled={processing}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handlePlanChange} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Alterar para ${planData[selectedPlan].name}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
