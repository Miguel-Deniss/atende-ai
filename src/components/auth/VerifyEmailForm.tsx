"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertTriangle, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "invalid" | "error";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const verify = async () => {
    if (!token) {
      setStatus("invalid");
      setMessage("Link inválido. Verifique o e-mail recebido e tente novamente.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
      } else {
        setStatus("invalid");
        setMessage(data.error || "Link inválido ou expirado. Solicite um novo link.");
      }
    } catch {
      setStatus("error");
      setMessage("Erro ao conectar com o servidor. Tente novamente.");
    }
  };

  useEffect(() => {
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verificando seu e-mail...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      {status === "success" ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">E-mail verificado!</h2>
          <p className="text-sm text-gray-400 mb-8">
            Sua conta foi confirmada com sucesso. Agora você já pode acessar o sistema.
          </p>
          <Button className="w-full" size="lg" onClick={() => router.push("/login")}>
            Ir para o login
          </Button>
        </>
      ) : (
        <>
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              status === "error" ? "bg-red-500/10" : "bg-amber-500/10"
            }`}
          >
            {status === "error" ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <MailCheck className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {status === "error" ? "Algo deu errado" : "Link inválido ou expirado"}
          </h2>
          <p className="text-sm text-gray-400 mb-8">{message}</p>
          <div className="space-y-3">
            <Button className="w-full" size="lg" variant="outline" onClick={() => router.push("/login")}>
              Voltar ao login
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="ghost"
              onClick={verify}
              disabled={!token}
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
