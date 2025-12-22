# 📘 DMS Hub System Blueprint

> **Auto-generated:** 22 dicembre 2024 alle ore 17:00  
> **Generator:** `scripts/generate_blueprint.cjs`  
> **Last Update:** Wallet/PagoPA UI + API Inventory + Imprese

---

## 🎯 System Overview

**DMS Hub** è il sistema centrale per la gestione della Rete Mercati Made in Italy, con:

- **122+ endpoint API** (TRPC + REST)
- **72 tabelle database**
- **Full Observability** con Guardian monitoring
- **Multi-agent orchestration** (MIO, Guardian, Zapier, ecc.)
- **💳 Wallet/PagoPA** - Borsellino elettronico operatori con integrazione E-FIL Plug&Pay
- **🏢 Imprese & Qualificazioni** - Gestione anagrafica imprese con semaforo conformità

---

## 🗄️ Database Schema

### Tables (72)

| Variable Name | Table Name |
|---------------|------------|
| `users` | `users` |
| `extendedUsers` | `extended_users` |
| `markets` | `markets` |
| `shops` | `shops` |
| `transactions` | `transactions` |
| `checkins` | `checkins` |
| `carbonCreditsConfig` | `carbon_credits_config` |
| `fundTransactions` | `fund_transactions` |
| `reimbursements` | `reimbursements` |
| `civicReports` | `civic_reports` |
| `products` | `products` |
| `productTracking` | `product_tracking` |
| `carbonFootprint` | `carbon_footprint` |
| `ecocredits` | `ecocredits` |
| `auditLogs` | `audit_logs` |
| `systemLogs` | `system_logs` |
| `userAnalytics` | `user_analytics` |
| `sustainabilityMetrics` | `sustainability_metrics` |
| `notifications` | `notifications` |
| `inspections` | `inspections` |
| `businessAnalytics` | `business_analytics` |
| `mobilityData` | `mobility_data` |
| `marketGeometry` | `market_geometry` |
| `stalls` | `stalls` |
| `vendors` | `vendors` |
| `concessions` | `concessions` |
| `vendorDocuments` | `vendor_documents` |
| `bookings` | `bookings` |
| `vendorPresences` | `vendor_presences` |
| `inspectionsDetailed` | `inspections_detailed` |
| `violations` | `violations` |
| `concessionPayments` | `concession_payments` |
| `customMarkers` | `custom_markers` |
| `customAreas` | `custom_areas` |
| `apiKeys` | `api_keys` |
| `apiMetrics` | `api_metrics` |
| `webhooks` | `webhooks` |
| `webhookLogs` | `webhook_logs` |
| `externalConnections` | `external_connections` |
| `mioAgentLogs` | `mio_agent_logs` |
| `hubLocations` | `hub_locations` |
| `hubShops` | `hub_shops` |
| `hubServices` | `hub_services` |
| `agentTasks` | `agent_tasks` |
| `agentProjects` | `agent_projects` |
| `agentBrain` | `agent_brain` |
| `systemEvents` | `system_events` |
| `dataBag` | `data_bag` |
| `agentMessages` | `agent_messages` |
| `agentContext` | `agent_context` |
| `comuni` | `comuni` |
| `settori_comune` | `settori_comune` |
| `imprese` | `imprese` |
| `qualificazioni` | `qualificazioni` |
| `qualification_types` | `qualification_types` |
| `operatoreWallet` | `operatore_wallet` |
| `walletTransazioni` | `wallet_transazioni` |
| `tariffePosteggio` | `tariffe_posteggio` |
| `avvisiPagopa` | `avvisi_pagopa` |

---

## 🔌 API Endpoints

### Categorie API (122+ endpoint)

| Categoria | Endpoint | Descrizione |
|-----------|----------|-------------|
| **analytics** | 7 | Statistiche piattaforma |
| **system** | 5 | Health check, auth, config |
| **carbon** | 3 | Crediti di carbonio |
| **logs** | 2 | Log di sistema |
| **users** | 1 | Statistiche utenti |
| **sustainability** | 1 | Metriche sostenibilità |
| **businesses** | 1 | Attività commerciali |
| **inspections** | 1 | Ispezioni e violazioni |
| **notifications** | 1 | Notifiche |
| **civic** | 1 | Segnalazioni civiche |
| **mobility** | 1 | Dati mobilità TPER |
| **integrations** | 2 | TPER Bologna |
| **dms** | 30+ | Gestione mercati DMS |
| **guardian** | 4 | Monitoring e debug |
| **mihub** | 11 | Multi-agent system |
| **wallet** | 20 | 💳 Wallet/PagoPA |
| **imprese** | 6 | 🏢 Imprese & Qualificazioni |

---

## 📁 Project Structure

### Server

```
server/
  📁 _core
    📄 context.ts
    📄 cookies.ts
    📄 dataApi.ts
    📄 env.ts
    📄 imageGeneration.ts
    📄 index.ts
    📄 llm.ts
    📄 map.ts
    📄 notification.ts
    📄 oauth.ts
    📄 sdk.ts
    📄 systemRouter.ts
    📄 trpc.ts
    📁 types
    📄 vite.ts
    📄 voiceTranscription.ts
  📁 api
    📁 github
  📄 db.ts
  📄 dmsHubRouter.ts
  📄 eventBus.ts
  📄 guardianRouter.ts
  📄 index.ts
  📄 integrationsRouter.ts
  📁 logs
  📄 mihubRouter.ts
  📄 mioAgentRouter.ts
  📄 routers.ts
  📁 services
    📄 apiInventoryService.ts  # 🆕 122+ endpoint catalogati
    📄 apiLogsService.ts
    📄 efilPagopaService.ts    # 🆕 Integrazione E-FIL PagoPA
    📄 tperService.ts
  📄 storage.ts
  📄 walletRouter.ts           # 🆕 API Wallet operatori (20 endpoint)
```

### Client

```
client/src/
  📄 App.tsx
  📁 _core
    📁 hooks
  📁 api
    📄 logsClient.ts
    📄 orchestratorClient.ts
  📁 components
    📄 AIChatBox.tsx
    📄 APIDashboardV2.tsx       # 🆕 Dashboard API con 122+ endpoint
    📄 BottomNav.tsx
    📄 ChatWidget.tsx
    📄 ComuniPanel.tsx
    📄 ConnessioniV2.tsx
    📄 DashboardLayout.tsx
    📄 DashboardLayoutSkeleton.tsx
    📄 ErrorBoundary.tsx
    📄 GISMap.tsx
    📄 GestioneHubNegozi.tsx
    📄 GestioneMercati.tsx
    📄 GuardianDebugSection.tsx
    📄 GuardianIntegrations.tsx
    📄 GuardianLogsSection.tsx
    📄 HomeButtons.tsx
    📄 Integrazioni.tsx
    📄 LogDebug.tsx
    📄 LogsDebugReal.tsx
    📄 MIHUBDashboard.tsx
    📄 MIOAgent.tsx
    📄 MIOLogs.tsx
    📄 ManusDialog.tsx
    📄 Map.tsx
    📄 MapModal.tsx
    📄 MarketMapComponent.tsx
    📄 MessageContent.tsx
    📄 MobilityMap.tsx
    📄 NotificationsPanel.tsx
    📄 PanicButton.tsx
    📄 WalletPanel.tsx          # 🆕 Gestione Wallet operatori con UI interattiva
    📄 RouteLayer.tsx
    📄 SharedWorkspace.tsx
    📄 SharedWorkspace_old.tsx
    📄 ShopModal.tsx
    📄 StallNumbersOverlay.tsx
    📄 ZoomFontUpdater.tsx
    📁 markets
    📁 mio
    📁 multi-agent
    📁 ui
  📁 config
    📄 api.ts
    📄 links.ts
    📄 realEndpoints.ts
  📄 const.ts
  📁 contexts
    📄 MioContext.tsx
    📄 ThemeContext.tsx
  📁 hooks
    📄 useAgentLogs.ts
    📄 useComposition.ts
    📄 useConversationPersistence.ts
    📄 useInternalTraces.ts
    📄 useMobile.tsx
    📄 useOrchestrator.ts
    📄 usePersistFn.ts
    📄 useSystemStatus.ts
  📁 lib
    📄 DirectMioClient.ts
    📄 agentHelper.ts
    📄 mioOrchestratorClient.ts
    📄 stallStatus.ts
    📄 trpc.ts
    📄 utils.ts
  📄 main.tsx
  📁 pages
    📄 APITokensPage.tsx
    📄 CivicPage.tsx
    📄 ComponentShowcase.tsx
    📄 CouncilPage.tsx
    📄 DashboardPA.tsx
    📄 GuardianDebug.tsx
    📄 GuardianEndpoints.tsx
    📄 GuardianLogs.tsx
    📄 Home.tsx
    📄 HomePage.tsx
    📄 HubOperatore.tsx
    📄 LogDebugPage.tsx
    📄 MIHUBPage.tsx
    📄 MapPage.tsx
    📄 MarketGISPage.tsx
    📄 NotFound.tsx
    📄 RoutePage.tsx
    📄 VetrinePage.tsx
    📄 WalletPage.tsx
    📁 api
    📄 mio.tsx
  📁 utils
    📄 api.ts
    📄 mihubAPI.ts
```

### Scripts

- `generate_blueprint.cjs`
- `seed.js`
- `sync_api_docs.cjs`
- `test_agents_capabilities.cjs`

---

## 💳 Wallet/PagoPA System

### Architettura

Il sistema Wallet/PagoPA permette la gestione del borsellino elettronico prepagato per gli operatori mercatali, con integrazione **E-FIL Plug&Pay** per i pagamenti PagoPA.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Operatore     │────▶│   DMS Hub       │────▶│   E-FIL         │
│   Mercatale     │     │   (Wallet API)  │     │   Plug&Pay      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  Ricarica Wallet      │  WSPayment/WSFeed     │
        │──────────────────────▶│──────────────────────▶│
        │                       │                       │
        │  Check-in Mercato     │  Verifica Saldo       │
        │──────────────────────▶│  + Decurtazione       │
        │                       │                       │
```

### Tabelle Database

| Tabella | Descrizione |
|---------|-------------|
| `operatore_wallet` | Wallet per ogni impresa/operatore |
| `wallet_transazioni` | Storico ricariche e decurtazioni |
| `tariffe_posteggio` | Tariffe giornaliere per tipo posteggio |
| `avvisi_pagopa` | Avvisi PagoPA generati |

### API Endpoints Wallet (20 endpoint)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `wallet.stats` | GET | Statistiche dashboard wallet |
| `wallet.list` | GET | Lista tutti i wallet |
| `wallet.getById` | GET | Dettaglio wallet |
| `wallet.getByImpresa` | GET | Wallet per impresa |
| `wallet.create` | POST | Crea nuovo wallet |
| `wallet.updateStatus` | POST | Blocca/sblocca wallet |
| `wallet.transazioni` | GET | Storico transazioni |
| `wallet.ricarica` | POST | Effettua ricarica |
| `wallet.decurtazione` | POST | Effettua decurtazione |
| `wallet.generaAvvisoPagopa` | POST | Genera avviso PagoPA |
| `wallet.pagamentoSpontaneo` | POST | Avvia pagamento immediato |
| `wallet.verificaPagamento` | GET | Verifica stato IUV |
| `wallet.generaPdfAvviso` | GET | PDF avviso |
| `wallet.generaPdfQuietanza` | GET | PDF quietanza |
| `wallet.avvisiPagopa` | GET | Lista avvisi PagoPA |
| `wallet.tariffe` | GET | Lista tariffe posteggio |
| `wallet.verificaSaldoPresenza` | POST | Verifica saldo per check-in |
| `wallet.ricercaPagamentiGiornalieri` | GET | Ricerca pagamenti |
| `wallet.reportRiconciliazione` | GET | Report riconciliazione |
| `wallet.reportMercato` | GET | Report wallet per mercato |

### UI WalletPanel (Funzionalità)

Il componente `WalletPanel.tsx` offre:

**Tab Wallet Operatori:**
- Statistiche: wallet attivi, saldo basso, bloccati, saldo totale
- Lista wallet con ricerca e filtri (stato, mercato)
- Dettaglio wallet con saldo, giorni coperti, transazioni
- Dialog "Genera Avviso PagoPA" con:
  - Input importo + bottoni suggeriti (€50, €100, €250, €500, €1000)
  - Preview nuovo saldo e giorni coperti
  - Generazione IUV e Codice Avviso (18 cifre)
  - Copia negli appunti, Download PDF, Paga Ora
- Dialog "Pagamento Immediato" con redirect checkout PagoPA

**Tab PagoPA:**
- Statistiche: totale incassato, pagati, in attesa, scaduti
- Lista avvisi con stato (EMESSO, PAGATO, SCADUTO)
- Azioni: Download PDF, Paga Ora, Scarica Quietanza

**Tab Tariffe:**
- Lista tariffe per tipo posteggio
- CRUD tariffe

**Tab Riconciliazione:**
- Report ricariche/decurtazioni
- Sincronizzazione E-FIL

### Integrazione E-FIL Plug&Pay

| Servizio SOAP | Funzione |
|---------------|----------|
| **WSPayment** | Pagamento spontaneo + checkout |
| **WSFeed** | Creazione posizione debitoria (avviso) |
| **WSDeliver** | Verifica stato + ricerca giornaliera |
| **WSGeneratorPdf** | Generazione PDF avviso/quietanza |
| **WSPaymentNotify** | Notifica pagamento "Fuori Nodo" |

### Configurazione E-FIL

Variabili ambiente richieste (vedi `.env.efil.example`):

```bash
EFIL_BASE_URL=https://test.plugnpay.efil.it/plugnpay
EFIL_USERNAME=<user>
EFIL_PASSWORD=<pass>
EFIL_APPLICATION_CODE=<fornito da E-FIL>
EFIL_ID_GESTIONALE=DMS-GROSSETO
DMS_PAGOPA_RETURN_URL=https://miohub.app/payments/return
DMS_PAGOPA_CALLBACK_URL=https://miohub.app/api/wallet/callback
```

### Flusso Check-in con Wallet

1. Operatore richiede check-in al mercato
2. Sistema verifica stato wallet (ATTIVO/BLOCCATO/SOSPESO)
3. Sistema ottiene tariffa posteggio per tipo
4. Sistema verifica saldo sufficiente
5. Se OK: decurta importo e crea presenza
6. Se saldo < minimo: blocca wallet automaticamente
7. Se wallet bloccato: rifiuta check-in

---

## 🏢 Imprese & Qualificazioni

### API Endpoints Imprese (6 endpoint)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `imprese.list` | GET | Lista imprese con filtri |
| `imprese.getById` | GET | Dettaglio impresa |
| `qualificazioni.list` | GET | Lista qualificazioni |
| `imprese.qualificazioni` | GET | Qualificazioni impresa |
| `imprese.rating` | GET | Semaforo Conformità |
| `imprese.migratePdnd` | POST | Migrazione PDND |

### Semaforo Conformità

Il sistema calcola automaticamente un rating di conformità per ogni impresa:

- 🟢 **VERDE** - Tutti i documenti in regola
- 🟡 **GIALLO** - Documenti in scadenza (< 30 giorni)
- 🔴 **ROSSO** - Documenti scaduti o mancanti

---

## 🔗 Sezione Integrazioni (API Dashboard)

La sezione Integrazioni nella Dashboard PA mostra:

### Tab API Dashboard
- **122+ endpoint** catalogati per categoria
- API Playground per test interattivo
- Statistiche utilizzo (richieste oggi, tempo medio, success rate, errori)

### Tab Connessioni
- Lista connessioni esterne configurate
- Health check automatico

### Tab API Keys
- Gestione chiavi API
- Creazione/revoca chiavi

### Tab Webhook
- Configurazione webhook
- Log chiamate webhook

### Tab Sync Status
- Stato sincronizzazione servizi esterni

---

## 🤖 Agent Library

La cartella `.mio-agents/` contiene la conoscenza condivisa per gli agenti AI:

- **system_prompts.md** - Prompt e personalità degli agenti
- **tools_definition.json** - Tool disponibili per gli agenti
- **api_reference_for_agents.md** - Riferimento API semplificato

---

## 🔄 Aggiornamento

Per aggiornare questo blueprint e la documentazione:

```bash
npm run docs:update
```

Questo comando esegue:
1. `sync_api_docs.cjs` - Aggiorna `index.json` con endpoint reali
2. `generate_blueprint.cjs` - Rigenera questo file e `.mio-agents/`

---

**Generated by Manus AI** 🤖
