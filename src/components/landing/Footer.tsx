"use client";

import { MessageSquareMore } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  {
    title: "Produto",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#recursos" },
      { label: "Planos", href: "#planos" },
      { label: "Criar conta", href: "/register" },
      { label: "Contato", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "/privacy" },
      { label: "Termos de uso", href: "/terms" },
      { label: "Reembolso", href: "/refund" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
              <MessageSquareMore className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">AtendeAI</span>
          </div>
          <p className="max-w-xs text-sm text-gray-500">
            Atendimento e agendamentos pelo WhatsApp com IA e transferência para sua equipe.
          </p>
        </div>
        {footerLinks.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="mb-4 text-sm font-semibold text-white">{group.title}</h2>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link className="text-sm text-gray-500 hover:text-blue-400" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-7xl border-t border-border/50 px-4 py-6 text-xs text-gray-600 sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} AtendeAI. Todos os direitos reservados.
      </div>
    </footer>
  );
}
