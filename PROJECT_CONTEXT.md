# PROJECT CONTEXT — Nyari_ide

> ⭐ FILE KUNCI KONTINUITAS. Update setiap akhir sesi kerja!
> AI assistant cukup dibekali file ini untuk melanjutkan project.

Last updated: 28 Agustus 2026
Current phase: FASE 2 — SELESAI ✅ / FASE 3 — siap mulai

## Ringkasan Project
Webpage chat AI multimodal (text, image, voice), LLM opensource via Groq API,
deploy free di internet, akses terbatas via whitelist (maks 10 akun),
autentikasi email+password (Supabase).

## Tech Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- LLM: Groq API — model selection lihat lib/groq.ts
- Image gen: Pollinations.ai (tanpa API key)
- TTS: Web Speech API (browser native)
- Auth & DB & Storage: Supabase (auth, Postgres, RLS)
- Deploy: Vercel (free tier)
- Bahasa UI: bilingual ID/EN via toggle (lib/i18n.ts) — FASE 4
- Markdown rendering: react-markdown

## Status Pengerjaan
✅ FASE 0 — Fondasi (SELESAI)
   ✅ Repo GitHub + dokumentasi lengkap
   ✅ Init Next.js (Next 16, TS, Tailwind, App Router)
   ✅ Setup Supabase (schema + RLS + whitelist + auth)
   ✅ Deploy ke Vercel ✅ MILESTONE 1

✅ FASE 1 — Autentikasi (SELESAI)
   ✅ Integrasi Supabase Auth (email+password)
   ✅ Halaman register (cek whitelist allowed_emails)
   ✅ Halaman login
   ✅ Middleware proteksi route /dashboard + /chat
   ✅ Logout
✅ MILESTONE 2: hanya user whitelisted bisa masuk

✅ FASE 2 — Chat Text (SELESAI)
   ✅ lib/groq.ts — config model terpusat (model, temperature, max_tokens, system prompt)
   ✅ API route POST /api/chat — streaming relay ke Groq + verifikasi auth + simpan pesan
   ✅ API route GET/POST /api/conversations — list & buat percakapan
   ✅ API route DELETE /api/conversations/[id] — hapus percakapan
   ✅ API route GET /api/conversations/[id]/messages — ambil riwayat pesan
   ✅ UI chat: sidebar percakapan + area chat + streaming response
   ✅ ChatMessage component (bubble user/assistant + markdown rendering)
   ✅ Input box (Enter kirim, Shift+Enter baris baru)
   ✅ Auto-scroll ke bawah saat streaming
   ✅ Judul percakapan otomatis dari pesan pertama (maks 50 char)
   ✅ Hapus percakapan (dengan konfirmasi)
   ✅ Error handling: Groq rate limit (429), network error
   ✅ Login page wrapped dengan Suspense (Next.js build compatible)
✅ MILESTONE 3: chat text fungsional tersimpan

⬜ FASE 3 — Multimodal (gambar, teks, PDF, voice) ← BERIKUTNYA
⬜ FASE 4 — Polesan (i18n, responsive, manajemen whitelist)

## Struktur File Penting
```
app/
├── api/
│   ├── chat/route.ts              — Streaming chat ke Groq
│   └── conversations/
│       ├── route.ts               — List & buat percakapan
│       ├── [id]/route.ts          — Hapus percakapan
│       └── [id]/messages/route.ts — Ambil pesan
├── chat/page.tsx                  — Halaman utama chat (sidebar + area chat)
├── components/ChatMessage.tsx     — Komponen bubble pesan
├── login/page.tsx                 — Login (dengan Suspense)
├── register/page.tsx              — Register (dengan whitelist check)
├── dashboard/page.tsx             — Dashboard placeholder
├── page.tsx                       — Redirect ke /chat atau /login
└── layout.tsx                     — Root layout
lib/
├── groq.ts                        — Config model terpusat
├── auth.ts                        — isEmailAllowed()
└── supabase/
    ├── server.ts                  — Server-side Supabase client
    ├── client.ts                  — Browser-side Supabase client
    └── middleware.ts               — Auth middleware (proteksi /chat, /dashboard)
middleware.ts                       — Next.js middleware entry point
```

## Keputusan Desain Penting (ringkas)
- Whitelist manual via tabel `allowed_emails` (maks 10 akun)
- Riwayat chat disimpan di Supabase per user, RLS aktif
- Upload: gambar (~4MB), teks (~50KB), PDF (pdf.js extract client-side) — FASE 3
- API key TIDAK PERNAH di frontend → semua via API route server-side
- Streaming via ReadableStream dari API route ke client
- Riwayat diambil server-side sebelum call Groq (bukan dari client)
- Judul percakapan = potongan pesan pertama user (maks ~50 char)
- Nanti: RAG dengan pgvector (Supabase) + embedding Hugging Face

## Known Issues
- Next.js 16 menampilkan warning "middleware convention is deprecated, use proxy instead" — bisa diabaikan untuk sekarang

## Next Steps (FASE 3)
1. Model selector dropdown (70B / 8B)
2. Upload gambar → vision (Llama 4 Scout) dengan base64
3. Upload file teks → context injection
4. Upload PDF → extract via pdf.js client-side
5. Text-to-speech (Web Speech API, tombol play per pesan AI)
6. Voice input (Whisper via Groq)

## Untuk AI Assistant Baru
Jika chat sebelumnya hilang: baca README.md, ROADMAP.md,
docs/design-decisions.md, lalu lanjutkan dari "Next Steps (FASE 3)" di atas.
