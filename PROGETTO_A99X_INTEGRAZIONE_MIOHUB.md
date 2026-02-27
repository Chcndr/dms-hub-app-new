# PROGETTO A99X — DIGITAL MARKET SYSTEM (Assistant 99X)

# Integrazione in MioHub

> Versione 2.0 | Febbraio 2026
> Approccio: INTEGRAZIONE DI SERVIZI ESISTENTI — MioHub orchestra, non reinventa
> Il Tab "Concilio" attuale verra' eliminato e sostituito con l'interfaccia A99X

---

## PRINCIPIO FONDAMENTALE

**NOI METTIAMO IL METODO. I servizi li fanno fare a chi li fa gia'.**

MioHub e' un **ORCHESTRATORE**. Il nostro valore e' il **metodo**: sapere COME collegare
i servizi giusti, in quale ordine, con quale logica, per risolvere i problemi della PA.
I servizi tecnici (video, calendario, traduzione, STT) li fa chi ci lavora ogni giorno
e li fa meglio di quanto potremmo mai fare noi.

**Noi mettiamo**: il metodo, la logica PA, l'orchestrazione, l'interfaccia unificata.
**I servizi li fanno**: Jitsi, Cal.com, Whisper, DeepL — chi fa questo di mestiere.

**Costruire da zero = spreco di tempo, costi enormi, risultato peggiore.**
**Integrare servizi esistenti = veloce, affidabile, mantenuto da professionisti.**

---

## PRIVACY PA — VINCOLO NON NEGOZIABILE

> **La Pubblica Amministrazione tratta dati sensibili. La privacy e' un requisito ASSOLUTO.**

Le riunioni tra funzionari PA contengono dati riservati: delibere in corso, dati personali
di cittadini, decisioni amministrative non ancora pubbliche, strategie interne.
**NESSUN dato audio/video/testo delle riunioni PA puo' transitare su server di terzi.**

### Regola fondamentale per la scelta dei servizi

| Tipo servizio | Requisito privacy | Accettabile? |
|---------------|-------------------|--------------|
| **Self-hosted su nostri server EU** (Hetzner) | Pieno controllo, zero dati a terzi | **SI' — preferito** |
| **SaaS EU con DPA e server EU** (es. DeepL Colonia) | Dati restano in EU, contratto DPA | **SI' — se necessario** |
| **SaaS con server US/non-EU** (es. Zoom, Google Meet) | Dati fuori EU, possibile accesso estero | **NO — vietato** |
| **SaaS qualsiasi per video PA** | Audio/video funzionari su server altrui | **NO — vietato** |

### Conseguenze sulla scelta servizi

- **Videoconferenza**: SOLO **Jitsi Meet self-hosted** su Hetzner. Niente Daily.co, Whereby,
  Zoom, Google Meet, Teams. L'audio e il video dei funzionari PA restano sui NOSTRI server.
- **Speech-to-Text**: SOLO **Whisper self-hosted** su Hetzner. Niente servizi cloud STT.
  L'audio delle riunioni non esce dai nostri server.
- **Traduzione**: **DeepL API** accettabile (server a Colonia, Germania, DPA disponibile).
  In alternativa **LibreTranslate self-hosted** per privacy totale.
- **Text-to-Speech**: SOLO **Piper TTS self-hosted**. Niente ElevenLabs o servizi cloud.
- **AI/LLM**: SOLO **Qwen3 self-hosted** su Ollama/vLLM. Niente OpenAI, Anthropic, Google
  per processare dati delle riunioni PA.
- **Calendario**: **Cal.com self-hosted**. I dati delle agende PA restano sui nostri server.
- **Lavagna**: **Excalidraw self-hosted** o embed locale.

**Principio**: Se un servizio processa audio, video, o testo delle riunioni PA,
DEVE essere self-hosted sui nostri server Hetzner EU. Nessuna eccezione.

---

## 1. COS'E' A99X

**A99X — Digital Market System (Assistant 99X)** e' una piattaforma AI per la
Pubblica Amministrazione integrata in MioHub. Offre 6 funzionalita' core,
tutte basate su **servizi esterni gia' funzionanti** orchestrati da MioHub.

**Vision**: Un assistente AI che partecipa alle riunioni, gestisce priorita',
organizza l'agenda, traduce in tempo reale e genera task automatici —
tutto usando i migliori servizi gia' disponibili sul mercato.

---

## 2. LE 6 FUNZIONALITA' E I SERVIZI CHE LE FORNISCONO

### 2.1 AVA — Agente Virtuale Attivo

L'AVA e' il cuore di A99X. E' l'unica parte che sviluppiamo noi perche'
e' la nostra logica di orchestrazione.

- **Base**: Chat AI streaming gia' in sviluppo (Tab 9 "Agente AI")
- **AI Backend**: Qwen3 su Ollama/vLLM (gia' previsto, hosting Hetzner EU)
- **RAG**: Integrazione con i dati dell'ente gia' presenti in MioHub

**Cosa facciamo noi**: La logica AVA che collega tutti i servizi sotto.
**Cosa NON facciamo**: Modelli AI da zero, infrastruttura ML custom.

### 2.2 Videoconferenza Integrata

**NON costruiamo un sistema WebRTC da zero.** Usiamo chi lo fa gia'.

**UNICA SCELTA: Jitsi Meet self-hosted su Hetzner EU.**

| Aspetto | Dettaglio |
|---------|----------|
| **Servizio** | Jitsi Meet (open source, Apache 2.0) |
| **Hosting** | Self-hosted su Hetzner EU — NOSTRI server |
| **Costo** | Zero (open source) |
| **Privacy** | Audio/video restano sui nostri server, zero dati a terzi |
| **Embed** | iframe / Jitsi IFrame API (JavaScript SDK) |
| **Recording** | Jibri (componente Jitsi) — recording locale sul server |

**Perche' SOLO Jitsi self-hosted e niente SaaS (Daily.co, Whereby, Zoom, ecc.)**:
I funzionari PA discutono di delibere, dati cittadini, decisioni riservate.
L'audio e il video di queste riunioni NON possono transitare su server di terzi.
Con Jitsi self-hosted, tutto resta sui nostri server Hetzner in Germania/Finlandia.

**Integrazione in MioHub**:
- Embed Jitsi in un iframe nel Tab A99X (Jitsi IFrame API)
- API interna per creare/gestire stanze programmaticamente
- Webhook per eventi (utente entra/esce, recording pronto)
- AVA si collega alla stanza come "bot partecipante"

**Funzionalita' gia' incluse in Jitsi** (non dobbiamo fare nulla):
- Whiteboard (lavagna) integrato
- Recording e archiviazione (Jibri)
- Screen sharing
- Chat in-call
- Polls/sondaggi integrati
- Lobby e moderazione
- End-to-end encryption disponibile

### 2.3 Agenda Intelligente Proattiva

**NON costruiamo un calendario da zero.** Usiamo servizi calendario + la nostra logica AI.

**SCELTA: Cal.com self-hosted su Hetzner EU.**

| Aspetto | Dettaglio |
|---------|----------|
| **Servizio** | Cal.com (open source, AGPL-3.0) |
| **Hosting** | Self-hosted su Hetzner EU — NOSTRI server |
| **Costo** | Zero (open source) |
| **Privacy** | Dati agende PA restano sui nostri server |
| **API** | REST API completa per creare eventi, gestire disponibilita' |
| **Sync** | Bidirezionale con Google Calendar/Outlook (opzionale per l'utente) |

**Integrazione in MioHub**:
- Cal.com gestisce calendario, disponibilita', conflitti
- AVA aggiunge la logica priorita' `P = U x I` (nostra formula)
- AVA suggerisce slot ottimali basandosi sui dati Cal.com
- Sync bidirezionale con Google Calendar/Outlook degli utenti

**Cosa fa il servizio**: Calendario, scheduling, gestione conflitti, notifiche.
**Cosa facciamo noi**: La logica AI di ottimizzazione e prioritizzazione sopra.

### 2.4 Gestione Proattiva delle Priorita'

Questa e' **logica nostra** che gira sopra i dati. Non serve un servizio esterno dedicato.

- AVA analizza task e riunioni (dati gia' in MioHub + Cal.com)
- Calcolo `P = U x I` → formula nostra, gira nel backend
- Dashboard priorita' → componente React nel frontend MioHub
- Notifiche e reminder → sistema notifiche MioHub gia' esistente

**Servizi di supporto**:

| Servizio | Uso |
|----------|-----|
| **Neon DB** (gia' in uso) | Storage task e priorita' |
| **Sistema notifiche MioHub** (gia' in uso) | Alert, reminder, escalation |
| **AVA/Qwen3** (gia' previsto) | Analisi NLP per estrarre priorita' dai verbali |

### 2.5 Traduzione Simultanea

**NON costruiamo una pipeline di traduzione.** Usiamo chi lo fa per mestiere.

| Servizio | Tipo | Hosting | Privacy |
|----------|------|---------|---------|
| **Whisper** (Large-v3) | STT open source | Self-hosted Hetzner GPU | Audio MAI esce dai nostri server |
| **DeepL API** Pro | Traduzione SaaS EU | Server a Colonia (DE) | DPA disponibile, dati restano in EU |
| **LibreTranslate** | Traduzione open source | Self-hosted Hetzner | Alternativa a DeepL per privacy totale |
| **Piper TTS** | TTS open source | Self-hosted Hetzner | Nessun dato a terzi |

**Scelte fatte (privacy PA)**:
- **Speech-to-Text**: SOLO **Whisper self-hosted** — l'audio delle riunioni PA non esce mai dai nostri server
- **Traduzione testo**: **DeepL API** (EU, Colonia) oppure **LibreTranslate self-hosted** per privacy totale
- **Text-to-Speech**: SOLO **Piper TTS self-hosted** — niente ElevenLabs o servizi cloud US

**Pipeline completa** (tutto gia' esistente, noi li colleghiamo):
```
Audio parlato → Whisper (STT) → DeepL (traduzione) → Piper (TTS) → Audio tradotto
```

**Integrazione in MioHub**:
- Il frontend cattura l'audio dal microfono (Web Audio API standard)
- Streaming audio → nostro backend → Whisper → DeepL → risposta
- Ogni partecipante sceglie la sua lingua, riceve la traduzione

### 2.6 Follow-Up Automatizzato

**NON costruiamo un sistema NLP da zero.** AVA (Qwen3) fa l'analisi, servizi esterni il resto.

| Servizio | Tipo | Perche' |
|----------|------|---------|
| **AVA/Qwen3** (gia' previsto) | Self-hosted | Analisi verbale, estrazione decisioni e task |
| **Whisper** (come sopra) | Self-hosted | Trascrizione riunione → testo per AVA |
| **Sistema notifiche MioHub** (gia' in uso) | Interno | Invio notifiche follow-up |
| **Cal.com** (come sopra) | Self-hosted | Creazione automatica eventi follow-up |

**Pipeline follow-up** (tutto servizi esistenti):
```
Recording riunione → Whisper (trascrizione) → AVA/Qwen3 (analisi NLP)
→ Task generati → Notifiche MioHub → Eventi Cal.com
```

**Cosa fa AVA**: Legge la trascrizione, identifica decisioni, genera task con assegnatari.
**Cosa fanno i servizi**: Trascrizione, notifiche, calendario — gia' tutto pronto.

---

## 3. MAPPA SERVIZI COMPLETA

### 3.1 Servizi da integrare (tutti self-hosted o SaaS EU)

| Funzionalita' | Servizio | Hosting | Licenza | Privacy |
|---------------|----------|---------|---------|---------|
| Videoconferenza | **Jitsi Meet** | Self-hosted Hetzner | Apache 2.0 | Audio/video sui NOSTRI server |
| Calendario/Agenda | **Cal.com** | Self-hosted Hetzner | AGPL-3.0 | Dati agende sui NOSTRI server |
| Speech-to-Text | **Whisper** (Large-v3) | Self-hosted Hetzner GPU | MIT | Audio MAI esce dai nostri server |
| Traduzione testo | **DeepL API** | SaaS EU (Colonia DE) | Pay-per-use | DPA, server EU |
| Traduzione testo (alt.) | **LibreTranslate** | Self-hosted Hetzner | AGPL-3.0 | Privacy totale |
| Text-to-Speech | **Piper TTS** | Self-hosted Hetzner | MIT | Nessun dato a terzi |
| Lavagna | **Excalidraw** | Self-hosted / embed | MIT | Locale |
| Sondaggi | **Jitsi Polls** | Incluso in Jitsi | Apache 2.0 | Incluso nel self-hosted |
| AI/LLM | **Qwen3** su Ollama/vLLM | Self-hosted Hetzner | Apache 2.0 | Dati MAI a servizi cloud AI |

### 3.2 Componenti gia' presenti in MioHub (riutilizzabili)

| Componente MioHub | Uso in A99X |
|--------------------|-------------|
| Sistema RBAC | Controllo accesso alle funzionalita' A99X per ruolo |
| Firebase Auth + OAuth | Autenticazione utenti nelle riunioni |
| Sistema notifiche | Notifiche follow-up e reminder task |
| Dashboard PA (Tab) | Container per l'interfaccia A99X |
| Impersonazione per comune | AVA personalizzato per comune specifico |
| Chat AI streaming (Tab 9) | Base diretta dell'AVA |
| API metrics/logging | Monitoraggio utilizzo A99X |
| Neon PostgreSQL | Storage dati A99X (task, riunioni, agenda) |

### 3.3 Cosa sviluppiamo NOI (solo orchestrazione)

| Componente | Descrizione | Effort |
|------------|-------------|--------|
| **AVA Logic** | Logica AI che collega tutti i servizi | Medio |
| **A99X Tab UI** | Interfaccia React che embed i servizi | Medio |
| **Glue API** | Endpoint REST che orchestrano i servizi esterni | Basso |
| **Priority Engine** | Formula P = U x I + dashboard | Basso |
| **Follow-up Pipeline** | Collegamento Whisper → AVA → Task → Notifiche | Basso |

**Totale sviluppo nostro**: Interfaccia + logica di collegamento.
**Tutto il resto**: Lo fanno i servizi.

---

## 4. ARCHITETTURA INTERFACCIA A99X IN MIOHUB

### 4.1 Sostituzione Tab "Concilio"

Il Tab "Concilio" (attualmente `/council` con `CouncilPage`) viene eliminato e sostituito
con l'interfaccia A99X completa.

### 4.2 Layout A99X

```
+------------------------------------------------------------------+
| A99X — Digital Market System                           [Settings] |
|------------------------------------------------------------------+
| Sidebar                |  Area principale                         |
|                        |                                          |
| [Agenda]               |  (Contenuto dinamico)                    |
| [AVA Chat]             |                                          |
| [Video Call]           |  - Agenda: embed Cal.com                 |
| [Report & Tasks]       |  - AVA: chat AI streaming                |
| [Priorita']            |  - Video: embed Jitsi (self-hosted)      |
| [Traduzione]           |  - Report: lista task + trascrizioni     |
| [Lavagna]              |  - Priorita': matrice P = U x I          |
|                        |  - Traduzione: pannello lingue           |
|                        |  - Lavagna: embed Excalidraw             |
+------------------------------------------------------------------+
```

### 4.3 Sezioni e servizio utilizzato

| Sezione | Cosa vede l'utente | Servizio dietro |
|---------|--------------------|--------------------|
| **Agenda** | Calendario riunioni con suggerimenti AI | Cal.com + AVA |
| **AVA Chat** | Chat AI con contesto riunioni | Qwen3/Ollama (nostro) |
| **Video Call** | Videoconferenza con AVA | Jitsi Meet self-hosted |
| **Report & Tasks** | Verbali + task auto-generati | Whisper + AVA + MioHub notifiche |
| **Priorita'** | Matrice urgenza/impatto | Logica nostra (P = U x I) |
| **Traduzione** | Traduzione live in riunione | Whisper + DeepL + Piper |
| **Lavagna** | Lavagna collaborativa | Excalidraw embed |

---

## 5. TABELLE DATABASE (PROPOSTE)

> **NON creare ora** — Solo per pianificazione futura.
> Quando si implementera', seguire la regola: schema in `drizzle/schema.ts`, mai SQL diretto.

### 5.1 Tabelle A99X

```sql
-- Riunioni A99X
CREATE TABLE a99x_meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comune_id       INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMP NOT NULL,
  duration_min    INTEGER DEFAULT 60,
  status          TEXT DEFAULT 'scheduled',  -- scheduled, in_progress, completed, cancelled
  organizer_id    TEXT NOT NULL,
  ava_enabled     BOOLEAN DEFAULT TRUE,
  -- Riferimenti ai servizi esterni
  jitsi_room_id   TEXT,                      -- ID stanza Jitsi self-hosted
  calcom_event_id TEXT,                      -- ID evento Cal.com
  recording_url   TEXT,                      -- URL recording da Jitsi (nostro server)
  transcript      TEXT,                      -- Trascrizione da Whisper
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Partecipanti riunione
CREATE TABLE a99x_meeting_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES a99x_meetings(id),
  user_id         TEXT NOT NULL,
  role            TEXT DEFAULT 'participant',  -- organizer, participant, observer
  status          TEXT DEFAULT 'invited',      -- invited, confirmed, declined, attended
  language        TEXT DEFAULT 'it',           -- Lingua per traduzione DeepL
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Task generati dal follow-up (AVA + Whisper)
CREATE TABLE a99x_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES a99x_meetings(id),
  title           TEXT NOT NULL,
  description     TEXT,
  assignee_id     TEXT NOT NULL,
  priority        INTEGER DEFAULT 5,           -- 1-10 (P = U x I)
  urgency         INTEGER DEFAULT 5,           -- 1-10
  impact          INTEGER DEFAULT 5,           -- 1-10
  due_date        TIMESTAMP,
  status          TEXT DEFAULT 'pending',       -- pending, in_progress, completed, overdue
  calcom_event_id TEXT,                        -- Se genera un evento follow-up in Cal.com
  created_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
);

-- Agenda intelligente
CREATE TABLE a99x_agenda_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES a99x_meetings(id),
  title           TEXT NOT NULL,
  duration_min    INTEGER DEFAULT 15,
  priority_score  NUMERIC(5,2),                -- P = U x I calcolato da AVA
  speaker_id      TEXT,
  notes           TEXT,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**Nota**: La tabella `a99x_translations` e' stata ELIMINATA.
Le traduzioni sono effimere (real-time in riunione via DeepL API) e non serve salvarle nel DB.
Se serve lo storico, DeepL ha i suoi log.

---

## 6. ENDPOINT REST A99X (FUTURI)

> **NON implementare ora** — Solo per pianificazione architetturale.
> Tutti su mihub-backend-rest (Express.js su Hetzner). ZERO tRPC.
> Questi endpoint ORCHESTRANO i servizi esterni, non reimplementano nulla.

### 6.1 Riunioni (orchestra Jitsi + Cal.com)

```
POST   /api/a99x/meetings
  → Crea evento in Cal.com + crea stanza Jitsi
  Body: { title, scheduled_at, participants[], ava_enabled }
  Response: { meeting_id, jitsi_join_url, calcom_event_url }

GET    /api/a99x/meetings/:id
  → Legge dati da DB + stato stanza Jitsi
  Response: { meeting, participants[], agenda_items[], jitsi_status }

POST   /api/a99x/meetings/:id/end
  → Chiude stanza Jitsi + triggera pipeline follow-up
  Response: { recording_url, transcript_status: 'processing' }
```

### 6.2 Follow-up (orchestra Whisper + AVA)

```
POST   /api/a99x/meetings/:id/followup
  → Prende recording → Whisper (STT) → AVA (analisi) → genera task
  Response: { tasks_generated[], decisions[], action_items[] }
  Nota: processo asincrono, webhook quando pronto
```

### 6.3 Traduzione (orchestra Whisper + DeepL + Piper)

```
POST   /api/a99x/translate/realtime
  → Audio chunk → Whisper → DeepL → Piper → audio tradotto
  Body: { audio_chunk (base64), source_lang, target_lang }
  Response: SSE stream con audio tradotto
  Nota: streaming real-time, ogni servizio fa il suo pezzo
```

### 6.4 Agenda (orchestra Cal.com + AVA)

```
GET    /api/a99x/agenda/:comune_id
  → Legge eventi da Cal.com + arricchisce con priorita' AVA
  Response: { items[], suggestions[] }

POST   /api/a99x/agenda/optimize
  → AVA analizza disponibilita' Cal.com + priorita' → suggerisce slot
  Body: { comune_id, date_range, priorities[] }
  Response: { optimized_slots[], conflicts[] }
```

---

## 7. ROADMAP DI INTEGRAZIONE — 4 FASI

> Con i servizi esistenti, le fasi si riducono e si velocizzano.
> Non stiamo piu' costruendo da zero — stiamo collegando pezzi.

### Fase 1: Chat AI Streaming + AVA Base (IN CORSO)
**Timeline**: Febbraio-Marzo 2026
**Stato**: In sviluppo

- Chat AI streaming con SSE nel Tab 9 "Agente AI"
- Backend REST su mihub-backend-rest con Ollama/vLLM (Qwen3)
- Profili per ruolo (PA/Impresa/Cittadino)
- Storico conversazioni

**Output**: AVA base funzionante — il cuore che orchestra tutto.

### Fase 2: Test Pilota + Videoconferenza + Agenda
**Timeline**: Aprile-Settembre 2026

- Deploy AVA a comuni pilota (Grosseto + 2-3 altri)
- **Deploy Jitsi Meet** su Hetzner (1 server, configurazione standard)
- **Deploy Cal.com** su Hetzner (1 server, configurazione standard)
- Embed Jitsi nel Tab A99X → videoconferenza funzionante
- Embed Cal.com nel Tab A99X → agenda funzionante
- AVA si collega come bot alle stanze Jitsi
- Sostituzione Tab "Concilio" con interfaccia A99X

**Output**: A99X core con video + agenda, tutto su servizi esistenti.
**Tempo effettivo di integrazione**: Jitsi embed ~1 settimana, Cal.com embed ~1 settimana.

### Fase 3: Traduzione + Follow-Up Automatico
**Timeline**: Ottobre 2026-Gennaio 2027

- **Deploy Whisper** su Hetzner (GPU per STT)
- **Integrazione DeepL API** (attivazione account, poche righe di codice)
- **Deploy Piper TTS** su Hetzner (TTS open source)
- Pipeline completa: Audio → Whisper → DeepL → Piper → Audio tradotto
- Follow-up: Recording → Whisper → AVA → Task + Notifiche + Cal.com
- Embed **Excalidraw** per lavagna collaborativa

**Output**: Suite completa A99X — tutto funzionante con servizi integrati.

### Fase 4: Scale-Up Nazionale
**Timeline**: Febbraio 2027+

- Roll-out a tutti i comuni DMS Hub (target 8.000)
- Scaling servizi: piu' istanze Jitsi, Whisper, Cal.com su Hetzner
- Ottimizzazione AVA con RAG specifici per regione
- API pubblica per integrazioni terze parti

**Output**: A99X come piattaforma nazionale per la PA digitale.

---

## 8. VINCOLI TECNICI

### 8.1 Vincoli assoluti

| Vincolo | Dettaglio |
|---------|----------|
| **ZERO sviluppo da zero** | Ogni funzionalita' usa un servizio esistente — noi orchestriamo |
| **ZERO tRPC** | Backend solo REST API su mihub-backend-rest |
| **Hosting EU** | Tutti i servizi self-hosted su Hetzner (Falkenstein/Helsinki) |
| **GDPR/AgID** | Solo servizi con data processing EU o self-hosted |
| **Non toccare v9.1.2** | Il sistema stabile non va modificato — approccio chirurgico |
| **Drizzle ORM** | Schema DB SEMPRE in `drizzle/schema.ts` — mai SQL diretto |

### 8.2 Stack servizi A99X

| Servizio | Versione/Tipo | Hosting | Licenza |
|----------|---------------|---------|---------|
| Jitsi Meet | Latest stable | Hetzner VPS | Apache 2.0 (open source) |
| Cal.com | Latest stable | Hetzner VPS | AGPL-3.0 (open source) |
| Whisper | Large-v3 | Hetzner GPU | MIT (open source) |
| DeepL API | Pro | SaaS EU (Colonia, DE) | Pay-per-use |
| Piper TTS | Latest | Hetzner VPS | MIT (open source) |
| Excalidraw | Latest | Embed/self-hosted | MIT (open source) |
| Qwen3 | 8B/30B | Hetzner via Ollama/vLLM | Apache 2.0 (open source) |

### 8.3 Compliance

- **GDPR**: Tutti i servizi self-hosted EU o SaaS EU (DeepL e' tedesco, server a Colonia)
- **AgID**: Conformita' linee guida AI nella PA
- **CAD**: Codice Amministrazione Digitale — interoperabilita'
- **eIDAS**: Identita' digitale per autenticazione SPID/CIE
- **Open Source first**: 6 su 7 servizi sono open source e self-hosted

---

## 9. CONFRONTO: PRIMA vs DOPO

| Aspetto | PRIMA (v1.0 — da zero) | DOPO (v2.0 — servizi esistenti) |
|---------|------------------------|----------------------------------|
| Videoconferenza | Costruire WebRTC da zero (6+ mesi) | Embed Jitsi Meet (1 settimana) |
| Calendario | Engine proprietario (3+ mesi) | Embed Cal.com (1 settimana) |
| Traduzione | Pipeline custom STT+MT+TTS (4+ mesi) | Whisper + DeepL + Piper (2 settimane) |
| Lavagna | Canvas custom (2+ mesi) | Embed Excalidraw (2 giorni) |
| Sondaggi | Sistema custom (1+ mese) | Jitsi ha polls integrati (0 giorni) |
| Fasi roadmap | 6 fasi fino a set. 2027 | 4 fasi fino a feb. 2027 |
| Rischio | Altissimo (tutto custom) | Basso (servizi collaudati) |
| Manutenzione | Tutto su di noi | Community open source + vendor |

---

## 10. RIEPILOGO STRATEGICO

| Aspetto | Dettaglio |
|---------|----------|
| **Progetto** | A99X — Digital Market System (Assistant 99X) |
| **Filosofia** | NOI METTIAMO IL METODO — i servizi li fanno i professionisti |
| **Ruolo MioHub** | Orchestratore — il metodo, la logica PA, l'interfaccia unificata |
| **Privacy PA** | VINCOLO ASSOLUTO — tutto self-hosted EU, zero dati a server terzi |
| **6 Funzionalita'** | AVA, Video (Jitsi self-hosted), Agenda (Cal.com self-hosted), Priorita' (nostra), Traduzione (Whisper+DeepL), Follow-Up (AVA+Whisper) |
| **Sviluppo nostro** | Il METODO: AVA logic, UI Tab A99X, Glue API, Priority engine |
| **Servizi esterni** | Jitsi, Cal.com, Whisper, DeepL, Piper, Excalidraw — tutti self-hosted o EU |
| **Hosting** | Tutto self-hosted su Hetzner EU, unica eccezione DeepL (SaaS EU, Colonia) |
| **Roadmap** | 4 fasi — completamento previsto feb. 2027 (risparmiati 7+ mesi) |
| **Priorita' attuale** | Completare Chat AI Streaming (AVA base), poi integrare Jitsi + Cal.com |

---

*Documento A99X v2.0 — Approccio "Noi mettiamo il metodo"*
*Aggiornato il 27/02/2026 — DMS Hub Team*
*MioHub orchestra. Non reinventa. Privacy PA garantita.*
