# PROJECT CONTEXT — Nyari_ide

> ⭐ FILE KUNCI KONTINUITAS. Update setiap akhir sesi kerja!
> AI assistant cukup dibekali file ini untuk melanjutkan project.

Last updated: 27 Agustus 2025  (sesuaikan)
Current phase: FASE 0 — SELESAI ✅ / FASE 1 — siap mulai

## Ringkasan Project
Webpage chat AI multimodal (text, image, voice), LLM opensource via Groq API,
deploy free di internet, akses terbatas via whitelist (maks 10 akun),
autentikasi email+password (Supabase).

## Tech Stack
- Frontend: Next.js (App Router)
- LLM: Groq API — model selection lihat docs/api-notes.md
- Image gen: Pollinations.ai (tanpa API key)
- TTS: Web Speech API (browser native)
- Auth & DB & Storage: Supabase (auth, Postgres, RLS)
- Deploy: Vercel (free tier)
- Bahasa UI: bilingual ID/EN via toggle (lib/i18n.ts)

## Status Pengerjaan
✅ FASE 0 — Fondasi (SELESAI)
   ✅ Repo GitHub + dokumentasi lengkap
   ✅ Init Next.js (Next 16, TS, Tailwind, App Router)
   ✅ Setup Supabase (schema + RLS + whitelist + auth)
   ✅ Deploy ke Vercel: https://nyari-ide.vercel.app ✅ MILESTONE 1
⬜ FASE 1 — Autentikasi ← BERIKUTNYA
⬜ FASE 1 — Autentikasi
⬜ FASE 2 — Chat Text
⬜ FASE 3 — Multimodal (gambar, teks, PDF, voice)
⬜ FASE 4 — Polesan (i18n, responsive, manajemen whitelist)

## Keputusan Desain Penting (ringkas)
- Whitelist manual via tabel `allowed_emails` (maks 10 akun)
- Riwayat chat disimpan di Supabase per user, RLS aktif
- Upload: gambar (~4MB), teks (~50KB), PDF (pdf.js extract client-side)
- API key TIDAK PERNAH di frontend → semua via API route server-side
- PDF diekstrak langsung di FASE 3 (bukan ditunda)
- Nanti: RAG dengan pgvector (Supabase) + embedding Hugging Face

## Known Issues
(none yet)

## Next Steps
1. Init Next.js: npx create-next-app@latest .
2. Buat project Supabase → jalankan supabase/schema.sql
3. Set env vars di .env.local dan Vercel
4. Deploy kosong ke Vercel

## Untuk AI Assistant Baru
Jika chat sebelumnya hilang: baca README.md, ROADMAP.md,
docs/design-decisions.md, lalu lanjutkan dari "Next Steps" di atas.
