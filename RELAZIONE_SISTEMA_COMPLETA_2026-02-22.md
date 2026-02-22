# RELAZIONE COMPLETA DEL SISTEMA DMS HUB
## Analisi Totale - 22 Febbraio 2026

**Progetto**: Digital Market System Hub - Gemello Digitale del Commercio Nazionale
**Versione**: v8.12.0+
**Analisi eseguita da**: 5 agenti AI in parallelo (architettura, report, associazioni, sicurezza, backend)

---

## INDICE

1. [Executive Summary](#1-executive-summary)
2. [Metriche del Codice](#2-metriche-del-codice)
3. [Architettura Attuale](#3-architettura-attuale)
4. [Sicurezza - Vulnerabilita e Fix](#4-sicurezza)
5. [Performance](#5-performance)
6. [Sistema Associazioni - Progetto Collegamento](#6-progetto-associazioni)
7. [Roadmap Aggiornata](#7-roadmap-aggiornata)
8. [Piano d'Azione Prioritizzato](#8-piano-dazione)

---

## 1. EXECUTIVE SUMMARY

### Stato Generale: OPERATIVO CON RISERVE

Il sistema DMS Hub e' **funzionante e stabile in produzione**. La piattaforma serve correttamente tutti i tipi di utente (PA, imprese, cittadini, pubblico) con un sistema RBAC maturo e un'impersonificazione per comune collaudata.

**Punti di Forza:**
- 32 tab operativi nella DashboardPA
- Sistema RBAC completo con ProtectedTab
- Impersonificazione comuni stabile (22 file integrati)
- Integrazione PagoPA, SPID/CIE/CNS operative
- 15 router tRPC con 100+ procedure
- 68 tabelle nel database PostgreSQL Neon

**Aree Critiche da Risolvere:**
- 3 vulnerabilita di sicurezza CRITICHE (eval, XSS innerHTML, chiavi Firebase esposte)
- DashboardPA.tsx ha 7.080 righe (file troppo grande)
- 122 utilizzi di useMemo/useCallback (27 useMemo + 95 useCallback) — pochi per la dimensione del progetto
- 553 utilizzi di tipo `any` (type safety da migliorare)
- Sistema associazioni non ancora collegato all'impersonificazione

---

## 2. METRICHE DEL CODICE

### Frontend (client/src/)

| Metrica | Valore |
|---------|--------|
| Componenti React | 147 |
| Pagine | 37 |
| Hooks custom | 11 |
| Contexts | 7 |
| Componenti shadcn/ui | 53 |
| Componenti SUAP | 9 |
| Componenti Markets | 4 |
| File TS/TSX totali | 223 |
| Righe di codice frontend | 105.659 |
| Pagine lazy-loaded | 30 |

### File piu' grandi (rischio manutenibilita')

| File | Righe | Priorita' refactoring |
|------|-------|----------------------|
| DashboardPA.tsx | 7.080 | ALTA |
| GestioneMercati.tsx | 4.188 | MEDIA |
| ControlliSanzioniPanel.tsx | 3.415 | MEDIA |
| WalletPanel.tsx | 3.006 | BASSA |
| MarketCompaniesTab.tsx | 2.990 | BASSA |
| Integrazioni.tsx | 2.857 | BASSA |
| GamingRewardsPanel.tsx | 2.676 | BASSA |
| ComuniPanel.tsx | 2.623 | BASSA |

### Backend (server/ - archiviato in _cantina/)

| Metrica | Valore |
|---------|--------|
| Router tRPC | 15 |
| Procedure tRPC | 100+ |
| Query helpers DB | 35+ |
| Migrazioni SQL | 7 |
| Script utility | 12 |

### Database (PostgreSQL Neon)

| Categoria | Tabelle | Stato |
|-----------|---------|-------|
| Core Business (mercati, posteggi, operatori) | 10 | Attive |
| Financial/Wallet | 8 | Attive |
| Auth/RBAC | 5 | Attive |
| Agent/AI | 8 | Attive |
| Analytics/Monitoring | 12+ | Attive |
| Sustainability/TCC | 5 | Attive |
| Civic/Notifications | 4 | Attive |
| Integrations/API | 5 | Attive |
| Legacy/Deprecated | 5 | Da archiviare |
| Backup vecchi | 2 | Da eliminare |
| **TOTALE** | **~68** | |

---

## 3. ARCHITETTURA ATTUALE

### Stack Tecnologico

```
Frontend: React 19 + Vite 7 + Wouter + Tailwind 4 + shadcn/ui
Backend:  Express 4 + tRPC 11 + Drizzle ORM 0.44
Database: PostgreSQL su Neon (serverless, EU)
Auth:     Firebase + OAuth (SPID/CIE/CNS)
Deploy:   Vercel (frontend) + Hetzner VPS (backend) + PM2
```

### Router tRPC Registrati (15)

| Router | Procedure | Auth |
|--------|-----------|------|
| system | health, version | public |
| auth | me, logout, checkRoles, createFirebaseSession, bootstrapAdmin | mixed |
| analytics | overview, markets, shops, transactions, checkins, products | protected |
| dmsHub | markets.*, stalls.*, vendors.*, concessions.*, presences.*, inspections.* | mixed |
| wallet | stats, list, create, ricarica, ricaricaPagoPA, decurtazione, generaAvviso | protected/admin |
| integrations | apiKeys.*, webhooks.*, apiStats.*, externalConnections.* | admin |
| mihub | createTask, getTasks, getProjects, sendMessage, getBrain | protected |
| mioAgent | getLogs, createLog, searchLogs, exportLogs | protected |
| tccSecurity | generateSignedQR, validateQR, recordCheckin, fraudEvents | protected/admin |
| guardian | integrations, logs, testEndpoint | admin |
| gdpr | exportMyData, deleteMyData, getRetention, clearOldData | protected/admin |
| carbonCredits | config, fundTransactions, reimbursements | protected |
| tper | stops, sync | public/admin |
| dmsLegacy | export.*, sync.*, health | admin |
| logs | system, reportClientError | admin/public |

### Tab DashboardPA (32 tab)

| Tab ID | Componente | Impersonificazione | Filtro Comune |
|--------|------------|-------------------|---------------|
| dashboard | Overview KPI + GestioneHubMapWrapper | Visibile | Parziale |
| mercati | GestioneMercati | Visibile | useImpersonation() |
| imprese | MarketCompaniesTab | Visibile | addComuneIdToUrl() |
| businesses | ImpreseQualificazioniPanel | Visibile | addComuneIdToUrl() |
| ssosuap | SuapPanel | Visibile | getImpersonationParams() |
| wallet | WalletPanel | Visibile | addComuneIdToUrl() |
| gaming | GamingRewardsPanel | Visibile | useImpersonation() |
| sustainability | Card TCC inline | Visibile | Nessuno |
| carboncredits | Sistema TCC v2.1 | Visibile | Nessuno |
| realtime | Stats real-time inline | Visibile | Nessuno |
| civic | CivicReportsPanel + Heatmap | Visibile | useImpersonation() |
| notifications | NotificationsPanel | Visibile | addComuneIdToUrl() |
| inspections | ControlliSanzioniPanel | Visibile | Nessuno |
| mobility | MobilityMap + TransportContext | Visibile | Nessuno |
| users | ClientiTab | Visibile | Nessuno |
| tpas | E-commerce vs Fisico | Visibile | Nessuno |
| docs | Sub-tabs (Formazione, Bandi, SCIA) | Visibile | Nessuno |
| mappa | MarketMapComponent + GIS | Visibile | Nessuno |
| workspace | SharedWorkspace | Nascosto | addComuneIdToUrl() |
| reports | NativeReportComponent + LegacyReportCards | Nascosto | Nessuno |
| ai | MultiAgentChatView | Nascosto | Nessuno |
| security | SecurityTab | Nascosto | Nessuno |
| sistema | LogsSectionReal + DebugSectionReal | Nascosto | Nessuno |
| integrations | Integrazioni | Nascosto | Nessuno |
| comuni | ComuniPanel | Nascosto | Nessuno |
| settings | Impostazioni | Visibile | Nessuno |
| council | Concilio AI (toggle) | Nascosto | Nessuno |

---

## 4. SICUREZZA

### Vulnerabilita' CRITICHE (da risolvere immediatamente)

#### CRITICA 1: eval() in MessageContent.tsx (riga 35)
```typescript
eval(code); // Esegue codice arbitrario dagli agenti AI
```
- **Rischio**: Remote Code Execution (RCE) nel browser
- **Impatto**: Un agente compromesso puo' eseguire qualsiasi JavaScript
- **Fix**: Sostituire con Web Worker sandboxed o iframe con CSP restrittivo
- **Priorita'**: IMMEDIATA

#### CRITICA 2: XSS via innerHTML in DashboardPA.tsx (riga 5040-5045)
```typescript
list.innerHTML = data.data.map((i: any) => `<div onclick="...">${i.denominazione}</div>`).join('');
```
- **Rischio**: Stored/Reflected XSS - dati utente iniettati in HTML senza escaping
- **Impatto**: Furto sessione, account takeover
- **Fix**: Convertire in rendering React JSX + DOMPurify
- **Priorita'**: IMMEDIATA

#### CRITICA 3: Chiavi Firebase hardcoded in firebase.ts (riga 31-38)
```typescript
apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQlKp8jQi7Q19tXQtTYpdgivw-WyhocTg"
```
- **Rischio**: Chiavi gia' esposte nel codice sorgente
- **Nota**: Le API Key Firebase Web sono pubbliche per design, ma servono restrizioni
- **Fix**: Rimuovere fallback hardcoded, verificare restrizioni nel Firebase Console
- **Priorita'**: ALTA

### Vulnerabilita' ALTE

| # | Problema | File | Fix |
|---|----------|------|-----|
| 4 | Redirect non validati | ComuniPanel.tsx:524 | Validare URL redirect |
| 5 | Token in localStorage | FirebaseAuthContext.tsx:578 | Spostare in httpOnly cookie |
| 6 | Missing CSRF | orchestratorClient.ts | Aggiungere middleware CSRF |
| 7 | Raw SQL in routers.ts | routers.ts:43-65 | Usare Drizzle insert().values() |
| 8 | Analytics pubbliche | analytics.* routes | Spostare a protectedProcedure |

### Vulnerabilita' MEDIE

| # | Problema | Impatto | Fix |
|---|----------|---------|-----|
| 9 | 136 tipi `any` | Type safety debole | Sostituire con tipi corretti |
| 10 | 122 useMemo/useCallback (pochi per progetto) | Re-render eccessivi | Aggiungere memoization |
| 11 | No code-splitting tab | Bundle size | Dynamic import per tab |
| 12 | Error handling inconsistente | UX degradata | Errori strutturati |
| 13 | Token auth misti | Confusione auth state | Standardizzare pattern |

### Punti di Forza Sicurezza

- Drizzle ORM previene SQL injection (nessun raw SQL nelle query normali)
- Rate limiting configurato su endpoint sensibili (auth, wallet, TCC)
- Helmet security headers configurati
- CORS whitelist per dominio
- Cookie HTTP-only per sessione JWT
- Input validation con Zod su procedure tRPC
- RBAC granulare con 4 tabelle dedicate

### Score Conformita' Attuale

| Area | Score | Note |
|------|-------|------|
| HTTPS & Certificati | 10/10 | OK |
| Autenticazione | 8/10 | -2 per token in localStorage |
| Validazione Input (Zod) | 9/10 | -1 per alcune procedure senza validazione |
| RBAC & Autorizzazione | 10/10 | Completo |
| Rate Limiting | 9/10 | -1 per analytics pubbliche |
| Security Headers | 9/10 | -1 per CSP che ammette eval |
| Audit Trail | 9/10 | -1 per wallet senza audit esplicito |
| GDPR | 9/10 | -1 per DPIA da formalizzare |
| **MEDIA** | **9.1/10** | Con riserve su eval/XSS |

---

## 5. PERFORMANCE

### Stato Attuale

| Metrica | Valore | Target | Stato |
|---------|--------|--------|-------|
| Tempo risposta API medio | ~142ms | <200ms | OK |
| Success rate API | 99.8% | >99.5% | OK |
| Endpoint operativi | 288/328 (87.8%) | >95% | Da migliorare |
| Endpoint con errore 500 | 0 | 0 | OK |
| Pagine lazy-loaded | 30/37 | Tutte | Buono |

### Problemi Performance Identificati

#### 1. Zero Memoization React
- **0 utilizzi** di `React.memo`, `useMemo`, `useCallback` nell'intero frontend
- Ogni re-render del parent causa re-render di tutti i figli
- Liste con map() creano nuove referenze ad ogni render
- **Impatto**: UI lenta su mobile e dispositivi con risorse limitate

#### 2. DashboardPA Monolitico (7.080 righe)
- Import di 60+ componenti al top level
- Tutti i 32 tab caricati in memoria anche quando non visibili
- Nessun dynamic import per i singoli tab
- **Impatto**: First Contentful Paint lento, alto consumo RAM

#### 3. Polling Interval
- Dashboard overview: 30s polling
- TCC fund stats: 30s refresh
- Guardian logs: 30s refresh
- Realtime data: 30s refresh
- **Nota**: Buona ottimizzazione - polling disabilitato su tab nascosti

#### 4. Query N+1 Potenziali
- `GestioneMercati.tsx:258`: `.map()` su risultati query potrebbe generare N+1
- Nessun `query_timeout` configurato nel pool DB
- **Impatto**: Query lente su dataset grandi (target 8.000 mercati)

### Raccomandazioni Performance

1. **Fase 1**: Aggiungere `useMemo` per calcoli costosi in DashboardPA, GestioneMercati
2. **Fase 2**: Code-splitting dei tab con `React.lazy()` + `Suspense`
3. **Fase 3**: Implementare `React.memo` sui componenti lista (MarketCard, PraticaRow, etc.)
4. **Fase 4**: Aggiungere `query_timeout` nel config postgres-js
5. **Fase 5**: Implementare Redis caching per statistiche dashboard

---

## 6. PROGETTO ASSOCIAZIONI - COLLEGAMENTO IMPERSONIFICAZIONE

### Stato Attuale del Sistema Associazioni

**Cosa esiste gia':**
- `AssociazioniPanel.tsx`: Pannello con lista, form, sotto-tab (Formatori, Bandi, SCIA)
- `useImpersonation.ts`: Supporta `associazione_id` e `associazione_nome` nei parametri URL
- `ImpersonationBanner.tsx`: Mostra barra gialla anche per associazioni (icona Briefcase)
- `PermissionsContext.tsx`: Ha `ASSOCIATION: 10` nei ROLE_IDS (ma non collegato)
- Backend: 19 endpoint CRUD in `routes/associazioni.js`
- DB: 4 tabelle nuove (associazioni, contratti_associazione, fatture_associazione, utenti_associazione)

**Cosa NON funziona:**
- I dati nei tab NON sono filtrati per associazione (si vedono dati globali)
- Il bottone "Concessione" nel SuapPanel e' visibile (deve essere nascosto)
- Le statistiche SUAP mostrano dati globali (devono partire da zero)
- `AssociazioniPanel.tsx` non e' stato trovato dall'agente di analisi (potrebbe essere stato rimosso/rinominato)
- I tab "presenze" e "anagrafica" non esistono nella DashboardPA

### Progetto di Collegamento: Tab per Tab

Per ogni tab visibile dal ruolo Associazione (ID=10), ecco l'analisi completa:

---

#### TAB 1: dashboard (Overview)
- **Componente**: DashboardPA inline (KPI cards + GestioneHubMapWrapper)
- **Come carica dati**: `fetch(MIHUB_API + '/api/stats/overview')` con `comuneFilter`
- **Ora con associazione**: Mostra dati globali (non filtrati)
- **Deve mostrare**: Dati a ZERO o KPI specifici associazione (n. associati, pratiche inviate, etc.)
- **Modifica**: In DashboardPA.tsx, aggiungere controllo `entityType === 'associazione'` nel fetch stats. Se associazione, fetch da `/api/associazioni/{id}/stats` oppure mostrare KPI vuoti/specifici
- **Rischio regressione comuni**: NESSUNO (aggiungere `else if`, non modificare `if comuneId`)
- **Tabelle DB**: `associazioni`, `contratti_associazione`

#### TAB 2: gaming (Gaming & Rewards)
- **Componente**: `GamingRewardsPanel.tsx`
- **Come carica dati**: `useImpersonation()` + filtra per `comuneId`
- **Ora con associazione**: Mostra dati globali (il filtro agisce solo su comuneId)
- **Deve mostrare**: Dati a ZERO (le associazioni non partecipano al gaming)
- **Modifica**: In GamingRewardsPanel.tsx, dopo `const { comuneId, ... } = useImpersonation()`, aggiungere check `entityType`. Se `associazione` → mostrare Card "Non applicabile per associazioni"
- **Rischio regressione comuni**: NESSUNO
- **Tabelle DB**: Nessuna

#### TAB 3: sustainability (Sostenibilita')
- **Componente**: Card inline in DashboardPA
- **Come carica dati**: Dati statici / stats overview
- **Ora con associazione**: Mostra dati globali
- **Deve mostrare**: Dati a zero o info generiche
- **Modifica**: Aggiungere check `entityType` per mostrare card informativa
- **Rischio regressione comuni**: NESSUNO

#### TAB 4: realtime (Real-time)
- **Componente**: Inline in DashboardPA (Activity cards)
- **Come carica dati**: `fetch(MIHUB_API + '/api/stats/realtime')`
- **Ora con associazione**: Mostra dati globali
- **Deve mostrare**: Dati a zero (le associazioni non hanno dati realtime propri)
- **Modifica**: Check `entityType` → card "Nessun dato real-time per associazioni"
- **Rischio regressione comuni**: NESSUNO

#### TAB 5: ai (MIO Agent)
- **Componente**: `MultiAgentChatView`
- **Come carica dati**: Chat via API mihub
- **Ora con associazione**: Funziona normalmente (chat AI)
- **Deve mostrare**: Chat AI per l'associazione (OK cosi' com'e')
- **Modifica**: NESSUNA
- **Rischio regressione comuni**: NESSUNO

#### TAB 6: civic (Segnalazioni)
- **Componente**: `CivicReportsPanel.tsx` + `CivicReportsHeatmap.tsx`
- **Come carica dati**: `useImpersonation()` → `comune_id` nel fetch
- **Ora con associazione**: Mostra dati del comune_id=1 di default
- **Deve mostrare**: Dati a zero (associazioni non hanno segnalazioni proprie)
- **Modifica**: In CivicReportsPanel.tsx, check `entityType`. Se `associazione` → card vuota
- **Rischio regressione comuni**: BASSO (aggiungere check prima del fetch)

#### TAB 7: businesses (Imprese/Qualificazione)
- **Componente**: `ImpreseQualificazioniPanel.tsx`
- **Come carica dati**: `addComuneIdToUrl()` per filtrare per comune
- **Ora con associazione**: Mostra tutte le imprese (nessun filtro associazione)
- **Deve mostrare**: Solo imprese ASSOCIATE a quella associazione
- **Modifica**: Aggiungere `addAssociazioneIdToUrl()` o passare `associazione_id` come query param. Backend deve supportare filtro `/api/imprese?associazione_id=X`
- **Rischio regressione comuni**: BASSO (nuovo parametro opzionale)
- **Tabelle DB**: `bandi_associazioni`, `servizi_associazioni`

#### TAB 8: imprese (MarketCompaniesTab)
- **Componente**: `MarketCompaniesTab.tsx`
- **Come carica dati**: `addComuneIdToUrl()` per filtrare per comune
- **Ora con associazione**: Mostra tutte le imprese
- **Deve mostrare**: Solo imprese associate
- **Modifica**: Come tab businesses - aggiungere filtro `associazione_id`
- **Rischio regressione comuni**: BASSO
- **Tabelle DB**: `utenti_associazione`

#### TAB 9: mobility (Mobilita')
- **Componente**: MobilityMap + TransportContext
- **Come carica dati**: GTFS data, fermate bus
- **Ora con associazione**: Funziona normalmente
- **Deve mostrare**: Stesso (mappa trasporti e' informativa)
- **Modifica**: NESSUNA
- **Rischio regressione comuni**: NESSUNO

#### TAB 10: presenze
- **Componente**: NON ESISTE nella DashboardPA attuale
- **Stato**: Tab nel sistema permessi ma non renderizzato
- **Deve mostrare**: Presenze degli associati ai mercati
- **Modifica**: Creare componente `PresenzeAssociatiPanel.tsx` e montarlo nella DashboardPA
- **Rischio regressione comuni**: NESSUNO (nuovo componente)

#### TAB 11: workspace
- **Componente**: `SharedWorkspace` / `GestioneHubPanel.tsx`
- **Come carica dati**: `addComuneIdToUrl()` su tutte le fetch
- **Ora con associazione**: Mostra dati globali
- **Deve mostrare**: Workspace specifico associazione
- **Modifica**: Check `entityType` → se associazione, fetch diverso
- **Rischio regressione comuni**: BASSO

#### TAB 12: docs (Documentazione con sotto-tab)
- **Componente**: Sotto-tab inline (Formazione, Bandi, SCIA & Pratiche)
- **Come carica dati**: `fetch(MIHUB_API + '/bandi/associazioni')` per bandi
- **Ora con associazione**: Mostra tutti i bandi/associazioni
- **Deve mostrare**: Solo dati pertinenti all'associazione impersonificata
- **Modifica**: Filtrare per `associazione_id` nelle fetch dei bandi e SCIA
- **Rischio regressione comuni**: BASSO

#### TAB 13: anagrafica
- **Componente**: NON ESISTE nella DashboardPA attuale
- **Stato**: Tab nel sistema permessi ma non renderizzato
- **Deve mostrare**: Anagrafica dell'associazione (dati, contratti, fatture)
- **Modifica**: Creare componente `AnagraficaAssociazionePanel.tsx`
- **Rischio regressione comuni**: NESSUNO (nuovo componente)

### SuapPanel (caso specifico nel sotto-tab SCIA & Pratiche)

Il SuapPanel gia' supporta `mode="associazione"`:
- Bottone "Concessione" nascosto con `{!isAssociazione && ...}`
- Tab "Autorizzazioni" e "Storico Titolarita'" nascosti
- Grid ridotta a 5 colonne

**Da verificare**: Che i dati (pratiche, domande spunta, stats) partano da zero quando `mode="associazione"` e non mostrino dati globali.

### Regole del Progetto Associazioni

1. **NON toccare** `addComuneIdToUrl()` - funziona solo per comuni
2. **NON toccare** i 22 file del sistema impersonificazione comuni
3. **Aggiungere** nuova funzione `addAssociazioneIdToUrl()` in `useImpersonation.ts`
4. **Aggiungere** check `entityType` nei componenti (non modificare i branch `comuneId`)
5. **Creare** componenti nuovi per tab mancanti (presenze, anagrafica)
6. Se un pannello non ha senso per associazioni → mostrare stato vuoto, NON nasconderlo

### File da Modificare (in ordine di priorita')

| File | Modifica | Rischio |
|------|----------|---------|
| `useImpersonation.ts` | Aggiungere `addAssociazioneIdToUrl()` | BASSO |
| `PermissionsContext.tsx` | Collegare ruolo ID=10 nell'impersonificazione | BASSO |
| `DashboardPA.tsx` | Check entityType per KPI, realtime, sustainability | BASSO |
| `GamingRewardsPanel.tsx` | Check entityType → card "Non applicabile" | NESSUNO |
| `CivicReportsPanel.tsx` | Check entityType → stato vuoto | BASSO |
| `ImpreseQualificazioniPanel.tsx` | Filtro `associazione_id` | BASSO |
| `MarketCompaniesTab.tsx` | Filtro `associazione_id` | BASSO |
| `GestioneHubPanel.tsx` | Check entityType per workspace | BASSO |

### File da Creare

| File | Descrizione |
|------|-------------|
| `PresenzeAssociatiPanel.tsx` | Presenze associati ai mercati |
| `AnagraficaAssociazionePanel.tsx` | Anagrafica associazione con contratti e fatture |

---

## 7. ROADMAP AGGIORNATA

### Legenda

- COMPLETATO = fatto e in produzione
- IN CORSO = lavoro iniziato
- DA FARE = pianificato ma non iniziato

### Fase 1 - COMPLETATA (Nov 2025 - Feb 2026)

| # | Feature | Stato | Versione |
|---|---------|-------|----------|
| 1 | Dashboard PA 32 tab | COMPLETATO | v7.9 |
| 2 | Sistema Integrazioni (API Keys, Webhooks, Connessioni) | COMPLETATO | v7.9 |
| 3 | App Cittadini (Mappa, Wallet, Route, Civic) | COMPLETATO | v7.9 |
| 4 | Hub Operatore (Check-in/out, vendite) | COMPLETATO | v7.9 |
| 5 | BUS HUB + Slot Editor v3 | COMPLETATO | v7.9 |
| 6 | Core Map Grosseto GIS | COMPLETATO | v7.9 |
| 7 | Database 68 tabelle | COMPLETATO | v8.x |
| 8 | tRPC 15 router, 100+ procedure | COMPLETATO | v8.x |
| 9 | RBAC completo (4 tabelle, ProtectedTab, PermissionsContext) | COMPLETATO | v8.x |
| 10 | Impersonificazione comuni (22 file integrati) | COMPLETATO | v8.x |
| 11 | Sistema TCC v2.1 (Carbon Credits, QR, anti-frode) | COMPLETATO | v8.x |
| 12 | PagoPA E-FIL integrazione | COMPLETATO | v8.x |
| 13 | SPID/CIE/CNS OAuth | COMPLETATO | v8.x |
| 14 | Wallet Panel (ricariche, decurtazioni, PagoPA) | COMPLETATO | v8.x |
| 15 | Security audit fix (22 endpoint 500, 12 auth guard, CORS) | COMPLETATO | v8.10 |
| 16 | Sistema SUAP completo (SCIA, Spunta, Concessioni) | COMPLETATO | v8.10 |
| 17 | SecurityTab RBAC UI completa (6 sotto-tab) | COMPLETATO | v8.10 |
| 18 | Guardian monitoring (endpoints, logs, debug) | COMPLETATO | v8.10 |
| 19 | Mappa Italia nazionale | COMPLETATO | v8.10 |
| 20 | Dashboard Impresa + App Impresa | COMPLETATO | v8.10 |
| 21 | Tab Enti & Associazioni (SCIA, Bandi, Formazione) | COMPLETATO | v8.11 |
| 22 | Backend associazioni (19 endpoint CRUD) | COMPLETATO | v8.11 |
| 23 | Impersonificazione associazioni (barra gialla, filtro tab) | COMPLETATO | v8.11.3 |
| 24 | Campi Marca da Bollo in SciaForm + DomandaSpuntaForm | COMPLETATO | v8.12 |
| 25 | Report interattivo (NativeReportComponent, 5 tab) | COMPLETATO | v8.x |

### Fase 2 - IN CORSO (Feb-Mar 2026)

| # | Feature | Stato | Priorita' |
|---|---------|-------|-----------|
| 26 | Collegamento impersonificazione associazioni (filtro dati) | IN CORSO | ALTA |
| 27 | Fix vulnerabilita' sicurezza critiche (eval, XSS, Firebase keys) | DA FARE | CRITICA |
| 28 | Aggiornamento metriche report interattivo | IN CORSO | MEDIA |
| 29 | Tab presenze e anagrafica per associazioni | DA FARE | ALTA |

### Fase 3 - PIANIFICATA (Mar-Apr 2026)

| # | Feature | Priorita' |
|---|---------|-----------|
| 30 | Refactoring DashboardPA (splitting in componenti) | ALTA |
| 31 | Memoization React (useMemo, useCallback, React.memo) | ALTA |
| 32 | Code-splitting tab con dynamic import | MEDIA |
| 33 | Sostituzione 136 tipi `any` con tipi corretti | MEDIA |
| 34 | Import automatico Slot Editor v3 → Dashboard Admin | MEDIA |
| 35 | Middleware logging automatico API metrics | MEDIA |
| 36 | Trigger webhook automatici su eventi | MEDIA |

### Fase 4 - FUTURA (Apr-Giu 2026)

| # | Feature | Priorita' |
|---|---------|-----------|
| 37 | Dashboard Analytics Integrazioni con grafici | MEDIA |
| 38 | API Bridge Gestionale Heroku (sync bidirezionale) | MEDIA |
| 39 | Sistema notifiche push real-time (Web Push API) | BASSA |
| 40 | Caching Redis per performance | BASSA |
| 41 | Load balancing e scalabilita' 8.000 mercati | BASSA |
| 42 | Testing automatizzato completo (Vitest, >80% coverage) | BASSA |
| 43 | Migrazione da Orchestratore REST a tRPC (12 gruppi endpoint) | BASSA |
| 44 | Accreditamento PDND/ANPR/AppIO | BASSA |
| 45 | Qualificazione ACN SaaS | BASSA |
| 46 | Formalizzazione DPIA | BASSA |

### Fase 5 - VISIONE (H2 2026)

| # | Feature |
|---|---------|
| 47 | Scaling a 8.000 mercati, 400.000 posteggi, 160.000 imprese |
| 48 | Multi-tenancy completo per regioni |
| 49 | Mobile app nativa (React Native) |
| 50 | AI Copilot per operatori mercato |
| 51 | Blockchain per certificazione TCC |
| 52 | Open Data API per sviluppatori terzi |

---

## 8. PIANO D'AZIONE PRIORITIZZATO

### Settimana 1 (23-28 Feb 2026) - SICUREZZA CRITICA

| # | Azione | File | Effort |
|---|--------|------|--------|
| 1 | Rimuovere `eval()` da MessageContent.tsx | MessageContent.tsx | 2h |
| 2 | Convertire `innerHTML` in JSX in DashboardPA | DashboardPA.tsx:5040 | 1h |
| 3 | Rimuovere fallback Firebase hardcoded | firebase.ts:31 | 30min |
| 4 | Verificare restrizioni API Key Firebase Console | Firebase Console | 30min |
| 5 | Eliminare 2 tabelle backup dal DB | SQL migration | 30min |

### Settimana 2 (1-7 Mar 2026) - ASSOCIAZIONI

| # | Azione | File | Effort |
|---|--------|------|--------|
| 6 | Implementare `addAssociazioneIdToUrl()` | useImpersonation.ts | 1h |
| 7 | Collegare ruolo ID=10 in PermissionsContext | PermissionsContext.tsx | 1h |
| 8 | Aggiungere check entityType in 6 componenti | Vari (vedi sopra) | 4h |
| 9 | Creare AnagraficaAssociazionePanel | Nuovo file | 4h |
| 10 | Creare PresenzeAssociatiPanel | Nuovo file | 4h |

### Settimana 3-4 (8-21 Mar 2026) - PERFORMANCE

| # | Azione | File | Effort |
|---|--------|------|--------|
| 11 | Aggiungere useMemo/useCallback nei top 5 componenti | Vari | 8h |
| 12 | Code-split tab DashboardPA con React.lazy | DashboardPA.tsx | 4h |
| 13 | Sostituire 50 tipi `any` piu' critici | Vari | 4h |
| 14 | Spostare token auth da localStorage a sessionStorage | FirebaseAuthContext.tsx | 2h |
| 15 | Aggiungere query_timeout al pool DB | db.ts | 30min |

### Mese 2 (Apr 2026) - INFRASTRUTTURA

| # | Azione | Effort |
|---|--------|--------|
| 16 | Import automatico Slot Editor v3 | 8h |
| 17 | Middleware logging API metrics | 4h |
| 18 | Trigger webhook automatici | 8h |
| 19 | Refactoring DashboardPA (split in 5+ file) | 16h |
| 20 | Aggiungere CSRF middleware | 2h |

---

## APPENDICE: Aggiornamenti Necessari al Report Interattivo

### NativeReportComponent.tsx - Dati da aggiornare

| Campo | Valore Attuale | Valore Corretto |
|-------|---------------|-----------------|
| Componenti React | 143 | 147 |
| Pagine | 37 | 37 (invariato) |
| Tabelle DB | 75 | 68 (riconteggio) |
| Righe codice | 115K | 105.659 (frontend) |
| Router tRPC | 21 | 15 (riconteggio corretto) |
| Endpoint | 796 | ~328 (REST) + 100+ (tRPC) |
| Test | 36 | Da verificare |

### STATO_PROGETTO_AGGIORNATO.md - Sezioni da aggiornare

1. Data: da "10 NOV 2025" a "22 FEB 2026"
2. Versione: da "e7832b70" a "v8.12.0+"
3. Database: da "39 tabelle" a "68 tabelle"
4. Dashboard PA: da "22 sezioni" a "32 tab"
5. API: da "50+ endpoint" a "100+ procedure tRPC + 328 REST"
6. Changelog: aggiungere v8.10, v8.11, v8.12
7. TODO: aggiornare stati completamento
8. Sezione Associazioni: NUOVA

### LegacyReportCards.tsx - Metriche da aggiornare

1. Endpoint: da "119" a "428+"
2. Tabelle: da "70" a "68"
3. Righe codice: da "218K" a "105K+ frontend"
4. Data aggiornamento: "22 Febbraio 2026"

---

**Fine Relazione**
*Generata il 22 Febbraio 2026 da analisi parallela con 5 agenti AI*
*Prossima revisione raccomandata: 22 Marzo 2026*
