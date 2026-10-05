// scripts/export-supabase.mjs — Ekspor data dari Supabase ke migration/data.json
//
// Cara pakai (Supabase masih aktif):
//   node --env-file=.env.local scripts/export-supabase.mjs
//
// Membutuhkan env di .env.local:
//   NEXT_PUBLIC_SUPABASE_URL      → URL project Supabase lama
//   SUPABASE_SERVICE_ROLE_KEY     → service role key (dashboard → Settings → API)
//
// Output: migration/data.json (JANGAN di-commit — berisi data user!)

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const TABLES = [
  "allowed_emails",
  "conversations",
  "messages",
  "custom_instructions",
  "share_links",
  "saved_prompts",
  "documents",
  "document_chunks",
  "embeddings",
];

async function exportTable(name) {
  const allRows = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(name)
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`   ⚠️  ${name}: ${error.message}`);
      return allRows;
    }

    allRows.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return allRows;
}

async function exportAuthUsers() {
  const users = [];
  let page = 1;
  const PER_PAGE = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error(`   ⚠️  auth.users: ${error.message}`);
      break;
    }
    users.push(...(data.users || []));
    if (!data.users || data.users.length < PER_PAGE) break;
    page++;
  }
  return users;
}

console.log("🚀 Ekspor dimulai...\n");

const users = await exportAuthUsers();
console.log(`👤 auth.users: ${users.length} user`);

const data = { exported_at: new Date().toISOString(), users: [], tables: {} };

// --- Users ---
data.users = users.map((u) => ({
  id: u.id,
  email: u.email,
  name:
    u.user_metadata?.full_name ||
    u.user_metadata?.name ||
    (u.email ? u.email.split("@")[0] : "User"),
  email_confirmed: !!u.email_confirmed_at,
  created_at: u.created_at,
  updated_at: u.updated_at,
  // Hash bcrypt dari Supabase ($2a$...) — kompatibel dengan bcryptjs di app baru.
  // Jika null, user tsb perlu daftar ulang setelah migrasi.
  encrypted_password: u.encrypted_password || null,
}));

const withPassword = data.users.filter((u) => u.encrypted_password).length;
console.log(`🔑 User dengan hash password bisa diimpor: ${withPassword}/${data.users.length}`);

// --- Tabel ---
for (const table of TABLES) {
  const rows = await exportTable(table);
  data.tables[table] = rows;

  const keyUnion = new Set();
  for (const row of rows) for (const key of Object.keys(row)) keyUnion.add(key);
  console.log(`📦 ${table}: ${rows.length} baris | kolom: [${[...keyUnion].join(", ")}]`);
}

mkdirSync("migration", { recursive: true });
writeFileSync("migration/data.json", JSON.stringify(data, null, 2));

console.log(`\n✅ Selesai → migration/data.json`);
console.log("⚠️  File ini berisi data + hash password. Jangan dibagikan / di-commit.");
