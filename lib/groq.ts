// lib/groq.ts — Konfigurasi model terpusat untuk Nyari_ide
// Semua model & parameter Groq dikelola di sini agar mudah diganti nanti.

export const MODELS = {
  main: "llama-3.3-70b-versatile",
  fast: "llama-3.1-8b-instant",
  vision: "llama-4-scout-17b-16e-instruct",
  whisper: "whisper-large-v3",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export const CHAT_CONFIG = {
  model: MODELS.main,
  temperature: 0.7,
  max_tokens: 2048,
} as const;

export const SYSTEM_PROMPT = `Kamu adalah Nyari_ide, asisten AI yang membantu dalam Bahasa Indonesia maupun English. 
Jawab dengan singkat, jelas, dan membantu. Gunakan markdown jika perlu untuk memperjelas jawaban.`;
