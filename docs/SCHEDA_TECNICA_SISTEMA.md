# Scheda Tecnica del Sistema DMS Hub

**Digital Market System Hub - Piattaforma per la Gestione Digitale dei Mercati su Area Pubblica**

| Campo | Valore |
|---|---|
| **Nome Sistema** | DMS Hub (Digital Market System Hub) |
| **Versione** | v3.80.0+ |
| **Data Documento** | 5 Marzo 2026 |
| **URL Produzione** | dms-hub-app-new.vercel.app |
| **Tipo** | Web Application SPA (Single Page Application) |
| **Licenza** | MIT |

---

## 1. Descrizione Generale

DMS Hub e' una piattaforma web unificata per la digitalizzazione e la gestione dei mercati ambulanti italiani. Il sistema serve contemporaneamente quattro tipologie di utenti dalla stessa applicazione web, differenziando l'esperienza tramite un sistema RBAC (Role-Based Access Control):

- **Pubblica Amministrazione (PA)** - Dashboard amministrativa con 14+ tab per gestione mercati, operatori, concessioni, wallet, controlli, report
- **Imprese/Operatori** - Dashboard impresa, wallet, registrazione presenze, anagrafica
- **Cittadini** - Mappa interattiva, segnalazioni civiche, percorsi, wallet
- **Pubblico** - Home page, mappa pubblica, vetrine, presentazione

Il sistema e' progettato per scalare da ~60 mercati attuali a **8.000 mercati** sull'intero territorio nazionale.

---

## 2. Stack Tecnologico

### 2.1 Frontend

| Tecnologia | Versione | Funzione |
|---|---|---|
| React | 19.2 | Framework UI |
| Vite | 7.1 | Build tool & dev server |
| TypeScript | 5.9.3 | Linguaggio (strict mode) |
| Wouter | 3.3.5 | Router SPA (client-side) |
| Tailwind CSS | 4.1 | Styling utility-first |
| shadcn/ui (Radix) | Latest | Design system (53 componenti UI) |
| Lucide React | 0.453 | Iconografia |
| React Query (TanStack) | 5.90 | Async state management & caching |
| React Hook Form | 7.64 | Gestione form |
| Zod | 4.1 | Validazione schema |
| Recharts | 2.15 | Grafici e visualizzazioni dati |
| Leaflet / React-Leaflet | 1.9 / 4.2 | Mappe interattive |
| MapLibre GL | 5.13 | Mappe vettoriali GIS |
| Framer Motion | 12.23 | Animazioni |
| Firebase | 12.9 | Autenticazione (Google, Apple, Email, SPID/CIE) |
| tldraw | 2.4 | Editor visuale (Bus Hub / Slot Editor) |
| date-fns | 4.1 | Manipolazione date |
| Sonner | 2.0 | Notifiche toast |

### 2.2 Backend (mihub-backend-rest)

Il backend e' un'applicazione REST separata deployata su Hetzner (`api.mio-hub.me`).
Il vecchio backend tRPC e' stato archiviato in `_cantina/server_archive/`.

| Tecnologia | Versione | Funzione |
|---|---|---|
| Node.js | 18+ | Runtime server |
| Express | 4.x | Web framework HTTP |
| Drizzle ORM | 0.44 | ORM per PostgreSQL |
| postgres-js | Latest | Driver PostgreSQL nativo |
| Zod | Latest | Validazione input API |
| JWT | Custom | Sessioni utente (cookie `session`) |
| Firebase Admin SDK | Latest | Verifica token autenticazione |
| PM2 | Latest | Process manager (max 512MB, auto-restart) |

**Repository backend:** `mihub-backend-rest` (separato da questo repo)
**Base URL:** `https://api.mio-hub.me`

### 2.3 Database

| Campo | Valore |
|---|---|
| DBMS | PostgreSQL 16 |
| Provider | Neon (serverless) |
| Regione | EU Central (Frankfurt) |
| Endpoint | ep-bold-silence-adftsojg.eu-central-1.aws.neon.tech |
| Tipo connessione | Serverless (auto-suspend dopo 5 min) |
| ORM | Drizzle 0.44 |
| Driver | postgres-js (NON pg/node-postgres) |
| Schema source of truth | `drizzle/schema.ts` |
| Cold start | 2-3 secondi |

### 2.4 Infrastruttura

| Componente | Provider | Dettagli |
|---|---|---|
| Frontend hosting | Vercel | Auto-deploy su push a `master`, CDN globale |
| Backend REST | Hetzner VPS | IP: 157.90.29.66, PM2, `api.mio-hub.me` |
| Database | Neon | PostgreSQL serverless, EU region |
| Autenticazione | Firebase | Progetto `dmshub-auth-2975e` |
| OAuth/SPID/CIE | ARPA Toscana | OpenID Connect callback |
| Orchestratore AI | Hetzner | orchestratore.mio-hub.me |

Il frontend su Vercel fa **proxy trasparente** di tutte le chiamate `/api/*` verso `api.mio-hub.me` tramite 33 regole di rewrite in `vercel.json`.

### 2.5 Tool di Sviluppo

| Tool | Versione | Funzione |
|---|---|---|
| pnpm | 10.4.1 | Package manager |
| Prettier | 3.6 | Code formatter |
| Vitest | 2.1 | Test framework |
| esbuild | (via Vite) | Bundling backend |
| PostCSS | 8.4 | Processing CSS |
| Autoprefixer | 10.4 | Browser prefix CSS |

---

## 3. Architettura del Sistema

### 3.1 Layer Architecture

```
+-------------------------------------------------------+
|  LAYER 1 - CLIENT (SPA)                               |
|  React 19 + Vite 7 + Wouter + Tailwind 4 + shadcn/ui  |
|  37 pagine | 170 componenti | 7 context | 11 hooks    |
+-------------------------------------------------------+
        |  HTTP/HTTPS (fetch + React Query)
        v
+-------------------------------------------------------+
|  LAYER 2 - BACKEND REST (api.mio-hub.me)              |
|  Express 4.x + 730+ endpoint REST                     |
|  33 gruppi API | Proxy via Vercel rewrite              |
|  Auth: Cookie JWT + Firebase | RBAC middleware         |
+-------------------------------------------------------+
        |  Drizzle ORM (postgres-js driver)
        v
+-------------------------------------------------------+
|  LAYER 3 - DATABASE                                   |
|  PostgreSQL 16 su Neon (serverless)                   |
|  48+ tabelle operative | ~370K righe totali           |
|  PITR backup automatico | EU Central (Frankfurt)      |
+-------------------------------------------------------+
```

### 3.2 Flusso di una Richiesta

```
Browser -> GET/POST /api/{gruppo}/{risorsa}
  -> Vercel rewrite -> api.mio-hub.me/api/{gruppo}/{risorsa}
  -> Express middleware (CORS, body parse, rate limiting)
  -> Auth middleware (cookie JWT / Firebase token / API key)
  -> RBAC middleware (verifica permessi per ruolo)
  -> Route handler (logica business)
  -> Drizzle ORM query -> PostgreSQL (Neon)
  -> JSON response
  -> Metrica salvata in api_metrics
  -> Log salvato per Guardian monitoring
```

### 3.3 Provider Stack Frontend (ordine nesting)

```
ErrorBoundary
  ThemeProvider (dark/light mode, default: dark)
    FirebaseAuthProvider (autenticazione)
      AnimationProvider (stato animazioni)
        MioProvider (chat AI)
          PermissionsProvider (RBAC)
            TransportProvider (dati mobilita')
              TooltipProvider (UI)
                Router (Wouter) + ChatWidget + Toaster + Footer
```

---

## 4. Metriche del Codebase

### 4.1 Dimensioni

| Metrica | Valore |
|---|---|
| Linee di codice totali | ~147.500 LOC |
| File TypeScript/TSX | 283 |
| Componenti React | 170 |
| Pagine | 37 |
| Custom Hooks | 11 |
| Context Providers | 7 |
| Componenti UI (shadcn) | 53 |
| Componenti business | 80+ |
| Componenti AI chat | 15 |
| Componenti SUAP | 11 |
| Componenti mercati | 4 |

### 4.2 Componenti piu' grandi (per dimensione file)

| Componente | Dimensione | Descrizione |
|---|---|---|
| DashboardPA.tsx | ~383 KB | Dashboard amministrativa (14+ tab) |
| GestioneMercati.tsx | ~202 KB | Gestione completa mercati |
| ControlliSanzioniPanel.tsx | ~163 KB | Controlli e sanzioni |
| ComuniPanel.tsx | ~119 KB | Gestione comuni |
| GamingRewardsPanel.tsx | ~118 KB | Sistema gamification |
| Integrazioni.tsx | ~112 KB | Pannello integrazioni |

### 4.3 Dipendenze

| Tipo | Conteggio |
|---|---|
| Dependencies (produzione) | 43 |
| DevDependencies | 12 |
| Radix UI primitives | 23 |
| Totale pacchetti | 55 |

---

## 5. Database - Schema

### 5.1 Riepilogo

| Dominio | Tabelle | Righe stimate |
|---|---|---|
| Autenticazione & Utenti | 10 | ~820 |
| Mercati & Operazioni | 15 | ~2.600 |
| Wallet & Pagamenti | 6 | ~1.130 |
| Hub Locations | 3 | ~100 |
| Multi-Agent System | 6 | ~430 |
| Monitoring & Analytics | 8 | ~334K |
| **Totale** | **48+** | **~370.000** |

### 5.2 Tabelle per Dominio

#### Autenticazione & Utenti (10 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `users` | ~50 | Utenti core (openId, email, ruolo) |
| `extended_users` | ~10 | Profilo esteso (wallet, rating) |
| `user_roles` | ~6 | Definizioni ruoli sistema |
| `permissions` | ~30 | Permessi granulari (modulo.azione) |
| `role_permissions` | ~50 | Matrice RBAC ruolo-permesso |
| `user_role_assignments` | ~10 | Assegnazione ruoli a utenti |
| `user_sessions` | ~20 | Sessioni attive |
| `login_attempts` | ~100 | Tentativi login |
| `access_logs` | ~500 | Audit accessi |
| `security_events` | ~50 | Eventi sicurezza |

#### Mercati & Operazioni (15 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `markets` | ~60 | Mercati (nome, indirizzo, coordinate) |
| `market_geometry` | ~12 | Geometria GeoJSON per mappa |
| `stalls` | ~900 | Posteggi (numero, area, stato, categoria) |
| `vendors` | ~150 | Operatori ambulanti |
| `concessions` | ~80 | Concessioni (giornaliera/mensile/annuale) |
| `vendor_documents` | ~200 | Documenti operatori |
| `vendor_presences` | ~1.000 | Check-in/check-out giornalieri |
| `bookings` | 0 | Prenotazioni posteggio (predisposta) |
| `inspections_detailed` | ~30 | Ispezioni polizia municipale |
| `violations` | ~20 | Sanzioni e verbali |
| `concession_payments` | ~50 | Pagamenti concessioni |
| `custom_markers` | ~30 | POI sulla mappa (ingressi, servizi) |
| `custom_areas` | ~10 | Zone mercato per categoria |
| `autorizzazioni` | ~40 | Licenze commerciali |
| `comuni` | ~50 | Anagrafica comuni |

#### Wallet & Pagamenti (6 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `operatore_wallet` | ~80 | Borsellini operatori (saldo, stato) |
| `wallet_transazioni` | ~500 | Transazioni wallet |
| `wallet_history` | ~500 | Storico transazioni |
| `tariffe_posteggio` | ~20 | Tariffe per tipo posteggio |
| `avvisi_pagopa` | ~30 | Avvisi di pagamento PagoPA |
| `wallet_balance_snapshots` | 0 | Snapshot saldi (predisposta) |

#### Hub Locations (3 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `hub_locations` | ~20 | Hub fisici collegati ai mercati |
| `hub_shops` | ~50 | Negozi dentro gli hub |
| `hub_services` | ~30 | Servizi hub (parcheggio, bike, ricarica) |

#### Multi-Agent System (6 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `agent_tasks` | ~100 | Task engine per agenti AI |
| `agent_projects` | ~10 | Progetti registrati |
| `agent_brain` | ~50 | Memoria agenti (decisioni, learning) |
| `agent_messages` | ~200 | Chat tra agenti |
| `agent_context` | ~50 | Contesto condiviso |
| `data_bag` | ~20 | Storage key-value con TTL |

#### Monitoring & Analytics (8 tabelle)

| Tabella | Righe | Descrizione |
|---|---|---|
| `mio_agent_logs` | ~326.000 | Log azioni agenti AI (88% dei dati DB) |
| `api_metrics` | ~5.000 | Metriche performance API |
| `system_logs` | ~2.000 | Log di sistema applicativo |
| `audit_logs` | ~500 | Audit trail compliance |
| `api_keys` | ~10 | Chiavi API generate |
| `webhooks` | ~5 | Configurazioni webhook |
| `webhook_logs` | ~50 | Log esecuzione webhook |
| `external_connections` | ~5 | Stato servizi esterni |

---

## 6. API - Endpoint

### 6.1 Riepilogo

| Tipo | Quantita' |
|---|---|
| **Endpoint REST totali** | **730+** |
| Gruppi API (rewrite Vercel) | 33 |
| Endpoint documentati nel frontend | 107 (realEndpoints.ts) |
| API Serverless Vercel | 8 |
| Livelli accesso | 3 (public, protected, admin) |

**Backend REST:** `api.mio-hub.me` (Hetzner VPS, repo `mihub-backend-rest`)
**Registro ufficiale:** `MIO-hub/api/index.json` su GitHub (single source of truth)
**Conteggio dinamico:** La tab Integrazioni della DashboardPA carica il conteggio in tempo reale dal backend via `/api/dashboard/integrations/endpoint-count`

> **Nota:** Il vecchio backend tRPC (~171 procedure) e' stato archiviato in `_cantina/server_archive/`. Il sistema attuale usa esclusivamente API REST.

### 6.2 Gruppi API REST (33 domini)

Tutte le chiamate `/api/*` dal frontend sono proxate a `api.mio-hub.me` tramite 33 regole di rewrite in `vercel.json`:

| Gruppo API | Path | Descrizione |
|---|---|---|
| auth | `/api/auth/*` | Autenticazione Firebase + OAuth SPID/CIE |
| markets | `/api/markets/*` | Gestione mercati |
| stalls | `/api/stalls/*` | Gestione posteggi |
| wallets | `/api/wallets/*` | Borsellino elettronico |
| wallet-history | `/api/wallet-history` | Storico transazioni wallet |
| canone-unico | `/api/canone-unico/*` | Canone unico mercatale |
| imprese | `/api/imprese/*` | Anagrafica imprese |
| sanctions | `/api/sanctions/*` | Sanzioni e verbali |
| verbali | `/api/verbali/*` | Verbali polizia municipale |
| notifiche | `/api/notifiche/*` | Sistema notifiche |
| civic-reports | `/api/civic-reports/*` | Segnalazioni civiche |
| citizens | `/api/citizens/*` | Anagrafica cittadini |
| gaming-rewards | `/api/gaming-rewards/*` | Gamification e premi |
| tcc | `/api/tcc/*` | Token Crediti Carbonio |
| tesseramenti | `/api/tesseramenti/*` | Tesseramenti operatori |
| associazioni | `/api/associazioni/*` | Gestione associazioni |
| bandi | `/api/bandi/*` | Bandi e graduatorie |
| formazione | `/api/formazione/*` | Formazione e corsi |
| pagamenti | `/api/pagamenti/*` | Pagamenti e PagoPA |
| collaboratori | `/api/collaboratori/*` | Gestione collaboratori |
| dashboard | `/api/dashboard/*` | Dati dashboard PA |
| integrations | `/api/integrations/*` | API keys, webhooks, monitoring |
| routing | `/api/routing/*` | Calcolo percorsi |
| hub | `/api/hub/*` | Gestione hub fisici |
| mihub | `/api/mihub/*` | Sistema multi-agente AI |
| guardian | `/api/guardian/*` | Monitoring e debug |
| mio | `/api/mio/*` | Agente AI MIO |
| abacus | `/api/abacus/*` | Query SQL e analisi dati |
| logs | `/api/logs/*` | Logging sistema |
| system | `/api/system/*` | Health check e sistema |
| github | `/api/github/*` | Integrazione GitHub |

### 6.3 Endpoint Documentati nel Frontend (107 in realEndpoints.ts)

| Categoria | Endpoint | Descrizione |
|---|---|---|
| marketsEndpoints | 7 | CRUD mercati |
| stallsEndpoints | 4 | CRUD posteggi |
| vendorsEndpoints | 5 | Gestione operatori |
| dmsHubEndpoints | 6 | Funzioni core DMS |
| concessionsEndpoints | 8 | Gestione concessioni |
| suapEndpoints | 15 | Pratiche SUAP (SCIA, autorizzazioni, spunta) |
| walletsEndpoints | 18 | Wallet, ricariche, PagoPA, tariffe |
| tariffsEndpoints | 2 | Tariffe posteggio |
| impreseEndpoints | 9 | Anagrafica imprese |
| qualificazioniEndpoints | 6 | Qualificazioni e documenti |
| gisEndpoints | 5 | Mappe GIS |
| mobilityEndpoints | 6 | Mobilita' e trasporti |
| abacusSqlEndpoints | 8 | Query SQL analisi dati |
| abacusGithubEndpoints | 6 | Integrazione GitHub |
| tccWalletImpresaEndpoints | 13 | Wallet impresa e TCC |
| firebaseAuthEndpoints | 9 | Autenticazione Firebase |

### 6.4 Client API nel Frontend

| Client | File | Endpoint principali |
|---|---|---|
| mihubAPI | `utils/mihubAPI.ts` | Logs, guardian, mihub tasks, imprese, deploy |
| securityClient | `api/securityClient.ts` | RBAC, ruoli, permessi, matrice, IP blacklist, utenti |
| orchestratorClient | `api/orchestratorClient.ts` | Comunicazione multi-agente |
| authClient | `api/authClient.ts` | Autenticazione Firebase |
| logsClient | `api/logsClient.ts` | Logging |
| suapClient | `api/suap.ts` | Pratiche SUAP |

### 6.5 API Serverless (Vercel Functions in `/api/`)

| Path | Descrizione |
|---|---|
| `/api/auth/firebase/sync` | Sincronizzazione utente Firebase |
| `/api/db/init-agent-messages` | Inizializzazione tabella messaggi agenti |
| `/api/logs/createLog` | Creazione log |
| `/api/logs/getLogs` | Lettura log |
| `/api/logs/initSchema` | Inizializzazione schema log |
| `/api/mihub/get-messages` | Lettura messaggi multi-agente |
| `/api/mihub/orchestrator-proxy` | Proxy verso orchestratore AI |
| `/api/mio/agent-logs` | Log agenti MIO |

---

## 7. Pagine e Rotte Frontend

### 7.1 Riepilogo Rotte

| Categoria | Rotte | Protezione |
|---|---|---|
| Pubbliche | 14 | Nessuna |
| Protette (auth) | 8 | Login richiesto |
| Admin only | 8 | Login + ruolo admin |
| **Totale** | **30** | |

### 7.2 Pagine Pubbliche (accessibili a tutti)

| Rotta | Componente | Descrizione |
|---|---|---|
| `/` | HomePage | Home con ricerca e accesso rapido |
| `/mappa` | MapPage | Mappa interattiva mercati |
| `/mappa-italia` | MappaItaliaPage | Mappa nazionale mercati |
| `/civic` | CivicPage | Segnalazioni civiche |
| `/route` | RoutePage | Percorso ottimale |
| `/vetrine` | VetrinePage | Vetrine negozi |
| `/vetrine/:id` | VetrinePage | Dettaglio vetrina |
| `/presentazione` | PresentazionePage | Presentazione pubblica |
| `/market-gis` | MarketGISPage | Mappa GIS mercati |
| `/hub-operatore` | HubOperatore | Dashboard operatore hub |
| `/hub-map-test` | HubMapTestPage | Test mappa hub |
| `/login` | Login | Pagina login |
| `/auth/callback` | AuthCallback | Callback OAuth SPID/CIE |
| `/privacy` | PrivacyPolicyPage | Privacy policy |
| `/accessibilita` | AccessibilityPage | Dichiarazione accessibilita' |
| `/profilo` | ProfiloPage | Profilo utente |

### 7.3 Pagine Protette (autenticazione richiesta)

| Rotta | Componente | Admin Only |
|---|---|---|
| `/dashboard-pa` | DashboardPA | Si |
| `/dashboard-impresa` | DashboardImpresa | No |
| `/app/impresa/wallet` | WalletImpresaPage | No |
| `/app/impresa/presenze` | PresenzePage | No |
| `/app/impresa/anagrafica` | AnagraficaPage | No |
| `/app/impresa/notifiche` | AppImpresaNotifiche | No |
| `/wallet` | WalletPage | No |
| `/wallet/paga` | WalletPaga | No |
| `/wallet/storico` | WalletStorico | No |
| `/mio` | MioPage | Si |
| `/guardian/endpoints` | GuardianEndpoints | Si |
| `/guardian/logs` | GuardianLogs | Si |
| `/guardian/debug` | GuardianDebug | Si |
| `/log-debug` | LogDebugPage | Si |
| `/settings/api-tokens` | APITokensPage | Si |
| `/council` | CouncilPage | Si |
| `/pm/nuovo-verbale` | NuovoVerbalePage | Si |

### 7.4 Pagine SUAP

| Rotta | Componente | Descrizione |
|---|---|---|
| `/suap` | SuapDashboard | Dashboard SUAP |
| `/suap/list` | SuapList | Lista pratiche |
| `/suap/detail/:id` | SuapDetail | Dettaglio pratica |

### 7.5 Tab della DashboardPA (protetti da RBAC)

| Tab ID | Nome | Nascosto in impersonazione |
|---|---|---|
| dashboard | Overview | No |
| mercati | Mercati | No |
| imprese | Imprese | No |
| commercio | Commercio | No |
| wallet | Wallet | No |
| hub | Hub | No |
| controlli | Controlli | No |
| comuni | Comuni | Si |
| security | Sicurezza (RBAC) | Si |
| sistema | Sistema | Si |
| ai | MIO Agent | Si |
| integrations | Integrazioni | Si |
| reports | Report | Si |
| workspace | Workspace | Si |

---

## 8. Sistema di Autenticazione e RBAC

### 8.1 Metodi di Autenticazione

| Metodo | Provider | Descrizione |
|---|---|---|
| Google | Firebase | Login con account Google |
| Apple | Firebase | Login con Apple ID |
| Email/Password | Firebase | Registrazione con email |
| SPID | ARPA Toscana OAuth | Identita' digitale italiana |
| CIE | ARPA Toscana OAuth | Carta d'Identita' Elettronica |
| CNS | ARPA Toscana OAuth | Carta Nazionale Servizi |

### 8.2 Flusso Autenticazione

```
1. Utente clicca Login -> Firebase popup (Google/Apple/Email)
                       -> oppure redirect SPID/CIE (ARPA Toscana)
2. Provider ritorna token
3. Frontend invia token al backend
4. Backend verifica con Firebase Admin SDK / OAuth
5. Backend crea/aggiorna utente nel DB
6. Backend setta cookie JWT (scadenza 1 anno)
7. Ogni richiesta porta il cookie
8. Backend REST estrae user dal cookie JWT
```

### 8.3 Sistema RBAC

**Struttura tabelle:**
```
users -> user_role_assignments -> user_roles -> role_permissions -> permissions
```

**Settori ruoli:** sistema, pa, mercato, impresa, esterno, pubblico

**Ruoli principali:**

| ID | Codice | Settore | Livello | Chi e' |
|---|---|---|---|---|
| 1 | super_admin | sistema | 0 | Admin globale |
| 2 | admin_pa | pa | 10 | Amministratore PA |
| - | operatore | pa | 20 | Operatore PA |
| - | viewer | pa | 30 | PA sola lettura |
| - | manager | mercato | 40 | Gestore mercato |
| - | owner | impresa | 50 | Titolare impresa |
| - | dipendente | impresa | 60 | Dipendente impresa |
| 13 | cittadino | pubblico | 99 | Cittadino |

**Scope permessi:** all, territory, market, own, delegated, none

**Formato permessi:**
- `tab.view.{tabId}` - visibilita' tab (es. `tab.view.security`)
- `quick.view.{quickId}` - accesso rapido sidebar
- `modulo.azione` - operazioni (es. `dmsHub.markets.read`)

### 8.4 Sistema Impersonazione per Comune

Il super admin puo' visualizzare l'applicazione come un PA di un comune specifico:

```
URL: /dashboard-pa?impersonate=true&comune_id=96&comune_nome=Grosseto
```

**Effetti:**
- PermissionsContext usa ruolo admin_pa (ID=2)
- Header X-Comune-Id aggiunto a tutte le fetch
- Tab nascosti: security, sistema, ai, integrations, comuni, reports, workspace
- Banner giallo "MODALITA' VISUALIZZAZIONE"
- Persistenza: sessionStorage (sopravvive alla navigazione, muore col tab)

---

## 9. Integrazioni Esterne

### 9.1 Integrazioni Attive

| Servizio | Protocollo | Stato | Descrizione |
|---|---|---|---|
| Firebase Auth | SDK | Attivo | Autenticazione utenti |
| SPID/CIE/CNS (ARPA Toscana) | OAuth/OIDC | Attivo | Identita' digitale |
| TPER Bologna | REST + SOAP | Attivo | Fermate bus, orari real-time |
| E-FIL PagoPA | SOAP | Attivo | Pagamenti PagoPA |
| Neon PostgreSQL | TCP/SSL | Attivo | Database serverless |
| Slot Editor v3 (dms-gemello-core) | REST/JSON | Parziale | Import piante mercato |
| GIS Grosseto (dms-gis-grosseto) | REST | Parziale | Mappa GIS standalone |
| Orchestratore AI (MIO-hub) | REST/SSE | Attivo | Multi-agent system |

### 9.2 Integrazioni Pianificate

| Servizio | Piattaforma | Priorita' | Descrizione |
|---|---|---|---|
| SUAP/SSET (InfoCamere) | SSET API | Alta | Pratiche SCIA, subingressi, allegati |
| Domicilio Digitale (INAD/INI-PEC) | PDND | Alta | PEC ufficiale imprese |
| Anagrafica Imprese completa | PDND | Media | Visura InfoCamere, ATECO, cariche |
| DURC Online | PDND | Media | Regolarita' contributiva |
| Pagamenti Canone (Maggioli Tributi) | REST | Media | Posizioni tributarie, avvisi pagoPA |
| Casellario Giudiziale | PDND | Bassa | Requisiti morali operatori |

### 9.3 Ecosistema Repository (18 repository)

Il sistema DMS Hub fa parte di un ecosistema piu' ampio:

| Repository | Funzione |
|---|---|
| dms-hub-app-new | Applicazione principale (questo repo) |
| mihub-backend | Backend REST su Hetzner |
| MIO-hub | Sistema multi-agente AI |
| mio-runner | Runner agenti AI |
| dms-gemello-core | BUS HUB + Slot Editor v3 + PNG Tool |
| dms-gis-grosseto | Mappa GIS standalone Grosseto |
| dms-site | Sito pubblico DMS |
| + altri 11 repo | Servizi ausiliari |

---

## 10. Sistema Multi-Agente (MIHUB)

### 10.1 Architettura

Il sistema supporta agenti AI multipli che comunicano tramite un orchestratore centrale.

**Tabelle dedicate:** agent_tasks, agent_messages, agent_brain, agent_context, data_bag, system_events

### 10.2 Agenti Attivi

| Agente | Ruolo |
|---|---|
| MIO | Agente principale, interfaccia utente, chat |
| Manus | Backend/infrastruttura, deploy |
| Dev/GPTDev | Sviluppo codice |
| Abacus | Query SQL e analisi dati |
| Zapier | Automazioni e integrazioni |
| Gemini Architect | Architettura e design |

### 10.3 Comunicazione

```
Frontend -> orchestratore.mio-hub.me/api/mihub/orchestrator
{
  "targetAgent": "mio|dev|gptdev|manus|zapier|abacus|gemini_arch",
  "message": "...",
  "context": {}
}
Timeout: 60 secondi per risposta agente
```

---

## 11. Deploy e Operations

### 11.1 Pipeline di Deploy

```
GitHub Repository (master branch)
  |
  +-- Push -> Vercel (frontend auto-deploy, ~2 min)
  |           dms-hub-app-new.vercel.app
  |           Static files + CDN globale
  |
  +-- Webhook -> Hetzner VPS (backend PM2 restart, ~2 min)
                 mihub.157-90-29-66.nip.io
                 orchestratore.mio-hub.me
```

### 11.2 Monitoring Integrato (Guardian)

| Pagina | Funzione |
|---|---|
| `/guardian/endpoints` | Inventario completo API |
| `/guardian/logs` | Log real-time centralizzati |
| `/guardian/debug` | Proxy test endpoint |

**Metriche tracciate automaticamente:**
- Tutti gli endpoint chiamati
- Response time per endpoint
- Status code (successi/errori)
- Errori con stack trace

### 11.3 Comandi Operativi

```bash
# Sviluppo
pnpm dev          # Avvia dev server (Vite + hot reload)
pnpm build        # Build produzione (frontend Vite + backend esbuild)
pnpm check        # TypeScript type check (tsc --noEmit)
pnpm test         # Test (vitest)
pnpm format       # Prettier

# Database
pnpm db:push      # Genera e applica migrazioni Drizzle

# Documentazione
pnpm docs:update  # Sincronizza docs API + blueprint
```

### 11.4 Variabili d'Ambiente

**Backend (8 variabili):**
DATABASE_URL, JWT_SECRET, VITE_APP_ID, OAUTH_SERVER_URL, OWNER_OPEN_ID, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY, EFIL_USERNAME, EFIL_PASSWORD

**Frontend (5 variabili VITE_*):**
VITE_TRPC_URL, VITE_API_URL, VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID

---

## 12. Scalabilita'

### 12.1 Stato Attuale

| Metrica | Valore |
|---|---|
| Mercati | ~60 |
| Posteggi | ~900 |
| Operatori | ~150 |
| Concessioni | ~80 |
| Presenze/giorno | ~100 |
| Utenti | ~50 |
| Righe totali DB | ~370.000 (88% log) |

### 12.2 Target di Scaling (8.000 mercati)

| Metrica | Proiezione |
|---|---|
| Mercati | 8.000 |
| Posteggi | 120.000 |
| Operatori | 40.000 |
| Concessioni | 100.000 |
| Presenze/giorno | 80.000 |
| Presenze/anno | ~24 milioni |
| Utenti totali | ~50.000 |

### 12.3 Piano di Scaling in 4 Fasi

| Fase | Range Mercati | Costo/mese | Interventi principali |
|---|---|---|---|
| 1 | 0-500 | 0 EUR | Indici DB, paginazione, retention log, query N+1 |
| 2 | 500-2.000 | ~50 EUR | Neon Pro, RLS, caching React Query, schema territory |
| 3 | 2.000-5.000 | ~200 EUR | Read replicas, batch processing, partitioning, CDN S3 |
| 4 | 5.000-8.000 | ~500 EUR | Docker + horizontal scaling, sharding regionale, Redis, WebSocket |

### 12.4 Metriche Target

| Metrica | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---|---|---|---|---|
| Latenza media | <200ms | <200ms | <150ms | <100ms |
| Uptime | 99% | 99.5% | 99.9% | 99.9% |
| Cold start | 3s | 0s | 0s | 0s |

---

## 13. Sicurezza

### 13.1 Misure Implementate

| Misura | Dettaglio |
|---|---|
| Autenticazione | Firebase + OAuth SPID/CIE (multi-provider) |
| Sessioni | Cookie JWT httpOnly, scadenza 1 anno |
| RBAC | 4 tabelle, 6 settori, scope granulari |
| Audit | Tabelle access_logs, audit_logs, security_events |
| Login monitoring | Tabella login_attempts con tracking tentativi falliti |
| IP Blacklist | Blocco IP dalla tab Sicurezza |
| Input validation | Zod su tutti gli input API REST |
| CORS | Configurato per dominio produzione |
| Body limit | 50MB max (per upload file) |

### 13.2 Gestione Sicurezza (Tab SecurityTab)

- Matrice RBAC completa (ruoli <-> permessi)
- Blocco/sblocco account utenti
- Registro eventi sicurezza
- Monitoraggio tentativi login falliti
- Gestione IP Blacklist
- Permessi tab per ruolo
- Permessi quick access per ruolo

---

## 14. Accessibilita' e Compliance

| Requisito | Stato |
|---|---|
| Dark mode default | Attivo (tema teal #14b8a6) |
| Skip to content | Implementato (SkipToContent.tsx) |
| ARIA roles | Implementati (role="main", aria-live, etc.) |
| Cookie consent banner | Attivo (CookieConsentBanner.tsx) |
| Privacy policy | Pagina dedicata (/privacy) |
| Dichiarazione accessibilita' | Pagina dedicata (/accessibilita) |
| Lazy loading pagine | Tutte le pagine non-critiche |
| Error boundary | Globale (ErrorBoundary.tsx) |
| Zoom font | Supportato (ZoomFontUpdater.tsx) |

---

## 15. Documentazione di Riferimento

| Documento | Percorso | Contenuto |
|---|---|---|
| Guida Operativa | CLAUDE.md | Regole e convenzioni per agenti AI |
| Architettura | docs/ARCHITECTURE.md | Architettura sistema dettagliata |
| Database | docs/DATABASE.md | Schema DB, convenzioni, regole |
| API | docs/API.md | Registro endpoint e convenzioni |
| Operations | docs/OPERATIONS.md | Deploy, monitoring, troubleshooting |
| Scaling | docs/SCALING.md | Strategia di scaling a 8.000 mercati |
| Blueprint | docs/BLUEPRINT_SISTEMA_DMS_HUB_17_DIC_2025.md | Audit e piano implementazione |
| Integrazioni | docs/INTEGRATION_SUMMARY.md | Riepilogo integrazioni PDND/SUAP |
| Security Audit | docs/SECURITY_AUDIT_REPORT.md | Report audit sicurezza |
| Report Interattivo | client/public/report/index.html | Presentazione audit interattiva |

---

*Documento generato il 5 Marzo 2026 - DMS Hub v3.80.0+*
