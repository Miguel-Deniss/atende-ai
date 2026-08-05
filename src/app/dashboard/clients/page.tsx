"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, MoreHorizontal, Phone, UserPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface Client {
  id: string;
  name: string;
  phone: string;
  lastService: string | null;
  date: string;
  status: string;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", lastService: "" });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients?limit=100&search=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error("Erro ao carregar");
        const json = await res.json();
        setClients(json.data.clients ?? []);
      } catch {
        toast("Erro ao carregar clientes", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const t = setTimeout(() => loadClients(search), 300);
    return () => clearTimeout(t);
  }, [search, loadClients]);

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.lastService ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  const handleAdd = async () => {
    if (!newClient.name.trim() || !newClient.phone.trim()) {
      toast("Nome e telefone são obrigatórios", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClient.name.trim(),
          phone: newClient.phone.trim(),
          lastService: newClient.lastService.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar");
      setNewClient({ name: "", phone: "", lastService: "" });
      setModalOpen(false);
      toast("Cliente cadastrado com sucesso!");
      await loadClients(search);
    } catch {
      toast("Erro ao cadastrar cliente", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-gray-500 text-sm">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Pesquisar por nome, telefone ou serviço..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm text-gray-600 mt-1">Tente buscar por outro termo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Cliente</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Telefone</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Último Serviço</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2 hidden md:table-cell">Data</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 px-2">Status</th>
                      <th className="w-10 pb-3 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/30 hover:bg-secondary/20 transition-colors group"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {client.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-white">{client.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(client.phone)}
                            className="text-sm text-gray-400 flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                            title="Copiar telefone"
                          >
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </button>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <span className="text-sm text-gray-400">{client.lastService ?? "—"}</span>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <span className="text-sm text-gray-400">{formatDate(client.date)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={client.status === "active" ? "success" : "secondary"}>
                            {client.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => toast("Edição disponível em breve", "info")}
                            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Cliente">
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Nome *</Label>
            <Input id="new-name" placeholder="Nome do cliente" value={newClient.name}
              onChange={(e) => setNewClient((p) => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-phone">Telefone *</Label>
            <Input id="new-phone" placeholder="(11) 99999-0000" value={newClient.phone}
              onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-service">Serviço</Label>
            <Input id="new-service" placeholder="Último serviço realizado" value={newClient.lastService}
              onChange={(e) => setNewClient((p) => ({ ...p, lastService: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
