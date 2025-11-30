/**
 * Helper centralizzato per inviare messaggi a MIO Orchestrator
 * Usato sia dalla chat principale che dal ChatWidget
 * 
 * IMPORTANTE: Usa dominio diretto orchestratore.mio-hub.me perché
 * il proxy Vercel /api/mihub/orchestrator non funziona dal browser
 * (funziona da curl ma non da fetch nel browser, probabilmente CORS).
 * 
 * Versione: 2025-11-30 - Fix con dominio diretto
 */

export interface SendMioMessageResponse {
  success: boolean;
  agent: string;
  message: string | null;
  conversationId: string | null;
  error?: {
    type: string;
    provider?: string | null;
    statusCode?: number;
    message?: string;
  } | null;
}

export async function sendMioMessage(
  content: string,
  conversationId: string | null
): Promise<SendMioMessageResponse> {
  const res = await fetch('https://orchestratore.mio-hub.me/api/mihub/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      conversationId,
      mode: 'auto',
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
