"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isEmailAllowed } from "@/lib/auth";
import {
  AuroraBackground,
  ParticleField,
  TiltCard,
} from "@/app/components/Effects3D";

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
    <main className="min-h-screen flex items-center justify-center text-foreground p-4 relative">
      <AuroraBackground />
      <ParticleField count={20} />

      <TiltCard maxTilt={6} className="w-full max-w-md animate-fade-up">
        <div className="glass-panel rounded-3xl p-8 md:p-10">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="scene-3d mb-4">
              <div className="float-3d w-16 h-16 rounded-2xl btn-neon btn-neon-cyan flex items-center justify-center text-3xl shadow-2xl">
                🧠
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight neon-text">
              Nyari_ide
            </h1>
            <p className="text-sm text-muted mt-2">
              Daftar akun — khusus email yang sudah diundang.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm mb-1.5 text-muted-light">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-neon w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-muted"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-muted-light">
                Password (min. 6 karakter, ada huruf besar & angka)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-neon w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-muted"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-3 py-2 animate-scale-in backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full rounded-xl py-3 text-sm font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mendaftarkan..." : "Daftar"}
            </button>
          </form>

          <p className="text-sm text-muted mt-8 text-center">
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-1)] to-[var(--neon-3)] font-medium hover:opacity-80 transition-opacity"
            >
              Masuk
            </a>
          </p>
        </div>
      </TiltCard>
    </main>
  );
}
