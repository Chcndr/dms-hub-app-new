# PROGETTO A99X — DIGITAL MARKET SYSTEM (Assistant 99X)

# Integrazione in MioHub

> Versione 1.0 | Febbraio 2026
> Trascrizione e analisi del progetto A99X (41 pagine) per integrazione nel sistema MioHub
> Il Tab "Concilio" attuale verra' eliminato e sostituito con l'interfaccia A99X

---

## 1. COS'E' A99X

**A99X — Digital Market System (Assistant 99X)** e' una piattaforma AI avanzata progettata
per la Pubblica Amministrazione e il settore privato. Il progetto originale (41 pagine) descrive
un sistema completo con 6 funzionalita' core che verranno integrate progressivamente all'interno
di MioHub, nel Tab "Concilio" della Dashboard PA.

**Vision**: Un assistente AI che non si limita a rispondere alle domande, ma partecipa attivamente
alle riunioni, gestisce le priorita', organizza l'agenda, traduce in tempo reale e genera
automaticamente task e follow-up dopo ogni incontro.

---

## 2. LE 6 FUNZIONALITA' CORE

### 2.1 AVA — Agente Virtuale Attivo

L'AVA e' il cuore del sistema A99X. E' un agente AI che:

- **Ascolta** le riunioni in tempo reale (trascrizione audio)
- **Partecipa** alle discussioni rispondendo a domande dirette
- **Accede ai database** dell'ente per fornire dati precisi e aggiornati
- **Genera report** automatici dopo ogni riunione
- **Crea task** assegnati automaticamente ai partecipanti
- **Apprende** dal contesto specifico della PA/associazione (RAG)

**Fondamento tecnico**: La chat AI streaming che stiamo implementando nel Tab 9 "Agente AI"
e' ESATTAMENTE la base dell'AVA. Il RAG, lo streaming SSE, i profili per ruolo — tutto
evolve verso l'AVA.

### 2.2 Videoconferenza Integrata

Sistema video proprietario con:

- **Lavagna virtuale** condivisa per annotazioni e brainstorming
- **Q&A strutturato** con moderazione automatica
- **Sondaggi in tempo reale** durante le riunioni
- **Trascrizione automatica** real-time del parlato
- **Registrazione** e archiviazione delle sessioni
- **AVA integrato** che partecipa come assistente virtuale

### 2.3 Agenda Intelligente Proattiva

Algoritmi proprietari che ottimizzano la pianificazione delle riunioni:

- **Analisi priorita'**: Formula `P = U x I` (Urgenza x Impatto)
- **Analisi disponibilita'**: Incrocia calendari di tutti i partecipanti
- **Analisi competenze**: Suggerisce i partecipanti giusti per ogni argomento
- **Ottimizzazione automatica**: Propone slot ottimali riducendo conflitti
- **Riprogrammazione intelligente**: Se cambiano le priorita', ricalcola tutto

### 2.4 Gestione Proattiva delle Priorita'

L'agente AI monitora e gestisce attivamente le priorita':

- **Verifica periodica** dello stato delle priorita' assegnate
- **Riprogrammazione automatica** dell'agenda se cambiano le urgenze
- **Forzatura anticipi** per task critici con notifica motivata
- **Escalation automatica** se le scadenze non vengono rispettate
- **Dashboard priorita'** con vista a matrice Urgenza/Impatto

### 2.5 Traduzione Simultanea

Traduzione vocale e scritta in tempo reale durante le riunioni:

- **100+ lingue** supportate
- **Pipeline**: Speech-to-Text -> Translation -> Text-to-Speech
- **Latenza minima**: < 2 secondi end-to-end
- **Multicanale**: Ogni partecipante ascolta nella propria lingua
- **Modelli locali EU** per compliance GDPR/AgID

### 2.6 Follow-Up Automatizzato

Dopo ogni riunione, il sistema:

1. **Analizza il verbale** con NLP avanzato
2. **Identifica decisioni** e impegni presi
3. **Genera task** specifici con descrizione, assegnatario, scadenza
4. **Assegna ruoli** automaticamente in base alle competenze
5. **Invia notifiche** personalizzate a ogni partecipante
6. **Monitora** il completamento dei task e invia reminder

---

## 3. ANALISI DI COMPATIBILITA' CON MIOHUB

### 3.1 Componenti gia' presenti in MioHub (riutilizzabili)

| Componente MioHub | Uso in A99X |
|--------------------|-------------|
| Sistema RBAC | Controllo accesso alle funzionalita' A99X per ruolo |
| Firebase Auth + OAuth | Autenticazione utenti nelle riunioni |
| Sistema notifiche | Notifiche follow-up e reminder task |
| Dashboard PA (Tab) | Container per l'interfaccia A99X |
| Impersonazione per comune | AVA personalizzato per comune specifico |
| Chat AI streaming (Tab 9) | Base diretta dell'AVA |
| API metrics/logging | Monitoraggio utilizzo A99X |

### 3.2 Componenti da sviluppare ex-novo

| Componente | Complessita' | Priorita' |
|------------|-------------|-----------|
| Modulo videoconferenza (WebRTC) | Alta | Fase 3 |
| Engine agenda intelligente | Media | Fase 3 |
| Pipeline traduzione simultanea | Alta | Fase 4 |
| NLP follow-up automatico | Media | Fase 3 |
| Sistema sondaggi real-time | Bassa | Fase 4 |
| Lavagna virtuale | Media | Fase 5 |

### 3.3 Mappatura Chat AI -> AVA

| Componente Chat AI (Tab 9) | Evoluzione AVA (A99X) |
|-----------------------------|-----------------------|
| `useStreamingChat.ts` | Core AVA: risposte streaming in riunione |
| `sse-client.ts` | Transport layer per tutti i canali A99X |
| `AIChatPanel.tsx` | Container AVA con sidebar multi-funzione |
| `AIChatSidebar.tsx` | Sidebar A99X: Agenda, AVA Chat, Video, Report |
| `AIChatMessage.tsx` | Messaggi AVA con contesto riunione |
| `AIChatSuggestions.tsx` | Suggerimenti AVA basati su agenda e contesto |
| `useConversations.ts` | Storico riunioni e report archivio |
| Profili per ruolo | Profili AVA personalizzati per PA/Impresa |
| RAG su dati mercati | RAG su tutti i dati dell'ente |
| Quota messaggi | Quota per piano di abbonamento |

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
| [Agenda Intelligente]  |  (Contenuto dinamico in base alla        |
| [AVA Chat]             |   sezione selezionata nella sidebar)     |
| [Video Call]           |                                          |
| [Report & Tasks]       |                                          |
| [Priorita' & Urgenze] |                                          |
| [Traduzione Live]      |                                          |
|                        |                                          |
+------------------------------------------------------------------+
```

### 4.3 Sezioni della sidebar A99X

| Sezione | Descrizione | Basata su |
|---------|-------------|-----------|
| **Agenda Intelligente** | Calendario con ottimizzazione AI delle riunioni | Nuovo |
| **AVA Chat** | Chat AI evoluta (evoluzione diretta di Tab 9) | Chat AI Streaming |
| **Video Call** | Videoconferenza con AVA integrato | WebRTC + nuovo |
| **Report & Tasks** | Report riunioni + task generati automaticamente | Nuovo |
| **Priorita' & Urgenze** | Matrice P = U x I con gestione proattiva | Nuovo |
| **Traduzione Live** | Traduzione simultanea per riunioni multilingue | Nuovo |

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
  recording_url   TEXT,
  transcript      TEXT,
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
  language        TEXT DEFAULT 'it',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Task generati dal follow-up
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
  created_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
);

-- Agenda intelligente
CREATE TABLE a99x_agenda_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES a99x_meetings(id),
  title           TEXT NOT NULL,
  duration_min    INTEGER DEFAULT 15,
  priority_score  NUMERIC(5,2),                -- P = U x I calcolato
  speaker_id      TEXT,
  notes           TEXT,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Traduzioni sessione
CREATE TABLE a99x_translations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES a99x_meetings(id),
  source_lang     TEXT NOT NULL,
  target_lang     TEXT NOT NULL,
  source_text     TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  speaker_id      TEXT,
  timestamp_ms    INTEGER,                     -- Posizione nel recording
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 6. ENDPOINT REST A99X (FUTURI)

> **NON implementare ora** — Solo per pianificazione architetturale.
> Tutti su mihub-backend-rest (Express.js su Hetzner). ZERO tRPC.

### 6.1 Agenda

```
POST   /api/a99x/agenda/optimize
  Body: { comune_id, date_range, participants[], priorities[] }
  Response: { optimized_slots[], conflicts[], suggestions[] }

GET    /api/a99x/agenda/:comune_id
  Response: { items[], meetings_scheduled }

PATCH  /api/a99x/agenda/items/:id
  Body: { priority_score?, duration_min?, speaker_id? }
```

### 6.2 Priorita'

```
POST   /api/a99x/priorities/analyze
  Body: { tasks[], context }
  Response: { analyzed_tasks[{ id, urgency, impact, priority_score }] }

GET    /api/a99x/priorities/:comune_id
  Response: { matrix[{ task_id, U, I, P }], urgent_tasks[], overdue_tasks[] }
```

### 6.3 Riunioni

```
POST   /api/a99x/meetings
  Body: { title, description, scheduled_at, participants[], ava_enabled }
  Response: { meeting_id, join_url }

GET    /api/a99x/meetings/:id
  Response: { meeting, participants[], agenda_items[] }

POST   /api/a99x/meetings/:id/transcribe
  Body: { audio_chunk (base64) }
  Response: SSE stream con trascrizione real-time

POST   /api/a99x/meetings/:id/followup
  Body: { transcript }
  Response: { tasks_generated[], decisions[], action_items[] }
```

### 6.4 Traduzione

```
POST   /api/a99x/translate/text
  Body: { text, source_lang, target_lang }
  Response: { translated_text }

POST   /api/a99x/translate/speech
  Body: { audio (base64), source_lang, target_lang }
  Response: SSE stream con traduzione audio real-time
```

---

## 7. ROADMAP DI INTEGRAZIONE — 6 FASI

### Fase 1: Chat AI Streaming (IN CORSO)
**Timeline**: Febbraio-Marzo 2026
**Stato**: In sviluppo

- Implementazione chat AI streaming con SSE nel Tab 9 "Agente AI"
- Frontend React con componenti modulari (AIChatPanel, ecc.)
- Backend REST su mihub-backend-rest con Ollama/vLLM
- Profili per ruolo (PA/Impresa/Cittadino)
- Storico conversazioni e gestione quota

**Output**: Chat AI funzionante, base dell'AVA.

### Fase 2: Test Pilota PA (6 mesi)
**Timeline**: Aprile-Settembre 2026

- Deploy chat AI a comuni pilota (Grosseto + 2-3 altri)
- Raccolta feedback utenti PA reali
- Ottimizzazione RAG su dati specifici dei comuni
- Tuning modelli AI per dominio mercati ambulanti
- Misurazione KPI: tempo risposta, soddisfazione, task completati

**Output**: Validazione del sistema con utenti reali.

### Fase 3: AVA + Agenda + Follow-Up
**Timeline**: Ottobre 2026-Gennaio 2027

- Evoluzione chat AI in AVA completo
- Implementazione Agenda Intelligente (P = U x I)
- Implementazione Follow-Up Automatizzato (NLP)
- Sostituzione Tab "Concilio" con interfaccia A99X
- Tabelle DB: `a99x_meetings`, `a99x_tasks`, `a99x_agenda_items`

**Output**: Sistema A99X core funzionante.

### Fase 4: Videoconferenza + Traduzione
**Timeline**: Febbraio-Maggio 2027

- Integrazione WebRTC per videoconferenza
- Implementazione traduzione simultanea (Speech-to-Text + Translation)
- AVA partecipa alle riunioni come assistente virtuale
- Sondaggi e Q&A in tempo reale
- Tabelle DB: `a99x_meeting_participants`, `a99x_translations`

**Output**: Riunioni virtuali con AI integrata.

### Fase 5: Lavagna Virtuale + Collaborazione
**Timeline**: Giugno-Agosto 2027

- Lavagna virtuale condivisa (canvas collaborativo)
- Annotazioni AI-assisted (AVA suggerisce durante il brainstorming)
- Integrazione documenti in tempo reale
- Export report e verbali automatici

**Output**: Suite collaborativa completa.

### Fase 6: Scale-Up Nazionale
**Timeline**: Settembre 2027+

- Roll-out a tutti i comuni DMS Hub (target 8.000)
- Ottimizzazione performance per scala
- Modelli AI specializzati per regione/territorio
- Marketplace di plugin A99X
- API pubblica per integrazioni terze parti

**Output**: A99X come piattaforma nazionale per la PA digitale.

---

## 8. VINCOLI TECNICI

### 8.1 Vincoli assoluti

| Vincolo | Dettaglio |
|---------|----------|
| **ZERO tRPC** | Backend tRPC dismesso. Solo REST API su mihub-backend-rest |
| **Modelli AI locali EU** | Compliance GDPR/AgID — nessun dato verso USA/Cina |
| **Runtime Hetzner** | Server EU (Falkenstein/Helsinki) per sovranita' dati |
| **Non toccare v9.1.2** | Il sistema stabile non va modificato — approccio chirurgico |
| **Drizzle ORM** | Schema DB SEMPRE in `drizzle/schema.ts` — mai SQL diretto |
| **Express.js backend** | mihub-backend-rest su Hetzner con PM2 |

### 8.2 Modelli AI previsti

| Tier | Modello | Hosting | Uso |
|------|---------|---------|-----|
| Starter | Qwen3-8B | Ollama su VPS CPU (Hetzner) | Chat base, FAQ |
| Essenziale | Qwen3-30B-A3B | vLLM su GPU (Hetzner) | Chat avanzata, report |
| Professionale | Qwen3-30B + RAG | vLLM + vector DB | AVA completo, analisi |
| Enterprise | Multi-model | Cluster GPU dedicato | Tutto A99X |

### 8.3 Compliance

- **GDPR**: Tutti i dati processati e archiviati in EU
- **AgID**: Conformita' alle linee guida per l'AI nella PA
- **CAD**: Codice Amministrazione Digitale — interoperabilita'
- **eIDAS**: Identita' digitale per autenticazione SPID/CIE

---

## 9. RIEPILOGO STRATEGICO

| Aspetto | Dettaglio |
|---------|----------|
| **Progetto** | A99X — Digital Market System (Assistant 99X) |
| **Origine** | Documento 41 pagine — progetto originale di un anno fa |
| **Integrazione** | Dentro MioHub, sostituzione Tab "Concilio" |
| **Fondamento** | Chat AI Streaming (Tab 9) e' la base dell'AVA |
| **6 Funzionalita'** | AVA, Videoconferenza, Agenda, Priorita', Traduzione, Follow-Up |
| **Backend** | REST API su mihub-backend-rest — ZERO tRPC |
| **AI** | Modelli locali EU (Qwen3) su Ollama/vLLM |
| **Roadmap** | 6 fasi — da Chat AI (ora) a Scale-Up Nazionale (2027+) |
| **Priorita' attuale** | Completare Chat AI Streaming, poi test pilota 6 mesi |

---

*Documento di integrazione A99X creato il 27/02/2026 — DMS Hub Team*
*Basato sul progetto originale A99X (41 pagine) e analisi di compatibilita' MioHub*
