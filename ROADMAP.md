# ROADMAP — Nyari_ide

## FASE 0 — Fondasi ⏳
- [x] Desain & brainstorming
- [x] Dokumentasi awal (README, PROJECT_CONTEXT, ROADMAP, docs/)
- [ ] Init Next.js project
- [ ] Struktur folder final
- [ ] Setup Supabase (project baru, schema.sql dijalankan)
- [ ] .env.local + Vercel env vars
- [ ] Deploy kosong ke Vercel ✅ MILESTONE 1

## FASE 1 — Autentikasi
- [ ] Integrasi Supabase Auth (email+password)
- [ ] Halaman register (cek whitelist `allowed_emails`)
- [ ] Halaman login
- [ ] Middleware proteksi route /chat
- [ ] Logout
✅ MILESTONE 2: hanya user whitelisted bisa masuk

## FASE 2 — Chat Text
- [ ] API route proxy Groq (`api/chat/route.ts`) + verifikasi auth
- [ ] UI chat dengan streaming response
- [ ] Simpan percakapan & pesan ke Supabase
- [ ] Sidebar daftar riwayat percakapan (per user)
- [ ] Buat/hapus percakapan
✅ MILESTONE 3: chat text fungsional tersimpan

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
