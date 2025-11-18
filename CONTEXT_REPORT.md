# DMS-HUB-APP-NEW: Context Report per Sviluppo Dashboard PA

**Data:** 17 Novembre 2025
**Autore:** Manus AI
**Versione:** 1.0

## 1. Introduzione

Questo documento fornisce un report di contesto completo per il progetto **dms-hub-app-new**, con l'obiettivo di supportare lo sviluppo futuro della **Dashboard PA** e l'integrazione del **MIO Agent**. Il report analizza la struttura del codice, le tecnologie utilizzate, le API esistenti, il sistema di autenticazione e lo stato attuale delle feature.

## 2. Architettura e Struttura del Progetto

Il progetto segue un'architettura monorepo, con una netta separazione tra frontend e backend.

| Directory | Descrizione |
| :--- | :--- |
| `/client` | Applicazione frontend basata su **Vite + React**. |
| `/server` | Applicazione backend basata su **Node.js + Express** con **tRPC**. |
| `/drizzle` | Schema e migrazioni del database gestiti con **Drizzle ORM**. |
| `/scripts` | Script di utility per il seeding del database e altre operazioni. |
| `/shared` | Codice e tipi condivisi tra client e server. |

### 2.1. Frontend (Client)

Il frontend è un'applicazione Single Page Application (SPA) costruita con le seguenti tecnologie:

- **Framework:** Vite + React
- **Linguaggio:** TypeScript (`.tsx`)
- **Routing:** `wouter`
- **UI Components:** `shadcn/ui`
- **State Management:** Gestione locale dello stato con `useState` e `useContext`. Non è presente una libreria di state management globale come Redux o Zustand.

#### File Chiave del Frontend

| Percorso File | Descrizione |
| :--- | :--- |
| `client/src/App.tsx` | Componente radice dell'applicazione che definisce il router principale. |
| `client/src/pages/DashboardPA.tsx` | Componente principale della Dashboard PA, contenente la logica dei 24 tab. |
| `client/src/components/DashboardLayout.tsx` | Layout principale della dashboard che include la sidebar e la gestione dell'autenticazione. |
| `client/src/components/MIOAgent.tsx` | Nuovo componente per il tab "MIO Agent", attualmente in fase di sviluppo. |
| `client/src/lib/trpc.ts` | Configurazione del client tRPC per la comunicazione con il backend. |
| `client/src/const.ts` | Costanti dell'applicazione, inclusa la generazione dell'URL di login OAuth. |

### 2.2. Backend (Server)

Il backend espone le API utilizzando tRPC.

- **Framework:** Node.js + Express
- **API:** tRPC
- **Database ORM:** Drizzle ORM
- **Database:** MySQL

#### File Chiave del Backend

| Percorso File | Descrizione |
| :--- | :--- |
| `server/index.ts` | Punto di ingresso del server Express. |
| `server/routers.ts` | Router principale di tRPC (`appRouter`) che aggrega tutti i sotto-router. |
| `server/integrationsRouter.ts` | Router per la gestione delle integrazioni, API keys e webhooks. |
| `server/db.ts` | Funzioni di accesso al database (es. `getOverviewStats`, `getUsers`, etc.). |
| `drizzle/schema.ts` | Definizione dello schema del database con tutte le tabelle e le relazioni. |

## 3. Autenticazione e Ruoli Utente

Il sistema di autenticazione si basa su un flusso **OAuth2** custom, gestito tramite il servizio Manus.

- **Flusso di Autenticazione:**
  1. L'utente clicca su "Sign In" (`client/src/components/DashboardLayout.tsx`).
  2. Viene reindirizzato a un URL di login generato da `getLoginUrl()` (`client/src/const.ts`).
  3. Dopo il login, l'utente viene reindirizzato all'endpoint `/api/oauth/callback` del backend.
  4. Il backend gestisce la sessione tramite cookie (`COOKIE_NAME`).
- **Hook di Autenticazione:** L'hook `useAuth` (`client/src/_core/hooks/useAuth.ts`) gestisce lo stato dell'utente lato client, verificando se è autenticato e recuperando i suoi dati tramite la query tRPC `auth.me`.
- **Ruoli Utente:** La tabella `users` nel database (`drizzle/schema.ts`) definisce una colonna `role` di tipo `mysqlEnum("role", ["user", "admin"])`, indicando la presenza di due ruoli: **user** e **admin**.

## 4. API e Integrazione Backend

La comunicazione tra frontend e backend avviene tramite **tRPC**. Il router principale `appRouter` in `server/routers.ts` definisce tutte le procedure disponibili.

### 4.1. Endpoint Esistenti

Il backend espone numerosi endpoint per popolare la Dashboard PA, tra cui:

- `analytics.overview`: Statistiche generali.
- `analytics.markets`: Dati sui mercati.
- `users.analytics`: Analisi sugli utenti.
- `logs.system`: Log di sistema.
- `integrations.apiKeys.list`: Lista delle chiavi API.
- `integrations.webhooks.list`: Lista dei webhook.

### 4.2. Integrazione MIO Agent

L'integrazione del MIO Agent è in fase iniziale. Il componente `MIOAgent.tsx` attualmente tenta di fare una chiamata a un endpoint fittizio `/api/github/logs`.

**Sviluppi necessari per l'integrazione:**

1.  **Creare un Endpoint API per i Log:** È necessario creare un nuovo router tRPC (es. `mioRouter`) o estendere `integrationsRouter` per esporre i log provenienti da GitHub o da altre fonti.
2.  **Comunicazione con Agenti MIO:** La comunicazione tra la dashboard e gli agenti MIO può avvenire tramite:
    *   **Webhook:** La dashboard può inviare comandi a un webhook di Zapier, che a sua volta triggera un'azione su GitHub (es. un workflow dispatch).
    *   **API GitHub:** La dashboard può interagire direttamente con l'API di GitHub per leggere file di log o triggerare workflow.
3.  **Formato Dati:** È necessario definire un formato JSON standard per i job, i comandi e i log scambiati tra la dashboard e gli agenti MIO.

## 5. Sistema di Logging

- **Logging di Sistema:** Esiste un endpoint `logs.system` che recupera i log dal database. La tabella corrispondente non è stata identificata nello schema, ma la funzione `getSystemLogs` in `server/db.ts` suggerisce la sua esistenza.
- **Logging MIO Agent:** Il componente `MIOAgent.tsx` è predisposto per visualizzare i log, ma l'infrastruttura di backend per raccoglierli e storicizzarli deve essere ancora implementata.

## 6. Stato Attuale e Sviluppi Futuri

### 6.1. Feature Implementate

- Aggiunta del 24° tab "MIO Agent" alla Dashboard PA.
- Creazione del componente `MIOAgent.tsx`.
- Integrazione base del componente nel layout della dashboard.
- Deploy su Vercel funzionante: [https://dms-hub-app-new.vercel.app/dashboard-pa](https://dms-hub-app-new.vercel.app/dashboard-pa)

### 6.2. Feature da Sviluppare

| Feature | Descrizione | Priorità |
| :--- | :--- | :--- |
| **Endpoint Log MIO** | Creare l'API per recuperare e visualizzare i log degli agenti MIO. | Alta |
| **Comunicazione Real-time** | Implementare un sistema di polling o WebSocket per aggiornare i log in tempo reale. | Media |
| **Invio Comandi a MIO** | Creare un form o una chat per inviare comandi (job) agli agenti MIO tramite webhook (Zapier) o API GitHub. | Alta |
| **Visualizzazione Task** | Mostrare lo stato dei task in esecuzione, i loro output e la cronologia. | Media |
| **Gestione Permessi** | Limitare l'accesso al tab MIO Agent solo agli utenti con ruolo "admin". | Bassa |

## 7. Conclusioni

Il progetto ha una base solida e ben strutturata. I prossimi passi si concentreranno sull'implementazione della logica di backend per il MIO Agent, sulla definizione dei flussi di comunicazione e sull'arricchimento funzionale del nuovo tab della dashboard.
