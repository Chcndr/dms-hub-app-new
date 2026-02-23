/**
 * Utility di formattazione condivise — usare queste invece di funzioni inline.
 *
 * Sostituisce le 20+ copie di formatDate(), formatCurrency(), etc.
 * sparse nei componenti.
 */

/**
 * Formatta una data ISO in formato italiano (dd/mm/yyyy).
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('it-IT');
  } catch {
    return '-';
  }
}

/**
 * Formatta una data ISO in formato italiano con ora (dd/mm/yyyy HH:mm).
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Formatta un importo in Euro con locale italiano.
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatta un numero con locale italiano (separatore migliaia).
 */
export function formatNumber(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('it-IT').format(value);
}

/**
 * Tempo relativo ("2 ore fa", "3 giorni fa", etc.)
 */
export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'adesso';
    if (minutes < 60) return `${minutes} min fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ore fa`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} giorni fa`;
    const months = Math.floor(days / 30);
    return `${months} mesi fa`;
  } catch {
    return '-';
  }
}
