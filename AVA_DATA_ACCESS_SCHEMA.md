# AVA — Schema di Accesso ai Dati per Ruolo Utente

**Versione**: 1.0  
**Data**: 1 Marzo 2026  
**Autore**: Manus  
**Per revisione**: Claude (Frontend) + Team

---

## 1. Principio Fondamentale

> **Ogni utente vede SOLO i dati che gli competono.**  
> - **PA (Funzionario)**: vede TUTTI i dati del proprio Comune (filtro `comune_id`)  
> - **Impresa**: vede SOLO i propri dati aziendali (filtro `impresa_id`)  
> - **Cittadino**: vede SOLO dati pubblici e i propri dati personali (filtro `user_id`)  
> - **Super Admin**: vede tutto (nessun filtro)

---

## 2. Categorizzazione delle 171 Tabelle

Le tabelle sono raggruppate in **16 aree funzionali**. Per ogni area è indicato il filtro di accesso per ruolo.

---

### AREA 1: MERCATI E POSTEGGI (6 tabelle)

Dati strutturali dei mercati, posteggi e configurazioni.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `markets` | 3 | `comune_id` | Solo mercati dove ha concessione | Solo dati pubblici (nome, giorni, posizione) | Tabella centrale |
| `stalls` | 583 | `comune_id` (via markets) | Solo posteggi assegnati | NO | Contiene geometria GIS |
| `market_settings` | 3 | `market_id` del comune | NO | NO | Orari e regole |
| `market_tariffs` | 0 | `market_id` del comune | Solo propri costi | NO | Costo al mq |
| `market_geometry` | 2 | `market_id` del comune | NO | NO | Dati GIS mappa |
| `custom_areas` / `custom_markers` | 0 | `market_id` del comune | NO | NO | Personalizzazioni mappa |

---

### AREA 2: IMPRESE E ANAGRAFICA (5 tabelle)

Dati anagrafici delle imprese e dei loro collaboratori.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `imprese` | 34 | `comune_id` | Solo `WHERE id = impresa_id` (la propria) | NO | 50 colonne, anagrafica completa |
| `vendors` | 15 | `comune_id` | Solo `WHERE impresa_id = X` | NO | Collegamento legacy |
| `collaboratori_impresa` | 3 | `comune_id` (via imprese) | Solo `WHERE impresa_id = X` | NO | Dipendenti autorizzati |
| `dms_companies` | 3 | Tutti | NO | NO | Dati da Camera di Commercio |
| `enterprise_employees` | 0 | `comune_id` (via vendors) | Solo propri | NO | Dipendenti legacy |

---

### AREA 3: CONCESSIONI (4 tabelle)

Concessioni di posteggio, storico titolarità e pagamenti concessione.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `concessions` | 43 | `comune_id` | Solo `WHERE impresa_id = X` | NO | 74 colonne! Tabella molto ricca |
| `storico_titolarita_posteggio` | 14 | `comune_id` | Solo dove `cedente_impresa_id` o `subentrante_impresa_id = X` | NO | Subingressi e cessioni |
| `concession_payments` | 0 | `comune_id` (via concessions) | Solo propri | NO | Pagamenti concessione |
| `domande_spunta` | 33 | `mercato_id` del comune | Solo `WHERE impresa_id = X` | NO | Richieste spunta |

---

### AREA 4: PRESENZE E SESSIONI MERCATO (5 tabelle)

Dati operativi delle giornate di mercato.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `market_sessions` | 424 | `market_id` del comune | Solo mercati dove opera | NO | Sessioni giornaliere |
| `market_session_details` | 1113 | `session_id` del comune | Solo `WHERE impresa_id = X` | NO | Dettaglio per posteggio |
| `vendor_presences` | 54 | `market_id` del comune | Solo `WHERE impresa_id = X` | NO | Check-in/out operatori |
| `graduatoria_presenze` | 53 | `market_id` del comune | Solo `WHERE impresa_id = X` | NO | Classifica presenze |
| `impresa_giustificazioni` | 8 | `comune_id` | Solo `WHERE impresa_id = X` | NO | Giustificazioni assenze |

---

### AREA 5: WALLET E PAGAMENTI (8 tabelle)

Sistema finanziario: wallet, scadenze, transazioni, canone unico.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `wallets` | 95 | `comune_id` | Solo `WHERE company_id = X` | NO | Wallet principale |
| `wallet_scadenze` | 86 | via `wallets.comune_id` | Solo propri wallet | NO | Rate canone unico |
| `wallet_transactions` | 1424 | via `wallets.comune_id` | Solo propri wallet | NO | Movimenti |
| `wallet_history` | 163 | via `wallets` | Solo `WHERE impresa_id = X` | NO | Storico eventi wallet |
| `wallet_balance_snapshots` | 0 | via `wallets` | Solo propri | NO | Snapshot mensili |
| `wallet_notifications` | 4 | NO | Solo `WHERE user_id = X` | Solo propri | Notifiche pagamento |
| `impostazioni_mora` | 3 | `comune_id` | NO (solo lettura mora applicata) | NO | Config mora del comune |
| `operator_daily_wallet` | 28 | `comune_id` (via impresa) | Solo `WHERE impresa_id = X` | NO | Riepilogo giornaliero |

---

### AREA 6: SANZIONI E CONTROLLI (6 tabelle)

Verbali, sanzioni, infrazioni e trasgressioni.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `sanctions` | 23 | `comune_id` (via markets) | Solo `WHERE impresa_id = X` | NO | Sanzioni emesse |
| `inspections` | 2 | Tutti del comune | Solo `WHERE business_id = X` | NO | Ispezioni |
| `inspections_detailed` | 0 | `comune_id` (via stalls) | Solo propri | NO | Dettaglio ispezioni |
| `infraction_types` | 20 | Tutti (tabella di lookup) | Tutti (informativa) | NO | Tipi di infrazione |
| `market_transgressions` | 84 | `market_id` del comune | Solo `WHERE business_id = X` | NO | Trasgressioni mercato |
| `violations` | 0 | via inspections | Solo propri | NO | Violazioni |

---

### AREA 7: SUAP E PRATICHE (7 tabelle)

Sistema Unico Attività Produttive: pratiche, checks, decisioni.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `suap_pratiche` | 28 | `mercato_id` del comune | Solo `WHERE impresa_id = X` | NO | 76 colonne! Pratiche SUAP |
| `suap_checks` | 450 | via `suap_pratiche` | Solo proprie pratiche | NO | Verifiche automatiche |
| `suap_decisioni` | 41 | via `suap_pratiche` | Solo proprie pratiche | NO | Esiti |
| `suap_eventi` | 89 | via `suap_pratiche` | Solo proprie pratiche | NO | Timeline eventi |
| `suap_documenti` | 0 | via `suap_pratiche` | Solo proprie pratiche | NO | Documenti allegati |
| `suap_pratica_messaggi` | 13 | via `suap_pratiche` | Solo proprie pratiche | NO | Chat pratica |
| `suap_azioni` / `suap_regole` | 0 | Solo PA | NO | NO | Config regole SUAP |
| `dms_suap_instances` | 1 | Tutti del comune | Solo propri | NO | Istanze DMS |

---

### AREA 8: AUTORIZZAZIONI E QUALIFICHE (5 tabelle)

Documenti, DURC, qualifiche professionali.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `autorizzazioni` | 4 | `comune_id` | Solo `WHERE impresa_id = X` | NO | Autorizzazioni commercio |
| `qualificazioni` | 56 | via `imprese.comune_id` | Solo `WHERE impresa_id = X` | NO | Certificati (HACCP, ecc.) |
| `regolarita_imprese` | 20 | via `imprese.comune_id` | Solo `WHERE impresa_id = X` | NO | DURC, regolarità |
| `qualification_types` | 10 | Tutti (lookup) | Tutti (informativa) | NO | Tipi qualifica |
| `enterprise_qualifications` | 0 | via vendors/comune | Solo propri | NO | Qualifiche enterprise |
| `dms_durc_snapshots` | 0 | Tutti | Solo propri | NO | Snapshot DURC |

---

### AREA 9: NOTIFICHE E COMUNICAZIONI (3 tabelle)

Sistema notifiche tra PA, imprese e sistema.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `notifiche` | 482 | `comune_id` | Solo `WHERE impresa_id = X` | Solo proprie | Notifiche inviate |
| `notifiche_destinatari` | 982 | via `notifiche.comune_id` | Solo `WHERE impresa_id = X` | NO | Stato lettura |
| `wallet_notifications` | 4 | NO | Solo proprie | Solo proprie | Notifiche wallet |

---

### AREA 10: ASSOCIAZIONI E SERVIZI (8 tabelle)

Associazioni di categoria, tesseramenti, servizi.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `associazioni` | 2 | Tutte | Solo la propria (se tesserata) | NO | Anagrafica associazioni |
| `bandi_associazioni` | 5 | Tutti | Solo propria associazione | NO | Profili associazioni |
| `tesseramenti_associazione` | 9 | Tutti del comune | Solo `WHERE impresa_id = X` | NO | Tessere attive |
| `servizi_associazioni` | 26 | Tutti | Solo della propria associazione | NO | Catalogo servizi |
| `richieste_servizi` | 14 | Tutti del comune | Solo `WHERE impresa_id = X` | NO | Richieste servizi |
| `contratti_associazione` | 0 | Tutti | NO | NO | Contratti |
| `fatture_associazione` | 0 | Tutti | NO | NO | Fatture |
| `wallet_associazione` | 1 | Tutti | NO | NO | Saldo associazione |

---

### AREA 11: FORMAZIONE (3 tabelle)

Corsi di formazione, enti, iscrizioni.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `formazione_enti` | 6 | Tutti | Tutti (catalogo pubblico) | Tutti | Enti formativi |
| `formazione_corsi` | 8 | Tutti | Tutti (catalogo pubblico) | Tutti | Corsi disponibili |
| `formazione_iscrizioni` | 15 | Tutti del comune | Solo `WHERE impresa_id = X` | NO | Iscrizioni ai corsi |

---

### AREA 12: CARBON CREDIT E SOSTENIBILITA' (12 tabelle)

TCC (Token Carbon Credit), mobilità, segnalazioni civiche, gaming.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `carbon_credits_config` | 1 | `comune_id` | NO | NO | Config TCC |
| `carbon_credits_rules` | 3 | `comune_id` | NO | NO | Regole TCC |
| `fund_transactions` | 31 | `comune_id` | NO | NO | Transazioni fondo |
| `operator_transactions` | 38 | `comune_id` | Solo proprie | Solo proprie | Transazioni operatore |
| `civic_reports` | 46 | `comune_id` | NO | Solo `WHERE user_id = X` | Segnalazioni civiche |
| `civic_config` | 5 | `comune_id` | NO | NO | Config segnalazioni |
| `mobility_checkins` | 13 | `comune_id` | NO | Solo `WHERE user_id = X` | Check-in mobilità |
| `cultural_visits` | 18 | `comune_id` | NO | Solo `WHERE user_id = X` | Visite culturali |
| `gaming_challenges` | 4 | `comune_id` | NO | Tutti attivi | Sfide gamification |
| `gaming_rewards_config` | 9 | `comune_id` | NO | NO | Config premi |
| `transactions` (TCC) | 126 | `comune_id` (via shops) | Solo proprie | Solo `WHERE user_id = X` | Transazioni TCC |
| `checkins` | 0 | `comune_id` (via markets) | NO | Solo `WHERE user_id = X` | Check-in mercato |

---

### AREA 13: COMUNI E AMMINISTRAZIONE (7 tabelle)

Dati del comune, settori, contratti, fatture.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `comuni` | 9 | Solo il proprio | Solo il proprio (dati pubblici) | Solo dati pubblici | Anagrafica comune |
| `settori_comune` | 94 | `comune_id` | NO | NO | Uffici e settori |
| `comune_utenti` | 2 | `comune_id` | NO | NO | Utenti del comune |
| `comune_contratti` | 0 | `comune_id` | NO | NO | Contratti SaaS |
| `comune_fatture` | 0 | `comune_id` | NO | NO | Fatture SaaS |
| `province` | 107 | Tutte (lookup) | Tutte | Tutte | Dati geografici |
| `regioni` | 20 | Tutte (lookup) | Tutte | Tutte | Dati geografici |

---

### AREA 14: UTENTI E SICUREZZA (15 tabelle)

Gestione utenti, ruoli, sessioni, sicurezza. **AVA NON deve MAI esporre dati sensibili di sicurezza.**

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `users` | 11 | Solo utenti del comune | Solo il proprio profilo | Solo il proprio profilo | **MAI esporre password_hash, openId** |
| `user_roles` | 14 | Tutti (lookup) | NO | NO | Ruoli disponibili |
| `user_role_assignments` | 9 | Solo del comune | NO | NO | Assegnazioni ruolo |
| `permissions` | 102 | Solo lettura | NO | NO | Permessi sistema |
| `role_permissions` | 304 | Solo lettura | NO | NO | Permessi per ruolo |
| `user_sessions` | 418 | **NO** | **NO** | **NO** | **VIETATO** — Dati sessione |
| `login_attempts` | 521 | **NO** | **NO** | **NO** | **VIETATO** — Tentativi login |
| `security_events` | 1407 | **NO** | **NO** | **NO** | **VIETATO** — Eventi sicurezza |
| `security_delegations` | 0 | Solo del comune | NO | NO | Deleghe |
| `access_logs` | 3 | **NO** | **NO** | **NO** | **VIETATO** — Log accessi |
| `ip_blacklist` | 0 | **NO** | **NO** | **NO** | **VIETATO** |
| `api_keys` | 0 | **NO** | **NO** | **NO** | **VIETATO** |
| `secrets` / `secrets_meta` | 5/10 | **NO** | **NO** | **NO** | **VIETATO** — Credenziali |
| `secure_credentials` | 9 | **NO** | **NO** | **NO** | **VIETATO** — Credenziali |
| `extended_users` | 5 | Solo del comune | Solo il proprio | Solo il proprio | Profilo esteso |

---

### AREA 15: HUB E LOCAZIONI (4 tabelle)

Hub fisici, negozi, servizi.

| Tabella | Righe | Filtro PA | Filtro Impresa | Filtro Cittadino | Note |
|---------|-------|-----------|----------------|------------------|------|
| `hub_locations` | 79 | Tutti del comune | Solo dove opera | Tutti (pubblici) | Locazioni hub |
| `hub_shops` | 9 | `comune_id` | Solo propri | Tutti (pubblici) | Negozi nell'hub |
| `hub_services` | 0 | via hub del comune | NO | Tutti (pubblici) | Servizi hub |
| `impresa_hub_markets` | 0 | via markets del comune | Solo `WHERE impresa_id = X` | NO | Collegamento impresa-hub |

---

### AREA 16: SISTEMA E INFRASTRUTTURA (28 tabelle)

Tabelle di sistema, log, backup, viste, agent AI. **AVA NON interroga queste tabelle.**

| Tabella | Accesso AVA | Note |
|---------|-------------|------|
| `agent_brain`, `agent_context`, `agent_conversations`, `agent_messages`, `agent_projects`, `agent_screenshots`, `agent_tasks`, `agents` | **NO** | Sistema agenti AI interno |
| `agent_logs_backup_*`, `agent_messages_backup_*` | **NO** | Backup |
| `ai_conversations`, `ai_messages`, `ai_quota_usage` | Solo per gestione chat AVA | Tabelle di AVA stessa |
| `api_metrics`, `mio_agent_logs` | **NO** | Metriche sistema |
| `audit_logs` | Solo PA (proprio comune) | Audit trail |
| `system_events`, `system_logs` | **NO** | Log sistema |
| `webhook_logs`, `webhooks`, `zapier_webhook_logs` | **NO** | Integrazioni |
| `workspace_snapshots`, `data_bag`, `chat_messages_old` | **NO** | Legacy/interno |
| `carbon_credits_config_backup_*`, `civic_config_backup_*` | **NO** | Backup |
| `pm_watchlist` | Solo PA | Watchlist compliance |
| Viste: `v_burn_rate_by_comune`, `v_enterprise_compliance`, `v_fund_stats_by_comune`, `v_tcc_circulation_by_comune`, `v_top_merchants_by_comune` | Solo PA (`comune_id`) | Viste aggregate utili |

---

## 3. Riepilogo Accesso per Ruolo

### PA (Funzionario Comunale)

**Filtro principale**: `comune_id`  
**Può vedere**: Tutto ciò che riguarda il proprio comune.  
**Non può vedere**: Dati di altri comuni, dati di sicurezza/credenziali, log di sistema.

| Area | Accesso | Tabelle principali |
|------|---------|-------------------|
| Mercati e Posteggi | ✅ Completo | markets, stalls, market_settings |
| Imprese | ✅ Tutte del comune | imprese, vendors, collaboratori |
| Concessioni | ✅ Tutte del comune | concessions, storico_titolarita |
| Presenze | ✅ Tutte del comune | vendor_presences, market_sessions, graduatoria |
| Wallet/Pagamenti | ✅ Tutti del comune | wallets, wallet_scadenze, wallet_transactions |
| Sanzioni | ✅ Tutte del comune | sanctions, inspections, market_transgressions |
| SUAP | ✅ Tutte del comune | suap_pratiche, suap_checks, suap_decisioni |
| Autorizzazioni | ✅ Tutte del comune | autorizzazioni, qualificazioni, regolarita |
| Notifiche | ✅ Tutte del comune | notifiche |
| Associazioni | ✅ Tutte | associazioni, tesseramenti |
| Formazione | ✅ Tutte | formazione_corsi, iscrizioni |
| Carbon Credit | ✅ Del comune | config, transactions, fund |
| Amministrazione | ✅ Proprio comune | comuni, settori, contratti |
| Viste Aggregate | ✅ Del comune | v_enterprise_compliance, v_fund_stats |
| Sicurezza | ❌ NO | user_sessions, login_attempts, secrets |

---

### IMPRESA (Operatore Commerciale)

**Filtro principale**: `impresa_id` (ricavato da `users.impresa_id`)  
**Può vedere**: Solo i propri dati aziendali.  
**Non può vedere**: Dati di altre imprese, dati amministrativi del comune, dati di sicurezza.

| Area | Accesso | Cosa vede |
|------|---------|-----------|
| Mercati | ✅ Parziale | Solo mercati dove ha concessione (nome, giorni, posizione) |
| La propria impresa | ✅ Completo | Anagrafica, collaboratori, documenti |
| Le proprie concessioni | ✅ Completo | Stato, scadenze, storico subingressi |
| Le proprie presenze | ✅ Completo | Check-in, graduatoria, giustificazioni |
| Il proprio wallet | ✅ Completo | Saldo, scadenze rate, transazioni, mora |
| Le proprie sanzioni | ✅ Completo | Sanzioni ricevute, stato pagamento |
| Le proprie pratiche SUAP | ✅ Completo | Pratiche, checks, esiti, messaggi |
| Le proprie autorizzazioni | ✅ Completo | DURC, qualifiche, scadenze |
| Le proprie notifiche | ✅ Completo | Notifiche ricevute |
| Associazione (se tesserata) | ✅ Parziale | Servizi, propri tesseramenti |
| Formazione | ✅ Catalogo + proprie iscrizioni | Corsi disponibili, proprie iscrizioni |
| Altre imprese | ❌ NO | Mai dati di altri operatori |
| Amministrazione comune | ❌ NO | Mai dati interni PA |
| Sicurezza | ❌ NO | Mai |

---

### CITTADINO (Utente Generico)

**Filtro principale**: `user_id`  
**Può vedere**: Solo dati pubblici e i propri dati personali.  
**Non può vedere**: Dati di imprese, dati PA, dati finanziari.

| Area | Accesso | Cosa vede |
|------|---------|-----------|
| Mercati | ✅ Solo pubblico | Nome, giorni, posizione (NO posteggi dettaglio) |
| Imprese | ❌ NO | Nessun dato imprese |
| Proprio profilo | ✅ | Nome, email, wallet TCC |
| Segnalazioni civiche | ✅ Solo proprie | civic_reports proprie |
| Mobilità | ✅ Solo proprie | mobility_checkins propri |
| Visite culturali | ✅ Solo proprie | cultural_visits proprie |
| Gaming/Sfide | ✅ Pubbliche | gaming_challenges attive |
| Formazione | ✅ Catalogo | Corsi disponibili (NO iscrizioni imprese) |
| Hub/Negozi | ✅ Pubblico | hub_locations, hub_shops (vetrina) |
| Tutto il resto | ❌ NO | Nessun accesso |

---

## 4. Tabelle VIETATE per AVA (Mai interrogare)

Queste tabelle contengono dati sensibili che AVA non deve MAI leggere né menzionare:

1. `secrets` / `secrets_meta` / `secure_credentials` — Credenziali e chiavi API
2. `user_sessions` — Token di sessione attivi
3. `login_attempts` — Tentativi di accesso
4. `security_events` — Eventi di sicurezza
5. `access_logs` — Log di accesso
6. `ip_blacklist` — IP bloccati
7. `api_keys` / `api_metrics` — Chiavi API e metriche
8. `users.password_hash` / `users.openId` — Mai esporre hash password o Firebase UID
9. Tutte le tabelle `agent_*` — Sistema agenti AI interno
10. Tutte le tabelle `*_backup_*` — Backup

---

## 5. Implementazione Tecnica Proposta

### 5.1 Come AVA riceve il filtro

```
Utente loggato → Firebase JWT → Backend legge:
  - users.id → user_id
  - users.impresa_id → impresa_id (se è un'impresa)
  - user_role_assignments → ruolo + comune_id (se è PA)
```

### 5.2 Logica di query

```javascript
// PA: filtra per comune_id
if (userRole === 'pa') {
  WHERE comune_id = ${comuneId}  // o via JOIN markets/wallets
}

// IMPRESA: filtra per impresa_id
if (userRole === 'impresa') {
  WHERE impresa_id = ${impresaId}  // solo i propri dati
}

// CITTADINO: filtra per user_id
if (userRole === 'cittadino') {
  WHERE user_id = ${userId}  // solo i propri dati
}
```

### 5.3 Cosa iniettare nel prompt di AVA

**Per PA**: "Hai accesso ai dati del Comune di [nome]: mercati, imprese, concessioni, presenze, wallet, sanzioni, SUAP, autorizzazioni, notifiche, formazione, carbon credit."

**Per Impresa**: "Hai accesso ai dati della tua impresa [denominazione]: concessioni, presenze, wallet e rate, sanzioni, pratiche SUAP, autorizzazioni, notifiche, corsi di formazione."

**Per Cittadino**: "Hai accesso ai tuoi dati personali: segnalazioni civiche, mobilità, visite culturali, sfide attive, e informazioni pubbliche sui mercati."

---

## 6. Prossimi Passi

1. **Revisione Claude**: Analizzare questo schema e proporre eventuali integrazioni frontend
2. **Implementazione Backend (Manus)**: Creare `getFilteredQuery(tableName, userRole, userId, impresaId, comuneId)` che applica automaticamente i filtri
3. **Test**: Verificare che un'impresa non possa mai vedere dati di un'altra impresa
4. **Aggiornamento Blueprint**: Integrare questo schema nel MASTER_BLUEPRINT

---

*Documento generato il 1 Marzo 2026 — Per revisione congiunta Manus + Claude*
