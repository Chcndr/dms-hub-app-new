# 🔌 API Endpoints - GestioneMercati

## Endpoint Principali Usati

### 1. Caricamento Mercati

```
GET /api/markets
```

**Descrizione:** Carica lista di tutti i mercati
**Usato in:** `fetchMarkets()` linea 172
**Risposta:** Array di mercati con id, name, latitude, longitude, etc.

---

### 2. Caricamento Posteggi Singolo Mercato

```
GET /api/markets/{marketId}/stalls
```

**Descrizione:** Carica tutti i posteggi di un mercato specifico
**Usato in:** `fetchData()` linea 1290
**Parametri:**

- `marketId`: ID del mercato (es: 1 per Grosseto)
  **Risposta:** Array di stalls con id, number, status, vendor_name, dimensions, etc.

---

### 3. Caricamento Mappa GIS

```
GET /api/gis/market-map/{marketId}
```

**Descrizione:** Carica i dati GIS della mappa (poligoni posteggi)
**Usato in:** `fetchData()` linea 1291
**Parametri:**

- `marketId`: ID del mercato
  **Risposta:** Dati mappa con poligoni, coordinate, colori, etc.

---

### 4. Caricamento Concessioni

```
GET /api/markets/{marketCode}/stalls/concessions
```

**Descrizione:** Carica le concessioni (imprese assegnate ai posteggi)
**Usato in:** `fetchData()` linea 1292
**Parametri:**

- `marketCode`: Codice del mercato (es: "GR001")
  **Risposta:** Dati concessioni

---

### 5. Caricamento Dati Impresa

```
GET /api/imprese/{companyId}
```

**Descrizione:** Carica dettagli di una singola impresa
**Usato in:** `fetchCompanyData()` linea 651
**Parametri:**

- `companyId`: ID dell'impresa
  **Risposta:** Dettagli impresa (nome, settore, contatti, social, etc.)

---

### 6. Aggiornamento Posteggio

```
PATCH /api/stalls/{stallId}
```

**Descrizione:** Aggiorna lo stato di un posteggio
**Usato in:** `handleConfirmAssignment()` linea 1347
**Parametri:**

- `stallId`: ID del posteggio
- Body: Dati aggiornamento (status, vendor_id, etc.)
  **Metodo:** PATCH

---

### 7. Aggiornamento Impresa

```
PATCH /api/imprese/{companyId}
```

**Descrizione:** Aggiorna dati impresa
**Usato in:** Varie funzioni di modifica
**Parametri:**

- `companyId`: ID dell'impresa
- Body: Dati aggiornamento
  **Metodo:** PATCH

---

### 8. Caricamento Concessioni (Alternativo)

```
GET /api/concessions?market_id={marketId}
```

**Descrizione:** Carica concessioni per mercato
**Usato in:** `fetchData()` linea 1932 (nella sezione Concessioni)
**Parametri:**

- `market_id`: ID del mercato
  **Risposta:** Array di concessioni

---

### 9. Caricamento Vendor

```
GET /api/vendors
```

**Descrizione:** Carica lista di tutti i vendor/imprese
**Usato in:** `fetchData()` linea 1933
**Risposta:** Array di vendor

---

## 📊 Flusso Dati Completo

```
1. fetchMarkets()
   └─ GET /api/markets
      └─ Carica lista mercati (Grosseto, Modena, etc.)

2. Quando seleziona un mercato → fetchData()
   ├─ GET /api/markets/{marketId}/stalls
   │  └─ Carica posteggi del mercato
   ├─ GET /api/gis/market-map/{marketId}
   │  └─ Carica mappa GIS con poligoni
   └─ GET /api/markets/{marketCode}/stalls/concessions
      └─ Carica concessioni (imprese)

3. Quando clicca su posteggio → fetchCompanyData()
   └─ GET /api/imprese/{companyId}
      └─ Carica dettagli impresa

4. Quando modifica posteggio → handleConfirmAssignment()
   └─ PATCH /api/stalls/{stallId}
      └─ Aggiorna stato posteggio
      └─ Ricarica fetchData()
```

---

## 🎯 Per MappaItaliaPage Pubblica

**Endpoint necessari:**

1. ✅ `GET /api/markets` - Lista mercati
2. ✅ `GET /api/markets/{marketId}/stalls` - Posteggi mercato
3. ✅ `GET /api/gis/market-map/{marketId}` - Mappa GIS
4. ✅ `GET /api/imprese/{companyId}` - Dettagli impresa

**Endpoint NON necessari (solo per admin):**

- ❌ PATCH /api/stalls/{stallId} - Modifica posteggio
- ❌ PATCH /api/imprese/{companyId} - Modifica impresa
- ❌ GET /api/concessions - Concessioni

---

## 🔐 Configurazione API

**Base URL:** Definito in `/client/src/config/api.ts`

```typescript
export const API_BASE_URL =
  process.env.VITE_API_BASE_URL || "https://orchestratore.mio-hub.me";
```

**Usato come:**

```typescript
const response = await fetch(`${API_BASE_URL}/api/markets/${marketId}/stalls`);
```

---

## 📝 Note Importanti

1. **Mercato Grosseto:**
   - ID: 1 (probabilmente, verificare)
   - Code: "GR001"
   - Posteggi: 160

2. **Mercato Modena (Novi Sad):**
   - ID: 2 (probabilmente)
   - Code: "MO001"
   - Posteggi: 382

3. **Mappa Base Italia:**
   - Endpoint: `GET /api/gis/market-map` (senza marketId)
   - Mostra TUTTI i mercati
   - Zoom: 6, Centro: [42.5, 12.5]

---

## 🚀 Per Implementazione MappaItaliaPage

```typescript
// 1. Carica lista mercati
const markets = await fetch(`${API_BASE_URL}/api/markets`).then(r => r.json());

// 2. Carica mappa base Italia
const mapData = await fetch(`${API_BASE_URL}/api/gis/market-map`).then(r =>
  r.json()
);

// 3. Quando utente seleziona mercato (es: Grosseto con ID=1)
const stalls = await fetch(`${API_BASE_URL}/api/markets/1/stalls`).then(r =>
  r.json()
);
const marketMap = await fetch(`${API_BASE_URL}/api/gis/market-map/1`).then(r =>
  r.json()
);

// 4. Quando clicca su posteggio
const company = await fetch(`${API_BASE_URL}/api/imprese/{companyId}`).then(r =>
  r.json()
);

// 5. Click "Vetrina" → naviga a /vetrine/{companyId}
```

---

**Documento preparato per:** MappaItaliaPage - Gemello Digitale Italia
**Data:** 5 Gennaio 2026
**Stato:** ✅ Pronto per implementazione
