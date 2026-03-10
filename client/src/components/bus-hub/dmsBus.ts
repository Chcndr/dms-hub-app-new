/**
 * DMS-BUS: Sistema di trasferimento dati tra editor (IndexedDB + fallback localStorage)
 * Convertito da vanilla JS a TypeScript per integrazione React
 *
 * v3.0 — Riconnessione robusta per Safari:
 * - Auto-reconnect con backoff esponenziale (1s, 2s, 4s, max 30s)
 * - Fallback silenzioso su localStorage dopo 3 tentativi falliti
 * - Rate-limit sui log per evitare flood nel Guardian
 * - Gestione "Connection to Indexed Database server lost" (Safari background tab)
 */

const DBNAME = "dms-bus";
const STORE = "kv";
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

let db: IDBDatabase | null = null;
let dbFailed = false;
let reconnecting = false;
let reconnectPromise: Promise<IDBDatabase | null> | null = null;
let consecutiveFailures = 0;

// Rate-limit logging: max 1 warning per tipo ogni 60 secondi
const lastLogTime: Record<string, number> = {};
function rateLimitedWarn(key: string, ...args: unknown[]): void {
  const now = Date.now();
  if (now - (lastLogTime[key] || 0) < 60_000) return;
  lastLogTime[key] = now;
  console.warn(...args);
}

function resetDB(): void {
  if (db) {
    try { db.close(); } catch {}
  }
  db = null;
}

function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
}

function scheduleReconnect(): void {
  if (reconnecting || dbFailed) return;
  reconnecting = true;
  reconnectPromise = (async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const delay = backoffDelay(attempt);
      await new Promise(r => setTimeout(r, delay));
      try {
        const result = await openDBInternal();
        consecutiveFailures = 0;
        reconnecting = false;
        reconnectPromise = null;
        rateLimitedWarn("reconnect-ok", "[DMS-BUS] IndexedDB riconnesso dopo", attempt + 1, "tentativi");
        return result;
      } catch {
        // continue to next attempt
      }
    }
    // All retries exhausted — switch to silent localStorage fallback
    dbFailed = true;
    reconnecting = false;
    reconnectPromise = null;
    rateLimitedWarn("reconnect-fail", "[DMS-BUS] IndexedDB non recuperabile dopo", MAX_RETRIES, "tentativi, fallback localStorage");
    return null;
  })();
}

function openDBInternal(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DBNAME, 1);

      request.onupgradeneeded = () => {
        try {
          request.result.createObjectStore(STORE);
        } catch (e) {
          rateLimitedWarn("create-store", "[DMS-BUS] Errore creazione store:", e);
        }
      };

      request.onsuccess = () => {
        db = request.result;

        db.onclose = () => {
          rateLimitedWarn("onclose", "[DMS-BUS] IndexedDB connessione chiusa, avvio riconnessione");
          resetDB();
          scheduleReconnect();
        };

        db.onerror = () => {
          rateLimitedWarn("onerror", "[DMS-BUS] IndexedDB errore sulla connessione");
        };

        db.onversionchange = () => {
          rateLimitedWarn("versionchange", "[DMS-BUS] IndexedDB version change, chiudo connessione");
          resetDB();
        };

        resolve(db);
      };

      request.onerror = () => {
        rateLimitedWarn("open-error", "[DMS-BUS] IndexedDB apertura fallita:", request.error);
        resetDB();
        reject(request.error);
      };

      request.onblocked = () => {
        rateLimitedWarn("blocked", "[DMS-BUS] IndexedDB bloccato da altra connessione");
        reject(new Error("IndexedDB blocked"));
      };
    } catch (e) {
      rateLimitedWarn("not-available", "[DMS-BUS] IndexedDB non disponibile:", e);
      dbFailed = true;
      reject(e);
    }
  });
}

function openDB(): Promise<IDBDatabase> {
  if (dbFailed) return Promise.reject(new Error("IndexedDB non disponibile"));
  if (db) return Promise.resolve(db);
  if (reconnecting && reconnectPromise) {
    return reconnectPromise.then(result => {
      if (result) return result;
      throw new Error("IndexedDB non disponibile");
    });
  }
  return openDBInternal();
}

/**
 * Esegue un'operazione IndexedDB con retry automatico e backoff esponenziale.
 * Se IndexedDB fallisce dopo i retry, fallback silenzioso su localStorage.
 */
async function withRetry<T>(
  idbOperation: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (dbFailed) return fallback();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await idbOperation();
      consecutiveFailures = 0;
      return result;
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
        rateLimitedWarn("retry", `[DMS-BUS] Tentativo ${attempt + 1}/${MAX_RETRIES} fallito, riconnessione...`);
        resetDB();
        await new Promise(r => setTimeout(r, backoffDelay(attempt)));
        continue;
      }

      consecutiveFailures++;
      if (consecutiveFailures >= MAX_RETRIES) {
        dbFailed = true;
        rateLimitedWarn("permanent-fail", "[DMS-BUS] IndexedDB fallito permanentemente, uso localStorage");
      } else {
        rateLimitedWarn("fallback", "[DMS-BUS] IndexedDB fallito, uso localStorage");
      }
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
