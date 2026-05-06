# Progetto: Presenza Dipendenti via App Cittadino (MioHub)

**Versione:** 1.2.0
**Data:** 6 Maggio 2026
**Stato:** In attesa di sviluppo

---

## Obiettivo

Consentire a **più dipendenti/soci** di un'impresa di registrare la presenza al mercato (check-in) utilizzando l'app pubblica "Cittadino" (DMS Hub), senza dover accedere all'app "Impresa" che contiene dati sensibili (wallet, fatture, anagrafica completa).

Il sistema sfrutta il meccanismo di permessi già esistente (tab SICUREZZA della Dashboard PA) per iniettare **solo** il permesso `tab.view.presenze` quando riconosce che l'utente cittadino è un collaboratore autorizzato.

---

## Architettura del Sistema di Permessi (Esistente)

Il sistema di permessi MioHub funziona su due livelli:

| Livello | Descrizione | File |
|---------|-------------|------|
| **Server-side** | Tabella `role_permissions` → caricati via `GET /api/security/roles/:id/permissions` | `routes/security.js` |
| **Client-side** | Iniezione permessi extra in base a `base_role` e dati utente in `localStorage` | `PermissionsContext.tsx` |

Il frontend usa `canViewTab(tabId)` che verifica se `tab.view.{tabId}` è presente nei permessi caricati. Il bottone "Presenze" nella HomePage è già protetto dalla condizione `canViewTab("presenze")`.

**Permessi attuali per ruolo:**

| Ruolo | Permessi Tab Impresa |
|-------|---------------------|
| `admin` / `super_admin` | TUTTI (28 tab PA + tab impresa) |
| `business` | `tab.view.wallet_impresa`, `tab.view.anagrafica`, `tab.view.presenze`, `quick.view.hub_operatore`, `quick.view.notifiche` |
| `citizen` | Nessun tab impresa (solo funzioni pubbliche: Mappa, Route, Wallet, Segnala, Vetrine) |
| `citizen` + collaboratore | **SOLO** `tab.view.presenze` (NUOVO) |

---

## Supporto Multi-Collaboratore

La tabella `collaboratori_impresa` è **già predisposta** per più collaboratori per impresa:

- Non esiste un vincolo UNIQUE su `impresa_id` → più righe per la stessa impresa
- Il CRUD nel tab Team (`AnagraficaPage.tsx`) usa `collaboratori.map(...)` → lista dinamica
- Il bottone "Aggiungi Collaboratore" è già presente
- L'endpoint `GET /api/collaboratori?impresa_id=X` restituisce un array

**Scenario multi-collaboratore:**

| Impresa | Collaboratore | Email | Ruolo | Autorizzato |
|---------|--------------|-------|-------|-------------|
| MIO TEST | Mario Rossi | mario.rossi@gmail.com | Titolare | Si |
| MIO TEST | Andrea Checchi | checchi@me.com | Socio | Si |
| MIO TEST | Luca Bianchi | luca.bianchi@email.it | Dipendente | Si |
| MIO TEST | Sara Verdi | sara.verdi@email.it | Dipendente | No |

In questo esempio, Mario, Andrea e Luca possono tutti fare presenza dall'app cittadino. Sara no (non autorizzata). Tutti fanno presenza **per la stessa impresa** (MIO TEST).

---

## 1. Modifiche al Database (Neon)

### 1.1 Aggiunta campo `email` alla tabella `collaboratori_impresa`

La tabella mantiene il campo `telefono` (utile per contatti) e aggiunge `email` come chiave di matching per il login cittadino.

```sql
-- Aggiunta campo email ai collaboratori
ALTER TABLE collaboratori_impresa ADD COLUMN email VARCHAR(255);

-- Indice univoco GLOBALE sull'email (un'email può essere associata a una sola impresa)
-- Il WHERE email IS NOT NULL permette di avere collaboratori senza email (non abilitati app)
CREATE UNIQUE INDEX idx_collaboratori_email ON collaboratori_impresa (email) WHERE email IS NOT NULL;
```

**Nota multi-collaboratore:** L'indice univoco è sull'email (non su impresa_id+email), garantendo che una persona non possa essere collaboratore di due imprese diverse. Più collaboratori della stessa impresa avranno email diverse.

**Struttura risultante `collaboratori_impresa`:**

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | SERIAL PK | ID auto-incrementante |
| `impresa_id` | INTEGER FK | Riferimento all'impresa |
| `nome` | VARCHAR(100) | Nome del collaboratore |
| `cognome` | VARCHAR(100) | Cognome del collaboratore |
| `codice_fiscale` | VARCHAR(16) | Codice fiscale |
| `ruolo` | VARCHAR(50) | Titolare, Socio, Dipendente |
| `telefono` | VARCHAR(20) | Numero di telefono (mantenuto) |
| `email` | VARCHAR(255) | **NUOVO** — Email per login app cittadino |
| `autorizzato_presenze` | BOOLEAN | Se può fare presenze |
| `status` | VARCHAR(20) | Stato del collaboratore |
| `created_at` | TIMESTAMP | Data creazione |
| `updated_at` | TIMESTAMP | Data ultimo aggiornamento |

---

## 2. Modifiche Backend (API Node.js — Hetzner)

### 2.1 Aggiornamento CRUD Collaboratori (`routes/collaboratori.js`)

Aggiornare gli endpoint esistenti per gestire il campo `email`:

- **GET** `/api/collaboratori?impresa_id=X` → restituisce anche `email`
- **POST** `/api/collaboratori` → accetta `email` nel body, validazione unicità
- **PUT** `/api/collaboratori/:id` → permette di aggiornare `email`, validazione unicità

### 2.2 Nuovo Endpoint: Verifica Collaboratore (`routes/collaboratori.js`)

```javascript
/**
 * GET /api/collaboratori/me
 * Verifica se l'utente loggato (email dal JWT) è un collaboratore autorizzato.
 * Chiamato dall'app cittadino dopo il login.
 * Supporta multi-collaboratore: restituisce i dati dell'impresa associata.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // Email dal JWT Firebase
    
    const result = await query(`
      SELECT ci.*, i.denominazione as nome_impresa
      FROM collaboratori_impresa ci
      JOIN imprese i ON ci.impresa_id = i.id
      WHERE ci.email = $1 AND ci.autorizzato_presenze = true
    `, [userEmail]);
    
    if (result.rows.length === 0) {
      return res.json({ success: true, isCollaborator: false });
    }
    
    // Un'email può essere associata a una sola impresa (indice univoco)
    const collab = result.rows[0];
    res.json({
      success: true,
      isCollaborator: true,
      data: {
        collaboratore_id: collab.id,
        impresa_id: collab.impresa_id,
        nome_impresa: collab.nome_impresa,
        ruolo: collab.ruolo,
        nome: collab.nome,
        cognome: collab.cognome
      }
    });
  } catch (error) {
    console.error('[Collaboratori] Error checking /me:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2.3 Aggiornamento Check-in Presenze (`routes/presenze-live.js`)

L'endpoint `POST /api/presenze-live/checkin` attualmente richiede `impresa_id` nel body. Dobbiamo aggiungere un fallback per i collaboratori:

```javascript
// Dentro il checkin handler, PRIMA della logica esistente:
let effectiveImpresaId = req.body.impresa_id;

// Se non ha impresa_id nel body, verifica se è un collaboratore autorizzato
if (!effectiveImpresaId && req.user.email) {
  const collabCheck = await query(`
    SELECT impresa_id FROM collaboratori_impresa 
    WHERE email = $1 AND autorizzato_presenze = true
  `, [req.user.email]);
  
  if (collabCheck.rows.length > 0) {
    effectiveImpresaId = collabCheck.rows[0].impresa_id;
  }
}

if (!effectiveImpresaId) {
  return res.status(403).json({ success: false, error: 'Non autorizzato' });
}
```

---

## 3. Modifiche Frontend — App Impresa (Anagrafica > Tab Team)

### 3.1 Aggiunta campo Email nel form collaboratore (`AnagraficaPage.tsx`)

Nel form di aggiunta/modifica collaboratore, aggiungere un campo `email` sotto il campo `telefono`:

- **Label:** "Email (per presenze da app)"
- **Tipo:** `<input type="email">`
- **Placeholder:** "email@esempio.com"
- **Validazione:** formato email valido + unicità (errore se già usata da altro collaboratore)
- **Obbligatorio:** Solo se "Autorizzato Presenze" è attivo

Il form supporta già la lista multipla di collaboratori (ogni riga ha il proprio form con i campi). Si aggiunge semplicemente il campo email a ciascuna riga.

### 3.2 Aggiornamento testo informativo

Il banner informativo nel tab Team diventa:

> *"I collaboratori autorizzati potranno scaricare l'app DMS Hub, fare login con l'email qui indicata, e registrare le presenze sui posteggi dell'impresa direttamente dalla vista Cittadino. Puoi aggiungere più collaboratori: ognuno farà login con la propria email."*

---

## 4. Modifiche Frontend — App Cittadino

### 4.1 Verifica collaboratore al login (`FirebaseAuthContext.tsx`)

Dopo il `syncUserWithBackend()`, aggiungere una chiamata a `/api/collaboratori/me`:

```typescript
// Dopo syncUserWithBackend, se il ruolo è 'citizen':
if (effectiveRole === 'citizen') {
  try {
    const collabRes = await fetch(`${API_BASE}/api/collaboratori/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const collabData = await collabRes.json();
    
    if (collabData.success && collabData.isCollaborator) {
      // Salva in localStorage per il PermissionsContext e per PresenzePage
      const updatedUser = { 
        ...user, 
        isCollaborator: true, 
        collaboratorData: collabData.data,
        impresaId: collabData.data.impresa_id  // Necessario per PresenzePage!
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  } catch (e) {
    console.warn('[FirebaseAuth] Collaborator check failed:', e);
  }
}
```

### 4.2 Iniezione permesso `tab.view.presenze` (`PermissionsContext.tsx`)

Nella funzione `getClientSidePermissions()`, aggiungere un blocco per i collaboratori:

```typescript
// Dopo il blocco "Business (ruolo esplicito business)" (riga ~189):

// Collaboratore autorizzato → SOLO tab presenze (niente wallet, anagrafica, ecc.)
else if (user.isCollaborator) {
  const COLLABORATOR_PERMISSION_CODES = [
    "tab.view.presenze",
  ];
  for (const code of COLLABORATOR_PERMISSION_CODES) {
    extraPerms.push({
      id: id++,
      code,
      name: code,
      category: "tab",
      is_sensitive: false,
    });
  }
}
```

### 4.3 Bottone "Presenze" nella HomePage (`HomePage.tsx`)

Il bottone "Presenze" è già presente nella sezione impresa (riga 643-654). Dobbiamo aggiungerne uno anche nella sezione cittadino, visibile SOLO se `isCollaborator`:

```tsx
{/* Sezione Cittadino - dopo il bottone Vetrine (riga 585) */}
{isAuthorizedCollaborator && (
  <Button
    variant="outline"
    size="lg"
    onClick={() => handleProtectedNavigation("/app/impresa/presenze")}
    className="h-16 sm:h-24 flex-col gap-1 sm:gap-2 bg-card/80 backdrop-blur-sm hover:bg-emerald-500/20 border-emerald-500/50 col-span-2 sm:col-span-1"
  >
    <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
    <span className="text-sm sm:text-base font-semibold text-emerald-400">Presenze</span>
  </Button>
)}
```

### 4.4 Risoluzione `impresaId` in PresenzePage (`PresenzePage.tsx`)

**Punto critico:** La pagina `PresenzePage.tsx` risolve l'`impresaId` con una strategia a 3 step:
1. `miohub_firebase_user.impresaId`
2. Legacy `user.impresa_id`
3. Lookup `/api/imprese?user_id=...`

Per i collaboratori, dobbiamo aggiungere uno **step 1.5** che legge `collaboratorData.impresa_id` dal localStorage:

```typescript
// Dentro la funzione di risoluzione impresaId, dopo step 1:
if (!impresaId) {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.isCollaborator && user.collaboratorData?.impresa_id) {
      impresaId = user.collaboratorData.impresa_id;
      console.log('[PresenzePage] impresaId da collaboratorData:', impresaId);
    }
  }
}
```

Questo garantisce che la pagina funzioni sia per il titolare (business) che per qualsiasi collaboratore (citizen).

---

## 5. Flusso Completo (Multi-Collaboratore)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. TITOLARE (App Impresa)                                           │
│    Anagrafica > Team > Aggiungi Collaboratore (×N)                  │
│    → Collaboratore 1: Mario Rossi, mario@gmail.com, Dipendente ✓    │
│    → Collaboratore 2: Luca Bianchi, luca@email.it, Dipendente ✓    │
│    → Collaboratore 3: Sara Verdi, sara@email.it, Dipendente ✗      │
├─────────────────────────────────────────────────────────────────────┤
│ 2. DIPENDENTE 1 (App Cittadino)                                     │
│    Scarica app → Login con mario@gmail.com                          │
│                                                                     │
│    DIPENDENTE 2 (App Cittadino)                                     │
│    Scarica app → Login con luca@email.it                            │
│                                                                     │
│    DIPENDENTE 3 (App Cittadino)                                     │
│    Scarica app → Login con sara@email.it → NON vede Presenze       │
├─────────────────────────────────────────────────────────────────────┤
│ 3. SISTEMA (Automatico, per ogni login)                             │
│    syncUserWithBackend() → ruolo = citizen                          │
│    GET /api/collaboratori/me → isCollaborator = true/false          │
│    PermissionsContext → inietta tab.view.presenze (se autorizzato)  │
├─────────────────────────────────────────────────────────────────────┤
│ 4. DIPENDENTE 1 o 2 (Vede nella HomePage)                          │
│    [Mappa] [Route] [Wallet] [Segnala] [Vetrine]                    │
│    [═══════════ PRESENZE ═══════════]  ← VISIBILE                  │
│                                                                     │
│    NON vede: Wallet Imp., Hub Op., Notifiche, Anagrafica            │
├─────────────────────────────────────────────────────────────────────┤
│ 5. DIPENDENTE (Fa la presenza)                                      │
│    Clicca Presenze → Sceglie mercato → Check-in                    │
│    Backend registra presenza per l'impresa MIO TEST                 │
│    (indipendentemente da quale collaboratore la fa)                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Sicurezza e Isolamento

| Aspetto | Garanzia |
|---------|----------|
| **Dati sensibili** | Il collaboratore NON vede wallet, fatture, anagrafica, notifiche dell'impresa |
| **Ruolo RBAC** | Resta `citizen` — nessun accesso ai tab PA o impresa (tranne presenze) |
| **Unicità email** | L'indice univoco impedisce che un'email sia associata a più imprese |
| **Multi-collaboratore** | Ogni impresa può avere N collaboratori, ognuno con la propria email |
| **Revoca accesso** | Il titolare può disattivare "Autorizzato Presenze" o rimuovere il collaboratore |
| **Revoca immediata** | Al prossimo login il flag `isCollaborator` non viene più settato |
| **Audit** | Il check-in registra chi ha fatto la presenza (collaboratore_id tracciabile) |

---

## 7. File da Modificare (Riepilogo)

| File | Tipo Modifica | Complessità |
|------|---------------|-------------|
| `collaboratori_impresa` (DB) | ALTER TABLE + UNIQUE INDEX | Bassa |
| `routes/collaboratori.js` | Aggiunta campo email + endpoint `/me` | Media |
| `routes/presenze-live.js` | Fallback impresa_id per collaboratori | Bassa |
| `client/src/pages/AnagraficaPage.tsx` | Campo email nel form Team | Bassa |
| `client/src/contexts/FirebaseAuthContext.tsx` | Chiamata `/api/collaboratori/me` dopo login | Media |
| `client/src/contexts/PermissionsContext.tsx` | Iniezione `tab.view.presenze` per collaboratori | Bassa |
| `client/src/pages/HomePage.tsx` | Bottone Presenze nella sezione cittadino | Bassa |
| `client/src/pages/PresenzePage.tsx` | Risoluzione impresaId da collaboratorData | Bassa |

**Complessità totale stimata:** Media — circa 4-6 ore di sviluppo.

---

## 8. Prossimi Passi

1. Approvazione progetto da parte dell'utente
2. Modifica DB (ALTER TABLE + INDEX)
3. Sviluppo backend (endpoint `/me` + aggiornamento CRUD + fallback checkin)
4. Sviluppo frontend impresa (campo email nel form Team)
5. Sviluppo frontend cittadino (verifica collaboratore + iniezione permesso + bottone + risoluzione impresaId)
6. Test flusso completo end-to-end (multi-collaboratore)
7. Deploy e verifica in produzione
