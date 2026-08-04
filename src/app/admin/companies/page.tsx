"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Building2, MoreHorizontal, Loader2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  planType: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: { users: number; clients: number; appointments: number };
}

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editModal, setEditModal] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (planFilter !== "ALL") params.set("planType", planFilter);
    const res = await fetch(`/api/admin/companies?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setCompanies(data.data.companies);
      setTotalPages(data.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page, statusFilter, planFilter]);

  const handleSearch = () => { setPage(1); load(1); };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`Empresa ${status === "ACTIVE" ? "ativada" : "suspensa"} com sucesso`);
      load(page);
      setEditModal(false);
    } else {
      toast(data.error || "Erro ao atualizar", "error");
    }
  };

  const handlePlanChange = async (id: string, planType: string) => {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType }),
    });
    const data = await res.json();
    if (data.success) {
      toast("Plano alterado com sucesso");
      load(page);
      setEditModal(false);
    } else {
      toast(data.error || "Erro ao alterar plano", "error");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      ACTIVE: "success",
      SUSPENDED: "destructive",
      CANCELLED: "secondary",
    };
    const labels: Record<string, string> = {
      ACTIVE: "Ativa",
      SUSPENDED: "Suspensa",
      CANCELLED: "Cancelada",
    };
    return <Badge variant={map[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Empresas</h1>
        <p className="text-gray-500 text-sm">{companies.length} empresas encontradas</p>
      </motion.div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input placeholder="Buscar empresas..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativas</SelectItem>
                <SelectItem value="SUSPENDED">Suspensas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os planos</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Empresa</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Plano</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Usuários</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden lg:table-cell">Criação</th>
                    <th className="w-10 pb-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <Link href={`/admin/companies/${company.id}`}
                              className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                              {company.name}
                            </Link>
                            <p className="text-xs text-gray-500">{company.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">{statusBadge(company.status)}</td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <Badge variant="secondary">{company.planType}</Badge>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell text-sm text-gray-400">{company._count.users}</td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-400">
                        {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => { setSelectedCompany(company); setEditModal(true); }}
                          className="p-1 rounded-lg text-gray-500 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-gray-500 py-2">{page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={editModal} onClose={() => setEditModal(false)} title={selectedCompany?.name || "Empresa"}>
        {selectedCompany && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <div className="flex gap-2">
                <Button size="sm" variant={selectedCompany.status === "ACTIVE" ? "default" : "outline"}
                  onClick={() => handleStatusChange(selectedCompany.id, "ACTIVE")}>
                  Ativar
                </Button>
                <Button size="sm" variant={selectedCompany.status === "SUSPENDED" ? "destructive" : "outline"}
                  onClick={() => handleStatusChange(selectedCompany.id, "SUSPENDED")}>
                  Suspender
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Plano</p>
              <div className="flex gap-2">
                {["STARTER", "PRO", "BUSINESS"].map((plan) => (
                  <Button key={plan} size="sm"
                    variant={selectedCompany.planType === plan ? "default" : "outline"}
                    onClick={() => handlePlanChange(selectedCompany.id, plan)}>
                    {plan === "STARTER" ? "Starter" : plan === "PRO" ? "Pro" : "Business"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1 pt-2 border-t border-border/30">
              <p>Slug: {selectedCompany.slug}</p>
              <p>Assinatura: {selectedCompany.subscriptionStatus}</p>
              <p>Clientes: {selectedCompany._count.clients}</p>
              <p>Agendamentos: {selectedCompany._count.appointments}</p>
            </div>

            <Link href={`/admin/companies/${selectedCompany.id}`}
              className="flex items-center justify-center w-full px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors">
              Ver detalhes completos
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
