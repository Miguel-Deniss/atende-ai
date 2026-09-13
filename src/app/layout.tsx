import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/CookieConsentWrapper";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AtendeAI — Atendimento com IA para WhatsApp",
    template: "%s | AtendeAI",
  },
  description:
    "Centralize conversas, automatize respostas e organize agendamentos pelo WhatsApp usando a Meta Cloud API.",
  keywords: ["atendente virtual", "IA", "WhatsApp", "automação", "agendamento", "chatbot"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "AtendeAI",
    title: "AtendeAI — Atendimento com IA para WhatsApp",
    description: "Conversas, automação, transferência humana e agenda em um só fluxo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AtendeAI — Atendimento com IA para WhatsApp",
    description: "Conversas, automação, transferência humana e agenda em um só fluxo.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${poppins.variable} antialiased`}>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
