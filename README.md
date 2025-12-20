# 🚀 DMS HUB - Sistema Multi-Agente MIO

**Dashboard PA per la gestione di Rete Mercati Made in Italy**

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-brightgreen)](https://dms-hub-app-new.vercel.app)
[![Backend Status](https://img.shields.io/badge/backend-hetzner-blue)](https://orchestratore.mio-hub.me)

---

## 📋 Indice

1. [Panoramica](#-panoramica)
2. [Architettura Sistema](#-architettura-sistema)
3. [Sistema di Messaggistica](#-sistema-di-messaggistica)
4. [Agenti AI](#-agenti-ai)
5. [API Reference](#-api-reference)
6. [Setup Sviluppo](#-setup-sviluppo)
7. [Deploy](#-deploy)

---

## 🎯 Panoramica

DMS HUB è una piattaforma di gestione per la Rete Mercati Made in Italy, dotata di un sistema multi-agente AI chiamato **MIO** (Multi-agent Intelligence Orchestrator).

### Caratteristiche Principali

- **Dashboard PA**: Interfaccia amministrativa completa
- **MIO Agent**: Orchestratore AI che coordina 4 agenti specializzati
- **Chat Multi-Agente**: Sistema di chat con routing intelligente
- **Shared Workspace**: Lavagna collaborativa per output visivi

---

## 🏗️ Architettura Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│                    dms-hub-app-new.vercel.app                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Dashboard  │  │  Chat MIO   │  │   Vista 4 Agenti        │  │
│  │     PA      │  │  Principale │  │   + Chat Singole        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │  API Vercel       │                        │
│                    │  /api/mihub/*     │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (Neon PostgreSQL)                  │
│                    ep-bold-silence-adftsojg                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    agent_messages                        │    │
│  │  id | conversation_id | sender | role | message | mode  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Hetzner)                          │
│                   orchestratore.mio-hub.me                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Orchestrator                          │    │
│  │  ┌─────┐  ┌───────┐  ┌────────┐  ┌───────┐  ┌────────┐ │    │
│  │  │ MIO │→ │ Manus │  │ Abacus │  │GPT Dev│  │ Zapier │ │    │
│  │  └─────┘  └───────┘  └────────┘  └───────┘  └────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | Vite + React + TypeScript + TailwindCSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (Neon) |
| **Deploy Frontend** | Vercel (automatico) |
| **Deploy Backend** | Hetzner VPS (manuale) |
| **AI Models** | OpenAI GPT-4 |

---

## 💬 Sistema di Messaggistica

### Conversation IDs

Il sistema utilizza conversation_id fissi per identificare le diverse chat:

| Conversation ID | Descrizione | Mode |
|-----------------|-------------|------|
| `mio-main` | Chat principale con MIO | `auto` |
| `user-gptdev-direct` | Chat diretta con GPT Developer | `direct` |
| `user-manus-direct` | Chat diretta con Manus | `direct` |
| `user-abacus-direct` | Chat diretta con Abacus | `direct` |
| `user-zapier-direct` | Chat diretta con Zapier | `direct` |
| `mio-{agent}-coordination` | Coordinamento MIO→Agente | `auto` |

### Statistiche Attuali (20 Dic 2024)

| Conversation | Messaggi |
|--------------|----------|
| mio-main | 148 |
| user-gptdev-direct | 54 |
| user-manus-direct | 72 |
| user-abacus-direct | 21 |
| user-zapier-direct | 19 |

### Schema Database `agent_messages`

```sql
CREATE TABLE agent_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   varchar NOT NULL,    -- ID conversazione
  sender            varchar NOT NULL,    -- Chi ha inviato: 'user', 'mio', 'manus', 'abacus', 'gptdev', 'zapier'
  recipient         varchar,             -- Destinatario (opzionale)
  role              varchar NOT NULL,    -- 'user' | 'assistant'
  message           text NOT NULL,       -- Contenuto del messaggio
  agent             varchar,             -- Agente che ha risposto
  mode              varchar DEFAULT 'auto',  -- 'auto' | 'direct'
  meta              jsonb,               -- Metadati aggiuntivi
  tool_call_id      varchar,             -- ID chiamata tool (se presente)
  tool_name         varchar,             -- Nome tool usato
  tool_args         jsonb,               -- Argomenti tool
  error             boolean,             -- Flag errore
  created_at        timestamptz DEFAULT NOW()
);
```

### Campi Chiave

| Campo | Valori Possibili | Descrizione |
|-------|------------------|-------------|
| **sender** | `user`, `mio`, `manus`, `abacus`, `gptdev`, `zapier` | Chi ha inviato il messaggio |
| **role** | `user`, `assistant` | Ruolo nel contesto LLM |
| **mode** | `auto`, `direct` | Modalità di routing |
| **agent** | `null`, `mio`, `manus`, `abacus`, `gptdev`, `zapier` | Agente che ha processato |

### Logica di Rendering Frontend

```typescript
// Chat Principale MIO
{msg.role === 'user' ? 'Tu' : msg.agentName?.toUpperCase() || 'MIO'}

// Vista Singola (GPT Dev, Manus, Abacus, Zapier)
{msg.role === 'user' ? 'Tu' : (msg.agent || 'agente')}
```

### Flusso Mode AUTO (User → MIO → Agente)

```
1. User scrive a MIO
   └→ Salvato: mio-main, sender='user', role='user', mode='auto'

2. MIO analizza e delega a Manus
   └→ Salvato: mio-manus-coordination, sender='mio', role='user', mode='auto'

3. Manus risponde
   └→ Salvato: mio-manus-coordination, sender='manus', role='assistant', mode='auto'
   └→ Salvato: mio-main, sender='manus', role='assistant', mode='auto'

4. MIO elabora e risponde all'utente
   └→ Salvato: mio-main, sender='mio', role='assistant', mode='auto'
```

### Flusso Mode DIRECT (User → Agente)

```
1. User scrive direttamente a Manus
   └→ Salvato: user-manus-direct, sender='user', role='user', mode='direct'

2. Manus risponde
   └→ Salvato: user-manus-direct, sender='manus', role='assistant', mode='direct'
```

---

## 🤖 Agenti AI

### MIO - Orchestratore Principale

**Ruolo**: Coordinatore centrale che analizza le richieste e delega agli agenti specializzati.

**Capacità**:
- Analisi richieste complesse
- Routing intelligente agli agenti
- Aggregazione risposte multiple
- Gestione workflow multi-step

### Manus - SysAdmin

**Ruolo**: Gestione server e operazioni di sistema.

**Capacità**:
- Esecuzione comandi SSH
- Gestione file system
- Controllo servizi (PM2, Nginx)
- Deploy applicazioni
- Analisi log

### Abacus - Data Analyst

**Ruolo**: Analisi dati e query database.

**Capacità**:
- Query SQL su PostgreSQL
- Aggregazioni e statistiche
- Report dati
- Accesso database Neon

### GPT Developer - Sviluppatore

**Ruolo**: Gestione codice e repository.

**Capacità**:
- Clonazione repository GitHub
- Lettura/scrittura file
- Creazione Pull Request
- Analisi codice
- Generazione diagrammi

### Zapier - Automatore

**Ruolo**: Integrazioni e automazioni esterne.

**Capacità**:
- Invio messaggi WhatsApp
- Gestione Google Calendar
- Invio email Gmail
- Creazione documenti Google Docs

---

## 📡 API Reference

### GET /api/mihub/get-messages

Recupera messaggi da una conversazione.

**Query Parameters**:

| Parametro | Tipo | Required | Default | Descrizione |
|-----------|------|----------|---------|-------------|
| `conversation_id` | string | ✅ | - | ID conversazione |
| `agent_name` | string | ❌ | - | Filtra per agente |
| `mode` | string | ❌ | - | Filtra per mode (auto/direct) |
| `limit` | number | ❌ | 200 | Max messaggi |

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "mio-main",
      "agent": "mio",
      "sender": "user",
      "role": "user",
      "message": "Ciao MIO",
      "created_at": "2025-12-20T10:00:00Z",
      "meta": null,
      "mode": "auto"
    }
  ],
  "pagination": {
    "total": 148,
    "limit": 200,
    "has_more": false
  }
}
```

### POST /api/mihub/orchestrator-proxy

Invia un messaggio all'orchestratore.

**Request Body**:
```json
{
  "message": "Chiedi a Manus lo stato del server",
  "mode": "auto",
  "targetAgent": "manus",
  "conversationId": "mio-main"
}
```

**Response**:
```json
{
  "success": true,
  "agent": "manus",
  "conversationId": "mio-main",
  "message": "Il server è online..."
}
```

---

## 🛠️ Setup Sviluppo

### Prerequisiti

- Node.js 18+
- pnpm
- Account Vercel
- Accesso SSH al server Hetzner

### Installazione

```bash
# Clone repository
git clone https://github.com/Chcndr/dms-hub-app-new.git
cd dms-hub-app-new

# Installa dipendenze
pnpm install

# Avvia dev server
pnpm dev
```

### Variabili d'Ambiente

```env
# Database
DATABASE_URL=postgresql://neondb_owner:xxx@ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Backend
VITE_BACKEND_URL=https://orchestratore.mio-hub.me
```

---

## 🚀 Deploy

### Frontend (Automatico)

Il deploy su Vercel è automatico ad ogni push su `master`:

```bash
git add -A
git commit -m "feat: nuova funzionalità"
git push origin master
```

### Backend (Manuale)

```bash
# SSH al server
ssh -i ~/.ssh/manus_hetzner_key root@157.90.29.66

# Deploy
cd /root/mihub-backend-rest
git pull origin master
pm2 restart mihub-backend
```

---

## 📝 Changelog Recente

### 20 Dicembre 2024

- **Fix sender display**: Corretto il rendering "da Tu" vs "da MIO" nelle chat singole
- **Commit**: `fd885bd` - Semplificata logica sender nelle Vista Singola

### 19 Dicembre 2024

- **Fix conversation_id**: Implementati ID fissi per le conversazioni
- **Fix mode parameter**: Aggiunto parametro mode al salvataggio messaggi

---

## 📚 Documentazione Aggiuntiva

- [BLUEPRINT_MIOHUB.md](./BLUEPRINT_MIOHUB.md) - Documentazione tecnica dettagliata
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architettura del sistema

---

*Ultimo aggiornamento: 20 Dicembre 2024*
