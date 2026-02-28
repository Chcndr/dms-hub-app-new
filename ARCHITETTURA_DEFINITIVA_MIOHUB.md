# 🏗️ ARCHITETTURA DEFINITIVA MIO HUB - Sistema Messaggi

**Data**: 20 Dicembre 2024
**Versione**: 1.0

---

## 📊 SCHEMA FLUSSO DATI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITETTURA MIO HUB                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              SCRITTURA (Invio Messaggi)
                              ═══════════════════════════

┌──────────────┐     POST /api/mihub/orchestrator     ┌──────────────────────┐
│   FRONTEND   │ ─────────────────────────────────────▶│  BACKEND HETZNER     │
│   (Vercel)   │                                       │  (PM2 - Node.js)     │
│              │                                       │                      │
│ dms-hub-app  │                                       │ mihub-backend-rest   │
│ -new.vercel  │                                       │ orchestratore.mio-   │
│ .app         │                                       │ hub.me               │
└──────────────┘                                       └──────────┬───────────┘
                                                                  │
                                                                  │ 1. Processa con LLM
                                                                  │ 2. Chiama Agenti
                                                                  │ 3. Salva messaggi
                                                                  ▼
                                                       ┌──────────────────────┐
                                                       │   DATABASE NEON      │
                                                       │   (PostgreSQL)       │
                                                       │                      │
                                                       │ Tabella:             │
                                                       │ agent_messages       │
                                                       └──────────────────────┘


                              LETTURA (Visualizzazione Messaggi)
                              ══════════════════════════════════

┌──────────────┐     GET /api/mihub/get-messages       ┌──────────────────────┐
│   FRONTEND   │ ─────────────────────────────────────▶│   DATABASE NEON      │
│   (Vercel)   │◀─────────────────────────────────────│   (PostgreSQL)       │
│              │         JSON Response                 │                      │
│ Vercel API   │                                       │ TUBO DIRETTO         │
│ Serverless   │                                       │ (Bypassa Hetzner)    │
└──────────────┘                                       └──────────────────────┘
```

---

## 🔑 PUNTI CHIAVE

### 1. SCRITTURA - Backend Hetzner (PM2)

**Endpoint**: `POST https://orchestratore.mio-hub.me/api/mihub/orchestrator`

**Flusso**:

1. Frontend invia messaggio al backend Hetzner
2. Backend processa con LLM (Gemini)
3. Orchestratore coordina gli agenti (MIO, Manus, Abacus, GPT Dev, Zapier)
4. Backend salva messaggi nel database Neon tramite `direct_saver.js`

**File coinvolti** (Backend):

- `routes/orchestrator.js` - Endpoint principale
- `utils/direct_saver.js` - Salvataggio diretto nel DB
- `src/modules/orchestrator/llm.js` - Chiamate LLM
- `config/database.js` - Connessione PostgreSQL

### 2. LETTURA - Vercel API (Tubo Diretto)

**Endpoint**: `GET https://dms-hub-app-new.vercel.app/api/mihub/get-messages`

**Flusso**:

1. Frontend chiama l'API Vercel serverless
2. API Vercel si connette DIRETTAMENTE al database Neon
3. Restituisce i messaggi al frontend
4. **BYPASSA COMPLETAMENTE il backend Hetzner**

**File coinvolti** (Frontend):

- `api/mihub/get-messages.ts` - Endpoint Vercel serverless
- `client/src/contexts/MioContext.tsx` - Context React per Chat MIO
- `client/src/hooks/useAgentLogs.ts` - Hook per Vista 4 Agenti e Chat Singole

---

## 🏝️ ARCHITETTURA 8 ISOLE (Conversation IDs)

| Isola                    | Conversation ID           | Descrizione                 | Mode     |
| ------------------------ | ------------------------- | --------------------------- | -------- |
| **Chat MIO**             | `mio-main`                | User ↔ MIO (Orchestratore) | `auto`   |
| **Coord. Manus**         | `mio-manus-coordination`  | MIO ↔ Manus                | `auto`   |
| **Coord. Abacus**        | `mio-abacus-coordination` | MIO ↔ Abacus               | `auto`   |
| **Coord. GPT Dev**       | `mio-gptdev-coordination` | MIO ↔ GPT Dev              | `auto`   |
| **Coord. Zapier**        | `mio-zapier-coordination` | MIO ↔ Zapier               | `auto`   |
| **Chat Singola Manus**   | `user-manus-direct`       | User ↔ Manus (diretto)     | `direct` |
| **Chat Singola Abacus**  | `user-abacus-direct`      | User ↔ Abacus (diretto)    | `direct` |
| **Chat Singola GPT Dev** | `user-gptdev-direct`      | User ↔ GPT Dev (diretto)   | `direct` |
| **Chat Singola Zapier**  | `user-zapier-direct`      | User ↔ Zapier (diretto)    | `direct` |

---

## 📋 SCHEMA DATABASE `agent_messages`

```sql
CREATE TABLE agent_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   varchar NOT NULL,    -- ID dell'isola
  sender            varchar NOT NULL,    -- Chi invia (user, mio, manus, etc.)
  recipient         varchar,             -- Chi riceve
  role              varchar NOT NULL,    -- 'user' | 'assistant'
  message           text NOT NULL,       -- Contenuto
  agent             varchar,             -- Agente che ha generato
  mode              varchar DEFAULT 'auto',  -- 'auto' | 'direct'
  meta              jsonb,               -- Metadati
  tool_call_id      varchar,
  tool_name         varchar,
  tool_args         jsonb,
  error             boolean,
  created_at        timestamptz DEFAULT NOW()
);
```

---

## 🔄 FLUSSO MODE AUTO (User → MIO → Agenti)

```
1. User scrive "Controlla PM2" nella Chat MIO
   │
   ▼
2. Frontend invia a Backend Hetzner:
   POST /api/mihub/orchestrator
   { mode: "auto", message: "Controlla PM2", conversationId: "mio-main" }
   │
   ▼
3. Backend salva messaggio utente:
   INSERT INTO agent_messages (conversation_id='mio-main', sender='user', role='user')
   │
   ▼
4. MIO (LLM) analizza e delega a Manus:
   INSERT INTO agent_messages (conversation_id='mio-manus-coordination', sender='mio', role='user')
   │
   ▼
5. Manus esegue comando SSH e risponde:
   INSERT INTO agent_messages (conversation_id='mio-manus-coordination', sender='manus', role='assistant')
   │
   ▼
6. MIO elabora risposta e risponde all'utente:
   INSERT INTO agent_messages (conversation_id='mio-main', sender='mio', role='assistant')
   │
   ▼
7. Frontend legge da Vercel API (TUBO DIRETTO):
   GET /api/mihub/get-messages?conversation_id=mio-main
```

---

## 🔄 FLUSSO MODE DIRECT (User → Agente)

```
1. User scrive "Esegui pm2 list" nella Chat Singola Manus
   │
   ▼
2. Frontend invia a Backend Hetzner:
   POST /api/mihub/orchestrator
   { mode: "direct", targetAgent: "manus", message: "Esegui pm2 list", conversationId: "user-manus-direct" }
   │
   ▼
3. Backend salva messaggio utente:
   INSERT INTO agent_messages (conversation_id='user-manus-direct', sender='user', role='user', mode='direct')
   │
   ▼
4. Manus (LLM) risponde direttamente:
   INSERT INTO agent_messages (conversation_id='user-manus-direct', sender='manus', role='assistant', mode='direct')
   │
   ▼
5. Frontend legge da Vercel API (TUBO DIRETTO):
   GET /api/mihub/get-messages?conversation_id=user-manus-direct
```

---

## ⚠️ PERCHÉ IL TUBO DIRETTO?

Il "tubo diretto" (Vercel → Neon) è stato implementato perché:

1. **Problema originale**: I messaggi salvati dal backend Hetzner non apparivano nel frontend
2. **Causa**: Problemi di trasformazione/serializzazione nel passaggio Hetzner → Frontend
3. **Soluzione**: Bypassare Hetzner per la LETTURA, connettendosi direttamente al database

**Vantaggi**:

- Lettura più veloce (meno hop)
- Nessuna trasformazione intermedia
- Dati sempre freschi dal database

**Svantaggi**:

- Due punti di connessione al database (Hetzner + Vercel)
- Necessità di mantenere sincronizzate le credenziali

---

## 🛠️ VARIABILI AMBIENTE

### Backend Hetzner (.env)

```
POSTGRES_URL=postgresql://neondb_owner:npg_lYG6JQ5Krtsi@ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
GEMINI_API_KEY=...
```

### Frontend Vercel (Environment Variables)

```
DATABASE_URL=postgresql://neondb_owner:npg_lYG6JQ5Krtsi@ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 📁 FILE CHIAVE

### Backend (mihub-backend-rest)

| File                              | Funzione                     |
| --------------------------------- | ---------------------------- |
| `routes/orchestrator.js`          | Endpoint POST orchestratore  |
| `utils/direct_saver.js`           | Salvataggio diretto messaggi |
| `src/modules/orchestrator/llm.js` | Chiamate LLM agenti          |
| `config/database.js`              | Pool connessione PostgreSQL  |

### Frontend (dms-hub-app-new)

| File                                 | Funzione                             |
| ------------------------------------ | ------------------------------------ |
| `api/mihub/get-messages.ts`          | Endpoint GET messaggi (TUBO DIRETTO) |
| `client/src/contexts/MioContext.tsx` | Context Chat MIO                     |
| `client/src/hooks/useAgentLogs.ts`   | Hook Vista 4 Agenti + Chat Singole   |
| `client/src/pages/DashboardPA.tsx`   | Pagina principale dashboard          |

---

_Documento generato il 20 Dicembre 2024 - Manus AI_
