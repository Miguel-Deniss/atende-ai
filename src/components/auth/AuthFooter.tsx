import Link from "next/link";
import { HelpCircle } from "lucide-react";

export function AuthFooter() {
  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <Link href="/terms" className="hover:text-blue-400 transition-colors">
          Termos de Uso
        </Link>
        <span className="text-gray-700">•</span>
        <Link href="/privacy" className="hover:text-blue-400 transition-colors">
          Privacidade
        </Link>
        <span className="text-gray-700">•</span>
        <Link href="/help" className="inline-flex items-center gap-1 hover:text-blue-400 transition-colors">
          <HelpCircle className="w-3 h-3" />
          Suporte
        </Link>
      </div>
    </div>
  );
}
