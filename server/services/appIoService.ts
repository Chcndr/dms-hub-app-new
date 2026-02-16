/**
 * AppIO Service — Notifiche tramite App IO
 *
 * Predisposizione per invio notifiche ai cittadini tramite App IO.
 * Con APPIO_MOCK_MODE=true (default), simula tutte le risposte.
 *
 * Template messaggi predefiniti:
 * - scadenza_concessione
 * - avviso_pagamento
 * - verbale_emesso
 * - conferma_prenotazione
 */

const APPIO_API_KEY = process.env.APPIO_API_KEY || "";
const APPIO_BASE_URL = process.env.APPIO_BASE_URL || "mock";
const APPIO_MOCK_MODE = process.env.APPIO_MOCK_MODE !== "false"; // default true

// ============================================
// Template messaggi
// ============================================

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  markdownBody: string;
  requiredParams: string[];
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "scadenza_concessione",
    name: "Scadenza Concessione",
    subject: "Scadenza concessione mercato",
    markdownBody:
      "Gentile operatore,\n\nLa sua concessione per il mercato **{nome}** scade il **{data}**.\n\nLa invitiamo a procedere con il rinnovo presso lo sportello competente o tramite il portale DMS Hub.\n\nCordiali saluti,\nComune di {comune}",
    requiredParams: ["nome", "data", "comune"],
  },
  {
    id: "avviso_pagamento",
    name: "Avviso di Pagamento PagoPA",
    subject: "Nuovo avviso di pagamento",
    markdownBody:
      "Gentile utente,\n\nE' stato emesso un nuovo avviso di pagamento PagoPA.\n\n**Importo**: {importo} EUR\n**Causale**: {causale}\n\nPuo' procedere al pagamento tramite il portale PagoPA o presso i punti di pagamento abilitati.\n\nCordiali saluti,\nComune di {comune}",
    requiredParams: ["importo", "causale", "comune"],
  },
  {
    id: "verbale_emesso",
    name: "Verbale di Contestazione",
    subject: "Verbale di contestazione emesso",
    markdownBody:
      "Gentile operatore,\n\nE' stato emesso un verbale di contestazione n. **{numero}** in data {data}.\n\n**Motivo**: {motivo}\n\nPuo' consultare i dettagli e presentare eventuali controdeduzioni tramite il portale DMS Hub entro 30 giorni dalla notifica.\n\nCordiali saluti,\nPolizia Municipale - Comune di {comune}",
    requiredParams: ["numero", "data", "motivo", "comune"],
  },
  {
    id: "conferma_prenotazione",
    name: "Conferma Prenotazione Posteggio",
    subject: "Prenotazione posteggio confermata",
    markdownBody:
      "Gentile operatore,\n\nLa sua prenotazione e' stata confermata.\n\n**Posteggio**: {codice}\n**Data**: {data}\n**Mercato**: {mercato}\n\nSi prega di presentarsi entro le ore 07:00 del giorno indicato.\n\nCordiali saluti,\nComune di {comune}",
    requiredParams: ["codice", "data", "mercato", "comune"],
  },
];

// ============================================
// Tipi
// ============================================

interface AppIoMessageResult {
  sent: boolean;
  messageId: string | null;
  fiscalCode: string;
  templateId: string;
  timestamp: string;
}

interface AppIoProfile {
  fiscalCode: string;
  isAppIoEnabled: boolean;
  isEmailEnabled: boolean;
  isWebhookEnabled: boolean;
  preferredLanguages: string[];
  timestamp: string;
}

interface AppIoStatus {
  connected: boolean;
  mode: "mock" | "live";
  baseUrl: string;
  hasApiKey: boolean;
  templatesCount: number;
  timestamp: string;
}

// ============================================
// Funzioni
// ============================================

/**
 * Applica i parametri al template markdown.
 */
function applyTemplate(
  template: MessageTemplate,
  params: Record<string, string>
): { subject: string; markdown: string } {
  let markdown = template.markdownBody;
  let subject = template.subject;

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    markdown = markdown.replaceAll(placeholder, value);
    subject = subject.replaceAll(placeholder, value);
  }

  return { subject, markdown };
}

/**
 * Invia un messaggio a un cittadino tramite App IO.
 * In mock mode simula l'invio con successo.
 */
export async function sendMessage(
  fiscalCode: string,
  subject: string,
  markdown: string
): Promise<AppIoMessageResult> {
  const cf = fiscalCode.toUpperCase().trim();

  if (APPIO_MOCK_MODE) {
    return {
      sent: true,
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      fiscalCode: cf,
      templateId: "custom",
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`${APPIO_BASE_URL}/api/v1/messages/${cf}`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": APPIO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: {
        subject: subject.substring(0, 120), // AppIO limit
        markdown,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AppIO send message failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };

  return {
    sent: true,
    messageId: data.id,
    fiscalCode: cf,
    templateId: "custom",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Invia un messaggio usando un template predefinito.
 */
export async function sendTemplateMessage(
  fiscalCode: string,
  templateId: string,
  params: Record<string, string>
): Promise<AppIoMessageResult> {
  const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template non trovato: ${templateId}`);
  }

  // Verifica parametri richiesti
  for (const requiredParam of template.requiredParams) {
    if (!params[requiredParam]) {
      throw new Error(`Parametro mancante per template ${templateId}: ${requiredParam}`);
    }
  }

  const { subject, markdown } = applyTemplate(template, params);
  const result = await sendMessage(fiscalCode, subject, markdown);
  return { ...result, templateId };
}

/**
 * Verifica se un cittadino ha App IO attiva.
 * In mock mode restituisce sempre attivo.
 */
export async function getProfile(
  fiscalCode: string
): Promise<AppIoProfile> {
  const cf = fiscalCode.toUpperCase().trim();

  if (APPIO_MOCK_MODE) {
    // Simula: ~80% dei CF hanno App IO
    const hasAppIo = cf.charCodeAt(0) % 5 !== 0;
    return {
      fiscalCode: cf,
      isAppIoEnabled: hasAppIo,
      isEmailEnabled: true,
      isWebhookEnabled: false,
      preferredLanguages: ["it"],
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`${APPIO_BASE_URL}/api/v1/profiles/${cf}`, {
    headers: {
      "Ocp-Apim-Subscription-Key": APPIO_API_KEY,
    },
  });

  if (response.status === 404) {
    return {
      fiscalCode: cf,
      isAppIoEnabled: false,
      isEmailEnabled: false,
      isWebhookEnabled: false,
      preferredLanguages: [],
      timestamp: new Date().toISOString(),
    };
  }

  if (!response.ok) {
    throw new Error(`AppIO get profile failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    sender_allowed: boolean;
    email?: { enabled: boolean };
    webhook?: { enabled: boolean };
    preferred_languages?: string[];
  };

  return {
    fiscalCode: cf,
    isAppIoEnabled: data.sender_allowed,
    isEmailEnabled: data.email?.enabled ?? false,
    isWebhookEnabled: data.webhook?.enabled ?? false,
    preferredLanguages: data.preferred_languages || ["it"],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Stato connessione App IO.
 */
export async function getStatus(): Promise<AppIoStatus> {
  if (APPIO_MOCK_MODE) {
    return {
      connected: true,
      mode: "mock",
      baseUrl: APPIO_BASE_URL,
      hasApiKey: !!APPIO_API_KEY,
      templatesCount: MESSAGE_TEMPLATES.length,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Verifica connettivita' con un health check
    const response = await fetch(`${APPIO_BASE_URL}/info`, {
      headers: { "Ocp-Apim-Subscription-Key": APPIO_API_KEY },
    });

    return {
      connected: response.ok,
      mode: "live",
      baseUrl: APPIO_BASE_URL,
      hasApiKey: !!APPIO_API_KEY,
      templatesCount: MESSAGE_TEMPLATES.length,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      connected: false,
      mode: "live",
      baseUrl: APPIO_BASE_URL,
      hasApiKey: !!APPIO_API_KEY,
      templatesCount: MESSAGE_TEMPLATES.length,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Lista template messaggi disponibili.
 */
export function listTemplates(): MessageTemplate[] {
  return MESSAGE_TEMPLATES;
}
