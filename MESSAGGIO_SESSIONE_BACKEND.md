# ISTRUZIONI PER LA SESSIONE BACKEND

> **Da:** Sessione Frontend (dms-hub-app-new)
> **Per:** Sessione Backend (mihub-backend-rest su Hetzner)
> **Data:** 14 Febbraio 2026
> **Obiettivo:** Fare l'inventario completo del backend e database per allineare il blueprint

---

## CONTESTO

Abbiamo due sessioni Claude Code parallele:
- **Sessione Frontend** (questa repo: `dms-hub-app-new`) → inventario frontend COMPLETATO
- **Sessione Backend** (tu) → devi fare l'inventario del backend su Hetzner e del database Neon

Il blueprint master (`MASTER_BLUEPRINT_MIOHUB.md`) è nella repo `dms-hub-app-new` ed è lungo 8.411 righe (v5.3.0). Va verificato che corrisponda al backend reale.

---

## COSA DEVI FARE

### 1. INVENTARIO BACKEND (Hetzner)

Accedi al server Hetzner e fai un inventario completo:

```
Server: 157.90.29.66
User: root
Path backend: /root/mihub-backend-rest
```

Verifica:
- [ ] **Lista tutti i file in routes/** — Il blueprint menziona:
  - `routes/gaming-rewards.js` — TCC rewards, heatmap, nearby-pois, trend
  - `routes/auth.js` (904 righe) — ARPA OAuth2 SPID/CIE/CNS
  - `routes/civic-reports.js` — Segnalazioni civiche con auto-detect comune
  - `routes/mercaweb.js` — Integrazione MercaWeb (9 endpoint)
  - `routes/test-mercato.js` — Operazioni mercato, spunta, rifiuti
  - `routes/inspections.js` — Ispezioni PM
  - `routes/sanctions.js` — Sanzioni
  - `routes/verbali.js` — Verbali
  - `routes/watchlist.js` — Watchlist PM (con comune_id aggiunto v4.6.0)
  - `routes/imprese.js` — Anagrafica imprese
  - `routes/collaboratori.js` — Collaboratori impresa
  - `routes/presenze.js` — Presenze/spunta
  - `routes/wallets.js` — Wallet e transazioni
  - `routes/tariffs.js` — Tariffe mercato
  - `routes/suap.js` — Pratiche SUAP (notifiche-pm endpoint aggiunto v5.3.0)
  - Ci sono route aggiuntive non nel blueprint?

- [ ] **Lista tutti gli endpoint** — Conta quanti GET/POST/PUT/DELETE ci sono per ogni route file

- [ ] **Verifica PM2** — `pm2 status` e `pm2 show mihub-backend`

- [ ] **Verifica .env** — Quali variabili d'ambiente sono configurate? (solo nomi, NON valori)

- [ ] **Verifica package.json** — Quali dipendenze usa il backend?

- [ ] **Verifica struttura directory** — `ls -la /root/mihub-backend-rest/` e sottodirectory

- [ ] **Verifica auto-deploy** — C'è un webhook GitHub o script di deploy? Come funziona?

- [ ] **Verifica logs** — `pm2 logs mihub-backend --lines 20` — il backend è attivo e funzionante?

### 2. INVENTARIO DATABASE (Neon PostgreSQL)

Connettiti al database e fai un inventario completo:

```
Host: ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech
Database: neondb
User: neondb_owner
Password: npg_lYG6JQ5Krtsi
SSL: require
```

Verifica:
- [ ] **Lista TUTTE le tabelle** — `\dt` o `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`

- [ ] **Per ogni tabella**: conta righe (`SELECT count(*) FROM tabella`) e lista colonne

- [ ] Il blueprint menziona queste tabelle (verifica esistano e abbiano le colonne giuste):
  - `users` (con colonna `"lastSignedIn"` in camelCase!)
  - `login_attempts` (8 colonne: id, username, user_id, ip_address, user_agent, success, failure_reason, created_at)
  - `security_events`
  - `cultural_pois` (dovrebbe avere 1.127 POI)
  - `cultural_visits`
  - `gtfs_stops` (385+ fermate)
  - `route_completions`
  - `mobility_checkins`
  - `hub_shops`
  - `markets`
  - `stalls`
  - `imprese`
  - `concessions` (NOTA: si chiama `concessions` NON `concessioni` — bug fixato v4.6.0)
  - `civic_reports`
  - `civic_config`
  - `gaming_rewards_config`
  - `wallets`
  - `wallet_transactions`
  - `market_tariffs`
  - `pm_watchlist` (con colonna `comune_id` aggiunta v4.6.0)
  - `market_transgressions`
  - `sanctions`
  - `domande_spunta` (usa `mercato_id` NON `market_id`)
  - `vendor_presences`
  - `market_sessions`
  - `collaboratori_impresa`
  - `referrals`
  - `notifiche`
  - Ci sono tabelle aggiuntive non nel blueprint?

- [ ] **Verifica indici** — Ci sono indici sulle colonne principali?

- [ ] **Verifica funzioni/trigger** — Ci sono stored procedure o trigger?

### 3. OUTPUT RICHIESTO

Crea un file `SYSTEM_INVENTORY_BACKEND.md` con:
1. Lista completa file route con conteggio endpoint
2. Lista completa tabelle DB con conteggio righe e colonne
3. Discrepanze rispetto al blueprint
4. File/tabelle presenti ma non documentati
5. File/tabelle documentati ma mancanti
6. Stato PM2 e logs recenti
7. Variabili d'ambiente (solo nomi)

---

## RISULTATI INVENTARIO FRONTEND (per riferimento)

L'inventario frontend è completato. Risultati principali:

**Compliance blueprint: ~85%**
- 36/37 file menzionati nel blueprint esistono
- ~60 componenti extra non documentati (crescita organica)
- 200+ file TypeScript/TSX totali
- 36 pagine, 142 componenti, 30+ route
- 1 discrepanza di path (MarketCompaniesTab)
- 2-4 componenti pianificati ma non implementati

**Il file completo è**: `SYSTEM_INVENTORY_FRONTEND.md` nella repo `dms-hub-app-new`

---

## OBIETTIVO FINALE

Una volta che entrambi gli inventari sono completi, aggiorneremo il `MASTER_BLUEPRINT_MIOHUB.md` per:
1. Documentare i ~60 componenti frontend non documentati
2. Correggere le discrepanze trovate
3. Aggiungere eventuali route/tabelle backend non documentate
4. Avere UN UNICO documento master che riflette la realtà del sistema al 100%

---

*Messaggio generato dalla sessione Claude Code Frontend — 14 Febbraio 2026*
