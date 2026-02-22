# PUNTO STABILE DEL SISTEMA — v8.10.3

> **Data:** 21 Febbraio 2026
> **Tag Git:** `v8.10.3-stable`
> **Stato:** PRODUZIONE VERIFICATA
> **Creato da:** Manus AI

Questo documento certifica lo stato completo e verificato del sistema DMS HUB al momento della creazione del punto stabile. Tutti i componenti sono allineati tra sandbox locale, GitHub e deploy live. Non esistono branch divergenti, file non committati o conflitti irrisolti.

---

## 1. Identificazione dei Commit

| Componente | Repository | Commit | Data |
|------------|-----------|--------|------|
| **Frontend** | `Chcndr/dms-hub-app-new` | `e69059a` | 21 Feb 2026 10:06 |
| **Backend** | `Chcndr/mihub-backend-rest` | `187816e` | 21 Feb 2026 10:07 |

Per ripristinare questo punto stabile in qualsiasi momento:

```bash
# Frontend
cd dms-hub-app-new
git fetch origin
git checkout v8.10.3-stable

# Backend
cd mihub-backend-rest
git fetch origin
git checkout v8.10.3-stable
```

---

## 2. Stato Allineamento

| Livello | Frontend | Backend |
|---------|----------|---------|
| Sandbox locale | `e69059a` | `187816e` |
| GitHub origin/master | `e69059a` | `187816e` |
| Deploy live | Vercel HTTP 200 | Hetzner "online" |
| Dirty files | 0 | 0 |
| Branch Claude residui | 0 | 0 |
| Branch divergenti | 0 | 0 |

---

## 3. Dimensioni del Sistema

### Frontend (dms-hub-app-new)

| Metrica | Valore |
|---------|--------|
| Commit totali | 2.096 |
| File totali | 570 |
| File TSX (componenti React) | 206 |
| File TS (logica/tipi) | 108 |
| Componenti (`components/`) | 146 |
| Pagine (`pages/`) | 37 |
| Context (`contexts/`) | 7 |
| API client (`api/`) | 5 |
| Tag Git totali | 65 |
| Dipendenze | 60 |
| DevDipendenze | 19 |

### Backend (mihub-backend-rest)

| Metrica | Valore |
|---------|--------|
| Commit totali | 912 |
| File totali | 408 |
| File JS | 217 |
| Route files | 82 |
| Tag Git totali | 36 |
| Dipendenze | 19 |

---

## 4. Stack Tecnologico

### Frontend

| Tecnologia | Versione |
|------------|----------|
| React | ^19.2.0 |
| React DOM | ^19.2.0 |
| TypeScript | 5.9.3 |
| Vite | ^7.1.7 |
| TailwindCSS | ^4.1.14 |
| Firebase | ^12.9.0 |
| TanStack React Query | ^5.90.2 |
| Leaflet | ^1.9.4 |
| Lucide React | ^0.453.0 |
| Deploy | Vercel (auto-deploy da GitHub master) |

### Backend

| Tecnologia | Versione |
|------------|----------|
| Express | ^4.18.2 |
| PostgreSQL (pg) | ^8.18.0 |
| CORS | ^2.8.5 |
| Multer | ^1.4.5-lts.1 |
| Database | Neon PostgreSQL |
| Deploy | Hetzner VPS (PM2 + GitHub Actions auto-deploy) |
| IP Server | 157.90.29.66 |

---

## 5. Infrastruttura e URL

| Servizio | URL |
|----------|-----|
| Frontend (Vercel) | `https://dms-hub-app-new.vercel.app` |
| Backend API (Hetzner) | `https://orchestratore.mio-hub.me` |
| API alternativa | `https://api.mio-hub.me` |
| Database | Neon PostgreSQL (152+ tabelle) |
| GitHub Frontend | `https://github.com/Chcndr/dms-hub-app-new` |
| GitHub Backend | `https://github.com/Chcndr/mihub-backend-rest` |

---

## 6. Route Backend (82 file)

Le route principali del backend organizzate per area funzionale:

**Autenticazione e Sicurezza:** `auth.js`, `security.js`, `admin.js`, `adminDeploy.js`, `adminMigrate.js`, `adminSecrets.js`, `apiSecrets.js`

**Mercati e Posteggi:** `markets.js`, `stalls.js`, `market-settings.js`, `presenze.js`, `domande-spunta.js`, `tariffs.js`, `canone-unico.js`

**Imprese e Qualificazioni:** `imprese.js`, `qualificazioni.js`, `stats-qualificazione.js`, `vendors.js`, `concessions.js`, `autorizzazioni.js`

**SUAP:** `suap.js`, `inspections.js`, `sanctions.js`, `verbali.js`, `verbali_invia_new.js`, `giustificazioni.js`, `watchlist.js`

**Cittadini e Gamification:** `citizens.js`, `civic-reports.js`, `gaming-rewards.js`, `tcc.js`, `tcc-v2.js`, `wallets.js`, `wallet-history.js`, `wallet-scadenze.js`

**Comunicazione:** `notifiche.js`, `chats.js`, `webhook.js`, `webhooks.js`

**GIS e Trasporti:** `gis.js`, `gtfs.js`, `routing.js`, `dimaMappe.js`

**Orchestratore e AI:** `orchestrator.js`, `orchestratorMock.js`, `mioAgent.js`, `gptdev.js`, `guardian.js`, `guardianSync.js`

**Sistema e Monitoring:** `health-monitor.js`, `monitoring-debug.js`, `monitoring-logs.js`, `system.js`, `system-logs.js`, `logs.js`, `internalTraces.js`, `stats.js`

**Integrazioni esterne:** `integrations.js`, `ipa.js`, `migratePDND.js`, `mercaweb.js`, `mercaweb-transformer.js`, `dms-legacy.js`, `dms-legacy-service.js`, `dms-legacy-transformer.js`

**Altro:** `comuni.js`, `regioni.js`, `documents.js`, `formazione.js`, `collaboratori.js`, `bandi.js`, `hub.js`, `mihub.js`, `dmsHub.js`, `workspace.js`, `public-search.js`, `panic.js`, `toolsManus.js`, `abacusGithub.js`, `abacusSql.js`, `agentLogsRouter.js`, `test-mercato.js`

---

## 7. Changelog dalla Sessione Odierna

### v8.10.0 — Storico Valutazioni SUAP

Il backend non cancella più i vecchi check durante la ri-valutazione delle pratiche SUAP. Ogni sessione di valutazione riceve un `evaluation_run_id` univoco (UUID), consentendo il raggruppamento cronologico nello storico. Il frontend mostra le valutazioni raggruppate con header "ULTIMA VALUTAZIONE" e "Valutazione #N" per le precedenti. Lo score nella lista pratiche si aggiorna immediatamente dopo la ri-valutazione tramite `setPratiche`.

### v8.10.1 — Notifiche SUAP Complete + Semaforo Stati

L'endpoint `notifiche-pm` del backend ora include anche le pratiche SCIA e i subingressi, precedentemente esclusi. Il conteggio del tab "Pratiche SUAP" usa `notificheSuap.length` (non più `domandeSpunta.length`). Rimosso il `slice(0,5)` che limitava la lista a 5 elementi e aumentato lo scroll a 600px. Aggiunti gli stati mancanti al semaforo: ATTIVA (verde), CESSATA (grigio), SOSPESA (arancione), SCADUTA (rosso), SUBMITTED (blu). Badge tipo pratica colorati: Subingresso arancione, SCIA verde, Concessione viola, Domanda Spunta blu.

### v8.10.2 — Fix Comune Presentazione SCIA

Rimosso l'hardcoding `'MODENA'` nel campo `comune_presentazione` del form SCIA (`SciaForm.tsx`). Il valore iniziale ora usa `comuneNome.toUpperCase()` dalla prop del comune impersonato. Impersonando Cervia il campo mostra correttamente "CERVIA".

### v8.10.3 — Merge Branch Claude + Punto Stabile

Mergiati tutti i branch Claude divergenti in master per entrambi i repo. Frontend: 12 commit integrati (fix impersonazione Grosseto, login Firebase, role visibility, coordinate vetrine, gaming rewards). Backend: 2 commit integrati (GitHub Actions deploy + system inventory). Risolti 5 conflitti totali (4 frontend + 1 backend). Cancellati tutti i branch Claude su origin. Creato tag `v8.10.3-stable` su entrambi i repo.

---

## 8. Come Ripristinare Questo Punto

In caso di problemi futuri, per tornare a questo punto stabile verificato:

```bash
# Frontend — ripristino completo
cd dms-hub-app-new
git fetch origin
git reset --hard v8.10.3-stable
git push origin master --force

# Backend — ripristino completo
cd mihub-backend-rest
git fetch origin
git reset --hard v8.10.3-stable
git push origin master --force
# Il GitHub Actions auto-deploy aggiornerà Hetzner automaticamente
```

Per verificare che il deploy sia allineato dopo il ripristino:

```bash
# Verifica frontend
curl -s -o /dev/null -w "HTTP %{http_code}" "https://dms-hub-app-new.vercel.app/"

# Verifica backend
curl -s "https://orchestratore.mio-hub.me/api/health"
```

---

**Questo documento è il riferimento ufficiale per il punto stabile v8.10.3 del sistema DMS HUB.**
