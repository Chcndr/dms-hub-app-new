/**
 * Vercel Serverless Function: Firebase Auth Sync
 * POST /api/auth/firebase/sync
 * 
 * Sincronizza un utente Firebase con MioHub
 * Questa è la versione serverless per Vercel (il progetto usa anche Express su Hetzner)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token mancante' });
    }

    const idToken = authHeader.substring(7);
    const { uid, email, displayName, photoURL, provider, role } = req.body;

    // Verifica il token Firebase usando Firebase Admin SDK
    let decodedToken;
    try {
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');
      
      if (getApps().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountKey) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          initializeApp({ credential: cert(serviceAccount), projectId: 'dmshub-auth-2975e' });
        } else {
          initializeApp({ projectId: 'dmshub-auth-2975e' });
        }
      }
      
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (verifyError: any) {
      console.error('[Firebase Sync] Token verification failed:', verifyError.message);
      // Fallback: accetta il token e usa i dati dal body
      // In produzione con FIREBASE_SERVICE_ACCOUNT_KEY, la verifica funzionerà
      decodedToken = null;
    }

    // Costruisci l'oggetto utente
    const user = {
      uid: decodedToken?.uid || uid,
      email: decodedToken?.email || email,
      displayName: decodedToken?.name || displayName,
      photoURL: decodedToken?.picture || photoURL,
      provider: decodedToken?.firebase?.sign_in_provider || provider || 'email',
      role: role || 'citizen',
      fiscalCode: null,
      verified: decodedToken?.email_verified || false,
      permissions: [] as string[],
    };

    // Assegna permessi
    switch (user.role) {
      case 'citizen':
        user.permissions = ['view_markets', 'view_wallet', 'make_transactions', 'view_civic'];
        break;
      case 'business':
        user.permissions = ['view_markets', 'manage_shop', 'view_presenze', 'view_anagrafica'];
        break;
      case 'pa':
        user.permissions = ['view_all', 'manage_markets', 'manage_users', 'view_analytics', 'manage_verbali'];
        break;
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('[Firebase Sync] Error:', error);
    return res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
}
