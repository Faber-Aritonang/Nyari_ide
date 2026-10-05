// scripts/apply-schema.mjs — Jalankan file .sql ke database Neon
//
// Cara pakai:
//   node --env-file=.env.local scripts/apply-schema.mjs neon/auth-schema.sql neon/schema.sql

import { Pool } from "pg";
import { readFileSync } from "node:fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diisi di .env.local");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("❌ Sebutkan file .sql yang mau dijalankan");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 2 });

try {
  for (const file of files) {
    const sql = readFileSync(file, "utf8");
    process.stdout.write(`📄 ${file} ... `);
    await pool.query(sql);
    console.log("✅");
  }
  console.log("\n✅ Semua schema diterapkan.");
} catch (err) {
  console.error(`\n❌ Gagal: ${err.message}`);
  process.exit(1);
} finally {
  await pool.end();
}
