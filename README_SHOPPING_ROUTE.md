# 🛒 BLUEPRINT: Shopping Route Etico - Sistema Routing Sostenibile

**Progetto:** MIO Hub - Digital Market System  
**Modulo:** Shopping Route Etico  
**Versione:** 1.0  
**Data:** 16 Dicembre 2025

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Configurazione](#configurazione)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Roadmap](#roadmap)

---

## 🎯 Panoramica

### Obiettivo

**Shopping Route Etico** è un sistema di routing sostenibile che aiuta gli utenti a raggiungere i mercati e i negozi locali utilizzando mezzi di trasporto eco-friendly (piedi, bici, TPL).

### Concetto

> **"Viaggiare per acquistare, non ricevere"**

Un assistente di viaggio che:

- Calcola percorsi ottimali verso mercati e posteggi
- Promuove mobilità sostenibile
- Gamifica l'esperienza con crediti e badge
- Integra TPL nazionale (non solo TPER)
- Sistema scalabile per tutta Italia

### Funzionalità Principali

✅ **Calcolo percorsi multi-modali**

- A piedi, bicicletta, bus, auto
- Percorsi multimodali (casa → fermata → bus → destinazione)
- Routing real-time con OpenRouteService
- Fallback Haversine per offline

✅ **Gamification sostenibilità**

- Calcolo CO₂ risparmiata vs auto
- Crediti per percorsi sostenibili
- Badge "Shopper Sostenibile"
- Statistiche personali

✅ **Integrazione mercati**

- Coordinate GPS precise per ogni posteggio
- Link diretto da vetrina digitale
- Badge "Raggiungibile con TPL"
- Mappa interattiva percorso

✅ **Scalabilità nazionale**

- Non dipende da TPER (solo Bologna)
- Centro Mobilità nazionale
- Ogni mercato = nodo autonomo
- Sistema interoperabile

---

## 🏗️ Architettura

### Stack Tecnologico

**Backend:**

- Node.js 22.21.0
- Express.js
- PostgreSQL (Neon)
- OpenRouteService API

**Frontend:**

- React + TypeScript
- Vite
- TailwindCSS
- Leaflet (mappe)

**Database:**

- PostgreSQL 15
- PostGIS (coordinate GPS)
- Neon Cloud

### Componenti Principali

```
┌─────────────────────────────────────────────────────────┐
│                    SHOPPING ROUTE                        │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │   Backend    │  │   Database   │
│  RoutePage   │──│  Routing API │──│  PostgreSQL  │
│  VetrinePage │  │  Service     │  │  + PostGIS   │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ OpenRoute     │
                 │ Service       │
                 └───────────────┘
```

---

## 💾 Database Schema

### Migration 013: Coordinate Posteggi

```sql
-- Aggiunta campi geometria e metratura
ALTER TABLE stalls
  ADD COLUMN latitude DECIMAL(10,8),
  ADD COLUMN longitude DECIMAL(11,8),
  ADD COLUMN area_mq DECIMAL(8,2);

-- Indici per performance
CREATE INDEX idx_stalls_coordinates ON stalls(latitude, longitude);
```

### Tabella `stalls` (Posteggi)

| Campo        | Tipo          | Descrizione                      |
| ------------ | ------------- | -------------------------------- |
| `id`         | SERIAL        | ID univoco posteggio             |
| `market_id`  | INTEGER       | Riferimento mercato              |
| `number`     | VARCHAR(10)   | Numero posteggio ("1", "2", ...) |
| `latitude`   | DECIMAL(10,8) | Latitudine GPS ✨                |
| `longitude`  | DECIMAL(11,8) | Longitudine GPS ✨               |
| `area_mq`    | DECIMAL(8,2)  | Superficie in m² ✨              |
| `width`      | DECIMAL(8,2)  | Larghezza in metri               |
| `depth`      | DECIMAL(8,2)  | Profondità in metri              |
| `type`       | VARCHAR(20)   | "fisso", "spunta"                |
| `status`     | VARCHAR(20)   | "occupato", "libero"             |
| `impresa_id` | INTEGER       | Link a impresa/vetrina           |

✨ = Campi aggiunti con Migration 013

### Tabella `markets` (Mercati)

| Campo           | Tipo          | Descrizione                |
| --------------- | ------------- | -------------------------- |
| `id`            | SERIAL        | ID univoco mercato         |
| `code`          | VARCHAR(10)   | Codice mercato (GR001)     |
| `name`          | VARCHAR(255)  | Nome mercato               |
| `municipality`  | VARCHAR(255)  | Comune                     |
| `latitude`      | DECIMAL(10,8) | Latitudine centro mercato  |
| `longitude`     | DECIMAL(11,8) | Longitudine centro mercato |
| `gis_market_id` | VARCHAR(50)   | ID GIS (grosseto-market)   |

### Import Dati GeoJSON

**Script:** `scripts/update_stalls_geometry.js`

```javascript
// Importa coordinate da GeoJSON ufficiale
const geojson = require("../client/public/data/grosseto_full.geojson");

// Per ogni feature di tipo "slot"
features
  .filter(f => f.properties.kind === "slot")
  .forEach(feature => {
    const coords = calculateCentroid(feature.geometry.coordinates);
    const dimensions = parseDimensions(feature.properties.dimensions);

    // UPDATE stalls SET
    //   latitude = coords.lat,
    //   longitude = coords.lng,
    //   area_mq = ROUND(width * depth, 2)
    // WHERE gis_slot_id = feature.properties.id
  });
```

**Risultati:**

- 182 posteggi totali
- 159 con coordinate GPS
- 160 con area calcolata
- Media area: 30.40 mq

---

## 🔌 API Endpoints

### Base URL

```
http://157.90.29.66:3000/api
```

### POST `/routing/calculate`

Calcola percorso ottimale verso posteggio/mercato.

**Request Body:**

```json
{
  "start": {
    "lat": 42.760,
    "lng": 11.110
  },
  "destination": {
    "stallId": 1,           // Posteggio specifico
    "marketId": 1,          // Centro mercato
    "lat": 42.xxx,          // Coordinate dirette
    "lng": 11.xxx
  },
  "mode": "walking",        // walking, cycling, bus, driving
  "includeTPL": false       // Percorso multimodale
}
```

**Response:**

```json
{
  "success": true,
  "route": {
    "distance": 205.70,
    "duration": 147,
    "geometry": {
      "type": "LineString",
      "coordinates": [[lng, lat], ...]
    },
    "co2_saved": 39,
    "credits_earned": 2,
    "mode": "walking",
    "destination": {
      "type": "stall",
      "stallNumber": "1",
      "marketName": "Mercato Grosseto",
      "marketAddress": "Grosseto",
      "area": "30.40"
    },
    "summary": {
      "distance_km": "0.21",
      "duration_min": 2,
      "co2_saved_g": 39,
      "credits": 2
    },
    "legs": [...]           // Se multimodale
  }
}
```

**Modalità supportate:**

| Mode      | Velocità | Crediti/km | CO₂      |
| --------- | -------- | ---------- | -------- |
| `walking` | 1.4 m/s  | 10         | 0 g/km   |
| `cycling` | 4.2 m/s  | 8          | 0 g/km   |
| `bus`     | 8.3 m/s  | 5          | 68 g/km  |
| `driving` | 11.1 m/s | 0          | 192 g/km |

### GET `/routing/tpl-stops`

Trova fermate TPL vicine a coordinate.

**Query Parameters:**

- `lat`: Latitudine
- `lng`: Longitudine
- `radius`: Raggio ricerca in metri (default: 1000)

**Response:**

```json
{
  "success": true,
  "stops": [
    {
      "id": "stop_1",
      "name": "Fermata Piazza del Duomo",
      "latitude": 42.7595,
      "longitude": 11.1135,
      "lines": ["Linea 1", "Linea 3"],
      "distance": 450
    }
  ],
  "count": 1
}
```

### GET `/markets/:id/stalls`

Lista posteggi mercato con coordinate.

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "number": "1",
      "latitude": "42.75892858",
      "longitude": "11.11205399",
      "area_mq": "30.40",
      "width": "4.00",
      "depth": "7.60",
      "type": "fisso",
      "status": "occupato",
      "vendor_business_name": "Frutta e Verdura Rossi",
      "impresa_id": 18
    }
  ],
  "count": 160
}
```

---

## 🎨 Frontend Components

### RoutePage.tsx

Pagina principale Shopping Route.

**Percorso:** `/route`

**Funzionalità:**

- Form pianificazione percorso
- Selezione modalità trasporto
- Geolocalizzazione utente
- Visualizzazione risultati
- Mappa interattiva
- Navigazione real-time

**Props:**

```typescript
interface RoutePageProps {
  // Auto-carica da URL params
  address?: string; // ?address=Via+Roma+12
  name?: string; // ?name=Frutta+e+Verdura+Rossi
}
```

**State:**

```typescript
interface RouteState {
  origin: string;
  destination: string;
  mode: "walking" | "cycling" | "bus" | "driving";
  plan: RoutePlan | null;
  loading: boolean;
  userLocation: { lat: number; lng: number } | null;
  navigationActive: boolean;
}
```

### VetrinePage.tsx

Pagina vetrina digitale con link Shopping Route.

**Percorso:** `/vetrine/:id`

**Funzionalità:**

- Info negozio/impresa
- Badge "🚌 Raggiungibile con TPL"
- Pulsante "🗺️ Come Arrivare"
- Link a `/route?address=...&name=...`

**Modifiche richieste:**

```typescript
// Aggiungi pulsante "Come Arrivare"
<Link href={`/route?address=${encodeURIComponent(marketAddress)}&name=${encodeURIComponent(businessName)}`}>
  <Button variant="outline">
    <MapPin className="mr-2 h-4 w-4" />
    🗺️ Come Arrivare
  </Button>
</Link>

// Badge TPL se vicino a fermata
{nearTPL && (
  <Badge variant="success">
    <Bus className="mr-1 h-3 w-3" />
    Raggiungibile con TPL
  </Badge>
)}
```

### MobilityMap.tsx

Componente mappa interattiva con percorso.

**Props:**

```typescript
interface MobilityMapProps {
  route?: RouteGeometry;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (marker: Marker) => void;
}
```

**Funzionalità:**

- Visualizzazione percorso (LineString)
- Marker partenza/destinazione
- Marker posizione utente (real-time)
- Popup posteggi HUB
- Controlli zoom/pan

---

## ⚙️ Configurazione

### Variabili d'Ambiente

**Backend (.env):**

```bash
# Database
POSTGRES_URL=postgresql://user:pass@ep-xxx.neon.tech/miohub

# Routing Service
OPENROUTESERVICE_API_KEY=your_api_key_here

# Server
PORT=3000
NODE_ENV=production
```

**Frontend (.env):**

```bash
VITE_API_URL=http://157.90.29.66:3000
```

### OpenRouteService Setup

1. **Crea account:** https://openrouteservice.org/dev/#/signup
2. **Verifica email:** checchi@me.com
3. **Ottieni API key:** Dashboard → API Keys → Basic Key
4. **Configura backend:** Aggiungi a `.env`

**Quota gratuita:**

- 2000 richieste/giorno
- 40 richieste/minuto
- Directions, Isochrones, Matrix, Geocoding

**Fallback:**
Se API key non configurata, usa calcolo Haversine (distanza in linea d'aria).

---

## 🚀 Deployment

### Backend (Hetzner VPS)

**Server:** 157.90.29.66  
**SSH:** `ssh root@157.90.29.66`  
**Directory:** `/root/mihub-backend-rest`

**Deploy steps:**

```bash
# 1. Pull latest code
cd /root/mihub-backend-rest
git pull origin master

# 2. Install dependencies (se necessario)
npm install

# 3. Run migrations
node scripts/update_stalls_geometry.js

# 4. Restart PM2
pm2 restart mihub-backend
pm2 logs mihub-backend
```

**PM2 Config:**

```javascript
module.exports = {
  apps: [
    {
      name: "mihub-backend",
      script: "index.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

### Frontend (Vercel)

**URL:** https://dms-hub-app-new.vercel.app  
**Auto-deploy:** Push su `master` branch

**Vercel Config:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Database (Neon)

**Provider:** Neon.tech  
**Database:** miohub  
**Connection:** SSL required

**Migrations:**

```bash
# Esegui migration 013
psql $POSTGRES_URL -f migrations/013_add_coordinates_to_stalls.sql

# Import coordinate
node scripts/update_stalls_geometry.js
```

---

## 🧪 Testing

### Script Test Automatico

**File:** `/home/ubuntu/test_routing_api.sh`

```bash
chmod +x test_routing_api.sh
./test_routing_api.sh
```

**Test suite:**

1. ✅ Percorso a piedi → Posteggio #1
2. ✅ Percorso bici → Posteggio #1
3. ✅ Percorso → Centro mercato
4. ✅ Percorso multimodale TPL
5. ✅ Coordinate GPS dirette
6. ✅ Ricerca fermate TPL
7. ✅ Errore posteggio inesistente
8. ✅ Errore coordinate mancanti
9. ✅ Percorso lungo (5km)
10. ✅ Confronto modalità

### Test Manuali

**Test 1: Percorso verso posteggio**

```bash
curl -X POST http://157.90.29.66:3000/api/routing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "start": {"lat": 42.760, "lng": 11.110},
    "destination": {"stallId": 1},
    "mode": "walking"
  }'
```

**Test 2: Fermate TPL**

```bash
curl "http://157.90.29.66:3000/api/routing/tpl-stops?lat=42.760&lng=11.110&radius=1000"
```

**Test 3: Posteggi con coordinate**

```bash
curl "http://157.90.29.66:3000/api/markets/1/stalls?limit=5"
```

---

## 🗺️ Roadmap

### ✅ Fase 1: Database & Geometria (COMPLETATA)

- [x] Migration 013 coordinate posteggi
- [x] Script import da GeoJSON
- [x] Calcolo area_mq
- [x] Indici performance

### ✅ Fase 2: Backend Routing API (COMPLETATA)

- [x] Routing Service con OpenRouteService
- [x] Endpoint `/routing/calculate`
- [x] Endpoint `/routing/tpl-stops`
- [x] Calcolo CO₂ e crediti
- [x] Supporto multi-modale
- [x] Fallback Haversine
- [x] Test suite completa

### ⏳ Fase 3: Frontend Shopping Route (IN CORSO)

- [ ] Sostituire dati MOCK con API reale
- [ ] Integrazione chiamata routing
- [ ] Visualizzazione risultati
- [ ] Mappa interattiva percorso
- [ ] Navigazione real-time

### 📅 Fase 4: Integrazione Vetrine

- [ ] Badge "Raggiungibile con TPL"
- [ ] Pulsante "Come Arrivare"
- [ ] Link diretto a Shopping Route
- [ ] Calcolo distanza da fermate TPL

### 📅 Fase 5: Centro Mobilità Nazionale

- [ ] Integrazione API Centro Mobilità
- [ ] Fermate TPL da database nazionale
- [ ] Orari real-time (se disponibili)
- [ ] Linee bus/metro/tram

### 📅 Fase 6: Gamification Avanzata

- [ ] Profilo utente con statistiche
- [ ] Badge sostenibilità
- [ ] Classifica shopper eco-friendly
- [ ] Rewards e incentivi

### 📅 Fase 7: Scalabilità Nazionale

- [ ] Onboarding nuovi mercati
- [ ] Import GeoJSON automatico
- [ ] Dashboard PA per ogni comune
- [ ] Sistema interoperabile

---

## 📚 Documentazione Aggiuntiva

### File di Riferimento

1. **Report Completo:** `/home/ubuntu/REPORT_SHOPPING_ROUTE_ETICO.md`
2. **Schema Architettura:** `/home/ubuntu/SCHEMA_SHOPPING_ROUTE.md`
3. **Test Script:** `/home/ubuntu/test_routing_api.sh`
4. **Migration 013:** `migrations/013_add_coordinates_to_stalls.sql`
5. **Import Script:** `scripts/update_stalls_geometry.js`

### Repository

**Backend:** https://github.com/Chcndr/mihub-backend-rest  
**Frontend:** https://github.com/Chcndr/dms-hub-app-new

### Credenziali

**OpenRouteService:**

- Email: checchi@me.com
- Dashboard: https://openrouteservice.org/dev/#/home
- File: `/home/ubuntu/openrouteservice_credentials.md`

---

## 🤝 Contribuire

### Aggiungere Nuovo Mercato

1. **Crea GeoJSON mercato:**

   ```json
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "properties": {
           "kind": "slot",
           "number": "1",
           "dimensions": "4m × 7.6m"
         },
         "geometry": {
           "type": "Polygon",
           "coordinates": [[[lng, lat], ...]]
         }
       }
     ]
   }
   ```

2. **Inserisci mercato in database:**

   ```sql
   INSERT INTO markets (code, name, municipality, latitude, longitude, gis_market_id)
   VALUES ('BO001', 'Mercato Bologna', 'Bologna', 44.4949, 11.3426, 'bologna-market');
   ```

3. **Esegui import coordinate:**
   ```bash
   node scripts/update_stalls_geometry.js --market=bologna-market
   ```

### Aggiungere Nuova Modalità Trasporto

1. **Aggiungi configurazione in routingService.js:**

   ```javascript
   const MODES = {
     scooter: {
       speed: 6.0, // m/s
       creditsPerKm: 6,
       co2PerKm: 0, // g/km
     },
   };
   ```

2. **Aggiungi supporto OpenRouteService:**

   ```javascript
   const ORS_PROFILES = {
     scooter: "cycling-regular", // Usa profilo esistente
   };
   ```

3. **Aggiungi UI frontend:**
   ```tsx
   <SelectItem value="scooter">
     <Scooter className="mr-2 h-4 w-4" />
     Monopattino
   </SelectItem>
   ```

---

## 📞 Supporto

**Sviluppatore:** Manus AI  
**Cliente:** Alessandro Checchi  
**Email:** checchi@me.com  
**Repository:** github.com/Chcndr/mihub-backend-rest

---

**Blueprint aggiornato:** 16 Dicembre 2025  
**Versione:** 1.0  
**Status:** ✅ Backend Complete | ⏳ Frontend In Progress
