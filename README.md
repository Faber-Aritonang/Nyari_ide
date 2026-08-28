# Nyari_ide 🧠💡

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
| 🖼️ Upload gambar | Kirim gambar → AI menganalisis (compressed otomatis 512x512) |
| 📄 Upload file | Kirim file teks/PDF → AI membaca & menjawab (pdf.js client-side) |
| 🎨 Text-to-image | Menulis prompt → AI membuat gambar (GPT Image 2 via Pollinations.ai) |
| 🔊 Text-to-speech | Suara AI membacakan jawaban (Groq Orpheus — English + Arabic Saudi) |
| 🎤 Voice input | Bicara ke mikrofon → diubah jadi teks (Whisper Large v3 Turbo) |
| 🔄 Model selector | Pilih model AI: Qwen 3.8/3.6, GPT-OSS 120B/20B |
| 🌐 Bilingual | Antarmuka dalam Bahasa Indonesia & English |
| 🗂️ Riwayat chat | Percakapan tersimpan per user di database, bisa dibuka dari device mana pun |
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
├──► Pollinations.ai : text-to-image (GPT Image 2)
└──► Admin page : manajemen whitelist
```

Deploy: Vercel (free tier) → dapat URL publik, tapi hanya whitelist yang bisa masuk

Semua API key tersimpan **hanya di sisi server** — tidak pernah terekspos di browser.

## 📊 Status Proyek

> **v1.0 RILIS!** ✅ Semua fase sudah selesai.

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
| Text-to-image | Pollinations.ai (GPT Image 2) |
| PDF extraction | pdfjs-dist (client-side) |
| Auth + Database | Supabase (email+password, PostgreSQL, RLS) |
| Deploy | Vercel (free tier) |

## ⚠️ Catatan

Repo ini public untuk tujuan dokumentasi dan pembelajaran.
**Tidak ada API key, password, atau data sensitif** yang disimpan di repo ini —
semua rahasia melalui environment variables (lihat `.env.example`).

---

*Dibangun dengan semangat belajar & berbagi. 🚀*
