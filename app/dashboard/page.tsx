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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Nyari_ide 🧠</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8">
          <p className="text-zinc-400">
            Selamat datang! Fase 1 (auth) berhasil. Berikutnya: fitur chat AI. 🚀
          </p>
        </div>
      </div>
    </main>
  );
}
