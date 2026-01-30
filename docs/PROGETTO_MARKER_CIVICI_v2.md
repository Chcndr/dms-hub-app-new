# 📍 PROGETTO: Marker Segnalazioni Civiche sulla Mappa

**Versione:** 2.0  
**Data:** 30 Gennaio 2026  
**Autore:** Manus AI  
**Stato:** IN ATTESA DI APPROVAZIONE

---

## 1. OBIETTIVO

Visualizzare le segnalazioni civiche come **marker colorati** sulla mappa nel tab "Segnalazioni & IoT" della Dashboard PA, con:
- Colori diversi per tipo di segnalazione
- Dimensione maggiore per segnalazioni urgenti
- Popup informativo al click
- Filtro automatico per comune (impersonificazione)

---

## 2. ARCHITETTURA SISTEMA ATTUALE

### 2.1 Infrastruttura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                        │
│  dms-hub-app-new.vercel.app                                     │
│  ├── React + Vite                                               │
│  ├── tRPC Client → chiama /api/trpc/*                          │
│  └── Componenti Mappa (Leaflet/react-leaflet)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ tRPC (Vercel Serverless)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND tRPC (Vercel)                        │
│  server/routers.ts                                              │
│  └── civicReports.list → getCivicReports() → SELECT * FROM DB  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (Neon PostgreSQL)                  │
│  ep-bold-silence-adftsojg-pooler.c-2.us-east-1.aws.neon.tech   │
│  └── Tabella: civic_reports (22 colonne)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Backend REST Separato (Hetzner)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND REST (Hetzner)                       │
│  mihub.157-90-29-66.nip.io                                      │
│  ├── Express.js + PM2                                           │
│  ├── /api/civic-reports/* (10 endpoint)                        │
│  └── Stesso database Neon                                       │
└─────────────────────────────────────────────────────────────────┘
```

**NOTA:** Per i marker sulla mappa useremo l'endpoint tRPC esistente (`civicReports.list`) che è già funzionante su Vercel.

---

## 3. SCHEMA DATABASE `civic_reports`

### 3.1 Tabella Completa (22 colonne)

| # | Colonna | Tipo | Nullable | Default | Descrizione |
|---|---------|------|----------|---------|-------------|
| 1 | `id` | INTEGER | NO | auto | PK |
| 2 | `user_id` | INTEGER | YES | - | FK → users.id |
| 3 | `type` | VARCHAR(100) | NO | - | Categoria segnalazione |
| 4 | `description` | TEXT | NO | - | Descrizione problema |
| 5 | `lat` | VARCHAR(20) | YES | - | Latitudine GPS |
| 6 | `lng` | VARCHAR(20) | YES | - | Longitudine GPS |
| 7 | `photo_url` | TEXT | YES | - | URL foto allegata |
| 8 | `status` | VARCHAR(50) | NO | 'pending' | Stato lavorazione |
| 9 | `created_at` | TIMESTAMP | NO | now() | Data creazione |
| 10 | `comune_id` | INTEGER | YES | - | **FK per filtro impersonificazione** |
| 11 | `impresa_id` | INTEGER | YES | - | FK → imprese (se collegata) |
| 12 | `address` | TEXT | YES | - | Indirizzo testuale |
| 13 | `priority` | VARCHAR(20) | YES | 'NORMAL' | LOW/NORMAL/HIGH/URGENT |
| 14 | `assigned_to` | INTEGER | YES | - | PM assegnato |
| 15 | `assigned_at` | TIMESTAMP | YES | - | Data assegnazione |
| 16 | `resolved_at` | TIMESTAMP | YES | - | Data risoluzione |
| 17 | `resolved_by` | INTEGER | YES | - | Chi ha risolto |
| 18 | `resolution_notes` | TEXT | YES | - | Note risoluzione |
| 19 | `tcc_reward` | INTEGER | YES | 20 | TCC premio cittadino |
| 20 | `tcc_rewarded` | BOOLEAN | YES | false | Premio erogato? |
| 21 | `linked_sanction_id` | INTEGER | YES | - | Verbale collegato |
| 22 | `updated_at` | TIMESTAMP | YES | - | Ultimo aggiornamento |

### 3.2 Valori Enum

**Status:**
- `pending` - In attesa
- `in_progress` - In lavorazione
- `resolved` - Risolta
- `rejected` - Rifiutata

**Priority:**
- `LOW` - Bassa
- `NORMAL` - Normale
- `HIGH` - Alta
- `URGENT` - Urgente

**Type (categorie):**
- `Buche` - Buche stradali
- `Illuminazione` - Problemi illuminazione
- `Rifiuti` - Rifiuti abbandonati
- `Degrado` - Degrado urbano
- `Microcriminalità` - Sicurezza
- `Abusivismo` - Commercio abusivo
- `Altro` - Altre segnalazioni

---

## 4. ENDPOINT ESISTENTE

### 4.1 tRPC Endpoint (Vercel)

**File:** `server/routers.ts` (linee 124-130)

```typescript
// Civic Reports
civicReports: router({
  list: publicProcedure.query(async () => {
    const { getCivicReports } = await import("./db");
    return await getCivicReports();
  }),
}),
```

**File:** `server/db.ts` (linee 300-304)

```typescript
export async function getCivicReports() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.civicReports).orderBy(desc(schema.civicReports.createdAt));
}
```

**Chiamata Frontend:**
```typescript
const civicReportsQuery = trpc.civicReports.list.useQuery();
```

### 4.2 Problema Attuale

Lo schema Drizzle aveva solo 9 colonne, quindi l'endpoint restituiva dati incompleti. **HO GIÀ AGGIORNATO** lo schema Drizzle con tutte le 22 colonne.

---

## 5. SCHEMA COLORI MARKER

| Tipo | Colore | Hex | Esempio |
|------|--------|-----|---------|
| Buche | 🟠 Arancione | `#f97316` | Buche stradali |
| Illuminazione | 🟡 Giallo | `#eab308` | Lampioni spenti |
| Rifiuti | 🟢 Verde | `#22c55e` | Rifiuti abbandonati |
| Microcriminalità | 🔴 Rosso | `#ef4444` | Sicurezza |
| Abusivismo | 🟣 Viola | `#a855f7` | Commercio abusivo |
| Degrado | 🟠 Arancione | `#f97316` | Degrado urbano |
| Altro | ⚪ Grigio | `#6b7280` | Default |

### 5.1 Dimensione Marker

| Priorità | Raggio | Note |
|----------|--------|------|
| LOW/NORMAL | 8px | Standard |
| HIGH/URGENT | 12px | Più grande, visibile |

### 5.2 Opacità per Stato

| Stato | Opacità | Note |
|-------|---------|------|
| pending | 0.8 | Pieno |
| in_progress | 0.7 | Leggermente trasparente |
| resolved | 0.4 | Molto trasparente |
| rejected | 0.3 | Quasi invisibile |

---

## 6. FLUSSO DATI

```
┌─────────────────────────────────────────────────────────────────┐
│                      DashboardPA.tsx                            │
│                                                                 │
│  1. civicReportsQuery = trpc.civicReports.list.useQuery()      │
│                              │                                  │
│                              ▼                                  │
│  2. Tab "Segnalazioni & IoT" (value="civic")                   │
│                              │                                  │
│                              ▼                                  │
│  3. <GestioneHubMapWrapper                                      │
│        civicReports={civicReportsQuery.data || []}             │
│     />                                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GestioneHubMapWrapper.tsx                      │
│                                                                 │
│  Props: { civicReports?: CivicReport[] }                       │
│                              │                                  │
│                              ▼                                  │
│  <HubMarketMapComponent                                         │
│     civicReports={civicReports}                                │
│     ... altre props                                             │
│  />                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  HubMarketMapComponent.tsx                      │
│                                                                 │
│  Props: { civicReports?: CivicReport[] }                       │
│                              │                                  │
│                              ▼                                  │
│  <MapContainer>                                                 │
│     ... altri layer (mercati, HUB, negozi, posteggi)           │
│     <CivicReportsLayer reports={civicReports || []} />         │
│  </MapContainer>                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CivicReportsLayer.tsx                        │
│                                                                 │
│  Props: { reports: CivicReport[] }                             │
│                              │                                  │
│                              ▼                                  │
│  Per ogni report con lat/lng validi:                           │
│     <CircleMarker                                               │
│        center={[lat, lng]}                                      │
│        radius={isUrgent ? 12 : 8}                              │
│        pathOptions={{ fillColor: colorByType }}                │
│     >                                                           │
│        <Popup>...dettagli...</Popup>                           │
│     </CircleMarker>                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. FILE DA MODIFICARE

### 7.1 Già Modificati ✅

| File | Modifica | Stato |
|------|----------|-------|
| `drizzle/schema.ts` | Aggiunto 13 colonne a civicReports | ✅ FATTO |

### 7.2 Da Modificare

| # | File | Modifica | Linee |
|---|------|----------|-------|
| 1 | `CivicReportsLayer.tsx` | Allineare interfaccia CivicReport con schema Drizzle (camelCase) | ~50 |
| 2 | `HubMarketMapComponent.tsx` | Aggiungere import + props + rendering | ~10 |
| 3 | `GestioneHubMapWrapper.tsx` | Aggiungere props civicReports | ~5 |
| 4 | `DashboardPA.tsx` | Passare civicReportsQuery.data alla mappa | ~3 |

**TOTALE: ~68 linee di codice**

---

## 8. PRINCIPIO NON-INTERFERENZA

### 8.1 Cosa NON viene toccato

| Componente | Descrizione | Stato |
|------------|-------------|-------|
| Marker Mercati | Icona "M" rossa | ❌ NON TOCCO |
| Marker HUB | Icona "H" blu | ❌ NON TOCCO |
| Marker Negozi | Pallini verdi | ❌ NON TOCCO |
| Area HUB | Poligono GeoJSON | ❌ NON TOCCO |
| Pianta Mercato | Posteggi dinamici colorati | ❌ NON TOCCO |
| Popup esistenti | Tutti i popup attuali | ❌ NON TOCCO |
| Altre mappe | Gestione HUB, Mappa GIS, Web App | ❌ NON TOCCO |

### 8.2 Cosa viene aggiunto

| Componente | Descrizione | Dove |
|------------|-------------|------|
| CivicReportsLayer | Layer marker civici | Solo tab "Segnalazioni & IoT" |

### 8.3 Garanzia

La prop `civicReports` è **OPZIONALE** con default `[]`. Se non viene passata, il componente non renderizza nulla. Quindi tutte le altre istanze della mappa continuano a funzionare esattamente come prima.

---

## 9. POPUP INFORMATIVO

Al click su un marker si apre un popup con:

```
┌─────────────────────────────────────┐
│ 🟠 Buche Stradali        [URGENTE] │
├─────────────────────────────────────┤
│ Buca profonda all'incrocio tra     │
│ Via Roma e Via Garibaldi           │
│                                     │
│ 📍 Via Roma 45, Grosseto           │
│                                     │
│ ⏳ In Attesa      30/01/2026 14:30 │
│                                     │
│ [Foto se presente]                  │
└─────────────────────────────────────┘
```

---

## 10. FILTRO PER COMUNE (IMPERSONIFICAZIONE)

### 10.1 Stato Attuale

L'endpoint `civicReports.list` restituisce **TUTTE** le segnalazioni senza filtro.

### 10.2 Soluzione Proposta (Fase 2)

Modificare l'endpoint per accettare un parametro `comuneId`:

```typescript
civicReports: router({
  list: publicProcedure
    .input(z.object({ comuneId: z.number().optional() }))
    .query(async ({ input }) => {
      const { getCivicReportsByComune } = await import("./db");
      return await getCivicReportsByComune(input.comuneId);
    }),
}),
```

**NOTA:** Questo è un miglioramento futuro. Per ora, il filtro può essere fatto lato frontend.

---

## 11. HEATMAP (FASE FUTURA)

La heatmap (zone di calore) verrà implementata in una fase successiva dopo che i marker funzionano correttamente. Richiede:
- Libreria `leaflet.heat`
- Import dinamico per evitare problemi SSR
- Gestione corretta del cleanup

---

## 12. CHECKLIST IMPLEMENTAZIONE

- [x] Schema Drizzle aggiornato con 22 colonne
- [ ] CivicReportsLayer.tsx - allineare interfaccia
- [ ] HubMarketMapComponent.tsx - aggiungere props
- [ ] GestioneHubMapWrapper.tsx - aggiungere props
- [ ] DashboardPA.tsx - passare dati
- [ ] Build locale senza errori
- [ ] Test su Vercel
- [ ] Aggiornare Master Blueprint

---

## 13. APPROVAZIONE

**Prima di procedere con l'implementazione, conferma:**

1. ✅ Schema colori OK?
2. ✅ Flusso dati OK?
3. ✅ File da modificare OK?
4. ✅ Principio non-interferenza chiaro?

**Attendo tua approvazione per procedere.**

---

*Documento creato il 30 Gennaio 2026 - Manus AI*
