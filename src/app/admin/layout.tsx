"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, BarChart3, FileText, Shield, LogOut, Menu, X,
  Loader2, ChevronLeft,
} from "lucide-react";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/companies", icon: Building2, label: "Empresas" },
  { href: "/admin/logs", icon: FileText, label: "Logs" },
  { href: "/admin/audit", icon: Shield, label: "Auditoria" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="flex h-screen overflow-hidden">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-border/50 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white">Admin</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-gray-400 hover:text-white hover:bg-secondary/30"
                    }`}>
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border/50">
              <Link href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-secondary/30 transition-all mb-2">
                <ChevronLeft className="w-4 h-4" />
                Voltar ao app
              </Link>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden sticky top-0 z-40 bg-[#0F172A]/80 backdrop-blur-md border-b border-border/50 p-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
