"use client";

import { useEffect, useRef, useState } from "react";

interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  unread: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  async function loadConversations() {
    try {
      setLoadingList(true);
      const res = await fetch("/api/conversations");
      const json = await res.json();
      if (json.success) setConversations(json.data ?? []);
    } catch {
      console.error("Erro ao carregar conversas");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadMessages() {
    if (!selectedId) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      const json = await res.json();
      if (json.success) setMessages(json.data ?? []);
    } catch {
      console.error("Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !selectedId || sending) return;
    try {
      setSending(true);
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const json = await res.json();
      if (json.success) {
        setInput("");
        await loadMessages();
        await loadConversations();
      }
    } catch {
      console.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    setMessages([]);
    if (selectedId) loadMessages();
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] -m-4 lg:-m-8 overflow-hidden bg-[#0F172A]">
      {/* Sidebar */}
      <div className="w-[350px] flex-shrink-0 border-r border-gray-800 flex flex-col bg-[#111827]">
        <div className="border-b border-gray-800 px-4 py-3">
          <h2 className="text-base font-semibold text-white">Conversas</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList && (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-gray-400">Carregando...</span>
            </div>
          )}
          {!loadingList && conversations.length === 0 && (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-gray-500">Nenhuma conversa encontrada.</span>
            </div>
          )}
          {!loadingList &&
            conversations.map((c) => {
              const isSelected = c.id === selectedId;
              const initial = (c.name ?? c.phone).charAt(0).toUpperCase();
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full p-3 text-left transition-colors border-b border-gray-800 hover:bg-gray-700/50 ${
                    isSelected ? "bg-gray-700" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {initial}
                      </div>
                      {c.unread && (
                        <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#111827]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-sm font-medium text-white">
                          {c.name ?? "Cliente sem nome"}
                        </h3>
                        {c.lastMessageAt && (
                          <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                            {new Date(c.lastMessageAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{c.phone}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {c.lastMessage ?? "Nenhuma mensagem"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Chat */}
      {!selected && (
        <div className="flex flex-1 items-center justify-center bg-[#0F172A]">
          <p className="text-sm text-gray-500">Selecione uma conversa</p>
        </div>
      )}

      {selected && (
        <div className="flex flex-1 flex-col bg-[#0F172A]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {(selected.name ?? selected.phone).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">{selected.name ?? "Cliente"}</h2>
              <p className="text-xs text-gray-400">{selected.phone}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loadingMessages && (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-400">Carregando mensagens...</span>
              </div>
            )}
            {!loadingMessages && messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-500">Nenhuma mensagem ainda.</span>
              </div>
            )}
            {messages.map((msg) => {
              const isClient = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`mb-3 flex ${isClient ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
                      isClient ? "bg-gray-600 text-white" : "bg-blue-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="mt-1 block text-[10px] opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 px-4 py-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                disabled={sending}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}