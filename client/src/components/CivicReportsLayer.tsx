/**
 * CivicReportsLayer - Componente per visualizzare segnalazioni civiche sulla mappa
 * 
 * Questo componente renderizza:
 * 1. Marker colorati per ogni segnalazione (con colore basato su tipo)
 * 2. Heatmap (zone di calore) per visualizzare densità segnalazioni
 * 
 * @author Manus AI
 * @version 1.0.0
 * @date 30 Gennaio 2026
 */

import React, { useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ============================================================
// INTERFACCE
// ============================================================

/**
 * Interfaccia per una segnalazione civica
 * NOTA: Tutti i campi non presenti nello schema DB originale sono opzionali
 */
export interface CivicReport {
  id: number;
  type: string;
  description: string;
  lat: string | null;
  lng: string | null;
  status: string;
  created_at: string;
  // Campi opzionali (aggiunti nello schema aggiornato)
  priority?: string | null;
  address?: string | null;
  user_id?: number | null;
  comune_id?: number | null;
  photo_url?: string | null;
  updated_at?: string | null;
}

export interface CivicReportsLayerProps {
  /** Array di segnalazioni civiche da visualizzare */
  civicReports: CivicReport[];
  /** Mostra marker colorati (default: true) */
  showMarkers?: boolean;
  /** Mostra heatmap zone di calore (default: true) */
  showHeatmap?: boolean;
  /** Callback quando si clicca su un marker */
  onReportClick?: (report: CivicReport) => void;
}

// ============================================================
// COSTANTI
// ============================================================

/**
 * Schema colori per i marker in base al tipo di segnalazione
 */
export const CIVIC_MARKER_COLORS: Record<string, string> = {
  'buche': '#f97316',           // 🟠 Arancione
  'illuminazione': '#eab308',   // 🟡 Giallo
  'rifiuti': '#22c55e',         // 🟢 Verde
  'microcriminalita': '#ef4444', // 🔴 Rosso
  'abusivismo': '#a855f7',      // 🟣 Viola
  'degrado': '#f97316',         // 🟠 Arancione (alias)
  'sicurezza': '#ef4444',       // 🔴 Rosso (alias)
  'altro': '#6b7280',           // ⚪ Grigio default
};

/**
 * Etichette italiane per i tipi di segnalazione
 */
export const CIVIC_TYPE_LABELS: Record<string, string> = {
  'buche': 'Buche Stradali',
  'illuminazione': 'Illuminazione',
  'rifiuti': 'Rifiuti Abbandonati',
  'microcriminalita': 'Microcriminalità',
  'abusivismo': 'Commercio Abusivo',
  'degrado': 'Degrado Urbano',
  'sicurezza': 'Sicurezza',
  'altro': 'Altra Segnalazione',
};

/**
 * Etichette italiane per gli stati
 */
export const CIVIC_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'pending': { label: 'In Attesa', color: 'text-orange-500', icon: '⏸' },
  'in_progress': { label: 'In Lavorazione', color: 'text-blue-500', icon: '⏳' },
  'resolved': { label: 'Risolta', color: 'text-green-500', icon: '✓' },
  'rejected': { label: 'Rifiutata', color: 'text-red-500', icon: '✗' },
};

// ============================================================
// COMPONENTE HEATMAP
// ============================================================

/**
 * Componente interno per gestire la heatmap con leaflet.heat
 */
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!points.length) return;
    
    // Importa dinamicamente leaflet.heat
    import('leaflet.heat').then(() => {
      // @ts-ignore - leaflet.heat aggiunge L.heatLayer
      const heatLayer = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 3,
        minOpacity: 0.3,
        gradient: {
          0.0: '#3b82f6',  // Blu (bassa densità)
          0.25: '#22c55e', // Verde
          0.5: '#eab308',  // Giallo
          0.75: '#f97316', // Arancione
          1.0: '#ef4444',  // Rosso (alta densità)
        }
      });
      
      heatLayer.addTo(map);
      
      // Cleanup
      return () => {
        map.removeLayer(heatLayer);
      };
    }).catch(err => {
      console.warn('[CivicReportsLayer] Errore caricamento leaflet.heat:', err);
    });
  }, [map, points]);
  
  return null;
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================

/**
 * CivicReportsLayer - Layer per segnalazioni civiche sulla mappa
 * 
 * Uso:
 * ```tsx
 * <MapContainer>
 *   <TileLayer ... />
 *   <CivicReportsLayer 
 *     civicReports={reports} 
 *     showMarkers={true}
 *     showHeatmap={true}
 *   />
 * </MapContainer>
 * ```
 */
export function CivicReportsLayer({
  civicReports,
  showMarkers = true,
  showHeatmap = true,
  onReportClick
}: CivicReportsLayerProps) {
  
  // Filtra solo segnalazioni con coordinate valide
  const validReports = useMemo(() => {
    return civicReports.filter(report => {
      if (!report.lat || !report.lng) return false;
      const lat = parseFloat(report.lat);
      const lng = parseFloat(report.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [civicReports]);
  
  // Trasforma in punti per heatmap [lat, lng, intensity]
  const heatmapPoints = useMemo(() => {
    return validReports.map(report => {
      const lat = parseFloat(report.lat!);
      const lng = parseFloat(report.lng!);
      
      // Calcola intensità basata su priorità e status
      let intensity = 1;
      if (report.priority === 'HIGH') intensity = 2;
      if (report.priority === 'URGENT') intensity = 3;
      if (report.status === 'pending') intensity += 0.5;
      
      return [lat, lng, intensity] as [number, number, number];
    });
  }, [validReports]);
  
  // Se non ci sono segnalazioni valide, non renderizzare nulla
  if (validReports.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Layer Heatmap (renderizzato sotto i marker) */}
      {showHeatmap && heatmapPoints.length > 0 && (
        <HeatmapLayer points={heatmapPoints} />
      )}
      
      {/* Layer Marker Civici */}
      {showMarkers && validReports.map((report) => {
        const lat = parseFloat(report.lat!);
        const lng = parseFloat(report.lng!);
        
        // Determina colore in base al tipo
        const typeKey = report.type?.toLowerCase() || 'altro';
        const color = CIVIC_MARKER_COLORS[typeKey] || CIVIC_MARKER_COLORS['altro'];
        
        // Determina stile in base allo status
        const isResolved = report.status === 'resolved';
        const isInProgress = report.status === 'in_progress';
        const isUrgent = report.priority === 'URGENT';
        
        // Dimensione marker (più grande se urgente)
        const size = isUrgent ? 20 : 14;
        
        // Crea icona marker con div personalizzato
        const markerIcon = L.divIcon({
          className: `civic-marker ${isUrgent ? 'civic-marker-urgent' : ''}`,
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background-color: ${isResolved ? '#9ca3af' : color};
            opacity: ${isResolved ? 0.5 : 1};
            border: ${isInProgress ? '3px solid white' : 'none'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ${isUrgent ? 'animation: civic-pulse 1.5s ease-in-out infinite;' : ''}
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        
        // Ottieni label e status info
        const typeLabel = CIVIC_TYPE_LABELS[typeKey] || report.type || 'Segnalazione';
        const statusInfo = CIVIC_STATUS_LABELS[report.status] || CIVIC_STATUS_LABELS['pending'];
        
        return (
          <Marker
            key={`civic-${report.id}`}
            position={[lat, lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onReportClick?.(report)
            }}
          >
            <Popup className="civic-report-popup">
              <div className="min-w-[200px] text-sm">
                {/* Header con tipo e colore */}
                <div 
                  className="font-bold text-white px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t"
                  style={{ backgroundColor: color }}
                >
                  {typeLabel}
                </div>
                
                {/* Descrizione */}
                <div className="text-gray-700 mb-2 px-1">
                  {report.description}
                </div>
                
                {/* Indirizzo se presente */}
                {report.address && (
                  <div className="text-xs text-gray-500 mb-2 px-1">
                    📍 {report.address}
                  </div>
                )}
                
                {/* Data e Status */}
                <div className="flex justify-between items-center text-xs border-t pt-2 px-1">
                  <span className="text-gray-400">
                    {new Date(report.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span className={`font-medium ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
                
                {/* Badge priorità se urgente */}
                {isUrgent && (
                  <div className="mt-2 px-1">
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                      ⚠️ URGENTE
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default CivicReportsLayer;
