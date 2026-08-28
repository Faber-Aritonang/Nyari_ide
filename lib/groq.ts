// lib/groq.ts — Konfigurasi model terpusat untuk Nyari_ide
// Semua model & parameter Groq dikelola di sini agar mudah diganti nanti.

// Daftar model untuk selector di UI
// Format: { id, label, description }
// Untuk menambah model: cukup tambah entry di sini + enable di Groq Console
export const AVAILABLE_MODELS = [
  {
    id: "qwen/qwen3.8-27b",
    label: "Qwen 3.8 27B",
    description: "Model utama — bagus untuk chat & coding",
  },
  // --- Uncomment model di bawah setelah di-enable di Groq Console ---
  // {
  //   id: "qwen/qwen3.6-27b",
  //   label: "Qwen 3.6 27B",
  //   description: "Alternatif Qwen",
  // },
  // {
  //   id: "openai/gpt-oss-120b",
  //   label: "GPT-OSS 120B",
  //   description: "Flagship — kualitas terbaik",
  // },
  // {
  //   id: "openai/gpt-oss-20b",
  //   label: "GPT-OSS 20B",
  //   description: "Cepat & ringan",
  // },
  // {
  //   id: "llama-3.3-70b-versatile",
  //   label: "Llama 3.3 70B",
  //   description: "Meta — bagus untuk RAG",
  // },
  // {
  //   id: "llama-3.1-8b-instant",
  //   label: "Llama 3.1 8B",
  //   description: "Cepat & hemat kuota",
  // },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "qwen/qwen3.8-27b";

export const CHAT_CONFIG = {
  temperature: 0.7,
  max_tokens: 4096,
} as const;

export const SYSTEM_PROMPT = `Kamu adalah Nyari_ide, asisten AI yang membantu dalam Bahasa Indonesia maupun English. 
Jawab dengan singkat, jelas, dan membantu. Gunakan markdown jika perlu untuk memperjelas jawaban.`;
