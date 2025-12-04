/**
 * PROXY ORCHESTRATOR CON PERSISTENZA TOTALE
 * 
 * Questo proxy intercetta le chiamate all'orchestrator Hetzner,
 * salva i messaggi nel database, e poi inoltra la richiesta.
 * 
 * Endpoint: POST /api/mihub/orchestrator-proxy
 * 
 * Flow:
 * 1. Riceve messaggio da frontend
 * 2. Inoltra a backend Hetzner
 * 3. Riceve risposta
 * 4. Salva INPUT e OUTPUT nel database
 * 5. Restituisce risposta al frontend
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';

const BACKEND_URL = 'https://orchestratore.mio-hub.me/api/mihub/orchestrator';

interface OrchestratorRequest {
  message: string;
  mode: 'auto' | 'manual';
  targetAgent?: string;
  conversationId?: string | null;
}

interface OrchestratorResponse {
  success: boolean;
  agent: string;
  conversationId: string;
  message: string;
  internalTraces?: any[];
  error?: any;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as OrchestratorRequest;
    const { message, mode, targetAgent, conversationId } = body;

    console.log('[orchestrator-proxy] Request:', { message, mode, targetAgent, conversationId });

    // Validazione
    if (!message || !mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, mode'
      });
    }

    // 1. Inoltra richiesta al backend Hetzner
    console.log('[orchestrator-proxy] Forwarding to Hetzner...');
    const backendResponse = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[orchestrator-proxy] Backend error:', errorText);
      return res.status(backendResponse.status).json({
        success: false,
        error: `Backend error: ${errorText}`
      });
    }

    const data = await backendResponse.json() as OrchestratorResponse;
    console.log('[orchestrator-proxy] Backend response:', data);

    // 2. Salva messaggi nel database (se successo)
    if (data.success && data.conversationId) {
      try {
        await saveMessages({
          conversationId: data.conversationId,
          agentName: data.agent || targetAgent || 'mio',
          userMessage: message,
          assistantMessage: data.message,
          sender: mode === 'auto' ? 'user' : 'user', // TODO: Distinguere MIO
        });
        console.log('[orchestrator-proxy] Messages saved to database');
      } catch (dbError: any) {
        console.error('[orchestrator-proxy] Database save error:', dbError);
        // Non bloccare la risposta se il DB fallisce
      }
    }

    // 3. Restituisci risposta al frontend
    return res.status(200).json(data);

  } catch (err: any) {
    console.error('[orchestrator-proxy] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

/**
 * Salva messaggi nel database
 */
async function saveMessages(params: {
  conversationId: string;
  agentName: string;
  userMessage: string;
  assistantMessage: string;
  sender: string;
}) {
  const { conversationId, agentName, userMessage, assistantMessage, sender } = params;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[saveMessages] DATABASE_URL not configured, skipping save');
    return;
  }

  const sql = postgres(databaseUrl);

  try {
    // A. Salva messaggio INPUT (utente o MIO)
    await sql`
      INSERT INTO agent_messages (conversation_id, agent_name, sender, role, content)
      VALUES (${conversationId}, ${agentName}, ${sender}, 'user', ${userMessage})
    `;

    console.log('[saveMessages] User message saved');

    // B. Salva messaggio OUTPUT (risposta agente)
    await sql`
      INSERT INTO agent_messages (conversation_id, agent_name, sender, role, content)
      VALUES (${conversationId}, ${agentName}, ${agentName}, 'assistant', ${assistantMessage})
    `;

    console.log('[saveMessages] Assistant message saved');

  } finally {
    await sql.end();
  }
}
