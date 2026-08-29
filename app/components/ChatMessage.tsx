"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { downloadImage } from "@/lib/image-gen";
import { t } from "@/lib/i18n";

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
  generated_image_url?: string | null;
  isError?: boolean;
  reaction?: "like" | "dislike" | null;
}

const EN_VOICES = ["hannah", "diana", "autumn", "austin", "daniel", "troy"];
const ID_VOICES = ["noura", "lulwa", "aisha", "fahad", "sultan", "abdullah"];

function detectLang(text: string): "en" | "id" {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "en";
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > text.length * 0.02) return "id";
  const idWords = new Set([
    "adalah", "akan", "atau", "bahwa", "bisa", "dengan", "dari", "dalam",
    "ini", "itu", "juga", "kami", "karena", "kita", "mereka", "tidak",
    "saya", "untuk", "pada", "sudah", "belum", "bagaimana", "mengapa",
    "apakah", "siapa", "dimana", "kapan", "jadi", "hal", "cara", "punya",
    "sangat", "lebih", "ada", "apa", "bila", "hanya", "jika", "maka", "oleh",
    "serta", "antara", "lain", "setiap", "melalui", "seperti", "tersebut",
    "bukan", "harus", "mau", "perlu", "boleh", "jawab", "tanya",
    "nih", "dong", "sih", "kah", "lah", "makanya",
  ]);
  let idCount = 0;
  for (const w of words) {
    if (idWords.has(w.replace(/[^a-z]/g, ""))) idCount++;
  }
  return idCount / words.length >= 0.15 ? "id" : "en";
}

function cleanText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, "")
    .replace(/[#*_~\[\]()]/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

interface ChatMessageProps {
  message: Message;
  messageId?: string;
  onRetry?: () => void;
  onEdit?: (newContent: string) => void;
  onReaction?: (messageId: string, reaction: "like" | "dislike" | null) => void;
}

export default function ChatMessage({ message, messageId, onRetry, onEdit, onReaction }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [voice, setVoice] = useState("hannah");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(message.reaction ?? null);
  const [reactionLoading, setReactionLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textLang = detectLang(cleanText(message.content));
  const voices = textLang === "en" ? EN_VOICES : ID_VOICES;

  // Copy message
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = message.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.content]);

  // Edit message
  const handleSaveEdit = useCallback(() => {
    if (editValue.trim() && onEdit) {
      onEdit(editValue.trim());
    }
    setEditing(false);
  }, [editValue, onEdit]);

  const handleTTS = useCallback(async () => {
    if (speaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
      return;
    }

    const cleaned = cleanText(message.content);
    if (!cleaned) return;

    setLoadingAudio(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned, voice }),
      });

      if (!res.ok) {
        console.error("[TTS] API error:", res.status);
        setLoadingAudio(false);
        return;
      }

      const buf = await res.arrayBuffer();
      console.log("[TTS] Audio received:", buf.byteLength, "bytes");

      const blob = new Blob([buf], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadeddata = () => console.log("[TTS] Audio loaded, duration:", audio.duration);
      audio.onplay = () => { setSpeaking(true); setLoadingAudio(false); console.log("[TTS] Playing"); };
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; console.log("[TTS] Ended"); };
      audio.onerror = (e) => { setSpeaking(false); setLoadingAudio(false); URL.revokeObjectURL(url); audioRef.current = null; console.error("[TTS] Audio error:", e); };

      const playPromise = audio.play();
      if (playPromise) {
        await playPromise;
      }
    } catch (err) {
      console.error("[TTS] Error:", err);
      setLoadingAudio(false);
    }
  }, [speaking, message.content, voice]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group/msg`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-surface text-foreground border border-border-theme"}`}>
        {message.image_url && (
          <div className="mb-2">
            <img src={message.image_url} alt="Uploaded image" className="rounded-lg max-w-full max-h-64 object-cover" />
          </div>
        )}
        {message.generated_image_url && (
          <div className="mb-2">
            <img src={message.generated_image_url} alt="Generated image" className="rounded-lg max-w-full max-h-96 object-contain" />
            <button onClick={() => downloadImage(message.generated_image_url!, `nyari-ide-${Date.now()}.jpg`)} className="mt-2 text-xs text-muted hover:text-foreground transition-colors">
              {t("downloadImage")}
            </button>
          </div>
        )}
        {isUser ? (
          editing ? (
            <div>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveEdit} className="text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors">
                  ✓ Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors">
                  ✕ Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )
        ) : message.isError ? (
          <div>
            <p className="whitespace-pre-wrap text-red-400">{message.content}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded px-2 py-1 transition-colors"
              >
                🔄 {t("retryMessage")}
              </button>
            )}
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children, className }) => {
                  return !className ? <code className="bg-accent-bg px-1.5 py-0.5 rounded text-sm">{children}</code> : <code className={className}>{children}</code>;
                },
                pre: ({ children }) => <pre className="bg-code-bg rounded-lg p-3 overflow-x-auto mb-2 last:mb-0">{children}</pre>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Action buttons for assistant messages */}
        {!isUser && message.content && !message.isError && !message.generated_image_url && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* Reaction buttons */}
            {messageId && onReaction && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => {
                    const newReaction = reaction === "like" ? null : "like";
                    setReaction(newReaction);
                    onReaction(messageId, newReaction);
                  }}
                  disabled={reactionLoading}
                  className={`text-sm transition-colors ${reaction === "like" ? "text-green-500" : "text-muted hover:text-green-500"}`}
                  title="Like"
                >
                  👍
                </button>
                <button
                  onClick={() => {
                    const newReaction = reaction === "dislike" ? null : "dislike";
                    setReaction(newReaction);
                    onReaction(messageId, newReaction);
                  }}
                  disabled={reactionLoading}
                  className={`text-sm transition-colors ${reaction === "dislike" ? "text-red-500" : "text-muted hover:text-red-500"}`}
                  title="Dislike"
                >
                  👎
                </button>
              </div>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="text-xs text-muted hover:text-muted-light transition-colors"
              title={t("copyMessage")}
            >
              {copied ? `✓ ${t("copied")}` : "📋"}
            </button>

            {/* Regenerate button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-muted hover:text-muted-light transition-colors"
                title={t("regenerate")}
              >
                🔄
              </button>
            )}

            {/* TTS voice selector + play */}
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="bg-input-bg border border-border-theme rounded px-1.5 py-0.5 text-xs text-muted-light"
            >
              {voices.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <button
              onClick={handleTTS}
              disabled={loadingAudio}
              className={`text-xs transition-colors ${loadingAudio ? "text-muted animate-pulse" : speaking ? "text-red-400" : "text-muted hover:text-muted-light"}`}
            >
              {loadingAudio ? "🔊..." : speaking ? `⏹ ${t("stop")}` : `🔊 ${t("listen")}`}
            </button>
          </div>
        )}

        {/* Edit button for user messages */}
        {isUser && !editing && onEdit && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-white/50 hover:text-white/80 transition-colors opacity-0 group-hover/msg:opacity-100"
              title={t("editMessage")}
            >
              ✏️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
