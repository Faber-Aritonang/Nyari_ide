# Changelog

Semua perubahan penting pada **Nyari_ide** akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id-ID/).

---

## [v1.1.0](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.1) — 2026-08-28

### ✨ Fitur Baru

- **Regenerate** — Regenerasi ide dengan prompt yang sama, langsung dari balasan AI
- **Copy to Clipboard** — Salin ide ke clipboard dengan satu klik
- **Edit Message** — Edit pesan yang sudah dikirim, AI akan merespons ulang
- **Export Chat** — Export percakapan ke format **Markdown** atau **PDF**
- **Keyboard Shortcuts** — Akses cepat tanpa mouse:
  - `Ctrl+Enter` — Kirim pesan
  - `Ctrl+N` — Percakapan baru
  - `Ctrl+E` — Export percakapan
  - `Ctrl+D` — Hapus percakapan
  - `Escape` — Tutup sidebar di mobile
- **Dark/Light Mode** — Toggle tema gelap & terang, preferensi tersimpan otomatis
- **Admin Whitelist Page** — Halaman admin untuk mengelola whitelist email (hanya admin yang bisa akses)

### 🔧 Perbaikan

- **Admin page restriction** — Hanya email `faber.aritonang@gmail.com` yang bisa mengakses admin
- **TTS 502 error** — Fix model & voice mismatch pada Orpheus TTS
- **TTS flow** — Voice selector & audio playback diperbaiki
- **Voice selector** — Pilih suara yang paling jelas untuk TTS

### 📚 Dokumentasi

- Update semua dokumentasi untuk dark mode, admin restriction, dan Orpheus TTS
- Tambah info coba aplikasi & permohonan akses test
- Update README badge (version, license, tech stack)

---

## [v1.0.0](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.0) — 2026-08-27

### ✨ Fitur Baru

- **Chat Text** — Bertanya/jawab dengan LLM opensource (Qwen 3.8 27B via Groq API), respons streaming
- **Upload Gambar** — Kirim gambar → AI menganalisis (compressed otomatis 512x512, JPEG)
- **Upload File** — Kirim file teks/PDF → AI membaca & menjawab (pdf.js client-side)
- **Text-to-Image** — Menulis prompt → AI membuat gambar (GPT Image 2 via Pollinations.ai)
- **Text-to-Speech** — Suara AI membacakan jawaban (Groq Orpheus — English + Arabic Saudi)
- **Voice Input** — Bicara ke mikrofon → diubah jadi teks (Whisper Large v3 Turbo)
- **Model Selector** — Pilih model AI: Qwen 3.8/3.6, GPT-OSS 120B/20B
- **Bilingual** — Antarmuka dalam Bahasa Indonesia & English
- **Riwayat Chat** — Percakapan tersimpan per user di database (Supabase), bisa dibuka dari device mana pun
- **Auth & Whitelist** — Login/register email+password, whitelist maks 10 akun
- **Responsive Mobile** — Layout responsive di HP & desktop
- **Sidebar** — Navigasi percakapan dengan sidebar

### 🔧 Perbaikan

- **Voice input** — Tombol toggle start/stop + perbaiki audio recording
- **TTS** — Orpheus untuk English, Web Speech untuk Indonesia
- **Image upload** — Kompres gambar sebelum kirim + handle rate limit Groq
- **Model selector** — Fix model lain blocked di akun Groq
- **CSS** — Fix typo `hover:bg-zink` → `hover:bg-zinc`
- **History** — Strip gambar lama dari riwayat + limit history untuk hindari rate limit

### 🏗️ Infrastruktur

- Next.js 16 (TypeScript, Tailwind CSS, App Router)
- Supabase Auth + Database (PostgreSQL, RLS)
- Groq API (chat, vision, whisper, Orpheus TTS)
- Pollinations.ai (text-to-image)
- Deploy ke Vercel (free tier)
- Admin page terproteksi (hanya email tertentu)

---

*Changelog ini di-update secara otomatis setiap rilis versi baru.*
