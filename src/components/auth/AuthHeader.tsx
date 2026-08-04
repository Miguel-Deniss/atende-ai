import Link from "next/link";
import { MessageSquareMore } from "lucide-react";

interface AuthHeaderProps {
  title?: string;
  description?: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className={`text-center ${title ? "mb-8" : "mb-6"}`}>
      <Link href="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="AtendeAI - página inicial">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <MessageSquareMore className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">
          Atende<span className="text-blue-400">AI</span>
        </span>
      </Link>
      {title && <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>}
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
