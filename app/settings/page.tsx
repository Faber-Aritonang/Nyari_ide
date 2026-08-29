// app/settings/page.tsx — Halaman Pengaturan (Custom Instructions)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";

export default function SettingsPage() {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLangState] = useState<Lang>("id");
  const router = useRouter();
  const supabase = createClient();

  // Load custom instructions & check auth
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLangState(getLang());

      try {
        const res = await fetch("/api/settings/instructions");
        const data = await res.json();
        setInstructions(data.instructions || "");
      } catch (err) {
        console.error("Failed to load instructions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save instructions:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleLang = () => {
    const newLang = lang === "id" ? "en" : "id";
    setLang(newLang);
    setLangState(newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">{t("loadingHistory")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/chat")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← {t("appName")}
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("settings")}
          </h1>
          <button
            onClick={toggleLang}
            className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t("customInstructions")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {t("customInstructionsDesc")}
          </p>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t("customInstructionsPlaceholder")}
            maxLength={2000}
            rows={8}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {instructions.length}/2000 {t("maxChars")}
            </span>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }
                ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saved ? t("saved") : saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>

        {/* Preview */}
        {instructions && (
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview (System Prompt)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 whitespace-pre-wrap">
              Kamu adalah Nyari_ide, asisten AI yang membantu dalam Bahasa Indonesia maupun English.
              {"\n\n"}
              <strong>instruksi kustom:</strong>
              {"\n"}
              {instructions}
              {"\n\n"}
              Jawab dengan singkat, jelas, dan membantu. Gunakan markdown jika perlu untuk memperjelas jawaban.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
