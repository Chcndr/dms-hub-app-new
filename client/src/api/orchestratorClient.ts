/**
 * Orchestrator Client - REST API verso backend Hetzner
 * 
 * L'orchestratore vive SOLO su Hetzner (mihub-backend-rest).
 * Questo client chiama direttamente https://api.mio-hub.me/mihub/orchestrator
 * 
 * NON usa tRPC, NON passa per Vercel serverless functions.
 */

// ============================================================================
// TYPES
// ============================================================================

export type OrchestratorMode = "auto" | "direct";
export type AgentId = "mio" | "dev" | "gptdev" | "manus" | "manus_worker" | "zapier" | "abacus" | "abacus_sql" | "gemini_arch";

export interface OrchestratorRequest {
  mode: OrchestratorMode;
  targetAgent?: AgentId;
  conversationId?: string | null;
  message: string;
  meta?: Record<string, any>;
  // Campi per Abacus SQL (task strutturati)
  task?: string;
  params?: Record<string, any>;
}

export interface OrchestratorResponse {
  success: boolean;
  agent: AgentId;
  conversationId: string | null;
  message: string | null;
  error?: {
    type: string;
    provider?: string | null;
    statusCode?: number;
    message?: string;
  } | null;
}

// ============================================================================
// CLIENT
// ============================================================================

/**
 * Base URL del backend Hetzner
 * - Production/Preview: usa VITE_API_URL se configurato
 * - Fallback: https://api.mio-hub.me
 */
const baseUrl =
  import.meta.env.VITE_API_URL ?? "https://api.mio-hub.me";

/**
 * Chiama l'orchestratore su Hetzner
 * 
 * @param payload - Richiesta orchestratore
 * @returns Risposta orchestratore
 * @throws Error se la richiesta HTTP fallisce
 */
export async function callOrchestrator(
  payload: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const url = `${baseUrl}/api/mihub/orchestrator`;

  // 🔥 Timeout aumentato a 60s per agenti lenti (Manus, Zapier)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondi
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // 🔥 FIX: Verifica Content-Type prima di parsare JSON
    const contentType = res.headers.get("content-type") || "";
    
    // Se non è JSON, leggi come testo e genera errore user-friendly
    if (!contentType.includes("application/json")) {
      const textResponse = await res.text();
      console.error("[OrchestratorClient] Risposta non-JSON:", textResponse);
      
      // Gestisci errori comuni
      if (textResponse.includes("Too many requests") || res.status === 429) {
        throw new Error("Troppe richieste. Attendi qualche secondo e riprova.");
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error("Server temporaneamente non disponibile. Riprova tra poco.");
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("Accesso non autorizzato all'orchestratore.");
      }
      
      throw new Error(`Errore server: ${textResponse.substring(0, 100)}`);
    }

    // Prova a parsare il JSON
    let data: OrchestratorResponse;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("[OrchestratorClient] Errore parsing JSON:", parseError);
      throw new Error("Risposta malformata dal server. Riprova.");
    }
    
    // 🔥 FIX: Gestisci errori nel body JSON
    if (!data.success && data.error) {
      const errorMessage = data.error.message || data.error.type || "Errore sconosciuto";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error("[OrchestratorClient] Timeout dopo 60s");
      throw new Error("Timeout: L'agente non ha risposto entro 60 secondi");
    }
    
    // 🔥 FIX: Gestisci errori di rete
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Impossibile connettersi al server. Verifica la connessione.");
    }
    
    throw error;
  }
}
