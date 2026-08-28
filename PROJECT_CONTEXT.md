# PROJECT CONTEXT — Nyari_ide

> ⭐ FILE KUNCI KONTINUITAS. Update setiap akhir sesi kerja!
> AI assistant cukup dibekali file ini untuk melanjutkan project.

Last updated: 28 Agustus 2026
Current phase: FASE 3 — SELESAI ✅ / FASE 4 — siap mulai

## Ringkasan Project
Webpage chat AI multimodal (text, image, voice), LLM opensource via Groq API,
deploy free di internet, akses terbatas via whitelist (maks 10 akun),
autentikasi email+password (Supabase).

## Tech Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- LLM: Groq API — model selection lihat lib/groq.ts
- PDF extraction: pdfjs-dist (client-side)
- Auth & DB & Storage: Supabase (auth, Postgres, RLS)
- Deploy: Vercel (free tier)
- Markdown rendering: react-markdown

## Model yang Tersedia (Groq)
| Model | Tipe | Keterangan |
|---|---|---|
| qwen/qwen3.8-27b | Chat + Vision | Default, bagus untuk chat & coding |
| qwen/qwen3.6-27b | Chat + Vision | Alternatif Qwen |
| openai/gpt-oss-120b | Chat only | Flagship, kualitas terbaik |
| openai/gpt-oss-20b | Chat only | Cepat & ringan |
| whisper-large-v3 | STT | Voice input (FASE 4) |

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
   ✅ lib/groq.ts — config model terpusat
   ✅ API route POST /api/chat — streaming relay ke Groq + auth + simpan pesan
   ✅ API route GET/POST/DELETE /api/conversations — CRUD percakapan
   ✅ API route GET /api/conversations/[id]/messages — ambil riwayat
   ✅ API route GET /api/models — list model tersedia
   ✅ UI chat: sidebar + area chat + streaming response
   ✅ ChatMessage component (bubble + markdown)
   ✅ Input box (Enter kirim, Shift+Enter baris baru)
   ✅ Auto-scroll, judul otomatis, hapus percakapan
   ✅ Error handling: rate limit, network error
✅ MILESTONE 3: chat text fungsional tersimpan

✅ FASE 3 — Multimodal (SELESAI)
   ✅ Model selector dropdown (4 model tersedia)
   ✅ Upload gambar → vision (compressed otomatis 512x512 JPEG 70%)
   ✅ Upload file teks → context injection (max 8000 chars)
   ✅ Upload PDF → extract teks via pdf.js client-side (max 10 halaman)
   ✅ Gambar/file lama di-strip dari riwayat (hemat token)
   ✅ Keterangan format gambar di UI (tooltip + validasi)
   ✅ Tombol 🖼️ (gambar) + 📎 (file) di input area
✅ MILESTONE 4: multimodal lengkap

⬜ FASE 4 — Polesan ← BERIKUTNYA
   ⬜ Text-to-speech (Web Speech API)
   ⬜ Voice input (Whisper via Groq)
   ⬜ Toggle bahasa ID/EN (lib/i18n.ts)
   ⬜ Responsive mobile
   ⬜ Manajemen whitelist (admin page)
   ⬜ Error handling & loading states

## Struktur File Penting
```
app/
├── api/
│   ├── chat/route.ts              — Streaming chat ke Groq
│   ├── models/route.ts            — List model tersedia
│   └── conversations/
│       ├── route.ts               — List & buat percakapan
│       ├── [id]/route.ts          — Hapus percakapan
│       └── [id]/messages/route.ts — Ambil pesan
├── chat/page.tsx                  — Halaman utama chat
├── components/ChatMessage.tsx     — Komponen bubble pesan
├── login/page.tsx                 — Login
├── register/page.tsx              — Register
├── dashboard/page.tsx             — Dashboard placeholder
├── page.tsx                       — Redirect
└── layout.tsx                     — Root layout
lib/
├── groq.ts                        — Config model (AVAILABLE_MODELS, CHAT_CONFIG)
├── auth.ts                        — isEmailAllowed()
├── image-utils.ts                 — Kompres gambar (512x512 JPEG)
├── file-utils.ts                  — Baca file teks + extract PDF
└── supabase/
    ├── server.ts                  — Server-side Supabase client
    ├── client.ts                  — Browser-side Supabase client
    └── middleware.ts               — Auth middleware
middleware.ts                       — Next.js middleware entry point
```

## Keputusan Desain Penting (ringkas)
- Whitelist manual via tabel `allowed_emails` (maks 10 akun)
- Riwayat chat disimpan di Supabase per user, RLS aktif
- API key TIDAK PERNAH di frontend → semua via API route server-side
- Streaming via ReadableStream dari API route ke client
- Riwayat diambil server-side sebelum call Groq (bukan dari client)
- Judul percakapan = potongan pesan pertama user (maks ~50 char)
- Gambar dikompres otomatis (512x512 JPEG 70%) sebelum dikirim
- Gambar/file LAMA di-strip dari riwayat → hanya konten terkini yang dikirim
- File teks: max 8000 chars (~2000 tokens) — hemat TPM
- PDF: max 10 halaman, max 8000 chars
- Model selector: daftar model di lib/groq.ts, validasi server-side
- Nanti: RAG dengan pgvector (Supabase) + embedding Hugging Face

## Known Issues
- Next.js 16 warning "middleware convention is deprecated, use proxy instead" — aman diabaikan
- Groq free tier TPM limit ketat (8000 TPM untuk qwen) — gambar harus dikompres

## Next Steps (FASE 4)
1. Text-to-speech (Web Speech API, tombol play per pesan AI)
2. Voice input (Whisper Large v3 via Groq)
3. Toggle bahasa ID/EN (lib/i18n.ts)
4. Responsive mobile
5. Manajemen whitelist (admin page: tambah/hapus email)

## Untuk AI Assistant Baru
Jika chat sebelumnya hilang: baca README.md, ROADMAP.md,
docs/design-decisions.md, lalu lanjutkan dari "Next Steps (FASE 4)" di atas.
