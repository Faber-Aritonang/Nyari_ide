# Nyari_ide 🧠💡

![Version](https://img.shields.io/badge/version-v2.7-blue)
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

### 💬 Chat & Komunikasi
| Fitur | Penjelasan |
|---|---|
| 💬 Chat text streaming | Bertanya/jawab dengan LLM opensource (Qwen 3.8 27B via Groq API), respons streaming |
| 🎭 AI Persona | Ganti persona AI: Teman Diskusi, Coding Expert, Creative Writer, Business Mentor, Ahli Bahasa Indonesia, Minimalis |
| 🔄 Model selector | Pilih model AI: Qwen 3.8/3.6, GPT-OSS 120B/20B |
| 🌐 Bilingual | Antarmuka dalam Bahasa Indonesia & English |
| ⌨️ Keyboard Shortcuts | Ctrl+Enter kirim, Ctrl+N baru, Ctrl+E export, Ctrl+D hapus |

### 🖼️ Multimodal
| Fitur | Penjelasan |
|---|---|
| 🖼️ Upload gambar | Kirim gambar → AI menganalisis (compressed otomatis 512x512) |
| 📄 Upload file | Kirim file teks/PDF → AI membaca & menjawab (pdf.js client-side) |
| 🎨 Text-to-image | Menulis prompt → AI membuat gambar (Cloudflare FLUX + Pollinations.ai, gratis) |
| 🔄 Image Regeneration | Regenerate gambar dengan prompt sama |
| 🖼️ Image Gallery | Galeri semua gambar yang pernah di-generate AI |
| 🔊 Text-to-speech | Suara AI membacakan jawaban (Groq Orpheus — English + Arabic Saudi) |
| 🎤 Voice input | Bicara ke mikrofon → diubah jadi teks (Whisper Large v3 Turbo) |

### 🧠 Produktivitas
| Fitur | Penjelasan |
|---|---|
| 📚 Prompt Library | Simpan & reuse prompt favorit |
| 📋 Chat Templates | 15+ template dengan 7 teknik prompting (Persona, Chain-of-Thought, Few-Shot, dll) |
| 🌿 Conversation Branching | Cabang percakapan dari pesan tertentu |
| 📝 Conversation Summary | AI buat ringkasan otomatis dari percakapan panjang |
| 🔍 Search | Cari pesan lintas percakapan |

### 💻 Developer Tools
| Fitur | Penjelasan |
|---|---|
| 💻 Code Highlighting | Syntax highlighting + tombol copy per code block |
| ▶️ Code Execution | Eksekusi kode JavaScript langsung di browser (sandboxed iframe) |
| 📄 Export PDF | Export percakapan ke PDF |
| 📦 Export/Import JSON | Export/Import riwayat chat ke file JSON |
| 🔗 Share Link | Bagikan percakapan via URL unik |

### ⚙️ Pengaturan & Lainnya
| Fitur | Penjelasan |
|---|---|
| ⚙️ Custom Instructions | Atur bagaimana AI harus merespons Anda (per user) |
| 📊 Usage Dashboard | Statistik penggunaan: pesan, gambar, dokumen, aktivitas 7 hari |
| 🔔 Notifications | Notifikasi browser saat AI selesai merespons |
| 📡 Offline Mode | Akses percakapan yang di-cache tanpa internet |
| 🧠 RAG Hybrid | AI ingat dokumen & percakapan sebelumnya |
| 📚 Document Upload | Upload TXT/MD sebagai knowledge base |
| 🌓 Dark/Light mode | Toggle tema gelap/terang, tersimpan otomatis |
| 📱 Mobile | Responsive di HP & desktop |
| 🗂️ Riwayat chat | Percakapan tersimpan per user di database |

---

## 🎭 AI Persona

Pilih persona AI yang sesuai dengan kebutuhan Anda:

| Persona | Icon | Deskripsi |
|---------|------|-----------|
| **Teman Diskusi** | 🧠 | Default — coaching personal & mentor pribadi |
| **Coding Expert** | 💻 | Ahli programming, debugging, & architecture |
| **Creative Writer** | ✍️ | Penulis kreatif, content creator, & storytelling |
| **Business Mentor** | 💼 | Mentor bisnis, startup advisor, & strategic thinker |
| **Ahli Bahasa Indonesia** | 🇮🇩 | Ahli tata bahasa & komunikasi Indonesia |
| **Minimalis** | ⚡ | Jawaban singkat, padat, langsung ke inti |

---

## 📋 Chat Templates

15+ template dengan 7 teknik prompting yang berbeda:

### Teknik Prompting
| Teknik | Deskripsi |
|--------|-----------|
| 🎭 **Persona Prompt** | Definisikan peran & spesialisasi AI |
| 🔗 **Chain-of-Thought** | Berpikir step-by-step |
| 🎯 **Few-Shot** | Berikan contoh untuk diikuti |
| 📐 **Structured** | Format terstruktur dengan section |
| 🔄 **Iterative** | Bangun secara bertahap |
| ⛔ **Constraint-Based** | Aturan dan batasan ketat |
| 💬 **Short Prompt** | Tanya jawab singkat |

### Contoh Template
- 💻 **Coding Helper** — Senior Developer, Code Generation
- ✍️ **Writing Assistant** — Email Writing, Blog Post Writer
- 💡 **Brainstorming Partner** — Problem Solver, Decision Making
- 📊 **Business Analysis** — Business Mentor, API Documentation
- 🎯 **Idea Coach** — App Builder, Content Creator
- 📚 **Learning Buddy** — Quick Q&A
- 📝 **Document Review** — Interview Coach, 30-Second Pitch

---

## 🚫 Kenapa Proyek Ini Dibuat?

1. **Kontrol penuh atas data percakapan sendiri** — tidak bergantung pada layanan pihak ketiga komersial
2. **Belajar membangun produk AI end-to-end**: frontend, auth, database, integrasi LLM, hingga deployment
3. **Eksperimen dengan LLM opensource** — menunjukkan bahwa teknologi AI mutakhir bisa dimanfaatkan tanpa biaya besar
4. **Fondasi untuk fitur lanjutan** seperti RAG (Retrieval-Augmented Generation) agar AI menjawab spesifik berdasarkan dokumen

---

## 🛠️ Bagaimana Cara Kerjanya? (Arsitektur Singkat)

```
Pengguna (browser)
│ login email+password
▼
Next.js Web App ──► Supabase Auth (whitelist maks 10 akun)
│                    Supabase DB (riwayat chat per user)
│                    IndexedDB (offline cache)
│
├──► Groq API : chat text + vision + whisper + Orpheus TTS (LLM opensource)
├──► Cloudflare Workers AI : text-to-image (FLUX.1 schnell)
├──► Pollinations.ai : text-to-image (fallback, gratis)
└──► Admin page : manajemen whitelist
```

Deploy: Vercel (free tier) → dapat URL publik, tapi hanya whitelist yang bisa masuk

Semua API key tersimpan **hanya di sisi server** — tidak pernah terekspos di browser.

---

## 📊 Status Proyek

> **v2.7 RILIS!** ✅ AI Persona Switcher + Offline Mode.

Aplikasi ini sudah bisa dicoba langsung di: **[nyari-ide.vercel.app](https://nyari-ide.vercel.app)**

| Version | Release | Fitur Utama |
|---------|---------|-------------|
| v2.7 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.7) | AI Persona Switcher + Offline Mode |
| v2.6 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.6) | Code Execution + JSON Import/Export + Notifications |
| v2.5 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.5) | Export PDF + Chat Templates + Conversation Summary |
| v2.4 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.4) | AI Personal Coach + Code Highlighting + Branching |
| v2.3 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.3) | Performance Optimization + Gallery + Dashboard |
| v2.2 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.2) | Image Generation Overhaul (Cloudflare + Pollinations) |
| v2.1 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.1) | RAG Hybrid (pgvector + embeddings) |
| v2.0 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v2.0) | Custom Instructions |
| v1.1 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.1) | Regenerasi, Copy, Edit, Export, Keyboard Shortcuts |
| v1.0 | [Release](https://github.com/Faber-Aritonang/Nyari_ide/releases/tag/v1.0) | Initial Release |

---

## 🧪 Mau Coba?

Aplikasi ini bersifat **private & terbatas** (whitelist maks 10 akun). Bagi yang ingin mencoba, silakan kirim permohonan akses test ke email admin:

> 📧 **faber.aritonang@gmail.com**

Cukup kirim email dengan subject: **"Permohonan Akses Test Nyari_ide"**

Isi email:
- Nama lengkap
- Email yang ingin didaftarkan
- Keperluan / alasan ingin mencoba

Admin akan mendaftarkan email Anda ke whitelist, setelah itu Anda bisa langsung login dan mencoba semua fitur yang tersedia.

---

## 🗺️ Roadmap

Roadmap lengkap ada di [ROADMAP.md](./ROADMAP.md):

- ✅ FASE 0 — Fondasi & dokumentasi
- ✅ FASE 1 — Autentikasi (login, register, whitelist)
- ✅ FASE 2 — Chat text fungsional
- ✅ FASE 3 — Multimodal (gambar, PDF, voice)
- ✅ FASE 4 — Polesan & rilis v1.0
- ✅ v2.0 — Custom Instructions
- ✅ v2.1 — RAG Hybrid
- ✅ v2.2 — Image Generation Overhaul
- ✅ v2.3 — Performance Optimization
- ✅ v2.4 — AI Personal Coach
- ✅ v2.5 — Export PDF + Templates + Summary
- ✅ v2.6 — Code Execution + JSON Import/Export + Notifications
- ✅ v2.7 — AI Persona Switcher + Offline Mode

---

## 📁 Struktur Dokumentasi

| File | Isi |
|---|---|
| [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) | ⭐ Status terkini & konteks project — mulai dari sini |
| [`ROADMAP.md`](./ROADMAP.md) | Rencana kerja per fase dengan milestone |
| [`docs/design-decisions.md`](./docs/design-decisions.md) | Log semua keputusan desain beserta alasannya |
| [`docs/setup.md`](./docs/setup.md) | Panduan setup environment & deploy |
| [`docs/api-notes.md`](./docs/api-notes.md) | Catatan teknis integrasi Groq, Pollinations, Supabase |

---

## 🧰 Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16 (TypeScript, Tailwind CSS, App Router) |
| LLM | Groq API — Qwen 3.8/3.6, GPT-OSS 120B/20B (opensource) |
| TTS | Groq Orpheus — English (hannah) + Arabic Saudi (noura) |
| Voice input | Whisper Large v3 Turbo via Groq |
| Text-to-image | Cloudflare Workers AI (FLUX.1) + Pollinations.ai (fallback) |
| Syntax Highlighting | rehype-highlight + highlight.js |
| Code Execution | Sandboxed iframe (JavaScript) |
| PDF extraction | pdfjs-dist (client-side) |
| Auth + Database | Supabase (email+password, PostgreSQL, RLS) |
| Offline Cache | IndexedDB (percakapan terakhir) |
| Export | jsPDF + html2canvas (PDF), JSON, Markdown |
| Logging | lib/logger.ts (production-safe, silent di production) |
| Deploy | Vercel (free tier) |

---

## ⚠️ Catatan

Repo ini public untuk tujuan dokumentasi dan pembelajaran.
**Tidak ada API key, password, atau data sensitif** yang disimpan di repo ini —
semua rahasia melalui environment variables (lihat `.env.example`).

---

## 📈 Statistik Project

| Metrik | Nilai |
|--------|-------|
| Total Version | 12 (v1.0 - v2.7) |
| Total Fitur | 35+ |
| File TypeScript | 86+ |
| API Routes | 15+ |
| Database Tables | 8 |
| Components | 15+ |

---

*Dibangun dengan semangat belajar & berbagi. 🚀*
