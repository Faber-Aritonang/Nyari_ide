# Setup Guide — Nyari_ide

## Prasyarat
- Node.js ≥ 18
- API key Anthropic ✅ (untuk LLM chat + vision)
- API key Groq ✅ (untuk TTS Orpheus + voice input Whisper)
- Akun Neon (gratis): https://neon.tech — PostgreSQL serverless + pgvector
- Akun Vercel (gratis): https://vercel.com

## Langkah setup

### 1. Clone repo
git clone https://github.com/Faber-Aritonang/Nyari_ide.git
cd Nyari_ide

### 2. Install dependencies
npm install

### 3. Setup database Neon
1. Buat project baru di console.neon.tech (pilih region Singapore agar dekat)
2. Ambil **pooled connection string** (Connect → Pooled connection) —
   host-nya mengandung `-pooler`. Simpan untuk `DATABASE_URL`.
3. Isi `.env.local` (lihat langkah 4), lalu jalankan:

```bash
# 1) Generate skema auth Better Auth ke file SQL
#    (butuh DATABASE_URL live karena CLI memeriksa skema yang ada)
DATABASE_URL="<url-neon-kamu>" npx auth@latest generate --output neon/auth-schema.sql --yes

# 2) Terapkan tabel auth + tabel app + pgvector + fungsi search_embeddings
node --env-file=.env.local scripts/apply-schema.mjs neon/auth-schema.sql neon/schema.sql
```

Cek hasilnya kapan saja dengan `node --env-file=.env.local scripts/verify-neon.mjs`.

### 4. Environment variables
cp .env.example .env.local
→ isi nilai asli. JANGAN commit .env.local!

Variabel wajib:
| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Pooled connection string dari Neon |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` saat dev, domain saat production |
| `NEXT_PUBLIC_SITE_URL` | URL publik app (dipakai link share) |
| `ANTHROPIC_API_KEY` | LLM chat + vision (streaming) — wajib untuk fitur chat |
| `GROQ_API_KEY` | TTS (Orpheus) + voice input (Whisper) — wajib untuk fitur suara |

Opsional: `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (text-to-image),
`OPENAI_API_KEY` (embedding RAG berkualitas; tanpa ini pakai embedding hash lokal),
`RESEND_API_KEY` + `RESEND_FROM` (kirim email reset password; lihat langkah 8).

### 5. Seed admin & whitelist
Aplikasi memakai whitelist maksimal 10 email (`allowed_emails`).
Tambahkan email pertama (termasuk email admin) langsung via SQL:

```sql
INSERT INTO allowed_emails (email) VALUES ('email-kamu@gmail.com');
```

Email admin didefinisikan di `lib/auth.ts` (`ADMIN_EMAIL`) — hanya email itu
yang bisa membuka `/admin` dan `/api/admin/whitelist`.

### 6. Jalankan lokal
npm run dev → http://localhost:3000

### 7. Deploy Vercel
1. vercel.com → Import repo Nyari_ide
2. Tambahkan env vars yang sama seperti `.env.local`
3. Deploy ✅

### 8. Reset password (lupa password)
Aplikasi menyediakan alur lupa password Better Auth:
`/forgot-password` → email berisi link → `/reset-password`.

- **Dengan email**: isi `RESEND_API_KEY` (dan `RESEND_FROM` bila punya domain)
  agar link dikirim otomatis via Resend.
- **Tanpa email**: link dicatat di log server dengan prefix `[auth] LINK RESET
  PASSWORD`. Admin menyalin link tersebut dan mengirimkannya ke user.

Alur ini juga membuat baris `account` (credential) bila belum ada, sehingga user
lama hasil migrasi yang password-nya tidak terbawa tetap bisa masuk setelah
melakukan reset sekali.

### (Opsional) Migrasi data dari Supabase lama
Jalankan saat project Supabase masih aktif:

```bash
node --env-file=.env.local scripts/export-supabase.mjs   # → migration/data.json
node --env-file=.env.local scripts/import-neon.mjs       # → Neon
```

Catatan penting: API admin Supabase **tidak** mengembalikan `encrypted_password`,
sehingga hash password lama umumnya tidak bisa diimpor (skrip melaporkan
`password terimpor: 0/N`). User lama tetap ada beserta seluruh data & ID-nya,
tetapi harus melakukan **reset password** (langkah 8) satu kali agar bisa login.
User dengan email sama tidak bisa mendaftar ulang, karena email sudah terpakai.

Alternatif bila masih punya akses langsung ke database Supabase: isi
`SUPABASE_DB_URL` (connection string *Session pooler* + password DB) lalu jalankan
`node --env-file=.env.local scripts/export-supabase-auth.mjs` untuk menarik hash
aslinya sebelum impor. Untuk set password manual satu user:
`node --env-file=.env.local scripts/set-password.mjs <email> <password>`.
