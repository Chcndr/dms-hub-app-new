# PIANO DI IMPLEMENTAZIONE FINALE
## Collegamento Impersonificazione Associazioni + Fix Sicurezza + Metriche

**Data**: 22 Febbraio 2026
**Stato**: Pronto per esecuzione
**Regola fondamentale**: NON TOCCARE il sistema impersonificazione comuni esistente

---

## INDICE

1. [Priorita 1: Fix Sicurezza Critici](#priorita-1-fix-sicurezza-critici)
2. [Priorita 2: Progetto Associazioni](#priorita-2-progetto-associazioni)
3. [Priorita 3: Aggiornamento Metriche Report](#priorita-3-aggiornamento-metriche-report)

---

## PRIORITA 1: FIX SICUREZZA CRITICI

### FIX 1.1 — Rimuovere eval() da MessageContent.tsx

**File**: `client/src/components/MessageContent.tsx`
**Riga**: 35

```typescript
// BEFORE (riga 35)
eval(code);

// AFTER
// Opzione A: Web Worker sandboxed
const blob = new Blob([code], { type: 'application/javascript' });
const url = URL.createObjectURL(blob);
const worker = new Worker(url);
worker.onmessage = (e) => { /* gestisci risultato */ };
worker.onerror = (e) => { console.error('Sandbox error:', e.message); worker.terminate(); };
setTimeout(() => { worker.terminate(); URL.revokeObjectURL(url); }, 5000);

// Opzione B (piu semplice): iframe sandboxed
const iframe = document.createElement('iframe');
iframe.sandbox.add('allow-scripts');
iframe.style.display = 'none';
document.body.appendChild(iframe);
iframe.contentWindow?.postMessage({ type: 'eval', code }, '*');
setTimeout(() => { iframe.remove(); }, 5000);
```

**Spiegazione**: eval() esegue codice arbitrario nel contesto del browser principale. La sostituzione con Web Worker o iframe sandboxed isola l'esecuzione in un ambiente senza accesso al DOM, localStorage, cookies.

---

### FIX 1.2 — Eliminare innerHTML XSS in DashboardPA.tsx

**File**: `client/src/pages/DashboardPA.tsx`
**Riga**: ~5042-5043

```typescript
// BEFORE (righe 5042-5043)
list.innerHTML = data.data.map((i: any) =>
  `<div class="p-2 hover:bg-[#3b82f6]/20 cursor-pointer rounded" onclick="document.getElementById('impresa_id').value='${i.id}'; document.getElementById('impresa_nome').value='${i.denominazione} (${i.partita_iva})'; document.getElementById('imprese-list').innerHTML='';">${i.denominazione} - ${i.partita_iva} - ${i.comune || ''}</div>`
).join('');

// AFTER — Convertire in rendering React con stato
// 1. Aggiungere stato per i risultati di ricerca impresa:
const [impresaSearchResults, setImpresaSearchResults] = useState<any[]>([]);

// 2. Sostituire innerHTML con setState:
setImpresaSearchResults(data.data);

// 3. Nel JSX, renderizzare con React:
{impresaSearchResults.map((i: any) => (
  <div
    key={i.id}
    className="p-2 hover:bg-[#3b82f6]/20 cursor-pointer rounded"
    onClick={() => {
      // Imposta valori direttamente via React state (non getElementById)
      setSelectedImpresaId(i.id);
      setSelectedImpresaNome(`${i.denominazione} (${i.partita_iva})`);
      setImpresaSearchResults([]);
    }}
  >
    {i.denominazione} - {i.partita_iva} - {i.comune || ''}
  </div>
))}
```

**Anche a righe 3571-3595** (bottone batch TCC):
```typescript
// BEFORE
btn.innerHTML = '<svg class="animate-spin ...">...</svg> Elaborazione...';
// ...
btn.innerHTML = originalContent;

// AFTER — Usare stato React
const [batchProcessing, setBatchProcessing] = useState(false);
// Nel JSX del bottone:
<Button disabled={batchProcessing}>
  {batchProcessing ? (
    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Elaborazione...</>
  ) : (
    <>Processa Batch</>
  )}
</Button>
```

**Spiegazione**: innerHTML con dati utente non escapati (`i.denominazione`, `i.partita_iva`) consente XSS. React auto-escapa il contenuto nel JSX.

---

### FIX 1.3 — Rimuovere chiave Firebase hardcoded

**File**: `client/src/lib/firebase.ts`
**Riga**: ~32

```typescript
// BEFORE (riga ~32)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQlKp8jQi7Q19tXQtTYpdgivw-WyhocTg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dmshub-auth-2975e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dmshub-auth-2975e",
  // ...
};

// AFTER — Rimuovere fallback hardcoded
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('[Firebase] VITE_FIREBASE_API_KEY mancante. Configura le variabili d\'ambiente.');
}
```

**Azioni aggiuntive**:
- Verificare che `.env`, `.env.production`, `.env.local` su Vercel abbiano tutte le variabili
- Nel Firebase Console: impostare restrizioni API Key per dominio (solo `dms-hub-app-new.vercel.app`)
- Considerare rotazione della chiave API (opzionale, Firebase Web API Keys sono pubbliche per design)

---

## PRIORITA 2: PROGETTO ASSOCIAZIONI

### Architettura della Soluzione

**Problema**: L'impersonificazione attuale supporta solo `comune_id` nell'URL. Non esiste un campo `entity_type` o `associazione_id`. Quando si impersonifica un'associazione, i tab mostrano dati globali anziche dati filtrati/azzerati.

**Soluzione**: Estendere `useImpersonation.ts` per supportare un secondo tipo di entita (`associazione`) senza toccare il flusso `comune_id` esistente.

**Flusso attuale (comuni)**:
```
ComuniPanel → window.location.href = /dashboard-pa?impersonate=true&comune_id=96&comune_nome=Grosseto
            → useImpersonation() legge comune_id dall'URL
            → addComuneIdToUrl() aggiunge &comune_id=96 alle fetch
            → ImpersonationBanner mostra barra gialla
```

**Flusso nuovo (associazioni)** — DA COSTRUIRE:
```
ComuniPanel o AssociazioniPanel → window.location.href = /dashboard-pa?impersonate=true&entity_type=associazione&associazione_id=5&associazione_nome=Confesercenti
            → useImpersonation() legge entity_type + associazione_id dall'URL
            → isAssociazione() restituisce true
            → I componenti mostrano stato vuoto o dati filtrati per associazione
            → ImpersonationBanner mostra barra gialla con icona Briefcase
```

---

### FILE 1: useImpersonation.ts (MODIFICARE)

**File**: `client/src/hooks/useImpersonation.ts`
**Scopo**: Aggiungere supporto entity_type + associazione_id

```typescript
// =============================================
// BEFORE — ImpersonationState (righe 13-18)
// =============================================
export interface ImpersonationState {
  isImpersonating: boolean;
  comuneId: string | null;
  comuneNome: string | null;
  userEmail: string | null;
}

// =============================================
// AFTER — ImpersonationState esteso
// =============================================
export interface ImpersonationState {
  isImpersonating: boolean;
  comuneId: string | null;
  comuneNome: string | null;
  userEmail: string | null;
  // Nuovo: tipo entita (default: 'comune')
  entityType: 'comune' | 'associazione';
  associazioneId: string | null;
  associazioneNome: string | null;
}
```

```typescript
// =============================================
// BEFORE — UseImpersonationReturn (righe 20-27)
// =============================================
export interface UseImpersonationReturn extends ImpersonationState {
  addComuneIdToUrl: (url: string) => string;
  getFetchOptions: () => { headers?: Record<string, string> };
  endImpersonation: () => void;
}

// =============================================
// AFTER — UseImpersonationReturn esteso
// =============================================
export interface UseImpersonationReturn extends ImpersonationState {
  addComuneIdToUrl: (url: string) => string;
  getFetchOptions: () => { headers?: Record<string, string> };
  endImpersonation: () => void;
  // Nuovo: helper per associazioni
  isAssociazione: boolean;
  isComune: boolean;
  addAssociazioneIdToUrl: (url: string) => string;
}
```

```typescript
// =============================================
// BEFORE — getParamsFromUrl() (righe 56-64)
// =============================================
function getParamsFromUrl(): ImpersonationState {
  const params = new URLSearchParams(window.location.search);
  return {
    isImpersonating: params.get('impersonate') === 'true',
    comuneId: params.get('comune_id'),
    comuneNome: params.get('comune_nome'),
    userEmail: params.get('user_email')
  };
}

// =============================================
// AFTER — getParamsFromUrl() esteso
// =============================================
function getParamsFromUrl(): ImpersonationState {
  const params = new URLSearchParams(window.location.search);
  const entityType = (params.get('entity_type') as 'comune' | 'associazione') || 'comune';
  return {
    isImpersonating: params.get('impersonate') === 'true',
    comuneId: params.get('comune_id'),
    comuneNome: params.get('comune_nome'),
    userEmail: params.get('user_email'),
    entityType,
    associazioneId: params.get('associazione_id'),
    associazioneNome: params.get('associazione_nome'),
  };
}
```

```typescript
// =============================================
// BEFORE — getCombinedState() branch check (righe 71, 78)
// =============================================
  if (urlState.isImpersonating && urlState.comuneId) {
    // ...
  }
  if (storedState && storedState.isImpersonating && storedState.comuneId) {
    // ...
  }

// =============================================
// AFTER — getCombinedState() branch check esteso
// =============================================
  // URL ha i parametri di impersonificazione (comune O associazione)
  if (urlState.isImpersonating && (urlState.comuneId || urlState.associazioneId)) {
    saveToStorage(urlState);
    return urlState;
  }
  // sessionStorage (comune O associazione)
  if (storedState && storedState.isImpersonating && (storedState.comuneId || storedState.associazioneId)) {
    return storedState;
  }
```

```typescript
// =============================================
// BEFORE — stato default in getCombinedState() (righe 83-88)
// =============================================
  return {
    isImpersonating: false,
    comuneId: null,
    comuneNome: null,
    userEmail: null
  };

// =============================================
// AFTER — stato default esteso
// =============================================
  return {
    isImpersonating: false,
    comuneId: null,
    comuneNome: null,
    userEmail: null,
    entityType: 'comune',
    associazioneId: null,
    associazioneNome: null,
  };
```

```typescript
// =============================================
// AFTER — Aggiungere PRIMA del return in useImpersonation() (dopo riga 158)
// =============================================

  // Helper per associazioni
  const isAssociazione = state.isImpersonating && state.entityType === 'associazione';
  const isComune = state.isImpersonating && state.entityType === 'comune';

  const addAssociazioneIdToUrl = useCallback((url: string): string => {
    const currentState = getCombinedState();
    if (currentState.entityType !== 'associazione' || !currentState.associazioneId) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}associazione_id=${currentState.associazioneId}`;
  }, []);

  return {
    ...state,
    addComuneIdToUrl,
    getFetchOptions,
    endImpersonation,
    isAssociazione,
    isComune,
    addAssociazioneIdToUrl,
  };
```

```typescript
// =============================================
// BEFORE — endImpersonation callback (righe 144-158)
// =============================================
  const endImpersonation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({
      isImpersonating: false,
      comuneId: null,
      comuneNome: null,
      userEmail: null
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    url.searchParams.delete('comune_id');
    url.searchParams.delete('comune_nome');
    url.searchParams.delete('user_email');
    window.history.replaceState({}, '', url.toString());
  }, []);

// =============================================
// AFTER — endImpersonation callback esteso
// =============================================
  const endImpersonation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({
      isImpersonating: false,
      comuneId: null,
      comuneNome: null,
      userEmail: null,
      entityType: 'comune',
      associazioneId: null,
      associazioneNome: null,
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    url.searchParams.delete('comune_id');
    url.searchParams.delete('comune_nome');
    url.searchParams.delete('user_email');
    url.searchParams.delete('entity_type');
    url.searchParams.delete('associazione_id');
    url.searchParams.delete('associazione_nome');
    window.history.replaceState({}, '', url.toString());
  }, []);
```

```typescript
// =============================================
// AFTER — Anche la funzione standalone endImpersonation (riga 187)
// =============================================
export function endImpersonation(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  const url = new URL(window.location.href);
  url.searchParams.delete('impersonate');
  url.searchParams.delete('comune_id');
  url.searchParams.delete('comune_nome');
  url.searchParams.delete('user_email');
  url.searchParams.delete('entity_type');
  url.searchParams.delete('associazione_id');
  url.searchParams.delete('associazione_nome');
  window.history.replaceState({}, '', url.toString());
}
```

```typescript
// =============================================
// AFTER — Aggiungere funzione standalone per associazione (dopo riga 195)
// =============================================
// Helper standalone per aggiungere associazione_id alle URL
export function addAssociazioneIdToUrl(url: string): string {
  const { entityType, associazioneId } = getCombinedState();

  if (entityType !== 'associazione' || !associazioneId) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}associazione_id=${associazioneId}`;
}

// Helper per verificare se siamo in impersonificazione associazione
export function isAssociazioneImpersonation(): boolean {
  const state = getCombinedState();
  return state.isImpersonating && state.entityType === 'associazione';
}
```

**Rischio regressione comuni**: NESSUNO. Il campo `entityType` ha default `'comune'`, i branch `comuneId` restano invariati, `addComuneIdToUrl` non e modificato.

---

### FILE 2: ImpersonationBanner.tsx (MODIFICARE)

**File**: `client/src/components/ImpersonationBanner.tsx`
**Scopo**: Mostrare "Associazione X" anziche "Comune Y" quando entity_type=associazione

```typescript
// =============================================
// BEFORE — useEffect check (righe 27-33)
// =============================================
      if (state.isImpersonating && state.comuneId) {
        setImpersonationData({
          comune_id: parseInt(state.comuneId),
          comune_nome: state.comuneNome ? decodeURIComponent(state.comuneNome) : `Comune #${state.comuneId}`,
          user_id: 0,
          user_email: state.userEmail ? decodeURIComponent(state.userEmail) : ''
        });

// =============================================
// AFTER — useEffect check esteso per associazione
// =============================================
      if (state.isImpersonating && (state.comuneId || state.associazioneId)) {
        const isAssoc = state.entityType === 'associazione';
        setImpersonationData({
          comune_id: isAssoc ? 0 : parseInt(state.comuneId || '0'),
          comune_nome: isAssoc
            ? (state.associazioneNome ? decodeURIComponent(state.associazioneNome) : `Associazione #${state.associazioneId}`)
            : (state.comuneNome ? decodeURIComponent(state.comuneNome) : `Comune #${state.comuneId}`),
          user_id: 0,
          user_email: state.userEmail ? decodeURIComponent(state.userEmail) : '',
        });
```

```typescript
// =============================================
// BEFORE — Testo banner (riga 72)
// =============================================
            Stai visualizzando come: <strong>{impersonationData.comune_nome}</strong>

// =============================================
// AFTER — Testo banner condizionale
// =============================================
            Stai visualizzando come: <strong>{impersonationData.comune_nome}</strong>
```

**Nota**: Il testo `comune_nome` conterra gia il nome dell'associazione grazie alla logica sopra. Se si vuole differenziare l'icona (Eye vs Briefcase), aggiungere:

```typescript
// Aggiungere import
import { Eye, X, ExternalLink, AlertTriangle, Briefcase } from 'lucide-react';

// Nel JSX (riga 68)
// BEFORE
<Eye className="w-4 h-4" />

// AFTER — Icona condizionale
{getImpersonationParams().entityType === 'associazione'
  ? <Briefcase className="w-4 h-4" />
  : <Eye className="w-4 h-4" />}
```

---

### FILE 3: DashboardPA.tsx — Overview KPI (MODIFICARE)

**File**: `client/src/pages/DashboardPA.tsx`
**Scopo**: Quando entityType='associazione', le KPI overview devono mostrare dati specifici dell'associazione o zero

```typescript
// =============================================
// BEFORE — useDashboardData() fetch overview (righe 95-107)
// =============================================
    const urlParams = new URLSearchParams(window.location.search);
    const comuneId = urlParams.get('comune_id');
    const isImpersonating = urlParams.get('impersonate') === 'true';

    const comuneFilter = (comuneId && isImpersonating) ? `?comune_id=${comuneId}` : '';

    fetch(`${MIHUB_API}/stats/overview${comuneFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsOverview(data.data);
        }
      })
      .catch(err => console.error('Stats overview fetch error:', err));

// =============================================
// AFTER — useDashboardData() con check entityType
// =============================================
    const urlParams = new URLSearchParams(window.location.search);
    const comuneId = urlParams.get('comune_id');
    const isImpersonating = urlParams.get('impersonate') === 'true';
    const entityType = urlParams.get('entity_type') || 'comune';
    const associazioneId = urlParams.get('associazione_id');

    // Se impersonificazione associazione: stats a zero (le associazioni non hanno overview propria)
    if (isImpersonating && entityType === 'associazione') {
      setStatsOverview({
        totalMarkets: 0, totalStalls: 0, totalShops: 0,
        totalTransactions: 0, occupancyRate: '0%',
        imprese: 0, autorizzazioni: 0, comuni: 0,
        _associazione: true, // flag per sapere che e' un'associazione
      });
      // Non fare fetch per realtime, growth, etc. — saranno vuoti
      return;
    }

    const comuneFilter = (comuneId && isImpersonating) ? `?comune_id=${comuneId}` : '';

    fetch(`${MIHUB_API}/stats/overview${comuneFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsOverview(data.data);
        }
      })
      .catch(err => console.error('Stats overview fetch error:', err));
```

**Spiegazione**: Quando si impersonifica un'associazione, le stats overview (mercati, posteggi, negozi, transazioni) non hanno senso. Si settano a zero con un flag `_associazione: true` per eventuale logica condizionale nel rendering.

**Rischio regressione comuni**: NESSUNO. Il blocco `if entityType === 'associazione'` viene prima del flusso esistente. Se entityType e' `'comune'` (default), il codice originale continua invariato.

---

### FILE 4: DashboardPA.tsx — Tab imprese (MODIFICARE)

**File**: `client/src/pages/DashboardPA.tsx`
**Scopo**: Quando entityType='associazione', il tab imprese deve filtrare per associazione_id

```typescript
// =============================================
// BEFORE — Fetch imprese stats (righe 874-891)
// =============================================
  useEffect(() => {
    fetch('/api/imprese?stats_only=true')
      .then(r => r.json())
      .then(data => {
        // ...
      })
      .catch(err => console.error('Error loading imprese stats from REST:', err));
  }, []);

// =============================================
// AFTER — Fetch imprese con filtro associazione
// =============================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const entityType = urlParams.get('entity_type') || 'comune';
    const associazioneId = urlParams.get('associazione_id');

    // Se associazione: fetch imprese associate
    if (entityType === 'associazione' && associazioneId) {
      const MIHUB_API = import.meta.env.VITE_MIHUB_API_BASE_URL || 'https://orchestratore.mio-hub.me/api';
      fetch(`${MIHUB_API}/bandi/associazioni/${associazioneId}/imprese`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            const imprese = data.data;
            const totalConcessioni = imprese.reduce((acc: number, i: any) => acc + (i.concessioni_attive?.length || 0), 0);
            const comuniUnici = Array.from(new Set(imprese.map((i: any) => i.comune).filter(Boolean))).length;
            const media = imprese.length > 0 ? (totalConcessioni / imprese.length).toFixed(1) : '0';
            setImpreseStats({ total: imprese.length, concessioni: totalConcessioni, comuni: comuniUnici, media });
          } else {
            setImpreseStats({ total: 0, concessioni: 0, comuni: 0, media: '0' });
          }
        })
        .catch(() => setImpreseStats({ total: 0, concessioni: 0, comuni: 0, media: '0' }));
      return;
    }

    // Flusso originale (comune o nessuna impersonificazione)
    fetch('/api/imprese?stats_only=true')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.stats) {
          setImpreseStats(data.stats);
        } else if (data.success && data.data) {
          const imprese = data.data;
          const totalConcessioni = imprese.reduce((acc: number, i: any) => acc + (i.concessioni_attive?.length || 0), 0);
          const comuniUnici = Array.from(new Set(imprese.map((i: any) => i.comune).filter(Boolean))).length;
          const media = imprese.length > 0 ? (totalConcessioni / imprese.length).toFixed(1) : '0';
          setImpreseStats({ total: imprese.length, concessioni: totalConcessioni, comuni: comuniUnici, media });
        }
      })
      .catch(err => console.error('Error loading imprese stats from REST:', err));
  }, []);
```

**Nota backend**: L'endpoint `GET /bandi/associazioni/:id/imprese` potrebbe non esistere. Se non esiste, va creato. In alternativa si puo usare `GET /api/imprese?associazione_id=X` aggiungendo il filtro al backend esistente.

---

### FILE 5: GamingRewardsPanel.tsx (MODIFICARE)

**File**: `client/src/components/GamingRewardsPanel.tsx`
**Scopo**: Mostrare card "Non applicabile" per associazioni

```typescript
// =============================================
// BEFORE — Inizio componente (riga ~100, dopo gli import)
// =============================================
export default function GamingRewardsPanel() {
  // ... tutti gli useState, useEffect, etc.

// =============================================
// AFTER — Aggiungere check subito dentro il componente
// =============================================
export default function GamingRewardsPanel() {
  const { isImpersonating, entityType } = useImpersonation();
  // ... (useImpersonation gia importato a riga 30)

  // Se associazione: mostra card informativa
  if (isImpersonating && entityType === 'associazione') {
    return (
      <Card className="bg-[#1a2332] border-[#8b5cf6]/20">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#8b5cf6]" />
            Gaming & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[#e8fbff]/50">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-2">Non applicabile per associazioni</p>
            <p className="text-sm">Il sistema Gaming & Rewards e' disponibile per i singoli comuni.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ... resto del componente invariato
```

**Nota**: `useImpersonation()` e' gia importato a riga 30. Il check `entityType` viene dal hook esteso (File 1). Se `entityType` non e' presente (vecchio codice), il default e' `'comune'` e il componente funziona normalmente.

**Rischio regressione**: NESSUNO. Early return solo per `entityType === 'associazione'`.

---

### FILE 6: CivicReportsPanel.tsx (MODIFICARE)

**File**: `client/src/components/CivicReportsPanel.tsx`
**Scopo**: Mostrare stato vuoto per associazioni

```typescript
// =============================================
// BEFORE — Dopo useImpersonation() (riga 56)
// =============================================
  const { comuneId: impersonatedComuneId } = useImpersonation();
  const { setSelectedReport } = useCivicReports();
  const comuneId = impersonatedComuneId ? parseInt(impersonatedComuneId) : 1;

// =============================================
// AFTER — Aggiungere entityType e check
// =============================================
  const { comuneId: impersonatedComuneId, isImpersonating, entityType } = useImpersonation();
  const { setSelectedReport } = useCivicReports();
  const comuneId = impersonatedComuneId ? parseInt(impersonatedComuneId) : 1;

  // Se associazione: non caricare dati
  const isAssociazione = isImpersonating && entityType === 'associazione';
```

```typescript
// =============================================
// BEFORE — loadStats (riga 61)
// =============================================
  const loadStats = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/civic-reports/stats?comune_id=${comuneId}`),
        fetch(`${API_BASE_URL}/api/civic-reports?comune_id=${comuneId}&limit=200`)
      ]);

// =============================================
// AFTER — loadStats con guard associazione
// =============================================
  const loadStats = async () => {
    // Associazioni non hanno segnalazioni civiche
    if (isAssociazione) {
      setStats({ pending: 0, inProgress: 0, resolved: 0, rejected: 0, total: 0, todayNew: 0, todayResolved: 0, recent: [], byType: [] });
      setAllReports([]);
      setLoading(false);
      return;
    }
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/civic-reports/stats?comune_id=${comuneId}`),
        fetch(`${API_BASE_URL}/api/civic-reports?comune_id=${comuneId}&limit=200`)
      ]);
```

**Rischio regressione**: NESSUNO. Guard in cima alla funzione, il flusso comune prosegue sotto.

---

### FILE 7: ImpreseQualificazioniPanel.tsx (MODIFICARE)

**File**: `client/src/components/ImpreseQualificazioniPanel.tsx`
**Scopo**: Filtrare imprese per associazione_id quando in impersonificazione associazione

```typescript
// =============================================
// BEFORE — Import e fetch imprese (righe 7, 65-69)
// =============================================
import { addComuneIdToUrl } from '@/hooks/useImpersonation';
// ...
  useEffect(() => {
    const fetchImprese = async () => {
      setLoading(true);
      try {
        const response = await fetch(addComuneIdToUrl(`${API_BASE_URL}/api/imprese?limit=200`));

// =============================================
// AFTER — Aggiungere import + logica associazione
// =============================================
import { addComuneIdToUrl, isAssociazioneImpersonation, addAssociazioneIdToUrl } from '@/hooks/useImpersonation';
// ...
  useEffect(() => {
    const fetchImprese = async () => {
      setLoading(true);
      try {
        // Se associazione: filtra imprese per associazione_id
        let url = `${API_BASE_URL}/api/imprese?limit=200`;
        if (isAssociazioneImpersonation()) {
          url = addAssociazioneIdToUrl(url);
        } else {
          url = addComuneIdToUrl(url);
        }
        const response = await fetch(url);
```

**Nota backend**: Il backend `GET /api/imprese` deve supportare il query param `associazione_id` per filtrare le imprese associate. Se non supportato, va aggiunto.

**Rischio regressione**: NESSUNO. `isAssociazioneImpersonation()` restituisce false per default (comuni).

---

### FILE 8: SuapPanel.tsx — Bloccare caricamento dati (MODIFICARE)

**File**: `client/src/components/SuapPanel.tsx`
**Scopo**: Quando impersonificato come associazione, loadData() NON deve caricare pratiche/concessioni ma settare stati a zero.

Il SuapPanel e' montato nel tab "ssosuap" (`<SuapPanel />` a riga 4079). Non ha prop `mode`. Il problema e' che `loadComuneData()` cerca `comuneId` tramite `getImpersonationParams()`, e quando impersonificato come associazione `comuneId` sara' null, causando il caricamento dei dati default (Grosseto, id=1).

```typescript
// =============================================
// BEFORE — Import (riga 20, 30)
// =============================================
import { addComuneIdToUrl } from '@/hooks/useImpersonation';
// ...
import { getImpersonationParams } from '@/hooks/useImpersonation';

// =============================================
// AFTER — Import esteso
// =============================================
import { addComuneIdToUrl, isAssociazioneImpersonation } from '@/hooks/useImpersonation';
// ...
import { getImpersonationParams } from '@/hooks/useImpersonation';
```

```typescript
// =============================================
// BEFORE — loadData() (righe 265-291)
// =============================================
  const loadData = async () => {
    setLoading(true);
    try {
      const comuneNomeFilter = comuneData?.nome?.toUpperCase() || '';
      const [statsData, praticheData] = await Promise.all([
        getSuapStats(ENTE_ID),
        getSuapPratiche(ENTE_ID, { comune_nome: comuneNomeFilter })
      ]);
      setStats(statsData);
      const sorted = praticheData.sort((a, b) =>
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setPratiche(sorted);

      await loadConcessioni();
      await loadDomandeSpuntaDashboard();
      await loadNotificheCount();
    } catch (error) {
      console.error('Error loading SUAP data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

// =============================================
// AFTER — loadData() con guard associazione
// =============================================
  const loadData = async () => {
    setLoading(true);

    // Se impersonificazione associazione: dati vuoti
    if (isAssociazioneImpersonation()) {
      setStats({ totale: 0, in_attesa: 0, approvate: 0, rifiutate: 0, in_lavorazione: 0 } as any);
      setPratiche([]);
      setConcessioni([]);
      setDomandeSpuntaDashboard([]);
      setLoading(false);
      return;
    }

    try {
      const comuneNomeFilter = comuneData?.nome?.toUpperCase() || '';
      const [statsData, praticheData] = await Promise.all([
        getSuapStats(ENTE_ID),
        getSuapPratiche(ENTE_ID, { comune_nome: comuneNomeFilter })
      ]);
      setStats(statsData);
      const sorted = praticheData.sort((a, b) =>
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setPratiche(sorted);

      await loadConcessioni();
      await loadDomandeSpuntaDashboard();
      await loadNotificheCount();
    } catch (error) {
      console.error('Error loading SUAP data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };
```

**Rischio regressione**: NESSUNO. Guard in cima alla funzione.

---

### FILE 9: GestioneHubPanel.tsx (MODIFICARE)

**File**: `client/src/components/GestioneHubPanel.tsx`
**Scopo**: Filtrare dati workspace per associazione

```typescript
// =============================================
// BEFORE — Import (riga 48)
// =============================================
import { addComuneIdToUrl } from '@/hooks/useImpersonation';

// =============================================
// AFTER — Import esteso
// =============================================
import { addComuneIdToUrl, isAssociazioneImpersonation, addAssociazioneIdToUrl } from '@/hooks/useImpersonation';
```

Per le fetch che usano `addComuneIdToUrl()`, aggiungere la logica:
```typescript
// Pattern generico da applicare in ogni fetch del GestioneHubPanel
// BEFORE
const response = await fetch(addComuneIdToUrl(`${API_BASE_URL}/api/...`));

// AFTER
const url = isAssociazioneImpersonation()
  ? addAssociazioneIdToUrl(`${API_BASE_URL}/api/...`)
  : addComuneIdToUrl(`${API_BASE_URL}/api/...`);
const response = await fetch(url);
```

**Nota**: Questo richiede che il backend supporti `?associazione_id=X` sugli endpoint workspace. Se non supportato, mostrare stato vuoto come per GamingRewardsPanel.

---

### FILE 10: DashboardPA.tsx — Sotto-tab "SCIA & Pratiche" nel docs (MODIFICARE)

**File**: `client/src/pages/DashboardPA.tsx`
**Riga**: ~1284 (fetch pratiche SCIA per associazioni) e ~6148 (rendering sotto-tab)

Il sotto-tab "SCIA & Pratiche" dentro il tab "Enti & Associazioni" (docs) gia mostra pratiche SCIA e domande spunta. Quando si impersonifica un'associazione, questo sotto-tab deve filtrare le pratiche per l'associazione specifica.

```typescript
// =============================================
// BEFORE — Fetch pratiche SCIA (riga ~1284)
// =============================================
    // Fetch pratiche SCIA per sotto-tab associazioni
    fetch(`${MIHUB_API}/suap/pratiche`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setSciaPraticheList(data.data);
          // calcola stats
        }
      });

// =============================================
// AFTER — Fetch pratiche SCIA filtrate per associazione
// =============================================
    const assocId = urlParams.get('associazione_id');
    const assocFilter = assocId ? `?associazione_id=${assocId}` : '';

    fetch(`${MIHUB_API}/suap/pratiche${assocFilter}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setSciaPraticheList(data.data);
        }
      });
```

**Rischio regressione**: NESSUNO. Se `associazione_id` non e' nell'URL, il filtro e' vuoto e la fetch e' identica.

---

### FILE 11: PresenzeAssociatiPanel.tsx (CREARE)

**File**: `client/src/components/PresenzeAssociatiPanel.tsx` (NUOVO)
**Scopo**: Tab presenze per associazioni — mostra le presenze degli operatori associati nei mercati

```tsx
/**
 * PresenzeAssociatiPanel.tsx
 * Tab presenze per impersonificazione associazioni.
 * Mostra le presenze giornaliere degli operatori associati nei mercati.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Clock, Users, MapPin, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { MIHUB_API_BASE_URL } from '@/config/api';
import { getImpersonationParams } from '@/hooks/useImpersonation';

interface PresenzaAssociato {
  id: number;
  impresa_nome: string;
  impresa_piva: string;
  mercato_nome: string;
  posteggio: string;
  data: string;
  presente: boolean;
  orario_arrivo?: string;
  orario_partenza?: string;
}

export default function PresenzeAssociatiPanel() {
  const [presenze, setPresenze] = useState<PresenzaAssociato[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPresenze();
  }, [dataFiltro]);

  const loadPresenze = async () => {
    setLoading(true);
    try {
      const { associazioneId } = getImpersonationParams();
      if (!associazioneId) {
        setPresenze([]);
        setLoading(false);
        return;
      }
      const API = MIHUB_API_BASE_URL;
      const res = await fetch(`${API}/api/presenze?associazione_id=${associazioneId}&data=${dataFiltro}`);
      const data = await res.json();
      if (data.success && data.data) {
        setPresenze(data.data);
      } else {
        setPresenze([]);
      }
    } catch (err) {
      console.error('Errore caricamento presenze:', err);
      setPresenze([]);
    } finally {
      setLoading(false);
    }
  };

  const presenti = presenze.filter(p => p.presente).length;
  const assenti = presenze.filter(p => !p.presente).length;

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" /> Presenti
            </div>
            <div className="text-2xl font-bold text-white">{presenti}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <XCircle className="w-4 h-4" /> Assenti
            </div>
            <div className="text-2xl font-bold text-white">{assenti}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <Users className="w-4 h-4" /> Totale Associati
            </div>
            <div className="text-2xl font-bold text-white">{presenze.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
              <Calendar className="w-4 h-4" /> Data
            </div>
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="bg-transparent text-white text-lg font-bold border-none outline-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Lista presenze */}
      <Card className="bg-[#1a2332] border-[#14b8a6]/20">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#14b8a6]" />
            Presenze del {new Date(dataFiltro).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
            </div>
          ) : presenze.length === 0 ? (
            <div className="text-center py-12 text-[#e8fbff]/50">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nessuna presenza registrata per questa data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {presenze.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                  <div className="flex items-center gap-3">
                    {p.presente
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                    <div>
                      <div className="text-[#e8fbff] font-medium">{p.impresa_nome}</div>
                      <div className="text-xs text-[#e8fbff]/50">{p.impresa_piva}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-[#e8fbff]/70 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.mercato_nome}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">Post. {p.posteggio}</div>
                    </div>
                    {p.presente && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                        {p.orario_arrivo || '--:--'} - {p.orario_partenza || '--:--'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Backend necessario**: Endpoint `GET /api/presenze?associazione_id=X&data=YYYY-MM-DD` che restituisce le presenze degli operatori associati.

---

### FILE 12: AnagraficaAssociazionePanel.tsx (CREARE)

**File**: `client/src/components/AnagraficaAssociazionePanel.tsx` (NUOVO)
**Scopo**: Tab anagrafica per associazione impersonificata — mostra dati, contratti, fatture

```tsx
/**
 * AnagraficaAssociazionePanel.tsx
 * Tab anagrafica per impersonificazione associazioni.
 * Mostra dati dell'associazione, contratti attivi, fatture.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2, FileText, CreditCard, Users, Loader2, Calendar, Euro, Phone, Mail, MapPin
} from 'lucide-react';
import { MIHUB_API_BASE_URL } from '@/config/api';
import { getImpersonationParams } from '@/hooks/useImpersonation';

interface Associazione {
  id: number;
  nome: string;
  codice_fiscale: string;
  partita_iva: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  cap: string;
  telefono: string;
  email: string;
  pec: string;
  presidente: string;
  data_costituzione: string;
  num_associati: number;
}

interface Contratto {
  id: number;
  tipo: string;
  descrizione: string;
  data_inizio: string;
  data_fine: string;
  importo: number;
  stato: 'attivo' | 'scaduto' | 'in_rinnovo';
}

interface Fattura {
  id: number;
  numero: string;
  data: string;
  importo: number;
  stato: 'pagata' | 'in_attesa' | 'scaduta';
  descrizione: string;
}

export default function AnagraficaAssociazionePanel() {
  const [associazione, setAssociazione] = useState<Associazione | null>(null);
  const [contratti, setContratti] = useState<Contratto[]>([]);
  const [fatture, setFatture] = useState<Fattura[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dati' | 'contratti' | 'fatture'>('dati');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { associazioneId } = getImpersonationParams();
      if (!associazioneId) {
        setLoading(false);
        return;
      }
      const API = MIHUB_API_BASE_URL;
      const [assocRes, contrattiRes, fattureRes] = await Promise.all([
        fetch(`${API}/api/associazioni/${associazioneId}`).then(r => r.json()),
        fetch(`${API}/api/associazioni/${associazioneId}/contratti`).then(r => r.json()),
        fetch(`${API}/api/associazioni/${associazioneId}/fatture`).then(r => r.json()),
      ]);
      if (assocRes.success) setAssociazione(assocRes.data);
      if (contrattiRes.success) setContratti(contrattiRes.data || []);
      if (fattureRes.success) setFatture(fattureRes.data || []);
    } catch (err) {
      console.error('Errore caricamento anagrafica associazione:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  if (!associazione) {
    return (
      <Card className="bg-[#1a2332] border-[#14b8a6]/20">
        <CardContent className="p-8 text-center text-[#e8fbff]/50">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nessun dato anagrafico disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sotto-tab */}
      <div className="flex gap-2">
        {(['dati', 'contratti', 'fatture'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
              activeSection === section
                ? 'bg-[#14b8a6] border-[#14b8a6] text-white'
                : 'bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]'
            }`}
          >
            {section === 'dati' && <><Building2 className="w-4 h-4 inline mr-1" /> Dati Associazione</>}
            {section === 'contratti' && <><FileText className="w-4 h-4 inline mr-1" /> Contratti ({contratti.length})</>}
            {section === 'fatture' && <><CreditCard className="w-4 h-4 inline mr-1" /> Fatture ({fatture.length})</>}
          </button>
        ))}
      </div>

      {/* SEZIONE DATI */}
      {activeSection === 'dati' && (
        <Card className="bg-[#1a2332] border-[#14b8a6]/20">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#14b8a6]" />
              {associazione.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Codice Fiscale</label>
                  <p className="text-[#e8fbff] font-mono">{associazione.codice_fiscale}</p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Partita IVA</label>
                  <p className="text-[#e8fbff] font-mono">{associazione.partita_iva}</p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Presidente</label>
                  <p className="text-[#e8fbff]">{associazione.presidente}</p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Data Costituzione</label>
                  <p className="text-[#e8fbff]">{new Date(associazione.data_costituzione).toLocaleDateString('it-IT')}</p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Associati</label>
                  <p className="text-[#e8fbff] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#14b8a6]" /> {associazione.num_associati}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Indirizzo</label>
                  <p className="text-[#e8fbff] flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#14b8a6]" />
                    {associazione.indirizzo}, {associazione.cap} {associazione.citta} ({associazione.provincia})
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Telefono</label>
                  <p className="text-[#e8fbff] flex items-center gap-1">
                    <Phone className="w-4 h-4 text-[#14b8a6]" /> {associazione.telefono}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Email</label>
                  <p className="text-[#e8fbff] flex items-center gap-1">
                    <Mail className="w-4 h-4 text-[#14b8a6]" /> {associazione.email}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#e8fbff]/50">PEC</label>
                  <p className="text-[#e8fbff] flex items-center gap-1">
                    <Mail className="w-4 h-4 text-[#f59e0b]" /> {associazione.pec}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEZIONE CONTRATTI */}
      {activeSection === 'contratti' && (
        <Card className="bg-[#1a2332] border-[#14b8a6]/20">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#14b8a6]" />
              Contratti Associazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratti.length === 0 ? (
              <div className="text-center py-8 text-[#e8fbff]/50">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nessun contratto registrato</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#14b8a6]/20">
                    <TableHead className="text-[#e8fbff]/70">Tipo</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Descrizione</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Periodo</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Importo</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratti.map(c => (
                    <TableRow key={c.id} className="border-[#14b8a6]/10">
                      <TableCell className="text-[#e8fbff]">{c.tipo}</TableCell>
                      <TableCell className="text-[#e8fbff]/70">{c.descrizione}</TableCell>
                      <TableCell className="text-[#e8fbff]/70 text-sm">
                        {new Date(c.data_inizio).toLocaleDateString('it-IT')} - {new Date(c.data_fine).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="text-[#e8fbff] font-mono">
                        {c.importo.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          c.stato === 'attivo' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.stato === 'in_rinnovo' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }>{c.stato}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* SEZIONE FATTURE */}
      {activeSection === 'fatture' && (
        <Card className="bg-[#1a2332] border-[#14b8a6]/20">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#14b8a6]" />
              Fatture
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fatture.length === 0 ? (
              <div className="text-center py-8 text-[#e8fbff]/50">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nessuna fattura registrata</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#14b8a6]/20">
                    <TableHead className="text-[#e8fbff]/70">Numero</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Data</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Descrizione</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Importo</TableHead>
                    <TableHead className="text-[#e8fbff]/70">Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fatture.map(f => (
                    <TableRow key={f.id} className="border-[#14b8a6]/10">
                      <TableCell className="text-[#e8fbff] font-mono">{f.numero}</TableCell>
                      <TableCell className="text-[#e8fbff]/70">{new Date(f.data).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell className="text-[#e8fbff]/70">{f.descrizione}</TableCell>
                      <TableCell className="text-[#e8fbff] font-mono">
                        {f.importo.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          f.stato === 'pagata' ? 'bg-emerald-500/20 text-emerald-400' :
                          f.stato === 'in_attesa' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }>{f.stato}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Backend necessario**:
- `GET /api/associazioni/:id` — dati anagrafica
- `GET /api/associazioni/:id/contratti` — lista contratti
- `GET /api/associazioni/:id/fatture` — lista fatture

Questi endpoint probabilmente esistono gia (19 endpoint CRUD nel backend associazioni).

---

### FILE 13: DashboardPA.tsx — Montare i nuovi tab (MODIFICARE)

**File**: `client/src/pages/DashboardPA.tsx`
**Scopo**: Aggiungere `<TabsContent>` per i tab "presenze" e "anagrafica" e importare i nuovi componenti

```typescript
// =============================================
// AFTER — Aggiungere import in cima al file
// =============================================
import PresenzeAssociatiPanel from '@/components/PresenzeAssociatiPanel';
import AnagraficaAssociazionePanel from '@/components/AnagraficaAssociazionePanel';
```

```typescript
// =============================================
// AFTER — Aggiungere i due TabsContent nella sezione tabs
// (inserire prima della chiusura </Tabs>)
// =============================================

          {/* TAB: PRESENZE ASSOCIATI (visibile solo in impersonificazione associazione) */}
          <TabsContent value="presenze" className="space-y-6">
            <PresenzeAssociatiPanel />
          </TabsContent>

          {/* TAB: ANAGRAFICA ASSOCIAZIONE (visibile solo in impersonificazione associazione) */}
          <TabsContent value="anagrafica" className="space-y-6">
            <AnagraficaAssociazionePanel />
          </TabsContent>
```

**Nota**: I tab "presenze" e "anagrafica" sono gia protetti da RBAC (`ProtectedTab`), quindi saranno visibili solo se l'utente ha il permesso `tab.view.presenze` / `tab.view.anagrafica`. Serve anche aggiungere i bottoni nella sidebar dei tab (TabsTrigger) con le icone appropriate.

```typescript
// Aggiungere i bottoni tab nella sidebar (dopo gli altri ProtectedTab)
            <ProtectedTab tabId="presenze">
            <button
              onClick={() => setActiveTab('presenze')}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                activeTab === 'presenze'
                  ? 'bg-[#14b8a6] border-[#14b8a6] text-white shadow-lg'
                  : 'bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]'
              }`}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-xs font-medium">Presenze</span>
            </button>
            </ProtectedTab>
            <ProtectedTab tabId="anagrafica">
            <button
              onClick={() => setActiveTab('anagrafica')}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                activeTab === 'anagrafica'
                  ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg'
                  : 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]'
              }`}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-xs font-medium">Anagrafica</span>
            </button>
            </ProtectedTab>
```

---

### RIEPILOGO FILE DA MODIFICARE/CREARE

| # | File | Azione | Rischio Regressione |
|---|------|--------|---------------------|
| 1 | `client/src/hooks/useImpersonation.ts` | Estendere stato + helper associazione | NESSUNO |
| 2 | `client/src/components/ImpersonationBanner.tsx` | Testo + icona condizionale | NESSUNO |
| 3 | `client/src/pages/DashboardPA.tsx` | Stats overview + imprese stats + import | NESSUNO |
| 4 | `client/src/components/GamingRewardsPanel.tsx` | Early return card informativa | NESSUNO |
| 5 | `client/src/components/CivicReportsPanel.tsx` | Guard loadStats | NESSUNO |
| 6 | `client/src/components/ImpreseQualificazioniPanel.tsx` | Filtro associazione_id | NESSUNO |
| 7 | `client/src/components/SuapPanel.tsx` | Guard loadData | NESSUNO |
| 8 | `client/src/components/GestioneHubPanel.tsx` | Filtro associazione_id nelle fetch | NESSUNO |
| 9 | `client/src/components/PresenzeAssociatiPanel.tsx` | **CREARE** | NESSUNO |
| 10 | `client/src/components/AnagraficaAssociazionePanel.tsx` | **CREARE** | NESSUNO |

**Endpoint backend necessari** (da verificare se esistono gia):
- `GET /api/associazioni/:id` — anagrafica
- `GET /api/associazioni/:id/contratti` — contratti
- `GET /api/associazioni/:id/fatture` — fatture
- `GET /api/associazioni/:id/imprese` o `GET /api/imprese?associazione_id=X` — imprese associate
- `GET /api/presenze?associazione_id=X&data=Y` — presenze operatori associati

---

## PRIORITA 3: AGGIORNAMENTO METRICHE REPORT

### 3.1 NativeReportComponent.tsx

| Campo | Valore Attuale nel Codice | Valore Corretto | Riga |
|-------|--------------------------|-----------------|------|
| Router tRPC | '15' | Corretto (gia aggiornato) | 117 |
| Endpoints | '428+' | Corretto (gia aggiornato) | 118 |
| Codice attivo | '106K righe' | Corretto (gia aggiornato) | 329 |
| Componenti React | '145' | **'147'** | 439 |
| DB Schema | '68 Tabelle' | Corretto (gia aggiornato) | 668 |
| Componenti Frontend title | '145 React' | **'147 React'** | 669 |
| Commento gruppi | '145 totali' | **'147 totali'** | 157 |

### 3.2 LegacyReportCards.tsx

| Campo | Valore Attuale | Valore Corretto | Riga |
|-------|---------------|-----------------|------|
| Righe/tabelle/endpoint | '106K righe — 68 tabelle — 428+ endpoint' | Corretto (gia aggiornato) | 69 |

### 3.3 STATO_PROGETTO_AGGIORNATO.md

Gia aggiornato nel commit precedente. Da aggiornare solo:
- Componenti: da 145 a **147**

### 3.4 RELAZIONE_SISTEMA_COMPLETA_2026-02-22.md

Da aggiornare:
- Componenti React: da 145 a **147**
- Righe DashboardPA: da 7.482 a **7.080**
- Tipi `any`: da 136 a **553**
- useMemo/useCallback: da 0 a **122 (27+95)**
- Tab DashboardPA: da 28 a **32**
- Nota: tab `tpas` rinominato in "Enti & Associazioni" (tab docs)

---

## ORDINE DI ESECUZIONE

```
Giorno 1:
  1. Fix eval() in MessageContent.tsx          [30 min]
  2. Fix innerHTML XSS in DashboardPA.tsx       [1 ora]
  3. Fix Firebase hardcoded in firebase.ts      [15 min]
  4. pnpm check (verifica TypeScript)           [5 min]

Giorno 2:
  5. Estendere useImpersonation.ts              [1 ora]
  6. Aggiornare ImpersonationBanner.tsx         [30 min]
  7. pnpm check                                 [5 min]

Giorno 3:
  8. Modificare DashboardPA.tsx (overview)      [1 ora]
  9. Modificare GamingRewardsPanel.tsx           [15 min]
  10. Modificare CivicReportsPanel.tsx           [15 min]
  11. Modificare SuapPanel.tsx                   [30 min]
  12. pnpm check                                [5 min]

Giorno 4:
  13. Modificare ImpreseQualificazioniPanel.tsx  [30 min]
  14. Modificare GestioneHubPanel.tsx            [30 min]
  15. pnpm check                                [5 min]

Giorno 5:
  16. Creare PresenzeAssociatiPanel.tsx          [2 ore]
  17. Creare AnagraficaAssociazionePanel.tsx     [2 ore]
  18. Montare i nuovi tab in DashboardPA.tsx     [30 min]
  19. pnpm check                                [5 min]

Giorno 6:
  20. Aggiornare metriche report (3 file)       [30 min]
  21. Test completo impersonificazione comuni   [30 min]
  22. Test completo impersonificazione assoc.   [30 min]
  23. pnpm check + pnpm build                  [10 min]
  24. Commit e push                             [5 min]
```

---

**Fine Piano di Implementazione**
*Pronto per esecuzione — Non richiede ulteriori analisi*
