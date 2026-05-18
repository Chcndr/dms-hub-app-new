/**
 * apiFetch — Wrapper centralizzato per fetch verso il backend MIO HUB.
 *
 * Aggiunge automaticamente l'header `Authorization: Bearer <ID_TOKEN>` con
 * l'ID token di Firebase dell'utente corrente, se disponibile.
 *
 * Da usare al posto di `fetch()` per tutte le chiamate verso `api.mio-hub.me`.
 *
 * Se l'utente non e' loggato (token assente), la fetch parte senza header
 * Authorization — il backend rispondera' 401 sugli endpoint protetti.
 */

import { getIdToken } from "@/lib/firebase";

/**
 * Variante di fetch che aggiunge il Bearer token Firebase.
 *
 * Mantiene la stessa firma di `fetch()` per essere drop-in replacement.
 * Le opzioni passate vengono preservate; eventuali header espliciti hanno
 * priorita' su quelli auto-aggiunti.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Authorization")) {
    try {
      const token = await getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err) {
      // Token non disponibile (utente non loggato o errore Firebase).
      // Procediamo senza header — il backend gestira' eventuali 401.
      console.warn("[apiFetch] Token Firebase non disponibile:", err);
    }
  }

  return fetch(input, { ...init, headers });
}

export default apiFetch;
