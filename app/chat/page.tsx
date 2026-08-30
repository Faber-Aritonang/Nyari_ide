"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ChatMessage, { type Message } from "@/app/components/ChatMessage";
import { compressImage } from "@/lib/image-utils";
import { readTextFile, extractPdfText } from "@/lib/file-utils";
import { IMAGE_PROVIDERS, type ImageProvider } from "@/lib/image-gen";
import { startRecording, stopRecording } from "@/lib/voice-utils";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";
import { parseSSEStream } from "@/lib/sse-utils";
import ImageGallery from "@/app/components/ImageGallery";
import UsageDashboard from "@/app/components/UsageDashboard";
import PromptLibrary from "@/app/components/PromptLibrary";
import ChatTemplates from "@/app/components/ChatTemplates";
import { type ChatTemplate } from "@/lib/chat-templates";

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
  const { theme, toggleTheme } = useTheme();

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
  const [imageProvider, setImageProvider] = useState<ImageProvider>("pollinations");
  const [recording, setRecording] = useState(false);
  const [lang, setLangState] = useState<Lang>(getLang());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    message_id: string;
    role: string;
    content: string;
    conversation_id: string;
    conversation_title: string;
  }> | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
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

      // Parallel fetch conversations + models (saves ~200-500ms)
      const [convsRes, modelsRes] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/models"),
      ]);

      if (convsRes.ok) {
        const convs = await convsRes.json();
        setConversations(convs);
        if (convs.length > 0) setActiveConvId(convs[0].id);
      }
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

  // Toggle bahasa
  function toggleLang() {
    const newLang = lang === "id" ? "en" : "id";
    setLang(newLang);
    setLangState(newLang);
  }

  // Select conversation (mobile: close sidebar)
  function selectConversation(id: string) {
    setActiveConvId(id);
    setSidebarOpen(false);
  }

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
      setSidebarOpen(false);
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

  // Handle file selection
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
        alert(t("fileFormatError"));
        return;
      }
      setSelectedFile({ name: file.name, content });
    } catch (err) {
      alert(err instanceof Error ? err.message : t("fileTooLarge"));
    }
    e.target.value = "";
  }

  // Handle image selection
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert(t("imageFormatError"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert(t("imageSizeError"));
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setSelectedImage(compressed);
        } catch {
          setSelectedImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert(t("voiceError"));
    }
  }

  // Voice input
  async function handleVoiceInput() {
    if (recording) {
      setRecording(false);
      const blob = await stopRecording();
      if (!blob || blob.size < 100) return;
      await transcribeAudio(blob);
      return;
    }

    try {
      const { stop } = await startRecording();
      setRecording(true);
      // Auto stop after 30s
      const timer = setTimeout(async () => {
        setRecording(false);
        const blob = await stop();
        if (blob && blob.size >= 100) await transcribeAudio(blob);
      }, 30000);
      // Store timer for cleanup
      void timer;
    } catch (err) {
      alert(err instanceof Error ? err.message : t("voiceError"));
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      setSending(true);
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

  // Generate image (Hybrid mode)
  async function handleGenerateImage() {
    if (!input.trim() || sending || !activeConvId) return;

    const prompt = input.trim();
    setInput("");
    setSending(true);
    setImageGenMode(false);

    setMessages((prev) => [...prev, { role: "user", content: `[🎨 ${imageProvider.toUpperCase()}] ${prompt}` }]);
    setMessages((prev) => [...prev, { role: "assistant", content: `🎨 Generating with ${imageProvider}...` }]);

    // Save user message to database
    try {
      await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          content: `[🎨 ${imageProvider.toUpperCase()}] ${prompt}`,
        }),
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
    }

    try {
      // Call server-side API route (API keys are server-only env vars)
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          provider: imageProvider,
          size: "1024",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Image generation failed");
      }

      // Set image directly — server already verified generation succeeded
      const assistantContent = `🎨 Generated with ${data.provider}\nPrompt: "${prompt}"`;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: assistantContent,
          generated_image_url: data.url,
        };
        return updated;
      });

      // Save assistant message with image to database
      try {
        await fetch(`/api/conversations/${activeConvId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: assistantContent,
            generated_image_url: data.url,
          }),
        });
      } catch (err) {
        console.error("Failed to save assistant message:", err);
      }
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

  // Regenerate image with same prompt
  async function handleRegenerateImage(prompt: string) {
    if (sending || !activeConvId) return;

    setInput("");
    setSending(true);
    setImageGenMode(false);

    setMessages((prev) => [...prev, { role: "user", content: `[🔄 Regenerate] ${prompt}` }]);
    setMessages((prev) => [...prev, { role: "assistant", content: `🎨 Regenerating with ${imageProvider}...` }]);

    // Save user message to database
    try {
      await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          content: `[🔄 Regenerate] ${prompt}`,
        }),
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
    }

    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          provider: imageProvider,
          size: "1024",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Image generation failed");
      }

      const assistantContent = `🎨 Regenerated with ${data.provider}\nPrompt: "${prompt}"`;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: assistantContent,
          generated_image_url: data.url,
        };
        return updated;
      });

      // Save assistant message with image to database
      try {
        await fetch(`/api/conversations/${activeConvId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: assistantContent,
            generated_image_url: data.url,
          }),
        });
      } catch (err) {
        console.error("Failed to save assistant message:", err);
      }
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

  // Generate conversation summary
  async function handleSummarize() {
    if (sending || !activeConvId || messages.length < 4) return;

    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: "📝 Summarize this conversation" }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Build conversation context for summary
    const conversationText = messages
      .filter((m) => m.content && !m.isError)
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const summaryPrompt = `Ringkas percakapan berikut dalam poin-poin penting (max 10 poin). Fokus pada ide utama, keputusan, dan action items.\n\n${conversationText}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: summaryPrompt,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t("networkError") }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `❌ ${err.error || t("networkError")}`,
          };
          return updated;
        });
        setSending(false);
        return;
      }

      await parseSSEStream(response, {
        onContent: (content) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              role: "assistant",
              content: (updated[lastIdx]?.content ?? "") + content,
            };
            return updated;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `❌ ${t("networkError")}`,
        };
        return updated;
      });
    }
    setSending(false);
  }

  // Handle reaction (like/dislike)
  async function handleReaction(messageId: string, reaction: "like" | "dislike" | null) {
    try {
      await fetch(`/api/messages/${messageId}/reaction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
    } catch (err) {
      console.error("Failed to update reaction:", err);
    }
  }

  // Branch conversation from a specific message
  async function handleBranch(messageId: string) {
    if (!activeConvId) return;

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to branch conversation:", err);
    }
  }

  // Search messages
  async function handleSearch(query: string) {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
    setSearchLoading(false);
  }

  // Navigate to conversation and highlight message
  function navigateToMessage(conversationId: string) {
    setActiveConvId(conversationId);
    setSearchResults(null);
    setSearchQuery("");
    setSidebarOpen(false);
  }

  // Send message
  async function sendMessage() {
    if (imageGenMode && input.trim()) {
      await handleGenerateImage();
      return;
    }

    if ((!input.trim() && !selectedImage) || sending || !activeConvId) return;

    const userMessage = input.trim() || (selectedFile ? "(file)" : "(image)");
    const imageToSend = selectedImage;
    const fileToSend = selectedFile;
    setInput("");
    setSelectedImage(null);
    setSelectedFile(null);
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, image_url: imageToSend },
    ]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
        const err = await response.json().catch(() => ({ error: t("networkError") }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `❌ ${err.error || t("networkError")}`,
          };
          return updated;
        });
        setSending(false);
        return;
      }

      await parseSSEStream(response, {
        onContent: (content) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              role: "assistant",
              content: (updated[lastIdx]?.content ?? "") + content,
            };
            return updated;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `❌ ${t("networkError")}`,
        };
        return updated;
      });
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Ctrl+Shift+R = regenerate last message
    if (e.key === "r" && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      handleRegenerate();
    }
    // Ctrl+E = export chat
    if (e.key === "e" && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      exportChat();
    }
  }

  // Regenerate last AI response
  async function handleRegenerate() {
    if (sending || !activeConvId || messages.length < 2) return;

    // Find last user message
    const lastUserIdx = [...messages].findLastIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const lastUserMsg = messages[lastUserIdx];

    // Remove last AI response and set loading
    setMessages((prev) => prev.slice(0, -1));
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: lastUserMsg.content,
          model: selectedModel,
          imageUrl: lastUserMsg.image_url,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t("networkError") }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `❌ ${err.error || t("networkError")}`,
            isError: true,
          };
          return updated;
        });
        setSending(false);
        return;
      }

      await parseSSEStream(response, {
        onContent: (content) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              role: "assistant",
              content: (updated[lastIdx]?.content ?? "") + content,
            };
            return updated;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `❌ ${t("networkError")}`,
          isError: true,
        };
        return updated;
      });
    }
    setSending(false);
  }

  // Edit user message & regenerate
  async function handleEditMessage(idx: number, newContent: string) {
    if (sending || !activeConvId) return;

    // Update the user message and remove everything after it
    setMessages((prev) => {
      const updated = prev.slice(0, idx + 1);
      updated[idx] = { ...updated[idx], content: newContent };
      return updated;
    });
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: newContent,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t("networkError") }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `❌ ${err.error || t("networkError")}`,
            isError: true,
          };
          return updated;
        });
        setSending(false);
        return;
      }

      await parseSSEStream(response, {
        onContent: (content) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              role: "assistant",
              content: (updated[lastIdx]?.content ?? "") + content,
            };
            return updated;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `❌ ${t("networkError")}`,
          isError: true,
        };
        return updated;
      });
    }
    setSending(false);
  }

  // Export chat as Markdown
  function exportChat() {
    if (messages.length === 0) return;

    const convTitle = conversations.find((c) => c.id === activeConvId)?.title || "Chat";
    let md = `# ${convTitle}\n\n`;
    md += `> Exported from Nyari_ide — ${new Date().toLocaleDateString("id-ID")}\n\n`;

    for (const msg of messages) {
      const role = msg.role === "user" ? "**You**" : "**AI**";
      md += `### ${role}\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${convTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export chat as PDF
  async function exportChatPDF() {
    if (messages.length === 0) return;

    const convTitle = conversations.find((c) => c.id === activeConvId)?.title || "Chat";

    // Create a temporary div for rendering
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;padding:40px;background:white;color:black;font-family:sans-serif;";

    let html = `<h1 style="font-size:24px;margin-bottom:8px;">${convTitle}</h1>`;
    html += `<p style="color:#666;font-size:12px;margin-bottom:24px;">Exported from Nyari_ide — ${new Date().toLocaleDateString("id-ID")}</p>`;

    for (const msg of messages) {
      const role = msg.role === "user" ? "You" : "AI";
      const bgColor = msg.role === "user" ? "#f0f0f0" : "#e8f4e8";
      html += `<div style="margin-bottom:16px;padding:12px;border-radius:8px;background:${bgColor};">`;
      html += `<strong style="font-size:12px;color:#333;">${role}</strong>`;
      html += `<p style="margin:4px 0 0 0;font-size:14px;white-space:pre-wrap;">${msg.content}</p>`;
      if (msg.generated_image_url) {
        html += `<img src="${msg.generated_image_url}" style="max-width:100%;max-height:300px;margin-top:8px;border-radius:4px;" />`;
      }
      html += `</div>`;
    }

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${convTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF");
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  async function handleShare() {
    if (!activeConvId) return;

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: true }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      // Copy URL ke clipboard
      await navigator.clipboard.writeText(data.url);
      alert(t("shareLinkCopied"));
    } catch {
      alert("Failed to create share link");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar-bg border-r border-border-theme flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-theme">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">🧠 {t("appName")}</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="text-xs bg-input-bg hover:bg-surface-hover border border-border-theme rounded px-2 py-1 transition-colors"
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                onClick={toggleLang}
                className="text-xs bg-input-bg hover:bg-surface-hover border border-border-theme rounded px-2 py-1 transition-colors"
              >
                {lang === "id" ? "EN" : "ID"}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-border-theme">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder={lang === "id" ? "Cari pesan..." : "Search messages..."}
              className="w-full bg-input-bg border border-border-theme rounded-lg px-3 py-2 text-sm pl-8 focus:outline-none focus:border-blue-500 placeholder:text-muted"
            />
            <span className="absolute left-2.5 top-2.5 text-muted text-sm">🔍</span>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                className="absolute right-2.5 top-2.5 text-muted hover:text-foreground text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {searchResults && (
          <div className="px-3 py-2 border-b border-border-theme max-h-64 overflow-y-auto">
            <p className="text-xs text-muted mb-2">
              {searchResults.length} {lang === "id" ? "hasil" : "results"}
            </p>
            {searchResults.length === 0 ? (
              <p className="text-xs text-muted text-center py-2">
                {lang === "id" ? "Tidak ada hasil" : "No results found"}
              </p>
            ) : (
              searchResults.map((result) => (
                <button
                  key={result.message_id}
                  onClick={() => navigateToMessage(result.conversation_id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-hover mb-1 transition-colors"
                >
                  <p className="text-xs text-muted-light truncate">
                    {result.conversation_title}
                  </p>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {result.content.slice(0, 60)}...
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="px-3 pb-2 flex gap-2">
          <button
            onClick={() => setTemplatesOpen(true)}
            className="flex-1 rounded-lg bg-input-bg hover:bg-surface-hover border border-border-theme py-2 text-sm transition-colors flex items-center justify-center gap-1"
            title={lang === "id" ? "Template" : "Templates"}
          >
            📋
          </button>
          <button
            onClick={() => setGalleryOpen(true)}
            className="flex-1 rounded-lg bg-input-bg hover:bg-surface-hover border border-border-theme py-2 text-sm transition-colors flex items-center justify-center gap-1"
          >
            🖼️
          </button>
          <button
            onClick={() => setUsageOpen(true)}
            className="flex-1 rounded-lg bg-input-bg hover:bg-surface-hover border border-border-theme py-2 text-sm transition-colors flex items-center justify-center gap-1"
          >
            📊
          </button>
          <button
            onClick={() => setPromptsOpen(true)}
            className="flex-1 rounded-lg bg-input-bg hover:bg-surface-hover border border-border-theme py-2 text-sm transition-colors flex items-center justify-center gap-1"
          >
            📚
          </button>
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
                  ? "bg-input-bg text-foreground"
                  : "hover:bg-surface-hover text-muted"
              }`}
              onClick={() => selectConversation(conv.id)}
            >
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 text-xs ml-2 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-xs text-muted text-center mt-8">
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
        <div className="p-3 border-t border-border-theme">
          <div className="text-xs text-muted truncate mb-2">{email}</div>
          <button
            onClick={() => router.push("/settings")}
            className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
          >
            ⚙️ {t("settings")}
          </button>
          <button
            onClick={() => router.push("/rag/documents")}
            className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
          >
            📚 {lang === "id" ? "Dokumen" : "Documents"}
          </button>
          {email === "faber.aritonang@gmail.com" && (
            <button
              onClick={() => router.push("/admin")}
              className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
            >
              🔐 Admin
            </button>
          )}
          {activeConvId && messages.length > 0 && (
            <>
              {messages.length >= 4 && (
                <button
                  onClick={handleSummarize}
                  disabled={sending}
                  className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2 disabled:opacity-50"
                  title={lang === "id" ? "Ringkas percakapan" : "Summarize conversation"}
                >
                  📝 {lang === "id" ? "Ringkas" : "Summarize"}
                </button>
              )}
              <button
                onClick={exportChat}
                className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
                title={t("exportMd")}
              >
                📥 {t("exportChat")} (MD)
              </button>
              <button
                onClick={exportChatPDF}
                className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
                title="Export as PDF"
              >
                📄 Export PDF
              </button>
              <button
                onClick={handleShare}
                className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors mb-2"
                title={t("shareChat")}
              >
                🔗 {t("share")}
              </button>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-input-bg hover:bg-surface-hover py-2 text-xs transition-colors"
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-theme md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted hover:text-foreground text-xl"
          >
            ☰
          </button>
          <span className="text-sm font-medium truncate">
            {conversations.find((c) => c.id === activeConvId)?.title || t("appName")}
          </span>
        </div>

        {activeConvId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6">
              <div className="max-w-3xl mx-auto">
                {loadingHistory && (
                  <p className="text-center text-muted text-sm">
                    {t("loadingHistory")}
                  </p>
                )}

                {messages.length === 0 && !loadingHistory && (
                  <div className="text-center text-muted mt-10 md:mt-20">
                    <p className="text-3xl md:text-4xl mb-4">🧠💡</p>
                    <p className="text-base md:text-lg font-medium mb-2">
                      {t("appName")}
                    </p>
                    <p className="text-sm">
                      {t("startChatting")}
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    messageId={msg.id}
                    onRetry={!sending && msg.role === "assistant" && i === messages.length - 1 ? handleRegenerate : undefined}
                    onEdit={msg.role === "user" && !sending ? (newContent) => handleEditMessage(i, newContent) : undefined}
                    onReaction={msg.role === "assistant" ? handleReaction : undefined}
                    onBranch={msg.id && !sending ? handleBranch : undefined}
                    onRegenerateImage={msg.generated_image_url && !sending ? handleRegenerateImage : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border-theme p-3 md:p-4">
              <div className="max-w-3xl mx-auto">
                {/* Model selector */}
                {models.length > 1 && (
                  <div className="mb-2 md:mb-3 flex items-center gap-2">
                    <label className="text-xs text-muted">Model:</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-input-bg border border-border-theme rounded-lg px-2 md:px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-lighter hidden sm:inline">
                      {models.find((m) => m.id === selectedModel)?.description}
                    </span>
                  </div>
                )}

                {/* Image preview */}
                {selectedImage && (
                  <div className="mb-2 md:mb-3 relative inline-block">
                    <img src={selectedImage} alt="Preview" className="h-20 md:h-24 rounded-lg border border-border-theme" />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >✕</button>
                  </div>
                )}

                {/* File preview */}
                {selectedFile && (
                  <div className="mb-2 md:mb-3 flex items-center gap-2 bg-input-bg border border-border-theme rounded-lg px-3 py-2">
                    <span className="text-sm">📄</span>
                    <span className="text-xs text-muted-light flex-1 truncate">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-muted hover:text-red-400 text-xs">✕</button>
                  </div>
                )}

                <div className="flex items-end gap-2 md:gap-3">
                  {/* Upload buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <label className="rounded-xl bg-input-bg hover:bg-surface-hover border border-border-theme px-2.5 md:px-3 py-2.5 md:py-3 text-sm cursor-pointer transition-colors" title={t("uploadImage")}>
                      🖼️
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                    </label>
                    <label className="rounded-xl bg-input-bg hover:bg-surface-hover border border-border-theme px-2.5 md:px-3 py-2.5 md:py-3 text-sm cursor-pointer transition-colors" title={t("uploadFile")}>
                      📎
                      <input type="file" accept=".txt,.js,.ts,.py,.json,.md,.html,.css,.sql,.yaml,.yml,.xml,.csv,.log,.env,.config,.pdf,text/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => { setImageGenMode(!imageGenMode); setSelectedImage(null); setSelectedFile(null); }}
                        className={`rounded-xl border px-2.5 md:px-3 py-2.5 md:py-3 text-sm transition-colors ${imageGenMode ? "bg-purple-600 border-purple-500 text-white" : "bg-input-bg hover:bg-surface-hover border-border-theme"}`}
                        title={t("imageGenMode")}
                      >🎨</button>
                      {imageGenMode && (
                        <select
                          value={imageProvider}
                          onChange={(e) => setImageProvider(e.target.value as ImageProvider)}
                          className="absolute -bottom-8 left-0 z-10 bg-input-bg border border-border-theme rounded px-1 py-0.5 text-xs text-foreground w-40"
                        >
                          {IMAGE_PROVIDERS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      onClick={handleVoiceInput}
                      className={`rounded-xl border px-2.5 md:px-3 py-2.5 md:py-3 text-sm transition-colors ${recording ? "bg-red-600 border-red-500 text-white animate-pulse" : "bg-input-bg hover:bg-surface-hover border-border-theme"}`}
                      title={recording ? t("recording") : t("voiceInput")}
                    >{recording ? "⏹" : "🎤"}</button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={imageGenMode ? t("typeImagePrompt") : t("typeMessage")}
                    rows={1}
                    className="flex-1 bg-input-bg border border-border-theme rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder:text-muted min-h-[42px]"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className={`rounded-xl disabled:opacity-50 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium transition-colors flex-shrink-0 ${imageGenMode ? "bg-purple-600 hover:bg-purple-500" : "bg-blue-600 hover:bg-blue-500"}`}
                  >
                    {sending ? "..." : imageGenMode ? t("generate") : t("send")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted">
              <p className="text-3xl md:text-4xl mb-4">🧠💡</p>
              <p className="text-base md:text-lg font-medium mb-2">{t("appName")}</p>
              <p className="text-sm mb-6">{t("selectOrCreate")}</p>
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

      {/* Image Gallery Modal */}
      <ImageGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />

      {/* Usage Dashboard Modal */}
      <UsageDashboard isOpen={usageOpen} onClose={() => setUsageOpen(false)} lang={lang} />

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={promptsOpen}
        onClose={() => setPromptsOpen(false)}
        onSelect={(prompt) => setInput(prompt)}
        lang={lang}
      />

      {/* Chat Templates Modal */}
      <ChatTemplates
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={(template, examplePrompt) => {
          setInput(examplePrompt || template.initialMessage[lang]);
          setImageGenMode(false);
        }}
        lang={lang}
      />
    </div>
  );
}
