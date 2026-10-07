// app/shared/[token]/page.tsx — Halaman untuk melihat percakapan yang dibagikan
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { AuroraBackground } from "@/app/components/Effects3D";
import { getLang, setLang, type Lang } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant" | "system";
  content: string | null;
  image_url?: string | null;
  created_at: string;
}

interface SharedData {
  title: string;
  created_at: string;
  messages: Message[];
}

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>(() => getLang());

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [token]);

  const toggleLang = () => {
    const newLang = lang === "id" ? "en" : "id";
    setLang(newLang);
    setLangState(newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-fade-in">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <div className="text-center relative z-10 glass-panel rounded-2xl p-8 animate-fade-up">
          <h1 className="text-2xl font-bold neon-text mb-2">
            {lang === "id" ? "Tidak Dapat Diakses" : "Not Available"}
          </h1>
          <p className="text-muted">{error}</p>
          <Link
            href="/"
            className="btn-neon mt-4 inline-block px-5 py-2 rounded-xl text-sm font-semibold"
          >
            {lang === "id" ? "Kembali ke Beranda" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />

      {/* Header */}
      <header className="glass-strong sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold neon-text">
              {data?.title || "Shared Conversation"}
            </h1>
            <p className="text-xs text-muted">
              {data?.created_at
                ? new Date(data.created_at).toLocaleDateString(
                    lang === "id" ? "id-ID" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : ""}
            </p>
          </div>
          <button
            onClick={toggleLang}
            className="btn-glass text-sm px-3 py-1.5 rounded-lg"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {data?.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bubble-user text-white shadow-[0_4px_20px_var(--neon-glow)]"
                    : "glass-panel"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content || ""}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="Uploaded image"
                    className="mt-2 max-w-full rounded"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted relative z-10">
          <p>
            {lang === "id"
              ? "Dibagikan dari Nyari_ide"
              : "Shared from Nyari_ide"}
          </p>
          <Link
            href="/"
            className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-1)] to-[var(--neon-3)] font-medium hover:opacity-80"
          >
            {lang === "id" ? "Coba Nyari_ide" : "Try Nyari_ide"}
          </Link>
        </div>
      </main>
    </div>
  );
}
