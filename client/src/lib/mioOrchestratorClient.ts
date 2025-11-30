/**
 * Helper centralizzato per inviare messaggi a MIO Orchestrator
 * 
 * Usa path relativo /api/mihub/orchestrator che viene gestito dal proxy Vercel.
 * Nessuna chiamata diretta a https://mihub.157-90-29-66.nip.io dal browser.
 */

export async function sendMioMessage(message: string, conversationId: string) {
  console.log('[sendMioMessage] Sending', { message, conversationId });
  const res = await fetch('/api/mihub/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationId,
      mode: 'auto',
    }),
  });

  if (!res.ok) {
    console.error('[sendMioMessage] HTTP error', res.status);
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
