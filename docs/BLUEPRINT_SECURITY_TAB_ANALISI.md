# 📘 Blueprint Security Tab - Analisi e Piano di Implementazione

**Data:** 9 Gennaio 2026  
**Versione:** 1.0  
**Autore:** Manus AI Agent  
**Stato:** 🔴 CRITICO - Richiede intervento

---

## 1. Executive Summary

Questo documento analizza lo stato attuale dell'implementazione del Security Tab per il sistema MIO HUB e identifica i problemi critici che devono essere risolti prima di procedere.

### 🚨 Situazione Critica Identificata

| Aspetto                  | Stato             | Problema                                     |
| ------------------------ | ----------------- | -------------------------------------------- |
| **Tabelle nel Database** | ✅ Esistono       | 11 tabelle security create nel DB Neon       |
| **Schema Drizzle**       | ❌ Non allineato  | Le tabelle NON sono definite nello schema.ts |
| **Repository GitHub**    | ❌ Non aggiornato | Modifiche fatte localmente, non committate   |
| **Servizi Backend**      | ⚠️ Parziali       | Creati ma non testabili per mancanza schema  |
| **Test**                 | ❌ Falliscono     | Import schema restituisce `undefined`        |

### Causa Radice

Le tabelle security sono state create **direttamente nel database via SQL** invece di seguire il workflow corretto:

1. Definire tabelle in `drizzle/schema.ts`
2. Eseguire `pnpm db:push` (drizzle-kit generate && drizzle-kit migrate)
3. Commit e push su GitHub
4. Auto-deploy aggiorna il server

---

## 2. Stato Attuale del Database

### 2.1 Tabelle Security Esistenti nel Database Neon

Le seguenti 11 tabelle sono state create nel database ma **non sono nello schema Drizzle**:

| #   | Tabella                   | Record | Note                          |
| --- | ------------------------- | ------ | ----------------------------- |
| 1   | `user_roles`              | 14     | I 14 ruoli utente predefiniti |
| 2   | `permissions`             | 59     | Tutti i permessi granulari    |
| 3   | `role_permissions`        | 155    | Matrice ruoli-permessi        |
| 4   | `user_role_assignments`   | 0      | Pronta per assegnazioni       |
| 5   | `user_sessions`           | 0      | Gestione sessioni             |
| 6   | `access_logs`             | ?      | Log accessi                   |
| 7   | `security_events`         | 0      | Eventi sicurezza              |
| 8   | `login_attempts`          | 0      | Tentativi login               |
| 9   | `ip_blacklist`            | 0      | IP bloccati                   |
| 10  | `compliance_certificates` | 0      | Certificati GDPR              |
| 11  | `delegations`             | 0      | Deleghe utenti                |

### 2.2 Enum PostgreSQL Creati

Sono stati creati 8 enum PostgreSQL nel database:

- `user_role_type` (14 valori)
- `sector` (7 valori)
- `severity` (4 valori)
- `security_event_type` (7 valori)
- `permission_scope` (6 valori)
- `territory_type` (5 valori)
- `device_type` (4 valori)
- `access_action_type` (7 valori)

---

## 3. Stato del Repository GitHub

### 3.1 Schema Drizzle Originale

Il file `/drizzle/schema.ts` nel repository GitHub ha:

- **1016 righe** totali
- **~58 tabelle** definite
- **NESSUNA** delle tabelle security

### 3.2 File Modificati Localmente (Non Committati)

I seguenti file sono stati creati/modificati nella sandbox ma **NON sono su GitHub**:

```
server/services/rbacService.ts       (~450 righe)
server/services/sessionService.ts    (~350 righe)
server/services/securityEventService.ts (~400 righe)
server/middleware/rbacMiddleware.ts  (~250 righe)
drizzle/schema.ts                    (+329 righe aggiunte)
```

---

## 4. Analisi del Problema

### 4.1 Perché i Test Falliscono

```
Total schema exports: 22  (dovrebbero essere ~80+)
Security-related: []      (dovrebbero essere ~15)
```

**Causa:** Vitest importa lo schema dal repository GitHub, che non contiene le definizioni delle tabelle security. Le tabelle esistono nel database ma Drizzle ORM non le conosce.

### 4.2 Disallineamento Database ↔ Schema

```
┌─────────────────────┐     ┌─────────────────────┐
│   DATABASE NEON     │     │   SCHEMA DRIZZLE    │
│                     │     │                     │
│ ✅ user_roles       │     │ ❌ non definita     │
│ ✅ permissions      │     │ ❌ non definita     │
│ ✅ security_events  │     │ ❌ non definita     │
│ ✅ ip_blacklist     │     │ ❌ non definita     │
│ ...                 │     │ ...                 │
└─────────────────────┘     └─────────────────────┘
```

---

## 5. Opzioni di Risoluzione

### Opzione A: Aggiungere Tabelle allo Schema (CONSIGLIATA)

**Procedura:**

1. Aggiungere le definizioni delle tabelle a `drizzle/schema.ts`
2. **NON** eseguire `pnpm db:push` (le tabelle esistono già)
3. Commit e push su GitHub
4. I servizi backend potranno usare le tabelle

**Pro:**

- Mantiene le tabelle e i dati esistenti
- Allinea schema e database
- Approccio pulito

**Contro:**

- Richiede attenzione per non sovrascrivere dati

### Opzione B: Cancellare e Rifare da Zero

**Procedura:**

1. Eliminare le tabelle dal database
2. Eliminare gli enum dal database
3. Aggiungere le definizioni a `drizzle/schema.ts`
4. Eseguire `pnpm db:push` per creare tutto da zero
5. Commit e push su GitHub

**Pro:**

- Workflow pulito e corretto
- Nessun rischio di disallineamento

**Contro:**

- Perdita dei dati inseriti (14 ruoli, 59 permessi, 155 mappature)
- Più tempo per reimplementare

### Opzione C: Usare SQL Raw (SCONSIGLIATA)

**Procedura:**

- Usare query SQL dirette invece di Drizzle ORM

**Pro:**

- Funziona subito

**Contro:**

- Non elegante
- Non type-safe
- Difficile da mantenere
- Contro le best practice del progetto

---

## 6. Piano di Azione Raccomandato

### Fase 1: Preparazione (30 min)

1. **Backup dei dati esistenti**

   ```sql
   -- Esportare i dati delle tabelle security
   COPY user_roles TO '/tmp/user_roles.csv' CSV HEADER;
   COPY permissions TO '/tmp/permissions.csv' CSV HEADER;
   COPY role_permissions TO '/tmp/role_permissions.csv' CSV HEADER;
   ```

2. **Verificare la struttura esatta delle tabelle nel DB**
   ```sql
   \d user_roles
   \d permissions
   -- etc.
   ```

### Fase 2: Aggiornamento Schema (1 ora)

1. Clonare il repository fresco da GitHub
2. Aggiungere le definizioni delle tabelle a `schema.ts`
3. Verificare che le definizioni corrispondano esattamente alle tabelle esistenti
4. **NON eseguire db:push** (le tabelle esistono già)

### Fase 3: Test e Validazione (30 min)

1. Eseguire i test per verificare che lo schema sia corretto
2. Verificare che i servizi possano accedere alle tabelle

### Fase 4: Commit e Deploy (15 min)

1. Commit delle modifiche
2. Push su GitHub
3. Verificare l'auto-deploy

---

## 7. Struttura Tabelle da Aggiungere allo Schema

### 7.1 Enum da Definire

```typescript
// Enum per i 14 ruoli utente
export const userRoleTypeEnum = pgEnum("user_role_type", [
  "super_admin",
  "admin_pa",
  "suap_operator",
  "municipal_police",
  "asl_inspector",
  "market_manager",
  "business_owner",
  "delegate",
  "accountant",
  "association",
  "supplier",
  "auditor",
  "citizen",
  "api_bot",
]);

// Enum per settori
export const sectorEnum = pgEnum("sector", [
  "all",
  "suap",
  "market",
  "municipal_police",
  "asl",
  "tributi",
  "anagrafe",
]);

// Enum per severity
export const severityEnum = pgEnum("severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Enum per tipi eventi sicurezza
export const securityEventTypeEnum = pgEnum("security_event_type", [
  "login_failed",
  "login_success",
  "permission_denied",
  "suspicious_activity",
  "brute_force_attempt",
  "session_hijack",
  "api_abuse",
]);
```

### 7.2 Tabelle da Definire

Le definizioni complete sono nel file `SECURITY_TAB_PROJECT_MIOHUB_V2.md`.

---

## 8. Checklist Pre-Implementazione

- [ ] Conferma dell'utente sull'opzione scelta (A, B, o C)
- [ ] Backup dei dati esistenti nel database
- [ ] Verifica struttura esatta delle tabelle nel DB
- [ ] Clone fresco del repository GitHub
- [ ] Definizione delle tabelle nello schema
- [ ] Test locali prima del commit
- [ ] Commit e push su GitHub
- [ ] Verifica auto-deploy
- [ ] Test finali in produzione

---

## 9. Riferimenti

- **Repository GitHub:** `Chcndr/dms-hub-app-new`
- **Database:** Neon PostgreSQL (`ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech`)
- **Documento Progetto:** `SECURITY_TAB_PROJECT_MIOHUB_V2.md`
- **Credenziali:** `🔑CREDENZIALIEBLUEPRINTMIOHUB(Aggiornato23Dic2025).md`

---

**Fine del Blueprint**
