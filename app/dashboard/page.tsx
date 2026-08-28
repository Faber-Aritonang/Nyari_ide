"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Nyari_ide 🧠</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-input-bg hover:bg-surface-hover px-4 py-2 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-surface border border-border-theme p-8">
          <p className="text-muted">
            Selamat datang! Fase 1 (auth) berhasil. Berikutnya: fitur chat AI. 🚀
          </p>
        </div>
      </div>
    </main>
  );
}
