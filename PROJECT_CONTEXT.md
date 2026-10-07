# PROJECT CONTEXT — Nyari_ide

> ⭐ FILE KUNCI KONTINUITAS. Update setiap akhir sesi kerja!
> AI assistant cukup dibekali file ini untuk melanjutkan project.

Last updated: 6 Oktober 2026
Current phase: Migrasi Supabase → Neon + Better Auth SELESAI ✅ (data terimpor, alur reset password tersedia)
LLM chat sudah pindah ke Anthropic Claude Haiku 4.5 (Groq masih dipakai untuk TTS & STT).

## Ringkasan Project
Webpage chat AI multimodal (text, image, voice), LLM via Anthropic Claude Haiku,
deploy free di internet, akses terbatas via whitelist (maks 10 akun),
autentikasi email+password (Better Auth).

## Tech Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Theme: Dark/Light mode toggle (CSS variables + ThemeProvider)
- LLM: Anthropic Claude Haiku 4.5 — model selection lihat lib/anthropic.ts
- TTS: Groq Orpheus (English + Arabic Saudi untuk Indonesia)
- STT: Whisper Large v3 Turbo via Groq
- Text-to-image: Cloudflare Workers AI (FLUX) dengan fallback Pollinations.ai
- PDF extraction: pdfjs-dist (client-side)
- Auth & DB: Better Auth (email+password) + Neon Postgres (pgvector untuk RAG)
- Deploy: Vercel (free tier)
- Markdown rendering: react-markdown

## Model yang Tersedia

### LLM chat (Anthropic) — `lib/anthropic.ts`
| Model | Tipe | Keterangan |
|---|---|---|
| claude-haiku-4-5-20251001 | Chat + Vision | Default — cepat & hemat token |

### TTS & STT (Groq) — dipakai internal di API route
| Model | Tipe | Keterangan |
|---|---|---|
| whisper-large-v3-turbo | STT | Voice input (cepat) |
| canopylabs/orpheus-v1-english | TTS | Suara natural English |
| canopylabs/orpheus-arabic-saudi | TTS | Suara natural untuk Indonesia |

## Status Pengerjaan
✅ FASE 0 — Fondasi (SELESAI)
✅ FASE 1 — Autentikasi (SELESAI)
✅ FASE 2 — Chat Text (SELESAI)
✅ FASE 3 — Multimodal (SELESAI)
✅ FASE 4 — Polesan (SELESAI)
✅ FASE 5 — v1.1 Update (SELESAI)
✅ FASE 6 — v2.0 Update (SELESAI)
✅ FASE 7 — v2.1 Update (SELESAI) ← v2.1 RILIS!

### Fitur Lengkap v2.1:
| Fitur | Teknologi | Biaya |
|---|---|---|
| 💬 Chat text streaming | Claude Haiku 4.5 via Anthropic | Berbayar (pay-as-you-go) |
| 🖼️ Upload gambar → vision | Claude Haiku 4.5 + compress otomatis | Berbayar (pay-as-you-go) |
| 📄 Upload file teks | Context injection (max 8000 chars) | Gratis |
| 📎 Upload PDF | pdf.js client-side (max 10 halaman) | Gratis |
| 🎨 Text-to-image | GPT Image 2 via Pollinations.ai | Gratis |
| 🎤 Voice input | Whisper Large v3 Turbo (Groq) | Gratis |
| 🔊 Text-to-speech | Orpheus EN + Arabic SA (Groq) | Gratis |
| 🔄 Regenerate | Ulangi jawaban AI dengan prompt sama | Gratis |
| 📋 Copy to Clipboard | Salin jawaban dengan satu klik | - |
| ✏️ Edit Message | Edit pesan, AI respon ulang | Gratis |
| 📄 Export Chat | Export ke Markdown / PDF | - |
| 🎨 Export ke Canva | PDF percakapan + panduan import manual ke Canva | Gratis |
| ⌨️ Keyboard Shortcuts | Ctrl+Enter, Ctrl+N, Ctrl+E, Ctrl+D, Escape | - |
| ⚙️ Custom Instructions | Atur bagaimana AI merespons (per user) | Gratis |
| 🔗 Share Link | Bagikan percakapan via URL unik | Gratis |
| 🧠 RAG Hybrid | AI ingat dokumen & percakapan sebelumnya | Gratis |
| 📚 Document Upload | Upload TXT/MD sebagai knowledge base | Gratis |
| 🔍 Vector Search | Cosine similarity search (pgvector) | Gratis |
| 🌐 Toggle bahasa ID/EN | lib/i18n.ts (persist localStorage) | - |
| 🌓 Dark/Light mode | CSS variables + ThemeProvider (persist) | - |
| 📱 Responsive mobile | Tailwind CSS + hamburger menu | - |
| 👤 Admin whitelist | /admin — tambah/hapus email | Gratis |
| 🔒 Admin restriction | Hanya faber.aritonang@gmail.com | - |
| 🔄 Model selector | Dropdown (4 model tersedia) | Gratis |
| 🗂️ Riwayat chat | Neon Postgres per user (filter user_id di API route) | Gratis |

## Struktur File Penting
```
app/
├── api/
│   ├── chat/route.ts              — Streaming chat ke Anthropic
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
├── anthropic.ts                   — Config model (AVAILABLE_MODELS, CHAT_CONFIG)
├── auth.ts                        — Better Auth (bcrypt, whitelist hook, reset password)
├── image-utils.ts                 — Kompres gambar (512x512 JPEG)
├── image-gen.ts                   — Text-to-image via Pollinations.ai
├── file-utils.ts                  — Baca file teks + extract PDF
├── voice-utils.ts                 — MediaRecorder wrapper
├── i18n.ts                        — String ID/EN
├── theme-context.tsx              — Dark/Light mode toggle
├── db.ts                          — Pool Postgres Neon + query()/queryOne()
├── auth-client.ts                 — Better Auth (browser)
├── session.ts                     — getAuthUser() (sesi server)
└── rag/search.ts                  — pgvector search_embeddings() + indexConversation()
middleware.ts                       — Next.js middleware entry point
```

## Keputusan Desain Penting (ringkas)
- Whitelist manual via tabel `allowed_emails` (maks 10 akun)
- Riwayat chat disimpan di Neon per user; tanpa RLS — semua query difilter `user_id` di API route
- API key TIDAK PERNAH di frontend → semua via API route server-side
- Streaming via ReadableStream dari API route ke client
- Riwayat diambil server-side sebelum call Anthropic (bukan dari client)
- Judul percakapan = potongan pesan pertama user (maks ~50 char)
- Gambar dikompres otomatis (512x512 JPEG 60%) sebelum dikirim
- Gambar/file LAMA di-strip dari riwayat → hanya konten terkini yang dikirim
- File teks: max 8000 chars (~2000 tokens) — hemat TPM
- PDF: max 10 halaman, max 8000 chars
- Model selector: daftar model di lib/anthropic.ts, validasi server-side
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
- Anthropic: riwayat pesan dipotong (maks 10 pesan × 500 karakter) dan system prompt dibatasi 2000 karakter untuk menekan biaya token — gambar tetap harus dikompres
- Orpheus TTS rate limit: jangan klik Listen terlalu cepat (tunggu 10-15 detik)
- Export PDF menggunakan html2canvas + jsp di client-side (ukuran bundle agak besar)

## Masa Depan (Backlog)
- RAG: pgvector + embedding Hugging Face untuk Q&A dokumen spesifik
- Image gallery: galeri gambar yang dihasilkan AI
- Multi-language TTS: tambah suara bahasa lain
- Conversation search: cari pesan lama dalam percakapan
- Message reactions: beri reaction 👍/👎 pada jawaban AI
- Usage dashboard: statistik penggunaan token & API calls

## Untuk AI Assistant Baru
Jika chat sebelumnya hilang: baca README.md, ROADMAP.md,
docs/design-decisions.md, lalu lanjutkan dari "Masa Depan (Backlog)" di atas.
