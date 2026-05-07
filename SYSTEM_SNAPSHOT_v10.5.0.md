# SYSTEM SNAPSHOT v10.5.0 — 08 Maggio 2026

## Punto di Ripristino Stabile

### Tag Git
| Repo | Tag | SHA |
|------|-----|-----|
| `dms-hub-app-new` (frontend) | `v10.5.0-stable` | `d454669` |
| `mihub-backend-rest` (backend) | `v10.5.0-stable` | `dc61c91` |

### Deploy Attivi
| Sistema | Stato | Dettagli |
|---------|-------|----------|
| **Vercel** (frontend) | ✅ Attivo | dms-hub-app-new.vercel.app — autodeploy da master |
| **Hetzner** (backend) | ✅ Attivo | api.mio-hub.me — PM2 autodeploy via webhook |
| **Neon** (database) | ✅ Integro | PostgreSQL — ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech |

### Database Neon — Stato
| Tabella | Record | Note |
|---------|--------|------|
| `vendor_presences` | 41 | Presenze attive oggi |
| `graduatoria_presenze` | 85 | Graduatoria spunta |
| `market_session_details` | 2178 | Storico presenze (con colonna `stato_presenza`) |
| `market_sessions` | 591 | 225 CHIUSO + 366 completata |

### stato_presenza Breakdown
| Stato | Record |
|-------|--------|
| `presente` | 869 |
| `rinunciato` | 54 |
| `saldo_negativo` | 17 |
| `NULL` (pre-migrazione) | ~1238 |

### Integrità
- ✅ Zero fantasmi CONCESSION stall_id=NULL
- ⚠️ 79 duplicati in market_session_details (sessioni test 06/05 — non impattanti)
- ✅ Endpoint dettaglio sessione non aggrega più cross-sessione

### Come Ripristinare
```bash
# Frontend
cd dms-hub-app-new
git checkout v10.5.0-stable

# Backend
cd mihub-backend-rest
git checkout v10.5.0-stable
```

### Modifiche incluse in v10.5.0
1. Fix sfarfallamento mappa spunta PA (autoPan=false + StallCenterController disabled)
2. Pulsanti Rinuncia Spunta (card ATTESA SPUNTA + lista posteggi SpuntaNotifier)
3. stato_presenza nello storico presenze (colonna DB + badge frontend)
4. Popup SALDO INSUFFICIENTE alla scelta posteggio spunta
5. Protezione SPUNTA_TERMINATA non sovrascrive popup ultimo spuntista
6. Fix storico aggregazione sessioni (rimosso fallback allSessionIds)
7. Ritardo 3s broadcast SPUNTA_TERMINATA backend
8. Health endpoint version bump 10.5.0
