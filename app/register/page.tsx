"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isEmailAllowed } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Validasi whitelist
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        setError("Email ini tidak terdaftar di whitelist. Hubungi admin.");
        setLoading(false);
        return;
      }

      // 2. Daftarkan akun ke Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // 3. Sukses → arahkan ke login
      router.push("/login?registered=true");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md bg-surface border border-border-theme rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Nyari_ide 🧠</h1>
        <p className="text-sm text-muted mb-6">
          Daftar akun — khusus email yang sudah diundang.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-muted-light">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-input-bg border border-border-theme px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-muted-light">
              Password (min. 6 karakter, ada huruf besar & angka)
            </label>
            <input
              type="password"
              required
              minLength={6}
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
          >
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Sudah punya akun?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Masuk
          </a>
        </p>
      </div>
    </main>
  );
}
