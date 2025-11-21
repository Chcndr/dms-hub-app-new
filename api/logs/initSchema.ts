import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('[initSchema] Starting...');
    
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('[initSchema] DATABASE_URL not found');
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL not configured'
      });
    }
    
    console.log('[initSchema] DATABASE_URL found, connecting...');
    
    // Create Postgres connection
    const connection = postgres(databaseUrl);
    const db = drizzle(connection);
    
    console.log('[initSchema] Checking if table exists...');
    
    // Check if table exists (Postgres)
    const rows = await connection`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'mio_agent_logs'
    `;
    
    const tableExists = rows[0]?.count > 0;
    
    console.log(`[initSchema] Table exists: ${tableExists}`);
    
    if (tableExists) {
      await connection.end();
      return res.status(200).json({
        success: true,
        message: 'Table mio_agent_logs already exists',
        status: 'existing'
      });
    }
    
    console.log('[initSchema] Creating table...');
    
    // Create table (Postgres)
    await connection`
      CREATE TABLE IF NOT EXISTS mio_agent_logs (
        id SERIAL PRIMARY KEY,
        agent VARCHAR(100) NOT NULL,
        action VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
        message TEXT,
        details TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_agent ON mio_agent_logs(agent);
      CREATE INDEX IF NOT EXISTS idx_status ON mio_agent_logs(status);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON mio_agent_logs(timestamp DESC);
    `;
    
    console.log('[initSchema] Table created successfully');
    
    await connection.end();
    
    return res.status(200).json({
      success: true,
      message: 'Table mio_agent_logs created successfully',
      status: 'created'
    });
  } catch (error: any) {
    console.error('[initSchema] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize schema',
      stack: error.stack
    });
  }
}
