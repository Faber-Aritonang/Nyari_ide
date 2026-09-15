// app/api/models/route.ts — Daftar model yang tersedia untuk selector

import { NextResponse } from "next/server";
import { AVAILABLE_MODELS } from "@/lib/anthropic";

export async function GET() {
  return NextResponse.json(AVAILABLE_MODELS);
}
