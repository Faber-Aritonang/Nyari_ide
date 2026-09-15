// lib/anthropic.ts — Konfigurasi model & helper untuk Nyari_ide
// Dioperasikan via Anthropic Messages API (streaming).

// Daftar model untuk selector di UI
// Format: { id, label, description }
// Untuk menambah model: cukup tambah entry di sini + kirim id ke endpoint chat
export const AVAILABLE_MODELS = [
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    description: "Cepat & hemat — model paling irit token",
  },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "claude-haiku-4-5-20251001";

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

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1/messages";

export async function streamAnthropic(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant" | "user"; content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> }>,
  model: string,
  temperature: number,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<ReadableStream> {
  const accepts = new Headers({
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "messages-eldanting-2025-08-13,streaming-2023-11-16",
  });

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt || undefined,
    messages: messages.map((message) => ({
      role: message.role as "user" | "assistant",
      content:
        typeof message.content === "string"
          ? [{ type: "text", text: message.content }]
          : message.content,
    })),
    stream: true,
  });

  const response = await fetch(ANTHROPIC_BASE_URL, {
    method: "POST",
    headers: accepts as unknown as HeadersInit,
    body,
    signal,
  });

  return response.body ?? new ReadableStream();
}

export function mapClaudeError(status: number, errorText: string): string {
  if (status === 401 || status === 403) {
    return "Kunci API Anthropic tidak valid atau tidak aktif. Periksa pengaturan lingkungan.";
  }
  if (status === 429) {
    return "Kuota Anthropic dipenuhi. Coba: (1) tunggu beberapa saat, (2) gunakan model yang lebih ringan, (3) periksa batas penggunaan.";
  }
  if (status === 413) {
    return "Prompt terlalu panjang. Coba: (1) mulai percakapan baru, (2) kurangi panjang pesan atau riwayat.";
  }
  if (status === 529) {
    return "Anthropic sedang overload atau pemeliharaan. Coba lagi nanti.";
  }
  if (status >= 500) {
    return "Server Anthropic bermasalah. Coba lagi sebentar.";
  }

  try {
    const parsed = JSON.parse(errorText);
    const message =
      parsed.error?.message ??
      parsed.quote?.statement ??
      parsed.message ??
      errorText;
    return typeof message === "string" && message.trim().length
      ? message
      : "Gagal menghubungi AI.";
  } catch {
    return errorText.trim().length
      ? errorText
      : "Gagal menghubungi AI.";
  }
}
