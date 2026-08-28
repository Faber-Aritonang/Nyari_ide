# API Notes — Nyari_ide

## Groq API
Base URL: https://api.groq.com/openai/v1
Auth header: Authorization: Bearer $GROQ_API_KEY

### Endpoint yang dipakai
- POST /chat/completions      → chat + vision (streaming: "stream": true)
- POST /audio/transcriptions  → Whisper (voice input) — FASE 4

### Model yang Tersedia (Agustus 2026)
| Model | Tipe | Keterangan |
|---|---|---|
| qwen/qwen3.8-27b | Chat + Vision | Default, bagus untuk chat & coding |
| qwen/qwen3.6-27b | Chat + Vision | Alternatif Qwen |
| openai/gpt-oss-120b | Chat only | Flagship, kualitas terbaik |
| openai/gpt-oss-20b | Chat only | Cepat & ringan |
| whisper-large-v3 | STT | Voice input |

Catatan: Model Llama, Mixtral, Gemma belum tersedia di akun Groq saat ini.
Cek model terbaru: https://console.groq.com/docs/models

### Contoh chat request body
```json
{
  "model": "qwen/qwen3.8-27b",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

### Vision (upload gambar)
```json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "Apa yang ada di gambar ini?"},
    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
  ]
}
```
Catatan:
- Hanya Qwen models yang support vision (GPT-OSS = chat only)
- Gambar harus JPEG (bukan WebP/PNG mentah)
- Gambar transparan perlu fill putih di belakang
- Minimal 10x10px, maks ~512x512px setelah compress
- Max 3 gambar per request (kita hanya kirim 1 — gambar terkini)

### Upload file teks/PDF
File dikirim sebagai context dalam user message:
```json
{
  "role": "user",
  "content": "[Konteks dari file yang diunggah]:\n\n{isi file}\n\n---\n\nPertanyaan: {pertanyaan user}"
}
```
Batasan:
- File teks: max 200KB, max 8000 chars output (~2000 tokens)
- PDF: max 5MB, max 10 halaman, max 8000 chars output
- Format teks: .txt, .js, .ts, .py, .json, .md, .html, .css, .sql, .yaml, .xml, .csv, .log, .env, .config

### Format respons streaming (SSE)
```
data: {"choices":[{"delta":{"content":"token"}}]}
data: {"choices":[{"delta":{"content":"token2"}}]}
data: [DONE]
```
→ Di API route Next.js, kita pipe chunk ini ke client apa adanya (relay).

### Rate limit (free tier Groq)
- TPM (tokens per minute): 8000 untuk qwen/qwen3.8-27b
- Tangani error 429/413 dengan pesan ramah di UI
- Gambar & file lama di-strip dari riwayat → hemat token
- Cek kuota: https://console.groq.com/settings/limits

### Error handling
| HTTP Code | Arti | Penanganan |
|---|---|---|
| 429 | Rate limit (TPM habis) | Pesan: "Kuota AI habis, tunggu beberapa saat" |
| 413 | Request too large | Pesan: "Kurangi panjang pesan atau ukuran gambar" |
| 400 | Invalid request | Tampilkan pesan error dari Groq |
| 404 | Model not found | Cek model di AVAILABLE_MODELS |

## Pollinations.ai (text-to-image)
TANPA API KEY. GET:
https://image.pollinations.ai/prompt/{urlencoded_prompt}?width=1024&height=1024&nologo=true

## Supabase
- Auth: signUp / signInWithPassword
- RLS WAJIB aktif pada conversations & messages
- Tabel: allowed_emails, conversations, messages (dengan kolom image_url)

## Embedding (RAG masa depan)
Groq belum punya embedding model. Solusi: Hugging Face Inference API + pgvector.
