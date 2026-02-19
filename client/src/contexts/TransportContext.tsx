/**
 * TransportContext.tsx
 * 
 * Context React per gestire i dati GTFS del trasporto pubblico.
 * Fornisce accesso centralizzato a fermate, linee e orari.
 * 
 * AGGIORNATO: Ora usa le API GTFS reali via MIHUB_API_BASE_URL
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TransportStop, TransportRoute, StopTime } from '@/components/TransportStopsLayer';
import { MIHUB_API_BASE_URL } from '@/config/api';

// API base URL - Backend MioHub con dati GTFS reali
const API_BASE = `${MIHUB_API_BASE_URL}/api/gtfs`;

interface TransportContextType {
  // Dati
  stops: TransportStop[];
  routes: TransportRoute[];
  isLoading: boolean;
  error: string | null;
  
  // Statistiche
  stats: {
    totalStops: number;
    totalRoutes: number;
    busStops: number;
    trainStops: number;
  } | null;
  
  // Filtri attivi
  showBusStops: boolean;
  showTrainStops: boolean;
  transportLayerVisible: boolean;
  
  // Azioni
  setShowBusStops: (show: boolean) => void;
  setShowTrainStops: (show: boolean) => void;
  setTransportLayerVisible: (visible: boolean) => void;
  
  // Funzioni
  loadStops: (region?: string) => Promise<void>;
  loadStopsNearPoint: (lat: number, lng: number, radiusKm?: number) => Promise<TransportStop[]>;
  getNextDepartures: (stopId: string, limit?: number) => Promise<StopTime[]>;
  getRoutesForStop: (stopId: string) => Promise<TransportRoute[]>;
  loadStats: () => Promise<void>;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

interface TransportProviderProps {
  children: ReactNode;
}

// Trasforma i dati dall'API al formato frontend
const transformApiStop = (apiStop: any): TransportStop => {
  // Trasforma routes - gestisce sia stringhe che oggetti {line, location}
  let transformedRoutes: TransportRoute[] = [];
  if (Array.isArray(apiStop.routes)) {
    transformedRoutes = apiStop.routes.map((r: any) => {
      // Se è una stringa semplice (es. "REG", "IC")
      if (typeof r === 'string') {
        return {
          route_id: r,
          route_short_name: r,
          route_long_name: `Linea ${r}`,
          route_type: apiStop.stop_type === 'train' ? 2 : 3,
        };
      }
      // Se è un oggetto con {line, location} (formato TPER)
      if (typeof r === 'object' && r !== null) {
        const lineId = r.line || r.route_id || 'N/A';
        const locationName = r.location || r.route_long_name || '';
        return {
          route_id: lineId,
          route_short_name: lineId,
          route_long_name: locationName ? `Linea ${lineId} - ${locationName}` : `Linea ${lineId}`,
          route_type: apiStop.stop_type === 'train' ? 2 : 3,
        };
      }
      // Fallback
      return {
        route_id: 'unknown',
        route_short_name: '?',
        route_long_name: 'Linea sconosciuta',
        route_type: 3,
      };
    });
  }

  return {
    stop_id: apiStop.stop_id,
    stop_name: apiStop.stop_name,
    stop_lat: parseFloat(apiStop.stop_lat),
    stop_lon: parseFloat(apiStop.stop_lon),
    stop_type: apiStop.stop_type as 'bus' | 'train',
    agency_name: apiStop.provider === 'tper' ? 'TPER' : 
                 apiStop.provider === 'trenitalia' ? 'Trenitalia' : 
                 apiStop.provider === 'tiemme' ? 'Tiemme' :
                 apiStop.provider,
    routes: transformedRoutes,
    // Campi aggiuntivi dall'API nearby
    distance_m: apiStop.distance_m,
    walk_time_min: apiStop.walk_time_min,
  };
};

export function TransportProvider({ children }: TransportProviderProps) {
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TransportContextType['stats']>(null);
  
  // Filtri
  const [showBusStops, setShowBusStops] = useState(true);
  const [showTrainStops, setShowTrainStops] = useState(true);
  const [transportLayerVisible, setTransportLayerVisible] = useState(false);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) throw new Error(`Errore: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        const busCount = data.stats.breakdown
          .filter((b: any) => b.stop_type === 'bus')
          .reduce((sum: number, b: any) => sum + parseInt(b.count), 0);
        const trainCount = data.stats.breakdown
          .filter((b: any) => b.stop_type === 'train')
          .reduce((sum: number, b: any) => sum + parseInt(b.count), 0);
        
        setStats({
          totalStops: data.stats.total_stops,
          totalRoutes: data.stats.total_routes,
          busStops: busCount,
          trainStops: trainCount,
        });
        console.warn('[TransportContext] Stats caricate:', data.stats);
      }
    } catch (err) {
      console.error('[TransportContext] Errore caricamento stats:', err);
    }
  }, []);

  // Carica fermate per regione/tipo - Carica sia bus che treni
  const loadStops = useCallback(async (region?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Carica bus e treni in parallelo
      const busParams = new URLSearchParams();
      busParams.append('type', 'bus');
      busParams.append('limit', '5000'); // Limite alto per bus
      if (region && region !== 'all') busParams.append('region', region);
      
      const trainParams = new URLSearchParams();
      trainParams.append('type', 'train');
      trainParams.append('limit', '500'); // Tutte le stazioni treni
      
      const [busResponse, trainResponse] = await Promise.all([
        fetch(`${API_BASE}/stops?${busParams}`),
        fetch(`${API_BASE}/stops?${trainParams}`)
      ]);
      
      let allStops: TransportStop[] = [];
      
      // Processa bus
      if (busResponse.ok) {
        const busData = await busResponse.json();
        if (busData.success && Array.isArray(busData.data)) {
          const busStops = busData.data.map(transformApiStop);
          allStops = [...allStops, ...busStops];
          console.warn('[TransportContext] Caricate', busStops.length, 'fermate bus');
        }
      }
      
      // Processa treni
      if (trainResponse.ok) {
        const trainData = await trainResponse.json();
        if (trainData.success && Array.isArray(trainData.data)) {
          const trainStops = trainData.data.map(transformApiStop);
          allStops = [...allStops, ...trainStops];
          console.warn('[TransportContext] Caricate', trainStops.length, 'stazioni treni');
        }
      }
      
      if (allStops.length > 0) {
        setStops(allStops);
        console.warn('[TransportContext] Totale fermate caricate:', allStops.length);
      } else {
        throw new Error('Nessuna fermata trovata');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(message);
      console.error('[TransportContext] Errore:', message);
      
      // Fallback: carica dati demo se API non disponibile
      loadDemoStops();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carica fermate vicine a un punto (usa API nearby)
  const loadStopsNearPoint = useCallback(async (
    lat: number, 
    lng: number, 
    radiusKm: number = 2
  ): Promise<TransportStop[]> => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(), // API usa 'lon' non 'lng'
        radius: radiusKm.toString(),
        limit: '20',
      });
      
      const response = await fetch(`${API_BASE}/stops/nearby?${params}`);
      
      if (!response.ok) {
        throw new Error(`Errore: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const transformedStops = data.data.map(transformApiStop);
        console.warn('[TransportContext] Trovate', transformedStops.length, 'fermate vicine');
        return transformedStops;
      }
      
      return [];
    } catch (err) {
      console.error('[TransportContext] Errore caricamento fermate vicine:', err);
      
      // Fallback: filtra dalle fermate già caricate
      return filterStopsNearPoint(stops, lat, lng, radiusKm);
    }
  }, [stops]);

  // Ottieni prossime partenze per una fermata
  const getNextDepartures = useCallback(async (
    stopId: string, 
    limit: number = 10
  ): Promise<StopTime[]> => {
    // TODO: Implementare quando avremo i dati degli orari
    console.warn('[TransportContext] getNextDepartures non ancora implementato');
    return [];
  }, []);

  // Ottieni linee che passano per una fermata
  const getRoutesForStop = useCallback(async (stopId: string): Promise<TransportRoute[]> => {
    // Le linee sono già incluse nei dati della fermata
    const stop = stops.find(s => s.stop_id === stopId);
    return stop?.routes || [];
  }, [stops]);

  // Funzione helper per filtrare fermate vicine (client-side)
  const filterStopsNearPoint = (
    allStops: TransportStop[], 
    lat: number, 
    lng: number, 
    radiusKm: number
  ): TransportStop[] => {
    return allStops.filter(stop => {
      const distance = calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon);
      return distance <= radiusKm;
    }).map(stop => ({
      ...stop,
      distance_m: Math.round(calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon) * 1000),
      walk_time_min: Math.round(calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon) * 12),
    })).sort((a, b) => (a.distance_m || 0) - (b.distance_m || 0));
  };

  // Calcola distanza Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Carica dati demo per sviluppo/fallback
  const loadDemoStops = () => {
    console.warn('[TransportContext] Caricamento dati demo (fallback)...');
    
    // Fermate demo minime per fallback
    const demoStops: TransportStop[] = [
      {
        stop_id: 'train_bologna_centrale',
        stop_name: 'Bologna Centrale',
        stop_lat: 44.5058,
        stop_lon: 11.3426,
        stop_type: 'train',
        agency_name: 'Trenitalia',
        routes: [
          { route_id: 'RV', route_short_name: 'RV', route_long_name: 'Regionale Veloce', route_type: 2 },
        ],
      },
      {
        stop_id: 'bus_bo_piazza_maggiore',
        stop_name: 'Piazza Maggiore',
        stop_lat: 44.4938,
        stop_lon: 11.3430,
        stop_type: 'bus',
        agency_name: 'TPER',
        routes: [
          { route_id: '11', route_short_name: '11', route_long_name: 'Stazione - Pilastro', route_type: 3 },
        ],
      },
      {
        stop_id: 'train_grosseto',
        stop_name: 'Grosseto',
        stop_lat: 42.7604,
        stop_lon: 11.1012,
        stop_type: 'train',
        agency_name: 'Trenitalia',
      },
    ];
    
    setStops(demoStops);
    console.warn('[TransportContext] Caricate', demoStops.length, 'fermate demo (fallback)');
  };

  // Carica dati iniziali dalle API reali
  useEffect(() => {
    // Carica statistiche
    loadStats();
    
    // Carica tutte le fermate dalle API reali
    loadStops();
  }, [loadStats, loadStops]);

  const value: TransportContextType = {
    stops,
    routes,
    isLoading,
    error,
    stats,
    showBusStops,
    showTrainStops,
    transportLayerVisible,
    setShowBusStops,
    setShowTrainStops,
    setTransportLayerVisible,
    loadStops,
    loadStopsNearPoint,
    getNextDepartures,
    getRoutesForStop,
    loadStats,
  };

  return (
    <TransportContext.Provider value={value}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
}

export default TransportContext;
