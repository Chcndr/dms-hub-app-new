# Security & Code Review Audit — MioHub Frontend

**Repo:** `Chcndr/dms-hub-app-new`
**Data:** 2026-05-18
**Versione codice analizzata:** master @ `db32623`
**Branch del report:** `claude/miohub-security-audit-86Dmb`
**Metodo:** lettura statica via `mcp__github__get_file_contents` + `search_code`

> Questo report è il **gemello** di quello in `Chcndr/mihub-backend-rest` sullo stesso branch. I findings backend (in particolare gli IDOR multi-tenant e l'auth bypass) sono il complemento naturale: sull'app web la "linea di difesa" è il **backend**, quindi alcuni problemi frontend perdono di gravità se il backend impone correttamente il filtro.
>
> I numeri di riga sono quelli restituiti da GitHub search; il contenuto del codice è citato verbatim.

---

## 0. Executive summary

| Severità | Conteggio | Aree principali |
|----------|-----------|-----------------|
| 🔴 **CRITICO** | **4** | Vercel serverless con accesso diretto a Neon senza auth, credenziali committate (file `.md` con password / .env.production) |
| 🟠 **ALTO** | **5** | impersonazione client-only, RBAC client-side bypassabile, fetch senza Authorization header, `is_super_admin` da localStorage, role da localStorage |
| 🟡 **MEDIO** | **4** | impresa_id lookup fragile, doppio Drizzle config, doppio lockfile, 84 .md in root |
| 🟢 **BASSO** | **5** | email test-mode hardcoded, console.warn con info sensibili, file 0 byte, sbom.json 5.4MB committato, `_cantina/` |

**Top 4 azioni IMMEDIATE:**
1. **Verificare il contenuto** di `CREDENZIALI_MIOHUB.md`, `CREDENZIALI_BLUEPRINT_MIOHUB.md`, `.env.production`. Se contengono secret reali → ruotare + `git rm` + scrubbing della history (vedi C-F2)
2. **Mettere validazione JWT** prima dell'accesso a `DATABASE_URL` in `api/db/init-agent-messages.ts` e `api/auth/firebase/sync.ts` (C-F1)
3. **Rimuovere `MOBILE_IMPRESA_TEST_EMAIL = "chcndr@gmail.com"`** hardcoded da `PermissionsContext.tsx` (B-F1)
4. **Rimuovere la sfilza di file `.md` con credenziali / dossier tecnici** dalla root (84 file, alcuni sensibili)

---

## 1. CRITICI (🔴)

### C-F1 — Serverless function Vercel accede a Postgres senza validare il token Firebase
**File:** `api/db/init-agent-messages.ts`
```ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // ❌ nessun controllo Authorization / cookie / Firebase token
  const databaseUrl = process.env.DATABASE_URL;
  const sql = postgres(databaseUrl);
  await sql`CREATE TABLE IF NOT EXISTS agent_messages (...)`;
}
```

Chiunque possa fare `POST /api/db/init-agent-messages` esegue DDL su Neon. Anche se l'idempotent `IF NOT EXISTS` limita il danno immediato, il pattern (zero-auth + accesso diretto al DB) è ripetuto in altri file `api/*`.

**Stesso pattern in `api/auth/firebase/sync.ts`** (≈ righe 40–80):
```ts
if (shouldTrack) {
  const dbUrl = process.env.DATABASE_URL;
  const sql = (await import('postgres')).default(dbUrl, { ssl: 'require' });
  const loginEmail = userEmail || user.email || email || '';
  await sql`INSERT INTO login_attempts (username, user_id, ip_address, user_agent, success, created_at)
            VALUES (${loginEmail}, ${Number(legacyUserId)}, ${clientIp}, ${clientUserAgent}, true, NOW())`;
  await sql`UPDATE users SET "lastSignedIn" = NOW(), "updatedAt" = NOW() WHERE id = ${Number(legacyUserId)}`;
  await sql.end();
}
```

`legacyUserId` arriva dal body della richiesta. Un attaccante manda `legacyUserId: 1` (l'admin) e:
- inquina la tabella `login_attempts` con record falsi a nome admin
- aggiorna `lastSignedIn` dell'admin (sembra che ci sia attività mentre l'admin è disconnesso)

**Fix:**
```ts
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (getApps().length === 0) initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!))
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const m = req.headers.authorization?.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'Auth richiesta' });
  let decoded;
  try { decoded = await getAuth().verifyIdToken(m[1]); }
  catch { return res.status(401).json({ error: 'Token invalido' }); }

  // legacyUserId DEVE corrispondere all'utente autenticato
  if (Number(req.body.legacyUserId) !== Number(decoded.uid)) {
    return res.status(403).json({ error: 'legacyUserId non coerente con il token' });
  }
  // ... resto
}
```

E in generale: **le serverless Vercel non dovrebbero scrivere direttamente nel DB** — vanno ridirette al backend REST di Hetzner che ha già RBAC. Questa è la regola dichiarata nel `CLAUDE.md`. Il file `api/db/init-agent-messages.ts` contraddice direttamente quel principio.

---

### C-F2 — File `CREDENZIALI_*.md` committati nella root del repo
**File:** `CREDENZIALI_MIOHUB.md` (5994 byte), `CREDENZIALI_BLUEPRINT_MIOHUB.md` (10398 byte)

**Stato:** non ho letto il contenuto integrale (rischio caricarlo nel contesto). I nomi e le dimensioni sono fortemente indicativi: file con "CREDENZIALI" da 5-10KB tipicamente contengono URL, utenze, password, API key del sistema.

**Azione raccomandata (in ordine):**
1. Aprire i due file su GitHub (web) e verificare cosa contengono
2. Se contengono **valori reali**: ruotare tutti i secret coinvolti (DB, Firebase, integrations) + `git rm` + `git filter-repo --invert-paths --path CREDENZIALI_MIOHUB.md --path CREDENZIALI_BLUEPRINT_MIOHUB.md` per cancellarli dalla history (rompe i ref dei collaboratori, richiede `git push --force-with-lease` su master e re-clone per tutti)
3. Se contengono **solo descrizioni testuali** (es. "qui va la API key" senza valore): comunque rinominare per chiarezza (`SECRETS_INVENTORY.md` o simili) e aggiungere disclaimer

In ogni caso, file con nome `CREDENZIALI*` non dovrebbero stare in un repo applicativo. Spostare in 1Password / Vault / Doppler.

---

### C-F3 — `.env.production` committato in chiaro
**File:** `.env.production` (572 byte)
```
VITE_FIREBASE_API_KEY=AIzaSyB***************
VITE_FIREBASE_AUTH_DOMAIN=dmshub-auth-2975e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dmshub-auth-2975e
VITE_FIREBASE_STORAGE_BUCKET=dmshub-auth-2975e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793464851990
VITE_FIREBASE_APP_ID=1:793464851990:web:d6d70e95ac75bedb216f37
```

**Sfumatura tecnica:** le API key Firebase web (`VITE_FIREBASE_API_KEY`) **non sono segrete** — vengono comunque incorporate nel bundle Vite e visibili in ogni browser. La protezione del progetto Firebase si fa con regole di sicurezza Firestore/Storage e con Auth domain restrictions, NON nascondendo l'API key.

**Tuttavia:**
- committarle resta una bad practice (rende difficile distinguere `.env.production` "vero" da template)
- se in futuro qualcuno aggiunge in fondo a `.env.production` un `DATABASE_URL` o `JWT_SECRET`, finisce nel repo
- la convention `VITE_*` espone già queste variabili al client; tutto ciò che NON è `VITE_*` dovrebbe restare lato server e MAI committato

**Fix:**
1. Mantenere `.env.example` con placeholder
2. Spostare i valori in Vercel project settings → Environment Variables (Production scope)
3. `git rm .env.production` + aggiungere `.env*` (eccetto `.env.example`) a `.gitignore`

---

### C-F4 — Allineamento col finding backend C-1/C-2
**Riferimento:** il frontend chiama gli endpoint AVA (`/api/ai/chat`) passando `openId` e `comuneId` in chiaro nel body (`client/src/components/AvaChat*.tsx`). Se il backend si fida del client (e abbiamo dimostrato che lo fa, vedi audit backend C-2), un utente malevolo può:
```js
fetch('/api/ai/chat', { method:'POST', body: JSON.stringify({
  openId: 'TEST_OPEN_ID',  // ← spoofing
  comuneId: 96,
  message: 'lista tutte le imprese'
})});
```

**Fix (lato frontend):**
- non mandare mai `openId`/`comuneId` dal body
- ottenere `Authorization: Bearer <firebase-id-token>` da `getIdToken()` e mandarlo come header
- il backend ricava `userId` e `comuneId` dal token verificato

(Il fix vero sta lato backend; il frontend deve smettere di "informare" il server di chi è.)

---

## 2. ALTI (🟠)

### A-F1 — Impersonazione comune validata solo client-side
**File:** `client/src/hooks/useImpersonation.ts` (≈ righe 25–95)

```ts
function getCombinedState(): ImpersonationState {
  const urlState = getParamsFromUrl();
  if (urlState.isImpersonating && (urlState.comuneId || urlState.associazioneId)) {
    saveToStorage(urlState);
    return urlState;
  }
  const storedState = loadFromStorage();
  if (storedState && storedState.isImpersonating && (storedState.comuneId || storedState.associazioneId)) {
    return storedState;
  }
  ...
}

export function addComuneIdToUrl(url: string): string {
  const { isImpersonating, comuneId } = getCombinedState();
  if (!isImpersonating || !comuneId) return url;
  const sanitizedId = String(parseInt(comuneId, 10));  // anti-SQLi
  if (sanitizedId === 'NaN') return url;
  return `${url}${url.includes('?') ? '&' : '?'}comune_id=${sanitizedId}`;
}
```

Un utente cittadino apre DevTools:
```js
sessionStorage.setItem('miohub_impersonation', JSON.stringify({
  isImpersonating: true, comuneId: '96', comuneNome: 'Grosseto',
  userEmail: 'attacker@test.com', entityType: 'comune'
}));
```

Da questo momento ogni `fetch()` aggiunge `?comune_id=96` automaticamente. Se il backend si fida del query param (e nel finding **C-5 dell'audit backend** si vede che il middleware impersonation accetta GET senza token quando c'è `comune_id`), l'attaccante legge i dati di Grosseto.

**Fix (combinato):**
- Frontend: chiamare `POST /api/auth/validate-impersonation { comune_id }`. Il backend verifica che l'utente loggato abbia ruolo super_admin (o sia un PA del comune target). Solo se ritorna `{ authorized: true, scope_token }`, il frontend salva `sessionStorage` e include `scope_token` in `X-Impersonation-Token` su ogni chiamata
- Backend: validare `scope_token` su ogni endpoint che usa `comune_id`

---

### A-F2 — `PermissionsContext` ha fallback a `is_super_admin` da `localStorage`
**File:** `client/src/contexts/PermissionsContext.tsx` (≈ righe 250–280)

```ts
const hasPermission = useCallback((code: string): boolean => {
  if (loading) return false;
  if (permissionCodes.length === 0) {
    if (isImpersonating) return false;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.is_super_admin) return true;   // ❌ fidarsi del client
      } catch {}
    }
    return false;
  }
  return permissionCodes.includes(code);
}, [permissionCodes, loading, isImpersonating]);
```

Un utente con `localStorage.setItem('user', '{"is_super_admin":true}')` ottiene tutti i tab visibili.

**NB:** è "solo cosmetico" se il backend filtra correttamente, ma:
- gli IDOR scoperti nel backend (audit backend C-3, C-6, C-7, C-8) mostrano che il backend NON filtra correttamente
- mostrare l'UI super_admin a un utente non autorizzato è di per sé una info-disclosure (rivela quali funzioni esistono)

**Fix:** togliere il branch `localStorage`. Quando `permissionCodes.length === 0`, ritornare `false`. I permessi devono venire SOLO dal server via `/api/security/me/permissions`.

---

### A-F3 — `MioHubUser.role` e `isSuperAdmin` persistiti in `localStorage`
**File:** `client/src/contexts/FirebaseAuthContext.tsx` (≈ righe 396–505)

```ts
let effectiveRole: UserRole;
if (isAdmin) effectiveRole = 'pa';
else if (hasExplicitCitizenRole) effectiveRole = 'citizen';
else if (role === 'citizen') effectiveRole = 'citizen';
else if (hasImpresa) effectiveRole = 'business';
else effectiveRole = backendSyncData?.role || role;

const miohubUser: MioHubUser = {
  ...,
  isSuperAdmin: isAdmin,
  role: effectiveRole,
  impresaId: shouldSetImpresa ? legacyUser!.impresa_id : undefined,
};
localStorage.setItem('miohub_firebase_user', JSON.stringify(miohubUser));
```

`localStorage` è manomettibile. Combinato con A-F2, un attaccante può forzare l'app a credere di essere un super_admin con `impresaId` arbitrario.

**Fix:**
- non persistere `role`, `isSuperAdmin`, `impresaId` in `localStorage`
- mantenere in memoria (state React) e ricaricare via `/api/auth/me` ad ogni reload (cache 5 min ok)
- se serve persistenza cross-tab: usare un cookie HttpOnly impostato dal backend con i claim firmati (JWT signed cookie)

---

### A-F4 — `trpcQuery`/`trpcMutate` fanno fetch senza Authorization né credentials
**File:** `client/src/lib/trpcHttp.ts` (≈ righe 66–88)

```ts
export async function trpcQuery<T = unknown>(procedure: string, input?: unknown): Promise<T> {
  const path = toRestPath(procedure);
  let url = `${MIHUB_API_BASE_URL}${path}`;
  if (input !== undefined && input !== null) { /* serializzazione */ }
  const res = await fetch(url);   // ❌ no headers, no credentials
  if (!res.ok) throw new Error(`REST ${procedure}: ${res.status} ${res.statusText}`);
  return (await res.json())?.data ?? res.json();
}
```

Conseguenza: se il backend richiede cookie/token, ogni chiamata fallisce. Se il backend NON li richiede, la chiamata passa senza autenticazione (rischio di accidental open API).

**Fix:**
```ts
import { getAuth } from 'firebase/auth';
async function authHeaders(): Promise<HeadersInit> {
  const u = getAuth().currentUser;
  if (!u) return {};
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
export async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  ...
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }
  });
  ...
}
```

E lo stesso per `trpcMutate`.

---

### A-F5 — `lookupImpresaForUser` espone potenziale info-disclosure
**File:** `client/src/contexts/FirebaseAuthContext.tsx` (≈ righe 205–225)

```ts
if (legacyUser && !legacyUser.impresa_id && email) {
  const impresaResult = await lookupImpresaForUser(email, legacyUser.id);
  if (impresaResult) {
    legacyUser.impresa_id = impresaResult.id;
    legacyUser.denominazione = impresaResult.denominazione;
  }
}
```

`lookupImpresaForUser` chiama probabilmente `GET /api/imprese?user_id=X` (da verificare). Se quell'endpoint backend non valida che `X === request.user.id`, un attaccante può enumerare l'associazione `user_id → impresa_id` di tutto il sistema.

**Fix:**
- backend: `GET /api/imprese?user_id=...` deve richiedere `user_id === req.authenticatedUser.id` (oppure ruolo super_admin)
- frontend: passare sempre `user_id` derivato dal token Firebase, non da parametri esterni

---

## 3. MEDI (🟡)

### M-F1 — Impresa lookup basato su email (legacy)
Nel `FirebaseAuthContext.tsx` c'è un commento che dichiara: "L'email dell'impresa è l'email di contatto dell'azienda, NON identifica il proprietario". OK, la strategia di lookup per email è stata rimossa. Ma `legacyUser.impresa_id` proviene comunque da `users.impresa_id` server-side, e questo binding storico potrebbe essere stato fatto in passato proprio via email-matching.

**Azione:** audit DB per controllare se esistono coppie `users.impresa_id` errate (un utente collegato all'impresa sbagliata). Query proposta (eseguibile via bridge Hetzner — vedi §6):
```sql
SELECT u.id, u.email AS user_email, i.id AS impresa_id, i.email AS impresa_email
FROM users u
JOIN imprese i ON i.id = u.impresa_id
WHERE u.email != i.email
LIMIT 100;
```
Se ci sono molti match, c'è una "marea silenziosa" di associazioni non verificabili.

### M-F2 — Doppio Drizzle config
`drizzle.config.ts` (attivo, PostgreSQL) + `drizzle.config.mysql.backup.ts` (backup). Il backup MySQL è irrilevante (il sistema è su Neon PG) e confonde nuovi sviluppatori.
**Fix:** `git rm drizzle.config.mysql.backup.ts`.

### M-F3 — Doppio lockfile npm + pnpm
`package-lock.json` (506KB) e `pnpm-lock.yaml` (346KB). Il CLAUDE.md dichiara pnpm 10.4+. Conservare solo `pnpm-lock.yaml`.
**Fix:** `git rm package-lock.json` + aggiungere a `.gitignore`.

### M-F4 — Root sovraffollata da 84 file `.md`
Tra cui: 5 README versionati (`README.md`, `README_AGGIORNAMENTO_16_DIC.md`, `README_AGGIORNATO_22_NOV.md`, `README_FASE5_VETRINE.md`, `README_SHOPPING_ROUTE.md`, `README_SHOPPING_ROUTE_UPDATED.md`), 3 MASTER_BLUEPRINT (`MASTER_BLUEPRINT_MIOHUB.md` 878KB + `_v5.3.0.md` + `_v9.7.0.md`), 2 TODO duplicati (`TODO.md` + `todo.md`), 2 RESTORE_POINT versioni `9.8.0` / `9.8.5` / `9.9.5`, vari report duplicati.

Rischio: incertezza su quale documento sia autoritativo → divergenza di knowledge.

**Fix:** spostare in `docs/` un'unica copia, rinominare per chiarezza (`docs/blueprint.md` link a `docs/archive/blueprint-v9.7.0.md`, ecc.), eliminare i `.md.bak`.

---

## 4. BASSI (🟢) — hygiene

### B-F1 — Email test-mode hardcoded
**File:** `client/src/contexts/PermissionsContext.tsx` (≈ righe 59–73)
```ts
const MOBILE_IMPRESA_TEST_EMAIL = 'chcndr@gmail.com';
function isMobileImpresaTestMode(): boolean {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return false;
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  const user = JSON.parse(userStr);
  return user.email === MOBILE_IMPRESA_TEST_EMAIL;
}
```

Un attaccante che imposta `localStorage.user = {email: 'chcndr@gmail.com'}` e riduce la viewport entra in "mobile-impresa-test-mode" con permessi filtrati a `IMPRESA_ONLY_PERMISSION_CODES`. È un'esposizione minima ma è codice di debug rimasto in produzione.

**Fix:** sostituire con feature flag server-side (`GET /api/config/features`).

### B-F2 — `console.warn` con info sensibili
**File:** `FirebaseAuthContext.tsx`, `PermissionsContext.tsx` e altri. Esempi:
```ts
console.warn(`[FirebaseAuth] Utente legacy trovato: ID=${fullUser.id}, impresa_id=${fullUser.impresa_id}, wallet=${fullUser.wallet_balance}`);
```
Wallet balance + impresa_id nel browser console → finisce su Sentry/LogRocket se attivi, e in screenshot dei tester.
**Fix:** wrapper `debugLog(msg)` che è no-op in produzione.

### B-F3 — File "marcatori" da 0 byte in root
`dms-context-for-ai`, `dms-system-blueprint`, `.gitkeep` (root), `.rollback-marker` (30 byte), `.vercel-deploy` (11 byte). Rumore.
**Fix:** rimuovere o documentare lo scopo.

### B-F4 — `sbom.json` 5.4 MB committato
SBOM va in artefatti CI, non in repo. Gonfia clone + LFS-spike.
**Fix:** generare in `pnpm build` e pubblicare come artifact GitHub Actions.

### B-F5 — `_cantina/` committata
"Codice archiviato, NON usare" (CLAUDE.md). Va in repo separato.
**Fix:** `git rm -r _cantina/`. Spostare in `Chcndr/miohub-archive` se da preservare.

### B-F6 — File asset pesanti in root
`grosseto_160_posteggi_PRONTO.json` (60KB), `grosseto_debug.json` (60KB), `slide_dashboard.png` (86KB), `slide_dashboard2.png` (13KB), `slide_react_code.jpg` (268KB), `MASTER_BLUEPRINT_MIOHUB.zip` (47KB), `test-chat-mobile.html`.
**Fix:** spostare in `public/`, `tech_slides/` o `docs/`, oppure rimuovere.

---

## 5. Mapping endpoint frontend ↔ backend

### 5.1 — `vercel.json` rewrites (verificati)
| Rewrite | Backend route | Stato |
|---|---|---|
| `/api/ava/:path*` | `routes/ava-data-gateway.js` | ✅ |
| `/api/ai/:path*` | `routes/ai-chat.js` | ✅ (ma vedi backend C-1, C-2, A-7) |
| `/api/auth/:path*` | `routes/auth.js` | ✅ |
| `/api/mihub/:path*` | `routes/mihub.js` | ✅ |
| `/api/guardian/:path*` | `routes/guardian.js` | ✅ |
| `/api/wallets/:path*` | `routes/wallets.js` | ✅ |
| `/api/imprese/:path*` | `routes/imprese.js` | ✅ |
| `/api/canone-unico/:path*` | `routes/canone-unico.js` | ✅ |
| `/api/sanctions/:path*` | `routes/sanctions.js` | ✅ |
| `/api/notifiche/:path*` | `routes/notifiche.js` | ✅ |
| `/api/security/:path*` | `routes/security.js` | ✅ (ma vedi backend C-3) |
| `/api/mio/:path*` | `routes/mioAgent.js` | ✅ |
| `/api/abacus/:path*` | `routes/abacusSql.js` | ✅ |

### 5.2 — Procedure tRPC in `trpcHttp.ts` non mappate
Da verificare: tutte le `PROCEDURE_MAP` dichiarate corrispondono a path Vercel? Audit consigliato:
```bash
grep -oE '"[^"]+"\s*:\s*"\/api\/[^"]+"' client/src/lib/trpcHttp.ts | sort -u
```
e incrociare con i rewrite di `vercel.json`. Allo stato preliminare non emergono mismatch eclatanti, ma il numero alto di "auto-convert" (procedure non in mappa → split su `.`) può generare 404 silenziosi.

### 5.3 — Endpoint backend NON raggiungibili dal frontend (intenzionale o no?)
- `/api/admin/*` (routes/admin.js, adminSecrets.js, adminDeploy.js, adminMigrate.js) — NESSUN rewrite Vercel. Buona pratica… ma sono comunque esposti diretti sull'IP backend (vedi audit backend C-9, C-10)
- `/api/panic` — emergency endpoint
- `/api/internalTraces` — log interni
- `/api/health-monitor` — diagnostica

OK che non siano proxati, ma il backend deve avere un firewall (UFW/cloud) che li nasconde all'esterno.

---

## 6. Workflow proposto: sessione web ↔ Claude Code CLI su Hetzner

L'utente ha scelto: usare la CLI Hetzner solo per **eseguire query SQL live su Neon** per validare i findings. Architettura raccomandata in dettaglio nel file gemello del backend (sezione 8), riassunto qui:

**Opzione A (preferita): bridge via GitHub Issue.**
- La sessione web crea una issue con label `claude-bridge-sql` nel repo backend, body con la SQL in code fence
- Su Hetzner una systemd-timer (30s) legge issue aperte con quel label, valida la query (whitelist SELECT/EXPLAIN/WITH, denylist DDL/DML mutativi), la esegue con `psql --csv` come utente Postgres `claude_readonly`, tronca a 200 righe, posta come commento, chiude l'issue
- La sessione web legge il risultato via `mcp__github__issue_read`
- Audit gratuito: ogni interazione è una issue chiusa con log permanente

**Sicurezza:**
- ruolo Postgres `claude_readonly` con `GRANT SELECT ON ALL TABLES IN SCHEMA public`, niente `INSERT/UPDATE/DELETE`
- `statement_timeout = 10s` lato session
- `timeout 10` lato shell
- regex denylist: `\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|VACUUM|REINDEX)\b`
- log: ogni query eseguita finisce su `audit_logs` con `actor='claude_readonly_bridge'`

**Implementazione lato Hetzner:** ~30 minuti (1 systemd unit + 1 script bash + 1 GRANT SQL). Vedi snippet nel file gemello backend.

### Query iniziali utili per validare i findings (eseguibili una volta attivato il bridge)
```sql
-- 1) Verifica che wallets.comune_id sia "quasi sempre NULL" (vincolo CLAUDE.md)
SELECT COUNT(*) FILTER (WHERE comune_id IS NULL) AS null_count,
       COUNT(*) AS total
FROM wallets;

-- 2) Verifica che imprese.comune_id (sede legale) divergerebbe dal comune via concessions
SELECT COUNT(*) AS imprese_con_sede_diversa_dal_mercato
FROM imprese i
JOIN concessions c ON c.impresa_id = i.id
JOIN markets m ON m.id = c.market_id
WHERE i.comune_id IS NOT NULL AND i.comune_id != m.comune_id;

-- 3) Verifica esistenza colonna concessions.operatore_id (NON deve esistere)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'concessions' AND column_name IN ('operatore_id', 'impresa_id');

-- 4) Conta endpoint orfani: utenti senza ruolo attivo
SELECT COUNT(*) FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_role_assignments ura
  WHERE ura.user_id = u.id AND ura.is_active = true
);

-- 5) Audit: quanti super_admin esistono?
SELECT u.id, u.email
FROM users u
JOIN user_role_assignments ura ON ura.user_id = u.id AND ura.is_active = true
JOIN user_roles ur ON ur.id = ura.role_id
WHERE ur.code = 'super_admin'
ORDER BY u.id;
```

---

## 7. Lista azioni — versione operativa

### Oggi (entro 4 h)
- [ ] Verificare e ripulire `CREDENZIALI_*.md`, `.env.production` (C-F2, C-F3)
- [ ] Rimuovere `MOBILE_IMPRESA_TEST_EMAIL` (B-F1)
- [ ] Aggiungere auth a `api/db/init-agent-messages.ts` e `api/auth/firebase/sync.ts` (C-F1)

### Entro 1 settimana
- [ ] Togliere fallback `is_super_admin` da `localStorage` in `PermissionsContext` (A-F2)
- [ ] Non persistere `role`/`isSuperAdmin`/`impresaId` in `localStorage` (A-F3)
- [ ] Aggiungere `Authorization: Bearer` + `credentials: 'include'` a `trpcHttp.ts` (A-F4)
- [ ] Endpoint `/api/auth/validate-impersonation` + scope-token (A-F1, in coordinamento col backend)

### Entro 2 settimane
- [ ] Pulizia root: rimuovere doppio lockfile (M-F3), `drizzle.config.mysql.backup.ts` (M-F2), `_cantina/` (B-F5), `sbom.json` (B-F4), 84 .md → spostare in `docs/` (M-F4)
- [ ] Wrapper `debugLog` (B-F2)
- [ ] Sostituire `console.warn` informativi (B-F2)

---

## 8. Cose che funzionano bene

- Architettura `ProtectedTab` / `PermissionsContext` chiara e ben separata
- Wouter come router minimale è una buona scelta
- Validazione anti-injection in `addComuneIdToUrl` (`parseInt` + check `NaN`) — il fix è cosmeticamente buono, il problema vero è la fiducia nel `sessionStorage`
- `_cantina/` documentata come "non usare" (anche se va comunque rimossa dal repo)
- `CLAUDE.md` molto dettagliato — è raro avere un file di onboarding così esplicito

---

*Fine relazione frontend. La relazione backend è in `Chcndr/mihub-backend-rest` sul branch `claude/miohub-security-audit-86Dmb`.*
