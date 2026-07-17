"use client";

import { MessageSquareMore, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  produto: {
    title: "Produto",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#recursos" },
      { label: "Planos", href: "#planos" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  empresa: {
    title: "Empresa",
    links: [
      { label: "Sobre nós", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contato", href: "#" },
      { label: "Trabalhe conosco", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "#" },
      { label: "Termos de uso", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Linkedin, href: "#" },
  { icon: Youtube, href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <MessageSquareMore className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Atende<span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Automatize seu atendimento no WhatsApp com Inteligência Artificial e transforme seu negócio.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-blue-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} AtendeAI. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600">
            Feito com 💙 para pequenos negócios
          </p>
        </div>
      </div>
    </footer>
  );
}
