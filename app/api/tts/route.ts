// app/api/tts/route.ts — Text-to-Speech via Groq Orpheus
// Client minta TTS → server call Groq Orpheus → stream audio balik ke client

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Voice options per model
const EN_VOICES = ["hannah", "diana", "autumn", "austin", "daniel", "troy"] as const;
const AR_VOICES = ["noura", "lulwa", "aisha", "fahad", "sultan", "abdullah"] as const;

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

    // 2. Parse body
    const { text, voice } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    // Batasi panjang teks (max 2000 karakter untuk TTS)
    const trimmedText = text.trim().slice(0, 2000);

    // Pilih model & voice yang tepat
    let model: string;
    let selectedVoice: string;
    if (EN_VOICES.includes(voice as typeof EN_VOICES[number])) {
      model = "canopylabs/orpheus-v1-english";
      selectedVoice = voice;
    } else if (AR_VOICES.includes(voice as typeof AR_VOICES[number])) {
      model = "canopylabs/orpheus-arabic-saudi";
      selectedVoice = voice;
    } else {
      // Default: Arabic Saudi untuk Indonesia
      model = "canopylabs/orpheus-arabic-saudi";
      selectedVoice = "noura";
    }

    // 3. Call Groq Orpheus TTS
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/speech",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: trimmedText,
          voice: selectedVoice,
          response_format: "wav",
        }),
      }
    );

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error("Groq TTS error:", groqResponse.status, errBody);

      if (groqResponse.status === 429) {
        return NextResponse.json(
          { error: "Kuota TTS habis. Tunggu beberapa saat." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Gagal generate suara. Coba lagi." },
        { status: 502 }
      );
    }

    // 4. Stream audio balik ke client
    const audioBuffer = await groqResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
