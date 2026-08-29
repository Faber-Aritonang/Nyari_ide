# DOKUMENTASI PROYEK: Nyari_ide
# Platform Chat AI Multimodal untuk Pengembangan Ide

========================================
Version: 2.1
Date: 29 Agustus 2026
Author: Faber Aritonang
Status: Active Development
========================================

---

## 1. RINGKASAN EKSEKUTIF

### 1.1 Latar Belakang

Nyari_ide (dari bahasa gaul: "nyari ide") lahir dari kebutuhan nyata akan sebuah tools yang membantu proses ideation secara end-to-end. Banyak aplikasi yang membantu satu aspek saja (chat AI, mindmap, atau project management), tetapi tidak ada yang menggabungkan semua dalam satu platform.

Proyek ini juga menjadi learning journey untuk membangun produk AI end-to-end: dari frontend, auth, database, integrasi LLM, hingga deployment — semuanya menggunakan teknologi open source dan gratis.

### 1.2 Tujuan

1. **Membangun platform ideation yang komprehensif**
   - Dari brainstorming hingga action plan dalam satu tools
   - AI-powered tapi personal (custom instructions, RAG)

2. **Membuktikan bahwa AI mutakhir bisa dimanfaatkan tanpa biaya besar**
   - Menggunakan LLM opensource via Groq API (gratis)
   - Deploy gratis di Vercel
   - Database gratis di Supabase

3. **Membangun produk yang benar-benar berguna**
   - Bukan hanya demo, tapi bisa dipakai nyata
   - Target 50+ pengguna aktif di tahun pertama

4. **Dokumentasi penuh untuk pembelajaran**
   - Semua keputusan desain didokumentasikan
   - Bisa dilanjutkan kapan saja dari device mana pun

### 1.3 Target User

| Segmen | Jumlah Estimasi | Kebutuhan Utama |
|--------|-----------------|-----------------|
| Entrepreneur & Startup | 1 juta | Cari ide bisnis, validasi, action plan |
| Product Manager & Designer | 500 ribu | Brainstorming fitur, dokumentasi produk |
| Mahasiswa & Pelajar | 5 juta | Ide tugas, skripsi, belajar kreatif |
| Content Creator | 1 juta | Ide konten, struktur konten |
| Tim Korporat | 500 ribu | Strategi bisnis, inovasi produk |
| **Total** | **8 juta** | |

### 1.4 Manfaat

**Untuk Individual:**
- Mempercepat proses ideation (dari jam → menit)
- Mengurangi kebuntuan kreatif (creative block)
- Mengubah ide abstrak menjadi action plan konkret
- Menyimpan dan mengelola ide secara terstruktur

**Untuk Tim:**
- Menyamakan pemahaman tentang ide
- Memudahkan sharing ide via link
- Mempercepat onboarding anggota baru
- Membangun knowledge base organisasi

**Untuk Ekosistem:**
- Membuktikan AI bisa dimanfaatkan untuk kreativitas
- Menumbuhkan budaya inovasi
- Membantu UMKM dan startup lokal

---

## 2. SPESIFIKASI SISTEM

### 2.1 Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                     NYARI_IDE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   FRONTEND (Client)                  │    │
│  │  Next.js 16 + TypeScript + Tailwind CSS             │    │
│  │  - Chat UI        - Settings Page                   │    │
│  │  - Documents UI   - Admin Page                      │    │
│  │  - Share Page     - Auth Pages                      │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │ HTTPS                            │
│  ┌───────────────────────▼─────────────────────────────┐    │
│  │              VERCEL EDGE NETWORK                    │    │
│  │  - Proxy (Middleware)                               │    │
│  │  - API Routes (Serverless Functions)                │    │
│  │  - Static Assets                                    │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                  │
│  ┌───────────────────────▼─────────────────────────────┐    │
│  │                API LAYER (Server)                    │    │
│  │  /api/chat         - Groq LLM Streaming             │    │
│  │  /api/rag/*        - Document & Embedding           │    │
│  │  /api/conversations - CRUD Percakapan               │    │
│  │  /api/settings     - Custom Instructions            │    │
│  │  /api/admin        - Whitelist Management           │    │
│  │  /api/transcribe   - Whisper STT                    │    │
│  │  /api/tts          - Orpheus TTS                    │    │
│  └───────┬─────────────────┬───────────────────────────┘    │
│          │                 │                                │
│  ┌───────▼───────┐ ┌──────▼──────┐ ┌──────────────────┐   │
│  │   SUPABASE    │ │  GROQ API   │ │ POLLINATIONS.AI  │   │
│  │   Database    │ │  (LLM/AI)   │ │ (Image Gen)      │   │
│  │   Auth        │ │             │ │                  │   │
│  │   Storage     │ │  - Qwen 3.8 │ │  - GPT Image 2   │   │
│  │   pgvector    │ │  - Whisper  │ │                  │   │
│  │               │ │  - Orpheus  │ │                  │   │
│  └───────────────┘ └─────────────┘ └──────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack

| Komponen | Teknologi | Alasan Pemilihan |
|----------|-----------|------------------|
| Frontend | Next.js 16 (App Router) | React ecosystem, SSR/SSG, deployment mudah |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Utility-first, responsive mudah |
| Database | Supabase (PostgreSQL) | Free tier generous, built-in auth |
| Vector DB | pgvector (Supabase) | Gratis, terintegrasi |
| Auth | Supabase Auth | Free, support email/password |
| LLM | Groq API | Gratis, cepat, opensource models |
| TTS | Groq Orpheus | Suara natural, gratis |
| STT | Whisper Large v3 Turbo | Akurat, cepat |
| Image Gen | Pollinations.ai | Gratis, tanpa API key |
| Hosting | Vercel | Free tier, edge functions |
| Version Control | Git + GitHub | Standard, gratis |

### 2.3 Fitur Utama

| Fitur | Deskripsi | Prioritas | Status |
|-------|-----------|-----------|--------|
| Chat AI Streaming | Bertanya jawab dengan AI, respons real-time | High | ✅ Done |
| Multimodal Input | Upload gambar, file, voice input | High | ✅ Done |
| Text-to-Image | Generate gambar dari teks | Medium | ✅ Done |
| Text-to-Speech | AI membacakan jawaban | Medium | ✅ Done |
| Model Selector | Pilih model AI (4 opsi) | Medium | ✅ Done |
| Conversation History | Riwayat chat tersimpan | High | ✅ Done |
| Dark/Light Mode | Toggle tema gelap/terang | Low | ✅ Done |
| Bilingual UI | Indonesia & English | Medium | ✅ Done |
| Responsive Design | Mobile, tablet, desktop | High | ✅ Done |
| Custom Instructions | Atur preferensi AI | Medium | ✅ Done |
| Share Link | Bagikan percakapan | Medium | ✅ Done |
| RAG (Knowledge Base) | AI ingat dokumen & chat | High | ✅ Done |
| Admin Whitelist | Manage akses user | High | ✅ Done |
| Keyboard Shortcuts | Akses cepat tanpa mouse | Low | ✅ Done |
| Export Chat | Export ke Markdown/PDF | Low | ✅ Done |

---

## 3. DATABASE DESIGN

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐
│   allowed_emails  │     │      users       │
│   (whitelist)     │     │   (auth.users)   │
├──────────────────┤     ├──────────────────┤
│ id (UUID, PK)    │     │ id (UUID, PK)    │
│ email (TEXT)     │     │ email (TEXT)     │
│ invited_by (TEXT)│     │ created_at       │
│ created_at       │     └────────┬─────────┘
└──────────────────┘              │
                                  │ 1
                                  │
                                  │ N
┌──────────────────┐     ┌────────▼─────────┐
│ custom_           │     │  conversations   │
│ instructions     │     ├──────────────────┤
├──────────────────┤     │ id (UUID, PK)    │
│ id (UUID, PK)    │     │ user_id (UUID)   │
│ user_id (UUID)   │     │ title (TEXT)     │
│ instructions     │     │ created_at       │
│ created_at       │     └────────┬─────────┘
│ updated_at       │              │
└──────────────────┘              │ 1
                                  │
                                  │ N
                         ┌────────▼─────────┐
                         │     messages      │
                         ├──────────────────┤
                         │ id (UUID, PK)    │
                         │ conversation_id  │
                         │ role (TEXT)      │
                         │ content (TEXT)   │
                         │ image_url (TEXT) │
                         │ created_at       │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    documents      │     │ document_chunks  │
├──────────────────┤     ├──────────────────┤
│ id (UUID, PK)    │ 1 N │ id (UUID, PK)    │
│ user_id (UUID)   │◄───►│ document_id      │
│ title (TEXT)     │     │ user_id (UUID)   │
│ filename (TEXT)  │     │ chunk_index      │
│ content (TEXT)   │     │ content (TEXT)   │
│ file_type (TEXT) │     │ token_count      │
│ file_size (INT)  │     │ created_at       │
│ chunk_count      │     └──────────────────┘
│ created_at       │              │
│ updated_at       │              │ 1
└──────────────────┘              │
                                  │ N
                         ┌────────▼─────────┐
                         │    embeddings     │
                         ├──────────────────┤
                         │ id (UUID, PK)    │
                         │ chunk_id (UUID)  │
                         │ user_id (UUID)   │
                         │ embedding (VEC)  │
                         │ source_type      │
                         │ source_id (UUID) │
                         │ content (TEXT)   │
                         │ metadata (JSONB) │
                         │ created_at       │
                         └──────────────────┘

┌──────────────────┐
│   share_links     │
├──────────────────┤
│ id (UUID, PK)    │
│ conversation_id  │
│ user_id (UUID)   │
│ token (TEXT)     │
│ is_public (BOOL) │
│ created_at       │
│ expires_at       │
└──────────────────┘
```

### 3.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_user ON document_chunks(user_id);
CREATE INDEX idx_embeddings_user ON embeddings(user_id);
CREATE INDEX idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX idx_share_links_token ON share_links(token);

-- Vector search index (HNSW)
CREATE INDEX idx_embeddings_vector ON embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 3.3 Row Level Security (RLS)

```sql
-- Users只能管理自己的数据
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own documents" ON documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public read for shared links" ON share_links
  FOR SELECT TO anon
  USING (is_public = true);
```

---

## 4. API ENDPOINTS

### 4.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login dengan email & password |
| POST | /api/auth/register | Register (harus ada di whitelist) |
| POST | /api/auth/logout | Logout |

### 4.2 Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat | Streaming chat dengan Groq API |
| GET | /api/models | List model yang tersedia |

**Request Body POST /api/chat:**
```json
{
  "conversationId": "uuid",
  "message": "Bantu saya brainstorming ide bisnis",
  "model": "qwen/qwen3.8-27b",
  "imageUrl": "data:image/jpeg;base64,...",
  "fileContext": "Isi dari file yang di-upload..."
}
```

**Response (SSE Stream):**
```
data: {"content": "Tentu"}
data: {"content": "! "}
data: {"content": "Berikut"}
data: [DONE]
```

### 4.3 Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/conversations | List semua percakapan user |
| POST | /api/conversations | Buat percakapan baru |
| DELETE | /api/conversations/[id] | Hapus percakapan |
| GET | /api/conversations/[id]/messages | Ambil semua pesan |

### 4.4 RAG (Retrieval-Augmented Generation)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rag/documents | List dokumen user |
| POST | /api/rag/documents | Upload & index dokumen baru |
| DELETE | /api/rag/documents/[id] | Hapus dokumen |

**Request Body POST /api/rag/documents:**
```json
{
  "title": "Ide Bisnis Startup",
  "content": "Isi dokumen dalam format teks...",
  "filename": "ide-bisnis.txt",
  "file_type": "txt"
}
```

### 4.5 Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/conversations/[id]/share | Generate share link |
| DELETE | /api/conversations/[id]/share | Hapus share link |
| GET | /api/shared/[token] | Akses percakapan publik |

### 4.6 Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings/instructions | Ambil custom instructions |
| POST | /api/settings/instructions | Simpan custom instructions |

### 4.7 Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/transcribe | Whisper STT (voice → text) |
| POST | /api/tts | Orpheus TTS (text → voice) |

### 4.8 Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/whitelist | List semua whitelist email |
| POST | /api/admin/whitelist | Tambah email ke whitelist |
| DELETE | /api/admin/whitelist | Hapus email dari whitelist |

---

## 5. UI/UX DESIGN

### 5.1 Halaman Utama

**Chat Page (/chat)**
```
┌─────────────────────────────────────────────────────────┐
│  ☰ Nyari_ide                        [dark/light] [ID] │
├──────────────┬──────────────────────────────────────────┤
│ SIDEBAR      │  CHAT AREA                              │
│              │                                          │
│ [+ Baru]     │  ┌──────────────────────────────────┐   │
│              │  │ User: Bantu saya brainstorming...  │   │
│ Percakapan 1 │  └──────────────────────────────────┘   │
│ Percakapan 2 │                                          │
│ Percakapan 3 │  ┌──────────────────────────────────┐   │
│ ...          │  │ AI: Tentu! Berikut beberapa ide:   │   │
│              │  │ 1. Platform belajar coding         │   │
│              │  │ 2. Marketplace UMKM lokal          │   │
│              │  │ 3. Aplikasi produktivitas          │   │
│              │  └──────────────────────────────────┘   │
│              │                                          │
│ ─────────── │  ┌──────────────────────────────────┐   │
│ ⚙️ Settings  │  │ [📎] [🎤] [🖼️] Ketik pesan... [→]│   │
│ 📚 Documents │  └──────────────────────────────────┘   │
│ 🔐 Admin     │                                          │
│ 📥 Export     │                                          │
│ 🔗 Share      │                                          │
│ 🔒 Logout     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Settings Page (/settings)**
```
┌─────────────────────────────────────────────────────────┐
│  ← Nyari_ide              Pengaturan            [EN]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ⚙️ Instruksi Kustom                               │   │
│  │                                                    │   │
│  │ Tentukan bagaimana AI harus merespons Anda.       │   │
│  │ Instruksi ini akan ditambahkan ke setiap chat.    │   │
│  │                                                    │   │
│  │ ┌──────────────────────────────────────────────┐  │   │
│  │ │ Jawab selalu dalam bahasa Inggris.           │  │   │
│  │ │ Gunakan gaya formal dan terstruktur.         │  │   │
│  │ │ Fokus pada topik teknologi dan bisnis.       │  │   │
│  │ │ Berikan contoh konkret untuk setiap ide.     │  │   │
│  │ └──────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  │ 0/2000 karakter                    [Simpan]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Preview (System Prompt)                           │   │
│  │                                                    │   │
│  │ Kamu adalah Nyari_ide, asisten AI yang membantu. │   │
│  │                                                    │   │
│  │ instruksi kustom:                                  │   │
│  │ Jawab selalu dalam bahasa Inggris...              │   │
│  │                                                    │   │
│  │ Jawab dengan singkat, jelas, dan membantu.        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Navigasi

| Halaman | URL | Deskripsi |
|---------|-----|-----------|
| Chat | /chat | Halaman utama, area chat |
| Settings | /settings | Pengaturan custom instructions |
| Documents | /rag/documents | Manage knowledge base |
| Admin | /admin | Manage whitelist (admin only) |
| Shared | /shared/[token] | View percakapan publik |
| Login | /login | Halaman login |
| Register | /register | Halaman register |
| Dashboard | /dashboard | Dashboard placeholder |

### 5.3 Color Scheme

**Light Mode:**
- Background: #ffffff (white)
- Surface: #f9fafb (gray-50)
- Text: #111827 (gray-900)
- Primary: #3b82f6 (blue-500)
- Border: #e5e7eb (gray-200)

**Dark Mode:**
- Background: #111827 (gray-900)
- Surface: #1f2937 (gray-800)
- Text: #f9fafb (gray-50)
- Primary: #3b82f6 (blue-500)
- Border: #374151 (gray-700)

### 5.4 Typography

- Heading: Inter or system font
- Body: Inter or system font
- Code: JetBrains Mono or monospace

### 5.5 Responsive Breakpoints

- Mobile: < 768px (sidebar collapsed, hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsible)
- Desktop: > 1024px (sidebar visible)

---

## 6. DEPLOYMENT

### 6.1 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx

# OpenAI (optional, untuk embeddings)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# App Config
NEXT_PUBLIC_SITE_URL=https://nyari-ide.vercel.app
```

### 6.2 Hosting

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://nyari-ide.vercel.app |
| Database | Supabase | https://supabase.com/dashboard |
| Version Control | GitHub | https://github.com/Faber-Aritonang/Nyari_ide |

### 6.3 CI/CD

- **Repository**: GitHub (Faber-Aritonang/Nyari_ide)
- **Branch Strategy**:
  - `main` → Production (auto-deploy to Vercel)
  - `dev` → Development (preview deployment)
- **Auto-deploy**: Ya, setiap push ke main
- **Preview**: Ya, setiap pull request

### 6.4 Monitoring

- **Vercel Analytics**: Performance monitoring
- **Vercel Logs**: Error tracking & debugging
- **Supabase Dashboard**: Database monitoring
- **GitHub Issues**: Bug tracking

---

## 7. TIM & PERAN

| Nama | Role | Tanggung Jawab |
|------|------|----------------|
| Faber Aritonang | Founder & Developer | Product vision, development, deployment |
| AI Assistant (Codebuff) | Development Support | Code generation, debugging, documentation |

---

## 8. TIMELINE

### Phase 0: Fondasi (Agustus 2026)
- [x] Setup project Next.js
- [x] Setup Supabase
- [x] Dokumentasi awal
- [x] Deploy ke Vercel

### Phase 1: Autentikasi (Agustus 2026)
- [x] Login & Register
- [x] Whitelist system
- [x] Middleware protection

### Phase 2: Chat Text (Agustus 2026)
- [x] Groq API integration
- [x] Streaming response
- [x] Conversation history

### Phase 3: Multimodal (Agustus 2026)
- [x] Upload gambar & vision
- [x] Upload file & PDF
- [x] Text-to-image
- [x] Voice input & TTS

### Phase 4: Polesan v1.0 (Agustus 2026)
- [x] Model selector
- [x] Dark/Light mode
- [x] Responsive design
- [x] Admin page

### Phase 5: v1.1 Features (Agustus 2026)
- [x] Regenerate jawaban
- [x] Copy & Edit message
- [x] Export chat
- [x] Keyboard shortcuts

### Phase 6: v2.0 Features (Agustus 2026)
- [x] Custom instructions
- [x] Share link

### Phase 7: v2.1 RAG (Agustus 2026)
- [x] Document upload & indexing
- [x] Vector search (pgvector)
- [x] Conversation memory
- [x] RAG documents page

### Phase 8: Growth (Q4 2026)
- [ ] Landing page marketing
- [ ] SEO optimization
- [ ] Social media presence
- [ ] User feedback loop

### Phase 9: Advanced Features (Q1 2027)
- [ ] Advanced RAG (multi-doc, reranking)
- [ ] Image gallery
- [ ] Multi-language TTS
- [ ] Conversation search

---

## 9. RISIKO & MITIGASI

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|--------------|--------|----------|
| Groq API rate limit | Sedang | Besar | Cache, fallback ke model lain |
| Supabase free tier limit | Sedang | Besar | Optimize queries, archive data |
| Vercel cold start | Tinggi | Kecil | Edge functions, keep-alive |
| OpenAI API cost (RAG) | Rendah | Sedang | TF-IDF fallback |
| Security breach | Rendah | Besar | RLS, server-side only |
| User adoption low | Sedang | Besar | Content marketing, SEO |

---

## 10. CATATAN & REVISI

### Revisi 1.0 (15 Agustus 2026)
- Initial release
- Core chat features
- Multimodal support

### Revisi 1.1 (28 Agustus 2026)
- Added regenerate, copy, edit
- Export to Markdown/PDF
- Keyboard shortcuts

### Revisi 2.0 (29 Agustus 2026)
- Custom instructions
- Share link

### Revisi 2.1 (29 Agustus 2026)
- RAG Hybrid (document + conversation memory)
- pgvector integration
- Document management page

---

## 11. LAMPIRAN

### 11.1 Link Penting

| Resource | URL |
|----------|-----|
| App | https://nyari-ide.vercel.app |
| GitHub | https://github.com/Faber-Aritonang/Nyari_ide |
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| Groq | https://console.groq.com |

### 11.2 API Documentation

Lihat bagian 4 di dokumen ini atau di folder `/docs/api-notes.md`

### 11.3 Database Schema

Lihat bagian 3 di dokumen ini atau di `/supabase/schema.sql`

### 11.4 Design Decisions

Semua keputusan desain didokumentasikan di `/docs/design-decisions.md`

---

*Document generated by Nyari_ide AI Assistant*
*Last updated: 29 Agustus 2026*
