"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { downloadImage } from "@/lib/image-gen";
import { t, getLang } from "@/lib/i18n";

export interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
  generated_image_url?: string | null;
}

/**
 * Deteksi apakah teks mayoritas English atau Indonesia.
 * Sederhana: hitung karakter Latin vs kata Indonesia umum.
 */
function isEnglishText(text: string): boolean {
  const lower = text.toLowerCase();
  // Kata Indonesia umum
  const idWords = [
    "adalah", "akan", "atau", "bahwa", "bisa", "dengan", "dari", "dalam",
    "ini", "itu", "juga", "kami", "karena", "kita", "mereka", "tidak",
    "saya", "untuk", "pada", "sudah", "belum", "bagaimana", "mengapa",
    "apakah", "siapa", "dimana", "kapan", "jadi", "hal", "cara", "makanya",
    "nih", "dong", "sih", "kah", "lah", "punya", "sangat", "lebih",
  ];
  const words = lower.split(/\s+/);
  let idCount = 0;
  for (const w of words) {
    if (idWords.includes(w)) idCount++;
  }
  // Jika >= 20% kata adalah kata Indonesia → Indonesia
  return idCount / words.length < 0.2;
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Bersihkan markdown untuk TTS
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

  // Stop TTS (baik Orpheus maupun Web Speech)
  function stopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthRef.current) {
      window.speechSynthesis.cancel();
      synthRef.current = null;
    }
    setSpeaking(false);
  }

  // TTS dengan Orpheus
  // English → Orpheus English (hannah)
  // Indonesia → Orpheus Arabic Saudi (noura) — lebih cocok untuk ID
  async function speakWithOrpheus(text: string, isEn: boolean) {
    try {
      setLoadingAudio(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: isEn ? "hannah" : "noura" }),
      });

      if (!res.ok) {
        // Fallback ke Web Speech API
        speakWithWebSpeech(text);
        return;
      }

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
      // Fallback ke Web Speech API
      speakWithWebSpeech(text);
    }
  }

  // TTS dengan Web Speech API (Indonesia)
  function speakWithWebSpeech(text: string) {
    if (!("speechSynthesis" in window)) {
      setLoadingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onstart = () => {
      setSpeaking(true);
      setLoadingAudio(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      synthRef.current = null;
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setLoadingAudio(false);
      synthRef.current = null;
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Main TTS handler
  async function handleTTS() {
    if (speaking) {
      stopTTS();
      return;
    }

    const cleanText = cleanTextForTTS(message.content);
    if (!cleanText) return;

    setLoadingAudio(true);

    // Deteksi bahasa: English → Orpheus, Indonesia → Web Speech API
    const lang = getLang();
    const isEn = isEnglishText(cleanText);

    // Semua bahasa pakai Orpheus (Arabic Saudi untuk ID, English untuk EN)
    await speakWithOrpheus(cleanText, isEn);
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
        {/* TTS button */}
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
