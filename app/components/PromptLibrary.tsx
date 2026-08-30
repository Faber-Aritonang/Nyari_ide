"use client";

import { useState, useEffect } from "react";

interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  lang: "id" | "en";
}

const CATEGORIES = [
  { value: "general", label: { id: "Umum", en: "General" } },
  { value: "coding", label: { id: "Coding", en: "Coding" } },
  { value: "writing", label: { id: "Menulis", en: "Writing" } },
  { value: "brainstorm", label: { id: "Ide", en: "Ideas" } },
  { value: "analysis", label: { id: "Analisis", en: "Analysis" } },
];

export default function PromptLibrary({ isOpen, onClose, onSelect, lang }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen]);

  async function fetchPrompts() {
    setLoading(true);
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error("Failed to fetch prompts:", err);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        const newPrompt = await res.json();
        setPrompts((prev) => [newPrompt, ...prev]);
        setTitle("");
        setContent("");
        setCategory("general");
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save prompt:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/prompts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setPrompts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete prompt:", err);
    }
  }

  function handleSelect(prompt: string) {
    onSelect(prompt);
    onClose();
  }

  if (!isOpen) return null;

  const filteredPrompts = filter === "all" ? prompts : prompts.filter((p) => p.category === filter);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-background rounded-xl z-50 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-semibold">
              {lang === "id" ? "Pustaka Prompt" : "Prompt Library"}
            </h2>
            <span className="text-xs text-muted bg-muted px-2 py-0.5 rounded-full">
              {prompts.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              + {lang === "id" ? "Tambah" : "Add"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-muted hover:bg-surface-hover"
            }`}
          >
            {lang === "id" ? "Semua" : "All"}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === cat.value ? "bg-blue-600 text-white" : "bg-muted hover:bg-surface-hover"
              }`}
            >
              {cat.label[lang]}
            </button>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === "id" ? "Judul prompt..." : "Prompt title..."}
                className="flex-1 bg-input-bg border border-border-theme rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-input-bg border border-border-theme rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label[lang]}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={lang === "id" ? "Isi prompt..." : "Prompt content..."}
              rows={3}
              className="w-full bg-input-bg border border-border-theme rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-surface-hover rounded-lg transition-colors"
              >
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {lang === "id" ? "Simpan" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <span className="text-4xl mb-4">📝</span>
              <p>{lang === "id" ? "Belum ada prompt tersimpan" : "No saved prompts yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{prompt.title}</h3>
                        <span className="text-xs text-muted bg-muted px-2 py-0.5 rounded">
                          {CATEGORIES.find((c) => c.value === prompt.category)?.label[lang] || prompt.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{prompt.content}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSelect(prompt.content)}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                        title={lang === "id" ? "Gunakan prompt" : "Use prompt"}
                      >
                        →
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
                        title={lang === "id" ? "Hapus" : "Delete"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
