import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  gradient?: { [key: number]: string };
}

/**
 * Componente per aggiungere heatmap alla mappa
 * Usa Leaflet.heat per visualizzare aree calde
 * Segue la stessa struttura di RouteLayer
 */
export function HeatmapLayer({ 
  points, 
  radius = 25, 
  blur = 15, 
  maxZoom = 17,
  max = 1.0,
  gradient = {
    0.0: '#00ff00',  // Verde (bassa densità)
    0.3: '#ffff00',  // Giallo
    0.5: '#ffa500',  // Arancione
    0.7: '#ff6600',  // Arancione scuro
    1.0: '#ff0000'   // Rosso (alta densità)
  }
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Converti punti nel formato richiesto da leaflet.heat
    // Formato: [lat, lng, intensity]
    const heatData: [number, number, number][] = points.map(p => [
      p.lat,
      p.lng,
      p.intensity || 1.0
    ]);

    // Crea layer heatmap
    const heatLayer = (L as any).heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max,
      gradient
    }).addTo(map);

    // Cleanup quando component unmounts
    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, radius, blur, maxZoom, max, gradient]);

  return null;
}

export default HeatmapLayer;
