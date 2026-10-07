# Design Decisions — Nyari_ide

Log semua keputusan desain beserta alasannya.

## DD-01: Frontend = Next.js
Alasan: API routes built-in untuk sembunyikan API key, mudah deploy ke Vercel.

## DD-02: Auth = Supabase Auth
> ⚠️ SUDAH DIGANTI — lihat DD-20 (Better Auth + Neon Postgres).

Alternatif: Firebase Auth, Cloudflare Access, custom auth.
Dipilih Supabase: email+password siap pakai, database + storage gratis, RLS.

## DD-03: Invite-only = Whitelist Manual
Maksimal 10 akun. Registrasi divalidasi terhadap tabel `allowed_emails`.

## DD-04: Riwayat chat disimpan di database
> ⚠️ Database sudah pindah dari Supabase ke Neon Postgres — lihat DD-20.

Bukan localStorage. Akses multi-device, fondasi RAG nanti.

## DD-05: Model Selection — Update FASE 3
> ⚠️ SUDAH DIGANTI — LLM chat kini Anthropic Claude Haiku 4.5 (lib/anthropic.ts).
> Lihat DD-20. Model Groq yang masih dipakai hanya untuk TTS & STT.

Kriteria: opensource, bagus ID/EN, coding mumpuni, tersedia di Groq free tier.
Model yang tersedia di akun Groq saat itu:
- qwen/qwen3.8-27b — default, chat + vision
- qwen/qwen3.6-27b — alternatif Qwen
- openai/gpt-oss-120b — flagship (chat only)
- openai/gpt-oss-20b — cepat & ringan (chat only)
- whisper-large-v3 — voice input (untuk FASE 4)
Catatan: Model Llama & Mixtral belum tersedia di akun Groq saat ini.

## DD-06: Text-to-image = Pollinations.ai, TTS = Web Speech API
> ⚠️ SUDAH DIGANTI — TTS kini Groq Orpheus; text-to-image kini Cloudflare Workers AI
> dengan fallback Pollinations.ai (lib/image-gen-hybrid.ts).

Groq TIDAK menyediakan text-to-image/TTS. Pollinations tanpa API key.
Web Speech API bawaan browser = 100% free.

## DD-07: Upload file — Update FASE 3
- Gambar: base64 → dikompres otomatis (512x512 JPEG 70%) → Anthropic vision
- Teks/kode: dibaca client-side, max 8000 chars (~2000 tokens)
- PDF: extract client-side dengan pdfjs-dist, max 10 halaman, max 8000 chars
- Gambar transparan/PNG: fill putih di belakang sebelum compress

## DD-08: Keamanan API key
API key HANYA di server (API routes). .env wajib di .gitignore.

## DD-09: Bilingual ID/EN
Toggle di UI, string terpusat di lib/i18n.ts. (FASE 4)

## DD-10: Kontinuitas via GitHub
PROJECT_CONTEXT.md diupdate tiap akhir sesi kerja.

## DD-11: Streaming via API Route (FASE 2)
Keputusan: Client → POST /api/chat (server) → API LLM → stream balik ke client.
Alasan: API key LLM (kini ANTHROPIC_API_KEY, dulu GROQ_API_KEY) tidak boleh pernah
ada di browser (prinsip inti project).
Streaming tetap bisa dilakukan dari API route dengan mengembalikan ReadableStream.

## DD-12: Riwayat diambil server-side (FASE 2)
Keputusan: API route mengambil riwayat messages dari Supabase berdasarkan
conversationId + session user, bukan menerima riwayat dari client.
Alasan: Client tidak bisa memalsukan konteks; sumber kebenaran tunggal = database.

## DD-13: Struktur data chat (FASE 2)
- conversations: metadata percakapan (judul, owner)
- messages: baris per pesan, role ∈ {'user','assistant','system'}, image_url (nullable)
Alasan: Mudah untuk pagination, fondasi siap untuk RAG nanti.

## DD-14: Judul percakapan sederhana (FASE 2)
Judul = potongan pesan pertama user (maks ~50 char).
Alasan: Cukup untuk maks 10 user; LLM-generated title over-engineering untuk sekarang.

## DD-15: Strip konten lama dari riwayat (FASE 3) ⭐
Keputusan: Gambar & file LAMA di-strip dari riwayat saat kirim ke LLM.
Hanya konten terkini (pesan saat ini) yang dikirim lengkap.
Alasan: kuota token API terbatas (dulu free tier Groq 8000 TPM, kini Anthropic
berbayar per token). Gambar besar = banyak token = biaya lebih mahal.
Gambar lama tidak relevan untuk konteks percakapan saat ini.

## DD-16: Kompres gambar otomatis (FASE 3)
Keputusan: Gambar dikompres otomatis di client-side sebelum dikirim.
- Resize max 512x512px
- Convert ke JPEG quality 70% (sekarang 60%)
- Fill putih di belakang gambar transparan
- Minimal 10x10px
Alasan: Mengurangi token usage, menghindari "Too many images" error,
menghindari "Request too large" error.

## DD-17: Batasan file (FASE 3)
- File teks: max 200KB, output max 8000 chars (~2000 tokens)
- PDF: max 30MB, max 10 halaman, output max 8000 chars
Alasan: membatasi konteks agar satu request tetap ramping (dulu karena TPM limit
Groq free tier; sekarang untuk menekan biaya token Anthropic).

## DD-18: Dark/Light Mode Toggle
Keputusan: Toggle tema gelap/terang dengan CSS variables + ThemeProvider.
- Default: dark mode
- Persist: localStorage
- Implementasi: `lib/theme-context.tsx` + `app/globals.css` (CSS variables)
- Toggle button: ☀️/🌙 di sidebar header
Alasan: CSS variables paling ringan, tidak perlu library tambahan.
Semua komponen pakai theme variables (bg-background, bg-surface, dll)
bukan hardcoded zinc colors.

## DD-19: Admin Page Restriction (Server + Client)
Keputusan: Admin page (/admin) hanya bisa diakses email `faber.aritonang@gmail.com`.
- Layer 1 (Middleware): Cek cookie session sebelum serve /admin → redirect ke login
- Layer 2 (API): `/api/admin/whitelist` memverifikasi email admin via `requireAdmin()`
- Layer 3 (Client + Sidebar): Guard email di admin page & tombol ⚙️ hanya untuk admin
Alasan: Admin bisa tambah/hapus whitelist. Hanya owner yang boleh akses.
Catatan: middleware hanya memeriksa keberadaan cookie (optimistic), bukan email —
penegakan identitas admin yang sebenarnya ada di API route + client guard.

## DD-20: Migrasi Supabase → Neon + Better Auth, lalu Groq → Anthropic
Keputusan (5 Okt 2026): pindah dari Supabase Auth/DB ke **Better Auth + Neon Postgres**.
- Password: bcrypt (`bcryptjs`), kompatibel dengan hash Supabase lama bila berhasil diimpor
- RLS dihapus — semua query difilter `user_id` di API route (bukan di database)
- Whitelist tetap di tabel `allowed_emails`, pendaftaran divalidasi lewat hook Better Auth
- Reset password: `/forgot-password` → link 1 jam → `/reset-password`; reset pertama
  sekaligus membuat baris `account` (credential) untuk user lama hasil migrasi
Keputusan (6 Okt 2026): LLM chat pindah dari **Groq (Qwen)** ke **Anthropic Claude Haiku 4.5**
(`lib/anthropic.ts`, endpoint `/v1/messages`). Groq dipertahankan **hanya** untuk
Whisper (voice input) dan Orpheus (TTS) karena Anthropic tidak menyediakan keduanya.
Alasan: kualitas & kestabilan model untuk chat/coding; biaya token lebih terkendali
dengan pemotongan riwayat (10 pesan × 500 karakter) dan system prompt maks 2000 karakter.
Konsekuensi: tidak lagi "100% gratis" — chat kini berbayar per token.
