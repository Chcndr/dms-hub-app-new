# PIANO FASE 2 AVA — Da Chat Generica a Assistente Intelligente

## Stato Attuale (Fase 1 - COMPLETATA)

**Backend (Manus - REST su api.mio-hub.me):**
- Endpoint SSE `POST /api/ai/chat/stream` funzionante
- CRUD conversazioni (7 endpoint operativi)
- Prompt Tiered v2.0 (3 livelli: Core, Ruolo, KB on-demand)
- Topic matching regex per 7 frammenti KB
- Cache DB stats con TTL 5 minuti
- Modello: qwen2.5:7b-instruct-q4_K_M su Ollama

**Frontend (Claude - 16 componenti in `client/src/components/ai-chat/`):**
- AIChatPanel con layout 2 colonne (sidebar storico + area chat)
- Streaming SSE parola per parola
- Sidebar conversazioni con CRUD (raggruppamento per data)
- Markdown rendering (tabelle, codice, copy button)
- Suggerimenti iniziali per 3 ruoli (PA/Impresa/Cittadino)
- Quota banner e gestione errori
- Attualmente usato SOLO nel tab "Agente AI" di DashboardPA con `userRole="pa"` hardcoded

---

## Fase 2: Piano in 5 Step

### STEP 2.1 — Ruolo Utente Dinamico
**Problema:** `<AIChatPanel userRole="pa" />` è hardcoded. Il backend riceve sempre `user_role: "pa"`.
**Soluzione:** Leggere il ruolo reale dall'utente autenticato e passarlo ad AVA.

**Claude (Frontend):**
- Modificare `AIChatPanel` per ricavare `userRole` dal contesto auth/permissions se non passato esplicitamente
- Passare `comuneId` reale (da URL params in impersonazione o da dati utente)
- Aggiungere `current_tab` nel context della request (per dare ad AVA consapevolezza di dove si trova l'utente)

**Manus (Backend):**
- Leggere `user_role` dal JWT Firebase (claim custom) o dal campo nella request
- Se non presente, derivarlo dal tipo di utente nel DB
- Usare il ruolo per selezionare il ROLE_PROMPT corretto in `buildSystemPrompt()`

**File coinvolti:**
- `client/src/components/ai-chat/AIChatPanel.tsx` (Claude)
- `client/src/pages/DashboardPA.tsx` (Claude)
- `routes/ai-chat.js` (Manus)

---

### STEP 2.2 — RAG con Dati DB Reali
**Problema:** AVA è "cieca" — non vede i dati reali del comune. Risponde con conoscenza generica.
**Soluzione:** Prima di chiamare Ollama, il backend interroga il DB e inietta dati contestuali nel prompt.

**Manus (Backend):**
- Creare funzione `getContextualData(comuneId, userMessage)` che interroga il DB per:
  - Mercati attivi nel comune (nome, giorno, posteggi totali/occupati)
  - Presenze di oggi (conteggio per mercato)
  - Scadenze canoni prossime (prossimi 30 giorni)
  - Concessionari con problemi (in mora, concessione scaduta)
  - Statistiche generali (totale imprese, occupazione media %)
- Iniettare i risultati come sezione `DATI REALI:` nel system prompt
- Cache aggressiva (TTL 5 min per dati aggregati, 1 min per presenze)
- Limite: max 500 token di contesto dati per non sovraccaricare il 7B

**Claude (Frontend):**
- Nessuna modifica necessaria (i dati vengono iniettati nel prompt lato backend)
- Eventualmente: mostrare un indicatore "AVA sta consultando i dati..." durante la fase pre-streaming

**File coinvolti:**
- `routes/ai-chat.js` — nuova funzione `getContextualData()` (Manus)
- Nuove query in `src/modules/` o direttamente in ai-chat.js (Manus)

---

### STEP 2.3 — Function Calling (AVA Esegue Azioni)
**Problema:** AVA può solo rispondere a testo. Non può cercare dati specifici, generare report, o eseguire calcoli.
**Soluzione:** Implementare un sistema di "tools" che AVA può invocare.

**Manus (Backend):**
- Definire le funzioni disponibili per Ollama (formato tool_call):
  1. `cerca_concessionario(nome)` — cerca nel DB per nome/CF/PIVA
  2. `report_presenze(data, mercato_id)` — genera dati presenze strutturati
  3. `calcola_canone(concessionario_id, periodo)` — calcolo importo canone
  4. `verifica_scadenze(mercato_id)` — lista scadenze prossime
  5. `statistiche_mercato(mercato_id)` — occupazione, incassi, trend
  6. `cerca_mercato(nome_o_giorno)` — cerca mercato per nome o giorno
- Implementare il loop tool_call: Ollama decide → backend esegue → risultato torna a Ollama → risposta finale
- Restituire i risultati strutturati via SSE con un nuovo event type `data` (oltre a token/done/error/start)

**Claude (Frontend):**
- Aggiungere nuovo tipo SSE `data` in `types.ts` e `sse-client.ts`
- Creare componenti per rendering dati strutturati nelle risposte:
  - `AIChatDataTable.tsx` — tabella dati (presenze, scadenze, concessionari)
  - `AIChatStatCard.tsx` — card con statistiche (occupazione, incassi)
- Modificare `AIChatMarkdown.tsx` per intercettare blocchi dati speciali (es. ```json con type: "table")
- Aggiungere indicatore "AVA sta cercando nei dati..." durante l'esecuzione delle funzioni

**File coinvolti:**
- `routes/ai-chat.js` — loop tool_call + definizione funzioni (Manus)
- `client/src/components/ai-chat/types.ts` — nuovo SSEDataEvent (Claude)
- `client/src/components/ai-chat/lib/sse-client.ts` — gestione evento data (Claude)
- `client/src/components/ai-chat/AIChatDataTable.tsx` — NUOVO (Claude)
- `client/src/components/ai-chat/AIChatStatCard.tsx` — NUOVO (Claude)
- `client/src/components/ai-chat/AIChatMarkdown.tsx` — integrazione dati (Claude)

---

### STEP 2.4 — AVA Multi-Dashboard (Impresa + Cittadino)
**Problema:** AVA è solo nella DashboardPA. Gli operatori e i cittadini non hanno accesso all'assistente.
**Soluzione:** Integrare AIChatPanel nelle altre dashboard/pagine.

**Claude (Frontend):**
- **Dashboard Impresa** (`DashboardImpresa.tsx`):
  - Aggiungere tab "Assistente" con `<AIChatPanel userRole="impresa" />`
  - Suggerimenti personalizzati gia' presenti in AIChatEmptyState per ruolo impresa
- **Pagine Pubbliche** — Widget compatto AVA (opzionale, fase successiva):
  - `AIChatWidget.tsx` — floating button + mini-chat popup per cittadini
  - Integrabile in `/mappa`, `/civic`, home page
  - `userRole="cittadino"`, nessuna auth necessaria (rate limit per IP)

**Manus (Backend):**
- Gestire rate limiting diverso per utenti autenticati vs anonimi (cittadini)
- Quota differenziata per ruolo (PA: 100 msg/giorno, Impresa: 50, Cittadino: 20)

**File coinvolti:**
- `client/src/pages/DashboardImpresa.tsx` (Claude)
- `client/src/components/ai-chat/AIChatWidget.tsx` — NUOVO opzionale (Claude)
- `routes/ai-chat.js` — rate limiting per ruolo (Manus)

---

### STEP 2.5 — Miglioramenti UX Chat
**Problema:** L'esperienza chat è funzionale ma manca di alcune feature chiave.
**Soluzione:** Polish UI e feature aggiuntive.

**Claude (Frontend):**
- **Feedback sui messaggi**: thumbs up/down su ogni risposta AVA (per training futuro)
- **Export conversazione**: bottone per esportare la chat in PDF o testo
- **Suggerimenti contestuali**: suggerimenti diversi in base al tab corrente della DashboardPA
  (es. se sono nel tab "Mercati" → suggerimenti su mercati, se "Wallet" → suggerimenti su pagamenti)
- **Retry**: bottone per rigenerare l'ultima risposta
- **Tema responsive**: ottimizzare il layout mobile dell'AIChatPanel

**Manus (Backend):**
- Endpoint `POST /api/ai/chat/feedback` per salvare thumbs up/down
- Tabella `ai_feedback` nel DB (message_id, rating, comment)

**File coinvolti:**
- `client/src/components/ai-chat/AIChatMessage.tsx` — feedback buttons (Claude)
- `client/src/components/ai-chat/AIChatPanel.tsx` — export + retry (Claude)
- `client/src/components/ai-chat/AIChatEmptyState.tsx` — suggerimenti contestuali (Claude)
- `routes/ai-chat.js` — endpoint feedback (Manus)
- DB: tabella `ai_feedback` (Manus)

---

## Riepilogo Responsabilita'

| Step | Claude (Frontend) | Manus (Backend + DB) |
|------|-------------------|---------------------|
| **2.1 Ruolo Dinamico** | Passare userRole reale + comuneId + currentTab | Usare ruolo dal JWT/request per ROLE_PROMPT |
| **2.2 RAG Dati DB** | Indicatore "consultando dati..." (opzionale) | `getContextualData()` + query DB + inject nel prompt |
| **2.3 Function Calling** | Nuovo SSE event `data` + `AIChatDataTable` + `AIChatStatCard` | Definizione tools + loop tool_call + esecuzione query |
| **2.4 Multi-Dashboard** | AIChatPanel in DashboardImpresa + widget cittadino | Rate limiting per ruolo + quota differenziata |
| **2.5 UX Polish** | Feedback, export, suggerimenti contestuali, retry, mobile | Endpoint feedback + tabella ai_feedback |

## Ordine Priorita'

1. **Step 2.1** (Ruolo Dinamico) — prerequisito per tutto, bassa complessita'
2. **Step 2.2** (RAG Dati DB) — il piu' grande upgrade di valore, tutto backend
3. **Step 2.3** (Function Calling) — il game changer, collaborazione Claude+Manus
4. **Step 2.4** (Multi-Dashboard) — estendere AVA a tutti gli utenti
5. **Step 2.5** (UX Polish) — completamento esperienza

## Note Tecniche

- **Backend**: REST su `mihub-backend-rest` (Hetzner api.mio-hub.me) — NON tRPC
- **Modello**: qwen2.5:7b-instruct-q4_K_M su Ollama (Hetzner)
- **DB**: Neon PostgreSQL (serverless)
- **Auth**: Firebase JWT (frontend) → passato come Bearer token nelle chiamate REST
- **SSE**: POST con body JSON → response stream text/event-stream
