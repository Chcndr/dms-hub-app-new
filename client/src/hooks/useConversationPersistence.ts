/**
 * Hook per persistenza conversazione
 * 
 * Salva e ripristina conversation_id in localStorage
 * per mantenere la cronologia chat dopo refresh
 */

import { useState, useEffect } from 'react';

const DEFAULT_STORAGE_KEY = 'mio_conversation_id';

export interface ConversationPersistence {
  conversationId: string | null;
  setConversationId: (id: string) => void;
  clearConversation: () => void;
}

/**
 * Hook per gestire la persistenza del conversation_id
 * @param storageKey - Chiave localStorage opzionale (default: 'mio_conversation_id')
 */
export function useConversationPersistence(storageKey?: string): ConversationPersistence {
  const STORAGE_KEY = storageKey || DEFAULT_STORAGE_KEY;
  const [conversationId, setConversationIdState] = useState<string | null>(null);

  // Carica conversation_id al mount (se esiste)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setConversationIdState(stored);
      console.log('[Persistence] Restored conversation_id:', stored);
    } else {
      // 🔥 FIX: Per TUTTE le conversazioni con storageKey definita, usa la key come ID fisso
      // Questo include sia coordinamento (mio-manus-coordination) che chat singole (user-gptdev-direct)
      if (storageKey) {
        const fixedId = storageKey;  // es. "user-gptdev-direct" o "mio-manus-coordination"
        localStorage.setItem(STORAGE_KEY, fixedId);
        setConversationIdState(fixedId);
        console.log('[Persistence] Created fixed ID from storageKey:', fixedId);
      } else {
        // Solo per il default (mio_conversation_id) rimane null finché non viene creato
        setConversationIdState(null);
        console.log('[Persistence] No conversation_id found, will be created by backend');
      }
    }
  }, [STORAGE_KEY, storageKey]);

  // Salva conversation_id in localStorage
  const setConversationId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setConversationIdState(id);
    console.log('[Persistence] Saved conversation_id:', id);
  };

  // Cancella conversation_id
  const clearConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConversationIdState(null);
    console.log('[Persistence] Cleared conversation_id');
  };

  return {
    conversationId,
    setConversationId,
    clearConversation,
  };
}
