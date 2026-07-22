"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string;
  userAgent: string;
  screen: string;
  createdAt: string;
  user: { name: string; email: string; role: string } | null;
  company: { name: string };
}

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/audit?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setAuditLogs(data.data.auditLogs);
      setTotalPages(data.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const handleSearch = () => { setPage(1); load(1); };

  const actionBadge = (action: string) => {
    const colors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      LOGIN_SUCCESS: "success",
      LOGIN_FAILURE: "destructive",
      PAYMENT_SUCCESS: "success",
      PAYMENT_FAILURE: "destructive",
      PLAN_CHANGE: "warning",
      PASSWORD_CHANGE: "warning",
      PASSWORD_RESET: "warning",
      USER_CREATE: "success",
      USER_DELETE: "destructive",
      DATA_DELETE: "destructive",
      SUSPICIOUS_ACTIVITY: "destructive",
      REGISTER: "success",
    };
    return <Badge variant={colors[action] || "secondary"} className="text-[10px]">{action}</Badge>;
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Auditoria</h1>
        <p className="text-gray-500 text-sm">Registro detalhado de todas as alterações</p>
      </motion.div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input placeholder="Pesquisar na auditoria..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors">
                  <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {actionBadge(log.action)}
                      <span className="text-xs font-medium text-gray-300">{log.entity}</span>
                      <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{log.description}</p>
                    <div className="flex gap-4 text-xs text-gray-600 mt-1 flex-wrap">
                      {log.user && <span>Por: {log.user.name} ({log.user.email})</span>}
                      <span>Empresa: {log.company.name}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      {log.screen && <span>Tela: {log.screen}</span>}
                    </div>
                    {!!(log.oldValues || log.newValues) && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">Ver valores</summary>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          {!!log.oldValues && (
                            <div>
                              <p className="text-[10px] text-red-400 mb-1">Valores Antigos</p>
                              <pre className="text-[10px] text-gray-500 bg-gray-900 p-2 rounded-lg overflow-x-auto max-h-32">
                                {JSON.stringify(log.oldValues, null, 1)}
                              </pre>
                            </div>
                          )}
                          {!!log.newValues && (
                            <div>
                              <p className="text-[10px] text-emerald-400 mb-1">Valores Novos</p>
                              <pre className="text-[10px] text-gray-500 bg-gray-900 p-2 rounded-lg overflow-x-auto max-h-32">
                                {JSON.stringify(log.newValues, null, 1)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="text-sm text-gray-500 py-2">{page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
