"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  { label: "Mínimo de 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Caractere especial", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
] as const;

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const met = REQUIREMENTS.filter((r) => r.test(password)).length;
  const strength = Math.round((met / REQUIREMENTS.length) * 100);

  const barColor =
    strength === 0
      ? "bg-gray-700"
      : strength < 40
        ? "bg-red-500"
        : strength < 80
          ? "bg-yellow-500"
          : "bg-emerald-500";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              level <= Math.max(1, Math.ceil((met / REQUIREMENTS.length) * 5)) ? barColor : "bg-gray-700"
            )}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-1.5">
        {REQUIREMENTS.map((req) => {
          const ok = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                ok ? "text-emerald-400" : "text-gray-500"
              )}
            >
              {ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <X className="w-3.5 h-3.5 flex-shrink-0" />}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
