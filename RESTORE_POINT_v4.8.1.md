# RESTORE POINT v4.8.1 — 11 Febbraio 2026

> **Tag Git:** `v4.8.1-stable`
> **Commit:** `17a4165`
> **Branch:** `master`
> **Stato:** Login tracking FUNZIONANTE e VERIFICATO

---

## Istruzioni di Ripristino

```bash
# Ripristino rapido (checkout del tag)
git checkout v4.8.1-stable

# Ripristino completo (reset master al tag)
git reset --hard v4.8.1-stable
git push --force origin master
```

---

## Cosa funziona a questo punto

| Funzionalità | Stato | Verifica |
|-------------|-------|----------|
| Login Firebase (Google, Apple, Email) | ✅ Funzionante | Testato con chcndr@gmail.com e bebaviola@gmail.com |
| INSERT in login_attempts | ✅ Funzionante | Record #94 nel DB (bebaviola@gmail.com, user_id=33, success=true) |
| UPDATE lastSignedIn | ✅ Funzionante | Viola Checchi: lastSignedIn=2026-02-11 19:03:18 |
| SecurityTab → Accessi | ✅ Funzionante | Mostra email, pallino verde, data corretta |
| SecurityTab → Utenti | ✅ Funzionante | Mostra "Ultimo accesso: 11/02/2026" |
| SecurityTab → Eventi | ✅ Funzionante | Mostra login_success con email |
| ARPA SPID/CIE backend | ⏳ In attesa | 6 endpoint implementati, serve registrazione Integration Manager |

---

## Architettura del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARCHITETTURA MIO HUB                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Repo: Chcndr/dms-hub-app-new                                   │
│  ├── client/          → Frontend React (deploy: Vercel)          │
│  ├── api/             → Serverless functions (deploy: Vercel)    │
│  │   └── auth/firebase/sync.ts  → Login tracking + sync         │
│  ├── server/          → Express (SOLO dev locale, NON in prod)   │
│  └── drizzle/         → Schema DB (parzialmente disallineato)    │
│                                                                  │
│  Repo: Chcndr/mihub-backend-rest                                 │
│  └── /root/mihub-backend-rest   → Backend REST (deploy: Hetzner) │
│      └── API: orchestratore.mio-hub.me / api.mio-hub.me         │
│      └── Serve: /api/security/*, /api/mihub/*, /api/guardian/*   │
│                                                                  │
│  Database: Neon PostgreSQL (CONDIVISO tra Vercel e Hetzner)      │
│  └── Host: ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws    │
│                                                                  │
│  Vercel rewrites: proxy verso api.mio-hub.me per API mancanti   │
│  Frontend SecurityTab chiama: orchestratore.mio-hub.me           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Schema DB Verificato — login_attempts

> ⚠️ Verificato con query diretta a `information_schema.columns` — 11 Feb 2026

| Colonna | Tipo | Nullable | Note |
|---------|------|----------|------|
| `id` | serial | NO | PK auto-increment |
| `username` | varchar | YES | **Usata per l'email dell'utente** |
| `user_id` | integer | YES | FK → users.id |
| `ip_address` | varchar | NO | IP del client |
| `user_agent` | text | YES | Browser/client info |
| `success` | boolean | NO | true = riuscito |
| `failure_reason` | varchar | YES | Motivo fallimento |
| `created_at` | timestamptz | YES | Default CURRENT_TIMESTAMP |

**❌ NON ESISTONO:** `user_email`, `user_name`, `email`
**✅ Per l'email usare:** colonna `username`

---

## Errori da NON ripetere

1. **MAI verificare lo schema DB via API orchestratore** — l'API restituisce campi mappati/rinominati (es. `user_email` invece di `username`). Verificare SEMPRE con query diretta al DB (`information_schema.columns`).

2. **MAI fidarsi dello schema Drizzle per le tabelle security** — Le tabelle `login_attempts`, `security_events`, `ip_blacklist` sono state create via SQL diretto, non via Drizzle migrations. Lo schema Drizzle per queste tabelle è inaffidabile.

3. **Il `server/` Express in dms-hub-app-new NON è deployato in produzione** — è solo per dev locale. Il backend in produzione è `mihub-backend-rest` su Hetzner.

---

## File Critici Modificati

| File | Cosa fa | Ultima modifica |
|------|---------|-----------------|
| `api/auth/firebase/sync.ts` | Serverless Vercel: INSERT login_attempts + UPDATE lastSignedIn | Commit 17a4165 |
| `client/src/contexts/FirebaseAuthContext.tsx` | Chiama sync con URL relativo + passa trackLogin params | Commit 8968d6c |
| `client/src/components/SecurityTab.tsx` | Rendering email con fallback: user_email → email_attempted → username | Commit 8968d6c |
| `MASTER_BLUEPRINT_MIOHUB.md` | Blueprint v4.8.1 con schema corretto e nota architettura | Commit 17a4165 |

---

## Tag Stabili Precedenti

| Tag | Commit | Data | Descrizione |
|-----|--------|------|-------------|
| `v4.8.1-stable` | `17a4165` | 11/02/2026 | **QUESTO** — Login tracking funzionante con colonne corrette |
| `v4.8.0-stable` | `0ee2780` | 11/02/2026 | ARPA OAuth2 backend (login tracking ROTTO — colonne sbagliate) |
| `v4.7.0-stable` | `4171340` | 11/02/2026 | Primo tentativo login tracking (colonne sbagliate) |
| `v4.5.6d-stable` | — | Precedente | Pre-login tracking |

---

## Variabili d'Ambiente

### Vercel (Environment Variables)
- `DATABASE_URL` — Connection string Neon PostgreSQL ✅ Configurata
- `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON service account Firebase ✅ Configurata

### Hetzner (mihub-backend-rest)
- `DATABASE_URL` — Stessa connection string Neon ✅ Configurata
- `ARPA_CLIENT_ID` — ⏳ Da ottenere dall'Integration Manager
- `ARPA_CLIENT_SECRET` — ⏳ Da ottenere dall'Integration Manager
