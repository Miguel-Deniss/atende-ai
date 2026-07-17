import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "AtendeAI - Atendente Virtual com IA para WhatsApp",
  description:
    "Automatize seu atendimento no WhatsApp com Inteligência Artificial. Responda clientes automaticamente, agende consultas, envie lembretes e aumente suas vendas.",
  keywords: [
    "atendente virtual",
    "IA",
    "WhatsApp",
    "automação",
    "agendamento",
    "chatbot",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${poppins.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
