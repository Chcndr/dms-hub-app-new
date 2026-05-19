/**
 * apiFetch — Wrapper centralizzato per fetch verso il backend MIO HUB.
 *
 * Aggiunge automaticamente l'header `Authorization: Bearer <token>` per le
 * richieste verso il nostro backend, con la seguente priorita':
 *   1. `miohub_session_token` da localStorage (hex64, non scade ogni ora)
 *   2. Firebase ID Token (JWT, scade dopo 1h) come fallback
 *
 * Il backend (Fase 10) accetta entrambi sui middleware `requireAuth`,
 * `requireSuperAdmin`, `requirePaymentAuth` e `validateImpersonation`.
 *
 * IMPORTANTE — Solo backend interno:
 * Il Bearer token viene aggiunto SOLO per richieste verso il nostro backend
 * (api.mio-hub.me, miohub.it, o path relativi `/api/...`). Per URL esterni
 * (GitHub raw, CDN, mappe pubbliche, ecc.) il token NON viene aggiunto,
 * perche' alcuni servizi (es. GitHub) rifiutano richieste con un Bearer
 * non valido restituendo 404 invece che 401/403.
 */

import { getIdToken } from "@/lib/firebase";

function isInternalApiUrl(url: string): boolean {
  // Path relativo (proxy Vercel) → backend interno
  if (url.startsWith("/")) return true;
  // Hostname noti del nostro backend
  return url.includes("api.mio-hub.me") || url.includes("miohub.it");
}

/**
 * Variante di fetch che aggiunge il Bearer token Firebase per le chiamate
 * verso il backend MIO HUB. Per URL esterni, equivale a fetch() normale.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (isInternalApiUrl(url) && !headers.has("Authorization")) {
    try {
      // 1. Prima scelta: session_token (hex64) — non scade ogni ora come il Firebase JWT
      const sessionToken = localStorage.getItem("miohub_session_token");

      if (sessionToken) {
        headers.set("Authorization", `Bearer ${sessionToken}`);
      } else {
        // 2. Fallback: Firebase ID Token (JWT) — usato solo se session_token non disponibile
        const token = await getIdToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
    } catch (err) {
      // Token non disponibile (utente non loggato o errore Firebase).
      // Procediamo senza header — il backend gestira' eventuali 401.
      console.warn("[apiFetch] Token non disponibile:", err);
    }
  }

  return fetch(input, { ...init, headers });
}

export default apiFetch;
