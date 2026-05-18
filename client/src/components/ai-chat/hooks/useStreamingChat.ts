/**
 * useStreamingChat — Hook per gestione streaming SSE della chat AI
 * Connette al backend REST su api.mio-hub.me (NON tRPC)
 * v4.0: TTS Streaming — AVA parla MENTRE scrive, a pezzi (frase per frase)
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { streamChat } from "../lib/sse-client";
import type { ChatMessage, StreamChatRequest, SSEDataEvent } from "../types";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { apiFetch } from "@/lib/apiFetch";

const AI_STREAM_URL = `${MIHUB_API_BASE_URL}/api/ai/chat/stream`;

interface UseStreamingChatOptions {
  onConversationCreated?: (conversationId: string) => void;
  context?: StreamChatRequest["context"];
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

// ─── Web Audio API per iOS/Safari ───────────────────────────────────────────

let sharedAudioContext: AudioContext | null = null;

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

function unlockAudioForIOS() {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch { /* ignore */ }
}

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

// ─── TTS Streaming Queue ────────────────────────────────────────────────────

/** Pulisce il testo markdown per il TTS */
function cleanTextForTts(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-•]\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

/** Divide il testo in frasi (split su . ! ? e newline) */
function splitIntoSentences(text: string): string[] {
  // Split SOLO su fine frase reale (. ! ?) — NON su : e ; che appaiono dentro le frasi
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter(p => p.trim().length > 5);
}

/** Genera e riproduce un chunk di TTS */
async function fetchAndPlayChunk(
  text: string,
  ctx: AudioContext,
  onStart: () => void
): Promise<void> {
  const ttsUrl = typeof window !== 'undefined' && window.location.origin.includes('miohub')
    ? '/api/ava/tts'
    : `${MIHUB_API_BASE_URL}/api/ava/tts`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const response = await apiFetch(ttsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'it_IT-paola-medium', speed: 0.8 }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) throw new Error('TTS failed');

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength < 100) throw new Error('Empty audio');

  if (ctx.state === 'suspended') await ctx.resume();

  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  return new Promise<void>((resolve, reject) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => resolve();
    onStart();
    source.start(0);
  });
}

/**
 * Classe che gestisce la coda TTS streaming.
 * Accumula testo durante lo streaming, e appena ha una frase completa
 * la manda al TTS e la riproduce. Le frasi vengono riprodotte in sequenza.
 */
class TtsStreamingQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private isStopped = false;
  private pendingText = '';
  private totalSpoken = 0;
  private maxChars = 800; // max caratteri totali da parlare
  private onSpeakingChange: (speaking: boolean) => void;

  constructor(onSpeakingChange: (speaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  /** Aggiungi testo in arrivo dallo streaming */
  addText(newText: string) {
    if (this.isStopped || this.totalSpoken >= this.maxChars) return;

    this.pendingText += newText;

    // Cerca frasi complete (terminano con . ! ? — NON : e ; che sono dentro le frasi)
    const sentences = this.pendingText.split(/(?<=[.!?])\s+/);

    if (sentences.length > 1) {
      // Tutte tranne l'ultima sono frasi complete
      const completeSentences = sentences.slice(0, -1);
      this.pendingText = sentences[sentences.length - 1];

      for (const sentence of completeSentences) {
        const clean = cleanTextForTts(sentence);
        if (clean.length > 10 && this.totalSpoken + clean.length <= this.maxChars) {
          this.queue.push(clean);
          this.totalSpoken += clean.length;
        }
      }

      this.processQueue();
    }
  }

  /** Segnala che lo streaming è finito — processa eventuale testo rimanente */
  flush() {
    if (this.isStopped || this.totalSpoken >= this.maxChars) return;

    if (this.pendingText.trim().length > 10) {
      const clean = cleanTextForTts(this.pendingText);
      if (clean.length > 10 && this.totalSpoken + clean.length <= this.maxChars) {
        this.queue.push(clean);
        this.totalSpoken += clean.length;
      }
    }
    this.pendingText = '';
    this.processQueue();
  }

  /** Ferma tutto */
  stop() {
    this.isStopped = true;
    this.queue = [];
    this.pendingText = '';
    this.onSpeakingChange(false);
  }

  /** Processa la coda: riproduce le frasi una alla volta */
  private async processQueue() {
    if (this.isPlaying || this.isStopped) return;

    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    while (this.queue.length > 0 && !this.isStopped) {
      const text = this.queue.shift()!;
      try {
        await fetchAndPlayChunk(text, ctx, () => this.onSpeakingChange(true));
      } catch {
        // Se un chunk fallisce, continua con il prossimo
      }
    }

    this.isPlaying = false;
    if (this.queue.length === 0) {
      this.onSpeakingChange(false);
    }
  }
}

// ─── Hook principale ────────────────────────────────────────────────────────

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
  const voiceEnabledRef = useRef(options?.voiceEnabled ?? false);
  const ttsQueueRef = useRef<TtsStreamingQueue | null>(null);
  // Accumula il testo completo per il TTS (separato dal rendering)
  const fullTextRef = useRef("");

  useEffect(() => {
    voiceEnabledRef.current = options?.voiceEnabled ?? false;
  }, [options?.voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (ttsQueueRef.current) {
      ttsQueueRef.current.stop();
      ttsQueueRef.current = null;
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
      fullTextRef.current = "";

      // CRUCIALE: Sblocca AudioContext (interazione utente diretta)
      unlockAudioForIOS();

      // Crea la coda TTS streaming se la voce è attiva
      if (voiceEnabledRef.current) {
        ttsQueueRef.current = new TtsStreamingQueue((speaking) => setIsSpeaking(speaking));
      } else {
        ttsQueueRef.current = null;
      }

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

            // Accumula testo per il TTS streaming
            fullTextRef.current += token;
            if (ttsQueueRef.current) {
              ttsQueueRef.current.addText(token);
            }

            if (!rafIdRef.current) {
              rafIdRef.current = requestAnimationFrame(() => {
                setStreamingContent(prev => prev + tokenBufferRef.current);
                tokenBufferRef.current = "";
                rafIdRef.current = undefined;
              });
            }
          },

          onTts: (_ttsData) => {
            // Non usato — usiamo il TTS streaming diretto
          },

          onDone: data => {
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = undefined;
            }

            const remainingTokens = tokenBufferRef.current;
            tokenBufferRef.current = "";

            // Flush il TTS con eventuale testo rimanente
            if (ttsQueueRef.current) {
              if (remainingTokens) {
                ttsQueueRef.current.addText(remainingTokens);
              }
              ttsQueueRef.current.flush();
            }

            // FIX: usa fullTextRef.current come fonte di verità per il testo completo
            // prev + remainingTokens potrebbe essere vuoto se il RAF ha già flushato tutto
            const safeContent = fullTextRef.current || "";

            if (safeContent) {
              const assistantMessage: ChatMessage = {
                id: data.message_id,
                role: "assistant",
                content: safeContent,
                tokens_used: data.tokens_used,
                created_at: new Date().toISOString(),
                data_events: dataEventsRef.current.length > 0 ? dataEventsRef.current : undefined,
              };
              setMessages(msgs => [...msgs, assistantMessage]);
            }
            setStreamingContent("");
            setIsStreaming(false);
            setIsLoadingData(false);
          },

          onError: err => {
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = undefined;
            }
            tokenBufferRef.current = "";
            setError(err.message);
            setIsStreaming(false);
            setIsLoadingData(false);
            setStreamingContent("");
            // Ferma il TTS in caso di errore
            if (ttsQueueRef.current) {
              ttsQueueRef.current.stop();
            }
          },
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Errore di connessione";
        setError(message);
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [options]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }

    // Ferma anche il TTS
    if (ttsQueueRef.current) {
      ttsQueueRef.current.stop();
      ttsQueueRef.current = null;
    }

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
