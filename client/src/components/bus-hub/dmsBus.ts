/**
 * DMS-BUS: Sistema di trasferimento dati tra editor (IndexedDB + fallback localStorage)
 * Convertito da vanilla JS a TypeScript per integrazione React
 *
 * v2.0 — Aggiunta gestione automatica riconnessione IndexedDB:
 * - Auto-reconnect su "Connection to Indexed Database server lost"
 * - Retry con backoff su operazioni fallite
 * - Fallback automatico su localStorage se IndexedDB non disponibile
 */

const DBNAME = "dms-bus";
const STORE = "kv";
const MAX_RETRIES = 2;

let db: IDBDatabase | null = null;
let dbFailed = false; // Se true, usa solo localStorage (IndexedDB non disponibile)

function resetDB(): void {
  if (db) {
    try { db.close(); } catch {}
  }
  db = null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbFailed) return reject(new Error("IndexedDB non disponibile"));
    if (db) return resolve(db);

    try {
      const request = indexedDB.open(DBNAME, 1);

      request.onupgradeneeded = () => {
        try {
          request.result.createObjectStore(STORE);
        } catch (e) {
          console.warn("[DMS-BUS] Errore creazione store:", e);
        }
      };

      request.onsuccess = () => {
        db = request.result;

        // Gestisci chiusura inaspettata della connessione (es. Safari standby)
        db.onclose = () => {
          console.warn("[DMS-BUS] IndexedDB connessione chiusa, reset per riconnessione");
          resetDB();
        };

        // Gestisci errori generici del database
        db.onerror = (event) => {
          console.warn("[DMS-BUS] IndexedDB errore:", event);
        };

        // Gestisci version change (altro tab ha cancellato/aggiornato il DB)
        db.onversionchange = () => {
          console.warn("[DMS-BUS] IndexedDB version change, chiudo connessione");
          resetDB();
        };

        resolve(db);
      };

      request.onerror = () => {
        console.warn("[DMS-BUS] IndexedDB apertura fallita:", request.error);
        resetDB();
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn("[DMS-BUS] IndexedDB bloccato da altra connessione");
        reject(new Error("IndexedDB blocked"));
      };
    } catch (e) {
      // indexedDB.open() può lanciare eccezione se IndexedDB non è disponibile
      console.warn("[DMS-BUS] IndexedDB non disponibile:", e);
      dbFailed = true;
      reject(e);
    }
  });
}

/**
 * Esegue un'operazione IndexedDB con retry automatico.
 * Se IndexedDB fallisce dopo i retry, usa il fallback localStorage.
 */
async function withRetry<T>(
  idbOperation: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (dbFailed) return fallback();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await idbOperation();
    } catch (e: any) {
      const msg = e?.message || e?.name || String(e);
      const isConnectionLost =
        msg.includes("connection") ||
        msg.includes("Connection") ||
        msg.includes("closed") ||
        msg.includes("not found") ||
        msg.includes("InvalidStateError") ||
        msg.includes("TransactionInactiveError");

      if (isConnectionLost && attempt < MAX_RETRIES) {
        console.warn(`[DMS-BUS] Tentativo ${attempt + 1}/${MAX_RETRIES} fallito, riconnessione...`);
        resetDB();
        // Breve pausa prima del retry
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        continue;
      }

      // Tutti i retry esauriti o errore non recuperabile
      console.warn("[DMS-BUS] IndexedDB fallito, uso localStorage:", msg);
      return fallback();
    }
  }

  return fallback();
}

async function put(key: string, val: any): Promise<void> {
  return withRetry(
    async () => {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
      });
    },
    () => {
      localStorage.setItem(
        key,
        typeof val === "string" ? val : JSON.stringify(val)
      );
    }
  );
}

async function get<T = any>(key: string): Promise<T | null> {
  return withRetry(
    async () => {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },
    () => {
      const v = localStorage.getItem(key);
      try {
        return v ? JSON.parse(v) : null;
      } catch {
        return v as any;
      }
    }
  );
}

export interface PngMeta {
  w: number;
  h: number;
  rotation: number;
}

export interface PlantPosition {
  center?: { lat: number; lng: number };
  imageSize?: { width: number; height: number };
  corners?: [number, number][];
  rotation?: number;
  scale?: number;
  opacity?: number;
}

export interface StallData {
  id: string;
  number: string;
  position: [number, number];
  orientation: number;
  kind?: string;
  dimensions?: string;
  status?: string;
}

export interface MarkerData {
  id: string;
  name: string;
  position: [number, number];
  icon?: string;
  description?: string;
}

export interface AreaData {
  id: string;
  name: string;
  vertices: [number, number][];
  color?: string;
  description?: string;
}

export interface MarketProject {
  name: string;
  createdAt: string;
  updatedAt: string;
  pngMeta?: PngMeta;
  plantPosition?: PlantPosition;
  stalls: StallData[];
  markers: MarkerData[];
  areas: AreaData[];
  center?: { lat: number; lng: number };
}

export const DMSBUS = {
  // Blob operations
  async putBlob(key: string, blob: Blob): Promise<void> {
    return put(key, blob);
  },

  async getBlob(key: string): Promise<Blob | null> {
    return get<Blob>(key);
  },

  // JSON operations
  async putJSON<T>(key: string, obj: T): Promise<void> {
    return put(key, JSON.stringify(obj));
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const v = await get<string>(key);
    return v ? JSON.parse(v) : null;
  },

  // Delete key
  async deleteKey(key: string): Promise<void> {
    return withRetry(
      async () => {
        const d = await openDB();
        return new Promise((resolve, reject) => {
          const tx = d.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      },
      () => {
        localStorage.removeItem(key);
      }
    );
  },

  // Clear all data
  async clear(): Promise<void> {
    try {
      resetDB();
      indexedDB.deleteDatabase(DBNAME);
      dbFailed = false; // Reset flag per permettere riconnessione futura
    } catch {}
    localStorage.clear();
  },

  // Get raw value
  async get<T = any>(key: string): Promise<T | null> {
    return get<T>(key);
  },

  // Specific getters/setters for market workflow
  async savePngTransparent(blob: Blob, meta: PngMeta): Promise<void> {
    await this.putBlob("png_transparent", blob);
    await this.putJSON("png_meta", meta);
  },

  async getPngTransparent(): Promise<{
    blob: Blob | null;
    meta: PngMeta | null;
  }> {
    const blob = await this.getBlob("png_transparent");
    const meta = await this.getJSON<PngMeta>("png_meta");
    return { blob, meta };
  },

  async savePngOriginal(blob: Blob): Promise<void> {
    await this.putBlob("png_original", blob);
  },

  async getPngOriginal(): Promise<Blob | null> {
    return this.getBlob("png_original");
  },

  async savePlantPosition(position: PlantPosition): Promise<void> {
    await this.putJSON("plant_position", position);
  },

  async getPlantPosition(): Promise<PlantPosition | null> {
    return this.getJSON<PlantPosition>("plant_position");
  },

  async saveMarketProject(project: MarketProject): Promise<void> {
    await this.putJSON("market_project", project);
  },

  async getMarketProject(): Promise<MarketProject | null> {
    return this.getJSON<MarketProject>("market_project");
  },

  async saveStalls(stalls: StallData[]): Promise<void> {
    await this.putJSON("stalls", stalls);
  },

  async getStalls(): Promise<StallData[] | null> {
    return this.getJSON<StallData[]>("stalls");
  },

  async saveMarkers(markers: MarkerData[]): Promise<void> {
    await this.putJSON("markers", markers);
  },

  async getMarkers(): Promise<MarkerData[] | null> {
    return this.getJSON<MarkerData[]>("markers");
  },

  async saveAreas(areas: AreaData[]): Promise<void> {
    await this.putJSON("areas", areas);
  },

  async getAreas(): Promise<AreaData[] | null> {
    return this.getJSON<AreaData[]>("areas");
  },

  // Export all data as JSON
  async exportProject(): Promise<MarketProject | null> {
    const pngMeta = await this.getJSON<PngMeta>("png_meta");
    const plantPosition = await this.getPlantPosition();
    const stalls = (await this.getStalls()) || [];
    const markers = (await this.getMarkers()) || [];
    const areas = (await this.getAreas()) || [];
    const existingProject = await this.getMarketProject();

    return {
      name: existingProject?.name || "Nuovo Mercato",
      createdAt: existingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pngMeta: pngMeta || undefined,
      plantPosition: plantPosition || undefined,
      stalls,
      markers,
      areas,
      center: plantPosition?.center,
    };
  },

  // Import project from JSON
  async importProject(project: MarketProject): Promise<void> {
    await this.saveMarketProject(project);
    if (project.pngMeta) {
      await this.putJSON("png_meta", project.pngMeta);
    }
    if (project.plantPosition) {
      await this.savePlantPosition(project.plantPosition);
    }
    if (project.stalls) {
      await this.saveStalls(project.stalls);
    }
    if (project.markers) {
      await this.saveMarkers(project.markers);
    }
    if (project.areas) {
      await this.saveAreas(project.areas);
    }
  },

  // Get all keys in the store
  async getAllKeys(): Promise<string[]> {
    return withRetry(
      async () => {
        const d = await openDB();
        return new Promise((resolve, reject) => {
          const tx = d.transaction(STORE, "readonly");
          const req = tx.objectStore(STORE).getAllKeys();
          req.onsuccess = () => resolve(req.result as string[]);
          req.onerror = () => reject(req.error);
        });
      },
      () => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      }
    );
  },
};

export default DMSBUS;
