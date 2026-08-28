"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { downloadImage } from "@/lib/image-gen";

export interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
  generated_image_url?: string | null;
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);

  // Text-to-Speech using Web Speech API
  function handleTTS() {
    if (!("speechSynthesis" in window)) {
      alert("Browser tidak mendukung text-to-speech.");
      return;
    }

    // Jika sedang berbicara, hentikan
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Bersihkan markdown untuk TTS
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, " kode ") // strip code blocks
      .replace(/`[^`]+`/g, "") // strip inline code
      .replace(/[#*_~\[\]()]/g, "") // strip markdown symbols
      .replace(/\n+/g, ". ") // newlines jadi jeda
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID"; // Default bahasa Indonesia
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Cari voice Bahasa Indonesia jika ada
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
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
              ⬇ Download gambar
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
        {/* TTS button untuk pesan assistant */}
        {!isUser && message.content && !message.generated_image_url && (
          <button
            onClick={handleTTS}
            className={`mt-2 text-xs transition-colors ${
              speaking
                ? "text-red-400 hover:text-red-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={speaking ? "Hentikan suara" : "Dengarkan jawaban"}
          >
            {speaking ? "⏹ Stop" : "🔊 Dengarkan"}
          </button>
        )}
      </div>
    </div>
  );
}
