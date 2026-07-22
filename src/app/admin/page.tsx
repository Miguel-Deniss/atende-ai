"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStats {
  companies: { total: number; active: number; suspended: number };
  users: number;
  clients: number;
  appointments: number;
  newCompaniesThisMonth: number;
  planDistribution: Record<string, number>;
  estimatedMRR: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-gray-400">Erro ao carregar estatísticas</p>;
  }

  const cards = [
    { icon: Building2, label: "Empresas Ativas", value: stats.companies.active, total: stats.companies.total, color: "from-blue-500 to-blue-400" },
    { icon: Users, label: "Usuários", value: stats.users, color: "from-violet-500 to-violet-400" },
    { icon: TrendingUp, label: "Clientes", value: stats.clients, color: "from-emerald-500 to-emerald-400" },
    { icon: DollarSign, label: "MRR Estimado", value: `R$ ${stats.estimatedMRR.toLocaleString("pt-BR")}`, color: "from-amber-500 to-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Painel Administrativo</h1>
        <p className="text-gray-500 text-sm">Visão geral do sistema</p>
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
            <h3 className="text-base font-semibold text-white mb-4">Distribuição de Planos</h3>
            <div className="space-y-3">
              {Object.entries(stats.planDistribution).map(([plan, count]) => {
                const total = stats.companies.active;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{plan === "STARTER" ? "Starter" : plan === "PRO" ? "Pro" : "Business"}</span>
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
            <h3 className="text-base font-semibold text-white mb-4">Resumo</h3>
            <div className="space-y-4">
              <Row label="Total de empresas" value={stats.companies.total} />
              <Row label="Empresas ativas" value={stats.companies.active} />
              <Row label="Empresas suspensas" value={stats.companies.suspended} />
              <Row label="Novas este mês" value={stats.newCompaniesThisMonth} />
              <Row label="Agendamentos" value={stats.appointments} />
              <Row label="MRR Estimado" value={`R$ ${stats.estimatedMRR.toLocaleString("pt-BR")}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
