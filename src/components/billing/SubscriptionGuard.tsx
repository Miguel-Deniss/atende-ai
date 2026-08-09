"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ALLOWED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

const ALWAYS_ACCESSIBLE = ["/dashboard/subscription", "/dashboard/profile", "/dashboard/settings"];

const STATUS_MESSAGE: Record<string, { title: string; description: string }> = {
  PAST_DUE: {
    title: "Pagamento pendente",
    description:
      "Sua assinatura está com pagamento pendente. Atualize sua forma de pagamento para reativar o acesso.",
  },
  CANCELED: {
    title: "Assinatura cancelada",
    description: "Sua assinatura foi cancelada. Renove para continuar usando o AtendeAI.",
  },
  INCOMPLETE: {
    title: "Pagamento incompleto",
    description: "Seu checkout não foi concluído. Finalize o pagamento para ativar a assinatura.",
  },
};

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return <>{children}</>;
  }

  const status = user.company?.subscriptionStatus;

  const allowed =
    ALLOWED_STATUSES.has(status ?? "") ||
    ALWAYS_ACCESSIBLE.some((path) => pathname?.startsWith(path));

  if (allowed) return <>{children}</>;

  const meta = STATUS_MESSAGE[status ?? ""] ?? {
    title: "Acesso bloqueado",
    description:
      "Sua assinatura não está ativa. Regularize sua situação para continuar usando o AtendeAI.",
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{meta.title}</h2>
            <p className="text-sm text-gray-400 mb-6">{meta.description}</p>
            <Link href="/dashboard/subscription" className="inline-block w-full">
              <Button className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Gerenciar minha assinatura
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
