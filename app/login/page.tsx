"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const justRegistered = searchParams.get("registered") === "true";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/chat");
  }

  return (
    <div className="w-full max-w-md bg-surface border border-border-theme rounded-2xl p-8">      <h1 className="text-2xl font-bold mb-1">🧠 {t("appName")}</h1>
        <p className="text-sm text-muted mb-6">{t("loginTitle")}</p>

      {justRegistered && (
        <div className="text-sm text-green-400 bg-green-950/50 border border-green-900 rounded-lg px-3 py-2 mb-4">
          {t("registerSuccess")}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>              <label className="block text-sm mb-1 text-muted-light">{t("email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-input-bg border border-border-theme px-3 py-2 focus:outline-none focus:border-blue-500"              placeholder="nama@email.com"
          />
        </div>

        <div>              <label className="block text-sm mb-1 text-muted-light">{t("password")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-input-bg border border-border-theme px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2.5 font-medium transition-colors"
        >            {loading ? t("loginLoading") : t("loginButton")}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">          {t("noAccount")}{" "}
        <a href="/register" className="text-blue-400 hover:underline">            {t("register")}
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Suspense fallback={<div className="text-muted">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
