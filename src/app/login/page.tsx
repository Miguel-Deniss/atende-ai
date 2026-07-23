"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("BOTÃO FOI CLICADO");

    console.log({
      email,
      password,
    });

    if (!email || !password) {
      console.log("EMAIL OU SENHA VAZIOS");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      console.log("RESPOSTA DO AUTH:", result);

      if (result.success) {
        console.log("LOGIN OK");
        window.location.href = "/dashboard";
        return;
      }

      console.log("LOGIN ERRO:", result.error);

      alert(result.error);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] rounded-xl p-8 border border-gray-700 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log("EMAIL DIGITADO:", e.target.value);
                setEmail(e.target.value);
              }}
              className="w-full border p-3 rounded"
              placeholder="email@email.com"
            />
          </div>

          <div>
            <label className="block mb-2">Senha</label>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                console.log("SENHA DIGITADA:", e.target.value);
                setPassword(e.target.value);
              }}
              className="w-full border p-3 rounded"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            onClick={() => {
              console.log("BOTAO CLICADO");
              alert("CLICOU");
            }}
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
