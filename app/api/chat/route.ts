// app/api/chat/route.ts — Streaming chat endpoint (Anthropic)
// Client → POST /api/chat → Server verifikasi auth + ambil riwayat dari Postgres → Anthropic API → stream balik ke client

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne, isUuid } from "@/lib/db";
import { AVAILABLE_MODELS, DEFAULT_MODEL, CHAT_CONFIG } from "@/lib/anthropic";
import { logger } from "@/lib/logger";
import { getPersona, DEFAULT_PERSONA, type PersonaId } from "@/lib/personas";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi autentikasi
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body request
    const { conversationId, message, model, imageUrl, fileContext, persona } = await request.json();

    if (!conversationId || !message?.trim() || !isUuid(conversationId)) {
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
    const conversation = await queryOne(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [conversationId, user.id]
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 4. Ambil riwayat pesan dari database (server-side, bukan dari client)
    const history = await query<{ role: string; content: string; image_url: string | null }>(
      "SELECT role, content, image_url FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversationId]
    );

    // 5. Simpan pesan user ke database
    try {
      await query(
        "INSERT INTO messages (conversation_id, role, content, image_url) VALUES ($1, 'user', $2, $3)",
        [conversationId, message.trim(), imageUrl || null]
      );
      await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
    } catch (saveError) {
      logger.error("Failed to save user message:", saveError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // 6. Ambil custom instructions user (jika ada)
    let customInstructions = "";
    const userSettings = await queryOne<{ instructions: string }>(
      "SELECT instructions FROM custom_instructions WHERE user_id = $1",
      [user.id]
    );

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
    const selectedPersona = getPersona((persona as PersonaId) || DEFAULT_PERSONA);
    let finalSystemPrompt = selectedPersona.systemPrompt;

    if (customInstructions) {
      finalSystemPrompt += `\n\n[Instruksi kustom dari user]:\n${customInstructions}`;
    }

    if (ragContext) {
      finalSystemPrompt += `\n\n[Konteks relevan dari dokumen/percakapan sebelumnya]:\n${ragContext}\n\nGunakan konteks di atas jika relevan dengan pertanyaan user. Jika tidak relevan, jawab seperti biasa.`;
    }

    // Limit system prompt size
    const MAX_SYSTEM_PROMPT = 2000;
    const truncate = (text: string, maxLen: number) =>
      text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
    const truncatedSystemPrompt = truncate(finalSystemPrompt, MAX_SYSTEM_PROMPT);

    // 8. Bangun messages array untuk Anthropic Messages API
    const MAX_HISTORY_MESSAGES = 10;
    const MAX_CHARS_PER_MESSAGE = 500;
    const recentHistory = (history ?? []).slice(-MAX_HISTORY_MESSAGES);

    // Bangun konteks user message: teks + gambar (jika ada)
    const userParts: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
    > = [];

    // Teks utama (dengan context file jika ada)
    let userText = message.trim();
    if (fileContext) {
      userText =
        `[Konteks dari file yang diunggah]:\n\n${fileContext}\n\n---\n\nPertanyaan: ${userText}`;
    }
    userParts.push({ type: "text", text: userText });

    // Gambar (jika ada) — konversi data URL ke base64 format Anthropic
    if (imageUrl) {
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        userParts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1],
            data: match[2],
          },
        });
      }
    }

    // Bangun messages array untuk Anthropic
    // Anthropic: system prompt di level atas, bukan di messages
    const anthropicMessages = [
      // Riwayat: HANYA teks (gambar & file lama di-strip)
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: truncate(m.content ?? "", MAX_CHARS_PER_MESSAGE),
      })),
      // Pesan saat ini: teks [+ gambar]
      {
        role: "user" as const,
        content:
          userParts.length === 1 && userParts[0].type === "text"
            ? userParts[0].text
            : userParts,
      },
    ];

    // 9. Call Anthropic Messages API dengan streaming
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: CHAT_CONFIG.max_tokens,
          temperature: CHAT_CONFIG.temperature,
          system: truncatedSystemPrompt,
          messages: anthropicMessages,
          stream: true,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      logger.error("Anthropic API error:", anthropicResponse.status, errBody);

      if (anthropicResponse.status === 401 || anthropicResponse.status === 403) {
        return NextResponse.json(
          { error: "Kunci API Anthropic tidak valid atau tidak aktif." },
          { status: anthropicResponse.status }
        );
      }

      if (anthropicResponse.status === 429) {
        return NextResponse.json(
          {
            error:
              "⚡ Kuota Anthropic terlampaui. Coba: (1) tunggu beberapa saat, (2) gunakan model lebih ringan, (3) periksa billing.",
          },
          { status: anthropicResponse.status }
        );
      }

      if (anthropicResponse.status === 413) {
        return NextResponse.json(
          {
            error:
              "📏 Pesan terlalu panjang. Coba: (1) mulai percakapan baru, (2) kurangi panjang pesan.",
          },
          { status: anthropicResponse.status }
        );
      }

      // Coba parse error message dari Anthropic
      let anthropicErrorMsg = "Gagal menghubungi AI.";
      try {
        const errJson = JSON.parse(errBody);
        anthropicErrorMsg = errJson.error?.message || anthropicErrorMsg;
      } catch {
        // ignore
      }

      return NextResponse.json(
        { error: anthropicErrorMsg + " Silakan coba lagi." },
        { status: 502 }
      );
    }

    // 10. Stream response ke client
    // Anthropic SSE format: event: content_block_delta → data: {"delta":{"text":"..."}}
    const encoder = new TextEncoder();
    const chunks: string[] = [];

    const saveAssistantMessage = async (fullContent: string) => {
      await query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)",
        [conversationId, fullContent]
      );
      await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
    };

    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body?.getReader();
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

              try {
                const parsed = JSON.parse(data);

                // Anthropic streaming events:
                // content_block_delta → { type: "content_block_delta", delta: { type: "text_delta", text: "..." } }
                // message_stop → selesai
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  const content = parsed.delta.text;
                  chunks.push(content);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }

                if (parsed.type === "message_stop") {
                  // Simpan assistant reply ke database
                  const fullContent = chunks.join("");
                  if (fullContent) {
                    try {
                      await saveAssistantMessage(fullContent);

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
                    } catch (err) {
                      logger.error("Failed to save assistant message:", err);
                    }
                  }
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch (err) {
          logger.error("Stream processing error:", err);
        }

        // Fallback: save accumulated content if message_stop wasn't received
        if (chunks.length > 0) {
          const fullContent = chunks.join("");
          try {
            await saveAssistantMessage(fullContent);
          } catch (err) {
            logger.error("Failed to save assistant message (fallback):", err);
          }
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
