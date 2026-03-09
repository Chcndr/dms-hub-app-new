import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { callOrchestrator } from "../api/orchestratorClient";

// 🔥 TABULA RASA: Context condiviso per MIO (Widget + Dashboard)

export interface MioMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  agentName?: string; // Per supporto multi-agente
  source?: string; // Per tracking
}

interface MioContextValue {
  // Stato
  messages: MioMessage[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;

  // Azioni
  sendMessage: (text: string, meta?: Record<string, any>) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
}

const MioContext = createContext<MioContextValue | undefined>(undefined);

// 🏝️ ARCHITETTURA 8 ISOLE - ID fisso per Chat MIO principale
const MIO_MAIN_CONVERSATION_ID = "mio-main";

export function MioProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<MioMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(
    MIO_MAIN_CONVERSATION_ID
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔥 PERSISTENZA: Carica cronologia al mount
  useEffect(() => {
    const controller = new AbortController();

    const loadHistory = async () => {
      // 🔥 SVUOTA messaggi all'inizio per evitare duplicati al refresh
      setMessages([]);

      // 🏝️ USA SEMPRE mio-main per la chat principale
      setConversationId(MIO_MAIN_CONVERSATION_ID);

      try {
        // 🚀 TUBO DRITTO - Connessione diretta database → frontend (via Vercel API)
        const response = await fetch(
          `/api/mihub/get-messages?conversation_id=${MIO_MAIN_CONVERSATION_ID}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          console.error("🔥 [MioContext] Errore API:", response.status);
          return;
        }

        const data = await response.json();
        const rawMessages = data.messages || data.logs || [];
        if (rawMessages.length > 0) {
          // Converti formato backend → MioMessage
          const loadedMessages: MioMessage[] = rawMessages.map((log: any) => ({
            id: log.id,
            role: log.role as "user" | "assistant" | "system",
            content: log.message || log.content || "",
            createdAt: log.created_at,
            agentName: log.agent_name || log.agent || log.sender,
          }));

          setMessages(loadedMessages);
          console.warn(
            "[MioContext] Cronologia caricata:",
            loadedMessages.length,
            "messaggi"
          );
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("🔥 [MioContext] Errore caricamento cronologia:", err);
        }
      }
    };

    loadHistory();

    return () => controller.abort();
  }, []);

  // 🔥 TABULA RASA: Funzione sendMessage condivisa
  const sendMessage = useCallback(
    async (text: string, meta: Record<string, any> = {}) => {
      if (!text.trim()) return;

      setIsLoading(true);
      setError(null);

      // Push ottimistico con ID temporaneo
      const tempUserId = `temp-user-${Date.now()}`;
      const userMsg: MioMessage = {
        id: tempUserId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        // 🚀 CHIAMATA DIRETTA A HETZNER - NON PASSA PER VERCEL PROXY
        // Usa callOrchestrator() che chiama https://api.mio-hub.me/api/mihub/orchestrator
        const data = await callOrchestrator({
          mode: "auto",
          message: text,
          conversationId: MIO_MAIN_CONVERSATION_ID, // 🏝️ USA SEMPRE mio-main
          meta: { ...meta, source: meta.source || "mio_context" },
        });

        // Dati ricevuti da Hetzner

        // 🔥 RECONCILIAZIONE: Sostituisci messaggio temporaneo con quello reale dal server
        setMessages(prev => {
          // Rimuovi il messaggio temporaneo
          const withoutTemp = prev.filter(m => m.id !== tempUserId);

          // Aggiungi messaggio utente reale
          const userMsgConfirmed: MioMessage = {
            ...userMsg,
            id: (data as any).userMessageId || tempUserId,
          };

          // Aggiungi la risposta
          const aiMsg: MioMessage = {
            id: (data as any).assistantMessageId || crypto.randomUUID(),
            role: "assistant",
            content: data.message || "Risposta vuota",
            createdAt: new Date().toISOString(),
            agentName: data.agent || "mio",
            source: (data as any).source,
          };

          return [...withoutTemp, userMsgConfirmed, aiMsg];
        });
        // Messaggio inviato con successo

        // 🔥 POLLING TEMPORANEO: Ricarica messaggi dopo 5s per catturare eventuali risposte aggiuntive
        // 🔧 FIX: Aumentato a 5s e usa merge intelligente invece di sovrascrivere
        setTimeout(async () => {
          try {
            const response = await fetch(
              `/api/mihub/get-messages?conversation_id=${MIO_MAIN_CONVERSATION_ID}`
            );
            if (response.ok) {
              const pollData = await response.json();
              const rawMessages = pollData.messages || pollData.logs || [];
              if (rawMessages.length > 0) {
                const serverMessages: MioMessage[] = rawMessages.map(
                  (log: any) => ({
                    id: log.id,
                    role: log.role as "user" | "assistant" | "system",
                    content: log.message || log.content || "",
                    createdAt: log.created_at,
                    agentName: log.agent_name || log.agent || log.sender,
                  })
                );

                // 🔧 FIX v2: Merge intelligente - confronta ID, contenuto ESATTO E ruolo per evitare duplicati
                setMessages(prev => {
                  const existingIds = new Set(prev.map(m => m.id));

                  // 🔥 FIX DUPLICATI v2: Crea set di contenuti esatti per ruolo (ignora timestamp)
                  const existingContentMap = new Map<string, boolean>();
                  prev.forEach(m => {
                    // Chiave: ruolo + contenuto completo (normalizzato)
                    const contentKey = `${m.role}:${(m.content || "").trim()}`;
                    existingContentMap.set(contentKey, true);
                  });

                  const newMessages = serverMessages.filter(m => {
                    // Salta se ID già esiste
                    if (existingIds.has(m.id)) return false;

                    // 🔥 FIX v2: Salta se stesso contenuto+ruolo già esiste (ignora timestamp completamente)
                    const contentKey = `${m.role}:${(m.content || "").trim()}`;
                    if (existingContentMap.has(contentKey)) {
                      return false;
                    }

                    return true;
                  });

                  if (newMessages.length > 0) {
                    // Ordina per timestamp
                    const merged = [...prev, ...newMessages].sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );
                    return merged;
                  }
                  return prev; // Nessun nuovo messaggio, mantieni stato attuale
                });
              }
            }
          } catch (err) {
            console.error("❌ [MioContext] Errore polling post-invio:", err);
          }
        }, 5000);
      } catch (err: any) {
        console.error("🔥 [MioContext] ERROR:", err);

        // Se l'errore è dovuto all'abort, non mostrare errore
        if (err.name === "AbortError") {
          const stopMsg: MioMessage = {
            id: crypto.randomUUID(),
            role: "system",
            content: "⏸️ Generazione interrotta",
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, stopMsg]);
        } else {
          setError(err.message);

          // Messaggio di errore
          const errorMsg: MioMessage = {
            id: crypto.randomUUID(),
            role: "system",
            content: `🔥 ERROR: ${err.message}`,
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.warn("[MioContext] Interruzione generazione");
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    // 🏝️ NON resettare conversationId - mantieni sempre mio-main
    setError(null);
  }, []);

  const value: MioContextValue = {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
    setConversationId,
  };

  return <MioContext.Provider value={value}>{children}</MioContext.Provider>;
}

// Hook per usare il context
export function useMio() {
  const context = useContext(MioContext);
  if (context === undefined) {
    throw new Error("useMio must be used within a MioProvider");
  }
  return context;
}
