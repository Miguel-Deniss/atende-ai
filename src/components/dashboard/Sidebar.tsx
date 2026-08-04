"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  CreditCard,
  UserCircle,
  LogOut,
  MessageSquareMore,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Conversas", href: "/dashboard/conversations" },
  { icon: Calendar, label: "Agenda", href: "/dashboard/schedule" },
  { icon: Users, label: "Clientes", href: "/dashboard/clients" },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
  { icon: CreditCard, label: "Minha assinatura", href: "/dashboard/subscription" },
  { icon: UserCircle, label: "Perfil", href: "/dashboard/profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass border border-border/50 text-gray-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar border-r border-border/50 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Link href="/" className={cn("flex items-center gap-2.5", collapsed && "justify-center w-full")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <MessageSquareMore className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold text-white">
                Atende<span className="text-blue-400">AI</span>
              </span>
            )}
          </Link>

          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-secondary/50 transition-colors",
              collapsed && "absolute -right-3 top-5 bg-sidebar border border-border/50"
            )}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                  isActive
                    ? "bg-blue-500/15 text-blue-400 font-medium"
                    : "text-gray-400 hover:text-gray-200 hover:bg-secondary/50",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-blue-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {user?.role === "SUPER_ADMIN" && (
          <div className="px-3 py-1">
            <Link href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200">
              <Shield className="w-4 h-4" />
              {!collapsed && <span>Admin</span>}
            </Link>
          </div>
        )}

        {!collapsed && user && (
          <div className="px-3 py-2 border-t border-border/50">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary/30">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className={cn("p-3 border-t border-border/50", collapsed && "flex justify-center")}>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
