/**
 * PDND Service — Piattaforma Digitale Nazionale Dati
 *
 * Predisposizione per interoperabilita' PDND con mock mode.
 * In produzione, genera voucher JWT OAuth 2.0 e chiama e-Service.
 * Con PDND_MOCK_MODE=true (default), simula tutte le risposte.
 *
 * e-Service esposti:
 * - dms-mercati: lista mercati, posteggi, disponibilita'
 * - dms-concessioni: stato concessioni, scadenze
 * - dms-operatori: verifica operatore, stato autorizzazioni
 *
 * Integrazione ANPR via PDND:
 * - verificaCodiceFiscale: verifica esistenza CF su ANPR
 * - verificaResidenza: lookup residenza da CF
 */

import crypto from "crypto";

// Configurazione da env (con default mock)
const PDND_BASE_URL = process.env.PDND_BASE_URL || "mock";
const PDND_CLIENT_ID = process.env.PDND_CLIENT_ID || "";
const PDND_RSA_PRIVATE_KEY = process.env.PDND_RSA_PRIVATE_KEY || "";
const PDND_PURPOSE_ID = process.env.PDND_PURPOSE_ID || "";
const PDND_MOCK_MODE = process.env.PDND_MOCK_MODE !== "false"; // default true

// e-Service definitions
export interface EServiceDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "published" | "draft" | "deprecated";
  technology: "REST" | "SOAP";
  publishedAt: string | null;
}

export interface EServiceMetadata {
  name: string;
  description: string;
  technology: "REST" | "SOAP";
  version: string;
}

interface PdndVoucher {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  issuedAt: string;
}

// e-Service catalog
const E_SERVICES: EServiceDefinition[] = [
  {
    id: "dms-mercati",
    name: "DMS Hub - Mercati Ambulanti",
    description: "Lista mercati, posteggi e disponibilita' in tempo reale",
    version: "1.0.0",
    status: "draft",
    technology: "REST",
    publishedAt: null,
  },
  {
    id: "dms-concessioni",
    name: "DMS Hub - Concessioni",
    description: "Stato concessioni, scadenze e rinnovi",
    version: "1.0.0",
    status: "draft",
    technology: "REST",
    publishedAt: null,
  },
  {
    id: "dms-operatori",
    name: "DMS Hub - Operatori",
    description: "Verifica operatore e stato autorizzazioni",
    version: "1.0.0",
    status: "draft",
    technology: "REST",
    publishedAt: null,
  },
];

// Stato in-memory per mock (in produzione sarà su DB/PDND)
const publishedServices = new Map<string, EServiceDefinition>();

/**
 * Genera un JWT assertion per ottenere il voucher OAuth 2.0 PDND.
 * In mock mode restituisce un token fittizio.
 */
export async function generateVoucher(): Promise<PdndVoucher> {
  if (PDND_MOCK_MODE) {
    return {
      accessToken: `mock_pdnd_voucher_${crypto.randomUUID()}`,
      expiresIn: 600,
      tokenType: "Bearer",
      issuedAt: new Date().toISOString(),
    };
  }

  // Produzione: genera JWT assertion con RSA private key
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: PDND_CLIENT_ID };
  const payload = {
    iss: PDND_CLIENT_ID,
    sub: PDND_CLIENT_ID,
    aud: `${PDND_BASE_URL}/token`,
    purposeId: PDND_PURPOSE_ID,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 600,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PDND_RSA_PRIVATE_KEY, "base64url");

  const clientAssertion = `${signingInput}.${signature}`;

  const response = await fetch(`${PDND_BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
      client_id: PDND_CLIENT_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`PDND token request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Pubblica un e-Service su PDND (o simula in mock mode).
 */
export async function publishEService(
  serviceId: string,
  metadata: EServiceMetadata
): Promise<EServiceDefinition> {
  const template = E_SERVICES.find((s) => s.id === serviceId);
  if (!template) {
    throw new Error(`e-Service non trovato: ${serviceId}`);
  }

  if (PDND_MOCK_MODE) {
    const published: EServiceDefinition = {
      ...template,
      name: metadata.name || template.name,
      description: metadata.description || template.description,
      version: metadata.version || template.version,
      technology: metadata.technology || template.technology,
      status: "published",
      publishedAt: new Date().toISOString(),
    };
    publishedServices.set(serviceId, published);
    return published;
  }

  // Produzione: chiama API PDND per pubblicare
  const voucher = await generateVoucher();
  const response = await fetch(`${PDND_BASE_URL}/eservices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${voucher.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: metadata.name || template.name,
      description: metadata.description || template.description,
      technology: metadata.technology || template.technology,
      version: metadata.version || template.version,
    }),
  });

  if (!response.ok) {
    throw new Error(`PDND publish failed: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as EServiceDefinition;
  publishedServices.set(serviceId, result);
  return result;
}

/**
 * Verifica lo stato di un e-Service su PDND.
 */
export async function getEServiceStatus(
  serviceId: string
): Promise<EServiceDefinition> {
  const template = E_SERVICES.find((s) => s.id === serviceId);
  if (!template) {
    throw new Error(`e-Service non trovato: ${serviceId}`);
  }

  if (PDND_MOCK_MODE) {
    return publishedServices.get(serviceId) || template;
  }

  const voucher = await generateVoucher();
  const response = await fetch(`${PDND_BASE_URL}/eservices/${serviceId}`, {
    headers: { Authorization: `Bearer ${voucher.accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`PDND status check failed: ${response.status}`);
  }

  return (await response.json()) as EServiceDefinition;
}

/**
 * Chiama un e-Service con il voucher PDND.
 */
export async function callEService(
  purposeId: string,
  endpoint: string,
  params: Record<string, unknown>
): Promise<unknown> {
  if (PDND_MOCK_MODE) {
    return {
      mock: true,
      purposeId,
      endpoint,
      params,
      timestamp: new Date().toISOString(),
      data: { message: "Risposta mock e-Service PDND" },
    };
  }

  const voucher = await generateVoucher();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${voucher.accessToken}`,
      "Content-Type": "application/json",
      "X-Purpose-Id": purposeId,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`PDND e-Service call failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Lista tutti gli e-Service disponibili (con stato pubblicazione).
 */
export function listEServices(): EServiceDefinition[] {
  return E_SERVICES.map((s) => publishedServices.get(s.id) || s);
}

/**
 * Verifica connettivita' PDND (o mock).
 */
export async function testConnection(): Promise<{
  connected: boolean;
  mode: "mock" | "live";
  baseUrl: string;
  clientId: string;
  hasPurposeId: boolean;
  hasPrivateKey: boolean;
  timestamp: string;
}> {
  if (PDND_MOCK_MODE) {
    return {
      connected: true,
      mode: "mock",
      baseUrl: PDND_BASE_URL,
      clientId: PDND_CLIENT_ID || "(non configurato)",
      hasPurposeId: !!PDND_PURPOSE_ID,
      hasPrivateKey: !!PDND_RSA_PRIVATE_KEY,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const voucher = await generateVoucher();
    return {
      connected: !!voucher.accessToken,
      mode: "live",
      baseUrl: PDND_BASE_URL,
      clientId: PDND_CLIENT_ID,
      hasPurposeId: !!PDND_PURPOSE_ID,
      hasPrivateKey: true,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      connected: false,
      mode: "live",
      baseUrl: PDND_BASE_URL,
      clientId: PDND_CLIENT_ID,
      hasPurposeId: !!PDND_PURPOSE_ID,
      hasPrivateKey: !!PDND_RSA_PRIVATE_KEY,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// ANPR via PDND (Punto 3.2)
// ============================================

interface AnprVerificaCFResult {
  found: boolean;
  codiceFiscale: string;
  nome: string | null;
  cognome: string | null;
  dataNascita: string | null;
  comuneNascita: string | null;
  sesso: string | null;
  timestamp: string;
}

interface AnprResidenzaResult {
  found: boolean;
  codiceFiscale: string;
  indirizzo: string | null;
  civico: string | null;
  cap: string | null;
  comune: string | null;
  provincia: string | null;
  regione: string | null;
  timestamp: string;
}

// Mock data verosimili per ANPR
const MOCK_CF_DATABASE: Record<string, Omit<AnprVerificaCFResult, "timestamp">> = {
  RSSMRA85M01H501Z: {
    found: true,
    codiceFiscale: "RSSMRA85M01H501Z",
    nome: "Mario",
    cognome: "Rossi",
    dataNascita: "1985-08-01",
    comuneNascita: "Roma",
    sesso: "M",
  },
  VRDLGI90A41F205X: {
    found: true,
    codiceFiscale: "VRDLGI90A41F205X",
    nome: "Luigia",
    cognome: "Verdi",
    dataNascita: "1990-01-01",
    comuneNascita: "Milano",
    sesso: "F",
  },
  BNCGPP75D15L219Y: {
    found: true,
    codiceFiscale: "BNCGPP75D15L219Y",
    nome: "Giuseppe",
    cognome: "Bianchi",
    dataNascita: "1975-04-15",
    comuneNascita: "Torino",
    sesso: "M",
  },
};

const MOCK_RESIDENZA_DATABASE: Record<string, Omit<AnprResidenzaResult, "timestamp">> = {
  RSSMRA85M01H501Z: {
    found: true,
    codiceFiscale: "RSSMRA85M01H501Z",
    indirizzo: "Via dei Fori Imperiali",
    civico: "1",
    cap: "00186",
    comune: "Roma",
    provincia: "RM",
    regione: "Lazio",
  },
  VRDLGI90A41F205X: {
    found: true,
    codiceFiscale: "VRDLGI90A41F205X",
    indirizzo: "Corso Buenos Aires",
    civico: "44",
    cap: "20124",
    comune: "Milano",
    provincia: "MI",
    regione: "Lombardia",
  },
  BNCGPP75D15L219Y: {
    found: true,
    codiceFiscale: "BNCGPP75D15L219Y",
    indirizzo: "Via Roma",
    civico: "10",
    cap: "10121",
    comune: "Torino",
    provincia: "TO",
    regione: "Piemonte",
  },
};

/**
 * Verifica l'esistenza di un codice fiscale su ANPR via PDND.
 * In mock mode restituisce dati fittizi verosimili.
 */
export async function verificaCodiceFiscale(
  cf: string
): Promise<AnprVerificaCFResult> {
  const cfUpper = cf.toUpperCase().trim();

  if (PDND_MOCK_MODE) {
    const mockData = MOCK_CF_DATABASE[cfUpper];
    if (mockData) {
      return { ...mockData, timestamp: new Date().toISOString() };
    }
    return {
      found: false,
      codiceFiscale: cfUpper,
      nome: null,
      cognome: null,
      dataNascita: null,
      comuneNascita: null,
      sesso: null,
      timestamp: new Date().toISOString(),
    };
  }

  // Produzione: chiama ANPR via PDND e-Service
  const voucher = await generateVoucher();
  const response = await fetch(
    `${PDND_BASE_URL}/anpr/C001/consultazione/anpr-service-e002`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voucher.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        criteriRicerca: { codiceFiscale: cfUpper },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {
        found: false,
        codiceFiscale: cfUpper,
        nome: null,
        cognome: null,
        dataNascita: null,
        comuneNascita: null,
        sesso: null,
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error(`ANPR verifica CF failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    listaSoggetti?: Array<{
      generalita?: {
        nome?: string;
        cognome?: string;
        dataNascita?: string;
        luogoNascita?: { descrizioneComune?: string };
        sesso?: string;
      };
    }>;
  };

  const soggetto = data.listaSoggetti?.[0]?.generalita;
  return {
    found: !!soggetto,
    codiceFiscale: cfUpper,
    nome: soggetto?.nome || null,
    cognome: soggetto?.cognome || null,
    dataNascita: soggetto?.dataNascita || null,
    comuneNascita: soggetto?.luogoNascita?.descrizioneComune || null,
    sesso: soggetto?.sesso || null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica la residenza di un codice fiscale su ANPR via PDND.
 * In mock mode restituisce dati fittizi verosimili.
 */
export async function verificaResidenza(
  cf: string
): Promise<AnprResidenzaResult> {
  const cfUpper = cf.toUpperCase().trim();

  if (PDND_MOCK_MODE) {
    const mockData = MOCK_RESIDENZA_DATABASE[cfUpper];
    if (mockData) {
      return { ...mockData, timestamp: new Date().toISOString() };
    }
    return {
      found: false,
      codiceFiscale: cfUpper,
      indirizzo: null,
      civico: null,
      cap: null,
      comune: null,
      provincia: null,
      regione: null,
      timestamp: new Date().toISOString(),
    };
  }

  // Produzione: chiama ANPR via PDND e-Service
  const voucher = await generateVoucher();
  const response = await fetch(
    `${PDND_BASE_URL}/anpr/C001/consultazione/anpr-service-e002`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voucher.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        criteriRicerca: { codiceFiscale: cfUpper },
        datiRichiesti: { residenza: true },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {
        found: false,
        codiceFiscale: cfUpper,
        indirizzo: null,
        civico: null,
        cap: null,
        comune: null,
        provincia: null,
        regione: null,
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error(`ANPR verifica residenza failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    listaSoggetti?: Array<{
      residenza?: {
        indirizzo?: { descrizione?: string; numeroCivico?: string };
        localita?: {
          cap?: string;
          descrizioneComune?: string;
          sigla_provincia?: string;
        };
      };
    }>;
  };

  const residenza = data.listaSoggetti?.[0]?.residenza;
  return {
    found: !!residenza,
    codiceFiscale: cfUpper,
    indirizzo: residenza?.indirizzo?.descrizione || null,
    civico: residenza?.indirizzo?.numeroCivico || null,
    cap: residenza?.localita?.cap || null,
    comune: residenza?.localita?.descrizioneComune || null,
    provincia: residenza?.localita?.sigla_provincia || null,
    regione: null, // ANPR non restituisce direttamente la regione
    timestamp: new Date().toISOString(),
  };
}
