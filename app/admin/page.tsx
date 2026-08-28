"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WhitelistEntry {
  id: string;
  email: string;
  invited_by: string | null;
  created_at: string;
}

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [emails, setEmails] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserEmail(data.user.email ?? "");
      await fetchEmails();
    }
    init();
  }, [supabase, router]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whitelist");
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAdding(true);

    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, invited_by: userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menambah email");
        setAdding(false);
        return;
      }

      setSuccess(`${newEmail} berhasil ditambahkan!`);
      setNewEmail("");
      await fetchEmails();
    } catch {
      setError("Terjadi kesalahan");
    }
    setAdding(false);
  }

  async function handleDelete(email: string) {
    if (!confirm(`Hapus ${email} dari whitelist?`)) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus email");
        return;
      }

      setSuccess(`${email} berhasil dihapus!`);
      await fetchEmails();
    } catch {
      setError("Terjadi kesalahan");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Admin — Whitelist</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Kelola email yang boleh mendaftar ({emails.length}/10 akun)
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Kembali ke Chat
          </button>
        </div>

        {/* Add email form */}
        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@contoh.com"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={adding || emails.length >= 10}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {adding ? "..." : "+ Tambah"}
          </button>
        </form>

        {/* Status messages */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-400 bg-green-950/50 border border-green-900 rounded-lg px-4 py-2">
            {success}
          </div>
        )}

        {/* Email list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Memuat...</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">Belum ada email di whitelist</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Diundang oleh</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Tanggal</th>
                  <th className="text-right px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {emails.map((entry) => (
                  <tr key={entry.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-sm">
                      {entry.email}
                      {entry.email === userEmail && (
                        <span className="ml-2 text-xs text-blue-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 hidden sm:table-cell">
                      {entry.invited_by || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 hidden sm:table-cell">
                      {new Date(entry.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(entry.email)}
                        className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
                        title="Hapus dari whitelist"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-zinc-600 mt-4 text-center">
          Maks 10 akun. Email yang dihapus tidak bisa login lagi (tapi akun Supabase-nya masih ada).
        </p>
      </div>
    </main>
  );
}
