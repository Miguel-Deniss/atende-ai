"use client";

import { motion } from "framer-motion";
import ConversationLayout from "@/components/conversations/ConversationLayout";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          Conversas
        </h1>

        <p className="text-muted-foreground">
          Gerencie todos os atendimentos da empresa.
        </p>
      </motion.div>

      <ConversationLayout />
    </div>
  );
}