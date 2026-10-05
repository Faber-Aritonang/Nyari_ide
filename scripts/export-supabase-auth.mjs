// scripts/export-supabase-auth.mjs — Ambil hash password dari auth.users Supabase
//
// API admin Supabase TIDAK mengembalikan encrypted_password, jadi ambil lewat
// koneksi Postgres langsung. Data hasilnya digabung ke migration/data.json.
//
// Cara pakai:
//   SUPABASE_DB_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
//     node scripts/export-supabase-auth.mjs
//
// Ambil string-nya di Supabase Dashboard → Project Settings → Database →
// Connection string → **Session pooler** (IPv4, port 5432).

import { Pool } from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const DB_URL = process.env.SUPABASE_DB_URL || process.env.SUPABASE_POOLER_URL;

if (!DB_URL) {
  console.error(
    "❌ Set SUPABASE_DB_URL (Session pooler connection string dari Supabase Dashboard)."
  );
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync("migration/data.json", "utf8"));
} catch {
  console.error("❌ migration/data.json tidak ada. Jalankan scripts/export-supabase.mjs dulu.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  max: 2,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("🔑 Mengambil hash password dari auth.users ...");

  const { rows } = await pool.query(
    `SELECT id, email, encrypted_password, email_confirmed_at, created_at, updated_at
     FROM auth.users`
  );

  const byEmail = new Map(rows.map((r) => [r.email?.toLowerCase(), r]));
  let filled = 0;

  for (const user of data.users) {
    const row = byEmail.get(user.email?.toLowerCase());
    if (!row) continue;

    if (row.encrypted_password) {
      user.encrypted_password = row.encrypted_password;
      filled++;
    }
    if (!user.created_at && row.created_at) user.created_at = row.created_at;
    if (!user.updated_at && row.updated_at) user.updated_at = row.updated_at;
    if (row.email_confirmed_at) user.email_confirmed = true;
  }

  writeFileSync("migration/data.json", JSON.stringify(data, null, 2));

  console.log(`✅ Hash password ditambahkan: ${filled}/${data.users.length} user`);
  if (filled < data.users.length) {
    console.log("ℹ️  User sisanya perlu di-set password manual:");
    console.log("   node --env-file=.env.local scripts/set-password.mjs <email> <password-baru>");
  }
} catch (err) {
  console.error(`❌ Gagal: ${err.message}`);
  process.exit(1);
} finally {
  await pool.end();
}
