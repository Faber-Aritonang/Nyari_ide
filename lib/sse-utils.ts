// lib/sse-utils.ts — SSE Streaming Utilities
// Deduplicates SSE parsing logic used in sendMessage, handleRegenerate, handleEditMessage

export interface SSEParseCallbacks {
  onContent: (content: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

/**
 * Parse SSE stream from a Response object
 * Handles reading, decoding, buffering, and parsing SSE lines
 */
export async function parseSSEStream(
  response: Response,
  callbacks: SSEParseCallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          callbacks.onDone?.();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            callbacks.onContent(parsed.content);
          }
        } catch {
          /* skip malformed JSON */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
