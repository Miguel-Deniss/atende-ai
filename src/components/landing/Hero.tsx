"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  Loader2,
  MessageSquare,
  UserRoundCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const flow = [
  { icon: MessageSquare, title: "Mensagem recebida", detail: "WhatsApp via Meta Cloud API" },
  { icon: Bot, title: "Contexto validado", detail: "Serviços e FAQ da empresa" },
  { icon: CalendarCheck, title: "Próxima ação", detail: "Responder ou reservar um slot" },
  { icon: UserRoundCheck, title: "Controle humano", detail: "Takeover interrompe a automação" },
];

export function Hero() {
  const { toast } = useToast();
  const router = useRouter();
  const [demoOpen, setDemoOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    consent: false,
    website: "",
  });

  const handleDemoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !demoForm.name.trim() ||
      !demoForm.email.trim() ||
      !demoForm.phone.trim() ||
      !demoForm.consent
    ) {
      toast("Preencha os campos obrigatórios e autorize o contato.", "error");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/public/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a solicitação");
      setSent(true);
      toast("Solicitação recebida. Nossa equipe entrará em contato.");
      router.push("/thank-you");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Não foi possível enviar a solicitação",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="border-b border-white/10 bg-black pb-20 pt-28 lg:pb-28 lg:pt-40">
      <div className="mx-auto grid max-w-7xl items-end gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Atendimento conectado ao trabalho real
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            WhatsApp entra. Sua operação decide o próximo passo.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Centralize conversas, use IA com o contexto da empresa, valide agendamentos e transfira
            o atendimento para uma pessoa quando necessário.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Criar conta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => setDemoOpen(true)}>
              Solicitar demonstração
            </Button>
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            14 dias de teste. Integrações exigem credenciais próprias.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
          aria-label="Fluxo ilustrativo do produto"
        >
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-medium text-white">Fluxo de uma conversa</p>
            <p className="mt-1 text-xs text-zinc-500">
              Representação funcional, sem dados de clientes
            </p>
          </div>
          <div className="divide-y divide-white/10">
            {flow.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4"
              >
                <item.icon className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <div>
                  <p className="text-sm text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-600">{item.detail}</p>
                </div>
                <span className="font-mono text-[10px] text-zinc-700">0{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={demoOpen}
        onClose={() => !sending && setDemoOpen(false)}
        title="Solicitar demonstração"
      >
        {sent ? (
          <div className="py-8 text-center" role="status">
            <Check className="mx-auto mb-4 h-8 w-8 text-emerald-400" aria-hidden="true" />
            <p className="font-semibold text-white">Solicitação recebida</p>
            <p className="mt-2 text-sm text-zinc-500">
              O horário será combinado por contato; nada foi agendado automaticamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <p className="text-sm text-zinc-400">
              Envie seus dados para combinarmos uma demonstração.
            </p>
            <Field
              label="Nome"
              id="demo-name"
              value={demoForm.name}
              onChange={(name) => setDemoForm((current) => ({ ...current, name }))}
            />
            <Field
              label="E-mail"
              id="demo-email"
              type="email"
              value={demoForm.email}
              onChange={(email) => setDemoForm((current) => ({ ...current, email }))}
            />
            <Field
              label="Telefone"
              id="demo-phone"
              type="tel"
              value={demoForm.phone}
              onChange={(phone) => setDemoForm((current) => ({ ...current, phone }))}
            />
            <Field
              label="Empresa (opcional)"
              id="demo-company"
              value={demoForm.company}
              onChange={(company) => setDemoForm((current) => ({ ...current, company }))}
            />
            <input
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              value={demoForm.website}
              onChange={(event) =>
                setDemoForm((current) => ({ ...current, website: event.target.value }))
              }
            />
            <label className="flex items-start gap-3 text-sm text-zinc-400">
              <input
                type="checkbox"
                className="mt-1"
                checked={demoForm.consent}
                onChange={(event) =>
                  setDemoForm((current) => ({ ...current, consent: event.target.checked }))
                }
              />
              <span>
                Autorizo o contato sobre a demonstração e li a{" "}
                <Link className="text-blue-400 underline-offset-4 hover:underline" href="/privacy">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-label="Enviando" />
              ) : (
                "Enviar solicitação"
              )}
            </Button>
          </form>
        )}
      </Modal>
    </section>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={!label.includes("opcional")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
