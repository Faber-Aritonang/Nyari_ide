# ROADMAP — Nyari_ide

## FASE 0 — Fondasi ✅
- [x] Desain & brainstorming
- [x] Dokumentasi awal (README, PROJECT_CONTEXT, ROADMAP, docs/)
- [x] Init Next.js project
- [x] Struktur folder final
- [x] Setup Supabase (project baru, schema.sql dijalankan)
- [x] .env.local + Vercel env vars
- [x] Deploy kosong ke Vercel ✅ MILESTONE 1

## FASE 1 — Autentikasi
- [x] Integrasi Supabase Auth (email+password)
- [x] Halaman register (cek whitelist `allowed_emails`)
- [x] Halaman login
- [x] Middleware proteksi route /chat + /dashboard
- [x] Logout
✅ MILESTONE 2: hanya user whitelisted bisa masuk

## FASE 2 — Chat Text
- [x] API route proxy Groq (`api/chat/route.ts`) + verifikasi auth
- [x] UI chat dengan streaming response
- [x] Simpan percakapan & pesan ke Supabase
- [x] Sidebar daftar riwayat percakapan (per user)
- [x] Buat/hapus percakapan
## FASE 2 — Chat Text ✅
Tujuan: Pengguna yang sudah login bisa mengobrol dengan LLM (Llama 3.3 70B via Groq)
dengan respons streaming, dan riwayat percakapan tersimpan di Supabase.
### Milestone 2.1 — Database riwayat chat
- [x] Tabel `conversations` + `messages` sudah ada dari FASE 0 (schema.sql)
- [x] RLS aktif: user hanya bisa baca/tulis data miliknya sendiri
### Milestone 2.2 — API route Groq (server-side)
- [x] Fetch biasa ke Groq OpenAI-compatible endpoint (streaming relay)
- [x] API route POST /api/chat: verifikasi auth, ambil riwayat, call Groq, stream, simpan
- [x] GROQ_API_KEY hanya dibaca di API route (server), tidak pernah di client
### Milestone 2.3 — UI Chat
- [x] Halaman /chat: sidebar daftar percakapan + area chat utama
- [x] Komponen ChatMessage (bubble user vs assistant, render markdown)
- [x] Input box + tombol kirim (Enter = kirim, Shift+Enter = baris baru)
- [x] Rendering streaming: tampilkan token secara bertahap (ReadableStream reader)
- [x] Auto-scroll ke bawah saat respons mengalir
- [x] Buat percakapan baru / pilih percakapan lama dari sidebar
- [x] Judul percakapan otomatis dari pesan pertama (dipotong ~50 karakter)
- [x] Hapus percakapan (dengan konfirmasi)
### Milestone 2.4 — System prompt & pengaturan model
- [x] System prompt default di lib/groq.ts (identitas: "Nyari_ide", bilingual)
- [x] Model & parameter terpusat di lib/groq.ts (llama-3.3-70b-versatile, temperature, max_tokens)
- [x] Error handling: Groq rate limit (429) → pesan ramah di UI
### Definition of Done (FASE 2)
- [x] User bisa chat multi-turn dengan respons streaming
- [x] Riwayat persisten per user (buka dari device lain, chat masih ada)
- [x] Keamanan: RLS aktif (user A tidak bisa baca chat user B)
- [ ] Deploy ke Vercel, tes dari URL produksi
- [x] Update PROJECT_CONTEXT.md


✅ MILESTONE 3: chat text fungsional tersimpan ✅

## FASE 3 — Multimodal
- [ ] Model selector dropdown (70B / 8B)
- [ ] Upload gambar → vision (Llama 4 Scout)
- [ ] Upload file teks → context injection
- [ ] Upload PDF → extract via pdf.js client-side
- [ ] Text-to-speech (Web Speech API, tombol play per pesan AI)
- [ ] Voice input (Whisper via Groq)
✅ MILESTONE 4: multimodal lengkap

## FASE 4 — Polesan
- [ ] Toggle bahasa ID/EN (lib/i18n.ts)
- [ ] Responsive mobile
- [ ] Manajemen whitelist (page admin: tambah/hapus email)
- [ ] Error handling & loading states
- [ ] Testing manual seluruh flow
- [ ] Update dokumentasi final
✅ MILESTONE 5: v1.0 rilis!

## Masa Depan (backlog)
- RAG: pgvector + embedding HF untuk Q&A dokumen spesifik
- Regenerasi jawaban, edit pesan
- Tema gelap/terang
