"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Star, Loader2, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

const planData = {
  starter: {
    name: "Starter",
    price: "R$ 59",
    period: "/mês",
    features: [
      "IA treinada para seu negócio",
      "Atendimento automático 24h",
      "Até 300 conversas/mês",
      "Lembretes automáticos",
    ],
  },
  pro: {
    name: "Pro",
    price: "R$ 119",
    period: "/mês",
    features: [
      "IA treinada para seu negócio",
      "Atendimento automático 24h",
      "Até 2.000 conversas/mês",
      "Dashboard completo",
      "Agendamento automático",
      "Relatórios e estatísticas",
      "Histórico de clientes",
      "Lembretes automáticos",
    ],
  },
  business: {
    name: "Business",
    price: "R$ 249",
    period: "/mês",
    features: [
      "IA treinada para seu negócio",
      "Atendimento automático 24h",
      "Conversas ilimitadas",
      "Dashboard completo",
      "Agendamento automático",
      "Relatórios e estatísticas",
      "Multiatendentes",
      "Integrações avançadas",
      "Múltiplas unidades",
      "Suporte prioritário 24h",
    ],
  },
};

type PlanKey = keyof typeof planData;

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useLocalStorage<PlanKey>("atendeai_plan", "pro");
  const [paymentModal, setPaymentModal] = useState<PlanKey | null>(null);
  const [paymentData, setPaymentData] = useState({ cardNumber: "", expiry: "", cvc: "", name: "" });
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "success">("form");
  const { toast } = useToast();

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  const handlePlanClick = (plan: PlanKey) => {
    if (plan === currentPlan) return;
    setPaymentModal(plan);
    setPaymentStep("form");
    setPaymentData({ cardNumber: "", expiry: "", cvc: "", name: "" });
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePayment = async () => {
    if (!paymentData.name.trim() || paymentData.cardNumber.replace(/\s/g, "").length < 13 || paymentData.expiry.length < 5 || paymentData.cvc.length < 3) {
      toast("Preencha todos os dados do cartão corretamente", "error");
      return;
    }
    setPaymentStep("processing");
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    setProcessing(false);
    setPaymentStep("success");
    await new Promise((r) => setTimeout(r, 1200));
    if (paymentModal) {
      setCurrentPlan(paymentModal);
      toast(`Plano alterado para ${planData[paymentModal].name} com sucesso!`);
    }
    setPaymentModal(null);
    setPaymentStep("form");
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Minha assinatura</h1>
        <p className="text-gray-500 text-sm">Gerencie seu plano e pagamentos.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => toast("Gerenciamento de pagamento pelo Stripe. Em breve!")}>
                Gerenciar pagamento
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-red-400"
                onClick={() => {
                  toast("Assinatura cancelada. Você terá acesso até o fim do período.", "info");
                }}
              >
                Cancelar assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Trocar de Plano</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.keys(planData) as PlanKey[]).map((key) => {
            const plan = planData[key];
            const isCurrent = key === currentPlan;
            return (
              <Card
                key={key}
                className={`bg-card/50 border-border/50 transition-all duration-300 ${
                  isCurrent ? "border-blue-500/50 ring-1 ring-blue-500/20" : "hover:border-blue-500/30 cursor-pointer"
                }`}
                onClick={() => !isCurrent && handlePlanClick(key)}
              >
                <CardContent className="p-6 text-center">
                  {isCurrent && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-xs font-semibold text-white mb-3">
                      <Star className="w-3 h-3 fill-current" />
                      Plano atual
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-white mb-4">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                  </p>
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
                    <Button variant="default" className="w-full" onClick={(e) => { e.stopPropagation(); handlePlanClick(key); }}>
                      <span className="flex items-center gap-1">
                        Assinar {plan.name}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <Modal
        open={paymentModal !== null}
        onClose={() => { if (!processing) { setPaymentModal(null); setPaymentStep("form"); } }}
        title={paymentStep === "success" ? "Pagamento Confirmado!" : paymentStep === "processing" ? "Processando..." : "Finalizar Pagamento"}
      >
        {paymentStep === "form" && paymentModal && (
          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 mb-4">
              <p className="text-sm font-medium text-white">Resumo</p>
              <p className="text-lg font-bold text-blue-400 mt-1">
                {planData[paymentModal].name} - {planData[paymentModal].price}
                <span className="text-sm font-normal text-gray-500">{planData[paymentModal].period}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Nome no cartão</Label>
              <Input id="card-name" placeholder="Nome como está no cartão" value={paymentData.name}
                onChange={(e) => setPaymentData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Número do cartão</Label>
              <div className="relative">
                <Input id="card-number" placeholder="0000 0000 0000 0000" value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                  className="pl-10" />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Validade</Label>
                <Input id="expiry" placeholder="MM/AA" value={paymentData.expiry}
                  onChange={(e) => setPaymentData((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" value={paymentData.cvc}
                  onChange={(e) => setPaymentData((p) => ({ ...p, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
              <Lock className="w-3 h-3" />
              Pagamento 100% seguro. Seus dados não são armazenados.
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setPaymentModal(null); setPaymentStep("form"); }}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Pagar {planData[paymentModal].price}
              </Button>
            </div>
          </form>
        )}

        {paymentStep === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white mb-1">Processando pagamento...</p>
            <p className="text-sm text-gray-500">Aguarde enquanto confirmamos seu pagamento.</p>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-white mb-1">Pagamento confirmado!</p>
            <p className="text-sm text-gray-500">Seu plano foi alterado com sucesso.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}


