// scripts/set-password.mjs — Set / reset password user di Neon
//
// Dipakai setelah migrasi untuk user yang hash password lamanya tidak terbawa
// (Supabase tidak mengekspos encrypted_password lewat API admin).
//
// Cara pakai:
//   node --env-file=.env.local scripts/set-password.mjs email@contoh.com passwordBaru123

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const [email, password] = process.argv.slice(2);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diisi di .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error("❌ Cara pakai: node --env-file=.env.local scripts/set-password.mjs <email> <password>");
  process.exit(1);
}
if (password.length < 6) {
  console.error("❌ Password minimal 6 karakter");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 2 });

try {
  const { rows } = await pool.query(
    'SELECT id, email FROM "user" WHERE lower(email) = $1',
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0) {
    console.error(`❌ User ${email} tidak ditemukan. Tambahkan emailnya ke allowed_emails lalu daftar ulang.`);
    process.exit(1);
  }

  const userId = rows[0].id;
  const hash = await bcrypt.hash(password, 10);

  // Cari account credential untuk user ini (kolom bisa camelCase / snake_case)
  const { rows: acctRows } = await pool.query(
    `SELECT * FROM account WHERE "userId" = $1 OR user_id = $1 LIMIT 1`,
    [userId]
  );

  if (acctRows.length > 0) {
    const acct = acctRows[0];
    const passwordCol = "password" in acct ? "password" : "password";
    const userCol = "userId" in acct ? "userId" : "user_id";
    await pool.query(
      `UPDATE account SET "${passwordCol}" = $2, "updatedAt" = NOW() WHERE "${userCol}" = $1`,
      [userId, hash]
    );
  } else {
    const now = new Date();
    await pool.query(
      `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $2, 'credential', $3, $4, $4)`,
      [randomUUID(), userId, hash, now]
    );
  }

  console.log(`✅ Password untuk ${email} berhasil di-set.`);
} catch (err) {
  console.error(`❌ Gagal: ${err.message}`);
  process.exit(1);
} finally {
  await pool.end();
}
