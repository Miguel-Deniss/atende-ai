import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: "Solicitação recebida",
  description: "Confirmação de recebimento de uma solicitação enviada ao AtendeAI.",
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-zinc-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs current="Solicitação recebida" />
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 sm:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="mt-7 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Solicitação recebida
          </h1>
          <p className="mt-4 leading-relaxed text-zinc-400">
            Seus dados foram enviados. Nossa equipe entrará em contato para combinar a demonstração;
            nenhum horário foi agendado automaticamente.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-400"
            >
              Voltar ao início <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white"
            >
              Falar com o suporte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
