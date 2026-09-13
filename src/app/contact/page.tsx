import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com o AtendeAI para suporte, dúvidas comerciais ou privacidade.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    title: "Suporte e comercial",
    description: "Dúvidas sobre produto, implantação, conta ou assinatura.",
    email: "contato@atendeai.com",
    icon: Mail,
  },
  {
    title: "Privacidade e dados",
    description: "Solicitações relacionadas à LGPD, exportação ou exclusão de dados.",
    email: "privacidade@atendeai.com",
    icon: ShieldCheck,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-zinc-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs current="Contato" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Fale com o AtendeAI
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
          Como podemos ajudar?
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
          Escolha o canal adequado. Inclua o e-mail cadastrado na conta quando a solicitação
          envolver acesso, cobrança ou dados pessoais.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {channels.map((channel) => (
            <section
              key={channel.email}
              className="rounded-xl border border-white/10 bg-zinc-950 p-6"
            >
              <channel.icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <h2 className="mt-5 font-semibold text-white">{channel.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{channel.description}</p>
              <a
                href={`mailto:${channel.email}`}
                className="mt-5 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                {channel.email}
              </a>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-zinc-500">
          O prazo de resposta depende do tipo e da complexidade da solicitação.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao início
        </Link>
      </div>
    </main>
  );
}
