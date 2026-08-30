// app/api/image-gen/route.ts — Hybrid Text-to-Image API
// POST: Generate image using hybrid provider (Cloudflare → Pollinations)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateImageHybrid,
  type ImageProvider,
  type ImageSize,
} from "@/lib/image-gen-hybrid";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, provider, size } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    console.log("[image-gen] Request:", { provider, size, promptLength: prompt.length });

    // Generate image with hybrid provider
    const result = await generateImageHybrid(prompt, {
      provider: (provider as ImageProvider) || "cloudflare",
      size: (size as ImageSize) || "1024",
    });

    if (!result.success) {
      console.error("[image-gen] Provider failed:", result.provider, result.error);
      return NextResponse.json(
        { error: result.error || "Image generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
