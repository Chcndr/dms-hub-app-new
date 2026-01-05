/**
 * MappaHubMini.tsx
 * Componente mappa semplificato per il Cruscotto della Gestione Hub Territoriale
 * Mostra solo la mappa Leaflet con i marker M dei mercati
 */
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MarketMapComponent } from './MarketMapComponent';
import { MIHUB_API_BASE_URL } from '@/config/api';

const API_BASE_URL = MIHUB_API_BASE_URL;

interface Market {
  id: number;
  code: string;
  name: string;
  municipality: string;
  days: string;
  total_stalls: number;
  status: string;
  latitude: string;
  longitude: string;
}

interface MappaHubMiniProps {
  onMarketClick?: (marketId: number) => void;
}

export default function MappaHubMini({ onMarketClick }: MappaHubMiniProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/markets`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setMarkets(json.data);
      }
    } catch (error) {
      console.error('[MappaHubMini] Errore caricamento mercati:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0b1220]">
        <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
      </div>
    );
  }

  // Prepara i dati dei mercati per la mappa
  const allMarketsForMap = markets.map(m => ({
    id: m.id,
    name: m.name,
    latitude: parseFloat(m.latitude) || 42.5,
    longitude: parseFloat(m.longitude) || 12.5
  }));

  return (
    <div className="w-full h-full">
      <MarketMapComponent
        mapData={{
          center: { lat: 42.5, lng: 12.5 },
          stalls_geojson: { type: 'FeatureCollection', features: [] }
        }}
        center={[42.5, 12.5]}
        zoom={6}
        height="100%"
        showItalyView={true}
        allMarkets={allMarketsForMap}
        onMarketClick={onMarketClick}
      />
    </div>
  );
}
