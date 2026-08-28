# API Notes — Nyari_ide

## Groq API
Base URL: https://api.groq.com/openai/v1
Auth header: Authorization: Bearer $GROQ_API_KEY

### Endpoint yang dipakai
- POST /chat/completions      → chat + vision (streaming: "stream": true)
- POST /audio/transcriptions  → Whisper (voice input)

### Contoh chat request body
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true
}

### Vision (upload gambar)
{"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}

## Pollinations.ai (text-to-image)
TANPA API KEY. GET:
https://image.pollinations.ai/prompt/{urlencoded_prompt}?width=1024&height=1024&nologo=true

## Supabase
- Auth: signUp / signInWithPassword
- RLS WAJIB aktif pada conversations & messages

## Embedding (RAG masa depan)
Groq belum punya embedding model. Solusi: Hugging Face Inference API + pgvector.

## Groq API — Catatan FASE 2

### Endpoint (OpenAI-compatible)
POST https://api.groq.com/openai/v1/chat/completions
Header: Authorization: Bearer $GROQ_API_KEY, Content-Type: application/json

### Model untuk chat (FASE 2)
- Utama: llama-3.3-70b-versatile (kualitas terbaik, tetap cepat di Groq)
- Alternatif ringan: llama-3.1-8b-instant (untuk fallback / hemat kuota)
Cek model terbaru: https://console.groq.com/docs/models

### Contoh payload streaming
{
  "model": "llama-3.3-70b-versatile",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048,
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}

### Format respons streaming (SSE)
Setiap chunk: data: {"choices":[{"delta":{"content":"token"}}]}
Stream berakhir dengan: data: [DONE]
→ Di API route Next.js, kita pipe chunk ini ke client apa adanya (relay).

### Rate limit (free tier Groq)
- Ada batas TPM/RPD per model — tangani error 429 dengan pesan ramah di UI
- Cek kuota: https://console.groq.com/settings/limits

### Alternatif SDK
Bisa pakai `groq-sdk` (npm) atau fetch biasa. Fetch biasa lebih transparan
untuk streaming relay; SDK lebih nyaman untuk tipe. Keputusan awal: fetch biasa.
