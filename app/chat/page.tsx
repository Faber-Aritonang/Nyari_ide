"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatMessage, { type Message } from "@/app/components/ChatMessage";
import { compressImage } from "@/lib/image-utils";
import { readTextFile, extractPdfText } from "@/lib/file-utils";
import { generateImageUrl } from "@/lib/image-gen";
import { startRecording, stopRecording, stopCurrentRecording } from "@/lib/voice-utils";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";

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
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [imageGenMode, setImageGenMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaStopFn, setMediaStopFn] = useState<(() => Promise<Blob>) | null>(null);
  const [lang, setLangState] = useState<Lang>(getLang());
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
    if (!confirm(t("deleteConfirm"))) return;

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

  // Handle file (teks/PDF) selection
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string;

      if (file.type === "application/pdf") {
        content = await extractPdfText(file);
      } else if (
        file.type.startsWith("text/") ||
        [".js", ".ts", ".py", ".json", ".md", ".html", ".css", ".sql", ".yaml", ".yml", ".xml", ".csv", ".txt", ".log", ".env", ".config"].some((ext) => file.name.endsWith(ext))
      ) {
        content = await readTextFile(file);
      } else {
        alert("Format file tidak didukung. Gunakan file teks atau PDF.");
        return;
      }

      setSelectedFile({ name: file.name, content });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membaca file.");
    }
    // Reset input agar bisa upload file yang sama lagi
    e.target.value = "";
  }

  // Handle image selection
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi format
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }

    // Validasi ukuran (maks 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 4MB.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const original = reader.result as string;
          const compressed = await compressImage(original);
          setSelectedImage(compressed);
        } catch {
          // Fallback: pakai original jika compress gagal
          setSelectedImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Gagal membaca file gambar.");
    }
  }

  // Toggle bahasa
  function toggleLang() {
    const newLang = lang === "id" ? "en" : "id";
    setLang(newLang);
    setLangState(newLang);
  }

  // Voice input: start/stop recording → transcribe via Whisper
  async function handleVoiceInput() {
    if (recording) {
      // STOP recording
      setRecording(false);
      const blob = await stopRecording();
      if (!blob || blob.size < 100) {
        // Audio terlalu kecil, abaikan
        return;
      }
      await transcribeAudio(blob);
      return;
    }

    // START recording
    try {
      const { stop } = await startRecording();
      setMediaStopFn(() => stop);
      setRecording(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("voiceError"));
    }
  }

  // Transcribe audio via Whisper
  async function transcribeAudio(audioBlob: Blob) {
    try {
      setSending(true); // Tampilkan loading
      const formData = new FormData();
      const ext = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("mp4") ? "mp4" : "ogg";
      formData.append("audio", audioBlob, `recording.${ext}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t("transcribeError") }));
        alert(err.error || t("transcribeError"));
        return;
      }

      const { text } = await res.json();
      if (text && text.trim()) {
        setInput((prev) => (prev ? prev + " " + text.trim() : text.trim()));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t("voiceError"));
    }
    setSending(false);
  }

  // Generate image via Pollinations.ai
  async function handleGenerateImage() {
    if (!input.trim() || sending || !activeConvId) return;

    const prompt = input.trim();
    setInput("");
    setSending(true);
    setImageGenMode(false);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: `[Generate Gambar] ${prompt}` }]);
    // Add loading placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: `🎨 ${t("generating")}` }]);

    try {
      const url = generateImageUrl(prompt, "1024");
      // Tunggu gambar load
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal generate gambar"));
        setTimeout(() => reject(new Error("Timeout: gambar terlalu lama")), 60000);
      });

      // Replace loading dengan gambar
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: `🎨 Gambar generated dari prompt: "${prompt}"`,
          generated_image_url: url,
        };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: `❌ ${err instanceof Error ? err.message : t("networkError")}`,
        };
        return updated;
      });
    }
    setSending(false);
  }

  // Send message
  async function sendMessage() {
    // Jika image gen mode, jalankan generate
    if (imageGenMode && input.trim()) {
      await handleGenerateImage();
      return;
    }

    if ((!input.trim() && !selectedImage) || sending || !activeConvId) return;

    const userMessage = input.trim() || (selectedFile ? "(file: " + selectedFile.name + ")" : "(gambar)");
    const imageToSend = selectedImage;
    const fileToSend = selectedFile;
    setInput("");
    setSelectedImage(null);
    setSelectedFile(null);
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
          fileContext: fileToSend?.content,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Gagal mengirim pesan." }));
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            role: "assistant",
            content: `❌ ${err.error || t("networkError")}`,
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
          content: `❌ ${t("networkError")}`,
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
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">🧠 {t("appName")}</h1>
            <button
              onClick={toggleLang}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2 py-1 transition-colors"
              title="Toggle ID/EN"
            >
              {lang === "id" ? "EN" : "ID"}
            </button>
          </div>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <button
            onClick={createConversation}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-medium transition-colors"
          >
            + {t("newConversation")}
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
              {t("noConversations").split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t("noConversations").split("\n").length - 1 && <br />}
                </span>
              ))}
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
                    {t("loadingHistory")}
                  </p>
                )}

                {messages.length === 0 && !loadingHistory && (
                  <div className="text-center text-zinc-500 mt-20">
                    <p className="text-4xl mb-4">🧠</p>
                    <p className="text-lg font-medium mb-2">
                      {t("appName")} 🧠💡
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
                    <p className="text-xs text-zinc-500 mt-1">Gambar akan di-compress otomatis ke JPEG</p>
                  </div>
                )}
                {/* File preview */}
                {selectedFile && (
                  <div className="mb-3 flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    <span className="text-sm">📄</span>
                    <span className="text-xs text-zinc-300 flex-1 truncate">
                      {selectedFile.name} ({(selectedFile.content.length / 1000).toFixed(1)}K chars)
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-zinc-500 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-3">
                  {/* Upload buttons */}
                  <div className="flex gap-1">
                    <label className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-3 text-sm cursor-pointer transition-colors"                      title={t("uploadImage")}>
                      🖼️
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    <label className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-3 text-sm cursor-pointer transition-colors"                      title={t("uploadFile")}>
                      📎
                      <input
                        type="file"
                        accept=".txt,.js,.ts,.py,.json,.md,.html,.css,.sql,.yaml,.yml,.xml,.csv,.log,.env,.config,.pdf,text/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setImageGenMode(!imageGenMode);
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                      className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                        imageGenMode
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                      }`}
                      title="Generate gambar dari teks (GPT Image 2 via Pollinations.ai)"
                    >
                      🎨
                    </button>
                    <button
                      onClick={handleVoiceInput}
                      className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                        recording
                          ? "bg-red-600 border-red-500 text-white animate-pulse"
                          : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                      }`}
                      title={recording ? t("recording") : t("voiceInput")}
                    >
                      {recording ? "⏹" : "🎤"}
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={imageGenMode ? t("typeImagePrompt") : t("typeMessage")}
                    rows={1}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className={`rounded-xl disabled:opacity-50 px-4 py-3 text-sm font-medium transition-colors ${
                      imageGenMode
                        ? "bg-purple-600 hover:bg-purple-500"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {sending ? "..." : imageGenMode ? t("generate") : t("send")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <p className="text-4xl mb-4">🧠💡</p>                    <p className="text-lg font-medium mb-2">{t("appName")}</p>
                    <p className="text-sm mb-6">
                      {t("selectOrCreate")}
                    </p>
              <button
                onClick={createConversation}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-medium transition-colors"
              >
                + {t("newConversation")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
