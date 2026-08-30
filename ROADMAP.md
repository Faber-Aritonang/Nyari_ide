# ROADMAP — Nyari_ide

## FASE 0 — Fondasi ✅
- [x] Desain & brainstorming
- [x] Dokumentasi awal (README, PROJECT_CONTEXT, ROADMAP, docs/)
- [x] Init Next.js project
- [x] Struktur folder final
- [x] Setup Supabase (project baru, schema.sql dijalankan)
- [x] .env.local + Vercel env vars
- [x] Deploy kosong ke Vercel ✅ MILESTONE 1

## FASE 1 — Autentikasi ✅
- [x] Integrasi Supabase Auth (email+password)
- [x] Halaman register (cek whitelist `allowed_emails`)
- [x] Halaman login
- [x] Middleware proteksi route /chat + /dashboard
- [x] Logout
✅ MILESTONE 2: hanya user whitelisted bisa masuk

## FASE 2 — Chat Text ✅
- [x] API route proxy Groq (`api/chat/route.ts`) + verifikasi auth
- [x] UI chat dengan streaming response
- [x] Simpan percakapan & pesan ke Supabase
- [x] Sidebar daftar riwayat percakapan (per user)
- [x] Buat/hapus percakapan
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
- [x] Model & parameter terpusat di lib/groq.ts
- [x] Error handling: Groq rate limit (429) → pesan ramah di UI
### Definition of Done (FASE 2)
- [x] User bisa chat multi-turn dengan respons streaming
- [x] Riwayat persisten per user (buka dari device lain, chat masih ada)
- [x] Keamanan: RLS aktif (user A tidak bisa baca chat user B)
- [x] Deploy ke Vercel, tes dari URL produksi
- [x] Update PROJECT_CONTEXT.md
✅ MILESTONE 3: chat text fungsional tersimpan ✅

## FASE 3 — Multimodal ✅
- [x] Model selector dropdown (4 model: Qwen 3.6/3.8, GPT-OSS 20B/120B)
- [x] Upload gambar → vision (compressed otomatis 512x512 JPEG 70%)
- [x] Upload file teks → context injection (max 8000 chars)
- [x] Upload PDF → extract teks via pdf.js client-side (max 10 halaman)
- [x] Text-to-speech (Groq Orpheus — English + Arabic Saudi)
- [x] Voice input (Whisper Large v3 Turbo via Groq)
### Milestone 3.1 — Model Selector
- [x] AVAILABLE_MODELS di lib/groq.ts (daftar model untuk UI + validasi server)
- [x] API route GET /api/models
- [x] Dropdown selector di chat page (muncul jika >1 model)
- [x] Model dipilih dikirim ke server, divalidasi against AVAILABLE_MODELS
### Milestone 3.2 — Upload Gambar
- [x] Tombol 🖼️ di input area + file picker
- [x] Kompres otomatis: resize max 512px + JPEG 70% + fill putih untuk transparan
- [x] Preview gambar sebelum kirim + tombol hapus
- [x] API route: terima imageUrl (base64), kirim ke Groq format vision
- [x] Simpan image_url ke tabel messages
- [x] Tampilkan gambar di ChatMessage component
- [x] Strip gambar lama dari riwayat (hanya gambar terkini dikirim)
- [x] Validasi: format (JPG/PNG/WebP), ukuran (maks 4MB)
- [x] Keterangan format di UI (tooltip, hint, error message)
### Milestone 3.3 — Upload File & PDF
- [x] Tombol 📎 di input area + file picker
- [x] lib/file-utils.ts: readTextFile() + extractPdfText()
- [x] File teks: baca langsung, max 8000 chars (~2000 tokens)
- [x] PDF: extract teks per halaman via pdf.js, max 10 halaman, max 8000 chars
- [x] API route: terima fileContext, sisipkan ke user message
- [x] Strip file lama dari riwayat (hanya file terkini dikirim)
- [x] Preview nama file + ukuran sebelum kirim
- [x] Validasi: max 200KB teks, max 5MB PDF
### Definition of Done (FASE 3)
- [x] User bisa pilih model dari dropdown
- [x] User bisa upload gambar → AI bisa melihat & menjelaskan
- [x] User bisa upload file teks/PDF → AI bisa membaca & menjawab
- [x] Token usage hemat (gambar/file lama di-strip dari riwayat)
- [x] Error handling jelas untuk rate limit & format error
- [x] Deploy ke Vercel, tes dari URL produksi
- [x] Update PROJECT_CONTEXT.md
✅ MILESTONE 4: multimodal lengkap ✅

## FASE 4 — Polesan ✅
- [x] Text-to-speech (Groq Orpheus — English + Arabic Saudi untuk Indonesia)
- [x] Voice input (Whisper Large v3 Turbo via Groq)
- [x] Toggle bahasa ID/EN (lib/i18n.ts, persist localStorage)
- [x] Responsive mobile (hamburger menu, overlay sidebar)
- [x] Manajemen whitelist (admin page: /admin — tambah/hapus email)
- [x] Text-to-image generation (Cloudflare FLUX + Pollinations.ai)
- [x] Voice selector untuk TTS (pilih suara dari dropdown)
- [x] Error handling & loading states
### Milestone 4.1 — TTS (Text-to-Speech)
- [x] Groq Orpheus TTS integration
- [x] Voice selector dropdown per pesan AI
- [x] Auto-detect bahasa: English → Orpheus English (hannah), Indonesia → Orpheus Arabic Saudi (noura)
- [x] API route POST /api/tts
- [x] Audio playback: play/stop controls
### Milestone 4.2 — Voice Input (STT)
- [x] MediaRecorder API untuk rekam audio
- [x] whisper-large-v3-turbo (cepat, ~500ms)
- [x] API route POST /api/transcribe
- [x] Toggle start/stop recording
- [x] Loading indicator saat transkripsi
### Milestone 4.3 — Text-to-Image Generation
- [x] Pollinations.ai integration (GPT Image 2, gratis)
- [x] Mode toggle 🎨 di input area
- [x] Generate gambar dari prompt
- [x] Tampilkan gambar hasil generate di chat
- [x] Tombol download untuk gambar
- [x] Opsi ukuran: 512×512, 768×768, 1024×1024
### Milestone 4.4 — Bilingual & Mobile
- [x] lib/i18n.ts: semua string UI dalam ID & EN
- [x] Toggle bahasa di sidebar
- [x] Responsive layout: sidebar collapsible di mobile
- [x] Hamburger menu + overlay untuk mobile
### Milestone 4.5 — Admin Whitelist
- [x] API route GET/POST/DELETE /api/admin/whitelist
- [x] Halaman /admin — tabel email + form tambah + tombol hapus
- [x] Middleware proteksi /admin (hanya email tertentu)
### Definition of Done (FASE 4)
- [x] TTS suara natural (Orpheus) untuk English & Indonesia
- [x] Voice input berfungsi dengan baik
- [x] Text-to-image menghasilkan gambar bagus
- [x] Toggle bahasa berfungsi di seluruh UI
- [x] Responsive di mobile & desktop
- [x] Admin bisa tambah/hapus whitelist
- [x] Deploy ke Vercel, tes dari URL produksi
- [x] Update PROJECT_CONTEXT.md
✅ MILESTONE 5: v1.0 rilis! ✅

## v2.0 — Custom Instructions ✅
- [x] Custom instructions per user (lib/groq.ts)
- [x] Settings page (/settings)
- [x] API route GET/POST /api/settings/instructions

## v2.1 — RAG Hybrid ✅
- [x] pgvector + embeddings untuk Q&A dokumen spesifik
- [x] Document upload (TXT/MD) — /rag/documents
- [x] Hybrid search: semantic + text fallback
- [x] Auto-indexing: dokument + percakapan

## v2.2 — Image Generation Overhaul ✅
- [x] Cloudflare Workers AI (FLUX.1 schnell) — gratis 10K neurons/day
- [x] Pollinations.ai sebagai fallback (gratis, unlimited)
- [x] Hapus Gemini (rate limit) & FLUX fal.ai (paid)
- [x] Server-side API route (/api/image-gen)

## v2.3 — Performance Optimization ✅
- [x] Image Gallery — galeri semua gambar yang di-generate AI
- [x] Usage Dashboard — statistik penggunaan (pesan, gambar, dokumen)
- [x] SSE streaming dedup — hapus ~60 baris kode duplikat
- [x] N+1 query fix — 1 query vs 5 query di usage route
- [x] Parallel fetch — conversations + models di-load bersamaan
- [x] Production-safe logger (lib/logger.ts)
- [x] Console cleanup — semua 38 console.error/log diganti ke logger

## v2.4 — AI Personal Coach ✅
- [x] Code Syntax Highlighting + Copy button per block (rehype-highlight)
- [x] Conversation Branching — cabang percakapan dari pesan tertentu
- [x] Prompt Library — simpan & reuse prompt favorit
- [x] Image Regeneration — regenerate gambar dengan prompt sama
- [x] AI Persona — teman diskusi, coaching personal, mentor pribadi
- [x] API route /api/prompts — CRUD prompt library
- [x] Database table saved_prompts dengan RLS

## v2.5 — Export & Templates ✅
- [x] Export to PDF — export percakapan ke PDF (jspdf + html2canvas)
- [x] Chat Templates — 8 template siap pakai (Coding, Writing, Brainstorm, Analysis, dll)
- [x] Conversation Summary — AI buat ringkasan otomatis dari percakapan panjang

## v2.6 — Code Execution & Import/Export ✅
- [x] AI Code Execution — eksekusi kode JavaScript di browser (sandboxed iframe)
- [x] Chat Import/Export JSON — export/import riwayat chat ke file JSON
- [x] Message Reactions UI — 👍/👎 reaction pada jawaban AI
- [x] Notification System — notifikasi browser saat AI selesai merespons

## Masa Depan (backlog)
- [ ] Multi-language TTS (bahasa lain selain EN + AR)
- [ ] Error boundaries di UI
- [ ] Rate limiting per user
- [ ] Real-time collaboration
- [ ] Offline mode
