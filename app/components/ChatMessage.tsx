"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { downloadImage } from "@/lib/image-gen";
import { t } from "@/lib/i18n";

export interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
  generated_image_url?: string | null;
}

// Voice options
const EN_VOICES = [
  { id: "hannah", label: "Hannah" },
  { id: "diana", label: "Diana" },
  { id: "autumn", label: "Autumn" },
  { id: "austin", label: "Austin" },
  { id: "daniel", label: "Daniel" },
  { id: "troy", label: "Troy" },
];
const ID_VOICES = [
  { id: "noura", label: "Noura" },
  { id: "lulwa", label: "Lulwa" },
  { id: "aisha", label: "Aisha" },
  { id: "fahad", label: "Fahad" },
  { id: "sultan", label: "Sultan" },
  { id: "abdullah", label: "Abdullah" },
];

function detectLanguage(text: string): "en" | "id" {
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
    const clean = w.replace(/[^a-z]/g, "");
    if (idWords.has(clean)) idCount++;
  }

  return idCount / words.length >= 0.15 ? "id" : "en";
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("hannah");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function cleanTextForTTS(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]+`/g, "")
      .replace(/[#*_~\[\]()]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }

  function stopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  async function speakWithOrpheus(text: string) {
    try {
      setLoadingAudio(true);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!res.ok) {
        setLoadingAudio(false);
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => { setSpeaking(true); setLoadingAudio(false); };
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(audioUrl); audioRef.current = null; };
      audio.onerror = () => { setSpeaking(false); setLoadingAudio(false); URL.revokeObjectURL(audioUrl); audioRef.current = null; };

      await audio.play();
    } catch {
      setLoadingAudio(false);
    }
  }

  async function handleTTS() {
    if (speaking) { stopTTS(); return; }

    const cleanText = cleanTextForTTS(message.content);
    if (!cleanText) return;

    const lang = detectLanguage(cleanText);
    // Update voice berdasarkan deteksi bahasa
    const defaultVoice = lang === "en" ? "hannah" : "noura";
    if (!EN_VOICES.find((v) => v.id === selectedVoice) && !ID_VOICES.find((v) => v.id === selectedVoice)) {
      setSelectedVoice(defaultVoice);
    }

    await speakWithOrpheus(cleanText);
  }

  const lang = detectLanguage(cleanTextForTTS(message.content));
  const voiceOptions = lang === "en" ? EN_VOICES : ID_VOICES;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100 border border-zinc-700"}`}>
        {message.image_url && (
          <div className="mb-2">
            <img src={message.image_url} alt="Uploaded image" className="rounded-lg max-w-full max-h-64 object-cover" />
          </div>
        )}
        {message.generated_image_url && (
          <div className="mb-2">
            <img src={message.generated_image_url} alt="Generated image" className="rounded-lg max-w-full max-h-96 object-contain" />
            <button onClick={() => downloadImage(message.generated_image_url!, `nyari-ide-${Date.now()}.jpg`)} className="mt-2 text-xs text-zinc-400 hover:text-white transition-colors">
              {t("downloadImage")}
            </button>
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-sm">{children}</code> : <code className={className}>{children}</code>;
                },
                pre: ({ children }) => <pre className="bg-zinc-900 rounded-lg p-3 overflow-x-auto mb-2 last:mb-0">{children}</pre>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {/* TTS controls */}
        {!isUser && message.content && !message.generated_image_url && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* Voice selector */}
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-zinc-700 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
              title="Pilih suara"
            >
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            {/* Play/Stop button */}
            <button
              onClick={handleTTS}
              disabled={loadingAudio}
              className={`text-xs transition-colors ${loadingAudio ? "text-zinc-500 animate-pulse" : speaking ? "text-red-400 hover:text-red-300" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {loadingAudio ? "🔊 Loading..." : speaking ? `⏹ ${t("stop")}` : `🔊 ${t("listen")}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
