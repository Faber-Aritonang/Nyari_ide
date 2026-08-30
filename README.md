# Nyari_ide 🧠💡

![Version](https://img.shields.io/badge/version-v2.4-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E)

**Nyari_ide** (dari bahasa gaul: *"nyari ide"* = mencari ide) adalah sebuah proyek
membangun **aplikasi web chat AI multimodal berbasis model LLM opensource** —
seperti ChatGPT versi pribadi, tapi:

- 🔓 Dibangun di atas teknologi **opensource**
- 🆓 Hampir sepenuhnya **gratis** (deploy free-tier, API key milik pribadi)
- 🔐 **Private & terbatas** — hanya akun yang diundang/whitelist (maks 10 akun) yang bisa menggunakannya

Proyek ini dikerjakan secara bertahap dan **terdokumentasi penuh di repo ini**,
sehingga bisa dilanjutkan kapan saja dari perangkat mana pun.

---

## 🎯 Apa yang Bisa Dilakukan Aplikasi Ini?

Pengguna yang sudah login dapat:

| Fitur | Penjelasan |
|---|---|
| 💬 Chat text | Bertanya/jawab dengan LLM opensource (Qwen 3.8 27B via Groq API), respons streaming |
| 🧠 AI Persona | Teman diskusi, coaching personal, & mentor pribadi |
| 🖼️ Upload gambar | Kirim gambar → AI menganalisis (compressed otomatis 512x512) |
| 📄 Upload file | Kirim file teks/PDF → AI membaca & menjawab (pdf.js client-side) |
| 🎨 Text-to-image | Menulis prompt → AI membuat gambar (Cloudflare FLUX + Pollinations.ai, gratis) |
| 🔄 Image Regeneration | Regenerate gambar dengan prompt sama |
| 🖼️ Image Gallery | Galeri semua gambar yang pernah di-generate AI |
| 📚 Prompt Library | Simpan & reuse prompt favorit |
| 🌿 Conversation Branching | Cabang percakapan dari pesan tertentu |
| 📊 Usage Dashboard | Statistik penggunaan: pesan, gambar, dokumen, aktivitas 7 hari |
| 🔊 Text-to-speech | Suara AI membacakan jawaban (Groq Orpheus — English + Arabic Saudi) |
| 🎤 Voice input | Bicara ke mikrofon → diubah jadi teks (Whisper Large v3 Turbo) |
| 💻 Code Highlighting | Syntax highlighting + tombol copy per code block |
| 🔄 Model selector | Pilih model AI: Qwen 3.8/3.6, GPT-OSS 120B/20B |
| 🌐 Bilingual | Antarmuka dalam Bahasa Indonesia & English |
| 🌓 Dark/Light mode | Toggle tema gelap/terang, tersimpan otomatis |
| 🗂️ Riwayat chat | Percakapan tersimpan per user di database, bisa dibuka dari device mana pun |
| 🔄 Regenerate | Regenerasi ide dengan prompt yang sama |
| 📋 Copy & Edit | Copy ide ke clipboard / edit langsung di chat |
| 📄 Export | Export percakapan ke Markdown / PDF |
| ⌨️ Keyboard Shortcuts | Ctrl+Enter kirim, Ctrl+N baru, Ctrl+E export, Ctrl+D hapus |
| ⚙️ Custom Instructions | Atur bagaimana AI harus merespons Anda (per user) |
| 🔗 Share Link | Bagikan percakapan via URL unik |
| 🧠 RAG Hybrid | AI ingat dokumen & percakapan sebelumnya |
| 📚 Document Upload | Upload TXT/MD sebagai knowledge base |
| 🔍 Search | Cari pesan lintas percakapan |
| 📱 Mobile | Responsive di HP & desktop |

## 🚫 Kenapa Proyek Ini Dibuat?

1. **Kontrol penuh atas data percakapan sendiri** — tidak bergantung pada layanan pihak ketiga komersial
2. **Belajar membangun produk AI end-to-end**: frontend, auth, database, integrasi LLM, hingga deployment
3. **Eksperimen dengan LLM opensource** — menunjukkan bahwa teknologi AI mutakhir bisa dimanfaatkan tanpa biaya besar
4. **Fondasi untuk fitur lanjutan** seperti RAG (Retrieval-Augmented Generation) agar AI menjawab spesifik berdasarkan dokumen

## 🛠️ Bagaimana Cara Kerjanya? (Arsitektur Singkat)

```
Pengguna (browser)
│ login email+password
▼
Next.js Web App ──► Supabase Auth (whitelist maks 10 akun)
│                    Supabase DB (riwayat chat per user)
│
├──► Groq API : chat text + vision + whisper + Orpheus TTS (LLM opensource)
├──► Cloudflare Workers AI : text-to-image (FLUX.1 schnell)
├──► Pollinations.ai : text-to-image (fallback, gratis)
└──► Admin page : manajemen whitelist
```

Deploy: Vercel (free tier) → dapat URL publik, tapi hanya whitelist yang bisa masuk

Semua API key tersimpan **hanya di sisi server** — tidak pernah terekspos di browser.

## 📊 Status Proyek

> **v2.4 RILIS!** ✅ AI Personal Coach — Code Highlighting, Conversation Branching, Prompt Library, Image Regeneration, AI Persona.

Aplikasi ini sudah bisa dicoba langsung di: **[nyari-ide.vercel.app](https://nyari-ide.vercel.app)**

| Version | Release |
|---------|---------|
| v2.4 | [AI Personal Coach + Code Highlighting + Branching](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.4) |
| v2.3 | [Performance Optimization + Gallery + Dashboard](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.3) |
| v2.2 | [Image Generation Overhaul](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.2) |
| v2.1 | [RAG Hybrid](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.1) |
| v2.0 | [Custom Instructions](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.0) |
| v1.1 | [Regenerasi, Copy, Edit, Export, Keyboard Shortcuts](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.1) |
| v1.0 | [Initial Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.0) |

### 🧪 Mau Coba?

Aplikasi ini bersifat **private & terbatas** (whitelist maks 10 akun). Bagi yang ingin mencoba, silakan kirim permohonan akses test ke email admin:

> 📧 **faber.aritonang@gmail.com**

Cukup kirim email dengan subject: **"Permohonan Akses Test Nyari_ide"**

Isi email:
- Nama lengkap
- Email yang ingin didaftarkan
- Keperluan / alasan ingin mencoba

Admin akan mendaftarkan email Anda ke whitelist, setelah itu Anda bisa langsung login dan mencoba semua fitur yang tersedia.

---

Roadmap lengkap ada di [ROADMAP.md](./ROADMAP.md):

- ✅ FASE 0 — Fondasi & dokumentasi
- ✅ FASE 1 — Autentikasi (login, register, whitelist)
- ✅ FASE 2 — Chat text fungsional
- ✅ FASE 3 — Multimodal (gambar, PDF, voice)
- ✅ FASE 4 — Polesan & rilis v1.0

## 📁 Struktur Dokumentasi (untuk yang ingin menelusuri)

| File | Isi |
|---|---|
| [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) | ⭐ Status terkini & konteks project — mulai dari sini |
| [`ROADMAP.md`](./ROADMAP.md) | Rencana kerja per fase dengan milestone |
| [`docs/design-decisions.md`](./docs/design-decisions.md) | Log semua keputusan desain beserta alasannya |
| [`docs/setup.md`](./docs/setup.md) | Panduan setup environment & deploy |
| [`docs/api-notes.md`](./docs/api-notes.md) | Catatan teknis integrasi Groq, Pollinations, Supabase |

## 🧰 Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16 (TypeScript, Tailwind CSS, App Router) |
| LLM | Groq API — Qwen 3.8/3.6, GPT-OSS 120B/20B (opensource) |
| TTS | Groq Orpheus — English (hannah) + Arabic Saudi (noura) |
| Voice input | Whisper Large v3 Turbo via Groq |
| Text-to-image | Cloudflare Workers AI (FLUX.1) + Pollinations.ai (fallback) |
| Syntax Highlighting | rehype-highlight + highlight.js |
| PDF extraction | pdfjs-dist (client-side) |
| Auth + Database | Supabase (email+password, PostgreSQL, RLS) |
| Logging | lib/logger.ts (production-safe, silent di production) |
| Deploy | Vercel (free tier) |

## ⚠️ Catatan

Repo ini public untuk tujuan dokumentasi dan pembelajaran.
**Tidak ada API key, password, atau data sensitif** yang disimpan di repo ini —
semua rahasia melalui environment variables (lihat `.env.example`).

---

*Dibangun dengan semangat belajar & berbagi. 🚀*
