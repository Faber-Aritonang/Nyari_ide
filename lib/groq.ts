// lib/groq.ts — Konfigurasi model terpusat untuk Nyari_ide
// Semua model & parameter Groq dikelola di sini agar mudah diganti nanti.

export const MODELS = {
  main: "qwen/qwen3.8-27b",
  fast: "qwen/qwen3.8-27b",
  vision: "qwen/qwen3.8-27b",
  whisper: "whisper-large-v3",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export const CHAT_CONFIG = {
  model: MODELS.main,
  temperature: 0.7,
  max_tokens: 4096,
} as const;

export const SYSTEM_PROMPT = `Kamu adalah Nyari_ide, asisten AI yang membantu dalam Bahasa Indonesia maupun English. 
Jawab dengan singkat, jelas, dan membantu. Gunakan markdown jika perlu untuk memperjelas jawaban.`;
