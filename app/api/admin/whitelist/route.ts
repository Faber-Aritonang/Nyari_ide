// app/api/admin/whitelist/route.ts — Kelola whitelist email (khusus admin)
// GET: list semua email, POST: tambah email, DELETE: hapus email

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, type AuthUser } from "@/lib/session";
import { ADMIN_EMAIL } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

interface WhitelistEntry {
  id: string;
  email: string;
  invited_by: string | null;
  created_at: string;
}

/** Endpoint ini hanya boleh diakses admin */
async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) return null;
  return user;
}

// GET /api/admin/whitelist — List semua whitelisted emails
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await query<WhitelistEntry>(
      "SELECT * FROM allowed_emails ORDER BY created_at ASC"
    );
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Failed to list whitelist:", error);
    return NextResponse.json({ error: "Failed to fetch whitelist" }, { status: 500 });
  }
}

// POST /api/admin/whitelist — Tambah email ke whitelist
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, invited_by } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    // Cek apakah email sudah ada
    const existing = await queryOne(
      "SELECT id FROM allowed_emails WHERE lower(email) = $1",
      [normalized]
    );

    if (existing) {
      return NextResponse.json({ error: "Email sudah ada di whitelist" }, { status: 409 });
    }

    // Cek jumlah email (maks 10)
    const countRow = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM allowed_emails"
    );

    if (countRow && parseInt(countRow.count, 10) >= 10) {
      return NextResponse.json(
        { error: "Whitelist sudah penuh (maks 10 akun)" },
        { status: 400 }
      );
    }

    const data = await queryOne<WhitelistEntry>(
      "INSERT INTO allowed_emails (email, invited_by) VALUES ($1, $2) RETURNING *",
      [normalized, invited_by || admin.email]
    );

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error("Failed to add whitelist email:", error);
    return NextResponse.json({ error: "Failed to add email" }, { status: 500 });
  }
}

// DELETE /api/admin/whitelist — Hapus email dari whitelist
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await query("DELETE FROM allowed_emails WHERE lower(email) = $1", [
      email.trim().toLowerCase(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to delete whitelist email:", error);
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 });
  }
}
