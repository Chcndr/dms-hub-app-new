# RESTORE POINT v9.9.5-stable

**Data:** 24 Aprile 2026
**Autore:** Manus AI
**Stato:** VERIFICATO E ALLINEATO

---

## Stato Sistema v9.9.5-stable

| Sistema | Stato | Commit / Dettaglio |
|---|---|---|
| GitHub frontend | Allineato | `03d3841` |
| GitHub backend | Allineato | `c1b5f45` |
| Vercel | HTTP 200 (0.20s) | Autodeploy |
| Hetzner | HTTP 200 (2.09s) | Autodeploy |
| Neon DB | Online (3895ms) | 173 tabelle |

---

## Commit Esatti per Ripristino

```
Frontend (dms-hub-app-new):  03d3841 - docs: aggiorna blueprint a v9.9.5
Backend (mihub-backend-rest): c1b5f45 - docs: aggiorna blueprint a v9.9.5
```

---

## Health Check Verificato

- **Vercel Frontend:** HTTP 200 — Online
- **Hetzner Backend API:**
  - `/api/health` → HTTP 200
  - `/api/comuni` → 13 comuni registrati
  - `/api/comuni/1/billing-summary` → HTTP 200 (fatturazione attiva)
  - `/api/suap/stats` → HTTP 200 (SUAP attivo)
- **Neon DB:** 173 tabelle, connessione OK

---

## Inventario Completo Database (173 tabelle)

### Tabelle Core (20)
`comuni`, `users`, `user_roles`, `user_role_assignments`, `permissions`, `role_permissions`, `user_sessions`, `login_attempts`, `ip_blacklist`, `security_events`, `security_delegations`, `api_keys`, `api_metrics`, `secrets`, `secrets_meta`, `secure_credentials`, `audit_logs`, `system_events`, `system_logs`, `extended_users`

### Tabelle Mercati e Posteggi (14)
`markets`, `market_settings`, `market_tariffs`, `market_geometry`, `market_sessions`, `market_session_details`, `market_transgressions`, `stalls`, `concessions`, `concession_payments`, `storico_titolarita_posteggio`, `vendors`, `vendor_presences`, `vendor_documents`

### Tabelle Imprese e Qualificazioni (12)
`imprese`, `impresa_giustificazioni`, `impresa_hub_markets`, `collaboratori_impresa`, `qualificazioni`, `qualification_types`, `enterprise_employees`, `enterprise_qualifications`, `regolarita_imprese`, `dms_companies`, `dms_durc_snapshots`, `adempimenti_tipo_impresa`

### Tabelle SUAP (10)
`suap_pratiche`, `suap_checks`, `suap_documenti`, `suap_eventi`, `suap_azioni`, `suap_decisioni`, `suap_regole`, `suap_pratica_messaggi`, `dms_suap_instances`, `domande_spunta`

### Tabelle Fatturazione e Billing (5)
`comune_fatture`, `billing_dettaglio_fattura`, `billing_tariffe`, `comune_contratti`, `comune_utenti`

### Tabelle Wallet e TCC (14)
`wallets`, `wallet_transactions`, `wallet_history`, `wallet_scadenze`, `wallet_notifications`, `wallet_balance_snapshots`, `wallet_associazione`, `transazioni_wallet_associazione`, `operator_daily_wallet`, `operator_transactions`, `tcc_daily_limits`, `tcc_fraud_events`, `tcc_idempotency_keys`, `tcc_qr_tokens`, `tcc_rate_limits`, `tcc_rewards_config`

### Tabelle HUB e Vetrine (4)
`hub_locations`, `hub_services`, `hub_shops`, `shops`

### Tabelle Associazioni (8)
`associazioni`, `contratti_associazione`, `fatture_associazione`, `pagine_associazione`, `servizi_associazioni`, `tesseramenti_associazione`, `utenti_associazione`, `bandi_associazioni`, `bandi_catalogo`

### Tabelle Segnalazioni e Sanzioni (5)
`civic_reports`, `civic_config`, `sanctions`, `inspections`, `inspections_detailed`, `infraction_types`, `violations`

### Tabelle Mobilità e GIS (7)
`mobility_data`, `mobility_checkins`, `gtfs_routes`, `gtfs_stops`, `custom_areas`, `custom_markers`, `dima_mappe`

### Tabelle Gaming e Sostenibilità (8)
`gaming_challenges`, `gaming_rewards_config`, `challenge_participations`, `ecocredits`, `carbon_footprint`, `carbon_credits_config`, `carbon_credits_rules`, `sustainability_metrics`

### Tabelle AI e Agenti (9)
`agents`, `agent_brain`, `agent_context`, `agent_conversations`, `agent_messages`, `agent_projects`, `agent_screenshots`, `agent_tasks`, `mio_agent_logs`

### Tabelle Formazione (3)
`formazione_corsi`, `formazione_enti`, `formazione_iscrizioni`

### Tabelle Notifiche e Webhook (6)
`notifications`, `notifiche`, `notifiche_destinatari`, `wallet_notifications`, `webhooks`, `webhook_logs`, `zapier_webhook_logs`

### Tabelle Viste e Altro (12)
`v_burn_rate_by_comune`, `v_enterprise_compliance`, `v_fund_stats_by_comune`, `v_tcc_circulation_by_comune`, `v_top_merchants_by_comune`, `access_logs`, `bookings`, `business_analytics`, `data_bag`, `documents`, `products`, `product_tracking`

### Tabelle Backup (5)
`agent_logs_backup_20251204_174125`, `agent_messages_backup_20251204_174125`, `carbon_credits_config_backup_20260203`, `carbon_credits_rules_backup_20260203`, `civic_config_backup_20260203`

---

## Changelog v9.8.5 → v9.9.5

### v9.9.0 — Sistema Fatturazione Automatica
- Backend: billing routes, tariffe configurabili, summary, genera fattura
- Frontend: dashboard fatturazione nel ComuniPanel

### v9.9.1 — Fix Mismatch API Fatturazione
- Fix frontend-backend billing API alignment

### v9.9.2 — Fix Decimali e Input Focus
- Fix decimali a 2 cifre, input tariffe onBlur, SQL query billing

### v9.9.3 — Voci Disattivate Billing
- Voci disattivate mostrate in grigio con label "disattivata"

### v9.9.4 — PDF Fatture + Totali Dettaglio
- Backend: endpoint `GET /api/comuni/fatture/:id/pdf` con pdfkit
- Frontend: riga totali (Imponibile + IVA 22% + Totale) + pulsante "Scarica PDF"

### v9.9.5 — Bugfix Billing, SCIA, iPad, SUAP
- Backend: billing negozi match via `city LIKE` per suffisso provincia
- Backend: esclusi hub di mercato dal conteggio vetrine
- Backend: fix parametri SQL billing-summary
- Frontend: `parseFloat` su valori monetari (stringhe → numeri)
- Frontend: dropdown SCIA cedente/subentrante click su iPad/Safari
- Frontend: abilita Regolarizzazione/Nega Pratica su pratiche APPROVED

---

## Problemi Noti Rimanenti

1. `DashboardPA.tsx` = ~9.775 righe (refactor complesso)
2. API keys in `VITE_*` visibili nel bundle
3. Auth tokens in localStorage

---

## Istruzioni di Ripristino

```bash
# Frontend (Vercel si aggiorna automaticamente)
cd dms-hub-app-new
git checkout v9.9.5-stable
git push origin v9.9.5-stable:master --force

# Backend (Hetzner)
cd mihub-backend-rest
git checkout v9.9.5-stable
git push origin v9.9.5-stable:master --force

# Database - Opzione 1: Neon Point-in-Time
# 1. Vai su https://console.neon.tech
# 2. Branches > Create Branch > Past data > 24 Apr 2026

# Database - Opzione 2: Da backup SQL (se disponibile)
# 1. Scarica backup da https://github.com/Chcndr/miohub-backups
# 2. psql "postgresql://..." < backup_miohub_v9.9.5_*.sql
```
