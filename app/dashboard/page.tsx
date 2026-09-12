"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuroraBackground,
  ParticleField,
  TiltCard,
  CountUp,
} from "@/app/components/Effects3D";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? "");
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const stats = [
    { icon: "💬", label: "Chat AI", desc: "Streaming multimodal" },
    { icon: "🎨", label: "Image Gen", desc: "Text-to-image gratis" },
    { icon: "🎤", label: "Voice", desc: "STT & TTS built-in" },
    { icon: "🧠", label: "RAG Memory", desc: "AI ingat dokumen" },
  ];

  return (
    <main className="min-h-screen text-foreground relative">
      <AuroraBackground />
      <ParticleField count={18} />

      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight neon-text">
              Nyari_ide
            </h1>
            <p className="text-sm text-muted mt-1">
              Selamat datang kembali 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:inline">{email}</span>
            <button
              onClick={handleLogout}
              className="btn-glass rounded-xl px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hero card */}
        <TiltCard maxTilt={5} className="mb-8 animate-fade-up stagger-1">
          <div className="glass-panel rounded-3xl p-8 md:p-10 depth-3d">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="scene-3d">
                <div className="float-3d w-20 h-20 rounded-2xl btn-neon flex items-center justify-center text-4xl shadow-2xl">
                  🚀
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Autentikasi berhasil — sistem online.
                </h2>
                <p className="text-sm md:text-base text-muted">
                  Semua fitur chat AI sudah aktif. Mulai percakapan pertamamu
                  sekarang.
                </p>
              </div>
              <button
                onClick={() => router.push("/chat")}
                className="btn-neon rounded-xl px-6 py-3 text-sm font-semibold tracking-wide whitespace-nowrap"
              >
                Buka Chat →
              </button>
            </div>
          </div>
        </TiltCard>

        {/* Feature stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <TiltCard
              key={s.label}
              maxTilt={8}
              className={`animate-fade-up stagger-${i + 2}`}
            >
              <div className="glass rounded-2xl p-5 h-full hover:shadow-[0_0_24px_var(--neon-glow)] transition-shadow duration-300">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{s.label}</h3>
                <p className="text-xs text-muted">{s.desc}</p>
                <div className="mt-3 text-xs font-medium">
                  <span className="neon-text">
                    <CountUp value={(i + 1) * 100} suffix="%" />
                  </span>
                  <span className="text-muted-lighter"> siap</span>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </main>
  );
}
