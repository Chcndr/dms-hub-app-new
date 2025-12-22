# Inventario Database Neon - DMS Hub Production

**Data**: 22 Dicembre 2025
**Branch**: production
**Database**: neondb
**Totale tabelle**: 68

## Lista Completa Tabelle (ordinate alfabeticamente)

| # | Tabella | Dimensione | Categoria | Note |
|---|---------|------------|-----------|------|
| 1 | agent_brain | 16 kB | Agent/MIO | Sistema agenti AI |
| 2 | agent_context | 24 kB | Agent/MIO | Contesto conversazioni |
| 3 | agent_conversations | 224 kB | Agent/MIO | Conversazioni agenti |
| 4 | agent_logs_backup_20251204_174125 | 280 kB | Backup | ⚠️ Backup vecchio |
| 5 | agent_messages | 1680 kB | Agent/MIO | Messaggi agenti |
| 6 | agent_messages_backup_20251204_174125 | 496 kB | Backup | ⚠️ Backup vecchio |
| 7 | agent_projects | 24 kB | Agent/MIO | Progetti agenti |
| 8 | agent_screenshots | 3904 kB | Agent/MIO | Screenshot agenti (grande!) |
| 9 | agent_tasks | 24 kB | Agent/MIO | Task agenti |
| 10 | agents | 32 kB | Agent/MIO | Configurazione agenti |
| 11 | api_keys | 24 kB | Integrazioni | Chiavi API |
| 12 | api_metrics | 16 kB | Integrazioni | Metriche API |
| 13 | audit_logs | 16 kB | Sistema | Log audit |
| 14 | bookings | 16 kB | Mercati | Prenotazioni |
| 15 | business_analytics | 8192 bytes | Analytics | Analisi business |
| 16 | carbon_credits_config | 16 kB | Sostenibilità | Config crediti carbonio |
| 17 | carbon_footprint | 8192 bytes | Sostenibilità | Impronta carbonio |
| 18 | chat_messages_old | 40 kB | Legacy | ⚠️ Vecchia tabella chat |
| 19 | checkins | 8192 bytes | Mercati | Check-in operatori |
| 20 | civic_reports | 16 kB | Segnalazioni | Report civici |
| 21 | comuni | 48 kB | Anagrafica | ✅ Comuni italiani |
| 22 | concession_payments | 16 kB | Mercati | Pagamenti concessioni |
| 23 | concessions | 112 kB | Mercati | ✅ Concessioni posteggi |
| 24 | custom_areas | 16 kB | Mappe | Aree personalizzate |
| 25 | custom_markers | 16 kB | Mappe | Marker personalizzati |
| 26 | data_bag | 24 kB | Sistema | Storage generico |
| 27 | dms_companies | 80 kB | DMS Legacy | ⚠️ Imprese DMS vecchio |
| 28 | dms_durc_snapshots | 32 kB | DMS Legacy | Snapshot DURC |
| 29 | dms_suap_instances | 96 kB | DMS Legacy | Istanze SUAP |
| 30 | ecocredits | 8192 bytes | Sostenibilità | Eco crediti |
| 31 | enterprise_employees | 40 kB | Imprese | Dipendenti imprese |
| 32 | enterprise_qualifications | 56 kB | Imprese | ⚠️ Qualificazioni (relazione) |
| 33 | extended_users | 8192 bytes | Utenti | Utenti estesi |
| 34 | external_connections | 16 kB | Integrazioni | Connessioni esterne |
| 35 | fund_transactions | 16 kB | Finanza | Transazioni fondi |
| 36 | imprese | 160 kB | Imprese | ✅ Anagrafica imprese |
| 37 | inspections | 16 kB | Controlli | Ispezioni |
| 38 | inspections_detailed | 16 kB | Controlli | Ispezioni dettagliate |
| 39 | market_geometry | 16 kB | Mercati | Geometria mercati |
| 40 | markets | 48 kB | Mercati | ✅ Mercati |
| 41 | mio_agent_logs | 656 kB | Agent/MIO | Log agente MIO |
| 42 | mobility_data | 16 kB | Mobilità | Dati TPER Bologna |
| 43 | notifications | 16 kB | Sistema | Notifiche |
| 44 | product_tracking | 24 kB | Prodotti | Tracciamento prodotti |
| 45 | products | 16 kB | Prodotti | Prodotti |
| 46 | qualification_types | 80 kB | Imprese | ✅ Tipi qualificazione |
| 47 | qualificazioni | 96 kB | Imprese | ✅ Qualificazioni imprese |
| 48 | reimbursements | 8192 bytes | Finanza | Rimborsi |
| 49 | secrets | 32 kB | Sicurezza | Segreti |
| 50 | secrets_meta | 32 kB | Sicurezza | Metadati segreti |
| 51 | secure_credentials | 80 kB | Sicurezza | Credenziali sicure |
| 52 | settori_comune | 64 kB | Anagrafica | ✅ Settori comunali |
| 53 | shops | 16 kB | Mercati | Negozi |
| 54 | stalls | 240 kB | Mercati | ✅ Posteggi mercato |
| 55 | sustainability_metrics | 8192 bytes | Sostenibilità | Metriche sostenibilità |
| 56 | system_events | 24 kB | Sistema | Eventi sistema |
| 57 | system_logs | 16 kB | Sistema | Log sistema |
| 58 | transactions | 16 kB | Finanza | Transazioni |
| 59 | user_analytics | 8192 bytes | Analytics | Analisi utenti |
| 60 | users | 24 kB | Utenti | ✅ Utenti |
| 61 | v_enterprise_compliance | 0 bytes | View | Vista compliance |
| 62 | vendor_documents | 16 kB | Venditori | Documenti venditori |
| 63 | vendor_presences | 16 kB | Venditori | Presenze venditori |
| 64 | vendors | 64 kB | Venditori | ✅ Venditori/Operatori |
| 65 | violations | 16 kB | Controlli | Violazioni |
| 66 | webhook_logs | 16 kB | Integrazioni | Log webhook |
| 67 | webhooks | 16 kB | Integrazioni | Webhook |
| 68 | workspace_snapshots | 432 kB | Agent/MIO | Snapshot workspace |

## Categorie

### ✅ Tabelle Core Attive
- **comuni** - Anagrafica comuni
- **settori_comune** - Settori dei comuni (SUAP, Polizia, Tributi, ecc.)
- **imprese** - Anagrafica imprese
- **qualificazioni** - Qualificazioni delle imprese
- **qualification_types** - Tipi di qualificazione
- **markets** - Mercati
- **stalls** - Posteggi
- **concessions** - Concessioni
- **vendors** - Venditori/Operatori
- **users** - Utenti

### ⚠️ Tabelle Potenzialmente da Rimuovere
- **agent_logs_backup_20251204_174125** - Backup vecchio
- **agent_messages_backup_20251204_174125** - Backup vecchio
- **chat_messages_old** - Vecchia tabella chat
- **dms_companies** - Potrebbe essere duplicato di `imprese`
- **enterprise_qualifications** - Potrebbe essere duplicato di `qualificazioni`

### 📊 Tabelle più Grandi (>100 kB)
1. agent_screenshots - 3904 kB
2. agent_messages - 1680 kB
3. mio_agent_logs - 656 kB
4. agent_messages_backup - 496 kB
5. workspace_snapshots - 432 kB
6. agent_logs_backup - 280 kB
7. stalls - 240 kB
8. agent_conversations - 224 kB
9. imprese - 160 kB
10. concessions - 112 kB

## Note
- Totale spazio stimato: ~10 MB
- Le tabelle agent_* occupano la maggior parte dello spazio
- Ci sono backup vecchi che potrebbero essere eliminati
- Alcune tabelle potrebbero essere duplicate (dms_companies vs imprese)
