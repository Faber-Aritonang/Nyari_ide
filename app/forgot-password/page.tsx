"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  AuroraBackground,
  ParticleField,
  TiltCard,
} from "@/app/components/Effects3D";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/reset-password",
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Gagal meminta reset password. Coba lagi.");
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center text-foreground p-4 relative">
      <AuroraBackground />
      <ParticleField count={20} />

      <TiltCard maxTilt={6} className="w-full max-w-md animate-fade-up">
        <div className="glass-panel rounded-3xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="scene-3d mb-4">
              <div className="float-3d w-16 h-16 rounded-2xl btn-neon flex items-center justify-center text-3xl shadow-2xl">
                🔑
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight neon-text">
              Lupa Password
            </h1>
            <p className="text-sm text-muted mt-2 text-center">
              Masukkan email Anda, kami akan mengirim link untuk mengatur ulang
              password.
            </p>
          </div>

          {sent ? (
            <div className="text-sm text-green-400 bg-green-950/40 border border-green-800/60 rounded-xl px-3 py-3 mb-2 animate-scale-in backdrop-blur-sm">
              Jika email tersebut terdaftar, link reset sudah dikirim. Periksa
              kotak masuk (atau minta link ke admin bila email belum
              dikonfigurasi).
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>
          )}

          <p className="text-sm text-muted mt-8 text-center">
            <a
              href="/login"
              className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-1)] to-[var(--neon-3)] font-medium hover:opacity-80 transition-opacity"
            >
              Kembali ke halaman masuk
            </a>
          </p>
        </div>
      </TiltCard>
    </main>
  );
}
