"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Loader2, Pencil, Trash2, Shield, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    planType: string;
    status: string;
  };
  _count: { sessions: number; handledConversations: number };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  EMPLOYEE: "Funcionário",
  FINANCIAL: "Financeiro",
};

const MANAGABLE_ROLES = ["ADMIN", "ATTENDANT", "EMPLOYEE", "FINANCIAL"];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter.toLowerCase());
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
      setTotalUsers(data.data.pagination.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page, statusFilter, roleFilter]);

  const handleSearch = () => { setPage(1); load(1); };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setEditRole(u.role);
  };

  const saveRole = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, role: editRole }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast("Papel atualizado");
      setEditing(null);
      load(page);
    } else {
      toast(data.error || "Erro ao atualizar papel", "error");
    }
  };

  const toggleActive = async (u: AdminUser) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`Usuário ${u.isActive ? "desativado" : "ativado"}`);
      load(page);
    } else {
      toast(data.error || "Erro ao atualizar usuário", "error");
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Excluir o usuário ${u.name} (${u.email})?`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    const data = await res.json();
    if (data.success) {
      toast("Usuário excluído");
      load(page);
    } else {
      toast(data.error || "Erro ao excluir usuário", "error");
    }
  };

  const roleBadge = (role: string) => {
    const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      SUPER_ADMIN: "destructive",
      ADMIN: "warning",
      ATTENDANT: "secondary",
      EMPLOYEE: "secondary",
      FINANCIAL: "secondary",
    };
    return <Badge variant={variants[role] || "secondary"}>{roleLabels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Usuários</h1>
        <p className="text-gray-500 text-sm">{totalUsers} usuários no sistema</p>
      </motion.div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input placeholder="Buscar por nome ou e-mail..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="INACTIVE">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os papéis</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="ATTENDANT">Atendente</SelectItem>
                <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                <SelectItem value="FINANCIAL">Financeiro</SelectItem>
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
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Nenhum usuário encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Usuário</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Empresa</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Papel</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden lg:table-cell">Último acesso</th>
                    <th className="w-24 pb-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-sm text-gray-300">{u.company.name}</p>
                        <p className="text-xs text-gray-600">{u.company.planType} · {u.company.status}</p>
                      </td>
                      <td className="py-3 px-2">{roleBadge(u.role)}</td>
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
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-400">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("pt-BR")
                          : "Nunca"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-secondary/30 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.role !== "SUPER_ADMIN" && (
                            <>
                              <button onClick={() => toggleActive(u)} title={u.isActive ? "Desativar" : "Ativar"}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-secondary/30 transition-colors">
                                {u.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>
                              <button onClick={() => remove(u)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-secondary/30 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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

      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={editing ? `Editar ${editing.name}` : ""}>
        {editing && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-secondary/20">
              <p className="text-sm font-medium text-white">{editing.name}</p>
              <p className="text-xs text-gray-500">{editing.email}</p>
              <p className="text-xs text-gray-600 mt-1">{editing.company.name}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MANAGABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editing.role === "SUPER_ADMIN" && (
                <p className="text-xs text-gray-600">Super Admins não podem ser alterados.</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border/30">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={saveRole} disabled={saving || editing.role === "SUPER_ADMIN"}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
