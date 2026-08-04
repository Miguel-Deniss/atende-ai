"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Loader2, RefreshCcw, Server, Shield, KeyRound, Webhook, MinusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface IntegrationStatus {
  configured: boolean;
  webhook?: string;
}

interface SettingsData {
  environment: string;
  nodeEnv: string;
  baseUrl: string;
  appVersion: string;
  plans: {
    code: string;
    name: string;
    price: number;
    trialDays: number;
    isActive: boolean;
    _count: { subscriptions: number };
  }[];
  integrations: {
    stripe: IntegrationStatus;
    whatsapp: IntegrationStatus;
    resend: IntegrationStatus;
    openai: IntegrationStatus;
  };
  webhookSummary: Record<string, Record<string, number>>;
  apiKeyCount: number;
  config: {
    appUrl: boolean;
    databaseUrl: boolean;
    jwtSecret: boolean;
    sessionSecret: boolean;
  };
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings", { credentials: "include" });
    const d = await res.json();
    if (d.success) setData(d.data);
    else toast(d.error || "Erro ao carregar configurações", "error");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-400">Erro ao carregar configurações</p>;
  }

  const integrations = [
    { name: "Stripe", key: "stripe", icon: "💳", detail: data.integrations.stripe.webhook },
    { name: "WhatsApp Cloud API", key: "whatsapp", icon: "📱", detail: data.integrations.whatsapp.webhook },
    { name: "Resend (E-mails)", key: "resend", icon: "✉️", detail: undefined },
    { name: "OpenAI (IA)", key: "openai", icon: "🤖", detail: undefined },
  ] as const;

  const configEntries = [
    { label: "NEXT_PUBLIC_APP_URL", ok: data.config.appUrl },
    { label: "DATABASE_URL", ok: data.config.databaseUrl },
    { label: "JWT_SECRET", ok: data.config.jwtSecret },
    { label: "SESSION_SECRET", ok: data.config.sessionSecret },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Configurações</h1>
          <p className="text-gray-500 text-sm">Status do sistema e integrações</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCcw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-semibold text-white">Sistema</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Ambiente" value={data.environment} />
              <InfoRow label="Node env" value={data.nodeEnv} />
              <InfoRow label="Versão do app" value={data.appVersion} />
              <InfoRow label="URL base" value={data.baseUrl || "não configurada"} mono />
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm text-gray-400">Chaves de API emitidas</span>
                <span className="text-sm font-medium text-white">{data.apiKeyCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Variáveis de Ambiente</h3>
            </div>
            <div className="space-y-3">
              {configEntries.map((c) => (
                <div key={c.label} className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-300">{c.label}</span>
                  {c.ok ? (
                    <Badge variant="success" className="text-[10px]">Configurada</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Ausente</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Webhook className="w-4 h-4 text-violet-400" />
              <h3 className="text-base font-semibold text-white">Integrações</h3>
            </div>
            <div className="space-y-4">
              {integrations.map((int) => {
                const status = data.integrations[int.key];
                return (
                  <div key={int.key} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-lg">{int.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{int.name}</p>
                        {int.detail && (
                          <p className="text-xs font-mono text-gray-600 truncate">{int.detail}</p>
                        )}
                      </div>
                    </div>
                    {status.configured ? (
                      <Badge variant="success" className="text-[10px] flex-shrink-0">Configurada</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        <MinusCircle className="w-3 h-3 mr-1" /> Não configurada
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            {Object.keys(data.webhookSummary).length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/30">
                <p className="text-xs text-gray-500 mb-2">Eventos de webhook recebidos</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(data.webhookSummary).map(([provider, statuses]) => (
                    <div key={provider} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{provider}</Badge>
                      {Object.entries(statuses).map(([status, count]) => (
                        <span key={status} className="text-xs text-gray-500">
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Planos</h3>
            </div>
            <div className="space-y-2">
              {data.plans.map((plan) => (
                <div key={plan.code} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{plan.name}</span>
                    <Badge variant={plan.isActive ? "success" : "secondary"} className="text-[10px]">
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatBRL(plan.price)}<span className="text-xs text-gray-500">/mês</span></p>
                    <p className="text-xs text-gray-600">Trial: {plan.trialDays}d · {plan._count.subscriptions} assinantes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm text-white ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</span>
    </div>
  );
}
