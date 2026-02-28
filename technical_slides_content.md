# Technical Slides for Dashboard Modules

---

# 1. Gestione Mercati (Markets Module)

- **Core Function**: Gestione completa del ciclo di vita dei mercati, dalle anagrafiche alle assegnazioni giornaliere.
- **Key Components**: `GestioneMercati.tsx`, `MarketMapComponent.tsx`, `MarketCompaniesTab.tsx`.
- **Data Flow**: `dmsHubRouter.markets` (CRUD) → `dmsHubRouter.bookings` (Spunta) → `dmsHubRouter.presences` (Check-in).
- **Database Tables**: `markets`, `stalls`, `bookings`, `vendor_presences`, `concessions`.
- **Insight**: Il cuore operativo del sistema, dove la logica di business incontra l'operatività sul campo.

---

# 2. GIS & Mappe (Geospatial Module)

- **Core Function**: Visualizzazione e gestione geospaziale di posteggi, aree mercatali e vincoli.
- **Key Components**: `GISMap.tsx`, `MarketMapComponent.tsx`, `BusHubEditor.tsx`.
- **Data Flow**: GeoJSON rendering via Leaflet/Mapbox → `dmsHubRouter.markets.getGeoJSON` → Real-time status overlay.
- **Database Tables**: `market_geometry`, `stalls` (lat/lng), `hub_locations`.
- **Insight**: Trasforma dati tabellari in intelligence visiva per pianificazione e controllo.

---

# 3. Wallet & Finanza (Financial Module)

- **Core Function**: Gestione borsellino elettronico operatori, pagamenti PagoPA e riconciliazione.
- **Key Components**: `WalletPanel.tsx`, `TransactionsList.tsx`, `RechargeModal.tsx`.
- **Data Flow**: `walletRouter.getBalance` → `walletRouter.createTransaction` → `integrationsRouter.pagoPA`.
- **Database Tables**: `operatore_wallet`, `wallet_transazioni`, `avvisi_pagopa`, `tariffe_posteggio`.
- **Insight**: Sistema finanziario chiuso e sicuro che automatizza la riscossione del canone unico.

---

# 4. MIO Agent & Orchestration (AI Module)

- **Core Function**: Interfaccia di comando per agenti autonomi (MIO, Guardian, Manus) e task automation.
- **Key Components**: `MIOAgent.tsx`, `MultiAgentChatView.tsx`, `AgentLogStream.tsx`.
- **Data Flow**: Frontend Chat → `orchestratorClient` → `agent_tasks` (DB Queue) → AI Processing.
- **Database Tables**: `agent_tasks`, `agent_brain`, `system_events`, `guardian_logs`.
- **Insight**: Il cervello del sistema che coordina operazioni complesse e monitora la sicurezza.

---

# 5. Integrazioni Esterne (Connectivity Module)

- **Core Function**: Ponte verso sistemi terzi per mobilità, meteo e interoperabilità PA.
- **Key Components**: `Integrazioni.tsx`, `GuardianEndpoints.tsx`, `ComuniPanel.tsx`.
- **Data Flow**: `integrationsRouter.tper` (Mobilità) ↔ `integrationsRouter.guardian` (Sicurezza) ↔ External APIs.
- **Database Tables**: `sync_jobs`, `webhooks`, `external_connections`, `api_keys`.
- **Insight**: Garantisce che DMS Hub non sia un silos, ma un nodo connesso della Smart City.
