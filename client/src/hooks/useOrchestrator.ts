/**
 * Hook per gestione orchestratore multi-agente
 * 
 * Gestisce:
 * - Invio messaggi all'orchestratore
 * - Recupero conversazioni
 * - Stato messaggi per ogni agente
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export type AgentId = 'mio_dev' | 'abacus' | 'zapier' | 'manus_worker';
export type Mode = 'auto' | 'manual';

export interface Message {
  id: number;
  sender: 'user' | AgentId;
  content: string;
  timestamp: string; // ISO string
  metadata?: any;
}

export interface OrchestratorRequest {
  message: string;
  mode: Mode;
  targetAgent?: AgentId;
}

export interface OrchestratorResponse {
  success: boolean;
  message: string;
  agentsUsed: AgentId[];
  conversationId: string;
  timestamp: string; // ISO string
}

/**
 * Hook principale orchestratore
 */
export function useOrchestrator(userId: string = 'user_dashboard') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutation per inviare messaggio
  const orchestratorMutation = trpc.mihub.orchestrator.useMutation();

  /**
   * Invia messaggio all'orchestratore
   */
  const sendMessage = async (request: OrchestratorRequest): Promise<OrchestratorResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orchestratorMutation.mutateAsync({
        message: request.message,
        userId,
        mode: request.mode,
        targetAgent: request.targetAgent,
        context: {
          dashboardTab: 'mio',
        },
      });

      setIsLoading(false);
      return response as OrchestratorResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      setIsLoading(false);
      console.error('[useOrchestrator] Error:', err);
      return null;
    }
  };

  return {
    sendMessage,
    isLoading,
    error,
  };
}

/**
 * Hook per conversazione singolo agente
 */
export function useAgentConversation(agentId: AgentId, userId: string = 'user_dashboard') {
  const [messages, setMessages] = useState<Message[]>([]);

  // Query per recuperare conversazione
  const conversationQuery = trpc.mihub.getConversation.useQuery(
    { userId, agentId, limit: 50 },
    { refetchInterval: 5000 } // Polling ogni 5 secondi
  );

  useEffect(() => {
    if (conversationQuery.data) {
      const formattedMessages: Message[] = conversationQuery.data.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        metadata: msg.metadata,
      }));
      setMessages(formattedMessages);
    }
  }, [conversationQuery.data]);

  return {
    messages,
    isLoading: conversationQuery.isLoading,
    error: conversationQuery.error,
    refetch: conversationQuery.refetch,
  };
}

/**
 * Hook per tutte le conversazioni (4 agenti)
 */
export function useAllConversations(userId: string = 'user_dashboard') {
  const [conversations, setConversations] = useState<Record<AgentId, Message[]>>({
    mio_dev: [],
    abacus: [],
    zapier: [],
    manus_worker: [],
  });

  // Query per recuperare tutte le conversazioni
  const allConversationsQuery = trpc.mihub.getAllConversations.useQuery(
    { userId },
    { refetchInterval: 5000 } // Polling ogni 5 secondi
  );

  useEffect(() => {
    if (allConversationsQuery.data) {
      const formatted: Record<AgentId, Message[]> = {
        mio_dev: [],
        abacus: [],
        zapier: [],
        manus_worker: [],
      };

      for (const agentId of ['mio_dev', 'abacus', 'zapier', 'manus_worker'] as AgentId[]) {
        const agentMessages = allConversationsQuery.data[agentId] || [];
        formatted[agentId] = agentMessages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          metadata: msg.metadata,
        }));
      }

      setConversations(formatted);
    }
  }, [allConversationsQuery.data]);

  return {
    conversations,
    isLoading: allConversationsQuery.isLoading,
    error: allConversationsQuery.error,
    refetch: allConversationsQuery.refetch,
  };
}

/**
 * Formatta timestamp per visualizzazione
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Mappa agent ID backend → frontend
 */
export function mapAgentId(backendId: AgentId): 'mio' | 'manus' | 'abacus' | 'zapier' {
  const mapping: Record<AgentId, 'mio' | 'manus' | 'abacus' | 'zapier'> = {
    mio_dev: 'mio',
    manus_worker: 'manus',
    abacus: 'abacus',
    zapier: 'zapier',
  };
  return mapping[backendId];
}

/**
 * Mappa agent ID frontend → backend
 */
export function mapAgentIdToBackend(frontendId: 'mio' | 'manus' | 'abacus' | 'zapier'): AgentId {
  const mapping: Record<'mio' | 'manus' | 'abacus' | 'zapier', AgentId> = {
    mio: 'mio_dev',
    manus: 'manus_worker',
    abacus: 'abacus',
    zapier: 'zapier',
  };
  return mapping[frontendId];
}
