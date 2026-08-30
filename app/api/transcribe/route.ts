// app/api/transcribe/route.ts — Voice-to-text via Groq Whisper
// Client rekam audio → POST /api/transcribe → Groq Whisper → teks

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi autentikasi
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Terima audio dari client (FormData)
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file required" },
        { status: 400 }
      );
    }

    // Validasi ukuran (maks 25MB untuk Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio terlalu besar. Maksimal 25MB." },
        { status: 400 }
      );
    }

    // 3. Kirim ke Groq Whisper
    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile, "audio.webm");
    whisperFormData.append("model", "whisper-large-v3-turbo");
    whisperFormData.append("language", "id"); // Default bahasa Indonesia
    whisperFormData.append("response_format", "json");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: whisperFormData,
      }
    );

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      logger.error("Groq Whisper error:", groqResponse.status, errBody);

      if (groqResponse.status === 429) {
        return NextResponse.json(
          { error: "Kuota voice input habis. Tunggu beberapa saat." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Gagal mengubah suara ke teks. Coba lagi." },
        { status: 502 }
      );
    }

    const result = await groqResponse.json();
    return NextResponse.json({ text: result.text || "" });
  } catch (error) {
    logger.error("Transcribe API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
