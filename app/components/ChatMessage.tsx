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

/**
 * Deteksi apakah teks mayoritas English atau Indonesia.
 * Menggunakan multiple heuristics:
 * 1. Karakter non-ASCII (Indonesia punya banyak: á, é, í, ó, ú, ñ)
 * 2. Kata Indonesia umum
 * 3. Panjang kata rata-rata (Indonesia cenderung lebih pendek)
 * 4. Suffix kata Indonesia (-kan, -an, -nya, -lah, -kah)
 */
function detectLanguage(text: string): "en" | "id" {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return "en";

  // 1. Cek karakter non-ASCII (Indonesia: á, é, í, ó, ú, ñ, etc.)
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > text.length * 0.02) return "id";

  // 2. Kata Indonesia umum (HANYA kata Indonesia, bukan English)
  const idWords = new Set([
    "adalah", "akan", "atau", "bahwa", "bisa", "dengan", "dari", "dalam",
    "ini", "itu", "juga", "kami", "karena", "kita", "mereka", "tidak",
    "saya", "untuk", "pada", "sudah", "belum", "bagaimana", "mengapa",
    "apakah", "siapa", "dimana", "kapan", "jadi", "hal", "cara",
    "punya", "sangat", "lebih", "ada", "apa", "bila", "hanya",
    "jika", "maka", "oleh", "serta", "antara", "lain", "setiap",
    "melalui", "seperti", "tersebut", "sedangkan", "sementara",
    "walaupun", "meskipun", "sehingga", "kemudian", "sekarang",
    "nanti", "besok", "kemarin", "hari", "orang", "rumah", "buku",
    "tulis", "baca", "dengar", "lihat", "pergi", "datang", "makan",
    "minum", "tidur", "bangun", "besar", "kecil", "panjang", "pendek",
    "tinggi", "rendah", "bagus", "jelek", "baru", "lama", "cepat",
    "lambat", "mudah", "sulit", "gampang", "susah", "senang", "sedih",
    "mau", "suka", "tau", "tahu", "kasih", "ambil", "taruh",
    "bikin", "buat", "pake", "pakai", "gimana", "kenapa",
    "emang", "memang", "sekali", "banget", "merupakan", "ialah",
    "yaitu", "yakni", "contohnya", "misalnya", "berikut",
    "selanjutnya", "sebelumnya", "terakhir", "pertama", "kedua",
    "ketiga", "keempat", "satu", "dua", "tiga", "empat", "lima",
    "enam", "tujuh", "delapan", "sembilan", "sepuluh",
    "nih", "dong", "sih", "kah", "lah", "makanya",
    "bukan", "harus", "mau", "perlu", "boleh",
    "jawab", "tanya", "ceritakan", "jelaskan", "jelaskan",
    "gunakan", "coba", "tolong", "bantu", "kirim",
  ]);

  let idCount = 0;
  for (const w of words) {
    // Bersihkan tanda baca
    const clean = w.replace(/[^a-z]/g, "");
    if (idWords.has(clean)) idCount++;
  }

  // 3. Cek suffix Indonesia
  const idSuffixes = ["kan", "an", "nya", "lah", "kah", "pun", " bezpo",
    "kalau", "karena", "sebab", "supaya", "agar", "biar",
    "kalau", "bila", "jika", "seandainya", "apabila"];
  let suffixCount = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, "");
    for (const suf of idSuffixes) {
      if (clean.endsWith(suf) && clean.length > suf.length + 1) {
        suffixCount++;
        break;
      }
    }
  }

  // 4. Hitung skor
  const idWordScore = idCount / words.length;
  const suffixScore = suffixCount / words.length;

  // Jika >= 15% kata Indonesia ATAU ada suffix Indonesia → Indonesia
  if (idWordScore >= 0.15 || suffixScore >= 0.1) return "id";

  // Default: English
  return "en";
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Stop TTS
  function stopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  // TTS dengan Orpheus
  // English → Orpheus English (hannah)
  // Indonesia → Orpheus Arabic Saudi (noura)
  async function speakWithOrpheus(text: string, lang: "en" | "id") {
    try {
      setLoadingAudio(true);
      const voice = lang === "en" ? "hannah" : "noura";

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        setLoadingAudio(false);
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
      setLoadingAudio(false);
    }
  }

  // Main TTS handler
  async function handleTTS() {
    if (speaking) {
      stopTTS();
      return;
    }

    const cleanText = cleanTextForTTS(message.content);
    if (!cleanText) return;

    const lang = detectLanguage(cleanText);
    console.log("[TTS] Detected language:", lang, "| Text:", cleanText.slice(0, 50));
    await speakWithOrpheus(cleanText, lang);
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
