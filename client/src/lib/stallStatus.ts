/**
 * Utilità per gestione stati posteggi
 *
 * Il DB Drizzle usa stati in inglese: free, occupied, reserved, booked, maintenance
 * Il frontend usa stati in italiano: libero, occupato, riservato
 * Questa utility normalizza entrambi i formati.
 */

export type StallStatus = "libero" | "occupato" | "riservato";

/**
 * Mappa di normalizzazione: accetta sia inglese che italiano
 * e restituisce sempre lo stato italiano standard
 */
const STATUS_NORMALIZE_MAP: Record<string, StallStatus> = {
  // Italiano (frontend)
  libero: "libero",
  occupato: "occupato",
  riservato: "riservato",
  in_assegnazione: "riservato",
  // Inglese (DB Drizzle)
  free: "libero",
  occupied: "occupato",
  reserved: "riservato",
  booked: "riservato",
  maintenance: "libero",
};

/**
 * Mappa Italian→English per inviare stati al backend DB
 */
const STATUS_IT_TO_EN: Record<string, string> = {
  libero: "free",
  occupato: "occupied",
  riservato: "reserved",
  free: "free",
  occupied: "occupied",
  reserved: "reserved",
  booked: "booked",
  maintenance: "maintenance",
};

/**
 * Normalizza uno stato posteggio (inglese o italiano) al formato italiano standard.
 * Gestisce null/undefined in modo sicuro.
 */
export function normalizeStallStatus(
  status: string | undefined | null
): StallStatus {
  if (!status) return "libero";
  return STATUS_NORMALIZE_MAP[status.toLowerCase().trim()] || "libero";
}

/**
 * Converte stato italiano in formato inglese per il backend DB/tRPC.
 */
export function stallStatusToEnglish(status: string): string {
  return STATUS_IT_TO_EN[status.toLowerCase().trim()] || "free";
}

export interface StallStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  mapFillColor: string;
}

/**
 * Configurazione completa degli stati posteggi
 */
export const STALL_STATUS_CONFIG: Record<StallStatus, StallStatusConfig> = {
  libero: {
    label: "LIBERO",
    color: "#10b981",
    bgColor: "bg-[#10b981]/20",
    borderColor: "border-[#10b981]/30",
    mapFillColor: "#10b981",
  },
  occupato: {
    label: "OCCUPATO",
    color: "#ef4444",
    bgColor: "bg-[#ef4444]/20",
    borderColor: "border-[#ef4444]/30",
    mapFillColor: "#ef4444",
  },
  riservato: {
    label: "IN ASSEGNAZIONE",
    color: "#f59e0b",
    bgColor: "bg-[#f59e0b]/20",
    borderColor: "border-[#f59e0b]/30",
    mapFillColor: "#f59e0b",
  },
};

/**
 * Ottiene l'etichetta italiana per uno stato
 */
export function getStallStatusLabel(status: string): string {
  return (
    STALL_STATUS_CONFIG[normalizeStallStatus(status)]?.label ||
    status.toUpperCase()
  );
}

/**
 * Ottiene il colore per uno stato (per badge, testo, ecc.)
 */
export function getStallStatusColor(status: string): string {
  return STALL_STATUS_CONFIG[normalizeStallStatus(status)]?.color || "#14b8a6";
}

/**
 * Ottiene le classi CSS Tailwind per un badge di stato
 */
export function getStallStatusClasses(status: string): string {
  const config = STALL_STATUS_CONFIG[normalizeStallStatus(status)];

  if (!config) {
    return "bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30";
  }

  return `${config.bgColor} text-[${config.color}] ${config.borderColor}`;
}

/**
 * Ottiene il colore di riempimento per la mappa
 */
export function getStallMapFillColor(status: string): string {
  return (
    STALL_STATUS_CONFIG[normalizeStallStatus(status)]?.mapFillColor || "#14b8a6"
  );
}

/**
 * Lista di tutti gli stati disponibili per select/dropdown
 */
export const STALL_STATUS_OPTIONS: Array<{
  value: StallStatus;
  label: string;
}> = [
  { value: "libero", label: "LIBERO" },
  { value: "occupato", label: "OCCUPATO" },
  { value: "riservato", label: "IN ASSEGNAZIONE" },
];
