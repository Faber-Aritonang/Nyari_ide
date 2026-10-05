// app/settings/page.tsx — Halaman Pengaturan (Custom Instructions)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";
import { AuroraBackground } from "@/app/components/Effects3D";

export default function SettingsPage() {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLangState] = useState<Lang>("id");
  const router = useRouter();

  // Load custom instructions & check auth
  useEffect(() => {
    const loadData = async () => {
      const { data } = await authClient.getSession();

      if (!data?.session || !data.user) {
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
  }, [router]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-fade-in">{t("loadingHistory")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />

      {/* Header */}
      <header className="glass-strong sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/chat")}
            className="text-muted hover:text-foreground transition-colors"
          >
            ← {t("appName")}
          </button>
          <h1 className="text-lg font-semibold neon-text">{t("settings")}</h1>
          <button
            onClick={toggleLang}
            className="btn-glass text-sm px-3 py-1.5 rounded-lg"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <div className="glass-panel rounded-2xl p-6 animate-fade-up">
          <h2 className="text-xl font-bold mb-2">
            {t("customInstructions")}
          </h2>
          <p className="text-muted text-sm mb-4">
            {t("customInstructionsDesc")}
          </p>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t("customInstructionsPlaceholder")}
            maxLength={2000}
            rows={8}
            className="input-neon w-full p-3 rounded-xl resize-none text-sm placeholder:text-muted"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-lighter">
              {instructions.length}/2000 {t("maxChars")}
            </span>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all
                ${
                  saved
                    ? "bg-green-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                    : "btn-neon"
                }
                ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saved ? t("saved") : saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>

        {/* Preview */}
        {instructions && (
          <div className="mt-6 glass rounded-2xl p-4 animate-fade-up">
            <h3 className="text-sm font-medium text-muted-light mb-2">
              Preview (System Prompt)
            </h3>
            <div className="text-xs text-muted bg-background/60 p-3 rounded-xl border border-border-theme whitespace-pre-wrap">
              Kamu adalah Nyari_ide, asisten AI yang membantu dalam Bahasa Indonesia maupun English.
              {"\n\n"}
              <strong className="neon-text">instruksi kustom:</strong>
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
