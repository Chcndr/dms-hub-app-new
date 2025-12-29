# Blueprint Evolutivo: Modulo SSO SUAP MioHub

**Versione:** 2.0  
**Data:** 29 Dicembre 2024  
**Autore:** Manus AI  
**Stato:** R1 Backend Implementato

---

## 1. Visione Strategica

L'obiettivo è trasformare MioHub da un efficace gestionale interno per le pratiche di commercio su aree pubbliche in un **nodo interoperabile del Sistema Informativo degli Sportelli Unici (SSU)**.

Il sistema evolverà per supportare l'intero ciclo di vita della pratica, dalla ricezione telematica (come Ente Terzo/Sussidiario) all'istruttoria automatizzata, fino all'emissione del provvedimento finale, in piena conformità con le specifiche tecniche nazionali (AgID, DPR 160/2010).

---

## 2. Architettura Infrastrutturale

### 2.1 Stack Tecnologico

| Componente | Tecnologia | Hosting | Repository |
|------------|------------|---------|------------|
| **Frontend** | React + Tailwind + shadcn/ui | Vercel | `dms-hub-app-new` |
| **Backend** | Node.js + Express REST | Hetzner | `mihub-backend-rest` |
| **Database** | PostgreSQL | Neon | - |
| **Storage** | S3 | AWS | - |
| **CI/CD** | GitHub Actions | GitHub | - |

### 2.2 Flusso Dati Architetturale

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUAP COMUNALE (Esterno)                          │
│  - Riceve pratica SCIA dal cittadino/impresa                       │
│  - Invia pratica a MioHub (via PEC/Portale/Email)                  │
│  - Riceve esito da MioHub                                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ File ZIP/XML (manuale)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                                │
│  dms-hub-app-new/client                                             │
│                                                                     │
│  Sezioni:                                                          │
│  ├── Dashboard SUAP (KPI, Attività Recente)                       │
│  ├── Lista Pratiche (filtri, ricerca, export)                     │
│  ├── Dettaglio Pratica (timeline, checks, documenti)              │
│  ├── Form SCIA / Concessione (inserimento manuale)                │
│  ├── [NUOVO] Area Upload Drag & Drop                              │
│  └── [NUOVO] Gestione Documenti (upload/download)                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API (HTTPS)
                                   │ orchestratore.mio-hub.me
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Hetzner)                                │
│  mihub-backend-rest/routes/suap.js                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ENDPOINT R0 (Esistenti - Funzionanti)                       │   │
│  │ GET  /api/suap/stats              → Statistiche dashboard   │   │
│  │ GET  /api/suap/pratiche           → Lista pratiche          │   │
│  │ GET  /api/suap/pratiche/:id       → Dettaglio pratica       │   │
│  │ POST /api/suap/pratiche           → Crea pratica manuale    │   │
│  │ POST /api/suap/pratiche/:id/valuta → Valutazione automatica │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ENDPOINT R1 (Nuovi - Implementati)                          │   │
│  │ POST /api/suap/import             → Import XML/ZIP          │   │
│  │ POST /api/suap/pratiche/:id/refresh → Refresh dati          │   │
│  │ POST /api/suap/pratiche/:id/stato → Cambio stato            │   │
│  │ POST /api/suap/pratiche/:id/documenti → Upload documento    │   │
│  │ GET  /api/suap/pratiche/:id/documenti → Lista documenti     │   │
│  │ GET  /api/suap/documenti/:docId/download → Download URL     │   │
│  │ GET  /api/suap/pratiche/:id/eventi → Audit trail            │   │
│  │ POST /api/suap/pratiche/:id/checks → Registra verifica      │   │
│  │ GET  /api/suap/pratiche/:id/checks → Lista verifiche        │   │
│  │ POST /api/suap/pratiche/:id/azioni → Crea azione workflow   │   │
│  │ GET  /api/suap/pratiche/:id/azioni → Lista azioni           │   │
│  │ GET  /api/suap/regole             → Lista regole ente       │   │
│  │ PUT  /api/suap/regole/:checkCode  → Aggiorna regola         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SERVIZI INTERNI                                             │   │
│  │ - SuapService (logica business)                             │   │
│  │ - Parser XML/ZIP (xml2js, adm-zip)                          │   │
│  │ - Document Vault (S3 upload/download)                       │   │
│  │ - Audit Logger (event sourcing)                             │   │
│  │ - Rules Engine v1 (valutazione automatica)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ SQL (SSL)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Neon PostgreSQL)                       │
│                                                                     │
│  Tabelle SUAP:                                                     │
│  ├── suap_pratiche     (core, multi-ente, idempotenza CUI)        │
│  ├── suap_eventi       (audit trail, event sourcing)              │
│  ├── suap_checks       (verifiche automatiche/manuali)            │
│  ├── suap_decisioni    (esiti motore regole)                      │
│  ├── suap_azioni       (workflow asincrono)                       │
│  ├── suap_documenti    (document vault metadata)                  │
│  └── suap_regole       (configurazione per ente)                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ S3 API
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE (AWS S3)                                 │
│  Bucket: miohub-documents                                          │
│  Path: suap/{ente_id}/{pratica_id}/{timestamp}_{filename}         │
│  - PDF firmati (P7M)                                               │
│  - XML pratiche originali                                          │
│  - Allegati vari                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Livelli di Input Pratica

Il sistema supporta **tre livelli progressivi** di inserimento pratiche, dal più semplice al più automatizzato.

### 3.1 Panoramica Livelli

| Livello | Nome | Descrizione | Stato | Quando Usarlo |
|---------|------|-------------|-------|---------------|
| **0** | **Inserimento Manuale** | Compili i form SCIA/Concessione copiando i dati dal PDF ricevuto | ✅ **Funzionante** | Subito, per testare e per pratiche singole |
| **1** | **Smart Import** | Carichi il file ZIP/XML e MioHub importa automaticamente i dati | ✅ Backend pronto, ⏳ UI da fare | Quando hai molte pratiche da inserire |
| **2** | **Interoperabilità PDND** | MioHub riceve direttamente le pratiche dal SUAP centrale | 🔜 Futuro | Dopo accreditamento PDND |

### 3.2 Livello 0: Inserimento Manuale (Attivo ORA)

Questo è il flusso che **stai usando adesso** per testare il sistema.

**Passaggi Dettagliati:**

| Step | Azione | Dove |
|------|--------|------|
| 1 | Ricevi il PDF della pratica SCIA dal SUAP Comunale | PEC / Email |
| 2 | Apri il PDF e identifica i dati (Richiedente, CF, Oggetto, etc.) | PDF Viewer |
| 3 | Vai su MioHub → SSO SUAP → Nuova Pratica | Dashboard SUAP |
| 4 | Compila il form SCIA o Concessione con i dati del PDF | Form SCIA / Concessione |
| 5 | Salva la pratica | Bottone Salva |
| 6 | Verifica i dati nella scheda Dettaglio | Dettaglio Pratica |
| 7 | Esegui la valutazione | Bottone Valuta |
| 8 | Genera l'esito (PDF) e invialo al SUAP | Export PDF |

**Vantaggi:**
- Funziona subito, senza configurazioni aggiuntive
- Controllo totale sui dati inseriti
- Ideale per poche pratiche o per testare il sistema

**Svantaggi:**
- Richiede tempo per copiare i dati manualmente
- Rischio di errori di trascrizione

---

## 4. Flusso Operativo PRE-PDND (Livello 1: Smart Import)

Questo è il flusso che potrai usare **appena completiamo l'UI di upload**, senza aspettare l'integrazione PDND.

### 4.1 Diagramma di Flusso

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CITTADINO   │────▶│    SUAP      │────▶│   MIOHUB     │────▶│    SUAP      │
│  /IMPRESA    │     │  COMUNALE    │     │  (TU)        │     │  COMUNALE    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │                    │
      │ 1. Presenta        │                    │                    │
      │    SCIA            │                    │                    │
      │───────────────────▶│                    │                    │
      │                    │ 2. Inoltra         │                    │
      │                    │    pratica         │                    │
      │                    │    (PEC/Email)     │                    │
      │                    │───────────────────▶│                    │
      │                    │                    │ 3. Importa         │
      │                    │                    │    (Upload ZIP)    │
      │                    │                    │                    │
      │                    │                    │ 4. Istruttoria     │
      │                    │                    │    (Verifiche)     │
      │                    │                    │                    │
      │                    │                    │ 5. Genera Esito    │
      │                    │                    │    (PDF)           │
      │                    │                    │───────────────────▶│
      │                    │                    │ 6. Invia Esito     │
      │                    │                    │    (PEC/Email)     │
      │                    │◀───────────────────│                    │
      │                    │ 7. Riceve e        │                    │
      │                    │    protocolla      │                    │
      │◀───────────────────│ 8. Notifica        │                    │
      │                    │    cittadino       │                    │
```

### 4.2 Passaggi Operativi Dettagliati

| Step | Chi | Azione | Strumento |
|------|-----|--------|-----------|
| **1** | Cittadino/Impresa | Presenta SCIA tramite portale SUAP | Impresa in un Giorno |
| **2** | SUAP Comunale | Riceve pratica e la inoltra a te | PEC / Email |
| **3** | **TU (Operatore MioHub)** | Scarichi il file ZIP/XML dalla PEC | Client Email |
| **4** | **TU (Operatore MioHub)** | Carichi il file in MioHub (Drag & Drop) | Dashboard SUAP → Upload |
| **5** | MioHub (Automatico) | Importa dati, crea pratica, estrae allegati | API `/import` |
| **6** | **TU (Operatore MioHub)** | Verifichi i dati, esegui controlli | Dettaglio Pratica |
| **7** | **TU (Operatore MioHub)** | Registri le verifiche (DURC, Pagamenti, etc.) | Sezione Checks |
| **8** | MioHub (Automatico) | Calcola score e suggerisce esito | Rules Engine |
| **9** | **TU (Operatore MioHub)** | Approvi/Rigetti la pratica | Azioni Workflow |
| **10** | MioHub (Automatico) | Genera PDF esito (Autorizzazione/Diniego) | Generatore PDF |
| **11** | **TU (Operatore MioHub)** | Scarichi il PDF e lo invii al SUAP | PEC / Email |
| **12** | SUAP Comunale | Riceve esito e lo protocolla | Protocollo Comunale |

### 4.3 Vantaggi di Questo Approccio

1. **Operativo Subito:** Non devi aspettare accreditamenti o integrazioni complesse.
2. **Audit Trail Completo:** Ogni azione è tracciata e difendibile.
3. **Document Vault:** Tutti gli allegati sono archiviati in modo sicuro.
4. **Preparazione al Futuro:** Quando arriverà PDND, il sistema sarà già pronto.

---

## 5. Stato Implementazione R1

### 5.1 Backend (mihub-backend-rest)

| Componente | Stato | File |
|------------|-------|------|
| Endpoint Import XML/ZIP | ✅ Implementato | `routes/suap.js` |
| Endpoint Refresh | ✅ Implementato | `routes/suap.js` |
| Endpoint Cambio Stato | ✅ Implementato | `routes/suap.js` |
| Endpoint Upload Documenti | ✅ Implementato | `routes/suap.js` |
| Endpoint Download Documenti | ✅ Implementato | `routes/suap.js` |
| Endpoint Audit Trail | ✅ Implementato | `routes/suap.js` |
| Endpoint Checks | ✅ Implementato | `routes/suap.js` |
| Endpoint Azioni | ✅ Implementato | `routes/suap.js` |
| Endpoint Regole | ✅ Implementato | `routes/suap.js` |
| Parser XML/ZIP | ✅ Implementato | `src/modules/suap/service.js` |
| Document Vault (S3) | ✅ Implementato | `src/modules/suap/service.js` |
| Audit Logger | ✅ Implementato | `src/modules/suap/service.js` |
| Rules Engine v1 | ✅ Implementato | `src/modules/suap/service.js` |

### 5.2 Frontend (dms-hub-app-new)

| Componente | Stato | Note |
|------------|-------|------|
| Dashboard SUAP | ✅ Funzionante | KPI, Attività Recente |
| Lista Pratiche | ✅ Funzionante | Filtri, Ricerca |
| Dettaglio Pratica | ✅ Funzionante | Timeline, Checks |
| Form SCIA | ✅ Funzionante | Campi aggiornati |
| Form Concessione | ✅ Funzionante | Campi aggiornati |
| **Area Upload Drag & Drop** | ⏳ Da Sviluppare | Priorità ALTA |
| **Gestione Documenti** | ⏳ Da Sviluppare | Upload/Download |
| **UI Cambio Stato** | ⏳ Da Sviluppare | Bottoni azione |
| **UI Registrazione Checks** | ⏳ Da Sviluppare | Form manuale |
| **Generazione PDF Esito** | ⏳ Da Sviluppare | Export |

### 5.3 Database (Neon)

| Tabella | Stato | Note |
|---------|-------|------|
| `suap_pratiche` | ✅ Esistente | Verificare vincolo UNIQUE |
| `suap_eventi` | ✅ Esistente | - |
| `suap_checks` | ✅ Esistente | - |
| `suap_decisioni` | ✅ Esistente | - |
| `suap_azioni` | ✅ Esistente | - |
| `suap_documenti` | ✅ Esistente | - |
| `suap_regole` | ✅ Esistente | - |

---

## 5. Prossimi Passi (Priorità)

### 5.1 Immediati (Questa Settimana)

| # | Attività | Priorità | Responsabile |
|---|----------|----------|--------------|
| 1 | Deploy backend R1 su Hetzner | ALTA | Dev |
| 2 | Installare dipendenze (`adm-zip`, `xml2js`, `@aws-sdk/client-s3`) | ALTA | Dev |
| 3 | Configurare variabili ambiente S3 su Hetzner | ALTA | DevOps |
| 4 | Testare endpoint `/import` con file reale | ALTA | QA |
| 5 | Aggiungere UI Upload Drag & Drop nel frontend | ALTA | Dev |

### 5.2 Breve Termine (1-2 Settimane)

| # | Attività | Priorità |
|---|----------|----------|
| 1 | UI gestione documenti (lista, upload, download) | ALTA |
| 2 | UI cambio stato pratica (bottoni azione) | ALTA |
| 3 | UI registrazione checks manuali | MEDIA |
| 4 | Generazione PDF esito | MEDIA |
| 5 | Aggiornare sezione Integrazioni con nuovi endpoint | MEDIA |

### 5.3 Medio Termine (1-2 Mesi)

| # | Attività | Priorità |
|---|----------|----------|
| 1 | Integrazione PDND (e-service) | ALTA |
| 2 | Verifica DURC automatica via INPS | ALTA |
| 3 | Rules Engine configurabile da UI | MEDIA |
| 4 | Export pacchetto istruttorio completo | MEDIA |

---

## 6. API Reference R1

### 6.1 Import Pratica (Idempotente)

```http
POST /api/suap/import
Content-Type: multipart/form-data

Headers:
  x-ente-id: UUID (obbligatorio)
  x-operatore: string (opzionale)
  x-correlation-id: UUID (opzionale, per tracciamento)

Body:
  file: File (XML o ZIP)
  source: string (opzionale, default: MANUAL_UPLOAD)

Response 201 (Created) / 200 (Updated):
{
  "success": true,
  "data": {
    "pratica": { id, cui, stato, ... },
    "created": true|false,
    "allegati_count": number,
    "correlation_id": "uuid"
  },
  "message": "Pratica importata con successo"
}
```

### 6.2 Upload Documento

```http
POST /api/suap/pratiche/:id/documenti
Content-Type: multipart/form-data

Headers:
  x-ente-id: UUID
  x-operatore: string

Body:
  file: File (PDF, P7M, XML, etc.)
  tipo_documento: string (opzionale)

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "documento.pdf",
    "file_hash": "sha256:...",
    "storage_path": "suap/ente/pratica/timestamp_file.pdf"
  }
}
```

### 6.3 Download Documento (Presigned URL)

```http
GET /api/suap/documenti/:docId/download

Headers:
  x-ente-id: UUID

Response 200:
{
  "success": true,
  "data": {
    "url": "https://s3.../presigned-url?...",
    "expires_in": 3600
  }
}
```

### 6.4 Cambio Stato Pratica

```http
POST /api/suap/pratiche/:id/stato

Headers:
  x-ente-id: UUID
  x-operatore: string

Body:
{
  "nuovo_stato": "APPROVED" | "REJECTED" | "INTEGRATION_REQ",
  "motivazione": "Documentazione completa e verificata"
}

Response 200:
{
  "success": true,
  "data": { pratica aggiornata }
}
```

### 6.5 Registra Check Manuale

```http
POST /api/suap/pratiche/:id/checks

Headers:
  x-ente-id: UUID
  x-operatore: string

Body:
{
  "check_code": "CHECK_DURC",
  "esito": true,
  "dettaglio": { "numero_protocollo": "123/2024" },
  "fonte": "MANUAL"
}

Response 201:
{
  "success": true,
  "data": { check creato }
}
```

---

## 7. Sicurezza e Governance

### 7.1 Multi-Ente Isolation

Ogni query è filtrata per `ente_id`. L'isolamento è garantito a livello di:
- Header `x-ente-id` (in sviluppo)
- JWT Token claim (in produzione)

### 7.2 Audit Trail Completo

Ogni operazione critica genera un evento in `suap_eventi`:

| Tipo Evento | Descrizione |
|-------------|-------------|
| `INGESTION` | Pratica ricevuta/importata |
| `IMPORT_CREATE` | Pratica creata da import |
| `IMPORT_UPDATE` | Pratica aggiornata da import |
| `STATUS_CHANGE` | Cambio stato workflow |
| `CHECK_ADDED` | Verifica registrata |
| `DOCUMENT_UPLOAD` | Documento caricato |
| `DOCUMENT_ACCESS` | Documento scaricato |
| `EVALUATION_COMPLETE` | Valutazione automatica completata |
| `ACTION_CREATED` | Azione workflow creata |
| `REFRESH` | Refresh dati eseguito |

### 7.3 Document Vault

- **Hash SHA-256** per ogni file (integrità)
- **Storage S3** con path strutturato
- **Presigned URL** per download sicuro (scadenza 1 ora)
- **Metadata** completi (mime_type, size, uploaded_by)

### 7.4 Idempotenza

L'import è idempotente grazie al vincolo `UNIQUE (ente_id, cui)`:
- Se CUI esiste → UPDATE
- Se CUI non esiste → INSERT

---

## 8. Regole di Sviluppo

### 8.1 Gestione Endpoint API

**REGOLA FONDAMENTALE:** Tutti i nuovi endpoint devono essere aggiunti al file `MIO-hub/api/index.json` su GitHub.

**NON** aggiungere endpoint hardcoded in `Integrazioni.tsx` o altri file frontend.

**Procedura per aggiungere nuovi endpoint:**

| Step | Azione | Comando |
|------|--------|--------|
| 1 | Clonare il repository MIO-hub | `gh repo clone Chcndr/MIO-hub` |
| 2 | Modificare `api/index.json` | Aggiungere il nuovo service/endpoint |
| 3 | Incrementare il campo `version` | Es. da 4 a 5 |
| 4 | Aggiornare `last_updated` | Data corrente (YYYY-MM-DD) |
| 5 | Commit e push | `git commit -m "feat(api): Add [nome] endpoints" && git push` |

**Struttura endpoint in index.json:**

```json
{
  "id": "suap.pratiche.list",
  "method": "GET",
  "path": "/api/suap/pratiche",
  "category": "SUAP & Ente Sussidiario",
  "description": "Lista pratiche con filtri",
  "risk_level": "low",
  "require_auth": true,
  "enabled": true,
  "test": {
    "enabled": true,
    "expected_status": 200
  }
}
```

**Repository:** https://github.com/Chcndr/MIO-hub/blob/master/api/index.json

**Totale Endpoint Attuale:** 150 (di cui 23 SUAP)

---

## 9. Sistema di Monitoraggio (Health Check)

### 9.1 Architettura Health Monitor

Il sistema di monitoraggio centralizzato verifica lo stato di tutti i servizi ogni 30 secondi e genera alert automatici.

**Endpoint Backend:**

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/health` | GET | Ping semplice (uptime) |
| `/api/health/full` | GET | Check completo tutti i servizi |
| `/api/health/history` | GET | Storico ultimi N check |

**Servizi Monitorati:**

| Servizio | Cosa Verifica | Soglia Latenza |
|----------|---------------|----------------|
| `database` | Connessione PostgreSQL (Neon) | 500ms |
| `storage` | Configurazione S3 | 1000ms |
| `backend` | Self-check server | 100ms |
| `guardian` | Endpoint Guardian API | 500ms |
| `mio_agent` | Endpoint MIO Agent | 1000ms |
| `pdnd` | Raggiungibilità PDND | 2000ms |
| `frontend` | Vercel deployment | 500ms |

**Stati Possibili:**

| Stato | Significato | Colore UI |
|-------|-------------|----------|
| `ok` | Servizio operativo, latenza normale | 🟢 Verde |
| `slow` | Servizio operativo, latenza elevata | 🟡 Giallo |
| `down` | Servizio non raggiungibile | 🔴 Rosso |

### 9.2 Alert Automatici

Quando un servizio cambia stato, viene generato un alert:

| Livello | Trigger | Azione |
|---------|---------|--------|
| `warning` | Servizio passa da `ok` a `slow` | Log + UI badge |
| `critical` | Servizio passa a `down` | Log + UI badge + (futuro: email) |

### 9.3 UI Health Dashboard

La dashboard è accessibile da **Sistema → Tab "Health"** e mostra:

1. **Stato Generale:** Operativo / Degradato / Critico
2. **Summary Cards:** Servizi Online, Lenti, Offline
3. **Griglia Servizi:** Stato dettagliato di ogni servizio
4. **Alert Attivi:** Lista problemi correnti
5. **Storico Check:** Timeline ultimi 20 check

**File Coinvolti:**

| File | Repository | Descrizione |
|------|------------|-------------|
| `routes/health-monitor.js` | mihub-backend-rest | Endpoint backend |
| `components/HealthDashboard.tsx` | dms-hub-app-new | UI frontend |
| `components/GuardianLogsSection.tsx` | dms-hub-app-new | Container con tab |

---

## 10. Regole per Nuovi Agenti AI

### 10.1 Principi Fondamentali

> **ATTENZIONE:** Queste regole sono OBBLIGATORIE per qualsiasi agente AI che lavora su questo progetto.

**Prima di scrivere QUALSIASI codice:**

1. **LEGGI QUESTO BLUEPRINT** - Contiene l'architettura, lo stato attuale e le convenzioni.
2. **VERIFICA L'ARCHITETTURA** - Il sistema usa DUE backend separati (vedi sezione 2).
3. **NON CREARE PROGETTI PARALLELI** - Lavora sui repository esistenti.
4. **CHIEDI SE HAI DUBBI** - Meglio una domanda in più che un disastro.

### 10.2 Architettura da Rispettare

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITETTURA MIOHUB                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌─────────────────────────────────┐  │
│  │    FRONTEND     │      │           BACKEND               │  │
│  │                 │      │                                 │  │
│  │  Vercel         │ ───► │  Hetzner                        │  │
│  │  dms-hub-app-new│      │  mihub-backend-rest             │  │
│  │                 │      │  orchestratore.mio-hub.me       │  │
│  └─────────────────┘      └─────────────────────────────────┘  │
│                                        │                        │
│                                        ▼                        │
│                           ┌─────────────────────────────────┐  │
│                           │         DATABASE                │  │
│                           │                                 │  │
│                           │  Neon (PostgreSQL)              │  │
│                           └─────────────────────────────────┘  │
│                                                                 │
│  Repository GitHub:                                            │
│  • Chcndr/dms-hub-app-new (Frontend)                          │
│  • Chcndr/mihub-backend-rest (Backend)                        │
│  • Chcndr/MIO-hub (Configurazioni, API index)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Checklist Prima di Iniziare

| # | Verifica | Comando/Azione |
|---|----------|----------------|
| 1 | Clona i repository necessari | `gh repo clone Chcndr/dms-hub-app-new` |
| 2 | Verifica che il backend sia attivo | `curl https://orchestratore.mio-hub.me/api/health` |
| 3 | Leggi il Blueprint | Questo file |
| 4 | Identifica dove va il codice | Frontend → `dms-hub-app-new`, Backend → `mihub-backend-rest` |
| 5 | Verifica endpoint esistenti | `MIO-hub/api/index.json` |

### 10.4 Cosa NON Fare (Errori Comuni)

| ❌ NON FARE | ✅ FARE INVECE |
|-------------|----------------|
| Creare un nuovo progetto Manus WebDev | Usare i repository esistenti |
| Hardcodare endpoint nel frontend | Aggiungerli a `MIO-hub/api/index.json` |
| Modificare lo schema DB senza documentare | Aggiornare questo Blueprint |
| Ignorare l'architettura a due backend | Rispettare la separazione Frontend/Backend |
| Duplicare codice già esistente | Verificare cosa c'è prima |
| Fare modifiche senza push su GitHub | Sempre commit + push |

### 10.5 Procedura per Nuove Funzionalità

1. **Analisi:** Leggi il Blueprint, verifica cosa esiste già.
2. **Pianificazione:** Identifica i file da modificare (Frontend e/o Backend).
3. **Sviluppo Backend:** Se serve, aggiungi endpoint in `mihub-backend-rest`.
4. **Sviluppo Frontend:** Modifica `dms-hub-app-new`.
5. **Aggiorna API Index:** Aggiungi nuovi endpoint a `MIO-hub/api/index.json`.
6. **Aggiorna Blueprint:** Documenta le modifiche qui.
7. **Push:** Commit e push su tutti i repository modificati.
8. **Test:** Verifica che tutto funzioni.

### 10.6 File Critici da NON Eliminare

| File | Repository | Motivo |
|------|------------|--------|
| `Blueprint_Evolutivo_SUAP.md` | dms-hub-app-new | Documentazione architettura |
| `api/index.json` | MIO-hub | Registro endpoint |
| `routes/suap.js` | mihub-backend-rest | API SUAP |
| `src/modules/suap/service.js` | mihub-backend-rest | Logica business SUAP |
| `components/GuardianLogsSection.tsx` | dms-hub-app-new | Sistema logs |
| `components/HealthDashboard.tsx` | dms-hub-app-new | Monitoraggio |
| `components/Integrazioni.tsx` | dms-hub-app-new | Catalogo API |

### 10.7 Comunicazione con l'Utente

- **Sempre informare** l'utente prima di creare nuovi file/progetti.
- **Sempre chiedere** se non sei sicuro dell'architettura.
- **Sempre aggiornare** il Blueprint dopo modifiche significative.
- **Mai assumere** che qualcosa non esista senza verificare.

---

## 11. Roadmap Futura (Post-R1)

### Release 2 (R2) - Integrazione PDND

| Funzionalità | Complessità | Dipendenze |
|--------------|-------------|------------|
| Connettore PDND (e-service) | ALTA | Accreditamento |
| Verifica DURC via INPS | MEDIA | API INPS |
| Verifica Camera Commercio | MEDIA | API CCIAA |
| Notifiche automatiche | BASSA | - |

### Release 3 (R3) - Ente Sussidiario Completo

| Funzionalità | Complessità | Dipendenze |
|--------------|-------------|------------|
| Ricezione pratiche via WS | ALTA | Accreditamento SSU |
| Invio esiti via WS | ALTA | Certificati |
| Firma digitale automatica | ALTA | HSM |
| Integrazione PEC | MEDIA | Provider PEC |

---

## 9. Riferimenti

- [Specifiche SUAP - Impresa in un Giorno](https://www.impresainungiorno.gov.it/)
- [Linee Guida AgID Interoperabilità](https://www.agid.gov.it/)
- [PDND - Piattaforma Digitale Nazionale Dati](https://pdnd.pagopa.it/)
- [Manuale Operativo SSET v1.0](./docs/SSET_ManualeOperativo_v.1_20250516.pdf)
- [ImportaPraticaSUAP - Manuale d'Uso](./docs/ImportaPraticaSUAP_manuale_d'uso_1.0.pdf)

---

*Documento generato da Manus AI. Ultimo aggiornamento: 29 Dicembre 2024*
