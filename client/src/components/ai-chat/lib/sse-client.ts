/**
 * SSE Client for AI Chat Streaming
 * Handles Server-Sent Events with fetch + ReadableStream (native, no external libs)
 */
import type { SSEEvent } from "../types";

interface SSEClientOptions {
  url: string;
  body: object;
  onToken: (token: string) => void;
  onStart?: (data: { conversation_id: string; model: string }) => void;
  onDone: (data: {
    message_id: string;
    tokens_used: number;
    quota_remaining: number;
  }) => void;
  onError: (error: { code: string; message: string }) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: SSEClientOptions): Promise<void> {
  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // response not JSON
    }
    options.onError({ code: `HTTP_${response.status}`, message: errorMessage });
    return;
  }

  if (!response.body) {
    options.onError({ code: "NO_BODY", message: "Response body is null" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6)) as SSEEvent;

          switch (data.type) {
            case "token":
              options.onToken(data.content);
              break;
            case "start":
              options.onStart?.({
                conversation_id: data.conversation_id,
                model: data.model,
              });
              break;
            case "done":
              options.onDone({
                message_id: data.message_id,
                tokens_used: data.tokens_used,
                quota_remaining: data.quota_remaining,
              });
              break;
            case "error":
              options.onError({ code: data.code, message: data.message });
              break;
          }
        } catch {
          // Malformed SSE line, skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
