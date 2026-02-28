/**
 * API Configuration
 *
 * Centralized API base URLs for the DMS Hub application.
 * All API calls should use these constants instead of hardcoded URLs.
 *
 * Backend principale: api.mio-hub.me (Hetzner)
 * In produzione, il proxy Vercel gestisce /api/* → api.mio-hub.me
 * In sviluppo, usiamo URL diretto come fallback.
 */

/**
 * MIHUB Backend API (Hetzner)
 * Used for:
 * - Markets data (/markets/...)
 * - Stalls data (/stalls/...)
 * - GIS data (/gis/...)
 * - Companies data (/markets/:code/companies)
 * - Concessions data (/markets/:code/concessions)
 * - Admin endpoints (/admin/...)
 * - Guardian logs (/admin/guardian/...)
 * - tRPC endpoints (/api/trpc/...)
 */
export const MIHUB_API_BASE_URL =
  import.meta.env.VITE_MIHUB_API_URL || "https://api.mio-hub.me";

/**
 * Orchestratore API (backend REST principale)
 * Alias per il backend Hetzner api.mio-hub.me
 */
export const ORCHESTRATORE_API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.mio-hub.me";

/**
 * TCC Carbon Credit API
 * In produzione usa il proxy Vercel (/api/tcc/* → api.mio-hub.me/api/tcc/*)
 * In sviluppo usa l'URL diretto.
 */
export const TCC_API_BASE = import.meta.env.DEV ? "https://api.mio-hub.me" : "";

/**
 * AI Chat API
 * Used for AI assistant and chat features.
 * Usa il proxy Vercel in produzione, URL diretto in dev.
 */
export const AI_API_BASE_URL =
  import.meta.env.VITE_API_URL || `${ORCHESTRATORE_API_BASE_URL}/api/v1`;
