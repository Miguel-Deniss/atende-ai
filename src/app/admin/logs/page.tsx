"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: { name: string; email: string } | null;
  company: { name: string };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/admin/logs?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setLogs(data.data.logs);
      setTotalPages(data.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page, actionFilter]);

  const actionBadge = (action: string) => {
    const colors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      LOGIN_SUCCESS: "success",
      LOGIN_FAILURE: "destructive",
      PAYMENT_SUCCESS: "success",
      PAYMENT_FAILURE: "destructive",
      PLAN_CHANGE: "warning",
      PASSWORD_CHANGE: "warning",
      SUSPICIOUS_ACTIVITY: "destructive",
      DATA_DELETE: "destructive",
    };
    return <Badge variant={colors[action] || "secondary"} className="text-[10px]">{action}</Badge>;
  };

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Logs do Sistema</h1>
        <p className="text-gray-500 text-sm">Registro de eventos do sistema</p>
      </motion.div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input placeholder="Filtrar por ação..." className="pl-10"
                value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} />
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button size="sm" variant={actionFilter === "" ? "default" : "ghost"} onClick={() => { setActionFilter(""); setPage(1); }}>
                Todas
              </Button>
              {["LOGIN_FAILURE", "PAYMENT_SUCCESS", "PLAN_CHANGE", "SUSPICIOUS_ACTIVITY"].map((a) => (
                <Button key={a} size="sm" variant={actionFilter === a ? "default" : "ghost"}
                  onClick={() => { setActionFilter(a); setPage(1); }}>
                  {a}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors">
                  <div className="p-2 rounded-lg bg-secondary/30 flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {actionBadge(log.action)}
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{log.description}</p>
                    <div className="flex gap-4 text-xs text-gray-600 mt-1">
                      {log.user && <span>{log.user.name} ({log.user.email})</span>}
                      <span>{log.company.name}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
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
