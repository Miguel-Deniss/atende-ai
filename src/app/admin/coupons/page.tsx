"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TicketPercent, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validUntil: string | null;
  isActive: boolean;
  allowedPlans: string[];
  createdAt: string;
}

const PLANS = ["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"];

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: "10",
    maxUses: "",
    validUntil: "",
    isActive: true,
    allowedPlans: [] as string[],
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons", { credentials: "include" });
    const data = await res.json();
    if (data.success) setCoupons(data.data);
    else toast(data.error || "Erro ao carregar cupons", "error");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = coupons.filter(
    (c) => c.code.toLowerCase().includes(search.toLowerCase()) || !search
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discountType: "PERCENTAGE", discountValue: "10", maxUses: "", validUntil: "", isActive: true, allowedPlans: [] });
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxUses: c.maxUses ? String(c.maxUses) : "",
      validUntil: c.validUntil ? c.validUntil.slice(0, 16) : "",
      isActive: c.isActive,
      allowedPlans: c.allowedPlans,
    });
    setModalOpen(true);
  };

  const togglePlan = (plan: string) => {
    setForm((f) => ({
      ...f,
      allowedPlans: f.allowedPlans.includes(plan)
        ? f.allowedPlans.filter((p) => p !== plan)
        : [...f.allowedPlans, plan],
    }));
  };

  const save = async () => {
    if (!form.code.trim() || !form.discountValue) {
      toast("Preencha código e valor do desconto", "error");
      return;
    }

    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      isActive: form.isActive,
      allowedPlans: form.allowedPlans,
    };

    setSaving(true);
    const res = await fetch(editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons", {
      method: editing ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (data.success) {
      toast(editing ? "Cupom atualizado com sucesso" : "Cupom criado com sucesso");
      setModalOpen(false);
      load();
    } else {
      toast(data.error || "Erro ao salvar cupom", "error");
    }
  };

  const toggleActive = async (c: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`Cupom ${c.isActive ? "desativado" : "ativado"}`);
      load();
    } else {
      toast(data.error || "Erro ao atualizar cupom", "error");
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Remover o cupom ${c.code}?`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      toast("Cupom removido");
      load();
    } else {
      toast(data.error || "Erro ao remover cupom", "error");
    }
  };

  const discountLabel = (c: Coupon) =>
    c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `R$ ${(c.discountValue / 100).toFixed(2)}`;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Cupons</h1>
          <p className="text-gray-500 text-sm">{filtered.length} cupons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Novo Cupom
        </Button>
      </motion.div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input placeholder="Buscar por código..." className="pl-10"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Nenhum cupom encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Código</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Desconto</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Usos</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden lg:table-cell">Validade</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Planos</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Status</th>
                    <th className="w-24 pb-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                            <TicketPercent className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-mono font-medium text-white">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-300">{discountLabel(coupon)}</td>
                      <td className="py-3 px-2 hidden md:table-cell text-sm text-gray-400">
                        {coupon.usedCount}/{coupon.maxUses ?? "∞"}
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-400">
                        {coupon.validUntil
                          ? new Date(coupon.validUntil).toLocaleDateString("pt-BR")
                          : "Sem validade"}
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {coupon.allowedPlans.length === 0 ? (
                            <Badge variant="secondary" className="text-[10px]">Todos</Badge>
                          ) : (
                            coupon.allowedPlans.map((p) => (
                              <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => toggleActive(coupon)}>
                          <Badge variant={coupon.isActive ? "success" : "secondary"}>
                            {coupon.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(coupon)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-secondary/30 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(coupon)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-secondary/30 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.code}` : "Novo Cupom"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Código</Label>
            <Input id="code" placeholder="EX: BEMVINDO10" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as "PERCENTAGE" | "FIXED" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Porcentagem</SelectItem>
                  <SelectItem value="FIXED">Valor fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input type="number" min="1" placeholder={form.discountType === "PERCENTAGE" ? "10" : "5000"}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Limite de usos (opcional)</Label>
              <Input type="number" min="1" placeholder="Sem limite"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Validade (opcional)</Label>
              <Input type="datetime-local" value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Planos permitidos</Label>
            <div className="flex gap-2 flex-wrap">
              {PLANS.map((plan) => (
                <Button key={plan} size="sm" type="button"
                  variant={form.allowedPlans.includes(plan) ? "default" : "outline"}
                  onClick={() => togglePlan(plan)}>
                  {plan === "FREE" ? "Free" : plan.charAt(0) + plan.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-600">Nenhum selecionado = válido para todos</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-border bg-transparent" />
              Cupom ativo
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
