"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus, Loader2, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ATTENDANT" | "EMPLOYEE" | "FINANCIAL";
  phone: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<TeamMember["role"], string> = {
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  EMPLOYEE: "Funcionário",
  FINANCIAL: "Financeiro",
};

const ASSIGNABLE_ROLES: TeamMember["role"][] = ["ATTENDANT", "EMPLOYEE", "FINANCIAL"];

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "ATTENDANT" as TeamMember["role"],
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/company/users", { credentials: "include" });
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch {
      toast("Erro ao carregar equipe", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast("Preencha nome, email e senha (mínimo 8 caracteres)", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/company/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao criar usuário");
      toast("Usuário convidado com sucesso", "success");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", phone: "", role: "ATTENDANT" });
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao criar usuário", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: string, role: TeamMember["role"]) => {
    try {
      const res = await fetch(`/api/company/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao alterar papel");
      toast("Papel atualizado", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao alterar papel", "error");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/company/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao atualizar usuário");
      toast(isActive ? "Usuário desativado" : "Usuário ativado", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao atualizar usuário", "error");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Remover ${name} da equipe?`)) return;
    try {
      const res = await fetch(`/api/company/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao remover usuário");
      toast("Usuário removido", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao remover usuário", "error");
    }
  };

  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe</h1>
          <p className="text-sm text-gray-500">Gerencie os membros e seus papéis na empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar membro
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>{members.length} membro(s) na equipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Nenhum membro encontrado</p>
          ) : (
            members.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/20"
              >
                <Avatar>
                  <AvatarFallback>{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{m.name}</p>
                    {m.id === user?.id && (
                      <Badge variant="secondary">Você</Badge>
                    )}
                    {m.role === "ADMIN" && (
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={m.isActive ? "success" : "destructive"}>
                    {m.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  {canManage && m.id !== user?.id ? (
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.id, v as TeamMember["role"])}
                    >
                      <SelectTrigger className="w-40 h-9 text-xs">
                        <SelectValue>{ROLE_LABELS[m.role]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                  )}
                  {canManage && m.id !== user?.id && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(m.id, m.isActive)}
                      >
                        {m.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleRemove(m.id, m.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Convidar membro">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do membro"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha inicial</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label>Papel</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as TeamMember["role"] }))}>
              <SelectTrigger className="w-full">
                <SelectValue>{ROLE_LABELS[form.role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Criar usuário
          </Button>
        </div>
      </Modal>
    </div>
  );
}
