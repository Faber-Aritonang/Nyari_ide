// app/api/admin/whitelist/route.ts — Kelola whitelist email
// GET: list semua email, POST: tambah email, DELETE: hapus email

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/whitelist — List semua whitelisted emails
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("allowed_emails")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/whitelist — Tambah email ke whitelist
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, invited_by } = await request.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Cek apakah email sudah ada
  const { data: existing } = await supabase
    .from("allowed_emails")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Email sudah ada di whitelist" }, { status: 409 });
  }

  // Cek jumlah email (maks 10)
  const { count } = await supabase
    .from("allowed_emails")
    .select("*", { count: "exact", head: true });

  if (count && count >= 10) {
    return NextResponse.json({ error: "Whitelist sudah penuh (maks 10 akun)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("allowed_emails")
    .insert({
      email: email.trim().toLowerCase(),
      invited_by: invited_by || user.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/whitelist — Hapus email dari whitelist
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("allowed_emails")
    .delete()
    .ilike("email", email.trim());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
