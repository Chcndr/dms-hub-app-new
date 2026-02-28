# PIANO DI IMPLEMENTAZIONE FINALE v2

## Collegamento Impersonificazione Associazioni

**Data**: 22 Febbraio 2026
**Stato**: Pronto per esecuzione — basato su codice reale post-merge v8.11.3
**Regola fondamentale**: NON TOCCARE il sistema impersonificazione comuni esistente

---

## STATO ATTUALE POST-MERGE

Dopo il merge dei 4 commit (v8.11.1 → v8.11.3), il sistema ha GIA':

| Componente                   | Stato | File                                                    |
| ---------------------------- | ----- | ------------------------------------------------------- |
| useImpersonation.ts v2.0     | FATTO | `entityType`, `associazioneId`, `associazioneNome`      |
| ImpersonationBanner.tsx v2.0 | FATTO | Icona Briefcase, label ASSOCIAZIONE                     |
| PermissionsContext.tsx       | FATTO | Ruolo ASSOCIATION=10 collegato                          |
| AssociazioniPanel.tsx        | FATTO | CRUD + bottone "Accedi come" con URL impersonificazione |
| SuapPanel.tsx                | FATTO | `mode='associazione'` con tab nascosti                  |
| DashboardPA.tsx tab tpas     | FATTO | Rinominato "Associazioni" con `<AssociazioniPanel />`   |

**Cosa MANCA** (il problema reale):
La DashboardPA NON legge `entityType`/`associazioneId` dall'URL. Tutti i tab caricano dati globali quando si impersonifica un'associazione. Mancano anche i tab `presenze` e `anagrafica`.

---

## INDICE

1. [Priorita 1: Fix Sicurezza Critici](#priorita-1)
2. [Priorita 2: Filtro Dati per Associazione (8 file)](#priorita-2)
3. [Priorita 3: Nuovi Tab (2 file)](#priorita-3)
4. [Priorita 4: Aggiornamento Metriche Report (3 file)](#priorita-4)

---

## PRIORITA 1: FIX SICUREZZA CRITICI

### FIX 1.1 — eval() in MessageContent.tsx:35

```typescript
// BEFORE (riga 35)
eval(code);

// AFTER — Web Worker sandboxed
try {
  const blob = new Blob(
    [
      `self.onmessage=function(e){try{eval(e.data)}catch(err){postMessage({error:err.message})}}`,
    ],
    { type: "application/javascript" }
  );
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  worker.postMessage(code);
  worker.onmessage = e => {
    if (e.data?.error) console.error("Sandbox error:", e.data.error);
  };
  setTimeout(() => {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  }, 5000);
} catch (err) {
  console.error("Code execution blocked:", err);
}
```

### FIX 1.2 — innerHTML XSS in DashboardPA.tsx:~5042

```typescript
// BEFORE (righe ~5042-5043)
list.innerHTML = data.data.map((i: any) =>
  `<div class="p-2 hover:bg-[#3b82f6]/20 cursor-pointer rounded" onclick="document.getElementById('impresa_id').value='${i.id}'; document.getElementById('impresa_nome').value='${i.denominazione} (${i.partita_iva})'; document.getElementById('imprese-list').innerHTML='';">${i.denominazione} - ${i.partita_iva} - ${i.comune || ''}</div>`
).join('');

// AFTER — React rendering con stato
// Aggiungere stato (nella sezione useState del componente):
const [impresaSearchResults, setImpresaSearchResults] = useState<any[]>([]);

// Nella fetch callback:
setImpresaSearchResults(data.data);

// Nel JSX (sostituire il div con id="imprese-list"):
{impresaSearchResults.map((i: any) => (
  <div
    key={i.id}
    className="p-2 hover:bg-[#3b82f6]/20 cursor-pointer rounded text-[#e8fbff]"
    onClick={() => {
      setSelectedImpresaForFormazione({ id: i.id, nome: `${i.denominazione} (${i.partita_iva})` });
      setImpresaSearchResults([]);
    }}
  >
    {i.denominazione} - {i.partita_iva} - {i.comune || ''}
  </div>
))}
```

### FIX 1.3 — Firebase key hardcoded in firebase.ts:~32

```typescript
// BEFORE
apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQlKp8jQi7Q19tXQtTYpdgivw-WyhocTg",

// AFTER
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
```

---

## PRIORITA 2: FILTRO DATI PER ASSOCIAZIONE

### Cosa manca nel hook useImpersonation.ts

Il hook e' gia esteso con `entityType` e `associazioneId` ma manca una funzione helper `addAssociazioneIdToUrl()` e una funzione `isAssociazioneImpersonation()` per uso standalone.

#### FILE 1: useImpersonation.ts — Aggiungere helper (MODIFICARE)

```typescript
// =============================================
// BEFORE — Fine del file (dopo riga 262, prima di "export default")
// =============================================
export default useImpersonation;

// =============================================
// AFTER — Aggiungere helper standalone prima dell'export default
// =============================================

// Helper standalone per aggiungere associazione_id alle URL
export function addAssociazioneIdToUrl(url: string): string {
  const { isImpersonating, entityType, associazioneId } = getCombinedState();

  if (!isImpersonating || entityType !== "associazione" || !associazioneId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}associazione_id=${associazioneId}`;
}

// Helper per verificare se siamo in impersonificazione associazione
export function isAssociazioneImpersonation(): boolean {
  const state = getCombinedState();
  return state.isImpersonating && state.entityType === "associazione";
}

export default useImpersonation;
```

**Rischio regressione**: NESSUNO. Aggiunge solo export, non modifica nulla.

---

#### FILE 2: DashboardPA.tsx — Overview KPI (MODIFICARE)

**Riga**: 93-112 (dentro `useDashboardData()`)
**Problema**: Il fetch stats/overview non controlla se siamo in impersonificazione associazione

```typescript
// =============================================
// BEFORE (righe 93-112)
// =============================================
  useEffect(() => {
    const MIHUB_API = import.meta.env.VITE_MIHUB_API_BASE_URL || 'https://orchestratore.mio-hub.me/api';

    // Leggi comune_id dall'URL se in modalità impersonificazione
    const urlParams = new URLSearchParams(window.location.search);
    const comuneId = urlParams.get('comune_id');
    const isImpersonating = urlParams.get('impersonate') === 'true';

    // Costruisci query string per filtro comune
    const comuneFilter = (comuneId && isImpersonating) ? `?comune_id=${comuneId}` : '';

    // Fetch overview (con filtro comune se impersonificazione)
    fetch(`${MIHUB_API}/stats/overview${comuneFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsOverview(data.data);
        }
      })
      .catch(err => console.error('Stats overview fetch error:', err));

    // Fetch realtime
    fetch(`${MIHUB_API}/stats/realtime`)

// =============================================
// AFTER (righe 93-112+)
// =============================================
  useEffect(() => {
    const MIHUB_API = import.meta.env.VITE_MIHUB_API_BASE_URL || 'https://orchestratore.mio-hub.me/api';

    // Leggi parametri dall'URL per impersonificazione
    const urlParams = new URLSearchParams(window.location.search);
    const comuneId = urlParams.get('comune_id');
    const isImpersonating = urlParams.get('impersonate') === 'true';
    const entityType = urlParams.get('role') || (urlParams.get('associazione_id') ? 'associazione' : 'comune');

    // Se impersonificazione ASSOCIAZIONE: stats vuote (le associazioni non hanno overview propria)
    if (isImpersonating && entityType === 'associazione') {
      setStatsOverview({
        totalMarkets: 0, totalStalls: 0, totalShops: 0,
        totalTransactions: 0, occupancyRate: '0%',
        imprese: 0, autorizzazioni: 0, comuni: 0,
      });
      setStatsRealtime(null);
      setStatsGrowth(null);
      setStatsQualificazione(null);
      setFormazioneStats(null);
      setBandiStats(null);
      return; // Non fare nessuna fetch
    }

    // Costruisci query string per filtro comune (flusso originale)
    const comuneFilter = (comuneId && isImpersonating) ? `?comune_id=${comuneId}` : '';

    // Fetch overview (con filtro comune se impersonificazione)
    fetch(`${MIHUB_API}/stats/overview${comuneFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsOverview(data.data);
        }
      })
      .catch(err => console.error('Stats overview fetch error:', err));

    // Fetch realtime
    fetch(`${MIHUB_API}/stats/realtime`)
```

**Rischio regressione comuni**: NESSUNO. Il check `entityType === 'associazione'` e' un early return. Se `entityType` e' `'comune'` (default), il codice originale prosegue invariato.

---

#### FILE 3: DashboardPA.tsx — Imprese stats (MODIFICARE)

**Riga**: ~874-891 (fetch imprese stats)

```typescript
// =============================================
// BEFORE (righe ~874-891)
// =============================================
useEffect(() => {
  fetch("/api/imprese?stats_only=true")
    .then(r => r.json())
    .then(data => {
      if (data.success && data.stats) {
        setImpreseStats(data.stats);
      } else if (data.success && data.data) {
        const imprese = data.data;
        const totalConcessioni = imprese.reduce(
          (acc: number, i: any) => acc + (i.concessioni_attive?.length || 0),
          0
        );
        const comuniUnici = Array.from(
          new Set(imprese.map((i: any) => i.comune).filter(Boolean))
        ).length;
        const media =
          imprese.length > 0
            ? (totalConcessioni / imprese.length).toFixed(1)
            : "0";
        setImpreseStats({
          total: imprese.length,
          concessioni: totalConcessioni,
          comuni: comuniUnici,
          media,
        });
      }
    })
    .catch(err => console.error("Error loading imprese stats from REST:", err));
}, []);

// =============================================
// AFTER
// =============================================
useEffect(() => {
  // Se associazione: stats imprese a zero
  const urlParams = new URLSearchParams(window.location.search);
  const isAssocImpersonation =
    urlParams.get("impersonate") === "true" &&
    (urlParams.get("role") === "associazione" ||
      urlParams.get("associazione_id"));

  if (isAssocImpersonation) {
    setImpreseStats({ total: 0, concessioni: 0, comuni: 0, media: "0" });
    return;
  }

  fetch("/api/imprese?stats_only=true")
    .then(r => r.json())
    .then(data => {
      if (data.success && data.stats) {
        setImpreseStats(data.stats);
      } else if (data.success && data.data) {
        const imprese = data.data;
        const totalConcessioni = imprese.reduce(
          (acc: number, i: any) => acc + (i.concessioni_attive?.length || 0),
          0
        );
        const comuniUnici = Array.from(
          new Set(imprese.map((i: any) => i.comune).filter(Boolean))
        ).length;
        const media =
          imprese.length > 0
            ? (totalConcessioni / imprese.length).toFixed(1)
            : "0";
        setImpreseStats({
          total: imprese.length,
          concessioni: totalConcessioni,
          comuni: comuniUnici,
          media,
        });
      }
    })
    .catch(err => console.error("Error loading imprese stats from REST:", err));
}, []);
```

---

#### FILE 4: GamingRewardsPanel.tsx (MODIFICARE)

**Riga**: 631 — gia usa `useImpersonation()` ma non controlla `entityType`

```typescript
// =============================================
// BEFORE (riga 631)
// =============================================
  const { comuneId, comuneNome, isImpersonating } = useImpersonation();

// =============================================
// AFTER — Aggiungere entityType al destructuring
// =============================================
  const { comuneId, comuneNome, isImpersonating, entityType } = useImpersonation();

  // Se associazione: mostra card informativa e non caricare dati
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
            <p className="text-sm">Il sistema Gaming & Rewards e disponibile per i singoli comuni.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
```

**Nota**: L'early return va messo DOPO la riga 631 ma PRIMA dei successivi useState/useEffect. Siccome React non permette hook condizionali, l'early return va posizionato dopo TUTTI gli hook, ma prima del rendering. In alternativa, wrappare solo il JSX di ritorno.

**Soluzione corretta per React**: NON usare early return con hook, ma wrappare il contenuto nel JSX finale:

```typescript
// AFTER — Approccio corretto (wrapping nel return)
// Riga 631:
  const { comuneId, comuneNome, isImpersonating, entityType } = useImpersonation();
  const isAssociazioneMode = isImpersonating && entityType === 'associazione';

// Nel return finale del componente (prima del JSX principale):
  if (isAssociazioneMode) {
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
            <p className="text-sm">Il sistema Gaming & Rewards e disponibile per i singoli comuni.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
```

**Rischio regressione**: NESSUNO. Il flag `isAssociazioneMode` e' false per default.

---

#### FILE 5: CivicReportsPanel.tsx (MODIFICARE)

**Riga**: 56-60 — gia usa `useImpersonation()` ma non controlla `entityType`

```typescript
// =============================================
// BEFORE (righe 56-60)
// =============================================
const { comuneId: impersonatedComuneId } = useImpersonation();
const { setSelectedReport } = useCivicReports();
// Se impersonato: filtra per comune. Se admin globale: mostra tutte le segnalazioni
const comuneId = impersonatedComuneId ? parseInt(impersonatedComuneId) : null;
const comuneParam = comuneId ? `comune_id=${comuneId}` : "";

// =============================================
// AFTER
// =============================================
const {
  comuneId: impersonatedComuneId,
  isImpersonating,
  entityType,
} = useImpersonation();
const { setSelectedReport } = useCivicReports();
const isAssociazioneMode = isImpersonating && entityType === "associazione";
// Se impersonato: filtra per comune. Se admin globale: mostra tutte le segnalazioni
const comuneId = impersonatedComuneId ? parseInt(impersonatedComuneId) : null;
const comuneParam = comuneId ? `comune_id=${comuneId}` : "";
```

```typescript
// =============================================
// BEFORE — loadStats (righe 63-74)
// =============================================
  const loadStats = async () => {
    try {
      const statsUrl = comuneParam
        ? `${API_BASE_URL}/api/civic-reports/stats?${comuneParam}`
        : `${API_BASE_URL}/api/civic-reports/stats`;

// =============================================
// AFTER — loadStats con guard associazione
// =============================================
  const loadStats = async () => {
    // Associazioni non hanno segnalazioni civiche proprie
    if (isAssociazioneMode) {
      setStats({ pending: 0, inProgress: 0, resolved: 0, rejected: 0, total: 0, todayNew: 0, todayResolved: 0, recent: [], byType: [] });
      setAllReports([]);
      setLoading(false);
      return;
    }
    try {
      const statsUrl = comuneParam
        ? `${API_BASE_URL}/api/civic-reports/stats?${comuneParam}`
        : `${API_BASE_URL}/api/civic-reports/stats`;
```

**Rischio regressione**: NESSUNO. Guard in cima.

---

#### FILE 6: ImpreseQualificazioniPanel.tsx (MODIFICARE)

**Riga**: 7, 65-69

```typescript
// =============================================
// BEFORE (riga 7)
// =============================================
import { addComuneIdToUrl } from "@/hooks/useImpersonation";

// =============================================
// AFTER
// =============================================
import {
  addComuneIdToUrl,
  isAssociazioneImpersonation,
  addAssociazioneIdToUrl,
} from "@/hooks/useImpersonation";
```

```typescript
// =============================================
// BEFORE (riga 69)
// =============================================
const response = await fetch(
  addComuneIdToUrl(`${API_BASE_URL}/api/imprese?limit=200`)
);

// =============================================
// AFTER
// =============================================
const impresaUrl = isAssociazioneImpersonation()
  ? addAssociazioneIdToUrl(`${API_BASE_URL}/api/imprese?limit=200`)
  : addComuneIdToUrl(`${API_BASE_URL}/api/imprese?limit=200`);
const response = await fetch(impresaUrl);
```

**Nota backend**: L'endpoint `GET /api/imprese` deve supportare `?associazione_id=X`. Se non supportato, mostrare lista vuota.

---

#### FILE 7: SuapPanel.tsx — Bloccare loadData per associazione (MODIFICARE)

**Riga**: 271-301 — `loadData()` carica pratiche/concessioni anche per associazioni

```typescript
// =============================================
// BEFORE (righe 271-301)
// =============================================
  const loadData = async () => {
    setLoading(true);
    try {
      const comuneNomeFilter = comuneData?.nome?.toUpperCase() || '';
      const filters: any = {};
      if (comuneNomeFilter) {
        filters.comune_nome = comuneNomeFilter;
      }
      const [statsData, praticheData] = await Promise.all([
        getSuapStats(ENTE_ID),
        getSuapPratiche(ENTE_ID, filters)
      ]);

// =============================================
// AFTER
// =============================================
  const loadData = async () => {
    setLoading(true);

    // Se mode=associazione, dati vuoti (le associazioni non hanno pratiche SUAP proprie)
    if (isAssociazione) {
      setStats(null);
      setPratiche([]);
      setConcessioni([]);
      setDomandeSpuntaDashboard([]);
      setLoading(false);
      return;
    }

    try {
      const comuneNomeFilter = comuneData?.nome?.toUpperCase() || '';
      const filters: any = {};
      if (comuneNomeFilter) {
        filters.comune_nome = comuneNomeFilter;
      }
      const [statsData, praticheData] = await Promise.all([
        getSuapStats(ENTE_ID),
        getSuapPratiche(ENTE_ID, filters)
      ]);
```

**Nota**: `isAssociazione` e' gia definito a riga 190 come `mode === 'associazione'`. Questo guard usa la prop esistente.

**Rischio regressione**: NESSUNO. Guard usa la prop `mode` gia esistente.

---

#### FILE 8: GestioneHubPanel.tsx (MODIFICARE)

**Riga**: 48

```typescript
// =============================================
// BEFORE (riga 48)
// =============================================
import { addComuneIdToUrl } from "@/hooks/useImpersonation";

// =============================================
// AFTER
// =============================================
import {
  addComuneIdToUrl,
  isAssociazioneImpersonation,
} from "@/hooks/useImpersonation";
```

In ogni fetch che usa `addComuneIdToUrl()`, aggiungere il check:

```typescript
// Pattern generico per ogni fetch nel GestioneHubPanel
// BEFORE
const response = await fetch(addComuneIdToUrl(`${API_BASE_URL}/api/...`));

// AFTER
if (isAssociazioneImpersonation()) {
  // Skip fetch per associazioni — mostrera dati vuoti
  return;
}
const response = await fetch(addComuneIdToUrl(`${API_BASE_URL}/api/...`));
```

---

## PRIORITA 3: NUOVI TAB

#### FILE 9: PresenzeAssociatiPanel.tsx (CREARE)

**File**: `client/src/components/PresenzeAssociatiPanel.tsx`

Componente per mostrare le presenze degli operatori associati nei mercati.
KPI (presenti/assenti/totale) + filtro data + lista presenze con icone stato.

Usa `getImpersonationParams()` per ottenere `associazioneId`.
Endpoint: `GET /api/presenze?associazione_id=X&data=YYYY-MM-DD`

**Struttura**: Vedi il componente completo nella versione precedente del piano (invariato).

---

#### FILE 10: AnagraficaAssociazionePanel.tsx (CREARE)

**File**: `client/src/components/AnagraficaAssociazionePanel.tsx`

Componente per mostrare anagrafica dell'associazione impersonificata.
3 sotto-tab (Dati, Contratti, Fatture) + tabelle dati.

Usa `getImpersonationParams()` per ottenere `associazioneId`.
Endpoint: `GET /api/associazioni/:id`, `GET /api/associazioni/:id/contratti`, `GET /api/associazioni/:id/fatture`

**Struttura**: Vedi il componente completo nella versione precedente del piano (invariato).

---

#### FILE 11: DashboardPA.tsx — Montare nuovi tab (MODIFICARE)

```typescript
// Aggiungere import in cima (dopo riga 45)
import PresenzeAssociatiPanel from "@/components/PresenzeAssociatiPanel";
import AnagraficaAssociazionePanel from "@/components/AnagraficaAssociazionePanel";
```

```typescript
// Aggiungere TabsContent (prima della chiusura </Tabs>)
          {/* TAB: PRESENZE ASSOCIATI */}
          <TabsContent value="presenze" className="space-y-6">
            <PresenzeAssociatiPanel />
          </TabsContent>

          {/* TAB: ANAGRAFICA ASSOCIAZIONE */}
          <TabsContent value="anagrafica" className="space-y-6">
            <AnagraficaAssociazionePanel />
          </TabsContent>
```

```typescript
// Aggiungere bottoni tab nella sidebar (dopo l'ultimo ProtectedTab)
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

## PRIORITA 4: AGGIORNAMENTO METRICHE REPORT

### NativeReportComponent.tsx

| Campo                       | Valore Attuale | Valore Corretto |
| --------------------------- | -------------- | --------------- |
| Componenti React (riga 439) | '145'          | '147'           |
| Componenti title (riga 669) | '145 React'    | '147 React'     |
| Commento (riga 157)         | '145 totali'   | '147 totali'    |

### STATO_PROGETTO_AGGIORNATO.md

- Componenti: da 145 a 147

### RELAZIONE_SISTEMA_COMPLETA_2026-02-22.md

| Campo               | Valore Scritto | Valore Corretto |
| ------------------- | -------------- | --------------- |
| Componenti React    | 145            | 147             |
| Righe DashboardPA   | 7.482          | 7.080           |
| Tipi any            | 136            | 553             |
| useMemo/useCallback | 0              | 122 (27+95)     |
| Tab DashboardPA     | 28             | 32              |

---

## RIEPILOGO FILE

| #   | File                                | Azione                      | Rischio |
| --- | ----------------------------------- | --------------------------- | ------- |
| 1   | MessageContent.tsx                  | Fix eval()                  | NESSUNO |
| 2   | DashboardPA.tsx:~5042               | Fix innerHTML XSS           | NESSUNO |
| 3   | firebase.ts:~32                     | Rimuovi fallback key        | BASSO   |
| 4   | useImpersonation.ts                 | +2 helper standalone        | NESSUNO |
| 5   | DashboardPA.tsx:93                  | Guard overview associazione | NESSUNO |
| 6   | DashboardPA.tsx:~874                | Guard imprese stats         | NESSUNO |
| 7   | GamingRewardsPanel.tsx:631          | Card "Non applicabile"      | NESSUNO |
| 8   | CivicReportsPanel.tsx:56            | Guard loadStats             | NESSUNO |
| 9   | ImpreseQualificazioniPanel.tsx:7,69 | Filtro associazione_id      | NESSUNO |
| 10  | SuapPanel.tsx:271                   | Guard loadData              | NESSUNO |
| 11  | GestioneHubPanel.tsx:48             | Guard fetch                 | NESSUNO |
| 12  | PresenzeAssociatiPanel.tsx          | **CREARE**                  | NESSUNO |
| 13  | AnagraficaAssociazionePanel.tsx     | **CREARE**                  | NESSUNO |
| 14  | DashboardPA.tsx (import+mount)      | Tab presenze/anagrafica     | NESSUNO |
| 15  | NativeReportComponent.tsx           | Metriche 147                | NESSUNO |
| 16  | STATO_PROGETTO + RELAZIONE          | Metriche corrette           | NESSUNO |

**Endpoint backend necessari** (da verificare):

- `GET /api/imprese?associazione_id=X` — imprese associate
- `GET /api/presenze?associazione_id=X&data=Y` — presenze operatori
- `GET /api/associazioni/:id` — anagrafica (probabilmente esiste)
- `GET /api/associazioni/:id/contratti` — contratti (probabilmente esiste)
- `GET /api/associazioni/:id/fatture` — fatture (probabilmente esiste)

---

## ORDINE DI ESECUZIONE

```
Blocco 1 — Sicurezza [2 ore]:
  Fix eval, innerHTML, Firebase key → pnpm check

Blocco 2 — Hook [30 min]:
  addAssociazioneIdToUrl + isAssociazioneImpersonation → pnpm check

Blocco 3 — Guard associazione nei componenti [3 ore]:
  DashboardPA (overview + imprese) → GamingRewardsPanel →
  CivicReportsPanel → ImpreseQualificazioniPanel →
  SuapPanel → GestioneHubPanel → pnpm check

Blocco 4 — Nuovi tab [4 ore]:
  PresenzeAssociatiPanel → AnagraficaAssociazionePanel →
  Montaggio in DashboardPA → pnpm check

Blocco 5 — Metriche [30 min]:
  NativeReportComponent → STATO_PROGETTO → RELAZIONE → pnpm check

Blocco 6 — Test [1 ora]:
  Test impersonificazione comuni (non deve cambiare nulla) →
  Test impersonificazione associazione (dati vuoti/filtrati) →
  pnpm build
```

---

**Fine Piano v2** — Basato su codice reale post-merge v8.11.3
