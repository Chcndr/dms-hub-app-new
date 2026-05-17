/**
 * useStreamingChat — Hook per gestione streaming SSE della chat AI
 * Connette al backend REST su api.mio-hub.me (NON tRPC)
 * v3.0: Fix TTS iOS/Safari — usa Web Audio API per riproduzione (bypass autoplay policy)
 */
import { useState, useCallback, useRef, useEffect } from "react";
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

/**
 * AudioContext condiviso — la chiave per iOS/Safari.
 * L'AudioContext DEVE essere creato e resumed durante un'interazione utente (tap/click).
 * Una volta sbloccato, possiamo usarlo per riprodurre qualsiasi audio in qualsiasi momento.
 */
let sharedAudioContext: AudioContext | null = null;
let audioContextReady = false;

function getOrCreateAudioContext(): AudioContext | null {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext;
  }
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Sblocca l'AudioContext — DEVE essere chiamato durante un evento utente (click/tap/touchstart).
 * Su iOS, un AudioContext creato fuori da un evento utente resta "suspended" per sempre.
 */
function unlockAudioForIOS() {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      audioContextReady = true;
    }).catch(() => {});
  } else {
    audioContextReady = true;
  }

  // Riproduci un buffer silenzioso per sbloccare definitivamente su iOS
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore
  }
}

// Sblocca al primo touch/click dell'utente sulla pagina
if (typeof window !== 'undefined') {
  const earlyUnlock = () => {
    unlockAudioForIOS();
    document.removeEventListener('touchstart', earlyUnlock);
    document.removeEventListener('touchend', earlyUnlock);
    document.removeEventListener('click', earlyUnlock);
  };
  document.addEventListener('touchstart', earlyUnlock, { passive: true });
  document.addEventListener('touchend', earlyUnlock, { passive: true });
  document.addEventListener('click', earlyUnlock);
}

/** Riproduce audio WAV usando Web Audio API (funziona su iOS dopo unlock) */
async function playWavWithWebAudio(
  wavArrayBuffer: ArrayBuffer,
  onStart: () => void,
  onEnd: () => void,
  sourceNodeRef: React.MutableRefObject<AudioBufferSourceNode | null>
): Promise<void> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) {
    onEnd();
    return;
  }

  // Assicurati che il context sia attivo
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      onEnd();
      return;
    }
  }

  try {
    // Decodifica il WAV in un AudioBuffer
    const audioBuffer = await ctx.decodeAudioData(wavArrayBuffer);

    // Crea un source node per la riproduzione
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    sourceNodeRef.current = source;

    source.onended = () => {
      sourceNodeRef.current = null;
      onEnd();
    };

    onStart();
    source.start(0);
  } catch {
    sourceNodeRef.current = null;
    onEnd();
  }
}

/** Chiama il TTS backend e riproduce l'audio via Web Audio API */
async function playTts(
  text: string,
  sourceNodeRef: React.MutableRefObject<AudioBufferSourceNode | null>,
  onStart: () => void,
  onEnd: () => void
): Promise<void> {
  try {
    // Ferma eventuale audio in corso
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch { /* already stopped */ }
      sourceNodeRef.current = null;
    }

    // Pulisci il testo: rimuovi markdown, asterischi, elenchi puntati
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
      .replace(/\*([^*]+)\*/g, '$1')       // *italic* → italic
      .replace(/^[-•]\s*/gm, '')           // rimuovi bullet points
      .replace(/^\d+\.\s*/gm, '')          // rimuovi numeri elenco
      .replace(/#{1,6}\s*/g, '')           // rimuovi headers markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) → link
      .replace(/\n{2,}/g, '. ')            // doppi a capo → punto
      .replace(/\n/g, ' ')                 // singoli a capo → spazio
      .trim()
      .substring(0, 600);                  // max 600 chars per TTS (copre 4-5 frasi)

    if (!cleanText || cleanText.length < 3) {
      onEnd();
      return;
    }

    // Usa URL relativo per passare dal proxy Vercel (più affidabile su mobile)
    const ttsUrl = typeof window !== 'undefined' && window.location.origin.includes('miohub')
      ? '/api/ava/tts'
      : `${MIHUB_API_BASE_URL}/api/ava/tts`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: 'it_IT-paola-medium', speed: 0.85 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      onEnd();
      return;
    }

    // Leggi la risposta come ArrayBuffer (necessario per Web Audio API)
    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength < 100) {
      onEnd();
      return;
    }

    // Riproduci usando Web Audio API (funziona su iOS!)
    await playWavWithWebAudio(arrayBuffer, onStart, onEnd, sourceNodeRef);
  } catch {
    // TTS fallisce silenziosamente — non bloccare la chat
    onEnd();
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
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const voiceEnabledRef = useRef(options?.voiceEnabled ?? false);
  const ttsTriggeredRef = useRef(false);

  // Aggiorna il ref quando cambia l'opzione
  useEffect(() => {
    voiceEnabledRef.current = options?.voiceEnabled ?? false;
  }, [options?.voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch { /* already stopped */ }
      sourceNodeRef.current = null;
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
      ttsTriggeredRef.current = false;

      // CRUCIALE: Sblocca AudioContext al momento dell'invio (è un'interazione utente diretta)
      unlockAudioForIOS();

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

          onTts: (_ttsData) => {
            // Ignoriamo l'evento tts_available dal backend —
            // usiamo solo il testo completo dal onDone
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

                // Riproduci TTS con il testo completo della risposta (via Web Audio API)
                if (voiceEnabledRef.current && !ttsTriggeredRef.current) {
                  ttsTriggeredRef.current = true;
                  playTts(
                    finalContent,
                    sourceNodeRef,
                    () => setIsSpeaking(true),
                    () => setIsSpeaking(false)
                  );
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
