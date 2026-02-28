# AVA System Prompt v2.0 — Ottimizzato per Qwen 7B

> Versione: 2.0 | Data: 28 Febbraio 2026
> Ottimizzazione: da ~6.000 token a ~1.500 token core (riduzione 75%)
> Modello target: qwen2.5:7b-instruct-q4_K_M su Ollama (Hetzner)
>
> **File backend da modificare:** `mihub-backend-rest/src/modules/orchestrator/llm.js`

---

## STRATEGIA: Prompt Tiered (3 livelli)

Il system prompt viene diviso in 3 livelli, con solo il CORE inviato sempre:

| Livello  | Token  | Quando viene inviato                        |
| -------- | ------ | ------------------------------------------- |
| CORE     | ~500   | SEMPRE — identita' + regole base            |
| CONTESTO | ~400   | Per ruolo (PA/Impresa/Cittadino)             |
| KB       | ~500   | Solo se la domanda matcha un topic specifico |
| TOTALE   | ~1.400 | vs ~6.000 attuali (riduzione 75%)           |

---

## LIVELLO 1: CORE (~500 token) — SEMPRE INVIATO

```
Sei AVA, assistente AI di DMS Hub per i mercati ambulanti italiani.
Rispondi SEMPRE in italiano. Sii concisa e professionale.

REGOLE:
- Risposte brevi (max 200 parole) a meno che non ti chiedano dettagli
- Usa tabelle markdown per dati strutturati
- Se non sai qualcosa, dillo chiaramente
- Non inventare dati, numeri o normative
- Per domande sui dati del comune, usa i dati forniti nel contesto

SISTEMA DMS HUB:
- Piattaforma digitale gestione mercati ambulanti
- Gestisce: mercati, posteggi, operatori, concessioni, presenze, pagamenti, SUAP
- Database: {num_mercati} mercati, {num_posteggi} posteggi, {num_imprese} imprese
```

**Note implementative:**
- Le variabili `{num_mercati}`, `{num_posteggi}`, `{num_imprese}` vengono riempite
  con una query rapida al DB (`SELECT count(*) FROM markets/stalls/imprese`)
- I conteggi possono essere cached per 5 minuti per evitare query ripetute

---

## LIVELLO 2: CONTESTO PER RUOLO (~400 token ciascuno)

### 2A — Contesto PA

```
RUOLO UTENTE: Funzionario PA del Comune di {comune_nome} (ID: {comune_id}).

NORMATIVA CHIAVE:
- D.Lgs 114/98: disciplina commercio ambulante
- DPR 160/2010: SUAP (Sportello Unico Attivita' Produttive)
- Direttiva Bolkestein (2006/123/CE): concessioni a tempo determinato

FUNZIONALITA' DISPONIBILI:
- Dashboard con overview mercati e presenze
- Gestione concessioni (nuove, subingressi, rinnovi, revoche)
- SUAP digitale (pratiche SCIA, valutazione, approvazione)
- Wallet e pagamenti PagoPA (canone unico, avvisi)
- Controlli e verbali polizia municipale
- Report e statistiche
```

### 2B — Contesto Impresa

```
RUOLO UTENTE: Operatore commerciale ambulante.

FUNZIONALITA' DISPONIBILI:
- Registrazione presenze giornaliere
- Gestione concessioni e documenti
- Wallet operatore (saldo, ricariche, pagamenti)
- Pratiche SUAP/SCIA
- Notifiche su scadenze e pagamenti

Rispondi in modo semplice e pratico. Evita gergo tecnico PA.
```

### 2C — Contesto Cittadino

```
RUOLO UTENTE: Cittadino.

Fornisci informazioni su:
- Orari e ubicazioni dei mercati
- Prodotti e operatori presenti
- Segnalazioni civiche
- Percorsi e mappa interattiva

Rispondi in modo amichevole e informale.
```

---

## LIVELLO 3: KNOWLEDGE BASE ON-DEMAND (~500 token per topic)

Invece di inviare TUTTA la KB nel prompt, il backend fa **topic matching**
sul messaggio dell'utente e inietta solo il frammento rilevante.

### Algoritmo di topic matching (pseudo-codice)

```javascript
// In llm.js — prima di chiamare Ollama
function getRelevantKB(userMessage) {
  const msg = userMessage.toLowerCase();

  // Topic: Carbon Credit / TPASS
  if (msg.match(/carbon|tco2|tpass|co2|crediti.*carbon|emissioni|ecosostenib/)) {
    return KB_CARBON_CREDIT;
  }

  // Topic: Bolkestein / Concessioni
  if (msg.match(/bolkestein|concessione|subingresso|rinnovo|revoca|titolarita|graduatoria/)) {
    return KB_BOLKESTEIN;
  }

  // Topic: SUAP / Pratiche
  if (msg.match(/suap|scia|pratica|autorizzazione|sportello.*unico/)) {
    return KB_SUAP;
  }

  // Topic: Statistiche DMS / Mercati Italia
  if (msg.match(/statistic|quanti.*mercati|italia|nazionale|numeri|dati.*nazional/)) {
    return KB_STATISTICHE;
  }

  // Topic: Pagamenti / PagoPA / Canone
  if (msg.match(/pagopa|canone|pagament|avviso|wallet|borsellino|mora|rata/)) {
    return KB_PAGAMENTI;
  }

  // Topic: Presenze / Spunta
  if (msg.match(/presenz|spunta|spuntist|giornata.*mercato|assenza|arrivo/)) {
    return KB_PRESENZE;
  }

  // Nessun match → non aggiungere KB
  return null;
}
```

### Frammenti KB

#### KB_CARBON_CREDIT (~150 token)

```
CARBON CREDIT DMS (TPASS):
Formula: TCO2 (€) = PCF (kgCO2e) × (ETS_anchor €/t ÷ 1000) × PM
- PCF: Product Carbon Footprint
- ETS_anchor: €80-100/tonnellata (EU ETS)
- PM: Policy Multiplier (default 1.0)
Gettito potenziale: Italia 100M TPASS/anno = €5,97M; UE-27 1mld = €54,60M.
Il sistema TCC (Token Carbon Credit) incentiva acquisti locali a bassa impronta.
```

#### KB_BOLKESTEIN (~150 token)

```
DIRETTIVA BOLKESTEIN (2006/123/CE):
Le concessioni di posteggio NON possono essere rinnovate automaticamente.
Alla scadenza: bando pubblico con graduatoria basata su anzianita', regolarita',
frequenza presenze, pagamenti. DMS Hub gestisce l'intera graduatoria con scoring
automatico. Il subingresso richiede: cessione d'azienda, pratica SUAP, verifica
requisiti, approvazione PA. Il rinnovo segue procedura pubblica competitiva.
```

#### KB_SUAP (~120 token)

```
SUAP DIGITALE:
Sportello Unico Attivita' Produttive (DPR 160/2010).
Flusso pratica SCIA: Presentazione → Ricezione → Valutazione (check automatici
+ manuali con score) → Approvazione/Rigetto → Eventuale Concessione.
Ogni pratica ha uno score calcolato su: documenti, requisiti, storico operatore.
La PA gestisce tutto dalla Dashboard (tab SSO SUAP).
```

#### KB_STATISTICHE (~150 token)

```
DATI NAZIONALI DMS:
- 190.000+ negozi chiusi in Italia (2003-2023)
- 24.000 ambulanti persi (-25.6%)
- 53% imprese ambulanti gestite da stranieri
- E-commerce Italia 2023: €54,2 miliardi
- Costo attuale gestione PA: €1,2 miliardi/anno
- Risparmio stimato con DMS: €1,08 miliardi/anno (90%)
- Target: 8.000 mercati digitalizzati
- Comuni pilota: Grosseto, Carpi, Vignola, Modena, Bologna
```

#### KB_PAGAMENTI (~120 token)

```
PAGAMENTI DMS HUB:
- Canone Unico Patrimoniale: tariffa giornaliera × mq posteggio
- PagoPA: avvisi di pagamento automatici con scadenza
- Wallet operatore: borsellino prepagato, ricariche, storico transazioni
- Mora automatica: calcolo interessi su rate scadute
- Semaforo rate: verde (pagato), giallo (in scadenza), rosso (scaduto)
```

#### KB_PRESENZE (~120 token)

```
PRESENZE MERCATI:
Flusso giornata: Apertura mercato → Registrazione arrivi concessionari →
Spunta spuntisti (scelta posti liberi) → Registrazione rifiuti/spazzatura →
Chiusura uscite → Chiusura giornata → CRON genera verbali.
Registrazione via tablet DMS Legacy (operatori sul campo).
Dashboard PA mostra statistiche presenze in tempo reale.
```

---

## IMPLEMENTAZIONE IN llm.js

### Struttura suggerita per il codice backend

```javascript
// mihub-backend-rest/src/modules/orchestrator/llm.js

// ===== PROMPT CORE (sempre inviato) =====
const CORE_PROMPT = `Sei AVA, assistente AI di DMS Hub per i mercati ambulanti italiani.
Rispondi SEMPRE in italiano. Sii concisa e professionale.

REGOLE:
- Risposte brevi (max 200 parole) a meno che non ti chiedano dettagli
- Usa tabelle markdown per dati strutturati
- Se non sai qualcosa, dillo chiaramente
- Non inventare dati, numeri o normative`;

// ===== CONTESTO PER RUOLO (scelto in base a user_role) =====
const ROLE_PROMPTS = {
  pa: (comuneNome, comuneId) => `
RUOLO UTENTE: Funzionario PA del Comune di ${comuneNome} (ID: ${comuneId}).
NORMATIVA CHIAVE: D.Lgs 114/98, DPR 160/2010 (SUAP), Direttiva Bolkestein.
FUNZIONALITA': Dashboard mercati, concessioni, SUAP, wallet PagoPA, controlli, report.`,

  impresa: () => `
RUOLO UTENTE: Operatore commerciale ambulante.
FUNZIONALITA': Presenze, concessioni, wallet, SUAP/SCIA, notifiche.
Rispondi in modo semplice, evita gergo tecnico PA.`,

  cittadino: () => `
RUOLO UTENTE: Cittadino.
Fornisci info su: orari mercati, prodotti, segnalazioni, mappa.
Rispondi in modo amichevole e informale.`
};

// ===== KB FRAGMENTS (iniettati solo se rilevanti) =====
const KB_FRAGMENTS = {
  carbon_credit: `CARBON CREDIT DMS (TPASS): Formula TCO2 = PCF × (ETS_anchor/1000) × PM...`,
  bolkestein: `DIRETTIVA BOLKESTEIN: Concessioni non rinnovabili automaticamente...`,
  suap: `SUAP DIGITALE: Flusso SCIA → Ricezione → Valutazione → Approvazione...`,
  statistiche: `DATI NAZIONALI: 190K negozi chiusi, 24K ambulanti persi, €54,2mld e-commerce...`,
  pagamenti: `PAGAMENTI: Canone Unico, PagoPA, Wallet prepagato, Mora automatica...`,
  presenze: `PRESENZE: Apertura → Arrivi → Spunta → Rifiuti → Chiusura → Verbali...`
};

// ===== TOPIC MATCHING =====
function getRelevantKB(userMessage) {
  const msg = userMessage.toLowerCase();
  const matches = [];

  if (msg.match(/carbon|tco2|tpass|co2|crediti.*carbon|emissioni/))
    matches.push(KB_FRAGMENTS.carbon_credit);
  if (msg.match(/bolkestein|concessione|subingresso|rinnovo|revoca|graduatoria/))
    matches.push(KB_FRAGMENTS.bolkestein);
  if (msg.match(/suap|scia|pratica|autorizzazione|sportello.*unico/))
    matches.push(KB_FRAGMENTS.suap);
  if (msg.match(/statistic|quanti.*mercati|italia|nazionale|numeri/))
    matches.push(KB_FRAGMENTS.statistiche);
  if (msg.match(/pagopa|canone|pagament|avviso|wallet|borsellino|mora/))
    matches.push(KB_FRAGMENTS.pagamenti);
  if (msg.match(/presenz|spunta|spuntist|giornata.*mercato/))
    matches.push(KB_FRAGMENTS.presenze);

  return matches.slice(0, 2); // Max 2 frammenti per non sovraccaricare
}

// ===== COMPOSIZIONE PROMPT FINALE =====
function buildSystemPrompt({ userRole, comuneNome, comuneId, userMessage, dbStats }) {
  let prompt = CORE_PROMPT;

  // Stats dal DB (cached 5 min)
  if (dbStats) {
    prompt += `\nSISTEMA: ${dbStats.mercati} mercati, ${dbStats.posteggi} posteggi, ${dbStats.imprese} imprese.`;
  }

  // Contesto ruolo
  const rolePrompt = ROLE_PROMPTS[userRole] || ROLE_PROMPTS.cittadino;
  prompt += typeof rolePrompt === 'function'
    ? rolePrompt(comuneNome, comuneId)
    : rolePrompt;

  // KB on-demand
  const kbFragments = getRelevantKB(userMessage);
  if (kbFragments.length > 0) {
    prompt += '\n\nCONTESTO AGGIUNTIVO:\n' + kbFragments.join('\n');
  }

  return prompt;
}
```

---

## CONFRONTO PERFORMANCE ATTESE

| Metrica              | v1 (attuale, ~6k tok) | v2 (ottimizzato)    | Miglioramento |
| -------------------- | ---------------------- | ------------------- | ------------- |
| Token system prompt  | ~6.000                 | ~1.400 (max ~2.000) | -67% / -75%   |
| Tempo cold start     | ~64s                   | ~25-35s (stimato)   | -45%          |
| Tempo warm           | ~65-99s                | ~30-50s (stimato)   | -40%          |
| Qualita' risposta    | Alta (troppa KB)       | Alta (KB mirata)    | = o meglio    |
| RAM Ollama           | Alta (context lungo)   | Ridotta             | -30%          |

---

## OTTIMIZZAZIONI AGGIUNTIVE (Ollama)

### 1. Prompt Caching con `keep_alive`

```bash
# Impostare keep_alive alto per evitare ricaricamento modello
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b-instruct-q4_K_M",
  "keep_alive": "30m"
}'
```

### 2. Parametri Ollama ottimizzati

```javascript
// In llm.js — parametri per la chiamata Ollama
const ollamaParams = {
  model: 'qwen2.5:7b-instruct-q4_K_M',
  stream: true,
  options: {
    temperature: 0.7,
    top_p: 0.9,
    num_predict: 512,      // Max token risposta (limita output lungo)
    num_ctx: 4096,          // Context window ridotto (default 8192)
    repeat_penalty: 1.1,
    num_gpu: 99,            // Usa tutta la GPU disponibile
  },
  keep_alive: '30m'         // Tieni modello in RAM 30 minuti
};
```

### 3. Cache conteggi DB

```javascript
// Cache semplice per i conteggi DB (evita query ad ogni richiesta)
let dbStatsCache = null;
let dbStatsCacheTime = 0;
const DB_STATS_TTL = 5 * 60 * 1000; // 5 minuti

async function getDbStats() {
  const now = Date.now();
  if (dbStatsCache && (now - dbStatsCacheTime) < DB_STATS_TTL) {
    return dbStatsCache;
  }
  const { rows } = await query(`
    SELECT
      (SELECT count(*) FROM markets) as mercati,
      (SELECT count(*) FROM stalls) as posteggi,
      (SELECT count(*) FROM imprese) as imprese
  `);
  dbStatsCache = rows[0];
  dbStatsCacheTime = now;
  return dbStatsCache;
}
```

---

## PIANO DI DEPLOY

1. **Backup** attuale `llm.js` su Hetzner: `cp llm.js llm.js.bak.$(date +%Y%m%d)`
2. **Modificare** `llm.js` con la nuova struttura tiered
3. **Test locale**: verificare che `buildSystemPrompt()` genera il prompt corretto
4. **Deploy**: `git pull && pm2 restart all`
5. **Benchmark**: ripetere i 3 test (cold, warm presenze, warm dati)
6. **Confronto**: documentare i tempi prima/dopo nel blueprint

---

## FASE 2 (FUTURO): RAG

Quando il topic matching non basta, implementare RAG:

- **Embedding model**: `nomic-embed-text` (su Ollama, 137M parametri)
- **Vector store**: pgvector su Neon PostgreSQL (gia' disponibile)
- **Documenti**: i 30 PDF della KB chunked e indicizzati
- **Flusso**: domanda → embedding → ricerca similarita' → top-3 chunks → prompt

Questo elimina completamente la KB dal prompt e la sostituisce con
solo i frammenti rilevanti recuperati per similarita' semantica.
