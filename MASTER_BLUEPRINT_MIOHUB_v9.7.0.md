# 🏗️ MIO HUB - BLUEPRINT UNIFICATO DEL SISTEMA

> **Versione:** 9.7.0 (Fix Persistenza Dati Safari/iPad + Allineamento Completo)
> **Data:** 07 Marzo 2026
> 
> ---
> ### CHANGELOG v9.7.0 (07 Mar 2026)
> **🔧 FIX CRITICO — PERSISTENZA DATI SLOT EDITOR SU SAFARI/IPAD**
> 
> **Stato deploy:**
> | Sistema | Commit | Stato |
> |---|---|---|
> | GitHub `mihub-backend-rest` master | `e39a8ba` | ✅ Allineato |
> | Hetzner backend (157.90.29.66:3000) | `e39a8ba` | ✅ Online, PM2 running |
> | GitHub `dms-hub-app-new` master | `910c7c6` | ✅ Allineato |
> | Vercel frontend | `910c7c6` | ✅ HTTP 200, auto-deploy |
> | Neon DB (mercato La Piazzola) | `market_id=14` | ✅ Dati corretti, `comune_id=6` |
> 
> **Problema:**
> Su Safari/iPad, il meccanismo di sicurezza ITP (Intelligent Tracking Prevention) cancella tutti i dati (localStorage, IndexedDB) degli iframe cross-origin (Vercel → Hetzner) dopo un breve periodo o alla navigazione. Questo causava la perdita di tutti i dati non salvati nello Slot Editor (posteggi, posizione pianta).
> 
> **Soluzione Architetturale: `postMessage` Bridge**
> È stato implementato un bridge di comunicazione bidirezionale tra l'iframe dello Slot Editor (Hetzner) e la pagina parent (Vercel) per persistere i dati nel `localStorage` del dominio principale (first-party, non soggetto a ITP).
> 
> **Flusso di salvataggio:**
> 1. **Slot Editor (iframe):** Ogni volta che `DMSBUS.putJSON()` o `DMSBUS.putBlob()` viene chiamato, il bridge invia una copia dei dati (`{type: 'DMS_BRIDGE_SAVE', payload: {key, value}}`) al parent Vercel tramite `window.parent.postMessage()`.
> 2. **BusHubEditor (parent):** Riceve il messaggio e salva la coppia chiave/valore nel proprio `localStorage` (`dms_bridge` e `dms_bridge_blobs`).
> 
> **Flusso di ripristino:**
> 1. **Slot Editor (iframe):** Al caricamento, invia un messaggio `DMS_BRIDGE_REQUEST` al parent.
> 2. **BusHubEditor (parent):** Riceve la richiesta e risponde con `DMS_BRIDGE_RESTORE`, inviando tutti i dati salvati nel suo `localStorage`.
> 3. **Slot Editor (iframe):** Riceve i dati e li ripristina nel proprio `localStorage` e IndexedDB (tramite DMSBUS), scatenando l'evento `dms-bridge-restored` per notificare all'applicazione che i dati sono pronti.
> 
> **Modifiche Backend (mihub-backend-rest — 5 commit):**
> - `e39a8ba` — **Fix Pianta Trasparente:** Aggiunto salvataggio di `plant_marker_position` nel DMSBUS e listener `dms-bridge-restored` per ripristinare la posizione della pianta su Safari.
> - `0d11381` — **Fix Geometria Posteggi:** Lo `stallsGeoJSON` ora viene creato come `Polygon` (con i 4 corner) invece che `Point`. La route `import-market` ora salva `geometry_geojson`, `rotation` e `dimensions`.
> - `d7a359d` — **Fix Salvataggio Mercato:** Il bottone "Salva nel Database" ora chiama anche `/api/gis/import-market`, creando correttamente il record in `markets`, `stalls` e `market_geometry`.
> - `2539b8b` — **Bridge postMessage (iframe):** Aggiunto wrapper a `dms-bus.js` che invia i dati al parent Vercel.
> - `6a0664a` — **Fix DMSBUS:** Reso più robusto il fallback per Safari/iPad.
> 
> **Modifiche Frontend (dms-hub-app-new — 1 commit):**
> - `910c7c6` — **Bridge postMessage (parent):** Aggiunto listener in `BusHubEditor.tsx` per ricevere e salvare i dati dall'iframe e per rispondere alle richieste di ripristino.
> 
> **Modifiche Database (Neon):**
> - **Mercato La Piazzola (ID 14):** Assegnato `comune_id = 6` (Bologna).
> - **Stalls Mercato La Piazzola:** Verificato che tutti i 17 posteggi abbiano `geometry_geojson` di tipo Polygon.
> - **Hub La Piazzola (ID 108):** Cancellato record duplicato dalla tabella `hub_locations`.
> 
> ### Sezione Blueprint Aggiornata: Storage Dati Slot Editor
> 
> | Tipo | Storage Primario (Safari) | Storage Secondario (Altri Browser) | Chiave | Note |
> |---|---|---|---|---|
> | Autosave completo | `localStorage` (Vercel) | `localStorage` (Hetzner iframe) | `dms_bridge` | Bridge postMessage |
> | Dati HUB | `localStorage` (Vercel) | `localStorage` (Hetzner iframe) | `dms_bridge` | Bridge postMessage |
> | Posizione pianta | `localStorage` (Vercel) | `DMSBUS` (IndexedDB iframe) | `plant_marker_position` | Bridge postMessage |
> | Posteggi | `localStorage` (Vercel) | `DMSBUS` (IndexedDB iframe) | `stalls_geojson` | Bridge postMessage |
> | PNG Pianta | `localStorage` (Vercel) | `DMSBUS` (IndexedDB iframe) | `png_transparent` | Bridge postMessage (base64) |

