# Setup Guide — Nyari_ide

## Prasyarat
- Node.js ≥ 18
- API key Groq ✅
- Akun Supabase (gratis): https://supabase.com
- Akun Vercel (gratis): https://vercel.com

## Langkah FASE 0

### 1. Clone repo
git clone https://github.com/Faber-Aritonang/Nyari_ide.git
cd Nyari_ide

### 2. Init Next.js
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

### 3. Install dependencies utama
npm install @supabase/supabase-js @supabase/ssr react-markdown

### 4. Setup Supabase
1. Buat project baru di supabase.com (region Singapore)
2. SQL Editor → jalankan isi supabase/schema.sql
3. Catat: Project URL, anon key, service_role key
4. Authentication → disable "Enable email confirmations" (untuk dev)

### 5. Environment variables
cp .env.example .env.local
→ isi nilai asli. JANGAN commit .env.local!

### 6. Jalankan lokal
npm run dev → http://localhost:3000

### 7. Deploy Vercel
1. vercel.com → Import repo Nyari_ide
2. Tambahkan env vars yang sama seperti .env.local
3. Deploy ✅ MILESTONE 1
