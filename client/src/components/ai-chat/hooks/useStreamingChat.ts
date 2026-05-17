/**
 * useStreamingChat — Hook per gestione streaming SSE della chat AI
 * Connette al backend REST su api.mio-hub.me (NON tRPC)
 * v2.0: Aggiunto supporto TTS (voce AVA)
 */
import { useState, useCallback, useRef } from "react";
import { streamChat } from "../lib/sse-client";
import type { ChatMessage, StreamChatRequest, SSEDataEvent } from "../types";
import { MIHUB_API_BASE_URL } from "@/config/api";

const AI_STREAM_URL = `${MIHUB_API_BASE_URL}/api/ai/chat/stream`;

interface UseStreamingChatOptions {
  onConversationCreated?: (conversationId: string) => void;
  context?: StreamChatRequest["context"];
  /** Se true, riproduce automaticamente la voce di AVA quando finisce di rispondere */
  voiceEnabled?: boolean;
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
  isSpeaking: boolean;
  stopSpeaking: () => void;
}

/** Chiama il TTS backend e riproduce l'audio */
async function playTts(text: string, audioRef: React.MutableRefObject<HTMLAudioElement | null>): Promise<void> {
  try {
    // Ferma eventuale audio in corso
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const response = await fetch(`${MIHUB_API_BASE_URL}/api/ava/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 2000), voice: 'it_IT-paola-medium', speed: 1.0 }),
    });

    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };

    await audio.play();
  } catch {
    // TTS fallisce silenziosamente — non bloccare la chat
  }
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const tokenBufferRef = useRef("");
  const rafIdRef = useRef<number | undefined>(undefined);
  const dataEventsRef = useRef<SSEDataEvent[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceEnabledRef = useRef(options?.voiceEnabled ?? false);

  // Aggiorna il ref quando cambia l'opzione
  voiceEnabledRef.current = options?.voiceEnabled ?? false;

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

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

          onTts: (ttsData) => {
            // Il backend ci dice che il TTS è disponibile
            // Riproduciamo solo se la voce è attiva
            if (voiceEnabledRef.current && ttsData.text) {
              setIsSpeaking(true);
              playTts(ttsData.text, audioRef).finally(() => setIsSpeaking(false));
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

                // Se la voce è attiva e non abbiamo già ricevuto un evento tts_available,
                // chiama il TTS con il testo completo della risposta
                if (voiceEnabledRef.current && !audioRef.current) {
                  setIsSpeaking(true);
                  playTts(finalContent, audioRef).finally(() => setIsSpeaking(false));
                }
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
    isSpeaking,
    stopSpeaking,
  };
}
