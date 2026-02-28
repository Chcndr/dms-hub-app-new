/**
 * useConversations — Hook per CRUD conversazioni AI
 * REST API su api.mio-hub.me (NON tRPC)
 */
import { useState, useCallback, useEffect } from "react";
import type { Conversation, ChatMessage, QuotaInfo } from "../types";
import { MIHUB_API_BASE_URL } from "@/config/api";

const AI_API_BASE = `${MIHUB_API_BASE_URL}/api/ai`;

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  quota: QuotaInfo | null;
  fetchConversations: () => Promise<void>;
  createConversation: () => Promise<Conversation | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<ChatMessage[]>;
  fetchQuota: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${AI_API_BASE}/conversations`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Errore nel caricamento conversazioni");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // silently fail — conversations may not exist yet
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation =
    useCallback(async (): Promise<Conversation | null> => {
      try {
        const res = await fetch(`${AI_API_BASE}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Errore nella creazione conversazione");
        const data = await res.json();
        await fetchConversations();
        return data;
      } catch {
        return null;
      }
    }, [fetchConversations]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await fetch(`${AI_API_BASE}/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title } : c))
      );
    } catch {
      // silent fail
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`${AI_API_BASE}/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch {
      // silent fail
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId: string): Promise<ChatMessage[]> => {
      try {
        const res = await fetch(
          `${AI_API_BASE}/conversations/${conversationId}/messages`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.messages ?? [];
      } catch {
        return [];
      }
    },
    []
  );

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch(`${AI_API_BASE}/quota`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setQuota(data);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchQuota();
  }, [fetchConversations, fetchQuota]);

  return {
    conversations,
    isLoading,
    quota,
    fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    fetchMessages,
    fetchQuota,
  };
}
