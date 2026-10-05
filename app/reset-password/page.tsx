"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  AuroraBackground,
  ParticleField,
  TiltCard,
} from "@/app/components/Effects3D";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);

    if (resetError) {
      setError(
        resetError.message ||
          "Link reset tidak valid atau sudah kedaluwarsa. Minta link baru."
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <TiltCard maxTilt={6} className="w-full max-w-md animate-fade-up">
      <div className="glass-panel rounded-3xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="scene-3d mb-4">
            <div className="float-3d w-16 h-16 rounded-2xl btn-neon btn-neon-cyan flex items-center justify-center text-3xl shadow-2xl">
              🔐
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight neon-text">
            Password Baru
          </h1>
          <p className="text-sm text-muted mt-2 text-center">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {!token && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-3 py-2 mb-4 animate-scale-in backdrop-blur-sm">
            Token reset tidak ditemukan. Buka link dari email/link reset Anda.
          </div>
        )}

        {done ? (
          <div className="text-sm text-green-400 bg-green-950/40 border border-green-800/60 rounded-xl px-3 py-3 animate-scale-in backdrop-blur-sm">
            Password berhasil diubah. Mengalihkan ke halaman masuk...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-1.5 text-muted-light">
                Password Baru (min. 6 karakter)
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

            <div>
              <label className="block text-sm mb-1.5 text-muted-light">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              disabled={loading || !token}
              className="btn-neon w-full rounded-xl py-3 text-sm font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center text-foreground p-4 relative">
      <AuroraBackground />
      <ParticleField count={20} />

      <Suspense
        fallback={<div className="text-muted animate-fade-in">Memuat...</div>}
      >
        <ResetForm />
      </Suspense>
    </main>
  );
}
