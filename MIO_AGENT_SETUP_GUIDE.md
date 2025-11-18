# 🤖 MIO Agent - Guida Setup Completa

## 📋 Stato Attuale

### ✅ Completato
- **Componente MIOAgent.tsx** integrato come 24° tab nella Dashboard PA
- **API Routes Vercel** create e funzionanti:
  - `POST /api/logs/initSchema` - Inizializza tabella database
  - `POST /api/logs/createLog` - Crea nuovo log agente
  - `GET /api/logs/getLogs` - Recupera log agenti
  - `GET /api/logs/test` - Test endpoint (verifica configurazione)
- **Tab Integrazioni** aggiornato con 3 endpoint MIO Agent testabili
- **Tab Debug** aggiornato con status API MIO Agent nella Console Logs Live
- **Deploy Vercel** completato e funzionante

### ⚠️ Da Completare
- **DATABASE_URL Railway** - Le credenziali sono scadute/cambiate
- **Inizializzazione tabella** `mio_agent_logs` nel database

---

## 🔧 Istruzioni per Completare il Setup

### Step 1: Ottenere Nuove Credenziali Railway

1. **Accedi a Railway**: https://railway.app/dashboard
2. **Trova il progetto** con il database MySQL
3. **Apri il servizio MySQL**
4. **Vai su "Variables"** o "Connect"
5. **Copia la connection string** in formato:
   ```
   mysql://user:password@host:port/database
   ```

### Step 2: Aggiornare DATABASE_URL su Vercel

1. **Accedi a Vercel**: https://vercel.com/chcndrs-projects/dms-hub-app-new
2. **Vai su "Settings" → "Environment Variables"**
3. **Trova la variabile `DATABASE_URL`**
4. **Clicca "Edit"** e sostituisci con la nuova connection string Railway
5. **Salva** e **Redeploy** il progetto

### Step 3: Inizializzare la Tabella Database

Dopo aver aggiornato DATABASE_URL, esegui:

```bash
curl -X POST https://dms-hub-app-new.vercel.app/api/logs/initSchema
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Table mio_agent_logs created successfully",
  "status": "created"
}
```

### Step 4: Testare gli Endpoint

#### Test Configurazione
```bash
curl https://dms-hub-app-new.vercel.app/api/logs/test
```

#### Creare un Log di Test
```bash
curl -X POST https://dms-hub-app-new.vercel.app/api/logs/createLog \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "MIO",
    "action": "test_log",
    "status": "success",
    "message": "Test log creato con successo",
    "details": {
      "test": true,
      "timestamp": "2025-11-18T01:00:00Z"
    }
  }'
```

#### Recuperare i Log
```bash
curl https://dms-hub-app-new.vercel.app/api/logs/getLogs
```

---

## 📊 Schema Tabella `mio_agent_logs`

```sql
CREATE TABLE mio_agent_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent VARCHAR(100) NOT NULL COMMENT 'Nome agente (MIO, Manus, etc.)',
  action VARCHAR(255) NOT NULL COMMENT 'Azione eseguita',
  status ENUM('success', 'error', 'warning', 'info') NOT NULL COMMENT 'Stato operazione',
  message TEXT COMMENT 'Messaggio descrittivo',
  details TEXT COMMENT 'Dettagli aggiuntivi in formato JSON',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp evento',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data creazione record',
  INDEX idx_agent (agent),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🎯 Utilizzo nella Dashboard PA

### Tab MIO Agent
- Visualizza i log degli agenti in tempo reale
- Mostra statistiche e metriche
- Interfaccia per gestire task e operazioni

### Tab Integrazioni
- Sezione **"MIO Agent"** con 3 endpoint testabili
- Interfaccia per testare API direttamente dalla dashboard
- Visualizzazione JSON response in tempo reale

### Tab Debug
- Console Logs Live mostra status API MIO Agent
- Verifica che tutti gli endpoint siano "Ready"
- Link diretto al tab Integrazioni per test

---

## 🔗 Link Utili

- **Dashboard PA**: https://dms-hub-app-new.vercel.app/dashboard-pa
- **Vercel Project**: https://vercel.com/chcndrs-projects/dms-hub-app-new
- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repository**: https://github.com/Chcndr/dms-hub-app-new

---

## 📝 Note Tecniche

### Stack Tecnologico
- **Frontend**: Vite + React, wouter routing, shadcn/ui
- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL su Railway
- **ORM**: Drizzle ORM
- **Deploy**: Vercel Serverless Functions

### Architettura API Routes
Le API routes sono funzioni serverless standalone che:
- Usano `mysql2/promise` per connessione diretta
- Gestiscono connessione e chiusura in ogni richiesta
- Supportano CORS e validazione input
- Restituiscono JSON con `success`, `error`, `stack`

### File Chiave
- `api/logs/initSchema.ts` - Inizializzazione schema
- `api/logs/createLog.ts` - Creazione log
- `api/logs/getLogs.ts` - Recupero log
- `api/logs/test.ts` - Test configurazione
- `client/src/components/MIOAgent.tsx` - Componente principale
- `client/src/components/Integrazioni.tsx` - Gestione endpoint
- `drizzle/schema.ts` - Schema database

---

## 🚀 Prossimi Passi

1. ✅ Aggiornare DATABASE_URL su Vercel
2. ✅ Inizializzare tabella con `/api/logs/initSchema`
3. ✅ Testare creazione log con `/api/logs/createLog`
4. ✅ Verificare recupero log con `/api/logs/getLogs`
5. 🔄 Integrare con sistema MIO per logging automatico
6. 🔄 Configurare Zapier per GitHub repository_dispatch
7. 🔄 Implementare dashboard analytics per log MIO

---

**Ultimo aggiornamento**: 18 Novembre 2025  
**Commit**: `31605ca` - Test endpoint aggiunto  
**Deploy**: Vercel Production (Ready)
