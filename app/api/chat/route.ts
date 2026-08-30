// app/api/chat/route.ts — Streaming chat endpoint
// Client → POST /api/chat → Server verifikasi auth + ambil riwayat dari Supabase → Groq API → stream balik ke client

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODELS, DEFAULT_MODEL, CHAT_CONFIG, SYSTEM_PROMPT } from "@/lib/groq";
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

    // 2. Parse body request
    const { conversationId, message, model, imageUrl, fileContext } = await request.json();

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
      logger.error("Failed to save user message:", saveUserMsgError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // 6. Ambil custom instructions user (jika ada)
    let customInstructions = "";
    const { data: userSettings } = await supabase
      .from("custom_instructions")
      .select("instructions")
      .eq("user_id", user.id)
      .single();

    if (userSettings?.instructions) {
      customInstructions = userSettings.instructions;
    }

    // 7. RAG: Retrieve relevant context dari documents & conversations
    let ragContext = "";
    try {
      const { retrieveContext } = await import("@/lib/rag/search");
      ragContext = await retrieveContext(message.trim(), user.id, 1500);
    } catch (err) {
      logger.error("RAG retrieval error (non-critical):", err);
      // RAG gagal, lanjut tanpa context
    }

    // Gabungkan system prompt dengan custom instructions dan RAG context
    let finalSystemPrompt = SYSTEM_PROMPT;
    
    if (customInstructions) {
      finalSystemPrompt += `\n\n[Instruksi kustom dari user]:\n${customInstructions}`;
    }
    
    if (ragContext) {
      finalSystemPrompt += `\n\n[Konteks relevan dari dokumen/percakapan sebelumnya]:\n${ragContext}\n\nGunakan konteks di atas jika relevan dengan pertanyaan user. Jika tidak relevan, jawab seperti biasa.`;
    }

    // 7. Bangun messages array untuk Groq
    // Penting: HANYA konten terkini yang dikirim. Gambar/file lama di-strip
    // untuk menghindari rate limit TPM (8000 TPM untuk free tier).
    const MAX_HISTORY_MESSAGES = 10; // Kurangi dari 20 ke 10
    const MAX_CHARS_PER_MESSAGE = 500; // Limit chars per message
    const recentHistory = (history ?? []).slice(-MAX_HISTORY_MESSAGES);

    // Bangun konteks user message: teks + gambar + file (jika ada)
    const userParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    // Teks utama (dengan context file jika ada)
    let userText = message.trim();
    if (fileContext) {
      userText =
        `[Konteks dari file yang diunggah]:\n\n${fileContext}\n\n---\n\nPertanyaan: ${userText}`;
    }
    userParts.push({ type: "text", text: userText });

    // Gambar (jika ada)
    if (imageUrl) {
      userParts.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    // Helper: truncate message to limit chars
    const truncate = (text: string, maxLen: number) => 
      text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

    // Limit system prompt size
    const MAX_SYSTEM_PROMPT = 2000;
    const truncatedSystemPrompt = truncate(finalSystemPrompt, MAX_SYSTEM_PROMPT);

    const groqMessages = [
      { role: "system", content: truncatedSystemPrompt },
      // Riwayat: HANYA teks (gambar & file lama di-strip), truncated
      ...recentHistory.map((m) => ({
        role: m.role,
        content: truncate(m.content ?? "", MAX_CHARS_PER_MESSAGE),
      })),
      // Pesan saat ini: teks [+ file] [+ gambar]
      {
        role: "user" as const,
        content:
          userParts.length === 1 && userParts[0].type === "text"
            ? userParts[0].text
            : userParts,
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
      logger.error("Groq API error:", groqResponse.status, errBody);

      if (groqResponse.status === 429) {
        return NextResponse.json(
          {
            error:
              "⚡ Kuota Groq harian habis. Coba: (1) tunggu beberapa jam, (2) mulai percakapan baru, (3) upgrade Groq plan.",
          },
          { status: groqResponse.status }
        );
      }

      if (groqResponse.status === 413) {
        return NextResponse.json(
          {
            error:
              "📏 Pesan terlalu panjang. Coba: (1) mulai percakapan baru, (2) kurangi panjang pesan.",
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

                  // RAG: Index conversation untuk pencarian masa depan
                  try {
                    const { indexConversation } = await import("@/lib/rag/search");
                    await indexConversation(conversationId, user.id, [
                      { role: "user", content: message.trim() },
                      { role: "assistant", content: fullContent },
                    ]);
                  } catch (err) {
                    logger.error("RAG indexing error (non-critical):", err);
                  }
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
          logger.error("Stream processing error:", err);
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
    logger.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
