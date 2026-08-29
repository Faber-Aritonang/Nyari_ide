# MINDMAP: Nyari_ide — Platform Chat AI untuk Pengembangan Ide

========================================
PUSAT: NYARI_IDE — All-in-One Ideation Platform
========================================

## CABANG 1: FITUR INTI (CORE FEATURES)

### 1.1 Chat AI Multimodal
- Text chat dengan streaming response
- Upload gambar untuk analisis AI (vision)
- Upload file teks & PDF untuk context
- Text-to-image generation (Pollinations.ai)
- Voice input (Whisper Large v3 Turbo)
- Text-to-speech (Groq Orpheus)
- Model selector (Qwen 3.8/3.6, GPT-OSS)
- Bilingual UI (Bahasa Indonesia & English)

### 1.2 Mindmap Generator
- AI membuat mindmap dari ide user
- Struktur hierarchical (pusat → cabang → sub-cabang)
- Visualisasi teks (markdown format)
- Export ke berbagai format
- Collaborative editing (future)

### 1.3 Dokumentasi Struktur
- Auto-generate dokumentasi dari ide
- Template terstruktur (ringkasan, target, fitur, dll)
- Export ke Markdown & PDF
- Version control untuk dokumentasi
- Collaborative documentation (future)

### 1.4 Action Plan Builder
- Langkah implementasi konkret
- Timeline & milestone realistis
- Checklist yang bisa ditrack
- Dependency antar task
- Progress tracking (future)

### 1.5 Knowledge Base (RAG)
- Upload dokumen referensi (TXT, MD)
- Vector search (pgvector)
- Conversation memory (AI mengingat chat sebelumnya)
- Auto-indexing percakapan
- Similarity search dengan cosine distance

---

## CABANG 2: USER EXPERIENCE (UX)

### 2.1 Authentication & Security
- Email + password authentication (Supabase Auth)
- Whitelist system (maks 10 akun)
- Admin page untuk manage whitelist
- Row Level Security (RLS) di database
- API key hanya di server-side

### 2.2 UI/UX Design
- Clean & modern interface
- Dark/Light mode toggle (persist)
- Responsive design (mobile, tablet, desktop)
- Sidebar navigation
- Loading states & error handling

### 2.3 Chat Interface
- Bubble chat (user vs assistant)
- Markdown rendering (code, list, heading)
- Auto-scroll ke bawah
- Copy message to clipboard
- Edit message & regenerate
- Keyboard shortcuts:
  - Ctrl+Enter: Kirim pesan
  - Ctrl+N: Percakapan baru
  - Ctrl+E: Export chat
  - Ctrl+D: Hapus percakapan
  - Escape: Tutup sidebar (mobile)

### 2.4 File Management
- Drag & drop upload
- File preview sebelum upload
- Auto-compress gambar (512x512 JPEG)
- File size validation
- Supported formats: JPG, PNG, WebP, TXT, PDF, MD

---

## CABANG 3: TEKNOLOGI (TECH STACK)

### 3.1 Frontend
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State: React Hooks (useState, useEffect)
- Markdown: react-markdown
- Icons: Emoji-based (no icon library)

### 3.2 Backend & Database
- Runtime: Node.js (Vercel Serverless)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- ORM: Supabase JS Client
- Vector DB: pgvector (Supabase extension)

### 3.3 AI & APIs
- LLM: Groq API (Qwen 3.8/3.6, GPT-OSS)
- Vision: Qwen 3.8 27B via Groq
- STT: Whisper Large v3 Turbo (Groq)
- TTS: Groq Orpheus (English + Arabic Saudi)
- Image Gen: Pollinations.ai (GPT Image 2)
- Embeddings: OpenAI ada-002 (or TF-IDF fallback)

### 3.4 Infrastructure
- Hosting: Vercel (free tier)
- Domain: nyari-ide.vercel.app
- CDN: Vercel Edge Network
- Analytics: Vercel Analytics (future)
- Monitoring: Vercel Logs

---

## CABANG 4: DATABASE SCHEMA

### 4.1 Tabel Utama
```
allowed_emails
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── invited_by (TEXT)
└── created_at (TIMESTAMP)

conversations
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── title (TEXT)
└── created_at (TIMESTAMP)

messages
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── role (TEXT: user/assistant/system)
├── content (TEXT)
├── image_url (TEXT)
└── created_at (TIMESTAMP)
```

### 4.2 Tabel RAG (v2.1)
```
documents
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── title (TEXT)
├── filename (TEXT)
├── content (TEXT)
├── file_type (TEXT: pdf/txt/md/conversation)
├── file_size (INTEGER)
├── chunk_count (INTEGER)
└── created_at (TIMESTAMP)

document_chunks
├── id (UUID, PK)
├── document_id (UUID, FK → documents)
├── user_id (UUID, FK → auth.users)
├── chunk_index (INTEGER)
├── content (TEXT)
├── token_count (INTEGER)
└── created_at (TIMESTAMP)

embeddings
├── id (UUID, PK)
├── chunk_id (UUID, FK → document_chunks)
├── user_id (UUID, FK → auth.users)
├── embedding (VECTOR 1536)
├── source_type (TEXT: document/conversation)
├── source_id (UUID)
├── content (TEXT)
├── metadata (JSONB)
└── created_at (TIMESTAMP)
```

### 4.3 Tabel v2.0
```
custom_instructions
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users, UNIQUE)
├── instructions (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

share_links
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── user_id (UUID, FK → auth.users)
├── token (TEXT, UNIQUE)
├── is_public (BOOLEAN)
├── created_at (TIMESTAMP)
└── expires_at (TIMESTAMP)
```

---

## CABANG 5: API ENDPOINTS

### 5.1 Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

### 5.2 Chat
- POST /api/chat — Streaming chat ke Groq
- GET /api/models — List model tersedia

### 5.3 Conversations
- GET /api/conversations — List percakapan user
- POST /api/conversations — Buat percakapan baru
- DELETE /api/conversations/[id] — Hapus percakapan
- GET /api/conversations/[id]/messages — Ambil pesan

### 5.4 RAG (v2.1)
- GET /api/rag/documents — List dokumen user
- POST /api/rag/documents — Upload & index dokumen
- DELETE /api/rag/documents/[id] — Hapus dokumen

### 5.5 Sharing (v2.0)
- POST /api/conversations/[id]/share — Generate share link
- DELETE /api/conversations/[id]/share — Hapus share link
- GET /api/shared/[token] — Akses percakapan publik

### 5.6 Settings (v2.0)
- GET /api/settings/instructions — Ambil custom instructions
- POST /api/settings/instructions — Simpan custom instructions

### 5.7 Media
- POST /api/transcribe — Whisper STT
- POST /api/tts — Groq Orpheus TTS

### 5.8 Admin
- GET /api/admin/whitelist — List whitelist
- POST /api/admin/whitelist — Tambah email
- DELETE /api/admin/whitelist — Hapus email

---

## CABANG 6: MONETISASI

### 6.1 Freemium Model
```
FREE TIER:
- 50 pesan/hari
- 3 dokumen RAG
- Semua fitur dasar
- Community support

PRO ($9/bulan):
- Unlimited pesan
- 50 dokumen RAG
- Priority support
- Advanced analytics (future)
- Custom branding (future)

TEAM ($29/bulan):
- Semua fitur Pro
- Shared workspace
- Admin panel
- Team collaboration
- API access (future)
```

### 6.2 Revenue Streams
1. Subscription (Freemium → Pro → Team)
2. Premium templates & content
3. Sponsored features
4. Enterprise licensing
5. Consulting & training

---

## CABANG 7: MARKETING STRATEGY

### 7.1 Content Marketing
- Blog posts tentang ideation & productivity
- YouTube tutorials
- Twitter/X threads
- LinkedIn articles
- TikTok short tips

### 7.2 Community Building
- Discord server
- Reddit community
- Product Hunt launch
- Hacker News post
- Indie Hackers community

### 7.3 Partnerships
- EdTech startups
- Coworking spaces
- Startup incubators
- University programs
- Productivity influencers

### 7.4 SEO Strategy
- Target keywords: "chat AI ide", "brainstorming AI", "mindmap generator"
- Long-tail: "cari ide bisnis dengan AI", "bantu buat action plan"
- Content clusters around ideation topics

---

## CABANG 8: ROADMAP MASA DEPAN

### 8.1 Phase 7 (Q4 2026)
- [ ] Advanced RAG (multi-document, reranking)
- [ ] Image gallery untuk generated images
- [ ] Multi-language TTS
- [ ] Conversation search

### 8.2 Phase 8 (Q1 2027)
- [ ] Collaborative workspaces
- [ ] Team features
- [ ] Version control untuk ide
- [ ] Export ke Notion/Confluence

### 8.3 Phase 9 (Q2 2027)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Advanced analytics dashboard
- [ ] API untuk integrasi

### 8.4 Phase 10 (Q3 2027)
- [ ] Enterprise features
- [ ] SSO & SAML
- [ ] Custom AI model training
- [ ] White-label solution

---

## RELASI ANTAR CABANG:

1. **Core Features ↔ Tech Stack**: Fitur ditentukan oleh teknologi yang tersedia
2. **UX ↔ Core Features**: UX dirancang untuk mendukung semua fitur
3. **Database ↔ API**: Schema database menentukan structure API
4. **API ↔ Frontend**: Frontend consume API endpoints
5. **Monetisasi ↔ Features**: Fitur menentukan pricing tier
6. **Marketing ↔ Product**: Product harus ready sebelum marketing push
7. **Roadmap ↔ Current State**: Roadmap berdasarkan fitur yang sudah ada

---

## PRIORITAS (Saat Ini):

1. **Tinggi**: RAG Advanced & Document Management
2. **Sedang**: Mobile App & Offline Mode
3. **Rendah**: Enterprise Features & White-label

---

## STATUS SETIAP CABANG:

| Cabang | Status | Persentase |
|--------|--------|------------|
| 1. Core Features | ✅ Selesai | 100% |
| 2. UX/Design | ✅ Selesai | 95% |
| 3. Tech Stack | ✅ Selesai | 100% |
| 4. Database | ✅ Selesai | 100% |
| 5. API | ✅ Selesai | 100% |
| 6. Monetisasi | 🔄 Perencanaan | 30% |
| 7. Marketing | 🔄 Perencanaan | 20% |
| 8. Roadmap | 🔄 Berjalan | 40% |
