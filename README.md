# Nyari_ide 🧠

Webpage Chat AI Multimodal dengan LLM Opensource — private (invite-only).

## Fitur
- 💬 Chat text dengan LLM opensource (via Groq API)
- 🖼️ Text-to-image
- 🔊 Text-to-speech (TTS) & voice input
- 📎 Upload file: gambar, teks, PDF
- 🔐 Autentikasi email+password, whitelist maks 10 akun
- 🌐 Bilingual: Indonesia / English
- 💾 Riwayat chat tersimpan per user

## Tech Stack
| Komponen | Teknologi |
|---|---|
| Frontend | Next.js |
| LLM | Groq API — Llama 3.3 70B, Llama 3.1 8B |
| Vision | Groq API — Llama 4 Scout |
| Voice input | Groq Whisper Large v3 |
| Text-to-image | Pollinations.ai |
| Text-to-speech | Web Speech API |
| Auth + Database | Supabase |
| Deploy | Vercel |

## Dokumentasi
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) → status terkini project ⭐ mulai dari sini
- [ROADMAP.md](./ROADMAP.md) → fase pengerjaan
- [docs/design-decisions.md](./docs/design-decisions.md) → semua keputusan desain
- [docs/setup.md](./docs/setup.md) → cara setup environment
- [docs/api-notes.md](./docs/api-notes.md) → catatan integrasi API

## Konvensi Commit
- `feat:` fitur baru
- `fix:` perbaikan bug
- `docs:` update dokumentasi
- `refactor:` restrukturisasi kode

## Model Selection (terpilih)
- Chat utama: `llama-3.3-70b-versatile`
- Mode cepat: `llama-3.1-8b-instant`
- Vision: Llama 4 Scout
- STT: Whisper Large v3
