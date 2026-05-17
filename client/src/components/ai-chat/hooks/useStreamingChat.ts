/**
 * useStreamingChat — Hook per gestione streaming SSE della chat AI
 * Connette al backend REST su api.mio-hub.me (NON tRPC)
 * v2.1: Fix TTS — risolto autoplay policy mobile + gestione audio corretta
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
 * Crea un AudioContext condiviso per sbloccare l'autoplay su iOS/Safari.
 * Su mobile, l'audio può essere riprodotto solo dopo un'interazione utente.
 * Questo AudioContext viene "sbloccato" al primo click/tap dell'utente.
 */
let audioContextUnlocked = false;
let sharedAudioContext: AudioContext | null = null;

function unlockAudioContext() {
  if (audioContextUnlocked) return;
  try {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Crea un buffer silenzioso per sbloccare il contesto
    const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
    const source = sharedAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(sharedAudioContext.destination);
    source.start(0);
    audioContextUnlocked = true;
  } catch {
    // Fallback: ignora
  }
}

// Sblocca l'audio al primo touch/click dell'utente
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudioContext();
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}

/** Chiama il TTS backend e riproduce l'audio */
async function playTts(
  text: string,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  onStart: () => void,
  onEnd: () => void
): Promise<void> {
  try {
    // Ferma eventuale audio in corso
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
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
      .substring(0, 300);                  // max 300 chars per TTS (velocità mobile)

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
      body: JSON.stringify({ text: cleanText, voice: 'it_IT-paola-medium', speed: 1.0 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      onEnd();
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Imposta volume e gestione eventi
    audio.volume = 1.0;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      onEnd();
    };

    onStart();

    // Prova a riprodurre — se fallisce per autoplay policy, usa AudioContext
    try {
      await audio.play();
    } catch (playError: any) {
      // Autoplay bloccato — prova con AudioContext
      if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        await sharedAudioContext.resume();
      }
      // Riprova
      try {
        await audio.play();
      } catch {
        // Non possiamo riprodurre — cleanup
        URL.revokeObjectURL(url);
        audioRef.current = null;
        onEnd();
      }
    }
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceEnabledRef = useRef(options?.voiceEnabled ?? false);
  const ttsTriggeredRef = useRef(false);

  // Aggiorna il ref quando cambia l'opzione
  useEffect(() => {
    voiceEnabledRef.current = options?.voiceEnabled ?? false;
  }, [options?.voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
      ttsTriggeredRef.current = false;

      // Sblocca AudioContext al momento dell'invio (è un'interazione utente)
      unlockAudioContext();

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
            // usiamo solo il testo completo dal onDone per evitare doppie riproduzioni
            // e per avere il testo completo (non troncato a 500 char)
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

                // Riproduci TTS con il testo completo della risposta
                if (voiceEnabledRef.current && !ttsTriggeredRef.current) {
                  ttsTriggeredRef.current = true;
                  playTts(
                    finalContent,
                    audioRef,
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
