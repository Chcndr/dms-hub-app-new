/**
 * SpuntaNotifier — Componente globale per notifiche spunta real-time.
 * 
 * Si monta a livello App.tsx e resta sempre attivo.
 * Quando l'impresa è in coda spunta, si connette alla SSE e mostra
 * overlay full-screen giallo "È IL TUO TURNO" in qualsiasi pagina.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, List, MapPin, CheckCircle, X, ArrowLeft } from "lucide-react";
import { MarketMapComponent } from "./MarketMapComponent";

const MIHUB_API_BASE_URL = "https://api.mio-hub.me";

interface SpuntaState {
  stato: 'IDLE' | 'IN_ATTESA' | 'TURNO_ATTIVO' | 'LISTA_POSTEGGI' | 'ASSEGNATO' | 'FINE_SPUNTA';
  impresa_nome?: string;
  posizione?: number;
  totale_in_coda?: number;
  posteggi_disponibili?: number;
  coda_id?: number;
  scadenza?: string;
  stall_number?: string;
  importo?: number;
  saldo_residuo?: number;
  motivo_fine?: string;
  session_id?: number;
}

interface PosteggioLibero {
  stall_id: number;
  stall_number: string;
  area_mq: number;
  canone_giornaliero: number;
  lat?: number;
  lng?: number;
}

export default function SpuntaNotifier() {
  const [impresaId, setImpresaId] = useState<number | null>(null);
  const [spunta, setSpunta] = useState<SpuntaState>({ stato: 'IDLE' });
  const [timerSecondi, setTimerSecondi] = useState(0);
  const [posteggiLiberi, setPosteggiLiberi] = useState<PosteggioLibero[]>([]);
  const [loadingScelta, setLoadingScelta] = useState(false);
  const [marketIdForMap, setMarketIdForMap] = useState<number | null>(null);
  const [mappaAperta, setMappaAperta] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [stallsData, setStallsData] = useState<any[]>([]);
  const [selectedStallForMap, setSelectedStallForMap] = useState<string | null>(null);
  const [selectedStallCenter, setSelectedStallCenter] = useState<[number, number] | null>(null);
  const [viewTrigger, setViewTrigger] = useState(0);
  const sseRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spuntaRef = useRef(spunta);
  const scadenzaChiamataRef = useRef(false); // flag per evitare doppie chiamate scadenza

  // Tieni spuntaRef sincronizzato
  useEffect(() => { spuntaRef.current = spunta; }, [spunta]);

  // Risolvi impresaId da localStorage
  useEffect(() => {
    let id: number | null = null;
    try {
      const fbStr = localStorage.getItem("miohub_firebase_user");
      if (fbStr) {
        const fb = JSON.parse(fbStr);
        if (fb.impresaId) id = fb.impresaId;
      }
    } catch { /* ignore */ }
    if (!id) {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.impresa_id) id = user.impresa_id;
        }
      } catch { /* ignore */ }
    }
    setImpresaId(id);
  }, []);

  // Funzione per notificare il backend della scadenza del turno
  const notificaScadenzaTurno = useCallback(async () => {
    if (scadenzaChiamataRef.current) return; // già chiamata
    scadenzaChiamataRef.current = true;
    const currentState = spuntaRef.current;
    if (!impresaId || !currentState.session_id) return;
    try {
      await fetch(`${MIHUB_API_BASE_URL}/api/presenze-live/spunta/scadenza-turno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impresa_id: impresaId,
          session_id: currentState.session_id,
        }),
      });
      console.log('[SpuntaNotifier] Scadenza turno notificata al backend');
    } catch (err) {
      console.error('[SpuntaNotifier] Errore notifica scadenza:', err);
    }
  }, [impresaId]);

  // Polling: controlla se l'impresa è in coda spunta
  useEffect(() => {
    if (!impresaId) return;

    const checkCoda = async () => {
      const currentStato = spuntaRef.current.stato;
      // NON fare polling se siamo in uno stato terminale o attivo
      if (currentStato === 'LISTA_POSTEGGI' || currentStato === 'ASSEGNATO' || currentStato === 'FINE_SPUNTA') return;

      try {
        const res = await fetch(`${MIHUB_API_BASE_URL}/api/presenze-live/spunta/stato-impresa/${impresaId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.in_coda && data.session_id && currentStato === 'IDLE') {
            // L'impresa è in coda: connetti SSE
            connettiSSE(data.session_id);
            setSpunta({
              stato: 'IN_ATTESA',
              posizione: data.posizione,
              totale_in_coda: data.totale_in_coda,
              posteggi_disponibili: data.posteggi_disponibili,
              session_id: data.session_id,
            });
          } else if (data.turno_attivo && data.session_id && currentStato === 'IDLE') {
            // È già il nostro turno (solo da IDLE, mai sovrascrivere TURNO_ATTIVO)
            scadenzaChiamataRef.current = false; // reset flag scadenza per nuovo turno
            connettiSSE(data.session_id);
            setSpunta({
              stato: 'TURNO_ATTIVO',
              impresa_nome: data.impresa_nome,
              posizione: data.posizione,
              posteggi_disponibili: data.posteggi_disponibili,
              totale_in_coda: data.totale_in_coda,
              session_id: data.session_id,
              coda_id: data.coda_id,
            });
            setTimerSecondi(data.secondi_rimanenti || 120);
          } else if (!data.in_coda && !data.turno_attivo) {
            // Non siamo più in coda e non è il nostro turno
            if (currentStato === 'IN_ATTESA' || currentStato === 'TURNO_ATTIVO') {
              setSpunta({
                stato: 'FINE_SPUNTA',
                motivo_fine: 'La spunta è terminata.',
              });
              if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
            }
          }
        }
      } catch { /* ignore */ }
    };

    checkCoda();
    const interval = setInterval(checkCoda, 10000);
    return () => clearInterval(interval);
  }, [impresaId]);

  // SSE Connection
  const connettiSSE = useCallback((sessionId: number) => {
    if (sseRef.current) sseRef.current.close();
    const url = `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/stream/${sessionId}`;
    const es = new EventSource(url);
    sseRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'SPUNTA_INIZIATA') {
          if (data.primo_turno?.impresa_id === impresaId) {
            scadenzaChiamataRef.current = false;
            setSpunta(prev => ({
              ...prev,
              stato: 'TURNO_ATTIVO',
              impresa_nome: data.primo_turno.impresa_nome,
              posizione: 1,
              posteggi_disponibili: data.posteggi_disponibili,
              totale_in_coda: data.spuntisti_in_coda,
              session_id: sessionId,
            }));
            setTimerSecondi(120);
          }
        } else if (data.type === 'PROSSIMO_TURNO') {
          if (data.impresa_id === impresaId) {
            setSpunta(prev => {
              if (prev.stato === 'TURNO_ATTIVO' && prev.coda_id === data.coda_id) {
                return prev; // Stesso turno, non resettare
              }
              scadenzaChiamataRef.current = false;
              return {
                ...prev,
                stato: 'TURNO_ATTIVO',
                impresa_nome: data.impresa_nome,
                posizione: data.posizione,
                coda_id: data.coda_id,
                posteggi_disponibili: data.posteggi_disponibili,
                totale_in_coda: data.totale_in_coda,
                session_id: sessionId,
              };
            });
            setTimerSecondi(prev => {
              if (prev > 0) return prev;
              return data.timeout_secondi || 120;
            });
          } else {
            setSpunta(prev => {
              if (prev.stato === 'TURNO_ATTIVO' || prev.stato === 'LISTA_POSTEGGI') return prev;
              return {
                ...prev,
                stato: 'IN_ATTESA',
                posteggi_disponibili: data.posteggi_disponibili,
                totale_in_coda: data.totale_in_coda,
              };
            });
          }
        } else if (data.type === 'POSTEGGIO_ASSEGNATO') {
          if (data.impresa_id === impresaId) {
            setSpunta(prev => ({
              ...prev,
              stato: 'ASSEGNATO',
              stall_number: data.stall_number,
              importo: data.importo_addebitato || data.importo,
              saldo_residuo: data.wallet_saldo_residuo || data.saldo_residuo,
            }));
          }
        } else if (data.type === 'SPUNTA_TERMINATA') {
          setSpunta({
            stato: 'FINE_SPUNTA',
            motivo_fine: data.motivo === 'FINE_POSTEGGI'
              ? 'Tutti i posteggi alla spunta sono stati assegnati'
              : 'Tutti i partecipanti alla spunta sono stati chiamati',
            posteggi_disponibili: data.posteggi_rimanenti,
          });
          es.close();
          sseRef.current = null;
        }
      } catch (err) { console.error('SpuntaNotifier SSE parse error:', err); }
    };

    es.onerror = () => {
      console.log('SpuntaNotifier SSE: connessione persa');
    };
  }, [impresaId]);

  // Timer countdown — quando scade, chiama il backend per chiudere il turno
  useEffect(() => {
    if (spunta.stato !== 'TURNO_ATTIVO' && spunta.stato !== 'LISTA_POSTEGGI') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerSecondi <= 0) return;

    timerRef.current = setInterval(() => {
      setTimerSecondi(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Chiama il backend per chiudere il turno e attivare il prossimo
          notificaScadenzaTurno();
          // NON chiudere SSE! Il backend invierà PROSSIMO_TURNO o SPUNTA_TERMINATA
          // Torna in attesa — la SSE aggiornerà lo stato quando il prossimo viene attivato
          setSpunta(s => ({ ...s, stato: 'IN_ATTESA', motivo_fine: undefined }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [spunta.stato, timerSecondi > 0]);

  // Carica posteggi alla spunta (riservati)
  const caricaPosteggiLiberi = async () => {
    if (!spunta.session_id) return;
    try {
      const res = await fetch(`${MIHUB_API_BASE_URL}/api/presenze-live/spunta/posteggi-liberi/${spunta.session_id}`);
      if (res.ok) {
        const data = await res.json();
        // Il backend restituisce posteggi_liberi con campi: id, number, area_mq, daily_fee, lat, lng
        const mapped: PosteggioLibero[] = (data.posteggi_liberi || []).map((p: any) => ({
          stall_id: p.id,
          stall_number: p.number,
          area_mq: p.area_mq || 0,
          canone_giornaliero: p.daily_fee || 0,
          lat: p.lat,
          lng: p.lng,
        }));
        setPosteggiLiberi(mapped);
        // Salva market_id per la mappa interna
        if (data.market_id) setMarketIdForMap(data.market_id);
        setSpunta(prev => ({ ...prev, stato: 'LISTA_POSTEGGI' }));
      }
    } catch { /* ignore */ }
  };

  // Apri mappa interna centrata su un posteggio
  const apriMappaPosteggio = async (stallNumber: string) => {
    if (!marketIdForMap) return;
    setSelectedStallForMap(stallNumber);
    setMappaAperta(true);
    // Carica dati GIS se non già caricati
    if (!mapData) {
      try {
        const [gisRes, stallsRes] = await Promise.all([
          fetch(`${MIHUB_API_BASE_URL}/api/gis/market-map/${marketIdForMap}`),
          fetch(`${MIHUB_API_BASE_URL}/api/markets/${marketIdForMap}/stalls`),
        ]);
        if (gisRes.ok) {
          const gisData = await gisRes.json();
          if (gisData.success) setMapData(gisData.data);
        }
        if (stallsRes.ok) {
          const sData = await stallsRes.json();
          setStallsData(sData.success ? sData.data : (Array.isArray(sData) ? sData : []));
        }
      } catch { /* ignore */ }
    }
    // Centra sul posteggio dopo un breve delay per permettere il render
    setTimeout(() => {
      // Cerca coordinate del posteggio nel GIS
      if (mapData) {
        const feature = mapData.stalls_geojson?.features?.find(
          (f: any) => String(f.properties.number) === String(stallNumber)
        );
        if (feature && feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0] as [number, number][];
          const lats = coords.map(c => c[1]);
          const lngs = coords.map(c => c[0]);
          const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
          const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
          setSelectedStallCenter([centerLat, centerLng]);
          setViewTrigger(prev => prev + 1);
        }
      }
    }, 300);
  };

  // Effetto per centrare quando mapData viene caricato
  useEffect(() => {
    if (mapData && selectedStallForMap && mappaAperta) {
      const feature = mapData.stalls_geojson?.features?.find(
        (f: any) => String(f.properties.number) === String(selectedStallForMap)
      );
      if (feature && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0] as [number, number][];
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        setSelectedStallCenter([centerLat, centerLng]);
        setViewTrigger(prev => prev + 1);
      }
    }
  }, [mapData, selectedStallForMap, mappaAperta]);

  // Scegli posteggio
  const scegliPosteggio = async (posteggio: PosteggioLibero) => {
    if (!impresaId || !spunta.session_id) return;
    setLoadingScelta(true);
    try {
      const res = await fetch(`${MIHUB_API_BASE_URL}/api/presenze-live/spunta/scegli-posteggio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: spunta.session_id,
          impresa_id: impresaId,
          stall_id: posteggio.stall_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpunta({
          stato: 'ASSEGNATO',
          stall_number: posteggio.stall_number,
          importo: data.importo_addebitato,
          saldo_residuo: data.wallet_saldo_residuo,
        });
      } else {
        alert(data.messaggio || 'Errore nella scelta del posteggio');
      }
    } catch {
      alert('Errore di rete. Riprova.');
    }
    setLoadingScelta(false);
  };

  // Chiudi overlay
  const chiudiOverlay = () => {
    setSpunta({ stato: 'IDLE' });
    setPosteggiLiberi([]);
    setTimerSecondi(0);
    scadenzaChiamataRef.current = false;
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Salva in localStorage che la spunta è stata gestita
    localStorage.setItem('spunta_gestita', Date.now().toString());
  };

  // Non mostrare nulla se stato IDLE o IN_ATTESA (l'attesa si vede nella PresenzePage)
  if (spunta.stato === 'IDLE' || spunta.stato === 'IN_ATTESA') return null;

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── OVERLAY: È IL TUO TURNO ───────────────────────────────────────────────
  if (spunta.stato === 'TURNO_ATTIVO') {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-yellow-500 to-amber-600 p-6">
        {/* Pulsante X per chiudere forzatamente */}
        <button
          onClick={chiudiOverlay}
          className="absolute top-4 right-4 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          title="Chiudi"
        >
          <X className="w-6 h-6 text-white/70" />
        </button>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <Clock className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 uppercase">
            {spunta.impresa_nome || 'IMPRESA'}
          </h1>
          <h2 className="text-3xl font-black text-white mb-6">
            È IL TUO TURNO!
          </h2>
          <div className="text-6xl font-mono font-bold text-white mb-4">
            {formatTimer(timerSecondi)}
          </div>
          <p className="text-white/80 text-lg mb-2">
            Posteggi alla spunta: {spunta.posteggi_disponibili || 0}
          </p>
          <button
            onClick={caricaPosteggiLiberi}
            className="mt-6 px-8 py-4 bg-white text-amber-700 font-bold text-xl rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center gap-3 mx-auto"
          >
            <List className="w-6 h-6" />
            VISUALIZZA POSTEGGI ALLA SPUNTA
          </button>
        </div>
      </div>
    );
  }

  // ─── OVERLAY: LISTA POSTEGGI ALLA SPUNTA ───────────────────────────────────
  if (spunta.stato === 'LISTA_POSTEGGI') {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-900">
        {/* Header con timer */}
        <div className="bg-amber-600 p-4 flex items-center justify-between">
          <button
            onClick={() => setSpunta(prev => ({ ...prev, stato: 'TURNO_ATTIVO' }))}
            className="text-white font-bold text-sm px-3 py-1 bg-white/20 rounded-lg"
          >
            INDIETRO
          </button>
          <h2 className="text-white font-bold text-lg">SCEGLI POSTEGGIO</h2>
          <div className="text-white font-mono text-2xl font-bold">
            {formatTimer(timerSecondi)}
          </div>
        </div>
        {/* Lista posteggi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {posteggiLiberi.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-400 text-lg mb-4">Nessun posteggio alla spunta disponibile al momento.</p>
              <button
                onClick={caricaPosteggiLiberi}
                className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                RICARICA
              </button>
            </div>
          ) : (
            posteggiLiberi.map((p) => (
              <div key={p.stall_id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                {/* Icona mappa grande al posto del quadratino verde */}
                <button
                  className="w-14 h-14 bg-teal-700/50 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  onClick={() => apriMappaPosteggio(p.stall_number)}
                  title={`Vedi posteggio ${p.stall_number} sulla mappa`}
                >
                  <MapPin className="w-8 h-8 text-teal-400" />
                </button>
                {/* Info posteggio */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">Posteggio {p.stall_number}</p>
                  <p className="text-gray-400 text-sm">{p.area_mq} mq — &euro;{p.canone_giornaliero.toFixed(2)}/giorno</p>
                </div>
                {/* Pulsante SCEGLI */}
                <button
                  onClick={() => scegliPosteggio(p)}
                  disabled={loadingScelta}
                  className="px-5 py-3 bg-teal-500 text-white font-bold text-base rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
                >
                  {loadingScelta ? '...' : 'SCEGLI'}
                </button>
              </div>
            ))
          )}
        </div>
        {/* MODALE MAPPA INTERNA */}
        {mappaAperta && (
          <div className="fixed inset-0 z-[999999] flex flex-col bg-gray-900">
            <div className="bg-teal-700 p-3 flex items-center gap-3">
              <button
                onClick={() => { setMappaAperta(false); setSelectedStallForMap(null); setSelectedStallCenter(null); }}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h2 className="text-white font-bold text-lg flex-1">Mappa — Posteggio {selectedStallForMap}</h2>
              <div className="text-white font-mono text-xl font-bold">
                {formatTimer(timerSecondi)}
              </div>
            </div>
            <div className="flex-1 relative">
              {mapData ? (
                <MarketMapComponent
                  mapData={mapData}
                  stallsData={stallsData}
                  selectedStallNumber={selectedStallForMap || undefined}
                  selectedStallCenter={selectedStallCenter || undefined}
                  viewMode="mercato"
                  viewTrigger={viewTrigger}
                  isMarketView={true}
                  isSpuntaMode={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 animate-pulse">Caricamento mappa...</p>
                </div>
              )}
            </div>
            <div className="bg-gray-800 p-3 flex gap-2">
              <button
                onClick={() => { setMappaAperta(false); setSelectedStallForMap(null); setSelectedStallCenter(null); }}
                className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl"
              >
                TORNA ALLA LISTA
              </button>
              <button
                onClick={() => {
                  const p = posteggiLiberi.find(pl => pl.stall_number === selectedStallForMap);
                  if (p) { setMappaAperta(false); scegliPosteggio(p); }
                }}
                disabled={loadingScelta}
                className="flex-1 py-3 bg-teal-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                SCEGLI QUESTO POSTEGGIO
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── OVERLAY: POSTEGGIO ASSEGNATO ───────────────────────────────────────────
  if (spunta.stato === 'ASSEGNATO') {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-green-500 to-emerald-600 p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 uppercase">
            POSTEGGIO ASSEGNATO!
          </h1>
          <p className="text-white text-2xl font-bold mb-2">
            Posteggio {spunta.stall_number}
          </p>
          {spunta.importo !== undefined && (
            <p className="text-white/80 text-lg mb-1">
              Importo addebitato: &euro;{spunta.importo.toFixed(2)}
            </p>
          )}
          {spunta.saldo_residuo !== undefined && (
            <p className="text-white/80 text-lg mb-6">
              Saldo residuo: &euro;{spunta.saldo_residuo.toFixed(2)}
            </p>
          )}
          <p className="text-white/70 text-base mb-8 uppercase">
            RICORDATI DI DEPOSITARE L'IMMONDIZIA E DI ESEGUIRE L'USCITA!
          </p>
          <button
            onClick={chiudiOverlay}
            className="px-8 py-4 bg-white/20 border-2 border-white/50 text-white font-bold text-xl rounded-2xl"
          >
            CHIUDI
          </button>
        </div>
      </div>
    );
  }

  // ─── OVERLAY: FINE SPUNTA ───────────────────────────────────────────────────
  if (spunta.stato === 'FINE_SPUNTA') {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-yellow-500 to-amber-600 p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <Clock className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 uppercase">
            SPUNTA TERMINATA
          </h1>
          <p className="text-white/80 text-xl mb-8">
            {spunta.motivo_fine || 'La spunta è terminata.'}
          </p>
          <button
            onClick={chiudiOverlay}
            className="px-8 py-4 bg-white/20 border-2 border-white/50 text-white font-bold text-xl rounded-2xl"
          >
            CHIUDI
          </button>
        </div>
      </div>
    );
  }

  return null;
}
