"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Clock, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Appointment {
  id: string;
  time: string;
  name: string;
  service: string;
  status: string;
  date: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ time: "09:00", name: "", service: "" });
  const { toast } = useToast();

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  const loadAppointments = useCallback(
    async (y: number, m: number) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schedule?month=${m + 1}&year=${y}`);
        if (!res.ok) throw new Error("Erro ao carregar");
        const json = await res.json();
        const mapped = (json.data ?? []).map((a: any) => ({
          ...a,
          date: new Date(a.date).toISOString().slice(0, 10),
        }));
        setAppointments(mapped);
      } catch {
        toast("Erro ao carregar agendamentos", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadAppointments(year, month);
  }, [year, month, loadAppointments]);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === dateKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, dateKey]
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }, [month]);

  const handleNewAppointment = async () => {
    if (!newAppt.name.trim() || !newAppt.service.trim()) {
      toast("Preencha todos os campos do agendamento", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: newAppt.time,
          date: dateKey,
          name: newAppt.name.trim(),
          service: newAppt.service.trim(),
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar");
      setNewAppt({ time: "09:00", name: "", service: "" });
      setShowNewModal(false);
      toast("Agendamento criado com sucesso!");
      await loadAppointments(year, month);
    } catch {
      toast("Erro ao criar agendamento", "error");
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
          <h1 className="text-2xl font-bold text-white mb-1">Agenda</h1>
          <p className="text-gray-500 text-sm">
            {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? "s" : ""} para hoje
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white capitalize">
                  {monthNames[month]} {year}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-secondary/50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-secondary/50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dk = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasAppts = appointments.some((a) => a.date === dk);
                  const isToday = dk === todayDateKey;
                  const isSelected = day === selectedDay;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`relative aspect-square rounded-xl text-sm font-medium transition-all duration-200 hover:bg-secondary/50 ${
                        isSelected
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : isToday
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-gray-400"
                      }`}
                    >
                      {day}
                      {hasAppts && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                {selectedDay} de {monthNames[month]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : dayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400">Nenhum agendamento</p>
                  <p className="text-xs text-gray-600 mt-1">Clique em &quot;Novo Agendamento&quot; para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-400">{appt.time}</span>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={appt.status === "confirmed" ? "success" : "warning"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {appt.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </Badge>
                          <button
                            onClick={() => toast("Exclusão disponível em breve", "info")}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-white">{appt.name}</p>
                      <p className="text-xs text-gray-500">{appt.service}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowNewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
            >
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Novo Agendamento</h3>
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-secondary/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={newAppt.name}
                      onChange={(e) => setNewAppt((p) => ({ ...p, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <Input
                      placeholder="Serviço agendado"
                      value={newAppt.service}
                      onChange={(e) => setNewAppt((p) => ({ ...p, service: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={newAppt.time}
                      onChange={(e) => setNewAppt((p) => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Para: {selectedDay} de {monthNames[month]} de {year}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleNewAppointment} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    {saving ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}
