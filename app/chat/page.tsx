"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatMessage, { type Message } from "@/app/components/ChatMessage";
import { compressImage } from "@/lib/image-utils";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user info & conversations on mount
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email ?? "");

      // Fetch conversations
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const convs = await res.json();
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      }

      // Fetch available models
      const modelsRes = await fetch("/api/models");
      if (modelsRes.ok) {
        const modelList = await modelsRes.json();
        setModels(modelList);
        if (modelList.length > 0) setSelectedModel(modelList[0].id);
      }
    }
    init();
  }, [supabase, router]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    async function fetchMessages() {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/conversations/${activeConvId}/messages`);
        if (res.ok) {
          const msgs = await res.json();
          setMessages(msgs);
        }
      } catch {
        // ignore
      }
      setLoadingHistory(false);
    }
    fetchMessages();
  }, [activeConvId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Create new conversation
  async function createConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Percakapan baru" }),
    });

    if (res.ok) {
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
    }
  }

  // Delete conversation
  async function deleteConversation(id: string) {
    if (!confirm("Hapus percakapan ini?")) return;

    const res = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    }
  }

  // Handle image selection
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran (maks 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 4MB.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const original = reader.result as string;
        // Compress gambar sebelum ditampilkan & dikirim
        const compressed = await compressImage(original);
        setSelectedImage(compressed);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Gagal memproses gambar.");
    }
  }

  // Send message
  async function sendMessage() {
    if ((!input.trim() && !selectedImage) || sending || !activeConvId) return;

    const userMessage = input.trim() || "(gambar)";
    const imageToSend = selectedImage;
    setInput("");
    setSelectedImage(null);
    setSending(true);

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, image_url: imageToSend },
    ]);

    // Add empty assistant message placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Update conversation title with first message (if still default)
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (currentConv && currentConv.title === "Percakapan baru") {
      const newTitle = userMessage.slice(0, 50);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, title: newTitle } : c))
      );
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: userMessage,
          model: selectedModel,
          imageUrl: imageToSend,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Gagal mengirim pesan." }));
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            role: "assistant",
            content: `❌ ${err.error || "Gagal mengirim pesan."}`,
          };
          return updated;
        });
        setSending(false);
        return;
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        setSending(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);

          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                  role: "assistant",
                  content: (updated[lastIdx]?.content ?? "") + parsed.content,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: "❌ Terjadi kesalahan jaringan. Coba lagi.",
        };
        return updated;
      });
    }

    setSending(false);
  }

  // Handle Enter key
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold">Nyari_ide 🧠</h1>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <button
            onClick={createConversation}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-medium transition-colors"
          >
            + Percakapan Baru
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 mb-1 cursor-pointer transition-colors ${
                activeConvId === conv.id
                  ? "bg-zinc-800 text-white"
                  : "hover:bg-zinc-800/50 text-zinc-400"
              }`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-xs ml-2 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-xs text-zinc-500 text-center mt-8">
              Belum ada percakapan.
              <br />
              Klik tombol di atas untuk memulai.
            </p>
          )}
        </div>

        {/* User info + logout */}
        <div className="p-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 truncate mb-2">{email}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2 text-xs transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        {activeConvId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-3xl mx-auto">
                {loadingHistory && (
                  <p className="text-center text-zinc-500 text-sm">
                    Memuat riwayat...
                  </p>
                )}

                {messages.length === 0 && !loadingHistory && (
                  <div className="text-center text-zinc-500 mt-20">
                    <p className="text-4xl mb-4">🧠</p>
                    <p className="text-lg font-medium mb-2">
                      Mulai percakapan baru
                    </p>
                    <p className="text-sm">
                      Kirim pesan untuk memulai chatting dengan Nyari_ide.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-zinc-800 p-4">
              <div className="max-w-3xl mx-auto">
                {/* Model selector */}
                {models.length > 1 && (
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Model:</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id} title={m.description}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-zinc-600">
                      {models.find((m) => m.id === selectedModel)?.description}
                    </span>
                  </div>
                )}
                {/* Image preview */}
                {selectedImage && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="h-24 rounded-lg border border-zinc-700"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-3">
                  {/* Upload image button */}
                  <label className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-3 text-sm cursor-pointer transition-colors" title="Upload gambar">
                    🖼️
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter baris baru)"
                    rows={1}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-medium transition-colors"
                  >
                    {sending ? "..." : "Kirim"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <p className="text-4xl mb-4">🧠💡</p>
              <p className="text-lg font-medium mb-2">Nyari_ide</p>
              <p className="text-sm mb-6">
                Pilih percakapan atau buat yang baru.
              </p>
              <button
                onClick={createConversation}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-medium transition-colors"
              >
                + Percakapan Baru
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
