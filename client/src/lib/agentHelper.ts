/**
 * 🏗️ TABULA RASA - Agent Helper
 * 
 * Funzione centralizzata per inviare messaggi agli agenti.
 * Elimina duplicazione codice e standardizza tutte le chiamate.
 */

import { callOrchestrator, type AgentId, type OrchestratorMode } from '@/api/orchestratorClient';
import { logsAPI } from '@/utils/mihubAPI';

export interface AgentMessage {
  id: string;
  conversation_id: string;
  agent_name: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  /** Mode: "manual" = direct, "auto" = via MIO */
  mode?: OrchestratorMode;
  /** Callback per aggiornare i messaggi */
  onUpdateMessages: (updater: (prev: AgentMessage[]) => AgentMessage[]) => void;
  /** Callback per aggiornare conversation ID */
  onUpdateConversationId: (id: string) => void;
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
    mode = 'manual', // Default: chiamata diretta
    onUpdateMessages,
    onUpdateConversationId,
  } = params;

  // 1. Aggiungi messaggio utente (Optimistic UI)
  const userMsg: AgentMessage = {
    id: crypto.randomUUID(),
    conversation_id: conversationId || '',
    agent_name: targetAgent,
    role: 'user',
    content: message,
    created_at: new Date().toISOString(),
    pending: true,
  };
  onUpdateMessages(prev => [...prev, userMsg]);

  try {
    // 2. Chiama orchestratore (centralizzato)
    const startTime = Date.now();
    const response = await callOrchestrator({
      mode,
      targetAgent,
      message,
      conversationId,
    });
    const durationMs = Date.now() - startTime;

    console.log(`[AgentHelper] Response from ${targetAgent}:`, response);

    // 3. Aggiorna conversation ID se nuovo
    if (response.conversationId) {
      onUpdateConversationId(response.conversationId);
    }

    // 4. Rimuovi flag pending dal messaggio utente
    onUpdateMessages(prev =>
      prev.map(msg => (msg.pending ? { ...msg, pending: false } : msg))
    );

    // 5. Registra log Guardian per GPT Dev
    if (targetAgent === 'gptdev' || targetAgent === 'dev') {
      try {
        await logsAPI.createLog({
          agent: 'gptdev',
          endpoint: '/api/mihub/orchestrator',
          method: 'POST',
          statusCode: response.success ? 200 : 500,
          success: response.success,
          message: response.success 
            ? `Orchestrator: ${mode} mode, agent: gptdev` 
            : `Error: ${response.error?.message || 'Unknown error'}`,
          meta: {
            conversationId: response.conversationId,
            mode,
            durationMs,
          },
        });
        console.log('[AgentHelper] Guardian log created for gptdev');
      } catch (logError) {
        console.error('[AgentHelper] Failed to create Guardian log:', logError);
        // Non bloccare il flusso se il logging fallisce
      }
    }

    // 6. Aggiungi risposta dell'agente
    if (response.message) {
      const assistantMsg: AgentMessage = {
        id: crypto.randomUUID(),
        conversation_id: response.conversationId || conversationId || '',
        agent_name: targetAgent,
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };
      onUpdateMessages(prev => [...prev, assistantMsg]);
    }

    // 7. Gestisci errori dal backend
    if (!response.success && response.error) {
      const errorMsg: AgentMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        agent_name: targetAgent,
        role: 'system',
        content: `❌ Errore: ${response.error.message || 'Errore sconosciuto'}`,
        created_at: new Date().toISOString(),
      };
      onUpdateMessages(prev => [...prev, errorMsg]);
    }
  } catch (err: any) {
    console.error(`[AgentHelper] Network error for ${targetAgent}:`, err);

    // Rimuovi pending e aggiungi messaggio di errore
    onUpdateMessages(prev => [
      ...prev.map(msg => (msg.pending ? { ...msg, pending: false } : msg)),
      {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        agent_name: targetAgent,
        role: 'system',
        content: `❌ Errore di rete: ${err.message}`,
        created_at: new Date().toISOString(),
      },
    ]);
  }
}
