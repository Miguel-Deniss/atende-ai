"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, Lock, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface Plan {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  trialDays: number;
  features: string[];
}

interface SubscriptionData {
  planType: string;
  status: string;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  expiresAt: string | null;
  price: number;
  planName: string;
  features: string[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string | null;
}

interface BillingEntry {
  id: string;
  action: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  TRIALING: { label: "Período de teste", variant: "warning" },
  PAST_DUE: { label: "Pagamento pendente", variant: "destructive" },
  CANCELED: { label: "Cancelado", variant: "secondary" },
  INCOMPLETE: { label: "Aguardando pagamento", variant: "warning" },
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [history, setHistory] = useState<BillingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<{ valid: boolean; reason?: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, historyRes] = await Promise.all([
        fetch("/api/billing/plans", { credentials: "include" }),
        fetch("/api/subscription", { credentials: "include" }),
        fetch("/api/billing/history?limit=10", { credentials: "include" }),
      ]);

      const [plansData, subData, historyData] = await Promise.all([
        plansRes.json(),
        subRes.json(),
        historyRes.json(),
      ]);

      if (plansData.success) setPlans(plansData.data ?? []);
      if (subData.success) setSubscription(subData.data);
      if (historyData.success) setHistory(historyData.data ?? []);
    } catch {
      // página continua com dados vazios
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const status = searchParams.get("checkout");
    if (status === "success") {
      toast("Pagamento aprovado! Sua assinatura está ativa.");
      loadData();
    } else if (status === "cancel") {
      toast("Checkout cancelado. Nenhuma cobrança foi realizada.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    const res = await fetch("/api/billing/coupons/validate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, planCode: selectedPlan.code }),
    });
    const data = await res.json();
    if (data.success) {
      setCouponInfo({ valid: data.data.valid, reason: data.data.reason });
      if (!data.data.valid) {
        toast(data.data.reason || "Cupom inválido", "error");
      }
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: selectedPlan.code,
          couponCode: couponInfo?.valid ? couponCode : undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast(data.error || "Erro ao iniciar checkout", "error");
        return;
      }

      if (data.data.mode === "stripe" && data.data.url) {
        window.location.href = data.data.url;
        return;
      }

      if (data.data.mode === "demo") {
        toast("Plano ativado (modo demonstração)!");
        setSelectedPlan(null);
        setCouponCode("");
        setCouponInfo(null);
        await loadData();
      }
    } catch {
      toast("Erro ao conectar com o servidor", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenPortal = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        toast(data.error || "Portal indisponível", "error");
      }
    } catch {
      toast("Erro ao conectar com o servidor", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Deseja cancelar sua assinatura? O acesso continuará até o fim do ciclo atual.")) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast(data.data.message || "Assinatura cancelada");
        await loadData();
      } else {
        toast(data.error || "Erro ao cancelar assinatura", "error");
      }
    } catch {
      toast("Erro ao conectar com o servidor", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const statusBadge = STATUS_LABEL[subscription?.status ?? ""] ?? STATUS_LABEL.CANCELED;
  const isPaid = subscription?.stripeCustomerId != null;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Minha assinatura</h1>
        <p className="text-gray-500 text-sm">Gerencie seu plano, pagamentos e cobranças.</p>
      </motion.div>

      {subscription?.status === "PAST_DUE" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Pagamento pendente</p>
              <p className="text-sm text-gray-400">
                Atualize sua forma de pagamento para reativar o acesso completo.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-card/50 border-border/50 max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Plano Atual</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Detalhes da sua assinatura</p>
              </div>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-6">
              <span className="text-3xl font-bold text-white">{subscription?.planName ?? "—"}</span>
              <span className="text-sm text-gray-500">
                {subscription?.price ? formatBRL(subscription.price) + "/mês" : "Grátis"}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-gray-500 text-xs mb-1">Próxima cobrança</p>
                <p className="text-white font-medium">{formatDate(subscription?.nextBillingDate)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-gray-500 text-xs mb-1">
                  {subscription?.status === "TRIALING" ? "Fim do teste" : "Início do plano"}
                </p>
                <p className="text-white font-medium">
                  {formatDate(subscription?.status === "TRIALING" ? subscription?.trialEndsAt : subscription?.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mb-6">
              {(subscription?.features?.length ? subscription.features : ["Sem recursos disponíveis"]).map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            {isPaid && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleOpenPortal} disabled={processing}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar pagamento
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={processing}>
                  Cancelar assinatura
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <h2 className="text-lg font-semibold text-white mb-4">Planos disponíveis</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.filter((p) => p.code !== "FREE").map((plan) => {
            const isCurrent = plan.code === subscription?.planType;
            return (
              <Card key={plan.id}
                className={`bg-card/50 border-border/50 transition-all duration-300 ${isCurrent ? "border-blue-500/50 ring-1 ring-blue-500/20" : "hover:border-blue-500/30 cursor-pointer"}`}
                onClick={() => !isCurrent && setSelectedPlan(plan)}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-white mb-4">
                    {formatBRL(plan.price)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    {(plan.features ?? []).slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                    {(plan.features ?? []).length > 4 && (
                      <li className="text-xs text-gray-600">+{plan.features.length - 4} mais recursos</li>
                    )}
                  </ul>
                  {isCurrent ? (
                    <Badge variant="success" className="w-full justify-center">Plano atual</Badge>
                  ) : (
                    <Button variant="default" className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}>
                      Assinar {plan.name} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="bg-card/50 border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Histórico de cobranças</CardTitle>
              <CardDescription>Últimas transações da sua assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-white font-medium">{entry.description ?? entry.action}</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {entry.action === "PAYMENT_SUCCESS" ? "+" : "−"}{formatBRL(entry.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{entry.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal
        open={selectedPlan !== null}
        onClose={() => { setSelectedPlan(null); setCouponCode(""); setCouponInfo(null); }}
        title={`Assinar ${selectedPlan?.name ?? ""}`}
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <p className="text-sm font-medium text-white">Resumo da assinatura</p>
              <p className="text-lg font-bold text-blue-400 mt-1">
                {selectedPlan.name} — {formatBRL(selectedPlan.price)}/mês
              </p>
              {subscription?.planType && subscription.planType !== selectedPlan.code && (
                <p className="text-sm text-gray-400 mt-1">
                  {subscription.planName} → {selectedPlan.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon">Cupom de desconto (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="CUPOM10"
                  className="uppercase"
                />
                <Button type="button" variant="outline" onClick={validateCoupon} disabled={!couponCode.trim()}>
                  Aplicar
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              Pagamento processado com segurança via Stripe
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSelectedPlan(null); setCouponCode(""); setCouponInfo(null); }}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCheckout} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar agora"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
