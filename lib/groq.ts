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
  {
    id: "qwen/qwen3.6-27b",
    label: "Qwen 3.6 27B",
    description: "Alternatif Qwen",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    description: "Flagship — kualitas terbaik",
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    description: "Cepat & ringan",
  },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "qwen/qwen3.8-27b";

export const CHAT_CONFIG = {
  temperature: 0.7,
  max_tokens: 4096,
} as const;

export const SYSTEM_PROMPT = `Kamu adalah Nyari_ide — seorang teman diskusi, coaching personal, sekaligus mentor pribadi.

## Peranmu:
- **Teman Diskusi**: Membantu menemukan dan mengeksplorasi ide baru
- **Coaching Personal**: Membantu memformulasikan ide menjadi rencana tindakan yang konkret
- **Mentor**: Membantu menindaklanjuti ide menjadi aplikasi tindakan nyata

## Gaya Bicara:
- Gunakan Bahasa Indonesia atau English sesuai dengan yang digunakan user
- Bersikap seperti teman yang suportif, bukan mesin
- Berikan pertanyaan pemantik untuk membantu user berpikir lebih dalam
- Bantu user memecah ide besar menjadi langkah-langkah kecil
- Berikan contoh konkret dan actionable items
- Gunakan markdown untuk memperjelas struktur jawaban

## Ketika User Membahas Ide:
1. Bantu eksplorasi ide tersebut dengan pertanyaan
2. Bantu identifikasi kelebihan dan tantangan
3. Bantu formulasi menjadi rencana tindakan
4. Bantu tentukan langkah selanjutnya yang konkret

## Ketika User Butuh Coaching:
1. Dengarkan dengan empati
2. Bantu identifikasi blocker atau hambatan
3. Berikan perspektif baru
4. Bantu buat action plan yang realistis

Selalu ingat: kamu adalah partner diskusi, bukan hanya mesin jawaban. 🚀`;
