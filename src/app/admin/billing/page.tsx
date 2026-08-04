"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Building2, CreditCard, TrendingUp, Loader2, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Transaction {
  id: string;
  companyName: string;
  action: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface BillingData {
  totals: { companies: number; activeSubscriptions: number };
  mrr: number;
  planDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  recentTransactions: Transaction[];
}

export default function AdminBillingPage() {
  const { toast } = useToast();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/billing", { credentials: "include" });
    const d = await res.json();
    if (d.success) setData(d.data);
    else toast(d.error || "Erro ao carregar financeiro", "error");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    ACTIVE: { label: "Ativa", variant: "success" },
    TRIALING: { label: "Trial", variant: "warning" },
    PAST_DUE: { label: "Vencida", variant: "destructive" },
    CANCELED: { label: "Cancelada", variant: "secondary" },
    INCOMPLETE: { label: "Incompleta", variant: "secondary" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-400">Erro ao carregar financeiro</p>;
  }

  const cards = [
    { icon: Building2, label: "Empresas", value: data.totals.companies.toLocaleString("pt-BR"), color: "from-blue-500 to-blue-400" },
    { icon: CreditCard, label: "Assinaturas Ativas", value: data.totals.activeSubscriptions.toLocaleString("pt-BR"), color: "from-emerald-500 to-emerald-400" },
    { icon: Wallet, label: "MRR", value: formatBRL(data.mrr), color: "from-amber-500 to-amber-400" },
    { icon: TrendingUp, label: "Faturamento Anual (MRR × 12)", value: formatBRL(data.mrr * 12), color: "from-violet-500 to-violet-400" },
  ];

  const actionBadge = (action: string) => {
    const colors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      SUBSCRIPTION_CREATED: "success",
      SUBSCRIPTION_RENEWED: "success",
      PAYMENT_SUCCESS: "success",
      PAYMENT_FAILURE: "destructive",
      SUBSCRIPTION_CANCELED: "destructive",
      PLAN_CHANGE: "warning",
      TRIAL_STARTED: "warning",
    };
    return <Badge variant={colors[action] || "secondary"} className="text-[10px]">{action}</Badge>;
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financeiro</h1>
          <p className="text-gray-500 text-sm">Visão geral das assinaturas e receita</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCcw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} p-0.5 mb-3`}>
                  <div className="w-full h-full rounded-xl bg-[#111827] flex items-center justify-center">
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-white mb-4">Distribuição por Plano</h3>
            <div className="space-y-3">
              {Object.entries(data.planDistribution).map(([plan, count]) => {
                const total = Object.values(data.planDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{plan}</span>
                      <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-white mb-4">Status das Assinaturas</h3>
            <div className="space-y-3">
              {Object.entries(data.statusDistribution).map(([status, count]) => {
                const total = Object.values(data.statusDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                const meta = statusLabels[status] || { label: status, variant: "secondary" as const };
                return (
                  <div key={status} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Transações Recentes</h3>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma transação registrada</p>
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {actionBadge(tx.action)}
                      <span className="text-sm font-medium text-white">{tx.companyName}</span>
                    </div>
                    {tx.description && <p className="text-xs text-gray-500 mt-1">{tx.description}</p>}
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(tx.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{formatBRL(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-600">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
