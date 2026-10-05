// lib/db.ts — Koneksi Postgres (Neon) via node-postgres
// Pengganti lib/supabase/* — semua query database lewat sini.

import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

/**
 * Pool tunggal untuk seluruh app.
 * Gunakan *pooled connection string* dari Neon (ada `-pooler` di host-nya)
 * supaya cocok untuk lingkungan serverless seperti Vercel.
 */
export const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

/** Jalankan query, kembalikan semua rows */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params as never[]);
  return result.rows as T[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cek apakah string adalah UUID valid (untuk param path [id]) */
export function isUuid(v: string | undefined | null): boolean {
  return !!v && UUID_RE.test(v);
}

/** Jalankan query, kembalikan row pertama atau null */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
