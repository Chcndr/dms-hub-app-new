import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 🔥 TABULA RASA: Context condiviso per MIO (Widget + Dashboard)

export interface MioMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
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
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
}

const MioContext = createContext<MioContextValue | undefined>(undefined);

export function MioProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<MioMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 TABULA RASA: Funzione sendMessage condivisa
  const sendMessage = useCallback(async (text: string, meta: Record<string, any> = {}) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    // Push ottimistico
    const userMsg: MioMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      console.log('🔥 [MioContext TABULA RASA] Inizio chiamata diretta...');
      console.log('🔥 [MioContext TABULA RASA] ConversationId:', conversationId);
      
      const response = await fetch("https://orchestratore.mio-hub.me/api/mihub/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "auto",
          message: text,
          conversationId: conversationId, // Usa conversationId esistente o null per nuova
          meta: { ...meta, source: meta.source || "mio_context" }
        })
      });

      console.log('🔥 [MioContext TABULA RASA] Status Response:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server ha risposto ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log('🔥 [MioContext TABULA RASA] Dati ricevuti:', data);

      // Aggiorna conversationId se nuovo
      if (data.conversationId && data.conversationId !== conversationId) {
        console.log('🔥 [MioContext TABULA RASA] Nuovo conversationId:', data.conversationId);
        setConversationId(data.conversationId);
      }

      // Aggiungi la risposta
      const aiMsg: MioMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || data.reply || data.response || "Risposta vuota",
        createdAt: new Date().toISOString(),
        agentName: data.agent || data.agentName || 'mio',
        source: data.source,
      };
      
      setMessages(prev => [...prev, aiMsg]);
      console.log('🔥 [MioContext TABULA RASA] SUCCESS! ✅');

    } catch (err: any) {
      console.error('🔥 [MioContext TABULA RASA] ERROR:', err);
      setError(err.message);
      
      // Messaggio di errore
      const errorMsg: MioMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `🔥 TABULA RASA ERROR: ${err.message}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const value: MioContextValue = {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setConversationId,
  };

  return (
    <MioContext.Provider value={value}>
      {children}
    </MioContext.Provider>
  );
}

// Hook per usare il context
export function useMio() {
  const context = useContext(MioContext);
  if (context === undefined) {
    throw new Error('useMio must be used within a MioProvider');
  }
  return context;
}
