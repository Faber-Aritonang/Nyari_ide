// app/api/chat/route.ts — Streaming chat endpoint
// Client → POST /api/chat → Server verifikasi auth + ambil riwayat dari Supabase → Groq API → stream balik ke client

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODELS, DEFAULT_MODEL, CHAT_CONFIG, SYSTEM_PROMPT } from "@/lib/groq";

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

    // 2. Parse body request
    const { conversationId, message, model, imageUrl } = await request.json();

    if (!conversationId || !message?.trim()) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 }
      );
    }

    // Validasi model — harus ada di daftar yang diizinkan
    const selectedModel =
      model && AVAILABLE_MODELS.some((m) => m.id === model)
        ? model
        : DEFAULT_MODEL;

    // 3. Verifikasi bahwa conversation milik user ini
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 4. Ambil riwayat pesan dari Supabase (server-side, bukan dari client)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content, image_url")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    // 5. Simpan pesan user ke database
    const { error: saveUserMsgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message.trim(),
      image_url: imageUrl || null,
    });

    if (saveUserMsgError) {
      console.error("Failed to save user message:", saveUserMsgError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // 6. Bangun messages array untuk Groq
    // Penting: HANYA gambar terkini yang dikirim. Gambar lama di-strip
    // untuk menghindari "Too many images" (max 3) dan rate limit TPM.
    // Batasi juga jumlah history agar tidak melebihi TPM limit.
    const MAX_HISTORY_MESSAGES = 20;
    const recentHistory = (history ?? []).slice(-MAX_HISTORY_MESSAGES);

    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      // Riwayat: HANYA teks (gambar lama di-strip)
      ...recentHistory.map((m) => ({
        role: m.role,
        content: m.content ?? "",
      })),
      // Pesan saat ini: teks + gambar (jika ada)
      {
        role: "user" as const,
        content: imageUrl
          ? [
              { type: "text", text: message.trim() },
              { type: "image_url", image_url: { url: imageUrl } },
            ]
          : message.trim(),
      },
    ];

    // 7. Call Groq API dengan streaming
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          ...CHAT_CONFIG,
          messages: groqMessages,
          stream: true,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errBody);

      if (groqResponse.status === 429 || groqResponse.status === 413) {
        return NextResponse.json(
          {
            error:
              "Permintaan terlalu besar atau kuota habis. Coba: (1) kurangi panjang pesan, (2) pakai gambar lebih kecil, (3) tunggu beberapa saat.",
          },
          { status: groqResponse.status }
        );
      }

      // Coba parse error message dari Groq
      let groqErrorMsg = "Gagal menghubungi AI.";
      try {
        const errJson = JSON.parse(errBody);
        groqErrorMsg = errJson.error?.message || groqErrorMsg;
      } catch {
        // ignore
      }

      return NextResponse.json(
        { error: groqErrorMsg + " Silakan coba lagi." },
        { status: 502 }
      );
    }

    // 8. Stream response ke client
    const encoder = new TextEncoder();
    const chunks: string[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                // Simpan assistant reply ke database
                const fullContent = chunks.join("");
                if (fullContent) {
                  await supabase.from("messages").insert({
                    conversation_id: conversationId,
                    role: "assistant",
                    content: fullContent,
                  });
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  chunks.push(content);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch (err) {
          console.error("Stream processing error:", err);
        }

        // Fallback: save accumulated content if [DONE] wasn't received
        if (chunks.length > 0) {
          const fullContent = chunks.join("");
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullContent,
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
