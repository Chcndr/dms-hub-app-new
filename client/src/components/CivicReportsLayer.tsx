/**
 * CivicReportsLayer - Componente per visualizzare segnalazioni civiche sulla mappa
 *
 * Versione SEMPLIFICATA: solo marker colorati, senza heatmap
 * La heatmap verrà aggiunta in una versione successiva
 *
 * @author Manus AI
 * @version 1.2.0 - Interfaccia allineata a schema Drizzle (camelCase)
 * @date 30 Gennaio 2026
 */
import React, { useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";

// ============================================================
// INTERFACCE
// ============================================================

/**
 * Interfaccia per una segnalazione civica
 * ALLINEATA allo schema Drizzle (camelCase)
 */
export interface CivicReport {
  id: number;
  type: string;
  description: string | null;
  lat: string | null;
  lng: string | null;
  status: string | null;
  createdAt: Date | string | null;
  // Campi opzionali
  userId?: number | null;
  comuneId?: number | null;
  impresaId?: number | null;
  address?: string | null;
  photoUrl?: string | null;
  priority?: string | null;
  assignedTo?: number | null;
  assignedAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  resolvedBy?: number | null;
  resolutionNotes?: string | null;
  tccReward?: number | null;
  tccRewarded?: boolean | null;
  linkedSanctionId?: number | null;
  updatedAt?: Date | string | null;
}

export interface CivicReportsLayerProps {
  /** Array di segnalazioni civiche da visualizzare */
  civicReports: CivicReport[];
  /** Mostra marker colorati (default: true) */
  showMarkers?: boolean;
  /** Mostra heatmap zone di calore - DISABILITATO in questa versione */
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
const CIVIC_MARKER_COLORS: Record<string, string> = {
  buche: "#f97316", // 🟠 Arancione
  illuminazione: "#eab308", // 🟡 Giallo
  rifiuti: "#22c55e", // 🟢 Verde
  microcriminalita: "#ef4444", // 🔴 Rosso
  abusivismo: "#a855f7", // 🟣 Viola
  degrado: "#f97316", // 🟠 Arancione (alias)
  sicurezza: "#ef4444", // 🔴 Rosso (alias)
  altro: "#6b7280", // ⚪ Grigio default
};

/**
 * Etichette italiane per i tipi di segnalazione
 */
const CIVIC_TYPE_LABELS: Record<string, string> = {
  buche: "Buche Stradali",
  illuminazione: "Illuminazione",
  rifiuti: "Rifiuti Abbandonati",
  microcriminalita: "Microcriminalità",
  abusivismo: "Commercio Abusivo",
  degrado: "Degrado Urbano",
  sicurezza: "Sicurezza",
  altro: "Altra Segnalazione",
};

/**
 * Etichette italiane per gli stati
 */
const CIVIC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "In Attesa", color: "#f97316" },
  in_progress: { label: "In Lavorazione", color: "#3b82f6" },
  resolved: { label: "Risolta", color: "#22c55e" },
  rejected: { label: "Rifiutata", color: "#ef4444" },
};

// ============================================================
// FUNZIONI HELPER
// ============================================================

/**
 * Ottiene il colore del marker in base al tipo di segnalazione
 */
function getMarkerColor(type: string | null | undefined): string {
  if (!type) return CIVIC_MARKER_COLORS["altro"];
  const normalizedType = type.toLowerCase().trim();
  return CIVIC_MARKER_COLORS[normalizedType] || CIVIC_MARKER_COLORS["altro"];
}

/**
 * Ottiene l'etichetta del tipo di segnalazione
 */
function getTypeLabel(type: string | null | undefined): string {
  if (!type) return "Segnalazione";
  const normalizedType = type.toLowerCase().trim();
  return CIVIC_TYPE_LABELS[normalizedType] || type;
}

/**
 * Ottiene info sullo stato
 */
function getStatusInfo(status: string | null | undefined): {
  label: string;
  color: string;
} {
  if (!status) return { label: "Sconosciuto", color: "#6b7280" };
  const normalizedStatus = status.toLowerCase().trim();
  return (
    CIVIC_STATUS_LABELS[normalizedStatus] || { label: status, color: "#6b7280" }
  );
}

/**
 * Formatta la data in italiano
 */
function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "Data non disponibile";
  try {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateValue);
  }
}

/**
 * Converte coordinate in numero
 */
function parseCoord(coord: string | number | null | undefined): number | null {
  if (coord === null || coord === undefined) return null;
  const num = typeof coord === "number" ? coord : parseFloat(coord);
  if (isNaN(num) || num === 0) return null;
  return num;
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================

/**
 * CivicReportsLayer - Layer per segnalazioni civiche sulla mappa
 *
 * Versione semplificata: solo marker CircleMarker colorati
 *
 * Uso:
 * ```tsx
 * <MapContainer>
 *   <TileLayer ... />
 *   <CivicReportsLayer
 *     civicReports={reports}
 *     showMarkers={true}
 *   />
 * </MapContainer>
 * ```
 */
export function CivicReportsLayer({
  civicReports,
  showMarkers = true,
  showHeatmap = false, // Ignorato in questa versione
  onReportClick,
}: CivicReportsLayerProps) {
  // Filtra solo segnalazioni con coordinate valide
  const validReports = useMemo(() => {
    if (!civicReports || !Array.isArray(civicReports)) return [];

    return civicReports.filter(report => {
      if (!report) return false;
      const lat = parseCoord(report.lat);
      const lng = parseCoord(report.lng);
      return lat !== null && lng !== null;
    });
  }, [civicReports]);

  // Se non ci sono segnalazioni valide o markers disabilitati, non renderizzare nulla
  if (!showMarkers || validReports.length === 0) {
    return null;
  }

  return (
    <>
      {validReports.map(report => {
        const lat = parseCoord(report.lat)!;
        const lng = parseCoord(report.lng)!;
        const color = getMarkerColor(report.type);
        const typeLabel = getTypeLabel(report.type);
        const statusInfo = getStatusInfo(report.status);
        const isUrgent =
          report.priority === "URGENT" || report.priority === "HIGH";

        // Dimensione marker: più grande se urgente
        const radius = isUrgent ? 12 : 8;

        return (
          <CircleMarker
            key={`civic-${report.id}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: report.status === "resolved" ? 0.4 : 0.8,
              color: isUrgent ? "#ffffff" : color,
              weight: isUrgent ? 3 : 2,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => {
                if (onReportClick) {
                  onReportClick(report);
                }
              },
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                {/* Header con tipo e colore */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-sm text-gray-800">
                    {typeLabel}
                  </span>
                  {isUrgent && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      URGENTE
                    </span>
                  )}
                </div>

                {/* Descrizione */}
                {report.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                    {report.description}
                  </p>
                )}

                {/* Indirizzo */}
                {report.address && (
                  <p className="text-xs text-gray-500 mb-2">
                    📍 {report.address}
                  </p>
                )}

                {/* Status e Data */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <span className="text-gray-400">
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                {/* Foto se presente */}
                {report.photoUrl && (
                  <div className="mt-2">
                    <img
                      src={report.photoUrl}
                      alt="Foto segnalazione"
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default CivicReportsLayer;
