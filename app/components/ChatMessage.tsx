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

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Text-to-Speech using Groq Orpheus (natural voice)
  async function handleTTS() {
    // Jika sedang berbicara, hentikan
    if (speaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
      return;
    }

    // Bersihkan markdown untuk TTS
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, " ") // strip code blocks
      .replace(/`[^`]+`/g, "") // strip inline code
      .replace(/[#*_~\[\]()]/g, "") // strip markdown symbols
      .replace(/\n+/g, ". ") // newlines jadi jeda
      .replace(/\s+/g, " ") // collapse whitespace
      .trim();

    if (!cleanText) return;

    try {
      setLoadingAudio(true);

      // Fetch audio dari Orpheus TTS
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: "hannah" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal generate suara." }));
        alert(err.error || "Gagal generate suara.");
        setLoadingAudio(false);
        return;
      }

      // Convert WAV ke blob dan play
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setSpeaking(true);
        setLoadingAudio(false);
      };
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeaking(false);
        setLoadingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch {
      setSpeaking(false);
      setLoadingAudio(false);
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-100 border border-zinc-700"
        }`}
      >
        {message.image_url && (
          <div className="mb-2">
            <img
              src={message.image_url}
              alt="Uploaded image"
              className="rounded-lg max-w-full max-h-64 object-cover"
            />
          </div>
        )}
        {message.generated_image_url && (
          <div className="mb-2">
            <img
              src={message.generated_image_url}
              alt="Generated image"
              className="rounded-lg max-w-full max-h-96 object-contain"
            />
            <button
              onClick={() =>
                downloadImage(
                  message.generated_image_url!,
                  `nyari-ide-${Date.now()}.jpg`
                )
              }
              className="mt-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
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
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-zinc-900 rounded-lg p-3 overflow-x-auto mb-2 last:mb-0">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {/* TTS button untuk pesan assistant (Orpheus) */}
        {!isUser && message.content && !message.generated_image_url && (
          <button
            onClick={handleTTS}
            disabled={loadingAudio}
            className={`mt-2 text-xs transition-colors ${
              loadingAudio
                ? "text-zinc-500 animate-pulse"
                : speaking
                  ? "text-red-400 hover:text-red-300"
                  : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={speaking ? t("stop") : loadingAudio ? "Loading..." : t("listen")}
          >
            {loadingAudio
              ? "🔊 Loading..."
              : speaking
                ? `⏹ ${t("stop")}`
                : `🔊 ${t("listen")}`}
          </button>
        )}
      </div>
    </div>
  );
}
