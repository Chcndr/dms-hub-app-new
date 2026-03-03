/**
 * useStreamingChat — Hook per gestione streaming SSE della chat AI
 * Connette al backend REST su api.mio-hub.me (NON tRPC)
 */
import { useState, useCallback, useRef } from "react";
import { streamChat } from "../lib/sse-client";
import type { ChatMessage, StreamChatRequest, SSEDataEvent } from "../types";
import { MIHUB_API_BASE_URL } from "@/config/api";

const AI_STREAM_URL = `${MIHUB_API_BASE_URL}/api/ai/chat/stream`;

interface UseStreamingChatOptions {
  onConversationCreated?: (conversationId: string) => void;
  context?: StreamChatRequest["context"];
}

interface UseStreamingChatReturn {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  isLoadingData: boolean;
  error: string | null;
  dataEvents: SSEDataEvent[];
  sendMessage: (text: string, conversationId: string | null) => Promise<void>;
  stopStreaming: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearError: () => void;
}

export function useStreamingChat(
  options?: UseStreamingChatOptions
): UseStreamingChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataEvents, setDataEvents] = useState<SSEDataEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const tokenBufferRef = useRef("");
  const rafIdRef = useRef<number | undefined>(undefined);
  const dataEventsRef = useRef<SSEDataEvent[]>([]);

  const sendMessage = useCallback(
    async (text: string, conversationId: string | null) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);
      setIsLoadingData(false);
      setStreamingContent("");
      setError(null);
      setDataEvents([]);
      dataEventsRef.current = [];
      tokenBufferRef.current = "";

      abortRef.current = new AbortController();

      try {
        await streamChat({
          url: AI_STREAM_URL,
          body: {
            conversation_id: conversationId,
            message: text,
            context: options?.context,
          },
          signal: abortRef.current.signal,

          onStart: data => {
            if (data.conversation_id && !conversationId) {
              options?.onConversationCreated?.(data.conversation_id);
            }
          },

          onData: event => {
            setIsLoadingData(false);
            dataEventsRef.current = [...dataEventsRef.current, event];
            setDataEvents(prev => [...prev, event]);
          },

          onToken: token => {
            setIsLoadingData(false);
            tokenBufferRef.current += token;
            if (!rafIdRef.current) {
              rafIdRef.current = requestAnimationFrame(() => {
                setStreamingContent(prev => prev + tokenBufferRef.current);
                tokenBufferRef.current = "";
                rafIdRef.current = undefined;
              });
            }
          },

          onDone: data => {
            // Cancel any pending RAF to avoid stale flush
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = undefined;
            }

            // Flush remaining buffer synchronously into final content
            const remainingTokens = tokenBufferRef.current;
            tokenBufferRef.current = "";

            setStreamingContent(prev => {
              const finalContent = prev + remainingTokens;
              if (finalContent) {
                const assistantMessage: ChatMessage = {
                  id: data.message_id,
                  role: "assistant",
                  content: finalContent,
                  tokens_used: data.tokens_used,
                  created_at: new Date().toISOString(),
                  data_events: dataEventsRef.current.length > 0 ? dataEventsRef.current : undefined,
                };
                setMessages(msgs => [...msgs, assistantMessage]);
              }
              return "";
            });
            setIsStreaming(false);
            setIsLoadingData(false);
          },

          onError: err => {
            // Cancel any pending RAF
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = undefined;
            }
            tokenBufferRef.current = "";
            setError(err.message);
            setIsStreaming(false);
            setIsLoadingData(false);
            setStreamingContent("");
          },
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User aborted, content already handled in stopStreaming
          return;
        }
        const message =
          err instanceof Error ? err.message : "Errore di connessione";
        setError(message);
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [options]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();

    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }

    // Flush buffer
    const remaining = tokenBufferRef.current;
    tokenBufferRef.current = "";

    setStreamingContent(prev => {
      const full = prev + remaining;
      if (full) {
        const partialMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: full + "\n\n*[Risposta interrotta]*",
          created_at: new Date().toISOString(),
          data_events: dataEventsRef.current.length > 0 ? dataEventsRef.current : undefined,
        };
        setMessages(msgs => [...msgs, partialMessage]);
      }
      return "";
    });
    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    streamingContent,
    isStreaming,
    isLoadingData,
    error,
    dataEvents,
    sendMessage,
    stopStreaming,
    setMessages,
    clearError,
  };
}
