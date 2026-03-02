# 🔑 CREDENZIALI E BLUEPRINT MIO HUB (Aggiornato 02 Mar 2026)

**⚠️ VEDI ANCHE: `MASTER_CONTEXT_MIOHUB.md` PER DETTAGLI TECNICI AGGIORNATI ⚠️**

**DOCUMENTO DA ATTACCARE QUANDO MANUS SI DIMENTICA TUTTO**

---

## 💡 AGGIORNAMENTO 28 DICEMBRE 2025 (SESSIONE WALLET & TARIFFE)

### ✅ Nuove Funzionalità Implementate

1.  **Sistema Wallet PagoPA Unificato**
    - **Backend**: Nuovi endpoint `/api/wallets` e `/api/tariffs`.
    - **Database**: Tabelle `wallets`, `wallet_transactions`, `market_tariffs`.
    - **Frontend**: Integrazione dati reali in `WalletPanel.tsx` (Dashboard PagoPA).
    - **Logica**: Addebito automatico presenze basato su tariffa mercato (€/mq).

2.  **Gestione Tariffe**
    - Configurazione tariffe annuali per mercato.
    - UI integrata nella dashboard.

### ⚠️ Note Importanti per lo Sviluppo

- **Frontend Repo**: `dms-hub-app-new` (Branch `master`).
- **Frontend Path**: Il codice sorgente è in `client/src/`.
- **Backend Repo**: `mihub-backend-rest` (Branch `master`).

---

## 💡 AGGIORNAMENTO 27 DICEMBRE 2025 (SESSIONE SERALE)

### ✅ Bug Risolti e Nuove Funzionalità

1.  **Visualizzazione Concessioni e Autorizzazioni in Lista Imprese**
    - **Problema:** La lista imprese non mostrava i dettagli delle concessioni e autorizzazioni attive.
    - **Soluzione:**
      - Aggiornata API `/api/imprese` per includere aggregazioni JSON di concessioni e autorizzazioni.
      - Aggiunti badge visivi nella card impresa (es. "Modena: 12", "Autorizzato").

2.  **Fix Tabella Concessioni Vuota ("N/A")**
    - **Causa:** Disallineamento nomi campi tra backend (inglese) e frontend (italiano).
    - **Soluzione:** Implementata mappatura dati in `MarketCompaniesTab.tsx`.

3.  **Semaforo Qualifiche**
    - **Funzionalità:** Aggiunto indicatore visivo (Verde/Giallo/Rosso) nella card impresa che riassume lo stato delle qualifiche.
    - **Interazione:** Cliccando sul semaforo si apre la tab Qualificazioni filtrata per l'impresa.

4.  **Gestione Qualificazioni (CRUD)**
    - **Problema:** Impossibile creare nuove qualificazioni (funzionalità mancante/simulata).
    - **Soluzione:**
      - Creati nuovi endpoint backend: `GET/POST /api/imprese/:id/qualificazioni`.
      - Collegato frontend agli endpoint reali.
      - Ripristinato pulsante "Nuova Qualificazione" e modale di creazione.

### 🐞 Bug Ancora Aperti

1.  **Bug Creazione Concessioni:**
    - **Problema:** Quando si crea una concessione, il form invia il **numero** del posteggio invece dell'**ID**.
    - **File da correggere:** `client/src/components/markets/MarketCompaniesTab.tsx`.

2.  **Miglioramento Interazione Mappa/Lista:**
    - **Problema:** Marker mercato copre il posteggio selezionato.
    - **Soluzione:** Usare indicatore diverso (freccia) invece di spostare il marker M.

### 🚀 Prossimi Sviluppi

- **Vista "Gemello Digitale Italia"**: Implementare la vista nazionale.

---

## 🚀 FLUSSO DI LAVORO CORRETTO (AUTO-DEPLOY)

**D'ORA IN POI: SOLO MODIFICHE VIA GIT → PUSH → AUTO-DEPLOY**

❌ **NON fare più**:

- Modifiche dirette sul server via SCP
- Modifiche manuali in `/root/mihub-backend-rest/`

✅ **FARE sempre**:

1. Modificare in locale/repository
2. Commit e push su GitHub
3. Lasciare che l'auto-deploy aggiorni il server

---

## 🖥️ SERVER HETZNER

**IP**: `157.90.29.66`  
**User**: `root`  
**Hostname**: `ubuntu-4gb-nbg1-11`

---

## 🔐 CHIAVE SSH (FUNZIONANTE - GENERATA 14 DIC 2024)

**Percorso**: `/home/ubuntu/.ssh/manus_hetzner_key`

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

**Host**: `ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech`  
**Database**: `neondb`  
**User**: `neondb_owner`  
**Password**: `npg_lYG6JQ5Krtsi`  
**SSL Mode**: `require`

---

## 🔧 BACKEND PM2 (Hetzner)

**Percorso**: `/root/mihub-backend-rest`

### Comandi PM2 Utili

**Riavviare backend**:

```bash
ssh -i /home/ubuntu/.ssh/manus_hetzner_key root@157.90.29.66 'cd /root/mihub-backend-rest && pm2 restart mihub-backend --update-env'
```

**Vedere log PM2**:

```bash
ssh -i /home/ubuntu/.ssh/manus_hetzner_key root@157.90.29.66 'pm2 logs mihub-backend --lines 50'
```

---

## 🤖 AGENTI DEL SISTEMA

| Agente      | Stato         | Dettagli                                                                               |
| :---------- | :------------ | :------------------------------------------------------------------------------------- |
| **MIO**     | ✅ **OK**     | Orchestratore principale, delega task a Manus, Abacus, GPT Dev                         |
| **Manus**   | ✅ **OK**     | Navigazione web, esecuzione comandi, file system. Usa `taskId` fisso per chat unica.   |
| **Abacus**  | ✅ **OK**     | Query SQL, accesso database PostgreSQL/Neon.                                           |
| **GPT Dev** | ✅ **OK**     | Accesso repository GitHub, lettura file, operazioni Git (clone, commit, PR).           |
| **Zapier**  | ❌ **ERRORE** | Chiave API invalida (formato OpenAI invece di Zapier NLA) - **Da risolvere in futuro** |

---

## 🔑 SECRET E VARIABILI D'AMBIENTE

### GitHub

- `GITHUB_PAT`: Per GPT Dev e proxy GitHub
- `GITHUB_TOKEN`: Per integrazioni e Guardian sync
- `GITHUB_PAT_DMS`: Per admin secrets e sync da .env

### Manus

- `MANUS_API_KEY`: Chiave API per Manus
- `MANUS_TASK_ID`: `mio-hub-debug-session-001` (fisso in `llm.js`)

### Altri

- `ABACUS_API_KEY`: Chiave API per Abacus
- `ZAPIER_API_KEY`: Chiave API per Zapier (attualmente invalida)
- `NEON_POSTGRES_URL`: Stringa di connessione al database

---

_Documento aggiornato il 27 Dicembre 2025 - Manus AI_

---

## 💡 AGGIORNAMENTO 6 GENNAIO 2026 (SESSIONE SLOT EDITOR V3)

### ✅ Fix Applicati

1. **Pulsante X per cancellare singoli negozi**
   - **Problema:** Il pulsante ❌ nella lista negozi non funzionava (onclick inline non eseguito)
   - **Soluzione:** Cambiato da `onclick="removeShop()"` a `addEventListener('click')` con `data-shop-number`
   - **Commit:** `2dba6c3`

2. **API Salvataggio Database (HTTP 400)**
   - **Problema:** L'API `/api/hub/locations` restituiva errore 400 per campi mancanti
   - **Causa:** Il codice inviava `hub_name`, `center` invece di `name`, `address`, `city`, `lat`, `lng`
   - **Soluzione:** Aggiornato il payload per usare i campi corretti richiesti dall'API
   - **Commit:** `7fa0c13`

3. **Variabili globali JavaScript**
   - **Problema:** `shops`, `hubArea`, `hubCenter`, `hubCorner` erano variabili locali non accessibili
   - **Soluzione:** Cambiate in `window.shops`, `window.hubArea`, `window.hubCenter`, `window.hubCorner`

4. **Link BUS HUB nella Dashboard PA**
   - **Problema:** Il pulsante BUS HUB puntava a GitHub Pages (vecchio) invece di Hetzner (nuovo)
   - **Soluzione:** Aggiornato link a `https://api.mio-hub.me/tools/bus_hub.html`

5. **Redirect GitHub Pages → Hetzner**
   - I tool su `chcndr.github.io/dms-gemello-core/` ora fanno redirect automatico a Hetzner

### 🧪 Test Effettuati Slot Editor V3

| Funzione                 | Stato   | Note                                    |
| ------------------------ | ------- | --------------------------------------- |
| Crea Area HUB            | ✅ OK   | Disegno poligono funziona               |
| Modifica colore area     | ✅ OK   | Color picker funziona                   |
| Modifica trasparenza     | ✅ OK   | Slider fillOpacity funziona             |
| Modifica spessore bordo  | ✅ OK   | Slider weight funziona                  |
| Aggiungi negozi          | ✅ OK   | Marker e popup funzionano               |
| Cancella singolo negozio | ✅ OK   | Funziona via console, pulsante X fixato |
| Esporta GeoJSON          | ✅ OK   | Download file funziona                  |
| Salva nel Bus            | ✅ OK   | localStorage funziona                   |
| Salva nel Database       | ⏳ TEST | API fixata, da testare                  |
| Reset Pianta Completo    | ✅ OK   | Pulisce tutto correttamente             |

### 🛠️ TOOLS DI DIGITALIZZAZIONE MERCATI

#### URL Ufficiali (Hetzner - USARE QUESTI)

| Tool               | URL                                                      | Descrizione                                         |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------- |
| **BUS HUB**        | https://api.mio-hub.me/tools/bus_hub.html                | Centro di controllo workflow digitalizzazione       |
| **Slot Editor V3** | https://api.mio-hub.me/tools/slot_editor_v3_unified.html | Editor principale per piante mercati, posteggi, HUB |

#### URL Deprecati (GitHub Pages - NON USARE)

| Tool               | URL                                                                     | Stato                 |
| ------------------ | ----------------------------------------------------------------------- | --------------------- |
| ~~BUS HUB~~        | ~~chcndr.github.io/dms-gemello-core/tools/bus_hub.html~~                | ⚠️ Redirect a Hetzner |
| ~~Slot Editor V3~~ | ~~chcndr.github.io/dms-gemello-core/tools/slot_editor_v3_unified.html~~ | ⚠️ Redirect a Hetzner |

#### Workflow Digitalizzazione Mercato

1. **Dashboard PA** → Clicca "BUS HUB" → Apre `api.mio-hub.me/tools/bus_hub.html`
2. **BUS HUB** → Configura nome mercato, coordinate, città
3. **Slot Editor V3** → Georeferenzia pianta, crea posteggi, marker, aree, negozi HUB
4. **Esporta** → GeoJSON locale o salva nel Database

#### Storage Dati

- **localStorage keys:**
  - `dms_hub_data` - Dati HUB (centro, area, negozi)
  - `dms_slots_data` - Posteggi
  - `dms_markers_data` - Marker personalizzati
  - `dms_areas_data` - Aree personalizzate
  - `dms_plant_data` - Posizione pianta PNG

### 📝 Note Importanti

- **IP Server Hetzner:** `157.90.29.66` (NON `157.90.211.120`)
- **Repository allineati:** GitHub ↔ Hetzner ↔ Locale tutti su commit `7fa0c13`
- **PM2:** `mihub-backend` online e funzionante

---

_Documento aggiornato il 6 Gennaio 2026 - Manus AI_
