"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Camera, Loader2, Check, X, MailWarning } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string;
}

const defaults: ProfileData = {
  name: "",
  email: "",
  phone: "",
  role: "",
  avatar: "",
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const emailVerified = user?.emailVerified ?? true;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Erro ao carregar");
        const json = await res.json();
        setData({
          name: json.data.name ?? "",
          email: json.data.email ?? "",
          phone: json.data.phone ?? "",
          role: json.data.role ?? "",
          avatar: json.data.avatarUrl ?? "",
        });
      } catch {
        toast("Erro ao carregar perfil", "error");
      } finally {
        setLoaded(true);
      }
    })();
  }, [toast]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!data.name.trim() || !data.email.trim()) {
      toast("Nome e email são obrigatórios", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      toast("Email inválido", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const json = await res.json();
      setData((prev) => ({ ...prev, role: json.data.role ?? prev.role }));
      toast("Perfil atualizado com sucesso!");
    } catch {
      toast("Erro ao salvar perfil", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("avatar", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async () => {
    const errs: Record<string, string> = {};
    if (!passwordForm.current) errs.current = "Senha atual é obrigatória";
    if (!passwordForm.newPwd) errs.newPwd = "Nova senha é obrigatória";
    else if (passwordForm.newPwd.length < 6) errs.newPwd = "Mínimo 6 caracteres";
    if (passwordForm.newPwd !== passwordForm.confirm) errs.confirm = "Senhas não conferem";
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: true,
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPwd,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erro ao alterar senha");
      }
      setPasswordForm({ current: "", newPwd: "", confirm: "" });
      setPasswordErrors({});
      toast("Senha alterada com sucesso!");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao alterar senha", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Perfil</h1>
        <p className="text-gray-500 text-sm">Gerencie suas informações pessoais.</p>
      </motion.div>

      {!emailVerified && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <MailWarning className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">E-mail não verificado</p>
              <p className="text-sm text-gray-400">
                Confirme seu e-mail acessando o link enviado na sua caixa de entrada para ativar sua conta por completo.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="w-20 h-20">
                  {data.avatar ? (
                    <AvatarImage src={data.avatar} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-400 text-xl font-bold text-white">
                      {data.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-white">{data.name}</h3>
                <p className="text-sm text-gray-500">{data.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={data.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={data.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Input id="role" value={data.role} onChange={(e) => update("role", e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base text-white">Alterar Senha</CardTitle>
            <CardDescription>Mantenha sua conta segura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Senha atual</Label>
              <Input id="current" type="password" value={passwordForm.current}
                onChange={(e) => { setPasswordForm((p) => ({ ...p, current: e.target.value })); setPasswordErrors((p) => ({ ...p, current: "" })); }}
                className={passwordErrors.current ? "border-red-500/50" : ""}
              />
              {passwordErrors.current && <p className="text-xs text-red-400">{passwordErrors.current}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new">Nova senha</Label>
                <Input id="new" type="password" value={passwordForm.newPwd}
                  onChange={(e) => { setPasswordForm((p) => ({ ...p, newPwd: e.target.value })); setPasswordErrors((p) => ({ ...p, newPwd: "" })); }}
                  className={passwordErrors.newPwd ? "border-red-500/50" : ""}
                />
                {passwordErrors.newPwd && <p className="text-xs text-red-400">{passwordErrors.newPwd}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <div className="relative">
                  <Input id="confirm" type="password" value={passwordForm.confirm}
                    onChange={(e) => { setPasswordForm((p) => ({ ...p, confirm: e.target.value })); setPasswordErrors((p) => ({ ...p, confirm: "" })); }}
                    className={passwordErrors.confirm ? "border-red-500/50 pr-10" : "pr-10"}
                  />
                  {passwordForm.confirm && (
                    passwordForm.newPwd === passwordForm.confirm ? (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                    )
                  )}
                </div>
                {passwordErrors.confirm && <p className="text-xs text-red-400">{passwordErrors.confirm}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange} disabled={savingPassword} variant="outline" className="flex items-center gap-2">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPassword ? "Salvando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
