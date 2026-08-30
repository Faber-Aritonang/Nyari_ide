"use client";

import { useState, useEffect } from "react";

interface UsageStats {
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalImages: number;
  totalDocuments: number;
  accountAge: number;
}

interface UsageDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "id" | "en";
}

export default function UsageDashboard({ isOpen, onClose, lang }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [messagesByDay, setMessagesByDay] = useState<Record<string, number>>({});
  const [topConversations, setTopConversations] = useState<
    Array<{ id: string; title: string; messageCount: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUsage();
    }
  }, [isOpen]);

  async function fetchUsage() {
    setLoading(true);
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setMessagesByDay(data.messagesByDay);
        setTopConversations(data.topConversations);
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  const maxMessages = Math.max(...Object.values(messagesByDay), 1);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-background rounded-xl z-50 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-semibold">
              {lang === "id" ? "Dashboard Penggunaan" : "Usage Dashboard"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon="💬"
                  label={lang === "id" ? "Total Pesan" : "Total Messages"}
                  value={stats.totalMessages}
                />
                <StatCard
                  icon="🖼️"
                  label={lang === "id" ? "Gambar Di-generate" : "Images Generated"}
                  value={stats.totalImages}
                />
                <StatCard
                  icon="📁"
                  label={lang === "id" ? "Dokumen" : "Documents"}
                  value={stats.totalDocuments}
                />
                <StatCard
                  icon="🗂️"
                  label={lang === "id" ? "Percakapan" : "Conversations"}
                  value={stats.totalConversations}
                />
              </div>

              {/* Activity Chart */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">
                  {lang === "id" ? "Aktivitas 7 Hari Terakhir" : "Activity (Last 7 Days)"}
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {Object.entries(messagesByDay).map(([day, count]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/80 rounded-t"
                        style={{
                          height: `${(count / maxMessages) * 100}%`,
                          minHeight: count > 0 ? "4px" : "0",
                        }}
                      />
                      <span className="text-xs text-muted">
                        {new Date(day).toLocaleDateString("id-ID", { weekday: "short" })}
                      </span>
                      <span className="text-xs text-muted">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Conversations */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">
                  {lang === "id" ? "Percakapan Teraktif" : "Most Active Conversations"}
                </h3>
                <div className="space-y-2">
                  {topConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm truncate flex-1">{conv.title}</span>
                      <span className="text-xs text-muted ml-2">
                        {conv.messageCount}{" "}
                        {lang === "id" ? "pesan" : "messages"}
                      </span>
                    </div>
                  ))}
                  {topConversations.length === 0 && (
                    <p className="text-sm text-muted text-center py-2">
                      {lang === "id" ? "Belum ada percakapan" : "No conversations yet"}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="text-center text-xs text-muted">
                {lang === "id"
                  ? `Akun aktif selama ${stats.accountAge} hari`
                  : `Account active for ${stats.accountAge} days`}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted">
              {lang === "id" ? "Gagal memuat data" : "Failed to load data"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
