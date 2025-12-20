# 🔑 BLUEPRINT MIO HUB - AGGIORNATO 20 DICEMBRE 2024

**DOCUMENTO DI CONTESTO PER NUOVE SESSIONI MANUS**

---

## 📋 INDICE

1. [Repository e Deploy](#-repository-e-deploy)
2. [Accesso Server Hetzner](#-accesso-server-hetzner)
3. [Database Neon PostgreSQL](#-database-neon-postgresql)
4. [Architettura Sistema Chat](#-architettura-sistema-chat)
5. [Schema Database agent_messages](#-schema-database-agent_messages)
6. [Flusso Messaggi e Mode](#-flusso-messaggi-e-mode)
7. [Problema Attuale da Risolvere](#-problema-attuale-da-risolvere)
8. [File Chiave da Conoscere](#-file-chiave-da-conoscere)
9. [Comandi Utili](#-comandi-utili)
10. [Agenti del Sistema](#-agenti-del-sistema)

---

## 🚀 REPOSITORY E DEPLOY

### Frontend (Vercel)
| Campo | Valore |
|-------|--------|
| **Repository** | `https://github.com/Chcndr/dms-hub-app-new` |
| **Branch** | `master` |
| **URL Produzione** | `https://dms-hub-app-new.vercel.app` |
| **Deploy** | Automatico su push a master |
| **Framework** | Vite + React + TypeScript + TailwindCSS |

### Backend (Hetzner)
| Campo | Valore |
|-------|--------|
| **Repository** | `https://github.com/Chcndr/mihub-backend-rest` |
| **Branch** | `master` |
| **URL Produzione** | `https://orchestratore.mio-hub.me` |
| **Deploy** | Manuale: `git pull` + `pm2 restart` |
| **Framework** | Node.js + Express |

### Flusso di Lavoro OBBLIGATORIO
```
1. Modifiche locali nel sandbox
2. git add -A && git commit -m "messaggio" && git push origin master
3. Per backend: SSH su Hetzner → git pull → pm2 restart mihub-backend
4. Per frontend: Vercel fa deploy automatico
```

**⚠️ MAI modificare direttamente sul server Hetzner!**

---

## 🖥️ ACCESSO SERVER HETZNER

| Campo | Valore |
|-------|--------|
| **IP** | `157.90.29.66` |
| **User** | `root` |
| **Chiave SSH** | `/home/ubuntu/.ssh/manus_hetzner_key` |
| **Percorso Backend** | `/root/mihub-backend-rest` |

### Comando SSH
```bash
ssh -i /home/ubuntu/.ssh/manus_hetzner_key root@157.90.29.66
```

### Deploy Backend (dopo push su GitHub)
```bash
ssh -i /home/ubuntu/.ssh/manus_hetzner_key root@157.90.29.66 'cd /root/mihub-backend-rest && git pull && pm2 restart mihub-backend'
```

### Chiave SSH Completa
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDYmV0JbMCVf7TqpHagOyg/opOnuTLfcJFTYggyUA7TLgAAAJBU74tKVO+L
SgAAAAtzc2gtZWQyNTUxOQAAACDYmV0JbMCVf7TqpHagOyg/opOnuTLfcJFTYggyUA7TLg
AAAEA2XDYJ1in4gla0GwevUqHSp5YyFUF4qB8ErgVga4QsodiZXQlswJV/tOqkdqA7KD+i
k6e5Mt9wkVNiCDJQDtMuAAAADW1hbnVzQHNhbmRib3g=
-----END OPENSSH PRIVATE KEY-----
```

---

## 💾 DATABASE NEON POSTGRESQL

| Campo | Valore |
|-------|--------|
| **Host** | `ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech` |
| **Database** | `neondb` |
| **User** | `neondb_owner` |
| **Password** | `npg_lYG6JQ5Krtsi` |
| **SSL** | `require` |

### Connessione Node.js
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: 'ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_lYG6JQ5Krtsi',
  ssl: { rejectUnauthorized: false }
});
```

---

## 🏗️ ARCHITETTURA SISTEMA CHAT

### Viste Frontend
| Vista | Descrizione | Mode | Conversation ID |
|-------|-------------|------|-----------------|
| **Chat MIO** | Chat principale con orchestratore | `auto` | `mio-main` |
| **Vista 4 Agenti** | Mostra coordinamento MIO→Agenti | `auto` | `mio-{agent}-coordination` |
| **Chat Singola Manus** | Chat diretta con Manus | `direct` | `user-manus-direct` |
| **Chat Singola Abacus** | Chat diretta con Abacus | `direct` | `user-abacus-direct` |
| **Chat Singola GPT Dev** | Chat diretta con GPT Dev | `direct` | `user-gptdev-direct` |
| **Chat Singola Zapier** | Chat diretta con Zapier | `direct` | `user-zapier-direct` |

### Flusso Mode AUTO (User → MIO)
```
User scrive a MIO
  ↓
Messaggio salvato: mio-main, mode='auto', sender='user'
  ↓
MIO processa e delega a Manus
  ↓
Messaggio salvato: mio-manus-coordination, mode='auto', sender='mio'
  ↓
Manus risponde
  ↓
Risposta salvata: mio-manus-coordination, mode='auto', sender='manus'
Risposta salvata: mio-main, mode='auto', sender='manus' (doppio canale)
  ↓
MIO elabora e risponde
  ↓
Risposta salvata: mio-main, mode='auto', sender='mio'
```

### Flusso Mode DIRECT (User → Agente)
```
User scrive direttamente a Manus
  ↓
Messaggio salvato: user-manus-direct, mode='direct', sender='user'
  ↓
Manus risponde
  ↓
Risposta salvata: user-manus-direct, mode='direct', sender='manus'
Risposta salvata: mio-main, mode='direct', sender='manus' (doppio canale)
```

---

## 📊 SCHEMA DATABASE agent_messages

```sql
CREATE TABLE agent_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   varchar NOT NULL,
  sender            varchar NOT NULL,
  recipient         varchar,
  role              varchar NOT NULL,  -- 'user' | 'assistant'
  message           text NOT NULL,
  agent             varchar,
  mode              varchar DEFAULT 'auto',  -- 'auto' | 'direct'
  meta              jsonb,
  tool_call_id      varchar,
  tool_name         varchar,
  tool_args         jsonb,
  error             boolean,
  created_at        timestamptz DEFAULT NOW()
);
```

### Valori Mode
- `'auto'`: Coordinamento MIO (visibile in Chat MIO + Vista 4 Agenti)
- `'direct'`: Chat diretta User→Agente (visibile solo in Chat Singola)

---

## 🔴 PROBLEMA ATTUALE DA RISOLVERE

### Sintomo
- Le risposte degli agenti NON appaiono nel frontend
- I messaggi utente appaiono ma senza risposte
- Nel database le risposte ESISTONO

### Causa Identificata
Il frontend chiama `get-messages?mode=auto` ma alcune risposte vengono salvate con `mode=direct` o `mode=NULL`, quindi vengono filtrate.

### Modifiche Fatte (20 Dic 2024)
1. **Backend `database.js`**: Aggiunto parametro `mode` a `addMessage` e `saveDirectMessage`
2. **Backend `orchestrator.js`**: Corretto `conversationId` per usare quello passato invece di generarne uno nuovo
3. **Frontend `MioContext.tsx`**: Rimosso filtro `mode=auto` dalla chiamata `get-messages`

### Stato Attuale
- ✅ Backend salva messaggi con mode corretto
- ✅ API curl funziona e restituisce risposte
- ❌ Frontend ancora non mostra le risposte (da verificare)

### Prossimi Passi
1. Verificare che il deploy Vercel sia completato
2. Testare dal frontend se le risposte appaiono
3. Se non funziona, controllare la console del browser per errori JavaScript
4. Verificare che `get-messages` restituisca tutti i messaggi (user + assistant)

---

## 📁 FILE CHIAVE DA CONOSCERE

### Backend (mihub-backend-rest)

| File | Descrizione |
|------|-------------|
| `routes/orchestrator.js` | Endpoint principale `/api/mihub/orchestrator`, routing messaggi |
| `utils/direct_saver.js` | Salvataggio diretto messaggi nel database |
| `src/modules/orchestrator/database.js` | Funzioni database: `addMessage`, `saveDirectMessage`, `createConversation` |
| `src/modules/orchestrator/llm.js` | Chiamate agli agenti LLM (MIO, Manus, Abacus, GPT Dev) |
| `config/database.js` | Configurazione connessione PostgreSQL |

### Frontend (dms-hub-app-new)

| File | Descrizione |
|------|-------------|
| `api/mihub/get-messages.ts` | Endpoint Vercel per recuperare messaggi dal database |
| `client/src/contexts/MioContext.tsx` | Context React per chat MIO, gestisce invio/ricezione messaggi |
| `client/src/hooks/useAgentLogs.ts` | Hook per caricare messaggi agenti (Vista 4 + Chat Singole) |
| `client/src/pages/DashboardPA.tsx` | Pagina principale dashboard con tutte le chat |
| `client/src/api/orchestratorClient.ts` | Client per chiamare backend orchestrator |
| `client/src/lib/agentHelper.ts` | Helper per invio messaggi agli agenti |

---

## 🛠️ COMANDI UTILI

### Test API Backend
```bash
# Test MIO mode=auto
curl -s -X POST https://orchestratore.mio-hub.me/api/mihub/orchestrator \
  -H "Content-Type: application/json" \
  -d '{"mode": "auto", "message": "Test", "conversationId": "mio-main"}' | jq .

# Test Manus mode=direct
curl -s -X POST https://orchestratore.mio-hub.me/api/mihub/orchestrator \
  -H "Content-Type: application/json" \
  -d '{"mode": "direct", "targetAgent": "manus", "message": "Test", "conversationId": "user-manus-direct"}' | jq .
```

### Query Database
```bash
cd /home/ubuntu/mihub-backend-rest && node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_lYG6JQ5Krtsi',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const result = await pool.query(\`
    SELECT conversation_id, sender, role, mode, LEFT(message, 50) as msg, created_at 
    FROM agent_messages 
    WHERE created_at > NOW() - INTERVAL '10 minutes'
    ORDER BY created_at DESC
    LIMIT 20
  \`);
  console.log(result.rows);
  await pool.end();
}
check();
"
```

### PM2 Logs
```bash
ssh -i /home/ubuntu/.ssh/manus_hetzner_key root@157.90.29.66 'pm2 logs mihub-backend --lines 100'
```

---

## 🤖 AGENTI DEL SISTEMA

| Agente | Stato | Funzione |
|--------|-------|----------|
| **MIO** | ✅ OK | Orchestratore principale, coordina gli altri agenti |
| **Manus** | ✅ OK | Navigazione web, esecuzione comandi SSH, file system |
| **Abacus** | ✅ OK | Query SQL, accesso database PostgreSQL/Neon |
| **GPT Dev** | ✅ OK | Accesso repository GitHub, lettura file, operazioni Git |
| **Zapier** | ❌ Errore | Chiave API invalida (da configurare) |

---

## 📝 COMMIT RECENTI IMPORTANTI

### Backend (mihub-backend-rest)
- `d2fa791` - Fix: Add mode parameter to database.js addMessage and saveDirectMessage
- `d879ee6` - Fix: Use passed conversationId instead of generating new one
- `3582397` - Fix: Generate unique conversation IDs for direct mode agents

### Frontend (dms-hub-app-new)
- `5e57256` - Fix: Remove mode=auto filter from get-messages calls
- `98539d4` - Fix: Add temporary polling after message send
- `f884124` - Fix: Correzione tipi TypeScript - OrchestratorMode e AgentId

---

## 📚 REPORT UTILI NELLA SANDBOX

| File | Descrizione |
|------|-------------|
| `/home/ubuntu/SCHEMA_GRAFICO_FLUSSO_MODE.md` | Diagrammi Mermaid del flusso messaggi |
| `/home/ubuntu/REPORT_FINALE_SISTEMA_MODE.md` | Report dettagliato implementazione mode |
| `/home/ubuntu/blueprint_sistema_mode_aggiornato.md` | Blueprint sistema mode |
| `/home/ubuntu/ANALISI_BUG_CONVERSATION_ID.md` | Analisi bug conversation_id |

---

*Documento creato il 20 Dicembre 2024 - Manus AI*
*Da allegare all'inizio di ogni nuova sessione di lavoro*
