# API Notes — Nyari_ide

## Anthropic API (LLM chat + vision)
Base URL: https://api.anthropic.com/v1/messages
Auth header: `x-api-key: $ANTHROPIC_API_KEY` + `anthropic-version: 2023-06-01`

### Endpoint yang dipakai
- POST /v1/messages → chat + vision, respons streaming (`"stream": true`)

### Model yang Tersedia
| Model | Tipe | Keterangan |
|---|---|---|
| claude-haiku-4-5-20251001 | Chat + Vision | Default — cepat & hemat token |

Daftar model untuk UI + validasi server ada di `lib/anthropic.ts`
(`AVAILABLE_MODELS`, `DEFAULT_MODEL`, `CHAT_CONFIG`). Untuk menambah model: tambah
satu entry di sana — `app/api/chat/route.ts` memvalidasi id model terhadap daftar
tersebut dan jatuh ke `DEFAULT_MODEL` bila tidak dikenal.

### Contoh request body
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system": "...",
  "messages": [
    { "role": "user", "content": "..." }
  ],
  "stream": true
}
```
Catatan: `system` berada di **level atas request**, bukan sebagai pesan di dalam
array `messages` (berbeda dari format OpenAI/Groq yang memakai `role: "system"`).

### Vision (upload gambar)
```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Apa yang ada di gambar ini?" },
    {
      "type": "image",
      "source": { "type": "base64", "media_type": "image/jpeg", "data": "..." }
    }
  ]
}
```
Catatan:
- Gambar harus JPEG (bukan WebP/PNG mentah)
- Gambar transparan perlu fill putih di belakang
- Minimal 10x10px, maks ~512x512px setelah compress
- Hanya gambar terkini yang dikirim — gambar lama di-strip dari riwayat

### Upload file teks/PDF
File dikirim sebagai konteks dalam user message:
```json
{
  "role": "user",
  "content": "[Konteks dari file yang diunggah]:\n\n{isi file}\n\n---\n\nPertanyaan: {pertanyaan user}"
}
```
Batasan:
- File teks: max 200KB, max 8000 chars output (~2000 tokens)
- PDF: max 30MB, max 10 halaman, max 8000 chars output
- Format teks: .txt, .js, .ts, .py, .json, .md, .html, .css, .sql, .yaml, .xml, .csv, .log, .env, .config

### Format respons streaming (SSE)
Anthropic mengirim event per blok:
```
event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"token"}}

event: message_stop
data: {"type":"message_stop"}
```
→ `app/api/chat/route.ts` menerjemahkannya menjadi format sederhana untuk client:
```
data: {"content":"token"}
data: [DONE]
```
Setelah `message_stop`, jawaban assistant disimpan ke tabel `messages` dan
percakapan di-index ulang untuk RAG.

### Batas & error handling
API ini **berbayar (pay-as-you-go)**, bukan free tier. Untuk menekan biaya:
- Riwayat dipotong: maks 10 pesan terakhir, 500 karakter per pesan
- System prompt dibatasi 2000 karakter
- Gambar dikompres otomatis di client sebelum dikirim

| HTTP Code | Arti | Penanganan di UI |
|---|---|---|
| 401/403 | API key tidak valid/tidak aktif | "Kunci API Anthropic tidak valid atau tidak aktif." |
| 429 | Rate limit / kuota habis | "⚡ Kuota Anthropic terlampaui..." |
| 413 | Pesan terlalu panjang | "📏 Pesan terlalu panjang..." |
| 529 | Overload | Coba lagi nanti |
| 5xx | Server Anthropic bermasalah | Pesan error dari Anthropic + "Silakan coba lagi." |

---

## Groq API (TTS + voice input)
Base URL: https://api.groq.com/openai/v1
Auth header: `Authorization: Bearer $GROQ_API_KEY`

Groq **tidak lagi dipakai untuk chat** — hanya untuk fitur suara.

### Endpoint yang dipakai
- POST /audio/transcriptions  → Whisper STT (voice input)
- POST /audio/speech          → Orpheus TTS (text-to-speech)

### Orpheus TTS (text-to-speech)
```json
POST /audio/speech
{
  "model": "canopylabs/orpheus-v1-english",
  "input": "Hello world",
  "voice": "hannah",
  "response_format": "wav"
}
```
Model & voice:
- `canopylabs/orpheus-v1-english` — voice: hannah, diana, autumn, austin, daniel, troy
- `canopylabs/orpheus-arabic-saudi` — voice: noura, lulwa, aisha, fahad, sultan, abdullah

Deteksi bahasa otomatis di ChatMessage.tsx:
- Teks English → Orpheus English (hannah)
- Teks Indonesia → Orpheus Arabic Saudi (noura) — fonemi mirip Indonesia

Batasan: input dipotong maks 2000 karakter. Rate limit: 429 jika terlalu sering —
tunggu 10-15 detik antar request.

### Whisper STT (voice input)
```
POST /audio/transcriptions
multipart/form-data: file=<audio>, model=whisper-large-v3-turbo, language=id, response_format=json
```
Batasan: audio maks 25MB. Error 429 → "Kuota voice input habis. Tunggu beberapa saat."

---

## Pollinations.ai (text-to-image, fallback)
TANPA API KEY. Model: **GPT Image 2**
GET: `https://image.pollinations.ai/prompt/{urlencoded_prompt}?width=1024&height=1024&model=gpt-image-2&nologo=true`
Opsi model lain: flux, dreamshaper, ideogram-v4-balanced, wan-image

Strategi hybrid teks-ke-gambar ada di `lib/image-gen-hybrid.ts`:
Cloudflare Workers AI (FLUX, butuh `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`)
didahulukan, lalu Pollinations.ai sebagai fallback tanpa API key.

## Auth & Database (Neon + Better Auth)
- Auth: Better Auth — `authClient.signIn.email()` / `authClient.signUp.email()`
- Password: bcrypt (hash lama Supabase Auth tetap valid bila berhasil diimpor)
- Reset password: `authClient.requestPasswordReset()` → `/reset-password` → `authClient.resetPassword()`.
  `sendResetPassword` di `lib/auth.ts` mengirim via Resend (`RESEND_API_KEY`) atau mencatat link di log server.
  Tanpa `RESEND_API_KEY`, link **tidak** dikirim lewat email — ambil dari log server lalu teruskan ke user.
  Reset pertama sekaligus membuat baris `account` (credential) bila belum ada, sehingga user
  lama hasil migrasi yang password-nya tidak terbawa tetap bisa masuk setelah reset sekali.
- Session: cookie httpOnly, dicek di server via `getAuthUser()` (lib/session.ts)
- Verifikasi route: middleware cek keberadaan cookie, API routes verifikasi sesi penuh
- Tabel: allowed_emails, conversations, messages, custom_instructions, share_links, saved_prompts, documents, document_chunks, embeddings
- Tidak ada RLS — semua akses data lewat API route yang menyaring `user_id`
- RAG: pgvector + fungsi `search_embeddings()` (lihat neon/schema.sql)

## Dark/Light Mode
- ThemeProvider: `lib/theme-context.tsx`
- CSS variables: `app/globals.css` (var(--background), var(--surface), dll)
- Toggle: ☀️/🌙 di sidebar header
- Persist: localStorage key "theme"
- Default: dark mode
- Class toggle: `<html class="dark">` → switch CSS variables

## Embedding (RAG)
`lib/rag/embeddings.ts` memilih otomatis:
- Ada `OPENAI_API_KEY` → `text-embedding-ada-002` (1536 dimensi)
- Tidak ada → embedding hash lokal (1536 dimensi)

Keduanya 1536 dimensi sehingga muat di kolom `vector(1536)`, tetapi **vektornya tidak
sebanding**. Jangan mengganti penyedia embedding di tengah data yang sudah ada —
index ulang dokumen (`/rag/documents`) bila berpindah penyedia.
