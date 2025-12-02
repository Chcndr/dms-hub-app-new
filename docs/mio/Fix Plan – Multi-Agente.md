_Copia del report di audit generato in precedenza._

# 🔍 MIO Hub - Report Audit Tecnico
**Data:** 01 Dicembre 2025  
**Agente:** MIO (Architect Agent)  
**Tipo:** READ-ONLY Technical Audit  
**Obiettivo:** Identificare e risolvere errori HTTP 404 "Conversation not found"

---

## 📋 Executive Summary

Il sistema MIO Hub è un'applicazione multi-agent chat con 3 viste distinte:
1. **Chat Principale MIO** - Orchestratore centrale con conversazione persistente
2. **Vista 4 Agenti (READ-ONLY)** - Monitoraggio dialoghi MIO ↔ Agenti specializzati
3. **Chat Singole Agenti** - 4 conversazioni isolate dirette con agenti (GPT Dev, Manus, Abacus, Zapier)

L'audit ha identificato **architettura corretta implementata** ma con **potenziali problemi di sincronizzazione** tra stato locale e backend che causano errori HTTP 404.

---

## 🏗️ Architettura Attuale (Analisi)

### 1️⃣ Chat Principale MIO

**File:** `DashboardPA.tsx` (righe 456, 464-682)  
**Hook utilizzati:**
- `useConversationPersistence('mio-main')` → gestisce `mioMainConversationId`
- Stato locale: `mioMessages` (useState)
- NO `useAgentLogs` (corretto per evitare conflitti)

**Flusso:**
```
User Input → handleSendMio() → sendMioMessage() 
  → POST /api/mihub/orchestrator { message, mode: 'auto', conversationId? }
  → Backend response: { success, message, conversationId }
  → setMioMainConversationId(conversationId) ✅
  → Update local state mioMessages
```

**✅ IMPLEMENTAZIONE CORRETTA:**
- Non genera ID client-side (fix commit 41c7ef8)
- Usa sempre conversationId dal backend
- Gestisce errori JSON con `data.error`
- Usa `data.message` invece di `data.reply` (fix commit 94ca840)

**⚠️ POTENZIALE PROBLEMA:**
Il localStorage potrebbe contenere un vecchio `conversationId` non valido dal backend. Se l'utente non ha cancellato manualmente il localStorage dopo i fix, il primo messaggio potrebbe ancora usare un ID invalido.

---

### 2️⃣ Vista 4 Agenti (READ-ONLY)

**File:** `MultiAgentChatView.tsx` + `DashboardPA.tsx` (righe 475-507)  
**Hook utilizzati:**
- 4x `useAgentLogs({ conversationId: mioMainConversationId, agentName: 'gptdev|manus|abacus|zapier' })`

**Flusso:**
```
useAgentLogs polling (5s) 
  → GET /api/mio/agent-logs?conversation_id={mioMainConversationId}&agent_name={agent}
  → Backend response: { logs: [...] }
  → Update messages state
```

**✅ IMPLEMENTAZIONE CORRETTA:**
- Usa `mioMainConversationId` condiviso (corretto)
- Polling automatico ogni 5 secondi
- NO invio messaggi (solo lettura)
- Mostra dialoghi MIO ↔ Agenti

**⚠️ POTENZIALE PROBLEMA:**
Se `mioMainConversationId` è null o invalido, i 4 hook `useAgentLogs` non caricano nulla (ma non generano errori 404 perché hanno check `if (!conversationId) return` in riga 24 di `useAgentLogs.ts`).

---

### 3️⃣ Chat Singole Agenti

**File:** `DashboardPA.tsx` (righe 459-462, 509-573, 687-821)  
**Hook utilizzati:**
- 4x `useConversationPersistence('gptdev-single|manus-single|abacus-single|zapier-single')`
- 4x `useAgentLogs({ conversationId: {agent}ConversationId, agentName: {agent} })`

**Flusso invio messaggio:**
```
User Input → handleSend{Agent}() → sendAgentMessage()
  → POST /api/mihub/orchestrator { message, mode: 'manual', targetAgent: {agent}, conversationId? }
  → Backend response: { success, message, conversationId }
  → set{Agent}ConversationId(conversationId) ✅
  → pushMessage() to local state
```

**✅ IMPLEMENTAZIONE CORRETTA:**
- Ogni agente ha conversationId separato
- Non genera ID client-side
- Usa `sendAgentMessage` con `mode: 'manual'` e `targetAgent`
- Aggiorna conversationId dal backend

**⚠️ POTENZIALE PROBLEMA:**
Gli handler (es. `handleSendManus`) usano `setManusMessages(prev => [...prev, msg])` ma `manusMessages` proviene da `useAgentLogs` (riga 520-524), che è READ-ONLY. Questo crea un **CONFLITTO** tra:
- Stato locale ottimistico (aggiunto dall'handler)
- Stato polling (caricato da `useAgentLogs`)

**NOTA CRITICA:** Gli handler chiamano `setManusMessages` ma questa funzione NON esiste per Manus/Abacus/Zapier! Solo GPT Dev ha `setMessages` esposto (riga 555).

---

## 🐛 Problemi Identificati

### ❌ PROBLEMA 1: Conflitto tra stato locale e polling nelle chat singole

**File:** `DashboardPA.tsx` righe 723-755 (handleSendManus)

```typescript
// PROBLEMA: manusMessages è derivato da useAgentLogs (READ-ONLY)
const manusMessages = manusMessagesRaw.map(msg => ({...}));

// Ma l'handler cerca di modificarlo:
setManusMessages(prev => [...prev, userMsg]); // ❌ setManusMessages NON ESISTE
```

**Causa:** Solo GPT Dev ha `setMessages` esposto da `useAgentLogs` (riga 555), gli altri 3 agenti NO.

**Effetto:** 
- TypeScript dovrebbe dare errore (ma forse è ignorato)
- I messaggi locali non vengono aggiunti immediatamente
- L'UI si aggiorna solo dopo il polling (ritardo 5 secondi)

---

### ❌ PROBLEMA 2: localStorage con conversationId invalidi

**File:** `useConversationPersistence.ts` righe 27-36

```typescript
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    setConversationIdState(stored); // ❌ Potrebbe essere un ID client-side vecchio
  }
}, [STORAGE_KEY]);
```

**Causa:** Se l'utente non ha cancellato localStorage dopo i fix precedenti, potrebbe avere ancora ID generati client-side (formato `conv_${Date.now()}...`) che il backend non riconosce.

**Effetto:** 
- Primo messaggio invia conversationId invalido
- Backend risponde con HTTP 200 ma JSON `{ success: false, error: { statusCode: 404, message: "Conversation not found" } }`
- Client gestisce l'errore (fix commit 41c7ef8) ma l'utente vede messaggio di errore

---

### ⚠️ PROBLEMA 3: Race condition tra handleSend e useAgentLogs

**File:** `DashboardPA.tsx` + `useAgentLogs.ts`

**Scenario:**
1. User invia messaggio → `handleSendManus()` chiama backend
2. Backend salva messaggio e risponde
3. `useAgentLogs` polling (ogni 5s) carica messaggi dal backend
4. Se il polling avviene PRIMA che l'handler aggiorni lo stato locale → duplicati o messaggi mancanti

**Effetto:** Inconsistenza UI temporanea (risolta al prossimo polling)

---

### ⚠️ PROBLEMA 4: Endpoint /api/mio/agent-logs non verificato

**File:** `useAgentLogs.ts` riga 43

```typescript
const res = await fetch(`/api/mio/agent-logs?${params.toString()}`);
```

**Verifica necessaria:** 
- Questo endpoint è configurato in `vercel.json`? NO ❌
- Esiste un rewrite per `/api/mio/*`? NO ❌
- Dovrebbe essere `/api/mihub/agent-logs`? PROBABILE ✅

**Controllo vercel.json:**
```json
"rewrites": [
  {
    "source": "/api/mihub/:path*",
    "destination": "https://orchestratore.mio-hub.me/api/mihub/:path*"
  }
]
```

**PROBLEMA CONFERMATO:** L'endpoint `/api/mio/agent-logs` NON è coperto dal rewrite! Dovrebbe essere `/api/mihub/agent-logs`.

---

## 🔧 Piano di Fix Dettagliato

### FIX 1: Correggere endpoint in useAgentLogs.ts

**File:** `client/src/hooks/useAgentLogs.ts`  
**Riga:** 43  
**Priorità:** 🔴 CRITICA

**Modifica:**
```typescript
// PRIMA (ERRATO):
const res = await fetch(`/api/mio/agent-logs?${params.toString()}`);

// DOPO (CORRETTO):
const res = await fetch(`/api/mihub/agent-logs?${params.toString()}`);
```

**Motivazione:** L'endpoint `/api/mio/*` non è coperto dal rewrite in `vercel.json`. Solo `/api/mihub/*` viene inoltrato al backend.

---

### FIX 2: Aggiungere stato locale per chat singole agenti

**File:** `client/src/pages/DashboardPA.tsx`  
**Righe:** 509-573  
**Priorità:** 🟠 ALTA

**Strategia:** Separare stato locale (per UI ottimistica) da polling (per sincronizzazione backend)

**Modifica:**

```typescript
// AGGIUNGERE stati locali per ogni agente
const [manusLocalMessages, setManusLocalMessages] = useState<AgentChatMessage[]>([]);
const [abacusLocalMessages, setAbacusLocalMessages] = useState<AgentChatMessage[]>([]);
const [zapierLocalMessages, setZapierLocalMessages] = useState<AgentChatMessage[]>([]);
const [gptdevLocalMessages, setGptdevLocalMessages] = useState<AgentChatMessage[]>([]);

// MODIFICARE hook useAgentLogs per sincronizzare con stato locale
const { messages: manusMessagesRaw, loading: manusLoading } = useAgentLogs({
  conversationId: manusConversationId,
  agentName: 'manus',
});

// SINCRONIZZARE polling con stato locale
useEffect(() => {
  if (manusMessagesRaw.length > 0) {
    setManusLocalMessages(manusMessagesRaw.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.created_at,
      agent: msg.agent_name
    })));
  }
}, [manusMessagesRaw]);

// USARE stato locale negli handler
const handleSendManus = async () => {
  // ... (codice esistente)
  setManusLocalMessages(prev => [...prev, userMsg]); // ✅ Ora funziona
  
  try {
    await sendAgentMessage(
      'manus',
      text,
      manusConversationId,
      setManusConversationId,
      (msg) => setManusLocalMessages(prev => [...prev, msg]) // ✅ Aggiorna stato locale
    );
  } catch (err: any) {
    // ... (gestione errori)
  }
};
```

**Ripetere per tutti e 4 gli agenti** (Manus, Abacus, Zapier, GPT Dev)

---

### FIX 3: Forzare reset localStorage su conversationId invalidi

**File:** `client/src/lib/mioOrchestratorClient.ts`  
**Righe:** 40-44  
**Priorità:** 🟡 MEDIA

**Modifica:**

```typescript
// In sendMioMessage() - DOPO il check errore
if (data.error || data.success === false) {
  const errorMsg = data.error?.message || 'Unknown error';
  const errorCode = data.error?.statusCode || 500;
  
  // Se errore 404 "Conversation not found", cancella localStorage
  if (errorCode === 404 && errorMsg.includes('Conversation not found')) {
    console.warn('[sendMioMessage] Invalid conversationId detected, clearing localStorage');
    localStorage.removeItem('mio-main'); // ✅ Reset automatico
  }
  
  throw new Error(`orchestrator error ${errorCode}: ${errorMsg}`);
}
```

**Ripetere in `sendAgentMessage()`** per gestire anche le chat singole.

**Motivazione:** Evita che l'utente debba cancellare manualmente localStorage. Il sistema si auto-ripara.

---

### FIX 4: Aggiungere validazione formato conversationId

**File:** `client/src/hooks/useConversationPersistence.ts`  
**Righe:** 27-36  
**Priorità:** 🟡 MEDIA

**Modifica:**

```typescript
// Funzione helper per validare formato conversationId
function isValidConversationId(id: string): boolean {
  // Backend genera UUID v4 o formato specifico
  // Escludere ID client-side vecchi (formato conv_1234567890_...)
  return !id.startsWith('conv_') && id.length > 10;
}

useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidConversationId(stored)) {
    setConversationIdState(stored);
    console.log('[Persistence] Restored valid conversation_id:', stored);
  } else {
    if (stored) {
      console.warn('[Persistence] Invalid conversation_id format, clearing:', stored);
      localStorage.removeItem(STORAGE_KEY); // ✅ Rimuovi ID invalidi
    }
    setConversationIdState(null);
    console.log('[Persistence] No valid conversation_id found, will be created by backend');
  }
}, [STORAGE_KEY]);
```

---

### FIX 5: Aggiungere retry logic con exponential backoff

**File:** `client/src/lib/mioOrchestratorClient.ts`  
**Priorità:** 🟢 BASSA (opzionale)

**Modifica:** Implementare retry automatico per errori temporanei (429 Rate Limit, 500 Server Error)

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      
      // Retry solo per errori temporanei
      if (res.status === 429 || res.status >= 500) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.warn(`[fetchWithRetry] Retry ${i+1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return res; // Altri errori → fallisce subito
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 📊 Riepilogo Fix per Priorità

| Priorità | Fix | File | Impatto | Effort |
|----------|-----|------|---------|--------|
| 🔴 CRITICA | Fix endpoint `/api/mio/` → `/api/mihub/` | `useAgentLogs.ts` | Vista 4 agenti non funziona | 5 min |
| 🟠 ALTA | Stato locale per chat singole | `DashboardPA.tsx` | UI ottimistica rotta | 30 min |
| 🟡 MEDIA | Auto-reset localStorage su 404 | `mioOrchestratorClient.ts` | UX migliorata | 15 min |
| 🟡 MEDIA | Validazione formato conversationId | `useConversationPersistence.ts` | Prevenzione errori | 10 min |
| 🟢 BASSA | Retry logic con backoff | `mioOrchestratorClient.ts` | Resilienza | 20 min |

**Tempo totale stimato:** ~1.5 ore

---

## 🧪 Piano di Test

### Test 1: Chat Principale MIO
1. Cancellare localStorage: `localStorage.clear()`
2. Ricaricare pagina
3. Inviare primo messaggio → verificare che backend crei nuovo conversationId
4. Verificare che conversationId sia salvato in localStorage (`mio-main`)
5. Inviare secondo messaggio → verificare che usi stesso conversationId
6. Ricaricare pagina → verificare che cronologia sia mantenuta
7. ✅ Nessun errore HTTP 404

### Test 2: Vista 4 Agenti (READ-ONLY)
1. Dopo aver inviato messaggi in Chat Principale MIO
2. Passare a vista "4 Agenti"
3. Verificare che i 4 quadranti mostrino dialoghi MIO ↔ Agenti
4. Verificare polling automatico (nuovi messaggi appaiono entro 5s)
5. ✅ Nessun errore di caricamento

### Test 3: Chat Singole Agenti
1. Passare a vista "Manus" (o altro agente)
2. Cancellare localStorage per quell'agente: `localStorage.removeItem('manus-single')`
3. Inviare primo messaggio → verificare creazione conversationId
4. Verificare che messaggio utente appaia IMMEDIATAMENTE (UI ottimistica)
5. Verificare che risposta agente appaia dopo backend
6. Inviare secondo messaggio → verificare stesso conversationId
7. Ricaricare pagina → verificare cronologia mantenuta
8. ✅ Nessun errore HTTP 404

### Test 4: Recupero da errore 404
1. Impostare manualmente conversationId invalido in localStorage:
   ```javascript
   localStorage.setItem('mio-main', 'conv_1234567890_invalid');
   ```
2. Ricaricare pagina
3. Inviare messaggio → verificare che sistema rilevi errore 404
4. Verificare che localStorage sia cancellato automaticamente
5. Inviare secondo messaggio → verificare che funzioni (nuovo conversationId)
6. ✅ Auto-recovery funzionante

---

## 🎯 Raccomandazioni Finali

### Implementazione Immediata (FIX 1)
Il **FIX 1** (correzione endpoint) è **CRITICO** e deve essere applicato immediatamente perché:
- La vista 4 agenti probabilmente NON funziona affatto
- È un fix di 1 riga, zero rischi
- Risolve completamente il problema di caricamento logs

### Implementazione Prioritaria (FIX 2 + 3)
I **FIX 2 e 3** risolvono i problemi principali di UX:
- Stato locale per UI reattiva
- Auto-recovery da errori 404

### Test su Branch Dedicato
Come richiesto dall'utente:
1. Creare branch `fix/conversation-persistence`
2. Applicare FIX 1, 2, 3, 4
3. Testare su Vercel preview deployment
4. Merge a `master` solo dopo test completi

### Monitoraggio Post-Deploy
Dopo il deploy:
1. Monitorare console browser per errori
2. Verificare che localStorage contenga conversationId validi
3. Controllare che polling `useAgentLogs` funzioni
4. Testare su iPad (device utente)

---

## 📝 Note Tecniche

### Formato conversationId Backend
Da verificare con backend team:
- Formato UUID v4? (es. `550e8400-e29b-41d4-a716-446655440000`)
- Formato custom? (es. `mio_conv_1234567890`)
- Lunghezza minima/massima?

### Endpoint /api/mihub/agent-logs
Da verificare:
- Supporta parametri `conversation_id` e `agent_name`?
- Ritorna formato `{ logs: [...] }`?
- Gestisce correttamente `limit=200`?

### Rate Limiting
Backend ha rate limit (HTTP 429 visto nei log precedenti):
- Polling ogni 5s potrebbe essere troppo frequente con 4 agenti?
- Considerare aumento intervallo a 10s o 15s
- Implementare retry logic (FIX 5)

---

## ✅ Checklist Pre-Deploy

- [ ] FIX 1: Endpoint corretto in `useAgentLogs.ts`
- [ ] FIX 2: Stato locale per chat singole agenti
- [ ] FIX 3: Auto-reset localStorage su 404
- [ ] FIX 4: Validazione formato conversationId
- [ ] Test 1: Chat Principale MIO (localStorage vuoto)
- [ ] Test 2: Vista 4 Agenti (polling funzionante)
- [ ] Test 3: Chat Singole Agenti (UI ottimistica)
- [ ] Test 4: Recupero da errore 404 (auto-recovery)
- [ ] Verifica su iPad (device utente)
- [ ] Merge a master dopo test OK

---

**Fine Report Audit Tecnico**  
**Prossimo Step:** Applicare fix in branch dedicato e testare su Vercel preview deployment.
