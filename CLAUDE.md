# CLAUDE.md - Guida Operativa per Agenti AI

> Questo file e' il punto di ingresso obbligatorio per ogni agente (Claude, Manus, GPT, Gemini, etc.)
> che lavora su questo repository. Leggilo PRIMA di fare qualsiasi cosa.

## Cosa e' questo sistema

**DMS Hub** (Digital Market System Hub) e' una piattaforma per la gestione digitale dei mercati
ambulanti italiani. Gestisce mercati, posteggi, operatori, concessioni, pagamenti PagoPA,
mobilita' e monitoraggio. Il sistema e' progettato per scalare a **8.000 mercati**.

**E' un'unica app web** (`dms-hub-app-new.vercel.app`) che serve TUTTI i tipi di utente:

- **PA (Pubblica Amministrazione)** → `/dashboard-pa` con 14+ tab
- **Imprese/Operatori** → `/dashboard-impresa`, `/app/impresa/*`, `/hub-operatore`
- **Cittadini** → `/mappa`, `/civic`, `/wallet`, `/route`
- **Pubblico** → Home page, mappa pubblica, presentazione

La **stessa interfaccia** mostra funzionalita' diverse in base al **ruolo dell'utente**,
controllato dal sistema RBAC con `ProtectedTab` + `PermissionsContext`.
Il sistema di **impersonazione per comune** permette al super admin di vedere
l'app come un PA di uno specifico comune.

**Stack tecnologico:**

- Frontend: React 19 + Vite 7 + Wouter + Tailwind 4 + shadcn/ui (Vercel)
- Backend: Express 4 + 730+ endpoint REST (repo separato `mihub-backend-rest` su Hetzner)
- Database: PostgreSQL su Neon (serverless)
- Auth: Firebase + OAuth (SPID/CIE/CNS)
- AI: AVA (assistente AI) con Ollama qwen2.5:7b + SSE streaming
- Runtime frontend: Node.js 18+ / pnpm 10.4+

**Architettura a 2 repository:**

- **`dms-hub-app-new`** (questo repo) = Frontend React + proxy Vercel
- **`mihub-backend-rest`** (repo separato) = Backend Express REST su Hetzner (`api.mio-hub.me`)
- Il vecchio backend tRPC e' archiviato in `_cantina/server_archive/` — NON usare
- Il frontend chiama il backend REST via `client/src/lib/trpcHttp.ts` (adapter che traduce le vecchie chiamate tRPC in REST)

## Comandi essenziali

```bash
# Sviluppo
pnpm dev                    # Avvia dev server con hot reload (tsx watch)
pnpm build                  # Build frontend (Vite) + backend (esbuild)
pnpm start                  # Avvia in produzione

# Verifica
pnpm check                  # TypeScript type check (tsc --noEmit)
pnpm test                   # Esegui test (vitest)
pnpm format                 # Prettier

# Database
pnpm db:push                # Genera e applica migrazioni Drizzle

# Documentazione
pnpm docs:update            # Sincronizza docs API + blueprint
```

## Struttura del progetto

```
/
├── client/src/             # Frontend React (componenti, pagine, hooks, contexts)
│   ├── components/         # Componenti UI (GestioneMercati, WalletPanel, etc.)
│   ├── pages/              # Pagine (DashboardPA e' la principale)
│   ├── contexts/           # State management (Firebase Auth, Permissions, MIO)
│   ├── api/                # Client API (orchestratorClient, auth, logs)
│   ├── hooks/              # Custom hooks (useAuth, usePermissions, useImpersonation)
│   ├── lib/                # Utilities (trpcHttp.ts = adapter REST, firebase config)
│   └── config/             # Configurazione (api.ts = URL backend)
├── api/                    # Vercel serverless functions (auth, db, logs, mihub, mio)
├── src/                    # Componenti e pagine extra (assets, components, lib, pages)
├── drizzle/                # Schema DB (schema.ts = source of truth)
│   └── schema.ts           # Tutte le definizioni delle tabelle
├── shared/                 # Costanti e tipi condivisi
├── migrations/             # Migrazioni SQL manuali
├── scripts/                # Script di utility e manutenzione
├── docs/                   # Documentazione dettagliata per dominio
├── _cantina/               # Codice archiviato (NON usare)
│   └── server_archive/     # Vecchio backend tRPC (dismesso)
├── vercel.json             # Rewrites proxy: /api/* → api.mio-hub.me
└── MASTER_BLUEPRINT_MIOHUB.md  # Blueprint di sistema (v9.8.0)
```

**NOTA:** Il backend e' nel repo separato `mihub-backend-rest` su GitHub.
Questo repo contiene SOLO il frontend + proxy Vercel.

## REGOLE INVIOLABILI

### 1. Database

- **Schema source of truth**: `drizzle/schema.ts` - MAI creare tabelle direttamente via SQL
- **Neon serverless**: Il DB si spegne dopo 5 min di inattivita'. Gestisci i timeout
- **Naming convention**: Tabelle in `snake_case`, colonne in `camelCase` nel codice TypeScript
- **MAI droppare tabelle** in produzione senza backup e approvazione esplicita
- **MAI modificare colonne esistenti** che contengono dati - aggiungi nuove colonne
- **FK cascade**: Attenzione alle catene FK (stalls → concessions → autorizzazioni → wallets → etc.)

### 2. API

- **Backend REST separato**: Repo `mihub-backend-rest` su Hetzner (`api.mio-hub.me`)
- **730+ endpoint REST**: Tutti prefissati con `/api/` (es. `/api/markets`, `/api/wallets`, `/api/stalls`)
- **Proxy Vercel**: `vercel.json` contiene i rewrites `/api/*` → `api.mio-hub.me`
- **Adapter frontend**: `client/src/lib/trpcHttp.ts` traduce le vecchie chiamate tRPC in REST
- **Per nuovi endpoint**: Chiedere a Manus di aggiungerli nel backend REST, poi aggiungere il rewrite in `vercel.json`
- **MAI creare endpoint tRPC** — il backend tRPC e' dismesso e archiviato in `_cantina/`
- **Auth backend**: Session token via cookie JWT, middleware `requirePaymentAuth` su Hetzner

### 3. Frontend

- **Router**: Wouter (NON React Router, NON Next.js)
- **State**: React Context - NON Redux, NON Zustand
- **Chiamate API**: `trpcQuery()` / `trpcMutate()` da `client/src/lib/trpcHttp.ts` (sono fetch REST, non tRPC vero)
- **Config URL**: `client/src/config/api.ts` — tutte le URL base (`MIHUB_API_BASE_URL = api.mio-hub.me`)
- **UI components**: shadcn/ui (in `client/src/components/ui/`) - NON Material UI, NON Chakra
- **Styling**: Tailwind CSS 4 - NON CSS modules, NON styled-components
- **Icons**: Lucide React - NON altre librerie di icone
- **Theme**: Dark mode di default (colore primario: teal #14b8a6)
- **Rotte**: Definite in `client/src/App.tsx` con `<Switch>` di Wouter
- **Nuove pagine**: Aggiungi in `client/src/pages/` e registra la rotta in `App.tsx`

### 4. Autenticazione e RBAC

- **Firebase** e' il provider primario (progetto `dmshub-auth-2975e`)
- **OAuth/SPID** via callback gestito dal backend REST su Hetzner
- **Session**: Cookie JWT (`session`) con scadenza 1 anno
- **Context frontend**: `FirebaseAuthContext` per lo stato auth sul client

**Sistema RBAC (Role-Based Access Control):**

- 4 tabelle: `user_roles` → `role_permissions` → `permissions` + `user_role_assignments`
- **Settori ruoli**: sistema, pa, mercato, impresa, esterno, pubblico
- **Livelli**: 0 = super_admin, 99 = cittadino (nessun accesso admin)
- **Scope permessi**: all, territory, market, own, delegated, none
- **Tab security**: `ProtectedTab` wrappa ogni tab con `canViewTab(tabId)`
- **Quick access**: `ProtectedQuickAccess` controlla la sidebar
- Permessi formato: `tab.view.{tabId}`, `quick.view.{quickId}`, `modulo.azione` (es. `dmsHub.markets.read`)

**Sistema impersonazione per comune:**

- URL: `/dashboard-pa?impersonate=true&comune_id=96&comune_nome=Grosseto&user_email=...`
- Persiste in `sessionStorage['miohub_impersonation']`
- Hook: `useImpersonation()` in `client/src/hooks/useImpersonation.ts`
- Banner giallo visibile: `ImpersonationBanner.tsx`
- Tab nascosti durante impersonazione: security, sistema, ai, integrations, comuni
- **MAI modificare il sistema di impersonazione** senza test completi su tutti i ruoli

### 5. Codice

- **TypeScript strict** obbligatorio - mai `any` tranne che per i tipi esterni
- **ESM modules** (`"type": "module"` in package.json)
- **Path aliases**: `@/` = `client/src/`, `@shared/` = `shared/`
- **Formatter**: Prettier (esegui `pnpm format` prima di committare)
- **Import pattern**: Dynamic imports dove necessario
- **MAI duplicare logica** - se esiste gia' una funzione, usala
- **MAI creare file .md** di documentazione senza richiesta esplicita

### 6. Deploy

- **Frontend**: Vercel (auto-deploy su push a master)
- **Backend**: Hetzner VPS `157.90.29.66` con PM2
- **DB**: Neon PostgreSQL (serverless, regione EU)
- **MAI pushare direttamente su master** senza review
- **MAI modificare la configurazione PM2** senza backup
- **MAI toccare `.env` in produzione** senza documentare il cambio

## Infrastruttura

| Servizio     | URL                        | Dettagli                            |
| ------------ | -------------------------- | ----------------------------------- |
| Frontend     | dms-hub-app-new.vercel.app | Vercel auto-deploy                  |
| Backend REST | api.mio-hub.me             | Hetzner VPS + autodeploy (unico!)   |
| DB Neon      | ep-bold-silence-adftsojg   | PostgreSQL serverless               |
| Firebase     | dmshub-auth-2975e          | Auth provider                       |

**Backend dismessi (NON usare):**
- `orchestratore.mio-hub.me` — dismesso, riferimenti rimossi
- `mihub.157-90-29-66.nip.io` — dismesso, riferimenti rimossi
- `manusvm.computer` — morto, riferimenti rimossi

## Variabili d'ambiente richieste

### Frontend (VITE\_\*)

```
VITE_MIHUB_API_URL    # URL backend REST (default: https://api.mio-hub.me)
VITE_API_URL          # URL base API (alias, default: https://api.mio-hub.me)
VITE_FIREBASE_API_KEY # Firebase Web API Key
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
```

**Nota:** Le variabili backend (DATABASE_URL, JWT_SECRET, etc.) sono nel repo `mihub-backend-rest`, non qui.

## Flusso di una nuova feature

1. **Schema**: Aggiungi la tabella in `drizzle/schema.ts`
2. **Migrazione**: Esegui `pnpm db:push`
3. **Backend** (repo `mihub-backend-rest`): Chiedi a Manus di creare gli endpoint REST
4. **Proxy**: Aggiungi il rewrite in `vercel.json` se serve un nuovo path `/api/nuovorisorsa/*`
5. **Frontend**: Usa `trpcQuery("dmsHub.xxx")` o `trpcMutate("dmsHub.xxx")` da `trpcHttp.ts`
6. **Mapping** (se necessario): Aggiungi la procedura in `PROCEDURE_MAP` in `trpcHttp.ts`
7. **UI**: Usa componenti shadcn/ui + Tailwind
8. **Test**: Verifica con `pnpm check` (types) + `pnpm test`

## Flusso di un bug fix

1. **Identifica** il file e la riga del bug
2. **Leggi** il codice circostante per capire il contesto
3. **Fix** con la modifica minima necessaria
4. **Verifica** con `pnpm check`
5. **NON** aggiungere feature, refactoring o "miglioramenti" al fix

## Aree API backend REST (api.mio-hub.me)

| Area             | Path REST              | Responsabilita'                                       |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| Markets          | /api/markets/*         | Mercati, posteggi, concessioni, presenze              |
| Stalls           | /api/stalls/*          | Posteggi singoli                                      |
| GIS              | /api/gis/*             | Mappe, geometrie, slot editor                         |
| Wallets          | /api/wallets/*         | Borsellino elettronico, ricariche                     |
| Canone Unico     | /api/canone-unico/*    | Rate, more, semaforo                                  |
| Sanctions        | /api/sanctions/*       | Sanzioni e verbali                                    |
| Imprese          | /api/imprese/*         | Anagrafica imprese                                    |
| SUAP             | /api/suap/*            | Pratiche SCIA, autorizzazioni                         |
| Associazioni     | /api/associazioni/*    | Gestione associazioni di categoria                    |
| Tesseramenti     | /api/tesseramenti/*    | Tesseramenti associativi                              |
| Pagamenti        | /api/pagamenti/*       | Quote, servizi, corsi                                 |
| Hub              | /api/hub/*             | Hub locations                                         |
| Guardian         | /api/guardian/*        | Monitoring API, debug, logs                           |
| AI Chat (AVA)    | /api/ai/chat/*         | Assistente AI con SSE streaming                       |
| Integrations     | /api/integrations/*    | API keys, webhooks, connessioni                       |
| Dashboard        | /api/dashboard/*       | Statistiche aggregate                                 |
| Auth             | /api/auth/*            | Login/logout, sessione                                |
| TCC              | /api/tcc/*             | Crediti carbonio                                      |
| Civic            | /api/civic-reports/*   | Segnalazioni civiche                                  |
| Logs             | /api/logs/*            | System logs                                           |

## Pagine frontend e accesso per ruolo

Un'unica app web, stesse rotte — il contenuto visibile dipende dal ruolo utente.

### Pagine PA (Pubblica Amministrazione)

| Rotta             | Componente       | Descrizione                                           |
| ----------------- | ---------------- | ----------------------------------------------------- |
| /dashboard-pa     | DashboardPA      | Dashboard admin principale (14+ tab protetti da RBAC) |
| /guardian/\*      | Guardian\*       | Monitoring sistema (endpoints, logs, debug)           |
| /council          | CouncilPage      | Assistente AI legale                                  |
| /pm/nuovo-verbale | NuovoVerbalePage | Creazione verbali polizia municipale                  |

### Pagine Imprese/Operatori

| Rotta                   | Componente          | Descrizione                                           |
| ----------------------- | ------------------- | ----------------------------------------------------- |
| /dashboard-impresa      | DashboardImpresa    | Dashboard impresa (anagrafica, concessioni, pratiche) |
| /app/impresa/wallet     | WalletImpresaPage   | Wallet operatore                                      |
| /app/impresa/presenze   | PresenzePage        | Registrazione presenze                                |
| /app/impresa/anagrafica | AnagraficaPage      | Dati anagrafici impresa                               |
| /app/impresa/notifiche  | AppImpresaNotifiche | Notifiche impresa                                     |
| /hub-operatore          | HubOperatore        | Dashboard operatore hub                               |

### Pagine condivise (PA + Imprese)

| Rotta   | Componente    | Descrizione                  |
| ------- | ------------- | ---------------------------- |
| /suap   | SuapDashboard | Gestione autorizzazioni SUAP |
| /wallet | WalletPage    | Gestione pagamenti           |

### Pagine pubbliche (tutti)

| Rotta          | Componente        | Descrizione                       |
| -------------- | ----------------- | --------------------------------- |
| /              | HomePage          | Home con ricerca e accesso rapido |
| /mappa         | MapPage           | Mappa interattiva mercati         |
| /mappa-italia  | MappaItaliaPage   | Mappa nazionale mercati           |
| /civic         | CivicPage         | Segnalazioni civiche              |
| /route         | RoutePage         | Percorso ottimale                 |
| /vetrine       | VetrinePage       | Vetrine negozi                    |
| /presentazione | PresentazionePage | Presentazione pubblica            |

### Tab della DashboardPA (protetti da RBAC)

Ogni tab e' wrappato in `<ProtectedTab tabId="...">` e visibile solo
se il ruolo dell'utente ha il permesso `tab.view.{tabId}`.

| Tab ID       | Nome             | Nascosto in impersonazione? |
| ------------ | ---------------- | --------------------------- |
| dashboard    | Overview         | No                          |
| mercati      | Mercati          | No                          |
| imprese      | Imprese          | No                          |
| commercio    | Commercio        | No                          |
| wallet       | Wallet           | No                          |
| hub          | Hub              | No                          |
| controlli    | Controlli        | No                          |
| comuni       | Comuni           | Si                          |
| security     | Sicurezza (RBAC) | Si                          |
| sistema      | Sistema          | Si                          |
| ai           | MIO Agent        | Si                          |
| integrations | Integrazioni     | Si                          |
| reports      | Report           | Si                          |
| workspace    | Workspace        | Si                          |

## Documentazione di riferimento

| File                 | Contenuto                                |
| -------------------- | ---------------------------------------- |
| CLAUDE.md            | QUESTO FILE - guida operativa per agenti |
| docs/ARCHITECTURE.md | Architettura sistema dettagliata         |
| docs/DATABASE.md     | Schema DB, convenzioni, regole           |
| docs/API.md          | Registro endpoint e convenzioni          |
| docs/OPERATIONS.md   | Deploy, monitoring, troubleshooting      |
| docs/SCALING.md      | Strategia di scaling a 8.000 mercati     |

## Checklist pre-commit

- [ ] `pnpm check` passa senza errori
- [ ] Nessun `console.log` di debug rimasto (usa `console.warn` o `console.error` se necessario)
- [ ] Schema DB aggiornato se hai aggiunto tabelle/colonne
- [ ] Nessun segreto o credenziale nel codice
- [ ] Nuovi path API hanno il rewrite in `vercel.json`
- [ ] Le nuove pagine sono registrate in `App.tsx`

## Errori comuni da evitare

| Errore                                            | Soluzione                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| "Connection terminated due to connection timeout" | Neon cold start. Ritenta dopo 3 secondi                            |
| Tabella non trovata                               | Controlla `drizzle/schema.ts`, poi `pnpm db:push`                  |
| CORS error                                        | Le API devono passare per il proxy Vercel (`vercel.json` rewrites) |
| 404 su /api/xxx                                   | Manca il rewrite in `vercel.json` per quel path                    |
| `any` type error                                  | Importa il tipo corretto da `drizzle/schema.ts`                    |
| Import non trovato                                | Usa `@/` per frontend, import relativo per backend                 |
| Firebase auth fallisce                            | Verifica `VITE_FIREBASE_*` env vars nel `.env`                     |
| FK constraint violation                           | Attenzione alle catene FK — vedi blueprint v9.8.0 per l'ordine     |
