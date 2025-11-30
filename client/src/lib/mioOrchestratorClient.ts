/**
 * Tipo per i messaggi della chat MIO
 */
export interface MioChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/**
 * Helper per inviare messaggi all'orchestratore MIO
 * Usato SOLO dalla chat principale MIO
 */
export async function sendMioMessage(
  text: string,
  currentConversationId: string | null
): Promise<{ messages: MioChatMessage[]; conversationId: string }> {
  const body: any = { message: text, mode: 'auto' };
  if (currentConversationId) {
    body.conversationId = currentConversationId;
  }

  console.log('[sendMioMessage] Request:', body);

  const res = await fetch('/api/mihub/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`orchestrator HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log('[sendMioMessage] Response:', data);

  // IMPORTANTISSIMO: usa SEMPRE il conversationId restituito dal backend
  const newConversationId = data.conversationId ?? currentConversationId ?? '';

  // Trasforma la risposta in messaggi
  const messages: MioChatMessage[] = [];
  if (data.reply) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.reply,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    messages,
    conversationId: newConversationId,
  };
}

/**
 * Tipo per i messaggi degli agenti
 */
export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  agent?: string;
}

/**
 * Helper per inviare messaggi diretti a un singolo agente
 * Usato dalle chat singole (GPT Dev, Manus, Abacus, Zapier)
 */
export async function sendAgentMessage(
  agent: 'gptdev' | 'manus' | 'abacus' | 'zapier',
  text: string,
  conversationId: string | null,
  setConversationId: (id: string) => void,
  pushMessage: (msg: AgentChatMessage) => void
): Promise<void> {
  const body: any = {
    message: text,
    mode: 'manual',
    targetAgent: agent,
  };
  
  if (conversationId) {
    body.conversationId = conversationId;
  }

  console.log('[sendAgentMessage] Request:', { agent, body });

  const res = await fetch('/api/mihub/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`orchestrator HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log('[sendAgentMessage] Response:', data);

  // Aggiorna conversationId se il backend ne ha restituito uno nuovo
  const newConversationId = data.conversationId ?? conversationId ?? '';
  if (newConversationId && newConversationId !== conversationId) {
    console.log('[sendAgentMessage] Updating conversationId:', newConversationId);
    setConversationId(newConversationId);
  }

  // Aggiungi la risposta dell'agente
  if (data.reply) {
    pushMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.reply,
      createdAt: new Date().toISOString(),
      agent,
    });
  }
}
