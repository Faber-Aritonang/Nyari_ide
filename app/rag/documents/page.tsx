// app/rag/documents/page.tsx — Halaman Manage Documents untuk RAG
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";
import { AuroraBackground } from "@/app/components/Effects3D";
import { extractPdfText } from "@/lib/file-utils";

interface Document {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [lang, setLangState] = useState<Lang>("id");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLangState(getLang());
      await fetchDocuments();
    };

    loadData();
  }, [router, supabase]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/rag/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (uploading) return;

    // Validasi tipe file
    const allowedTypes = ["text/plain", "text/markdown", "application/pdf"];
    const allowedExtensions = [".txt", ".md", ".pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      alert("Format file tidak didukung. Gunakan TXT, MD, atau PDF.");
      return;
    }

    const isPdf = file.type === "application/pdf" || ext === ".pdf";

    // Validasi ukuran (PDF max 10MB, lainnya max 1MB)
    const maxSize = isPdf ? 30 * 1024 * 1024 : 1024 * 1024;
    if (file.size > maxSize) {
      alert(isPdf ? "Ukuran PDF maksimal 10MB." : "Ukuran file maksimal 1MB.");
      return;
    }

    setUploading(true);
    setUploadProgress("Membaca file...");

    try {
      // Baca file
      let content = "";
      if (isPdf) {
        setUploadProgress("Mengekstrak teks dari PDF (semua halaman)...");
        content = await extractPdfText(file, "all");
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        alert("File kosong atau tidak bisa diekstrak.");
        setUploading(false);
        return;
      }

      setUploadProgress(`Memproses dan meng-index (${content.length} karakter)...`);

      // Upload ke API
      const res = await fetch("/api/rag/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name.replace(/\.[^.]+$/, ""),
          content,
          filename: file.name,
          file_type: ext.replace(".", "") || "txt",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUploadProgress(`Berhasil! ${data.chunks_created} chunks di-index.`);
        await fetchDocuments();
        setTimeout(() => setUploadProgress(""), 2000);
      } else {
        alert(data.error || "Gagal upload document.");
        setUploadProgress("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Gagal upload document.");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Hapus document ini?")) return;

    try {
      const res = await fetch(`/api/rag/documents/${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchDocuments();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleLang = () => {
    const newLang = lang === "id" ? "en" : "id";
    setLang(newLang);
    setLangState(newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-fade-in">{t("loadingHistory")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />

      {/* Header */}
      <header className="glass-strong sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/chat")}
            className="text-muted hover:text-foreground transition-colors"
          >
            ← {t("appName")}
          </button>
          <h1 className="text-lg font-semibold neon-text">
            📚 {lang === "id" ? "Dokumen RAG" : "RAG Documents"}
          </h1>
          <button
            onClick={toggleLang}
            className="btn-glass text-sm px-3 py-1.5 rounded-lg"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 relative z-10">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 animate-fade-up ${
            dragActive
              ? "border-[color:var(--neon-1)] bg-[color:var(--neon-glow)] shadow-[0_0_32px_var(--neon-glow)] scale-[1.01]"
              : "border-border-theme glass-subtle"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          <div className="text-4xl mb-4 float-3d">📄</div>
          <p className="text-foreground mb-2">
            {lang === "id"
              ? "Drag & drop file di sini, atau"
              : "Drag & drop file here, or"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-neon px-5 py-2 rounded-xl text-sm font-semibold tracking-wide disabled:opacity-50"
          >
            {uploading ? uploadProgress : lang === "id" ? "Pilih File" : "Choose File"}
          </button>
          <p className="text-xs text-muted-lighter mt-2">
            {lang === "id"
              ? "Mendukung: TXT, MD, PDF (PDF maks 30MB)"
              : "Supported: TXT, MD, PDF (PDF max 30MB)"}
          </p>
        </div>

        {/* Upload Progress */}
        {uploadProgress && uploading && (
          <div className="mt-4 p-3 rounded-xl text-sm glass-subtle border-[color:var(--neon-1)] text-[color:var(--neon-3)]">
            {uploadProgress}
          </div>
        )}

        {/* Documents List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">
            {lang === "id" ? "Dokumen Tersimpan" : "Saved Documents"} ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p>{lang === "id" ? "Belum ada dokumen." : "No documents yet."}</p>
              <p className="text-sm mt-1">
                {lang === "id"
                  ? "Upload dokumen untuk memulai RAG."
                  : "Upload a document to start RAG."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="glass rounded-xl p-4 hover:shadow-[0_0_20px_var(--neon-glow)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{doc.title}</h3>
                      <p className="text-sm text-muted mt-1">
                        {doc.filename} • {doc.chunk_count} chunks •{" "}
                        {new Date(doc.created_at).toLocaleDateString(
                          lang === "id" ? "id-ID" : "en-US"
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
