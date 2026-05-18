/**
 * API Client per Piattaforme PA
 * 
 * Gestisce le chiamate al backend per PDND, SSU e Audit Trail.
 * Usa MIHUB_API_BASE_URL e supporta impersonificazione.
 * 
 * NOTA: Le piattaforme App IO e ANPR restano mock fino all'implementazione backend.
 * PDND e SSU sono collegati ai dati reali del backend.
 */

import { MIHUB_API_BASE_URL } from "@/config/api";
import { addComuneIdToUrl } from "@/hooks/useImpersonation";
import { apiFetch } from "@/lib/apiFetch";

// ============================================
// Types
// ============================================

export interface PdndStatus {
  success: boolean;
  pdnd: {
    configured: boolean;
    environment: string;
    token_url: string;
    client_id: string | null;
    key_id: string | null;
    purposes: string[];
    vouchers: {
      total: number;
      active: number;
      expired: number;
    };
  };
}

export interface PdndVoucher {
  id: number;
  e_service_id: string;
  purpose_id: string;
  access_token: string;
  expires_at: string;
  created_at: string;
  status: string;
}

export interface PdndVouchersResponse {
  success: boolean;
  vouchers: PdndVoucher[];
  count: number;
}

export interface SsuStatus {
  success: boolean;
  ssu: {
    enabled: boolean;
    backOfficeUrl: string | null;
    frontOfficeUrl: string;
    cuiContext: string;
    maxRetries: number;
    instances: {
      total: number;
      pending: number;
      completed: number;
    };
  };
}

export interface SsuInstance {
  id: number;
  pratica_id: number;
  cui_uuid: string;
  cui_context: string;
  stato_ssu: string;
  ente_destinatario: string;
  hash_istanza: string;
  retry_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SsuInstancesResponse {
  success: boolean;
  instances: SsuInstance[];
  total: number;
  limit: number;
  offset: number;
}

export interface SsuAuditEntry {
  id: number;
  instance_id: number | null;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface SsuAuditResponse {
  success: boolean;
  audit_trail: SsuAuditEntry[];
  count: number;
}

export interface SendInstanceResponse {
  success: boolean;
  error?: string;
  details?: {
    missing?: string[];
    hint?: string;
  };
  instance?: SsuInstance;
  cui?: string;
}

// ============================================
// PDND API
// ============================================

export async function getPdndStatus(): Promise<PdndStatus> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/pdnd/status`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`PDND status error: ${res.status}`);
  return res.json();
}

export async function getPdndVouchers(): Promise<PdndVouchersResponse> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/pdnd/vouchers`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`PDND vouchers error: ${res.status}`);
  return res.json();
}

export async function requestPdndVoucher(eServiceId: string, purposeId: string): Promise<{ success: boolean; voucher?: PdndVoucher; error?: string }> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/pdnd/voucher`);
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ e_service_id: eServiceId, purpose_id: purposeId }),
  });
  return res.json();
}

export async function testPdndConnection(): Promise<{ success: boolean; responseTimeMs: number; configured: boolean; environment: string }> {
  const start = Date.now();
  const status = await getPdndStatus();
  const responseTimeMs = Date.now() - start;
  return {
    success: status.success,
    responseTimeMs,
    configured: status.pdnd.configured,
    environment: status.pdnd.environment,
  };
}

// ============================================
// SSU API
// ============================================

export async function getSsuStatus(): Promise<SsuStatus> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/ssu/status`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`SSU status error: ${res.status}`);
  return res.json();
}

export async function getSsuInstances(params?: { stato?: string; ente?: string; limit?: number; offset?: number }): Promise<SsuInstancesResponse> {
  let url = `${MIHUB_API_BASE_URL}/api/ssu/instances`;
  const queryParams = new URLSearchParams();
  if (params?.stato) queryParams.set("stato", params.stato);
  if (params?.ente) queryParams.set("ente", params.ente);
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  url = addComuneIdToUrl(url);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`SSU instances error: ${res.status}`);
  return res.json();
}

export async function getSsuAuditTrail(limit?: number): Promise<SsuAuditResponse> {
  let url = `${MIHUB_API_BASE_URL}/api/ssu/audit-trail`;
  if (limit) url += `?limit=${limit}`;
  url = addComuneIdToUrl(url);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`SSU audit error: ${res.status}`);
  return res.json();
}

export async function sendSsuInstance(praticaId: number): Promise<SendInstanceResponse> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/ssu/send-instance`);
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pratica_id: praticaId }),
  });
  return res.json();
}

export async function retrySsuInstance(instanceId: number): Promise<{ success: boolean; error?: string }> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/ssu/retry-instance`);
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instance_id: instanceId }),
  });
  return res.json();
}

// ============================================
// ANPR API (DATI REALI)
// ============================================

export interface AnprStatus {
  success: boolean;
  anpr: {
    mode: "sandbox" | "production";
    pdnd_configured: boolean;
    pdnd_required: boolean;
    description: string;
    available_cfs: string[];
    stats: {
      total_calls: number;
      last_10_success: number;
      last_10_errors: number;
      last_call: string | null;
    };
  };
}

export interface AnprResidenzaResponse {
  success: boolean;
  source: string;
  mode: string;
  codice_fiscale: string;
  data: {
    soggetto: {
      nome: string;
      cognome: string;
      sesso: string;
      data_nascita: string;
      comune_nascita: { codice: string; descrizione: string };
      provincia_nascita: string;
      codice_fiscale: string;
    };
    residenza: {
      indirizzo: string;
      civico: string;
      cap: string;
      comune: { codice: string; descrizione: string };
      provincia: string;
      data_decorrenza: string;
    };
    stato_civile: string;
    cittadinanza: string;
    aire: boolean;
    decesso: string | null;
  };
  response_time_ms: number;
  timestamp: string;
}

export async function getAnprStatus(): Promise<AnprStatus> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/anpr/status`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`ANPR status error: ${res.status}`);
  return res.json();
}

export async function verificaResidenza(cf: string): Promise<AnprResidenzaResponse> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/anpr/residenza/${cf}`);
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `ANPR error: ${res.status}`);
  }
  return res.json();
}

// ============================================
// APP IO API (DATI REALI)
// ============================================

export interface AppIoStatus {
  success: boolean;
  appio: {
    mode: "sandbox" | "production";
    connected: boolean;
    has_api_key: boolean;
    api_url: string;
    templates_count: number;
    stats: {
      total_sent: number;
      last_24h: number;
      success_rate: number;
      last_message: string | null;
    };
  };
}

export interface AppIoTemplate {
  id: string;
  name: string;
  subject: string;
  required_params: string[];
  category: string;
  active: boolean;
  markdown_preview: string;
}

export interface AppIoTemplatesResponse {
  success: boolean;
  templates: AppIoTemplate[];
  total: number;
  categories: string[];
}

export interface AppIoSendResponse {
  success: boolean;
  mode: string;
  message: {
    id: string;
    template_id: string;
    template_name: string;
    fiscal_code: string;
    subject: string;
    content_preview: string;
    status: string;
    sent_at: string;
    response_time_ms: number;
  };
  note?: string;
}

export async function getAppIoStatus(): Promise<AppIoStatus> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/appio/status`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`App IO status error: ${res.status}`);
  return res.json();
}

export async function getAppIoTemplates(): Promise<AppIoTemplatesResponse> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/appio/templates`);
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`App IO templates error: ${res.status}`);
  return res.json();
}

export async function sendAppIoMessage(templateId: string, fiscalCode: string, params: Record<string, string>): Promise<AppIoSendResponse> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/appio/send-message`);
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId, fiscal_code: fiscalCode, params }),
  });
  return res.json();
}

export async function testAppIoConnection(): Promise<{ success: boolean; mode: string; api_reachable: boolean; response_time_ms: number }> {
  const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/appio/test-connection`);
  const res = await apiFetch(url, { method: "POST" });
  return res.json();
}

// ============================================
// Combined Audit Trail (PDND + SSU)
// ============================================

export interface CombinedAuditItem {
  id: number;
  platform: "pdnd" | "ssu" | "appio" | "anpr" | "sso";
  action: string;
  status: "success" | "error" | "pending";
  user_email: string;
  created_at: string;
  duration_ms?: number;
}

export async function getCombinedAuditTrail(): Promise<{ items: CombinedAuditItem[] }> {
  // Fetch SSU audit trail (real data)
  const ssuAudit = await getSsuAuditTrail(20);
  
  // Map SSU audit entries to combined format
  const ssuItems: CombinedAuditItem[] = ssuAudit.audit_trail.map((entry) => ({
    id: entry.id,
    platform: "ssu" as const,
    action: entry.action,
    status: entry.action.includes("error") || entry.action.includes("fail") ? "error" : "success",
    user_email: entry.actor || "system",
    created_at: entry.created_at,
    duration_ms: undefined,
  }));

  // Return combined (SSU real + future PDND real)
  return { items: ssuItems };
}
