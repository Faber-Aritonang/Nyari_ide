// scripts/import-neon.mjs — Impor data lama ke Neon (PostgreSQL)
//
// Urutan yang benar:
//   1. DATABASE_URL (Neon) sudah diisi di .env.local
//   2. npx auth@latest migrate          ← buat tabel auth Better Auth
//   3. node --env-file=.env.local scripts/import-neon.mjs
//
// Skrip ini akan:
//   - Menjalankan neon/schema.sql (tabel app + pgvector + search_embeddings)
//   - Membuat user Better Auth dari auth.users lama (password bcrypt diimpor)
//   - Mengisi semua tabel app (ID lama dipertahankan, jadi FK tetap valid)

import { Pool } from "pg";
import { readFileSync } from "node:fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL (Neon) belum diisi di .env.local");
  process.exit(1);
}

let raw;
try {
  raw = readFileSync("migration/data.json", "utf8");
} catch {
  console.error("❌ migration/data.json tidak ada. Jalankan scripts/export-supabase.mjs dulu.");
  process.exit(1);
}
const data = JSON.parse(raw);

const pool = new Pool({ connectionString: DATABASE_URL, max: 3 });

// Kolom vektor & json perlu cast eksplisit
const CASTS = {
  vector: "::vector",
  json: "::jsonb",
  jsonb: "::jsonb",
};

async function tableColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return rows;
}

function pickColumn(cols, candidates) {
  for (const c of candidates) {
    const found = cols.find((col) => col.column_name === c);
    if (found) return found;
  }
  return null;
}

async function importTable(client, table, rows) {
  if (!rows || rows.length === 0) {
    console.log(`   ⏭️  ${table}: kosong, dilewati`);
    return 0;
  }

  const cols = await tableColumns(client, table);
  if (cols.length === 0) {
    console.error(`   ❌ ${table}: tabel tidak ditemukan di Neon`);
    return 0;
  }

  // Union semua key dari data + mapping ke kolom target
  const keyUnion = new Set();
  for (const row of rows) for (const k of Object.keys(row)) keyUnion.add(k);

  const colMap = []; // { source, target, cast }
  const missing = [];
  for (const key of keyUnion) {
    const target = cols.find((col) => col.column_name === key);
    if (!target) {
      missing.push(key);
      continue;
    }
    const cast = CASTS[target.data_type] || "";
    colMap.push({ source: key, target: target.column_name, cast });
  }

  if (missing.length > 0) {
    console.log(`   ℹ️  ${table}: kolom tanpa padanan (dilewati): ${missing.join(", ")}`);
  }

  let inserted = 0;
  for (const row of rows) {
    const targets = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const { source, target, cast } of colMap) {
      if (row[source] === undefined) continue;
      targets.push(`"${target}"`);
      placeholders.push(`$${i}${cast}`);
      let value = row[source];
      // pg menerima array JS untuk text[]; untuk lainnya kirim apa adanya
      values.push(value);
      i++;
    }

    if (targets.length === 0) continue;

    const sql = `INSERT INTO "${table}" (${targets.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT DO NOTHING`;
    try {
      await client.query(sql, values);
      inserted++;
    } catch (err) {
      console.error(`   ⚠️  ${table} baris gagal: ${err.message.split("\n")[0]}`);
    }
  }

  console.log(`   ✅ ${table}: ${inserted}/${rows.length} baris diimpor`);
  return inserted;
}

const client = await pool.connect();
try {
  console.log("🚀 Impor ke Neon dimulai...\n");

  // 1. Schema app (idempotent)
  console.log("📄 Menjalankan neon/schema.sql ...");
  const schemaSql = readFileSync("neon/schema.sql", "utf8");
  try {
    await client.query(schemaSql);
    console.log("   ✅ Schema siap\n");
  } catch (err) {
    console.error(`   ❌ Schema gagal: ${err.message}`);
    console.error("   → Pastikan 'npx auth@latest migrate' sudah dijalankan dulu (tabel \"user\" dibutuhkan FK).");
    process.exit(1);
  }

  // 2. User Better Auth dari auth.users lama
  console.log(`👤 Membuat ${data.users.length} user Better Auth ...`);
  const userCols = await tableColumns(client, "user");
  const accountCols = await tableColumns(client, "account");

  const userFields = {
    id: pickColumn(userCols, ["id"]),
    name: pickColumn(userCols, ["name"]),
    email: pickColumn(userCols, ["email"]),
    emailVerified: pickColumn(userCols, ["emailVerified", "email_verified"]),
    createdAt: pickColumn(userCols, ["createdAt", "created_at"]),
    updatedAt: pickColumn(userCols, ["updatedAt", "updated_at"]),
  };
  const accountFields = {
    id: pickColumn(accountCols, ["id"]),
    userId: pickColumn(accountCols, ["userId", "user_id"]),
    accountId: pickColumn(accountCols, ["accountId", "account_id"]),
    providerId: pickColumn(accountCols, ["providerId", "provider_id"]),
    password: pickColumn(accountCols, ["password"]),
    createdAt: pickColumn(accountCols, ["createdAt", "created_at"]),
    updatedAt: pickColumn(accountCols, ["updatedAt", "updated_at"]),
  };

  let usersOk = 0;
  let passwordsOk = 0;
  for (const u of data.users) {
    try {
      const { rows } = await client.query('SELECT id FROM "user" WHERE id = $1', [u.id]);
      if (rows.length === 0) {
        const cols = ["id", "name", "email"].map((f) => userFields[f]).filter(Boolean);
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        const values = [u.id, u.name || u.email?.split("@")[0] || "User", u.email];
        if (userFields.emailVerified) {
          cols.push(userFields.emailVerified);
          placeholders.push(`$${cols.length}`);
          values.push(!!u.email_confirmed);
        }
        if (userFields.createdAt) {
          cols.push(userFields.createdAt);
          placeholders.push(`$${cols.length}`);
          values.push(u.created_at ? new Date(u.created_at) : new Date());
        }
        if (userFields.updatedAt) {
          cols.push(userFields.updatedAt);
          placeholders.push(`$${cols.length}`);
          values.push(u.updated_at ? new Date(u.updated_at) : new Date());
        }
        await client.query(
          `INSERT INTO "user" (${cols.map((c) => `"${c.column_name}"`).join(", ")}) VALUES (${placeholders.join(", ")})`,
          values
        );
        usersOk++;
      }

      // Account credential (password)
      if (accountFields.password && u.encrypted_password) {
        const { rows: acctRows } = await client.query(
          'SELECT id FROM "account" WHERE "userId" = $1 OR user_id = $1 LIMIT 1',
          [u.id]
        );
        if (acctRows.length === 0) {
          const cols = [];
          const values = [];
          const add = (field, value) => {
            if (!field) return;
            cols.push(`"${field.column_name}"`);
            values.push(value);
          };
          const now = new Date();
          add(accountFields.id, crypto.randomUUID());
          add(accountFields.userId, u.id);
          add(accountFields.accountId, u.id);
          add(accountFields.providerId, "credential");
          add(accountFields.password, u.encrypted_password);
          add(accountFields.createdAt, now);
          add(accountFields.updatedAt, now);
          await client.query(
            `INSERT INTO "account" (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
            values
          );
          passwordsOk++;
        }
      }
    } catch (err) {
      console.error(`   ⚠️  user ${u.email}: ${err.message.split("\n")[0]}`);
    }
  }
  console.log(`   ✅ User dibuat: ${usersOk} | password terimpor: ${passwordsOk}/${data.users.length}`);
  if (passwordsOk < data.users.length) {
    console.log("   ℹ️  User tanpa password terimpor perlu daftar ulang (email masih di whitelist).");
  }

  // 3. Tabel app
  console.log("\n📦 Impor tabel app ...");
  for (const [table, rows] of Object.entries(data.tables)) {
    await importTable(client, table, rows);
  }

  console.log("\n✅ MIGRASI SELESAI. Verifikasi lalu jalankan app: npm run dev");
} finally {
  client.release();
  await pool.end();
}
