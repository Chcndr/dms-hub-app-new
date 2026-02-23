/**
 * 🏗️ TABULA RASA - Agent Helper
 * 
 * Funzione centralizzata per inviare messaggi agli agenti.
 * Elimina duplicazione codice e standardizza tutte le chiamate.
 * 
 * ⚠️ IMPORTANTE: NON usa Optimistic UI per evitare duplicati.
 * I messaggi vengono mostrati SOLO dopo il reload dal database.
 */

import { callOrchestrator, type AgentId, type OrchestratorMode } from '@/api/orchestratorClient';

export interface AgentMessage {
  id: string;
  conversation_id: string;
  agent_name: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sender?: string;  // FIX: Campo sender per distinguere MIO da Utente nelle chat singole
  created_at: string;
  pending?: boolean;
}

export interface SendToAgentParams {
  /** Agente target (es. 'manus', 'abacus', 'gptdev', 'zapier') */
  targetAgent: AgentId;
  /** Messaggio da inviare */
  message: string;
  /** Conversation ID esistente (opzionale) */
  conversationId?: string | null;
  /** Mode: "direct" = chat diretta, "auto" = via MIO */
  mode?: OrchestratorMode;
  /** Callback per aggiornare i messaggi con i nuovi dal database */
  onUpdateMessages: (messages: AgentMessage[]) => void;
  /** Callback per aggiornare conversation ID */
  onUpdateConversationId: (id: string) => void;
  /** Callback per mostrare errori */
  onError?: (error: string) => void;
}

/**
 * Ricarica messaggi dal database
 */
async function reloadMessages(conversationId: string): Promise<AgentMessage[]> {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    limit: '500',
  });
  
  const url = `/api/mihub/get-messages?${params.toString()}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  
  const data = await res.json();
  const rawMessages = data.messages || data.data || data.logs || [];
  
  return rawMessages.map((msg: any) => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    agent_name: msg.agent_name || msg.agent,
    role: msg.role,
    content: msg.content || msg.message,
    sender: msg.sender,  // FIX: Include sender per mostrare Tu invece di MIO
    created_at: msg.created_at,
    pending: false
  }));
}

/**
 * Invia un messaggio a un agente tramite l'orchestratore
 * 
 * @param params - Parametri della chiamata
 * @returns Promise che si risolve quando la risposta è ricevuta
 */
export async function sendToAgent(params: SendToAgentParams): Promise<void> {
  const {
    targetAgent,
    message,
    conversationId,
    mode = 'direct', // Default: chiamata diretta
    onUpdateMessages,
    onUpdateConversationId,
    onError,
  } = params;

  try {
    // 1. Chiama orchestratore (centralizzato)
    const response = await callOrchestrator({
      mode,
      targetAgent,
      message,
      conversationId,
    });

    // 2. Aggiorna conversation ID se nuovo
    const finalConversationId = response.conversationId || conversationId;
    if (response.conversationId) {
      onUpdateConversationId(response.conversationId);
    }

    // 3. Ricarica messaggi dal database
    if (finalConversationId) {
      const messages = await reloadMessages(finalConversationId);
      onUpdateMessages(messages);
    }

    // 4. Gestisci errori dal backend
    if (!response.success && response.error) {
      const errorMessage = `❌ Errore: ${response.error.message || 'Errore sconosciuto'}`;
      console.error(`[AgentHelper] Backend error for ${targetAgent}:`, errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (err: any) {
    console.error(`[AgentHelper] Network error for ${targetAgent}:`, err);
    const errorMessage = `❌ Errore di rete: ${err.message}`;
    if (onError) {
      onError(errorMessage);
    }
  }
}
