"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem("cookie_consent");
    if (!consented) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto"
        >
          <div className="glass rounded-2xl border border-border/50 p-4 shadow-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 flex-shrink-0">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300">
                Utilizamos cookies essenciais para o funcionamento da plataforma.
                Ao continuar, você concorda com nossa{" "}
                <Link href="/privacy" className="text-blue-400 hover:underline">
                  Política de Privacidade
                </Link>.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={accept}>Aceitar</Button>
                <Button size="sm" variant="ghost" onClick={reject} className="text-gray-400">
                  Recusar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
