/**
 * API Route: Inizializza tabella agent_messages per persistenza messaggi
 * 
 * Endpoint: POST /api/db/init-agent-messages
 * 
 * Questa tabella ospiterà TUTTA la chat:
 * - Messaggi Utente → Agenti
 * - Messaggi MIO → Agenti (deleghe)
 * - Risposte Agenti → Utente
 * - Risposte Agenti → MIO
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('[init-agent-messages] DATABASE_URL not found');
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL not configured'
      });
    }

    console.log('[init-agent-messages] DATABASE_URL found, connecting...');

    // Connessione PostgreSQL
    const sql = postgres(databaseUrl);

    // Crea tabella agent_messages
    await sql`
      CREATE TABLE IF NOT EXISTS agent_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR(255) NOT NULL,
        agent_name VARCHAR(50) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `;

    console.log('[init-agent-messages] Table agent_messages created/verified');

    // Crea indice per performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_agent_messages_conv 
      ON agent_messages(conversation_id, created_at DESC)
    `;

    console.log('[init-agent-messages] Index idx_agent_messages_conv created/verified');

    // Crea indice per agent_name
    await sql`
      CREATE INDEX IF NOT EXISTS idx_agent_messages_agent 
      ON agent_messages(agent_name, created_at DESC)
    `;

    console.log('[init-agent-messages] Index idx_agent_messages_agent created/verified');

    // Chiudi connessione
    await sql.end();

    return res.status(200).json({
      success: true,
      message: 'Table agent_messages initialized successfully',
      details: {
        table: 'agent_messages',
        indexes: ['idx_agent_messages_conv', 'idx_agent_messages_agent'],
        columns: [
          'id (UUID)',
          'conversation_id (VARCHAR)',
          'agent_name (VARCHAR)',
          'sender (VARCHAR)',
          'role (VARCHAR)',
          'content (TEXT)',
          'created_at (TIMESTAMP)',
          'metadata (JSONB)'
        ]
      }
    });

  } catch (err: any) {
    console.error('[init-agent-messages] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
