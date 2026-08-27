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
