# INVENTARIO SISTEMA - FRONTEND (dms-hub-app-new)

> **Generato:** 14 Febbraio 2026
> **Sessione:** Claude Code (Frontend)
> **Scopo:** Inventario completo del frontend per allineamento cross-sessione

---

## ARCHITETTURA

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                      │
│  dms-hub-app-new → React 19 + Vite + Tailwind 4         │
│  URL: https://dms-hub-app-new.vercel.app                 │
│                                                           │
│  api/auth/firebase/sync.ts  (serverless)                 │
│  api/mihub/get-messages.ts  (serverless)                 │
│  api/logs/*.ts              (serverless)                 │
│                                                           │
│  Proxy via vercel.json:                                  │
│  /api/auth/*     → https://api.mio-hub.me (Hetzner)     │
│  /api/mihub/*    → https://api.mio-hub.me (Hetzner)     │
│  /api/guardian/* → https://api.mio-hub.me (Hetzner)     │
│  /api/mio/*      → https://api.mio-hub.me (Hetzner)     │
│  /api/abacus/*   → https://api.mio-hub.me (Hetzner)     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS proxy
┌────────────────────────▼────────────────────────────────┐
│                HETZNER (Backend)                          │
│  mihub-backend-rest → Node.js + Express                  │
│  IP: 157.90.29.66  │  PM2: mihub-backend                │
│  URL: https://api.mio-hub.me                             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                NEON (Database)                            │
│  PostgreSQL │ Host: ep-bold-silence-adftsojg-pooler...   │
│  DB: neondb │ User: neondb_owner                         │
└─────────────────────────────────────────────────────────┘
```

---

## STATISTICHE FRONTEND

| Categoria                           | Conteggio               |
| ----------------------------------- | ----------------------- |
| Pagine (client/src/pages/)          | 36                      |
| Componenti (client/src/components/) | 142 (di cui 55 UI base) |
| Contesti (client/src/contexts/)     | 7                       |
| Custom Hooks (client/src/hooks/)    | 11                      |
| Librerie/Utils (client/src/lib/)    | 8                       |
| API Serverless (api/)               | 12                      |
| Server locale (server/)             | 34                      |
| Route definite (App.tsx)            | 30+                     |
| Dipendenze npm                      | 80+                     |

---

## PAGINE PRINCIPALI (30+ route in App.tsx con wouter)

| Route                     | Componente          | Ruolo                             |
| ------------------------- | ------------------- | --------------------------------- |
| `/`                       | HomePage            | Home cittadino                    |
| `/hub-operatore`          | HubOperatore        | Dashboard operatore               |
| `/dashboard-pa`           | DashboardPA         | Dashboard PA (384KB - più grande) |
| `/dashboard-impresa`      | DashboardImpresa    | Dashboard impresa                 |
| `/login`                  | Login               | Login SPID/Firebase               |
| `/auth/callback`          | AuthCallback        | OAuth callback                    |
| `/mappa`                  | MapPage             | Mappa interattiva                 |
| `/mappa-italia`           | MappaItaliaPage     | Vista nazionale                   |
| `/market-gis`             | MarketGISPage       | GIS mercati                       |
| `/wallet`                 | WalletPage          | Wallet TCC/ECO                    |
| `/wallet/paga`            | WalletPaga          | Pagamenti                         |
| `/wallet/storico`         | WalletStorico       | Storico wallet                    |
| `/app/impresa/wallet`     | WalletImpresaPage   | Wallet impresa PagoPA             |
| `/app/impresa/anagrafica` | AnagraficaPage      | Anagrafica 6 tab                  |
| `/app/impresa/presenze`   | PresenzePage        | Presenze                          |
| `/app/impresa/notifiche`  | AppImpresaNotifiche | Notifiche impresa                 |
| `/civic`                  | CivicPage           | Segnalazioni civiche              |
| `/route`                  | RoutePage           | Percorsi/trasporti                |
| `/vetrine`                | VetrinePage         | Vetrine/showcase                  |
| `/suap`                   | SuapDashboard       | SUAP dashboard                    |
| `/suap/list`              | SuapList            | Lista pratiche                    |
| `/suap/detail/:id`        | SuapDetail          | Dettaglio pratica                 |
| `/pm/nuovo-verbale`       | NuovoVerbalePage    | Nuovo verbale PM                  |
| `/mio`                    | MioPage             | Agente AI MIO                     |
| `/council`                | CouncilPage         | Consiglio                         |
| `/presentazione`          | PresentazionePage   | Presentazione pubblica            |
| `/guardian/*`             | Guardian\*          | Debug/logs/endpoints              |
| `/settings/api-tokens`    | APITokensPage       | Token API                         |
| `/log-debug`              | LogDebugPage        | Debug logs                        |

---

## COMPONENTI CHIAVE

### Pannelli Dashboard PA (i "mega-componenti")

| Componente                 | Size  | Funzione                        |
| -------------------------- | ----- | ------------------------------- |
| GestioneMercati.tsx        | 202KB | Gestione completa mercati       |
| ControlliSanzioniPanel.tsx | 164KB | Controlli PM, sanzioni, verbali |
| ComuniPanel.tsx            | 120KB | Gestione comuni multi-tenant    |
| GamingRewardsPanel.tsx     | 119KB | TCC, heatmap, gaming, trend     |
| Integrazioni.tsx           | 112KB | Integrazioni esterne            |
| WalletPanel.tsx            | 80KB  | Wallet e transazioni            |
| GestioneHubPanel.tsx       | 68KB  | Gestione HUB                    |
| HubMarketMapComponent.tsx  | 66KB  | Mappa mercati                   |
| GestioneHubNegozi.tsx      | 58KB  | Negozi HUB                      |
| GestioneHubMapWrapper.tsx  | 51KB  | Wrapper mappa                   |
| SuapPanel.tsx              | ~40KB | Pratiche SUAP                   |

### Autenticazione

| File                    | Funzione                                       |
| ----------------------- | ---------------------------------------------- |
| FirebaseAuthContext.tsx | Context globale auth Firebase                  |
| LoginModal.tsx          | Modal login multi-ruolo (Cittadino/Impresa/PA) |
| firebase.ts             | Config Firebase SDK (Google/Apple/Email)       |
| PermissionsContext.tsx  | Permessi basati su ruolo                       |

### Mercati

| File                                | Funzione                  |
| ----------------------------------- | ------------------------- |
| markets/MarketCompaniesTab.tsx      | Lista imprese per mercato |
| markets/MarketAutorizzazioniTab.tsx | Autorizzazioni mercato    |
| markets/MarketSettingsTab.tsx       | Impostazioni mercato      |
| markets/ConcessionForm.tsx          | Form concessione          |

### SUAP (9 componenti)

| File                             | Funzione                 |
| -------------------------------- | ------------------------ |
| suap/ListaAutorizzazioniSuap.tsx | Lista autorizzazioni     |
| suap/ListaDomandeSpuntaSuap.tsx  | Lista domande spunta     |
| suap/SciaForm.tsx                | Form SCIA                |
| suap/ConcessioneForm.tsx         | Form concessione         |
| suap/AutorizzazioneForm.tsx      | Form autorizzazione      |
| suap/AutorizzazioneDetail.tsx    | Dettaglio autorizzazione |
| suap/DomandaSpuntaForm.tsx       | Form domanda spunta      |
| suap/DomandaSpuntaDetail.tsx     | Dettaglio domanda        |
| suap/NotificationManager.tsx     | Gestione notifiche       |

---

## CONTESTI REACT (Provider hierarchy)

```
App
├── ErrorBoundary
├── ThemeProvider (dark mode default)
├── FirebaseAuthProvider
├── AnimationProvider
├── MioProvider
├── PermissionsProvider
├── TransportProvider
├── TooltipProvider
├── ImpersonationBanner
├── Toaster (sonner)
├── Router (wouter Switch)
└── ChatWidget
```

| Context             | Scopo                         |
| ------------------- | ----------------------------- |
| FirebaseAuthContext | Stato auth, ruoli, sync       |
| ThemeContext        | Tema chiaro/scuro             |
| MioContext          | Stato agente AI MIO           |
| PermissionsContext  | RBAC per PA/impresa/cittadino |
| TransportContext    | Dati trasporto/mobilità       |
| CivicReportsContext | Segnalazioni civiche          |
| AnimationContext    | Stato animazioni              |

---

## VERCEL.JSON (Routing)

```
/api/auth/firebase/*  →  Vercel serverless (locale)
/api/mihub/get-messages → Vercel serverless (locale)
/api/auth/*           →  https://api.mio-hub.me (Hetzner)
/api/mihub/*          →  https://api.mio-hub.me (Hetzner)
/api/guardian/*        →  https://api.mio-hub.me (Hetzner)
/api/mio/*            →  https://api.mio-hub.me (Hetzner)
/api/abacus/*         →  https://api.mio-hub.me (Hetzner)
/*                    →  /index.html (SPA fallback)
```

---

## VERIFICA vs BLUEPRINT (MASTER_BLUEPRINT_MIOHUB.md v5.3.0)

### File presenti e allineati al blueprint

- WalletPage.tsx, AnagraficaPage.tsx, HomePage.tsx, HubOperatore.tsx, WalletImpresaPage.tsx
- GamingRewardsPanel.tsx, ControlliSanzioniPanel.tsx, LoginModal.tsx, WalletPanel.tsx
- FirebaseAuthContext.tsx, firebase.ts, api/auth/firebase/sync.ts
- Tutti i componenti markets/ e suap/
- vercel.json con routing proxy corretto

### Discrepanze trovate

| Problema                   | Dettaglio                                                                      |
| -------------------------- | ------------------------------------------------------------------------------ |
| MarketCompaniesTab path    | Blueprint dice `pages/`, realtà è `components/markets/`                        |
| ListaAutorizzazioni naming | Blueprint dice `ListaAutorizzazioni.tsx`, realtà `ListaAutorizzazioniSuap.tsx` |
| ListaDomandeSpunta naming  | Blueprint dice `ListaDomandeSpunta.tsx`, realtà `ListaDomandeSpuntaSuap.tsx`   |

### Componenti pianificati ma non implementati

- Achievements.tsx (sistema badge gaming)
- ScadenzeCanone.tsx (scadenze pagamenti)
- WalletBalanceChart.tsx (grafico saldo)
- StoricoWalletTab.tsx (funzionalità in WalletStorico.tsx)

### File NON nel blueprint (~60 componenti extra)

Il frontend ha avuto una crescita organica significativa con ~60 componenti e ~22 pagine non documentati nel blueprint. I principali:

- DashboardPA.tsx (384KB), DashboardImpresa.tsx, CivicPage.tsx
- APIDashboardV2.tsx, ConnessioniV2.tsx, ComponentShowcase.tsx
- AIChatBox.tsx, MultiAgentChatView.tsx, MioAgentPanel.tsx
- bus-hub/ (BusHubEditor, SlotEditorV3, PngTransparentTool)
- NuovoVerbalePage.tsx, PresenzePage.tsx, PresentazionePage.tsx
- E molti altri...

---

## DIPENDENZE PRINCIPALI

| Categoria  | Pacchetto               | Versione          |
| ---------- | ----------------------- | ----------------- |
| Framework  | react                   | ^19.2.0           |
| Build      | vite                    | ^7.1.7            |
| Router     | wouter                  | ^3.3.5            |
| State      | @tanstack/react-query   | ^5.90.2           |
| API        | @trpc/client            | ^11.6.0           |
| Auth       | firebase                | ^12.9.0           |
| UI         | @radix-ui/\*            | vari              |
| CSS        | tailwindcss             | ^4.1.14           |
| Mappe      | leaflet + react-leaflet | ^1.9.4 / ^4.2.1   |
| Grafici    | recharts                | ^2.15.2           |
| Form       | react-hook-form + zod   | ^7.64.0 / ^4.1.12 |
| DB (ORM)   | drizzle-orm             | ^0.44.5           |
| TypeScript | typescript              | 5.9.3             |

---

_Documento generato automaticamente dalla sessione Claude Code Frontend_
