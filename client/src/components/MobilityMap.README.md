# 🗺️ Documentazione Tecnica - MobilityMap.tsx

**Data:** 22 Novembre 2025  
**Autore:** Manus AI  
**Stato:** ✅ Completo

---

## 1. Panoramica

`MobilityMap.tsx` è un componente React specializzato per la visualizzazione di dati sulla mobilità urbana. A differenza di `MarketMapComponent` (basato su Leaflet), questo componente utilizza **Google Maps** per sfruttare le sue funzionalità avanzate di routing e direzioni stradali, in particolare per il trasporto pubblico.

**Scopo Principale:** Fornire una mappa interattiva per il "Centro Mobilità" all'interno del Dashboard PA, mostrando fermate di autobus, tram, parcheggi e calcolando percorsi con mezzi pubblici.

**File:** `client/src/components/MobilityMap.tsx`

---

## 2. Stack Tecnologico

| Tecnologia | Utilizzo |
| :--- | :--- |
| **React** | Componente UI |
| **TypeScript** | Tipizzazione e sicurezza del codice |
| **Google Maps JavaScript API** | Core della mappa, marker, popup e direzioni |
| **Lucide React** | Icone (es. `Loader2`) |

**Nota:** Il componente `MapView` (`./Map.tsx`) è un wrapper leggero per l'inizializzazione della mappa Google, ma la logica principale risiede in `MobilityMap.tsx`.

---

## 3. Props del Componente

Il componente accetta le seguenti props per la configurazione:

| Prop | Tipo | Default | Descrizione |
| :--- | :--- | :--- | :--- |
| `stops` | `MobilityStop[]` | `[]` | **(Obbligatorio)** Array di oggetti che rappresentano le fermate/punti di interesse da mostrare sulla mappa. |
| `center` | `{ lat: number; lng: number }` | `{ lat: 42.7606, lng: 11.1133 }` | Coordinate del centro mappa (default: Grosseto). |
| `zoom` | `number` | `13` | Livello di zoom iniziale della mappa. |
| `onStopClick` | `(stop: MobilityStop) => void` | `undefined` | Funzione di callback eseguita al click su un marker di una fermata. |
| `showDirections` | `boolean` | `false` | Se `true`, attiva la modalità direzioni stradali. |
| `origin` | `string` | `undefined` | Punto di partenza per il calcolo del percorso (es. "Via Roma 1, Grosseto"). Richiesto se `showDirections` è `true`. |
| `destination` | `string` | `undefined` | Punto di arrivo per il calcolo del percorso. Richiesto se `showDirections` è `true`. |
| `onDirectionsCalculated` | `(directions: any) => void` | `undefined` | Funzione di callback che restituisce il risultato del calcolo del percorso dall'API di Google Maps. |

---

## 4. Struttura Dati

### Interfaccia `MobilityStop`

Questa interfaccia definisce la struttura di ogni punto di interesse sulla mappa.

```typescript
interface MobilityStop {
  id: number;
  type: 'bus' | 'tram' | 'parking'; // Tipo di punto di interesse
  stopName: string; // Nome della fermata/parcheggio
  lineNumber?: string; // Numero della linea (es. "10", "G1")
  lineName?: string; // Nome della linea (es. "Stazione FS - Centro")
  lat: string; // Latitudine
  lng: string; // Longitudine
  nextArrival?: number; // Prossimo arrivo in minuti
  occupancy?: number; // Percentuale di occupazione del mezzo
  status?: string; // Stato del servizio (es. "active", "delayed")
  totalSpots?: number; // Posti totali (per parcheggi)
  availableSpots?: number; // Posti disponibili (per parcheggi)
}
```

---

## 5. Funzionalità Principali

### 5.1. Visualizzazione Marker Personalizzati

Il componente renderizza marker diversi in base al `type` della fermata:

- **Bus (`type: 'bus'`)**: Icona di un autobus blu.
- **Tram (`type: 'tram'`)**: Icona di un tram verde.
- **Parcheggio (`type: 'parking'`)**: Icona "P" arancione.

Le icone sono generate dinamicamente come SVG inline e codificate in Base64 per essere usate direttamente da Google Maps, eliminando la necessità di file di immagine esterni.

```javascript
// Esempio di generazione icona SVG per il bus
icon.url = 'data:image/svg+xml;base64,' + btoa(`
  <svg xmlns="http://www.w3.org/2000/svg" ...>
    <rect x="3" y="6" width="18" height="12" rx="2"/>
    <path d="M3 10h18"/>
    <circle cx="8" cy="16" r="1"/>
    <circle cx="16" cy="16" r="1"/>
  </svg>
`);
```

### 5.2. Popup Informativi (InfoWindows)

Al click su ogni marker, viene mostrata una `InfoWindow` di Google Maps con dettagli specifici del punto di interesse, formattati dinamicamente in base ai dati disponibili.

**Contenuti del Popup:**
- Nome della fermata
- Linee che servono la fermata
- Prossimo arrivo (in minuti)
- Occupazione del mezzo (in %)
- Posti disponibili (per i parcheggi)
- Stato del servizio (Attivo, Ritardo, Sospeso)

### 5.3. Calcolo Percorsi con Mezzi Pubblici

Se la prop `showDirections` è impostata a `true`, il componente attiva la modalità di calcolo del percorso.

- **Servizio Utilizzato**: `google.maps.DirectionsService`
- **Modalità di Viaggio**: `TRANSIT` (mezzi pubblici)
- **Preferenza**: `FEWER_TRANSFERS` (meno cambi possibili)

Il percorso calcolato viene renderizzato sulla mappa tramite `google.maps.DirectionsRenderer`, mostrando la linea del percorso e i marker di partenza e arrivo.

```javascript
directionsService.route(
  {
    origin: "Via Roma 1, Grosseto",
    destination: "Piazza Dante, Grosseto",
    travelMode: window.google.maps.TravelMode.TRANSIT,
  },
  (result, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    }
  }
);
```

---

## 6. Logica di Funzionamento (Lifecycle)

1.  **Inizializzazione**: Il componente `MapView` carica lo script di Google Maps e renderizza il contenitore della mappa.
2.  **`onMapReady`**: Quando la mappa è pronta, l'istanza della mappa viene salvata nello stato (`setMap`). Se `showDirections` è `true`, viene inizializzato anche il `DirectionsRenderer`.
3.  **`useEffect` [map, stops]**: Appena la mappa e le `stops` sono disponibili, il componente cicla sull'array `stops`:
    -   Pulisce i marker precedenti.
    -   Crea un nuovo `google.maps.Marker` per ogni fermata con l'icona appropriata.
    -   Crea una `google.maps.InfoWindow` con i dettagli della fermata.
    -   Aggiunge un listener `click` al marker per aprire l'infowindow e chiamare il callback `onStopClick`.
    -   Salva i riferimenti ai marker per poterli pulire in seguito.
4.  **`useEffect` [map, directionsRenderer, origin, destination]**: Se la modalità direzioni è attiva e `origin` e `destination` sono forniti:
    -   Chiama il `DirectionsService` di Google Maps.
    -   Passa il risultato al `DirectionsRenderer` per disegnarlo sulla mappa.
    -   Esegue il callback `onDirectionsCalculated` con i dati del percorso.

---

## 7. Esempio di Utilizzo

Ecco come `MobilityMap` viene utilizzato all'interno del tab "Centro Mobilità" in `DashboardPA.tsx`.

```tsx
import MobilityMap from '@/components/MobilityMap';

// Dati mock o da API
const mobilityStops: MobilityStop[] = [
  {
    id: 1,
    type: 'bus',
    stopName: 'Stazione FS',
    lineNumber: 'G1, G3, 10',
    lat: '42.765',
    lng: '11.110',
    nextArrival: 5,
    status: 'active'
  },
  {
    id: 2,
    type: 'parking',
    stopName: 'Parcheggio Piazza del Sale',
    lat: '42.763',
    lng: '11.115',
    totalSpots: 200,
    availableSpots: 85
  }
];

function MyMobilityDashboard() {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MobilityMap
        stops={mobilityStops}
        center={{ lat: 42.763, lng: 11.115 }}
        zoom={14}
        onStopClick={(stop) => {
          console.log('Fermata cliccata:', stop.stopName);
        }}
      />
    </div>
  );
}
```

---

## 8. Relazione con MarketMapComponent

`MobilityMap` e `MarketMapComponent` sono stati mantenuti come componenti separati per una ragione strategica:

-   **Stack Tecnologico Diverso**: `MobilityMap` usa **Google Maps** per il routing avanzato, mentre `MarketMapComponent` usa **Leaflet** per la sua leggerezza, flessibilità e costi nulli, ideale per la visualizzazione di dati GeoJSON personalizzati (i posteggi).
-   **Scopo Diverso**: `MobilityMap` è focalizzato sulla mobilità e percorsi, `MarketMapComponent` sulla gestione e stato dei posteggi di un'area specifica.

**Proposta Futura:** È possibile valutare di creare un layer "Mobilità" all'interno di `MarketMapComponent` che, quando attivato, mostri le fermate dei bus vicine al mercato, interrogando un endpoint API dedicato (es. `/api/mobility/stops-near-market/:marketId`). Questo unirebbe i due mondi senza sacrificare le performance di `MarketMapComponent`.
