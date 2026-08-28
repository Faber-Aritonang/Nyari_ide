# Design Decisions — Nyari_ide

Log semua keputusan desain beserta alasannya.

## DD-01: Frontend = Next.js
Alasan: API routes built-in untuk sembunyikan API key, mudah deploy ke Vercel.

## DD-02: Auth = Supabase Auth
Alternatif: Firebase Auth, Cloudflare Access, custom auth.
Dipilih Supabase: email+password siap pakai, database + storage gratis, RLS.

## DD-03: Invite-only = Whitelist Manual
Maksimal 10 akun. Registrasi divalidasi terhadap tabel `allowed_emails`.

## DD-04: Riwayat chat disimpan di Supabase DB
Bukan localStorage. Akses multi-device, fondasi RAG nanti.

## DD-05: Model Selection — Update FASE 3
Kriteria: opensource, bagus ID/EN, coding mumpuni, tersedia di Groq free tier.
Model yang tersedia di akun Groq saat ini:
- qwen/qwen3.8-27b — default, chat + vision
- qwen/qwen3.6-27b — alternatif Qwen
- openai/gpt-oss-120b — flagship (chat only)
- openai/gpt-oss-20b — cepat & ringan (chat only)
- whisper-large-v3 — voice input (untuk FASE 4)
Catatan: Model Llama & Mixtral belum tersedia di akun Groq saat ini.
Daftar model diatur di lib/groq.ts (AVAILABLE_MODELS).

## DD-06: Text-to-image = Pollinations.ai, TTS = Web Speech API
Groq TIDAK menyediakan text-to-image/TTS. Pollinations tanpa API key.
Web Speech API bawaan browser = 100% free.

## DD-07: Upload file — Update FASE 3
- Gambar: base64 → dikompres otomatis (512x512 JPEG 70%) → Groq vision
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
Keputusan: Client → POST /api/chat (server) → Groq API → stream balik ke client.
Alasan: GROQ_API_KEY tidak boleh pernah ada di browser (prinsip inti project).
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
Keputusan: Gambar & file LAMA di-strip dari riwayat saat kirim ke Groq.
Hanya konten terkini (pesan saat ini) yang dikirim lengkap.
Alasan: Groq free tier TPM limit ketat (8000 TPM).
Gambar besar = banyak token = cepat habis kuota.
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
- PDF: max 5MB, max 10 halaman, output max 8000 chars
Alasan: TPM limit Groq free tier. 8000 chars ≈ 2000 tokens, aman untuk satu request.

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
- Layer 1 (Middleware): Cek email user sebelum serve /admin → redirect ke /chat
- Layer 2 (Client): Double-check email di admin page → redirect ke /chat
- Layer 3 (Sidebar): Tombol ⚙️ Admin hanya muncul untuk admin
Alasan: Admin bisa tambah/hapus whitelist. Hanya owner yang boleh akses.
Tiga layer defense: server-side (middleware), client guard, UI visibility.
