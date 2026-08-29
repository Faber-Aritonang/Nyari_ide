// app/rag/documents/page.tsx — Halaman Manage Documents untuk RAG
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, getLang, setLang, type Lang } from "@/lib/i18n";

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

    // Validasi ukuran (max 1MB)
    if (file.size > 1024 * 1024) {
      alert("Ukuran file maksimal 1MB.");
      return;
    }

    setUploading(true);
    setUploadProgress("Membaca file...");

    try {
      // Baca file
      let content = "";
      if (file.type === "application/pdf") {
        setUploadProgress("PDF belum didukung untuk RAG. Gunakan TXT atau MD.");
        setUploading(false);
        return;
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        alert("File kosong.");
        setUploading(false);
        return;
      }

      setUploadProgress("Memproses dan meng-index...");

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
      alert("Gagal upload document.");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">{t("loadingHistory")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/chat")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← {t("appName")}
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            📚 {lang === "id" ? "Dokumen RAG" : "RAG Documents"}
          </h1>
          <button
            onClick={toggleLang}
            className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            {lang === "id"
              ? "Drag & drop file di sini, atau"
              : "Drag & drop file here, or"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? uploadProgress : lang === "id" ? "Pilih File" : "Choose File"}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {lang === "id"
              ? "Mendukung: TXT, MD (maks 1MB)"
              : "Supported: TXT, MD (max 1MB)"}
          </p>
        </div>

        {/* Upload Progress */}
        {uploadProgress && uploading && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
            {uploadProgress}
          </div>
        )}

        {/* Documents List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {lang === "id" ? "Dokumen Tersimpan" : "Saved Documents"} ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {doc.filename} • {doc.chunk_count} chunks •{" "}
                        {new Date(doc.created_at).toLocaleDateString(
                          lang === "id" ? "id-ID" : "en-US"
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
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
