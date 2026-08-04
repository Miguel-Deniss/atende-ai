"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Users, Loader2, ArrowLeft, Mail, Phone, MapPin, Clock,
  Shield, MessageSquare, CalendarDays, FileText, Trash2, CheckCircle2,
  AlertTriangle, KeyRound, Smartphone, Layers, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  document: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  welcomeMessage: string | null;
  status: string;
  planType: string;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  aiContext: string | null;
  users: CompanyUser[];
  settings: { autoTransfer: boolean; autoReminders: boolean; requireConfirmation: boolean } | null;
  aiConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string | null;
    services: { id: string; name: string; price: string }[];
    faq: { id: string; question: string; answer: string }[];
  } | null;
  subscription: {
    id: string;
    status: string;
    startedAt: string;
    expiresAt: string | null;
    nextBillingDate: string | null;
    canceledAt: string | null;
    plan: { code: string; name: string; price: number };
    coupon: { code: string; discountValue: number; discountType: string } | null;
  } | null;
  billingHistory: {
    id: string;
    action: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: string;
  }[];
  whatsAppConfig: { phoneNumber: string; status: string } | null;
  _count: {
    users: number;
    clients: number;
    appointments: number;
    conversations: number;
    uploads: number;
    auditLogs: number;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  EMPLOYEE: "Funcionário",
  FINANCIAL: "Financeiro",
};

const statusMeta: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Ativa", variant: "success" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

const subStatusMeta: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Ativa", variant: "success" },
  TRIALING: { label: "Trial", variant: "warning" },
  PAST_DUE: { label: "Vencida", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
  INCOMPLETE: { label: "Incompleta", variant: "secondary" },
};

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/companies/${id}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) setCompany(data.data);
    else toast(data.error || "Erro ao carregar empresa", "error");
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatus = async (status: string) => {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`Empresa ${status === "ACTIVE" ? "ativada" : "suspensa"}`);
      load();
    } else {
      toast(data.error || "Erro ao atualizar", "error");
    }
  };

  const handlePlan = async (planType: string) => {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType }),
    });
    const data = await res.json();
    if (data.success) {
      toast("Plano alterado");
      load();
    } else {
      toast(data.error || "Erro ao alterar plano", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir definitivamente esta empresa e todos os seus dados? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      toast("Empresa excluída");
      router.push("/admin/companies");
    } else {
      toast(data.error || "Erro ao excluir empresa", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!company) {
    return <p className="text-gray-400">Empresa não encontrada</p>;
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = statusMeta[company.status] || { label: company.status, variant: "secondary" as const };
  const subBadge = company.subscriptionStatus
    ? subStatusMeta[company.subscriptionStatus] || { label: company.subscriptionStatus, variant: "secondary" as const }
    : null;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => router.push("/admin/companies")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Empresas
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              {subBadge && <Badge variant={subBadge.variant}>{subBadge.label}</Badge>}
            </div>
            <p className="text-gray-500 text-sm">slug: {company.slug} · criada em {formatDate(company.createdAt)}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {company.status === "ACTIVE" ? (
              <Button variant="destructive" size="sm" onClick={() => handleStatus("SUSPENDED")}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Suspender
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => handleStatus("ACTIVE")}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Reativar
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários ({company.users.length})</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Dados Cadastrais</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Info icon={Building2} label="Documento" value={company.document || "—"} />
                    <Info icon={Phone} label="Telefone" value={company.phone || "—"} />
                    <Info icon={Mail} label="E-mail" value={company.users.find((u) => u.role === "ADMIN")?.email || company.users[0]?.email || "—"} />
                    <Info icon={MapPin} label="Endereço" value={company.address || "—"} />
                    <Info icon={Clock} label="Horários" value={company.hours || "—"} />
                    <Info icon={KeyRound} label="Trial termina" value={formatDate(company.trialEndsAt)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Contadores</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Stat icon={Users} label="Usuários" value={company._count.users} />
                    <Stat icon={MessageSquare} label="Conversas" value={company._count.conversations} />
                    <Stat icon={CalendarDays} label="Agendamentos" value={company._count.appointments} />
                    <Stat icon={FileText} label="Clientes" value={company._count.clients} />
                    <Stat icon={Layers} label="Uploads" value={company._count.uploads} />
                    <Stat icon={Shield} label="Auditoria" value={company._count.auditLogs} />
                  </div>
                </CardContent>
              </Card>

              {company.welcomeMessage && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-white mb-2">Mensagem de boas-vindas</h3>
                    <p className="text-sm text-gray-400">{company.welcomeMessage}</p>
                  </CardContent>
                </Card>
              )}

              {company.whatsAppConfig && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-white mb-4">WhatsApp</h3>
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-gray-300">{company.whatsAppConfig.phoneNumber}</span>
                      <Badge variant={company.whatsAppConfig.status === "CONNECTED" ? "success" : "secondary"}>
                        {company.whatsAppConfig.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Plano</h3>
                  <p className="text-2xl font-bold text-white mb-1">
                    {company.planType.charAt(0) + company.planType.slice(1).toLowerCase()}
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].map((plan) => (
                      <Button key={plan} size="sm"
                        variant={company.planType === plan ? "default" : "outline"}
                        onClick={() => handlePlan(plan)}>
                        {plan === "ENTERPRISE" ? "Enterprise" : plan.charAt(0) + plan.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Preferências</h3>
                  <div className="space-y-2 text-sm">
                    <Pref label="Auto-transferência" value={company.settings?.autoTransfer} />
                    <Pref label="Lembretes automáticos" value={company.settings?.autoReminders} />
                    <Pref label="Exigir confirmação" value={company.settings?.requireConfirmation} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Usuário</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Papel</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden lg:table-cell">Último acesso</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden lg:table-cell">Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.users.map((u) => (
                      <tr key={u.id} className="border-b border-border/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-xs font-bold text-white">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <div className="flex gap-1">
                            <Badge variant={u.isActive ? "success" : "secondary"} className="text-[10px]">
                              {u.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            {u.twoFactorEnabled && (
                              <Badge variant="outline" className="text-[10px]">2FA</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-400">{formatDate(u.lastLoginAt)}</td>
                        <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">Assinatura</h3>
                {company.subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Plano</span>
                      <span className="text-sm font-medium text-white">
                        {company.subscription.plan.name} ({company.subscription.plan.code})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Valor</span>
                      <span className="text-sm font-medium text-white">{formatBRL(company.subscription.plan.price)}/mês</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      <Badge variant={subStatusMeta[company.subscription.status]?.variant || "secondary"}>
                        {subStatusMeta[company.subscription.status]?.label || company.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Início</span>
                      <span className="text-sm text-gray-300">{formatDate(company.subscription.startedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Próxima cobrança</span>
                      <span className="text-sm text-gray-300">{formatDate(company.subscription.nextBillingDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Expira</span>
                      <span className="text-sm text-gray-300">{formatDate(company.subscription.expiresAt)}</span>
                    </div>
                    {company.subscription.canceledAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Cancelado em</span>
                        <span className="text-sm text-red-400">{formatDate(company.subscription.canceledAt)}</span>
                      </div>
                    )}
                    {company.subscription.coupon && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Cupom</span>
                        <span className="text-sm font-mono text-amber-400">
                          {company.subscription.coupon.code} ({company.subscription.coupon.discountValue}
                          {company.subscription.coupon.discountType === "PERCENTAGE" ? "%" : ""})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sem assinatura registrada</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">Histórico de Cobrança</h3>
                {company.billingHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma cobrança registrada</p>
                ) : (
                  <div className="space-y-2">
                    {company.billingHistory.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
                        <div>
                          <p className="text-sm font-medium text-white">{b.action}</p>
                          {b.description && <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>}
                          <p className="text-xs text-gray-600 mt-0.5">{formatDate(b.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${b.amount > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                            {b.amount > 0 ? "+" : ""}{formatBRL(b.amount)}
                          </p>
                          <p className="text-xs text-gray-600">{b.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-semibold text-white">Configuração da IA</h3>
                </div>
                {company.aiConfig ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Modelo</span>
                      <span className="text-sm font-medium text-white">{company.aiConfig.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Temperatura</span>
                      <span className="text-sm text-gray-300">{company.aiConfig.temperature}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Max tokens</span>
                      <span className="text-sm text-gray-300">{company.aiConfig.maxTokens}</span>
                    </div>
                    {company.aiConfig.systemPrompt && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prompt do sistema</p>
                        <p className="text-xs text-gray-400 bg-gray-900 p-3 rounded-lg whitespace-pre-wrap">{company.aiConfig.systemPrompt}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sem configuração de IA</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">
                  Serviços ({company.aiConfig?.services.length ?? 0})
                </h3>
                {company.aiConfig && company.aiConfig.services.length > 0 ? (
                  <div className="space-y-2">
                    {company.aiConfig.services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
                        <span className="text-sm text-gray-300">{s.name}</span>
                        <span className="text-sm font-semibold text-white">{formatBRL(Number(s.price) * 100)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum serviço cadastrado</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">
                  FAQ ({company.aiConfig?.faq.length ?? 0})
                </h3>
                {company.aiConfig && company.aiConfig.faq.length > 0 ? (
                  <div className="space-y-2">
                    {company.aiConfig.faq.map((f) => (
                      <div key={f.id} className="p-3 rounded-xl bg-secondary/20">
                        <p className="text-sm font-medium text-white">{f.question}</p>
                        <p className="text-sm text-gray-400 mt-1">{f.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma pergunta frequente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-secondary/20">
      <Icon className="w-4 h-4 text-gray-500 mb-1" />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Pref({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-400">{label}</span>
      <Badge variant={value ? "success" : "secondary"} className="text-[10px]">
        {value ? "Ligado" : "Desligado"}
      </Badge>
    </div>
  );
}
