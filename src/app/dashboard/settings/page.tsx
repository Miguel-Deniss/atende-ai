"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface CompanyData {
  companyName: string;
  phone: string;
  address: string;
  hours: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: { name: string; price: string }[];
  welcomeMessage: string;
  absenceMessage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faq: { question: string; answer: string }[];
  autoTransfer: boolean;
  autoReminders: boolean;
  requireConfirmation: boolean;
}

const defaults: CompanyData = {
  companyName: "Barbearia Vintage",
  phone: "(11) 99999-8888",
  address: "Rua Augusta, 1500 - Consolação",
  hours: "Seg-Sáb: 08h às 20h, Dom: 09h às 13h",
  services: [
    { name: "Corte de Cabelo", price: "R$ 50,00" },
    { name: "Barba", price: "R$ 35,00" },
    { name: "Corte + Barba", price: "R$ 75,00" },
  ],
  welcomeMessage:
    "Olá! Bem-vindo à Barbearia Vintage 🪒 Sou o assistente virtual e estou aqui para ajudar! Como posso te atender hoje?",
  absenceMessage:
    "Olá! No momento estamos fechados, mas pode me mandar uma mensagem que assim que reabrirmos iremos responder. Nosso horário é Seg-Sáb: 08h às 20h.",
  faq: [
    { question: "Quanto tempo dura um corte?", answer: "Cerca de 30 a 40 minutos." },
    { question: "Aceita cartão?", answer: "Sim, aceitamos débito, crédito e PIX." },
  ],
  autoTransfer: true,
  autoReminders: true,
  requireConfirmation: true,
};

export default function SettingsPage() {
  const [data, setData] = useState<CompanyData>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
  
        if (!res.ok) {
          throw new Error("Erro ao carregar");
        }
  
        const json = await res.json();
  
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    }
  
    loadSettings();
  }, []);

  const update = <K extends keyof CompanyData>(key: K, value: CompanyData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
  
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      if (!res.ok) {
        throw new Error("Erro ao salvar");
      }
  
      toast("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Configurações da IA</h1>
        <p className="text-gray-500 text-sm">Essas informações serão utilizadas pela IA para responder seus clientes.</p>
      </motion.div>

      <SectionCard
        title="Informações da Empresa"
        desc="Dados básicos do seu negócio"
        delay={0.1}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome da empresa" id="companyName" value={data.companyName} onChange={(v) => update("companyName", v)} />
          <Field label="Telefone" id="phone" value={data.phone} onChange={(v) => update("phone", v)} />
          <Field label="Endereço" id="address" value={data.address} onChange={(v) => update("address", v)} />
          <Field label="Horário de funcionamento" id="hours" value={data.hours} onChange={(v) => update("hours", v)} />
        </div>
      </SectionCard>

      <SectionCard
        title="Serviços e Preços"
        desc="Liste os serviços oferecidos e seus valores"
        delay={0.15}
      >
        {data.services.map((svc, i) => (
          <div key={i} className="flex gap-3 items-end mb-3">
            <div className="flex-1 space-y-2">
              <Label>Serviço</Label>
              <Input
                value={svc.name}
                onChange={(e) => {
                  const s = [...data.services];
                  s[i] = { ...s[i], name: e.target.value };
                  update("services", s);
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Preço</Label>
              <Input
                value={svc.price}
                onChange={(e) => {
                  const s = [...data.services];
                  s[i] = { ...s[i], price: e.target.value };
                  update("services", s);
                }}
              />
            </div>
            <button
              onClick={() => update("services", data.services.filter((_, j) => j !== i))}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mb-0.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update("services", [...data.services, { name: "", price: "" }])}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar serviço
        </Button>
      </SectionCard>

      <SectionCard
        title="Mensagens Automáticas"
        desc="Personalize as mensagens que a IA enviará"
        delay={0.2}
      >
        <div className="space-y-4">
          <TextareaField
            label="Mensagem de boas-vindas"
            id="welcome"
            value={data.welcomeMessage}
            onChange={(v) => update("welcomeMessage", v)}
          />
          <TextareaField
            label="Mensagem de ausência"
            id="absence"
            value={data.absenceMessage}
            onChange={(v) => update("absenceMessage", v)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Perguntas Frequentes"
        desc="FAQ que a IA usará para responder dúvidas comuns"
        delay={0.25}
      >
        {data.faq.map((item, i) => (
          <div key={i} className="flex gap-3 items-start mb-3">
            <div className="flex-1 space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={item.question}
                onChange={(e) => {
                  const f = [...data.faq];
                  f[i] = { ...f[i], question: e.target.value };
                  update("faq", f);
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Resposta</Label>
              <Input
                value={item.answer}
                onChange={(e) => {
                  const f = [...data.faq];
                  f[i] = { ...f[i], answer: e.target.value };
                  update("faq", f);
                }}
              />
            </div>
            <button
              onClick={() => update("faq", data.faq.filter((_, j) => j !== i))}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-6"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update("faq", [...data.faq, { question: "", answer: "" }])}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar pergunta
        </Button>
      </SectionCard>

      <SectionCard
        title="Configurações Adicionais"
        desc="Ajustes de comportamento da IA"
        delay={0.3}
      >
        <div className="space-y-4">
          <ToggleRow
            label="Transferência automática para humano"
            desc="Quando a IA não souber responder, transfere para um atendente"
            checked={data.autoTransfer}
            onToggle={(v) => update("autoTransfer", v)}
          />
          <ToggleRow
            label="Lembretes automáticos"
            desc="Envia lembrete 24h antes do agendamento"
            checked={data.autoReminders}
            onToggle={(v) => update("autoReminders", v)}
          />
          <ToggleRow
            label="Confirmação de agendamento"
            desc="Solicita confirmação do cliente ao agendar"
            checked={data.requireConfirmation}
            onToggle={(v) => update("requireConfirmation", v)}
          />
        </div>
      </SectionCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex justify-end"
      >
        <Button size="lg" onClick={save} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </motion.div>
    </div>
  );
}

function SectionCard({ title, desc, delay, children }: { title: string; desc: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base text-white">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, id, value, onChange }: { label: string; id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextareaField({ label, id, value, onChange }: { label: string; id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className="flex min-h-[100px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all duration-200 resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ToggleRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
