/**
 * Calcola la distanza geodetica tra due punti (lat/lng) in metri
 * Usa la formula dell'Haversine per una buona approssimazione su distanze brevi
 */
export function calculateGeodesicDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raggio della Terra in metri
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radianti
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metri
}

/**
 * Calcola le dimensioni (larghezza e altezza) di un poligono rettangolare
 * Assumes the polygon is roughly rectangular and coordinates are [lat, lng]
 */
export function calculatePolygonDimensions(coordinates: [number, number][]): {
  width: number;
  height: number;
  area: number;
} {
  if (!coordinates || coordinates.length < 3) {
    return { width: 0, height: 0, area: 0 };
  }

  // Trova i lati del poligono
  const sides: number[] = [];
  for (let i = 0; i < coordinates.length; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % coordinates.length];
    const dist = calculateGeodesicDistance(p1[0], p1[1], p2[0], p2[1]);
    sides.push(dist);
  }

  // Ordina i lati per trovare larghezza e altezza (assumendo rettangolo)
  // I due lati più corti sono la larghezza, i due più lunghi l'altezza
  sides.sort((a, b) => a - b);

  // Prendi la media dei lati simili per ridurre errori
  // Se è un rettangolo perfetto: sides[0]==sides[1] (width), sides[2]==sides[3] (height)
  // Se è un triangolo o altro, questa è un'approssimazione

  let width = 0;
  let height = 0;

  if (sides.length >= 4) {
    width = (sides[0] + sides[1]) / 2;
    height = (sides[2] + sides[3]) / 2;
  } else if (sides.length === 3) {
    // Triangolo
    width = sides[0];
    height = sides[1]; // Approssimazione
  }

  const area = width * height;

  return {
    width: parseFloat(width.toFixed(2)),
    height: parseFloat(height.toFixed(2)),
    area: parseFloat(area.toFixed(2)),
  };
}
