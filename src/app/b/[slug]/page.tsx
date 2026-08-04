"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  Check,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface PublicCompany {
  companyId: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  hours: string | null;
  welcomeMessage: string | null;
  services: { id: string; name: string; price: string }[];
  bookingEnabled: boolean;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [step, setStep] = useState<"date" | "details" | "done">("date");
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    service: "",
    date: "",
    time: "",
  });

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/companies/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setCompany(json.data);
        if (json.data.services.length === 1) {
          setForm((f) => ({ ...f, service: json.data.services[0].name }));
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const dates = useMemo(() => {
    const list: string[] = [];
    const current = new Date();
    for (let i = 0; i < 30; i++) {
      list.push(toDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, []);

  const fetchSlots = useCallback(
    async (dateKey: string) => {
      setLoadingSlots(true);
      setSlots([]);
      setForm((f) => ({ ...f, time: "" }));
      try {
        const res = await fetch(`/api/public/companies/${slug}/slots?date=${dateKey}`);
        if (res.ok) {
          const json = await res.json();
          setSlots(json.data.slots);
        }
      } catch {
        toast("Erro ao buscar horários disponíveis", "error");
      } finally {
        setLoadingSlots(false);
      }
    },
    [slug, toast]
  );

  const handleSelectDate = (dateKey: string) => {
    setForm((f) => ({ ...f, date: dateKey, time: "" }));
    fetchSlots(dateKey);
  };

  const canProceedToDetails =
    form.date && form.time && form.service && form.name.trim() && form.phone.trim();

  const handleSubmit = async () => {
    if (!canProceedToDetails) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/companies/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          date: form.date,
          time: form.time,
          service: form.service,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao realizar agendamento", "error");
        if (json.error?.includes("indisponível")) {
          fetchSlots(form.date);
        }
        return;
      }
      setStep("done");
    } catch {
      toast("Erro de conexão. Tente novamente.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateKey: string) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    return `${d} de ${monthNames[m - 1]} de ${y}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <Card className="bg-card/50 border-border/50 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Scissors className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Empresa não encontrada</h1>
            <p className="text-sm text-gray-400">
              O link de agendamento pode estar incorreto ou a empresa não está disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company.bookingEnabled) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <Card className="bg-card/50 border-border/50 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Agendamento indisponível</h1>
            <p className="text-sm text-gray-400">
              Esta empresa ainda não ativa agendamentos online. Entre em contato diretamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Agendamento confirmado!</h1>
              <p className="text-gray-400 text-sm mb-6">
                {form.service} em <strong className="text-white">{company.name}</strong>
                <br />
                {formatDate(form.date)} às <strong className="text-white">{form.time}</strong>
              </p>
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-left space-y-2 mb-6">
                <p className="text-xs text-gray-500">
                  Entraremos em contato para confirmar. Se precisar remarcar, ligue para{" "}
                  <span className="text-white">{company.phone}</span>.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                Fazer outro agendamento
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayKey = toDateKey(new Date());

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{company.name}</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              {company.welcomeMessage || "Agende seu horário online em poucos minutos."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-gray-500">
              {company.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {company.address}
                </span>
              )}
              {company.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {company.phone}
                </span>
              )}
              {company.hours && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {company.hours}
                </span>
              )}
            </div>
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              {step === "date" ? (
                <>
                  <div className="mb-6">
                    <Label className="mb-2 block text-sm text-gray-400">Escolha o serviço</Label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {company.services.length === 0 && (
                        <p className="text-xs text-gray-500 col-span-full">
                          Nenhum serviço cadastrado. Contate a empresa.
                        </p>
                      )}
                      {company.services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, service: service.name }))}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            form.service === service.name
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                          }`}
                        >
                          <p className="text-sm font-medium text-white">{service.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {service.price && service.price !== "0"
                              ? `R$ ${Number(service.price).toLocaleString("pt-BR")}`
                              : "Preço a combinar"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <Label className="text-sm text-gray-400">Escolha o dia</Label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (month === 0) {
                            setYear((y) => y - 1);
                            setMonth(11);
                          } else {
                            setMonth((m) => m - 1);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-secondary/50 transition-colors"
                        aria-label="Mês anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (month === 11) {
                            setYear((y) => y + 1);
                            setMonth(0);
                          } else {
                            setMonth((m) => m + 1);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-secondary/50 transition-colors"
                        aria-label="Próximo mês"
                      >
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-white font-medium capitalize mb-3">
                    {monthNames[month]} {year}
                  </div>
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
                      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isPast = dateKey < todayKey;
                      const isBookable = dates.includes(dateKey);
                      const isSelected = form.date === dateKey;
                      return (
                        <button
                          key={day}
                          disabled={isPast || !isBookable}
                          onClick={() => handleSelectDate(dateKey)}
                          className={`relative aspect-square rounded-xl text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                              : isPast || !isBookable
                                ? "text-gray-700 cursor-not-allowed"
                                : "text-gray-300 hover:bg-secondary/50"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <Label className="mb-2 block text-sm text-gray-400">
                      Horários disponíveis
                      {form.date && (
                        <span className="text-gray-500"> para {formatDate(form.date)}</span>
                      )}
                    </Label>
                    {!form.date ? (
                      <p className="text-sm text-gray-500 py-4 text-center">Selecione um dia para ver os horários.</p>
                    ) : loadingSlots ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        Nenhum horário disponível nesta data. Tente outro dia.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, time: slot }))}
                            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                              form.time === slot
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-border/50 bg-secondary/20 text-gray-300 hover:bg-secondary/40"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-6"
                    disabled={!form.date || !form.time || !form.service}
                    onClick={() => setStep("details")}
                  >
                    Continuar
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep("date")}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                  </button>

                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 mb-6">
                    <p className="text-sm text-white font-medium">{form.service}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(form.date)} às {form.time} · {company.name}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp / Telefone</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                      <p className="text-xs text-gray-600">
                        Usado para contato e confirmação do agendamento.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail (opcional)</Label>
                      <Input
                        type="email"
                        placeholder="voce@email.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button className="w-full mt-6" disabled={!canProceedToDetails || submitting} onClick={handleSubmit}>
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    {submitting ? "Agendando..." : "Confirmar agendamento"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
