# PROJECT CONTEXT — Nyari_ide

> ⭐ FILE KUNCI KONTINUITAS. Update setiap akhir sesi kerja!
> AI assistant cukup dibekali file ini untuk melanjutkan project.

Last updated: 29 Agustus 2026
Current phase: v1.1 SELESAI ✅

## Ringkasan Project
Webpage chat AI multimodal (text, image, voice), LLM opensource via Groq API,
deploy free di internet, akses terbatas via whitelist (maks 10 akun),
autentikasi email+password (Supabase).

## Tech Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Theme: Dark/Light mode toggle (CSS variables + ThemeProvider)
- LLM: Groq API — model selection lihat lib/groq.ts
- TTS: Groq Orpheus (English + Arabic Saudi untuk Indonesia)
- STT: Whisper Large v3 Turbo via Groq
- Text-to-image: Pollinations.ai (GPT Image 2)
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
| whisper-large-v3-turbo | STT | Voice input (cepat) |
| orpheus-v1-english | TTS | Suara natural English |
| orpheus-arabic-saudi | TTS | Suara natural untuk Indonesia |

## Status Pengerjaan
✅ FASE 0 — Fondasi (SELESAI)
✅ FASE 1 — Autentikasi (SELESAI)
✅ FASE 2 — Chat Text (SELESAI)
✅ FASE 3 — Multimodal (SELESAI)
✅ FASE 4 — Polesan (SELESAI)
✅ FASE 5 — v1.1 Update (SELESAI) ← v1.1 RILIS!

### Fitur Lengkap v1.1:
| Fitur | Teknologi | Biaya |
|---|---|---|
| 💬 Chat text streaming | Qwen 3.8 27B via Groq | Gratis |
| 🖼️ Upload gambar → vision | Qwen 3.8 + compress otomatis | Gratis |
| 📄 Upload file teks | Context injection (max 8000 chars) | Gratis |
| 📎 Upload PDF | pdf.js client-side (max 10 halaman) | Gratis |
| 🎨 Text-to-image | GPT Image 2 via Pollinations.ai | Gratis |
| 🎤 Voice input | Whisper Large v3 Turbo (Groq) | Gratis |
| 🔊 Text-to-speech | Orpheus EN + Arabic SA (Groq) | Gratis |
| 🔄 Regenerate | Ulangi jawaban AI dengan prompt sama | Gratis |
| 📋 Copy to Clipboard | Salin jawaban dengan satu klik | - |
| ✏️ Edit Message | Edit pesan, AI respon ulang | Gratis |
| 📄 Export Chat | Export ke Markdown / PDF | - |
| ⌨️ Keyboard Shortcuts | Ctrl+Enter, Ctrl+N, Ctrl+E, Ctrl+D, Escape | - |
| 🌐 Toggle bahasa ID/EN | lib/i18n.ts (persist localStorage) | - |
| 🌓 Dark/Light mode | CSS variables + ThemeProvider (persist) | - |
| 📱 Responsive mobile | Tailwind CSS + hamburger menu | - |
| 👤 Admin whitelist | /admin — tambah/hapus email | Gratis |
| 🔒 Admin restriction | Hanya faber.aritonang@gmail.com | - |
| 🔄 Model selector | Dropdown (4 model tersedia) | Gratis |
| 🗂️ Riwayat chat | Supabase per user, RLS aktif | Gratis |

## Struktur File Penting
```
app/
├── api/
│   ├── chat/route.ts              — Streaming chat ke Groq
│   ├── models/route.ts            — List model tersedia
│   ├── transcribe/route.ts        — Whisper STT
│   ├── tts/route.ts               — Groq Orpheus TTS
│   ├── admin/whitelist/route.ts   — CRUD whitelist
│   └── conversations/
│       ├── route.ts               — List & buat percakapan
│       ├── [id]/route.ts          — Hapus percakapan
│       └── [id]/messages/route.ts — Ambil pesan
├── chat/page.tsx                  — Halaman utama chat
├── admin/page.tsx                 — Admin whitelist page (restricted)
├── components/ChatMessage.tsx     — Bubble pesan + TTS + generated image
├── login/page.tsx                 — Login
├── register/page.tsx              — Register
├── dashboard/page.tsx             — Dashboard placeholder
├── page.tsx                       — Redirect
└── layout.tsx                     — Root layout + ThemeProvider
lib/
├── groq.ts                        — Config model (AVAILABLE_MODELS, CHAT_CONFIG)
├── auth.ts                        — isEmailAllowed()
├── image-utils.ts                 — Kompres gambar (512x512 JPEG)
├── image-gen.ts                   — Text-to-image via Pollinations.ai
├── file-utils.ts                  — Baca file teks + extract PDF
├── voice-utils.ts                 — MediaRecorder wrapper
├── i18n.ts                        — String ID/EN
├── theme-context.tsx              — Dark/Light mode toggle
└── supabase/
    ├── server.ts                  — Server-side Supabase client
    ├── client.ts                  — Browser-side Supabase client
    └── middleware.ts               — Auth + admin restriction
middleware.ts                       — Next.js middleware entry point
```

## Keputusan Desain Penting (ringkas)
- Whitelist manual via tabel `allowed_emails` (maks 10 akun)
- Riwayat chat disimpan di Supabase per user, RLS aktif
- API key TIDAK PERNAH di frontend → semua via API route server-side
- Streaming via ReadableStream dari API route ke client
- Riwayat diambil server-side sebelum call Groq (bukan dari client)
- Judul percakapan = potongan pesan pertama user (maks ~50 char)
- Gambar dikompres otomatis (512x512 JPEG 60%) sebelum dikirim
- Gambar/file LAMA di-strip dari riwayat → hanya konten terkini yang dikirim
- File teks: max 8000 chars (~2000 tokens) — hemat TPM
- PDF: max 10 halaman, max 8000 chars
- Model selector: daftar model di lib/groq.ts, validasi server-side
- TTS: Orpheus English (hannah) untuk English, Orpheus Arabic Saudi (noura) untuk Indonesia
- Text-to-image: Pollinations.ai GPT Image 2 (gratis, tanpa API key)
- Admin: hanya email faber.aritonang@gmail.com yang bisa akses /admin
- Dark/Light mode: CSS variables + ThemeProvider, persist di localStorage
- Regenerate: POST /api/conversations/[id]/regenerate → ulang jawaban terakhir
- Edit message: user edit pesan lama → semua pesan setelahnya dihapus, AI respon baru
- Export: client-side generate Markdown/PDF dari array messages
- Keyboard shortcuts: event listener global di chat page (Ctrl+Enter, Ctrl+N, Ctrl+E, Ctrl+D, Escape)

## Known Issues
- Next.js 16 warning "middleware convention is deprecated, use proxy instead" — aman diabaikan
- Groq free tier TPM limit ketat (8000 TPM untuk qwen) — gambar harus dikompres
- Orpheus TTS rate limit: jangan klik Listen terlalu cepat (tunggu 10-15 detik)
- Export PDF menggunakan html2canvas + jsp di client-side (ukuran bundle agak besar)

## Masa Depan (Backlog)
- RAG: pgvector + embedding Hugging Face untuk Q&A dokumen spesifik
- Share link: bagikan percakapan via URL unik
- Image gallery: galeri gambar yang dihasilkan AI
- Custom instructions: preferensi user untuk AI (sistem prompt kustom)
- Multi-language TTS: tambah suara bahasa lain

## Untuk AI Assistant Baru
Jika chat sebelumnya hilang: baca README.md, ROADMAP.md,
docs/design-decisions.md, lalu lanjutkan dari "Masa Depan (Backlog)" di atas.
