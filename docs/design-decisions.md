# Design Decisions — Nyari_ide

Log semua keputusan desain beserta alasannya.

## DD-01: Frontend = Next.js
Alasan: API routes built-in untuk sembunyikan API key, mudah deploy ke Vercel.

## DD-02: Auth = Supabase Auth
Alternatif: Firebase Auth, Cloudflare Access, custom auth.
Dipilih Supabase: email+password siap pakai, database + storage gratis, RLS.
    ### DD-2.1 — Streaming via API Route, bukan client-call langsung
    Keputusan: Client → POST /api/chat (server) → Groq API → stream balik ke client.
    Alasan: GROQ_API_KEY tidak boleh pernah ada di browser (prinsip inti project).
    Streaming tetap bisa dilakukan dari API route dengan mengembalikan ReadableStream.

    ### DD-2.2 — Riwayat diambil server-side sebelum call Groq
    Keputusan: API route mengambil riwayat messages dari Supabase berdasarkan
    conversationId + session user, bukan menerima riwayat dari client.
    Alasan: Client tidak bisa memalsukan konteks/menghemat token secara curang;
    sumber kebenaran tunggal ada di database.

    ### DD-2.3 — Struktur data chat
    - conversations: metadata percakapan (judul, owner)
    - messages: baris per pesan, role ∈ {'user','assistant','system'}
    Alasan: Mudah untuk pagination nanti, dan fondasi siap untuk RAG (FASE lanjutan)
    karena tiap message bisa di-embed secara terpisah.

    ### DD-2.4 — Judul percakapan sederhana
    Keputusan: Judul = potongan pesan pertama user (maks ~50 char).
    Alasan: Cukup untuk maks 10 user; LLM-generated title dianggap over-engineering
    untuk sekarang (bisa jadi peningkatan nanti).

    ### DD-2.5 — Tidak pakai fitur Assistant/Threads milik provider
    Keputusan: State percakapan dikelola sendiri di Supabase, bukan disimpan di
    sisi Groq. Alasan: Groq adalah API inference stateless; menyimpan di Supabase
    memberi kontrol penuh atas data (tujuan utama project).

## DD-03: Invite-only = Whitelist Manual
Maksimal 10 akun. Registrasi divalidasi terhadap tabel `allowed_emails`.

## DD-04: Riwayat chat disimpan di Supabase DB
Bukan localStorage. Akses multi-device, fondasi RAG nanti.

## DD-05: Model Selection
Kriteria: opensource, ringan opsi, bagus ID/EN, coding mumpuni, komunitas aktif.
- Chat utama: llama-3.3-70b-versatile (context ~128K, cocok RAG)
- Cepat/ringan: llama-3.1-8b-instant
- Alternatif: gemma2-9b-it
- Vision: llama-4-scout / llama-3.2-11b-vision
- STT: whisper-large-v3

## DD-06: Text-to-image = Pollinations.ai, TTS = Web Speech API
Groq TIDAK menyediakan text-to-image/TTS. Pollinations tanpa API key.
Web Speech API bawaan browser = 100% free.

## DD-07: Upload file
- Gambar: base64 → Groq vision (~4MB limit)
- Teks/kode: dibaca sebagai context (~50KB aman)
- PDF: extract CLIENT-SIDE dengan pdf.js → dikirim sebagai context

## DD-08: Keamanan API key
API key HANYA di server (API routes). .env wajib di .gitignore.

## DD-09: Bilingual ID/EN
Toggle di UI, string terpusat di lib/i18n.ts.

## DD-10: Kontinuitas via GitHub
PROJECT_CONTEXT.md diupdate tiap akhir sesi kerja.
