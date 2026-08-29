// app/shared/[token]/page.tsx — Halaman untuk melihat percakapan yang dibagikan
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    setLangState(getLang());

    const fetchShared = async () => {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {lang === "id" ? "Tidak Dapat Diakses" : "Not Available"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {lang === "id" ? "Kembali ke Beranda" : "Back to Home"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data?.title || "Shared Conversation"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
            className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
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
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            {lang === "id"
              ? "Dibagikan dari Nyari_ide"
              : "Shared from Nyari_ide"}
          </p>
          <a href="/" className="text-blue-500 hover:underline">
            {lang === "id" ? "Coba Nyari_ide" : "Try Nyari_ide"}
          </a>
        </div>
      </main>
    </div>
  );
}
