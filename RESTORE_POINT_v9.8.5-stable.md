# RESTORE POINT v9.8.5-stable

> **Data:** 11 Marzo 2026, ore 00:45 CET
> **Stato:** STABILE — Tutti i sistemi allineati e verificati
> **Creato da:** Manus

---

## Stato Completo del Sistema

### GitHub Repositories

| Repository | Branch | Commit | Hash |
|---|---|---|---|
| `dms-hub-app-new` (frontend) | master (unico) | docs: aggiorna blueprint a v9.8.5 | `0c12b66` |
| `mihub-backend-rest` (backend) | master (unico) | docs: aggiorna blueprint a v9.8.5 | `2bbca23` |

Nessun branch secondario attivo. Repo puliti.

### Deploy

| Sistema | URL | Stato | Commit |
|---|---|---|---|
| Vercel (frontend) | https://dms-hub-app-new.vercel.app | HTTP 200, 0.28s | `0c12b66` autodeploy |
| Hetzner (backend) | https://api.mio-hub.me | Online, uptime 752s | `de45517` + `2bbca23` autodeploy |
| Neon DB | ep-bold-silence-adftsojg-pooler | Online, latenza 107ms | Stabile |

### Health Check Completo

| Servizio | Stato |
|---|---|
| Backend Hetzner | OK (4ms) |
| Database Neon | OK (107ms) |
| Frontend Vercel | OK (198ms) |
| Guardian Service | OK (117ms) |
| AVA (AI Chat) | OK (717ms) — Ollama online, 3 modelli |
| MIO Agent | OK (823ms) — 5 agenti attivi |
| Storage S3 | Disabilitato |
| PDND API | Non configurato (warning noto) |

### Database Neon — Inventario Tabelle Principali

| Tabella | Righe | Note |
|---|---|---|
| mio_agent_logs | 75.569 | Log sistema (62 errori dopo pulizia) |
| gtfs_stops | 23.930 | Fermate trasporto pubblico |
| mobility_data | 9.554 | Dati mobilità |
| api_metrics | 5.966 | Metriche API |
| agent_messages | 4.209 | Messaggi agenti MIO |
| security_events | 1.694 | Eventi sicurezza |
| wallet_transactions | 1.541 | Transazioni wallet |
| market_session_details | 1.279 | Dettagli sessioni mercato |
| cultural_pois | 1.127 | Punti di interesse culturali |
| audit_logs | 1.094 | Log audit |
| notifiche_destinatari | 1.011 | Destinatari notifiche |
| stalls | 820 | Posteggi mercato |
| user_sessions | 711 | Sessioni utente |
| notifiche | 560 | Notifiche |
| login_attempts | 521 | Tentativi login |
| suap_checks | 462 | Controlli SUAP |
| market_sessions | 430 | Sessioni mercato |
| agent_conversations | 415 | Conversazioni agenti |
| markets | 4 | Mercati attivi |
| vendors | 16 | Operatori |
| concessions | 57 | Concessioni |
| users | 11 | Utenti sistema |
| ai_conversations | 37 | Conversazioni AI chat |
| ai_messages | 129 | Messaggi AI chat |

**Totale tabelle:** 156 (di cui ~80 con dati, ~76 vuote/predisposte)

---

## Changelog v9.8.1 → v9.8.5

| Versione | Data | Descrizione | File modificati |
|---|---|---|---|
| v9.8.1 | 10 Mar 2026 | Pulizia produzione: rimosso debug console.log, lazy loading, Guardian polling normalizzato | 8 file frontend |
| v9.8.2 | 10 Mar 2026 | AbortController su tutti i useEffect con fetch | 18 file frontend |
| v9.8.3 | 10 Mar 2026 | React.memo su 54 componenti | 54 file frontend |
| v9.8.4 | 11 Mar 2026 | Filtro bot/scanner + rate limit log ripetitivi | 2 file backend (apiLogger.js, logs.js) |
| v9.8.5 | 11 Mar 2026 | IndexedDB reconnect robusto per Safari | 1 file frontend (dmsBus.ts) |

---

## Problemi Noti Rimanenti

| Problema | Severità | Stato |
|---|---|---|
| DashboardPA.tsx = 9.775 righe | Media | Da refactorare (complesso) |
| API keys in `VITE_*` visibili nel bundle | Bassa | Da spostare server-side |
| Auth tokens in localStorage | Bassa | Da migrare a httpOnly cookies |
| `/api/tcc/v2/fraud/*` → 404 | Bassa | Endpoint non ancora implementati |
| `/api/integrations/*` → 404 | Bassa | Endpoint non ancora implementati |
| Leaflet `removeLayer` null error | Bassa | Bug map cleanup (10 occorrenze) |
| PDND API non configurato | Info | Non ancora necessario |

---

## Come Ripristinare

### Frontend
```bash
cd dms-hub-app-new
git reset --hard 0c12b66
git push origin master --force
# Vercel farà autodeploy
```

### Backend
```bash
cd mihub-backend-rest
git reset --hard 2bbca23
git push origin master --force
# Hetzner farà autodeploy via PM2/webhook
```

### Database
Il database Neon ha snapshot automatici. Per ripristino manuale:
- Neon Dashboard → Project → Branches → Restore to timestamp
- Timestamp di riferimento: `2026-03-11T00:45:00Z`

---

> **Questo restore point è stato verificato con:**
> - Health check completo su tutti i servizi
> - Query diretta al database per conteggio tabelle
> - Verifica commit allineati su entrambi i repo GitHub
> - Test HTTP su frontend Vercel e backend Hetzner
> - Pulizia errori bot/scanner completata (885 → 62)
