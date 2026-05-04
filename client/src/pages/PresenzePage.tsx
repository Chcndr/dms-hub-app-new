/**
 * PresenzePage - App Presenze Mercato Nativa
 * Sostituisce l'iframe DMS legacy con interfaccia nativa MIOHUB
 * 
 * Flusso:
 * 1. Risolvi impresa_id (multi-strategia)
 * 2. Geolocalizzazione GPS → auto-selezione mercato
 * 3. Mostra mercati del giorno per l'impresa
 * 4. Due modalità: Presenza Posteggio / Presenza Spunta
 * 5. Conferma con popup verde/rosso a tutto schermo
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Store,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Navigation,
  Wallet,
  AlertTriangle,
  Clock,
  Users,
  Trash2,
  LogOut,
  LogIn,
  Map as MapIcon,
  ChevronRight,
  Info,
  Ticket,
  Timer,
  List,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { authenticatedFetch } from "@/hooks/useImpersonation";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface MercatoOggi {
  market_id: number;
  market_name: string;
  latitude: number;
  longitude: number;
  cost_per_sqm: number;
  session_id: number | null;
  session_fase: string | null;
  concessions: ConcessioneInfo[];
  distance_km?: number;
}

interface ConcessioneInfo {
  concession_id: number;
  stall_id: number;
  stall_number: string;
  area_mq: number;
  canone_giornaliero: number;
  tipo_posteggio: string;
  wallet_id: number | null;
  wallet_balance: number | null;
  wallet_status: string | null;
  durc_valido: boolean;
  gia_presente_oggi: boolean;
  deposito_rifiuti_fatto: boolean;
  uscita_registrata: boolean;
  spunta_stato_coda?: string | null;
}

interface PosteggioLibero {
  id: number;
  number: string;
  area_mq: number;
  daily_fee: number;
}
interface SpuntaTurnoInfo {
  stato: 'IN_ATTESA' | 'TURNO_ATTIVO' | 'ASSEGNATO' | 'FINE_SPUNTA' | 'SALDO_NEGATIVO' | 'RINUNCIATO';
  impresa_nome?: string;
  posizione?: number;
  coda_id?: number;
  session_id?: number;
  scadenza?: string;
  stall_number?: string;
  importo?: number;
  saldo_residuo?: number;
  motivo_fine?: string;
  posteggi_disponibili?: number;
  totale_in_coda?: number;
  posizione_graduatoria?: number | string;
  presenze_totali?: number;
  saldo?: number;
}
type SchermataCorrente = 
  | "caricamento"
  | "errore_impresa"
  | "cerca_mercato"
  | "selezione_mercato"
  | "scelta_tipo"
  | "presenza_posteggio"
  | "presenza_spunta"
  | "vista_mappa"
  | "deposito_rifiuti"
  | "uscita_mercato"
  | "spunta_attesa"
  | "spunta_turno"
  | "spunta_lista_posteggi"
  | "spunta_assegnato"
  | "spunta_fine"
  | "spunta_saldo_negativo"
  | "spunta_rinunciato";

interface PopupInfo {
  tipo: "successo" | "errore" | "avviso";
  titolo: string;
  messaggio: string;
  sottomessaggio?: string;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
const ORCHESTRATORE_URL = import.meta.env.VITE_API_URL || "https://api.mio-hub.me";

function calcolaDistanza(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getGiornoItaliano(): string {
  const giorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  return giorni[new Date().getDay()];
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function PresenzePage() {
  const [, setLocation] = useLocation();

  // Stato utente
  const [impresaId, setImpresaId] = useState<number | null>(null);
  const [impresaResolving, setImpresaResolving] = useState(true);
  const [ragioneSociale, setRagioneSociale] = useState("");
  const [nomeImpresa, setNomeImpresa] = useState("");
  const [nomeUtente, setNomeUtente] = useState("");

  // Stato GPS
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Stato mercati
  const [mercatiOggi, setMercatiOggi] = useState<MercatoOggi[]>([]);
  const [mercatoSelezionato, setMercatoSelezionato] = useState<MercatoOggi | null>(null);
  const [loadingMercati, setLoadingMercati] = useState(false);

  // Stato navigazione
  const [schermata, setSchermata] = useState<SchermataCorrente>("caricamento");
  const [posteggioSelezionato, setPosteggioSelezionato] = useState<ConcessioneInfo | null>(null);

  // Popup
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  // Loading azioni
  const [loadingAzione, setLoadingAzione] = useState(false);

  // Ref per mappa
  const mapIframeRef = useRef<HTMLIFrameElement>(null);
  // Stato spunta real-time
  const [spuntaTurno, setSpuntaTurno] = useState<SpuntaTurnoInfo | null>(null);
  const [posteggiLiberi, setPosteggiLiberi] = useState<PosteggioLibero[]>([]);
  const [spuntaCodaId, setSpuntaCodaId] = useState<number | null>(null);
  const [timerSecondi, setTimerSecondi] = useState(0);
  const sseRef = useRef<EventSource | null>(null);

  // Orologio in tempo reale
  const [oraCorrente, setOraCorrente] = useState(
    new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Rome" })
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setOraCorrente(
        new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Rome" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── SPUNTA SSE REAL-TIME ───────────────────────────────────────────────────────────
  const connettiSSESpunta = useCallback((sessionId: number) => {
    if (sseRef.current) { sseRef.current.close(); }
    const url = `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/stream/${sessionId}`;
    const es = new EventSource(url);
    sseRef.current = es;
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PROSSIMO_TURNO') {
          if (data.impresa_id === impresaId) {
            // È il nostro turno!
            setSpuntaTurno({
              stato: 'TURNO_ATTIVO',
              impresa_nome: data.impresa_nome,
              posizione: data.posizione,
              coda_id: data.coda_id,
              scadenza: data.scadenza,
              posteggi_disponibili: data.posteggi_disponibili,
              totale_in_coda: data.totale_in_coda,
            });
            setTimerSecondi(data.timeout_secondi || 120);
            setSchermata('spunta_turno');
          } else {
            // Turno di un altro
            setSpuntaTurno(prev => ({
              ...prev!,
              stato: 'IN_ATTESA',
              impresa_nome: data.impresa_nome,
              posizione: data.posizione,
              posteggi_disponibili: data.posteggi_disponibili,
              totale_in_coda: data.totale_in_coda,
            }));
          }
        } else if (data.type === 'POSTEGGIO_ASSEGNATO') {
          if (data.impresa_id === impresaId) {
            setSpuntaTurno({
              stato: 'ASSEGNATO',
              stall_number: data.stall_number,
              importo: data.importo_addebitato,
              saldo_residuo: data.wallet_saldo_residuo,
            });
            setSchermata('spunta_assegnato');
          }
        } else if (data.type === 'SPUNTA_TERMINATA') {
          setSpuntaTurno({
            stato: 'FINE_SPUNTA',
            motivo_fine: data.motivo === 'FINE_POSTEGGI' ? 'Tutti i posteggi sono stati assegnati' : 'Tutti i partecipanti sono stati chiamati',
            posteggi_disponibili: data.posteggi_rimanenti,
          });
          setSchermata('spunta_fine');
          es.close();
        } else if (data.type === 'SPUNTA_INIZIATA') {
          if (data.primo_turno?.impresa_id === impresaId) {
            setSpuntaTurno({
              stato: 'TURNO_ATTIVO',
              impresa_nome: data.primo_turno.impresa_nome,
              posizione: 1,
              posteggi_disponibili: data.posteggi_disponibili,
              totale_in_coda: data.spuntisti_in_coda,
            });
            setTimerSecondi(120);
            setSchermata('spunta_turno');
          } else {
            setSchermata('spunta_attesa');
          }
        } else if (data.type === 'SALDO_NEGATIVO_SKIP') {
          // Spuntista saltato per saldo negativo
          if (data.impresa_id === impresaId) {
            setSpuntaTurno({
              stato: 'SALDO_NEGATIVO',
              impresa_nome: data.impresa_nome,
              saldo: data.saldo,
            });
            setSchermata('spunta_saldo_negativo');
          }
        } else if (data.type === 'TURNO_RINUNCIATO') {
          // Conferma rinuncia (potrebbe arrivare se un altro spuntista rinuncia)
          if (data.impresa_id === impresaId) {
            setSpuntaTurno({
              stato: 'RINUNCIATO',
            });
            setSchermata('spunta_rinunciato');
          }
        }
      } catch (err) { console.error('SSE parse error:', err); }
    };
    es.onerror = () => { console.log('SSE spunta: connessione persa, riconnessione...'); };
    return () => { es.close(); };
  }, [impresaId]);

  // Timer countdown per il turno
  useEffect(() => {
    if (schermata !== 'spunta_turno' && schermata !== 'spunta_lista_posteggi') return;
    if (timerSecondi <= 0) return;
    const interval = setInterval(() => {
      setTimerSecondi(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Tempo scaduto, torna in attesa
          setSchermata('spunta_attesa');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [schermata, timerSecondi > 0]);

  // Carica posteggi liberi
  const caricaPosteggiLiberi = useCallback(async () => {
    if (!mercatoSelezionato?.session_id) return;
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/posteggi-liberi/${mercatoSelezionato.session_id}`
      );
      const data = await res.json();
      if (data.success) {
        setPosteggiLiberi(data.posteggi_liberi || []);
      }
    } catch (err) { console.error('Errore caricamento posteggi liberi:', err); }
  }, [mercatoSelezionato]);

  // Scegli posteggio durante turno spunta
  const scegliPosteggioSpunta = async (posteggio: PosteggioLibero) => {
    if (!mercatoSelezionato?.session_id || !spuntaCodaId) return;
    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/scegli-posteggio`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coda_id: spuntaCodaId,
            session_id: mercatoSelezionato.session_id,
            stall_id: posteggio.id,
            impresa_id: impresaId,
          }),
        }
      );
      // Gestione esplicita errori HTTP (403 SALDO_NEGATIVO, etc.)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({} as Record<string, unknown>));
        if (errData.errore === 'SALDO_NEGATIVO') {
          setPopup({
            tipo: 'errore',
            titolo: 'ACCESSO NEGATO',
            messaggio: (errData.messaggio as string) || `Saldo insufficiente. Ricaricare il wallet.`,
          });
        } else {
          setPopup({
            tipo: 'errore',
            titolo: 'ERRORE',
            messaggio: (errData.messaggio as string) || (errData.errore as string) || 'Errore dal server.',
          });
        }
        setLoadingAzione(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSpuntaTurno({
          stato: 'ASSEGNATO',
          stall_number: data.stall_number,
          importo: data.importo_addebitato,
          saldo_residuo: data.wallet_saldo_residuo,
        });
        setSchermata('spunta_assegnato');
      } else if (data.errore === 'SALDO_NEGATIVO') {
        // Fallback: se il backend restituisce 200 con errore nel body
        setPopup({
          tipo: 'errore',
          titolo: 'ACCESSO NEGATO',
          messaggio: data.messaggio || `Saldo insufficiente (€${data.saldo?.toFixed(2)}). Ricaricare il wallet.`,
        });
      } else {
        setPopup({
          tipo: 'errore',
          titolo: 'ERRORE',
          messaggio: data.messaggio || data.errore || 'Errore nella scelta del posteggio.',
        });
      }
    } catch {
      setPopup({ tipo: 'errore', titolo: 'ERRORE DI RETE', messaggio: 'Impossibile contattare il server.' });
    }
    setLoadingAzione(false);
  };

  // ─── RISOLUZIONE IMPRESA ──────────────────────────────────────────────────────
  useEffect(() => {
    async function resolveImpresa() {
      let id: number | null = null;
      let nome = "";

      // Strategia 1: miohub_firebase_user
      let personaNome = "";
      try {
        const fbStr = localStorage.getItem("miohub_firebase_user");
        if (fbStr) {
          const fb = JSON.parse(fbStr);
          if (fb.impresaId) id = fb.impresaId;
          personaNome = fb.displayName || fb.email || "";
        }
      } catch { /* ignore */ }

      // Strategia 2: localStorage['user'] (legacy bridge)
      if (!id) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.impresa_id) id = user.impresa_id;
            if (!personaNome) personaNome = user.name || user.email || "";
          }
        } catch { /* ignore */ }
      }

      // Strategia 3: cerca per user_id su orchestratore
      if (!id) {
        try {
          const fbStr = localStorage.getItem("miohub_firebase_user");
          const userStr = localStorage.getItem("user");
          let userId = 0;
          if (fbStr) { const fb = JSON.parse(fbStr); userId = fb.miohubId || 0; }
          if (!userId && userStr) { const u = JSON.parse(userStr); userId = u.id || 0; }
          if (userId) {
            const res = await fetch(`${ORCHESTRATORE_URL}/api/imprese?user_id=${userId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data?.length > 0) {
                id = data.data[0].id;
                nome = data.data[0].ragione_sociale || data.data[0].denominazione || "";
              }
            }
          }
        } catch { /* ignore */ }
      }

      // Carica nome impresa dal server
      if (id) {
        setImpresaId(id);
        setNomeUtente(personaNome);
        try {
          const resImpresa = await fetch(`${MIHUB_API_BASE_URL}/api/imprese/${id}`);
          if (resImpresa.ok) {
            const dataImpresa = await resImpresa.json();
            const raw = dataImpresa.success ? dataImpresa.data : dataImpresa;
            if (raw) {
              const nomeI = raw.denominazione || raw.ragione_sociale || "";
              setNomeImpresa(nomeI);
              setRagioneSociale(nomeI);
            }
          }
        } catch { /* ignore */ }
        if (!nome && !nomeImpresa) setRagioneSociale(personaNome);
        setSchermata("cerca_mercato");
      } else {
        setSchermata("errore_impresa");
      }
      setImpresaResolving(false);
    }
    resolveImpresa();
  }, []);

  // ─── GEOLOCALIZZAZIONE ──────────────────────────────────────────────────
  const richiediGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS non supportato dal dispositivo");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? "Permesso GPS negato. Attiva la localizzazione." : "Impossibile ottenere la posizione GPS.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  // ─── CERCA MERCATI DEL GIORNO ──────────────────────────────────────────
  const cercaMercati = useCallback(async () => {
    if (!impresaId) return;
    setLoadingMercati(true);

    try {
      // Chiedi GPS se non ancora ottenuto
      if (!gpsPosition) richiediGPS();

      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/mercati-oggi?impresa_id=${impresaId}`
      );

      if (!res.ok) throw new Error("Errore nel caricamento mercati");
      const data = await res.json();

      if (data.success && data.mercati?.length > 0) {
        let mercati: MercatoOggi[] = data.mercati;

        // Calcola distanza GPS se disponibile
        if (gpsPosition) {
          mercati = mercati.map(m => ({
            ...m,
            distance_km: calcolaDistanza(gpsPosition.lat, gpsPosition.lng, m.latitude, m.longitude)
          }));
          mercati.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));

          // Auto-selezione se il mercato più vicino è entro 2km
          if (mercati[0].distance_km && mercati[0].distance_km < 2) {
            setMercatoSelezionato(mercati[0]);
            setSchermata("scelta_tipo");
            setMercatiOggi(mercati);
            setLoadingMercati(false);
            return;
          }
        }

        setMercatiOggi(mercati);
        if (mercati.length === 1) {
          setMercatoSelezionato(mercati[0]);
          setSchermata("scelta_tipo");
        } else {
          setSchermata("selezione_mercato");
        }
      } else {
        setMercatiOggi([]);
        setSchermata("selezione_mercato");
      }
    } catch (err) {
      console.error("Errore cerca mercati:", err);
      setMercatiOggi([]);
      setSchermata("selezione_mercato");
    }
    setLoadingMercati(false);
  }, [impresaId, gpsPosition, richiediGPS]);

  // Auto-cerca mercati quando impresa risolta
  useEffect(() => {
    if (impresaId && schermata === "cerca_mercato") {
      cercaMercati();
    }
  }, [impresaId, schermata, cercaMercati]);

  // Auto-refresh: polling ogni 15 secondi per aggiornare lo stato delle concessioni/presenze
  // (es. quando la PA registra deposito rifiuti o uscita, l'App lo vede senza uscire e rientrare)
  useEffect(() => {
    if (!mercatoSelezionato || !impresaId) return;
    // Solo nelle schermate principali (non durante flusso spunta attivo)
    if (!['scelta_tipo', 'vista_mappa'].includes(schermata)) return;
    const interval = setInterval(() => {
      cercaMercati();
    }, 10000); // 10 secondi (allineato alla PA)
    return () => clearInterval(interval);
  }, [mercatoSelezionato, impresaId, schermata, cercaMercati]);

  // Ascolta evento 'spunta_gestita' da SpuntaNotifier per resettare tab ATTESA SPUNTA
  useEffect(() => {
    const handleSpuntaGestita = (e: StorageEvent) => {
      if (e.key === 'spunta_gestita') {
        console.log('[PresenzePage] Spunta gestita, resetto stato spunta locale...');
        // Resetta gia_presente_oggi e aggiorna spunta_stato_coda per le concessioni Spunta
        setMercatoSelezionato(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            concessions: prev.concessions.map(c =>
              c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: false, spunta_stato_coda: c.spunta_stato_coda || 'COMPLETATO' } : c
            )
          };
        });
        // Resetta stato spunta locale
        setSpuntaTurno(null);
        setSpuntaCodaId(null);
        setTimerSecondi(0);
        setPosteggiLiberi([]);
        // Torna alla schermata scelta_tipo se eravamo in una schermata spunta
        if (['spunta_attesa', 'spunta_turno', 'spunta_lista_posteggi', 'spunta_assegnato', 'spunta_fine', 'spunta_saldo_negativo', 'spunta_rinunciato'].includes(schermata)) {
          setSchermata('scelta_tipo');
        }
        // Ricarica dati dal backend per avere stato aggiornato (spunta_stato_coda dal DB)
        cercaMercati();
      }
    };
    window.addEventListener('storage', handleSpuntaGestita);
    return () => window.removeEventListener('storage', handleSpuntaGestita);
  }, [schermata]);

  // ─── AZIONI ─────────────────────────────────────────────────────────────
  const eseguiPresenzaPosteggio = async (concessione: ConcessioneInfo) => {
    if (!mercatoSelezionato || !impresaId) return;

    // Verifica wallet — solo per concessioni (posteggi fisici), NON per spunta
    const isSpuntaConc = concessione.tipo_posteggio === 'Spunta';
    if (!isSpuntaConc && concessione.wallet_balance !== null && concessione.wallet_balance < 0) {
      setPopup({
        tipo: "errore",
        titolo: "SALDO INSUFFICIENTE",
        messaggio: `Il wallet del posteggio ${concessione.stall_number} ha saldo negativo: €${concessione.wallet_balance?.toFixed(2)}`,
        sottomessaggio: "Ricarica il wallet per poter effettuare la presenza."
      });
      return;
    }

    // Verifica DURC
    if (!concessione.durc_valido) {
      setPopup({
        tipo: "errore",
        titolo: "DURC NON VALIDO",
        messaggio: "Il DURC della tua impresa risulta scaduto o non valido.",
        sottomessaggio: "Aggiorna il DURC per poter effettuare la presenza."
      });
      return;
    }

    // Già presente oggi
    if (concessione.gia_presente_oggi) {
      setPopup({
        tipo: "avviso",
        titolo: "GIÀ PRESENTE",
        messaggio: `Hai già registrato la presenza per il posteggio ${concessione.stall_number} oggi.`,
      });
      return;
    }

    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/checkin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            market_id: mercatoSelezionato.market_id,
            session_id: mercatoSelezionato.session_id,
            stall_id: concessione.stall_id,
            concession_id: concessione.concession_id,
            tipo_presenza: isSpuntaConc ? 'SPUNTA' : 'CONCESSION',
            metodo_checkin: "APP",
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        // Aggiorna localmente lo stato della concessione
        if (mercatoSelezionato) {
          setMercatoSelezionato(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              concessions: prev.concessions.map(c =>
                c.concession_id === concessione.concession_id && c.wallet_id === concessione.wallet_id
                  ? { ...c, gia_presente_oggi: true }
                  : c
              )
            };
          });
        }

        // Refresh dati mercato per avere wallet aggiornato, importo, ecc.
        cercaMercati();

        if (isSpuntaConc) {
          // Per la spunta: connetti SSE e mostra schermata attesa
          const posizioneGrad = data.posizione_graduatoria || '-';
          const presenzeTotali = data.presenze_totali || 0;
          setSpuntaTurno({
            stato: 'IN_ATTESA',
            posizione: posizioneGrad,
            totale_in_coda: data.totale_in_coda || 0,
            posteggi_disponibili: 0,
            posizione_graduatoria: posizioneGrad,
            presenze_totali: presenzeTotali,
          });
          if (mercatoSelezionato?.session_id) {
            connettiSSESpunta(mercatoSelezionato.session_id);
          }
          setSchermata('spunta_attesa');
        } else {
          setPopup({
            tipo: "successo",
            titolo: "PRESENZA EFFETTUATA CON SUCCESSO",
            messaggio: `Posteggio ${concessione.stall_number} — Canone: €${concessione.canone_giornaliero.toFixed(2)}`,
            sottomessaggio: "RICORDATI DI DEPOSITARE L'IMMONDIZIA E DI ESEGUIRE L'USCITA!",
          });
        }
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE PRESENZA",
          messaggio: data.error || "Si è verificato un errore durante la registrazione.",
        });
      }
    } catch (err) {
      setPopup({
        tipo: "errore",
        titolo: "ERRORE DI RETE",
        messaggio: "Impossibile contattare il server. Riprova.",
      });
    }
    setLoadingAzione(false);
  };

  const eseguiPresenzaSpunta = async () => {
    if (!mercatoSelezionato || !impresaId) return;
    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/entra-coda`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            market_id: mercatoSelezionato.market_id,
            session_id: mercatoSelezionato.session_id,
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSpuntaCodaId(data.coda_id || null);
        setSpuntaTurno({
          stato: 'IN_ATTESA',
          posizione: data.posizione,
          totale_in_coda: data.totale_in_coda,
          posteggi_disponibili: data.posteggi_disponibili,
          posizione_graduatoria: data.posizione_graduatoria || data.posizione,
          presenze_totali: data.presenze_totali || 0,
        });
        // Aggiorna gia_presente_oggi per le concessioni spunta
        setMercatoSelezionato(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            concessions: prev.concessions.map(c =>
              c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: true } : c
            )
          };
        });
        // Connetti SSE per ricevere eventi in tempo reale
        if (mercatoSelezionato.session_id) {
          connettiSSESpunta(mercatoSelezionato.session_id);
        }
        setSchermata('spunta_attesa');
      } else if (data.errore === 'GIA_IN_CODA') {
        // Già in coda: connetti SSE e mostra schermata attesa
        setSpuntaTurno({
          stato: 'IN_ATTESA',
          posizione: 0,
          totale_in_coda: 0,
          posteggi_disponibili: 0,
        });
        // Aggiorna gia_presente_oggi per le concessioni spunta
        setMercatoSelezionato(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            concessions: prev.concessions.map(c =>
              c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: true } : c
            )
          };
        });
        if (mercatoSelezionato?.session_id) {
          connettiSSESpunta(mercatoSelezionato.session_id);
        }
        setSchermata('spunta_attesa');
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.messaggio || data.error || "Si è verificato un errore.",
        });
      }
    } catch {
      setPopup({
        tipo: "errore",
        titolo: "ERRORE DI RETE",
        messaggio: "Impossibile contattare il server. Riprova.",
      });
    }
    setLoadingAzione(false);
  };

  const eseguiDepositoRifiuti = async (concessione: ConcessioneInfo) => {
    if (!mercatoSelezionato || !impresaId) return;

    if (concessione.deposito_rifiuti_fatto) {
      setPopup({
        tipo: "avviso",
        titolo: "GIÀ REGISTRATO",
        messaggio: `Il deposito rifiuti per il posteggio ${concessione.stall_number} è già stato registrato oggi.`,
      });
      return;
    }

    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/deposito-rifiuti`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            market_id: mercatoSelezionato.market_id,
            stall_id: concessione.stall_id,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        // Aggiorna lo stato locale
        concessione.deposito_rifiuti_fatto = true;
        setPopup({
          tipo: "successo",
          titolo: "DEPOSITO RIFIUTI REGISTRATO",
          messaggio: `Posteggio ${concessione.stall_number} — Deposito registrato.`,
          sottomessaggio: "RICORDATI DI ESEGUIRE L'USCITA DAL MERCATO!",
        });
        // Refresh dati mercato
        cercaMercati();
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.messaggio || data.error || "Si è verificato un errore.",
        });
      }
    } catch {
      setPopup({
        tipo: "errore",
        titolo: "ERRORE DI RETE",
        messaggio: "Impossibile contattare il server. Riprova.",
      });
    }
    setLoadingAzione(false);
  };

  const eseguiUscita = async (concessione: ConcessioneInfo) => {
    if (!mercatoSelezionato || !impresaId) return;

    if (concessione.uscita_registrata) {
      setPopup({
        tipo: "avviso",
        titolo: "GIÀ REGISTRATA",
        messaggio: `L'uscita per il posteggio ${concessione.stall_number} è già stata registrata oggi.`,
      });
      return;
    }

    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/uscita-mercato`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            market_id: mercatoSelezionato.market_id,
            stall_id: concessione.stall_id,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        // Aggiorna lo stato locale
        concessione.uscita_registrata = true;
        setPopup({
          tipo: "successo",
          titolo: "USCITA REGISTRATA CON SUCCESSO",
          messaggio: `Posteggio ${concessione.stall_number} — Uscita registrata.`,
          sottomessaggio: "Grazie e buona giornata!",
        });
        // Refresh dati mercato
        cercaMercati();
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.messaggio || data.error || "Si è verificato un errore.",
        });
      }
    } catch {
      setPopup({
        tipo: "errore",
        titolo: "ERRORE DI RETE",
        messaggio: "Impossibile contattare il server. Riprova.",
      });
    }
    setLoadingAzione(false);
  };

  // ─── POPUP FULLSCREEN ───────────────────────────────────────────────────
  if (popup) {
    const bgColor = popup.tipo === "successo"
      ? "from-green-600 to-green-800"
      : popup.tipo === "errore"
        ? "from-red-600 to-red-800"
        : "from-yellow-600 to-yellow-800";
    const IconComp = popup.tipo === "successo" ? CheckCircle : popup.tipo === "errore" ? XCircle : AlertTriangle;

    return (
      <div className={`fixed inset-0 z-[9999] bg-gradient-to-b ${bgColor} flex flex-col items-center justify-center p-6 text-white`}>
        <IconComp className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          {popup.titolo}
        </h1>
        <p className="text-xl sm:text-2xl text-center text-white/90 mb-4 max-w-md leading-relaxed">
          {popup.messaggio}
        </p>
        {popup.sottomessaggio && (
          <p className="text-lg sm:text-xl text-center text-white/80 mb-10 max-w-sm font-medium leading-relaxed">
            {popup.sottomessaggio}
          </p>
        )}
        <Button
          onClick={() => setPopup(null)}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          CHIUDI
        </Button>
      </div>
    );
  }

  // ─── LOADING AZIONE ─────────────────────────────────────────────────────
  if (loadingAzione) {
    return (
      <div className="fixed inset-0 z-[9998] bg-[#0b1220]/95 flex flex-col items-center justify-center">
        <Loader2 className="w-20 h-20 animate-spin text-[#14b8a6] mb-6" />
        <p className="text-2xl text-[#e8fbff] font-semibold">Registrazione in corso...</p>
      </div>
    );
  }

  // ─── HEADER ─────────────────────────────────────────────────────────────
  const renderHeader = (titolo: string, onBack?: () => void) => (
    <div className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-b border-[#14b8a6]/30 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack || (() => {
              // Torna alla pagina precedente (HomePage)
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation("/");
              }
            })}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff] h-10 px-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          <Store className="w-5 h-5 text-[#14b8a6] flex-shrink-0" />
          <h1 className="text-base font-bold text-[#e8fbff] truncate">{titolo}</h1>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={cercaMercati}
            className="text-[#14b8a6] hover:text-[#14b8a6]/80 h-10 px-2"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ─── SCHERMATA: CARICAMENTO ─────────────────────────────────────────────
  if (schermata === "caricamento" || impresaResolving) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-16 h-16 animate-spin text-[#14b8a6] mb-6" />
        <p className="text-xl text-[#e8fbff] font-semibold">Caricamento...</p>
        <p className="text-base text-[#e8fbff]/50 mt-2">Identificazione impresa in corso</p>
      </div>
    );
  }

  // ─── SCHERMATA: ERRORE IMPRESA ──────────────────────────────────────────
  if (schermata === "errore_impresa") {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Presenze")}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <XCircle className="w-20 h-20 text-red-400 mb-6" />
          <h2 className="text-2xl font-bold text-[#e8fbff] mb-3 text-center">Impresa non identificata</h2>
          <p className="text-lg text-[#e8fbff]/60 text-center max-w-sm">
            Non è stato possibile identificare la tua impresa. Effettua nuovamente il login.
          </p>
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: CERCA MERCATO / SELEZIONE ───────────────────────────────
  if (schermata === "cerca_mercato" || schermata === "selezione_mercato") {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Presenze Mercato")}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Info giorno */}
          <div className="bg-[#1a2332] border border-[#14b8a6]/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#14b8a6]/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 text-[#14b8a6]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#e8fbff]">{getGiornoItaliano()}</p>
              <p className="text-base text-[#e8fbff]/50">
                {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {(nomeUtente || nomeImpresa) && (
                <div className="mt-1">
                  {nomeUtente && (
                    <p className="text-sm text-[#e8fbff]/70 truncate">{nomeUtente}</p>
                  )}
                  {nomeImpresa && (
                    <p className="text-sm text-[#14b8a6] font-semibold truncate">Impresa: {nomeImpresa}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* GPS Status */}
          <div className="bg-[#1a2332] border border-[#14b8a6]/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className={`w-6 h-6 ${gpsPosition ? "text-green-400" : gpsError ? "text-red-400" : "text-[#e8fbff]/40"}`} />
                <div>
                  <p className="text-base font-semibold text-[#e8fbff]">
                    {gpsLoading ? "Rilevamento posizione..." : gpsPosition ? "Posizione rilevata" : gpsError || "GPS non attivo"}
                  </p>
                  {gpsPosition && (
                    <p className="text-sm text-[#e8fbff]/40">
                      {gpsPosition.lat.toFixed(5)}, {gpsPosition.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
              {!gpsPosition && !gpsLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={richiediGPS}
                  className="border-[#14b8a6]/40 text-[#14b8a6] text-base px-4 py-2"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Attiva
                </Button>
              )}
              {gpsLoading && <Loader2 className="w-6 h-6 animate-spin text-[#14b8a6]" />}
            </div>
          </div>

          {/* Loading mercati */}
          {loadingMercati && (
            <div className="flex flex-col items-center py-10">
              <Loader2 className="w-12 h-12 animate-spin text-[#14b8a6] mb-4" />
              <p className="text-lg text-[#e8fbff]/60">Ricerca mercati in corso...</p>
            </div>
          )}

          {/* Nessun mercato */}
          {!loadingMercati && mercatiOggi.length === 0 && schermata === "selezione_mercato" && (
            <div className="bg-[#1a2332] border border-[#e8fbff]/10 rounded-2xl p-8 text-center">
              <Store className="w-16 h-16 text-[#e8fbff]/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#e8fbff] mb-2">Nessun mercato oggi</h3>
              <p className="text-base text-[#e8fbff]/50">
                Non ci sono mercati programmati per oggi ({getGiornoItaliano()}) in cui sei autorizzato a partecipare.
              </p>
              <Button
                onClick={cercaMercati}
                className="mt-6 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-lg px-8 py-3 rounded-xl"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Riprova
              </Button>
            </div>
          )}

          {/* Lista mercati */}
          {!loadingMercati && mercatiOggi.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-[#e8fbff] px-1">
                {mercatiOggi.length === 1 ? "Mercato di oggi" : "Seleziona il mercato"}
              </h2>
              {mercatiOggi.map((mercato) => (
                <button
                  key={mercato.market_id}
                  onClick={() => {
                    setMercatoSelezionato(mercato);
                    setSchermata("scelta_tipo");
                  }}
                  className="w-full bg-[#1a2332] border-2 border-[#14b8a6]/30 hover:border-[#14b8a6] rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                        <Store className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#e8fbff]">{mercato.market_name}</p>
                        <p className="text-base text-[#e8fbff]/50">
                          {mercato.concessions.length} posteggi assegnati
                        </p>
                        {mercato.distance_km !== undefined && (
                          <p className="text-sm text-[#14b8a6] mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {mercato.distance_km < 1
                              ? `${(mercato.distance_km * 1000).toFixed(0)} m`
                              : `${mercato.distance_km.toFixed(1)} km`}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-7 h-7 text-[#14b8a6]" />
                  </div>
                  {mercato.session_fase && (
                    <Badge className={`mt-3 text-sm px-3 py-1 ${
                      mercato.session_fase === 'CHIUSO' || mercato.session_fase === 'CHIUSA'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30'
                    }`}>
                      Fase: {mercato.session_fase === 'CHIUSO' ? 'CHIUSA' : mercato.session_fase}
                    </Badge>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: SCELTA TIPO PRESENZA ────────────────────────────────────
  if (schermata === "scelta_tipo" && mercatoSelezionato) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader(mercatoSelezionato.market_name, () => {
          setSchermata("selezione_mercato");
          setMercatoSelezionato(null);
        })}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Info mercato */}
          <div className="bg-gradient-to-r from-[#14b8a6]/10 to-[#3b82f6]/10 border border-[#14b8a6]/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-6 h-6 text-[#14b8a6]" />
              <h2 className="text-xl font-bold text-[#e8fbff]">{mercatoSelezionato.market_name}</h2>
            </div>
            <p className="text-base text-[#e8fbff]/50">
              {getGiornoItaliano()} — {new Date().toLocaleDateString("it-IT")}
            </p>
            {mercatoSelezionato.session_fase && (
              <Badge className={`mt-2 text-sm ${
                mercatoSelezionato.session_fase === 'CHIUSO' || mercatoSelezionato.session_fase === 'CHIUSA'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30'
              }`}>
                Fase: {mercatoSelezionato.session_fase === 'CHIUSO' ? 'CHIUSA' : mercatoSelezionato.session_fase}
              </Badge>
            )}
          </div>

          {/* Orologio in tempo reale */}
          <div className="flex items-center justify-center gap-3 py-3">
            <Clock className="w-5 h-5 text-[#14b8a6]" />
            <span className="text-3xl font-mono font-bold text-[#e8fbff] tracking-wider">{oraCorrente}</span>
          </div>

          {(() => {
            // Calcola stati per logica contestuale
            const concessioni = mercatoSelezionato.concessions.filter(c => c.tipo_posteggio !== 'Spunta');
            const spuntisti = mercatoSelezionato.concessions.filter(c => c.tipo_posteggio === 'Spunta');
            // Spuntisti con posteggio assegnato (hanno stall_number) → trattati come concessioni per deposito/uscita
            const spuntaConPosteggio = spuntisti.filter(s => s.gia_presente_oggi && s.stall_number && s.stall_number !== '-');
            // Spuntisti in attesa (in coda, senza posteggio ancora)
            const spuntaInAttesa = spuntisti.filter(s => s.gia_presente_oggi && (!s.stall_number || s.stall_number === '-'));
            // Tutti i posteggi attivi (concessioni + spunta assegnati)
            const tuttiPosteggi = [...concessioni, ...spuntaConPosteggio];
            const haConcessioni = concessioni.length > 0;
            const haSpunta = spuntisti.length > 0;
            const tuttiPresenti = tuttiPosteggi.length > 0 && tuttiPosteggi.every(c => c.gia_presente_oggi);
            const qualcunoPresente = tuttiPosteggi.some(c => c.gia_presente_oggi);
            const tuttiDepositoFatto = tuttiPosteggi.filter(c => c.gia_presente_oggi).every(c => c.deposito_rifiuti_fatto);
            const qualcunoDepositoDaFare = tuttiPosteggi.some(c => c.gia_presente_oggi && !c.deposito_rifiuti_fatto);
            const qualcunoUscitaDaFare = tuttiPosteggi.some(c => c.gia_presente_oggi && !c.uscita_registrata);

            return (
              <>
                {/* PRESENZA POSTEGGIO: visibile se ha concessioni e non tutti hanno fatto presenza */}
                {/* Nascosto durante fase SPUNTA o se la spunta è in corso (spuntisti in attesa/con posteggio) */}
                {haConcessioni && !tuttiPresenti && mercatoSelezionato.session_fase !== 'SPUNTA' && spuntaInAttesa.length === 0 && spuntaConPosteggio.length === 0 && (
                  <button
                    onClick={() => setSchermata("presenza_posteggio")}
                    className="w-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] rounded-2xl p-4 sm:p-6 text-left transition-all active:scale-[0.98] shadow-lg shadow-[#14b8a6]/20"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <LogIn className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-xl font-black text-white leading-tight">PRESENZA POSTEGGIO</p>
                        <p className="text-xs sm:text-sm text-white/70 mt-1">
                          Registra la presenza al posteggio
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* PRESENZA SPUNTA / ATTESA SPUNTA */}
                {haSpunta && (() => {
                  // PRIMA controlla se ha rinunciato o è stato saltato (priorità massima)
                  const spuntaRinunciato = spuntisti.some(s => s.spunta_stato_coda === 'RINUNCIATO' || s.spunta_stato_coda === 'SALTATO');
                  if (spuntaRinunciato) {
                    const isSaldoNeg = spuntisti.some(s => s.spunta_stato_coda === 'SALTATO');
                    return (
                      <div className={`w-full rounded-2xl p-4 sm:p-6 text-left shadow-lg ${isSaldoNeg ? 'bg-gradient-to-r from-red-800 to-red-900 shadow-red-800/20' : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-600/20'}`}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0`}>
                            <XCircle className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base sm:text-xl font-black text-white leading-tight">{isSaldoNeg ? 'SALDO NEGATIVO' : 'RINUNCIA SPUNTA'}</p>
                            <p className="text-xs sm:text-sm text-white/70 mt-1">
                              {isSaldoNeg ? 'Non puoi partecipare alla spunta con saldo negativo' : 'Hai rinunciato alla spunta di oggi'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Se ha posteggio assegnato, non mostrare nulla (deposito/uscita gestiscono il posteggio)
                  if (spuntaConPosteggio.length > 0) {
                    return null;
                  }
                  // Mostra ATTESA SPUNTA solo se in coda senza posteggio assegnato
                  if (spuntaInAttesa.length > 0) {
                    return (
                      <div className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 rounded-2xl p-4 sm:p-6 text-left shadow-lg shadow-yellow-600/20">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base sm:text-xl font-black text-white leading-tight">ATTESA SPUNTA</p>
                            <p className="text-xs sm:text-sm text-white/70 mt-1">
                              Presenza registrata — in attesa del turno
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // (RINUNCIATO/SALTATO e posteggio assegnato già gestiti sopra)
                  // Altrimenti mostra bottone PRESENZA SPUNTA per entrare in coda
                  return (
                    <button
                      onClick={() => setSchermata("presenza_spunta")}
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-4 sm:p-6 text-left transition-all active:scale-[0.98] shadow-lg shadow-[#8b5cf6]/20"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base sm:text-xl font-black text-white leading-tight">PRESENZA SPUNTA</p>
                          <p className="text-xs sm:text-sm text-white/70 mt-1">
                            Graduatoria spuntisti
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })()}

                {/* Separatore se ci sono azioni post-presenza */}
                {qualcunoPresente && (qualcunoDepositoDaFare || qualcunoUscitaDaFare) && (
                  <div className="border-t border-[#e8fbff]/10 my-2" />
                )}

                {/* DEPOSITO RIFIUTI: visibile se almeno uno ha fatto presenza e non ha depositato */}
                {qualcunoDepositoDaFare && (
                  <button
                    onClick={() => setSchermata("deposito_rifiuti")}
                    className="w-full bg-[#1a2332] border-2 border-yellow-500/30 hover:border-yellow-500 rounded-2xl p-4 sm:p-5 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-bold text-[#e8fbff] leading-tight">DEPOSITO RIFIUTI</p>
                        <p className="text-xs sm:text-sm text-[#e8fbff]/50">Registra il deposito</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* USCITA MERCATO: visibile se almeno uno ha fatto presenza e non ha registrato uscita */}
                {qualcunoUscitaDaFare && (
                  <button
                    onClick={() => setSchermata("uscita_mercato")}
                    className="w-full bg-[#1a2332] border-2 border-red-500/30 hover:border-red-500 rounded-2xl p-4 sm:p-5 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <LogOut className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-bold text-[#e8fbff] leading-tight">USCITA MERCATO</p>
                        <p className="text-xs sm:text-sm text-[#e8fbff]/50">Registra l'uscita</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Messaggio se tutto completato */}
                {tuttiPresenti && tuttiDepositoFatto && !qualcunoUscitaDaFare && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-lg font-bold text-green-400">Giornata completata!</p>
                    <p className="text-sm text-[#e8fbff]/50 mt-1">Tutte le operazioni sono state registrate.</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: PRESENZA POSTEGGIO ──────────────────────────────────────
  if (schermata === "presenza_posteggio" && mercatoSelezionato) {
    const concessioni = mercatoSelezionato.concessions;

    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Presenza Posteggio", () => setSchermata("scelta_tipo"))}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#e8fbff] px-1">
            Seleziona il posteggio
          </h2>
          <p className="text-base text-[#e8fbff]/50 px-1">
            Clicca sul posteggio per registrare la presenza
          </p>

          {concessioni.length === 0 && (
            <div className="bg-[#1a2332] border border-[#e8fbff]/10 rounded-2xl p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-lg text-[#e8fbff]">Nessun posteggio assegnato per questo mercato.</p>
            </div>
          )}

          {concessioni.map((conc) => {
            const isSpunta = conc.tipo_posteggio === 'Spunta';
            return (
            <div key={conc.concession_id || `spunta-${conc.wallet_id}`} className="space-y-2">
              <button
                onClick={() => {
                  setPosteggioSelezionato(conc);
                }}
                className={`w-full bg-[#1a2332] border-2 rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
                  conc.gia_presente_oggi
                    ? "border-green-500/40 opacity-70"
                    : conc.wallet_balance !== null && conc.wallet_balance < 0
                      ? "border-red-500/40"
                      : "border-[#14b8a6]/30 hover:border-[#14b8a6]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      conc.gia_presente_oggi
                        ? "bg-green-500/20"
                        : isSpunta
                          ? "bg-gradient-to-br from-[#f59e0b]/30 to-[#eab308]/30"
                          : "bg-gradient-to-br from-[#14b8a6]/30 to-[#3b82f6]/30"
                    }`}>
                      {isSpunta
                        ? <Ticket className="w-8 h-8 text-[#f59e0b]" />
                        : <span className="text-2xl font-black text-[#e8fbff]">{conc.stall_number}</span>
                      }
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#e8fbff]">
                        {isSpunta ? "Autorizzazione Spunta" : `Posteggio ${conc.stall_number}`}
                      </p>
                      <p className="text-base text-[#e8fbff]/50">
                        {isSpunta
                          ? `${mercatoSelezionato?.market_name || 'Mercato'} — Spuntista`
                          : `${conc.area_mq} mq — Canone: €${conc.canone_giornaliero.toFixed(2)}/giorno`
                        }
                      </p>
                      {conc.gia_presente_oggi && (
                        <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-sm">
                          <CheckCircle className="w-3 h-3 mr-1" /> Presente oggi
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wallet */}
                <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${
                  conc.wallet_balance !== null && conc.wallet_balance < 0
                    ? "bg-red-500/10"
                    : "bg-[#14b8a6]/10"
                }`}>
                  <Wallet className={`w-5 h-5 ${
                    conc.wallet_balance !== null && conc.wallet_balance < 0 ? "text-red-400" : "text-[#14b8a6]"
                  }`} />
                  <span className={`text-lg font-bold ${
                    conc.wallet_balance !== null && conc.wallet_balance < 0 ? "text-red-400" : "text-[#14b8a6]"
                  }`}>
                    Saldo: €{conc.wallet_balance?.toFixed(2) ?? "N/D"}
                  </span>
                </div>
              </button>

              {/* Tab azione dinamico sotto ogni posteggio */}
              {(() => {
                // Per SPUNTA: flusso dipende dallo stato
                if (isSpunta) {
                  // Se ha un posteggio assegnato (stall_number presente), segui flusso DEPOSITO → USCITA come concessioni
                  if (conc.gia_presente_oggi && conc.stall_number && conc.stall_number !== '-') {
                    // Ha posteggio assegnato via spunta → mostra DEPOSITO o USCITA
                    if (!conc.deposito_rifiuti_fatto) {
                      return (
                        <div className="flex gap-2 px-1">
                          <Button
                            onClick={() => eseguiDepositoRifiuti(conc)}
                            disabled={loadingAzione}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                          >
                            <Trash2 className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">DEPOSITO RIFIUTI</span>
                          </Button>
                        </div>
                      );
                    }
                    if (!conc.uscita_registrata) {
                      return (
                        <div className="flex gap-2 px-1">
                          <Button
                            onClick={() => eseguiUscita(conc)}
                            disabled={loadingAzione}
                            className="flex-1 bg-red-500 hover:bg-red-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                          >
                            <LogOut className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">USCITA MERCATO</span>
                          </Button>
                        </div>
                      );
                    }
                    // Tutto completato
                    return (
                      <div className="flex items-center gap-2 px-3 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-base font-semibold text-green-400">COMPLETATO</span>
                      </div>
                    );
                  }
                  // Se ha rinunciato o è stato saltato, mostra card grigia/rossa
                  if (conc.spunta_stato_coda === 'RINUNCIATO' || conc.spunta_stato_coda === 'SALTATO') {
                    const isSaldoNeg = conc.spunta_stato_coda === 'SALTATO';
                    return (
                      <div className={`flex items-center gap-2 px-3 py-3 rounded-xl ${isSaldoNeg ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-500/10 border border-gray-500/30'}`}>
                        <XCircle className={`w-5 h-5 flex-shrink-0 ${isSaldoNeg ? 'text-red-400' : 'text-gray-400'}`} />
                        <span className={`text-base font-semibold ${isSaldoNeg ? 'text-red-400' : 'text-gray-400'}`}>{isSaldoNeg ? 'SALDO NEGATIVO' : 'RINUNCIATO'}</span>
                      </div>
                    );
                  }
                  // Non ha ancora fatto presenza spunta → mostra bottone PRESENZA SPUNTA
                  if (!conc.gia_presente_oggi) {
                    return (
                      <div className="flex gap-2 px-1">
                        <Button
                          onClick={() => eseguiPresenzaPosteggio(conc)}
                          disabled={loadingAzione}
                          className="flex-1 bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                        >
                          <Ticket className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">PRESENZA SPUNTA</span>
                        </Button>
                      </div>
                    );
                  }
                  // In coda senza posteggio → ATTESA SPUNTA
                  return (
                    <div className="flex items-center gap-2 px-3 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-pulse" />
                      <span className="text-base font-semibold text-yellow-400">ATTESA SPUNTA</span>
                    </div>
                  );
                }
                // Per CONCESSIONI: PRESENZA → DEPOSITO → USCITA → COMPLETATO
                if (!conc.gia_presente_oggi) {
                  return (
                    <div className="flex gap-2 px-1">
                      <Button
                        onClick={() => eseguiPresenzaPosteggio(conc)}
                        disabled={loadingAzione}
                        className="flex-1 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                      >
                        <LogIn className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">PRESENZA</span>
                      </Button>
                      <Button
                        onClick={() => {
                          setPosteggioSelezionato(conc);
                          setSchermata("vista_mappa");
                        }}
                        variant="outline"
                        className="border-[#14b8a6]/40 text-[#14b8a6] py-5 sm:py-6 rounded-xl px-4 flex-shrink-0"
                      >
                        <MapIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  );
                }
                if (!conc.deposito_rifiuti_fatto) {
                  return (
                    <div className="flex gap-2 px-1">
                      <Button
                        onClick={() => eseguiDepositoRifiuti(conc)}
                        disabled={loadingAzione}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                      >
                        <Trash2 className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">DEPOSITO RIFIUTI</span>
                      </Button>
                    </div>
                  );
                }
                if (!conc.uscita_registrata) {
                  return (
                    <div className="flex gap-2 px-1">
                      <Button
                        onClick={() => eseguiUscita(conc)}
                        disabled={loadingAzione}
                        className="flex-1 bg-red-500 hover:bg-red-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                      >
                        <LogOut className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">USCITA MERCATO</span>
                      </Button>
                    </div>
                  );
                }
                // Tutto completato
                return (
                  <div className="flex items-center gap-2 px-3 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-base font-semibold text-green-400">Giornata completata</span>
                  </div>
                );
              })()}
            </div>
          );
          })}
        </div>
      </div>
    );
  }
  // ─── SCHERMATA: PRESENZA SPUNTA ─────────────────────────────────────────
  if (schermata === "presenza_spunta" && mercatoSelezionato) {
    const spuntaGiaPresente = mercatoSelezionato.concessions.some(c => c.tipo_posteggio === 'Spunta' && c.gia_presente_oggi);
    const spuntaRinunciatoOSaltato = mercatoSelezionato.concessions.some(c => c.tipo_posteggio === 'Spunta' && (c.spunta_stato_coda === 'RINUNCIATO' || c.spunta_stato_coda === 'SALTATO'));
    // Se ha rinunciato/saltato, torna alla schermata scelta_tipo
    if (spuntaRinunciatoOSaltato) {
      setSchermata('scelta_tipo');
      return null;
    }
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Presenza Spunta", () => setSchermata("scelta_tipo"))}

        <div className="flex-1 p-4 flex flex-col items-center justify-center space-y-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${spuntaGiaPresente ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/30' : 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-[#8b5cf6]/30'}`}>
            {spuntaGiaPresente ? <Clock className="w-12 h-12 text-white animate-pulse" /> : <Users className="w-12 h-12 text-white" />}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#e8fbff] mb-2">
              {spuntaGiaPresente ? 'Attesa Spunta' : 'Presenza Spunta'}
            </h2>
            <p className="text-lg text-[#e8fbff]/60 max-w-sm">
              {spuntaGiaPresente
                ? <>Presenza registrata per <strong className="text-[#14b8a6]">{mercatoSelezionato.market_name}</strong>. Sei in attesa del tuo turno.</>
                : <>Registra la tua presenza nella graduatoria spuntisti per il mercato <strong className="text-[#14b8a6]">{mercatoSelezionato.market_name}</strong>.</>
              }
            </p>
          </div>

          {spuntaGiaPresente ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 w-full max-w-sm text-center">
              <Clock className="w-10 h-10 text-yellow-400 mx-auto mb-3 animate-pulse" />
              <p className="text-xl font-bold text-yellow-400 mb-2">ATTESA SPUNTA</p>
              <p className="text-base text-[#e8fbff]/60 mb-4">Verrai avvisato quando sar\u00e0 il tuo turno.</p>
              <Button
                onClick={async () => {
                  const confirmed = window.confirm(
                    'Sei sicuro di voler RINUNCIARE alla spunta?\n\nNON riceverai un posteggio e NON guadagnerai il punto presenza in graduatoria.'
                  );
                  if (!confirmed) return;
                  try {
                    const rinunciaRes = await authenticatedFetch(
                      `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/rinuncia`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          coda_id: spuntaCodaId || spuntaTurno?.coda_id || null,
                          impresa_id: impresaId,
                          session_id: spuntaTurno?.session_id || null
                        }),
                      }
                    );
                    const rinunciaData = await rinunciaRes.json();
                    if (rinunciaData.success) {
                      setPopup({
                        tipo: "avviso",
                        titolo: "RINUNCIA REGISTRATA",
                        messaggio: "Hai rinunciato alla spunta. Non riceverai un posteggio e non guadagni il punto presenza.",
                      });
                      // Aggiorna stato locale: segna come rinunciato e non più presente
                      setMercatoSelezionato(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          concessions: prev.concessions.map(c =>
                            c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: false, spunta_stato_coda: 'RINUNCIATO' } : c
                          )
                        };
                      });
                      setSpuntaTurno({ stato: 'RINUNCIATO' });
                      setSchermata('scelta_tipo');
                      if (sseRef.current) sseRef.current.close();
                    } else {
                      setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: rinunciaData.messaggio || 'Errore rinuncia' });
                    }
                  } catch (err) {
                    setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: 'Errore durante la rinuncia' });
                  }
                }}
                className="bg-red-600/80 hover:bg-red-700 text-white border border-red-400/50 text-sm px-6 py-2 rounded-xl font-bold"
              >
                RINUNCIA ALLA SPUNTA
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-[#1a2332] border border-[#8b5cf6]/20 rounded-2xl p-5 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Info className="w-5 h-5 text-[#8b5cf6]" />
                  <p className="text-base font-semibold text-[#e8fbff]">Come funziona</p>
                </div>
                <ul className="space-y-2 text-base text-[#e8fbff]/60">
                  <li className="flex items-start gap-2">
                    <span className="text-[#8b5cf6] font-bold mt-0.5">1.</span>
                    Registri la tua presenza
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#8b5cf6] font-bold mt-0.5">2.</span>
                    Ricevi la posizione in graduatoria
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#8b5cf6] font-bold mt-0.5">3.</span>
                    Verrai avvisato quando sarà il tuo turno
                  </li>
                </ul>
              </div>

              <Button
                onClick={eseguiPresenzaSpunta}
                disabled={loadingAzione}
                className="w-full max-w-sm bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-lg sm:text-xl py-8 rounded-2xl font-black shadow-xl shadow-[#8b5cf6]/20"
              >
                <Users className="w-6 h-6 mr-2 flex-shrink-0" />
                REGISTRA SPUNTA
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: DEPOSITO RIFIUTI ────────────────────────────────────────
  if (schermata === "deposito_rifiuti" && mercatoSelezionato) {
    const concPresenti = mercatoSelezionato.concessions.filter(
      c => c.gia_presente_oggi && !c.deposito_rifiuti_fatto && (c.tipo_posteggio !== 'Spunta' || (c.tipo_posteggio === 'Spunta' && c.stall_number && c.stall_number !== '-'))
    );

    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Deposito Rifiuti", () => setSchermata("scelta_tipo"))}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#e8fbff] px-1">
            Registra il deposito rifiuti
          </h2>
          <p className="text-base text-[#e8fbff]/50 px-1">
            Clicca sul posteggio per registrare il deposito
          </p>

          {concPresenti.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg text-green-400 font-bold">Tutti i depositi sono stati registrati!</p>
              <p className="text-sm text-[#e8fbff]/50 mt-1">Non ci sono posteggi in attesa di deposito rifiuti.</p>
            </div>
          )}

          {concPresenti.map((conc) => (
            <div key={conc.concession_id} className="space-y-2">
              <div className="w-full bg-[#1a2332] border-2 border-yellow-500/30 rounded-2xl p-5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-black text-[#e8fbff]">{conc.stall_number}</span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#e8fbff]">
                        Posteggio {conc.stall_number}
                      </p>
                      <p className="text-base text-[#e8fbff]/50">
                        {conc.area_mq} mq
                      </p>
                      <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-sm">
                        <CheckCircle className="w-3 h-3 mr-1" /> Presente oggi
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 px-1">
                <Button
                  onClick={() => eseguiDepositoRifiuti(conc)}
                  disabled={loadingAzione}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                >
                  <Trash2 className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">DEPOSITO RIFIUTI</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: USCITA MERCATO ──────────────────────────────────────────
  if (schermata === "uscita_mercato" && mercatoSelezionato) {
    const concPresenti = mercatoSelezionato.concessions.filter(
      c => c.gia_presente_oggi && !c.uscita_registrata && (c.tipo_posteggio !== 'Spunta' || (c.tipo_posteggio === 'Spunta' && c.stall_number && c.stall_number !== '-'))
    );

    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Uscita Mercato", () => setSchermata("scelta_tipo"))}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#e8fbff] px-1">
            Registra l'uscita dal mercato
          </h2>
          <p className="text-base text-[#e8fbff]/50 px-1">
            Clicca sul posteggio per registrare l'uscita
          </p>

          {concPresenti.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg text-green-400 font-bold">Tutte le uscite sono state registrate!</p>
              <p className="text-sm text-[#e8fbff]/50 mt-1">Non ci sono posteggi in attesa di uscita.</p>
            </div>
          )}

          {concPresenti.map((conc) => (
            <div key={conc.concession_id} className="space-y-2">
              <div className="w-full bg-[#1a2332] border-2 border-red-500/30 rounded-2xl p-5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-black text-[#e8fbff]">{conc.stall_number}</span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#e8fbff]">
                        Posteggio {conc.stall_number}
                      </p>
                      <p className="text-base text-[#e8fbff]/50">
                        {conc.area_mq} mq
                      </p>
                      {conc.deposito_rifiuti_fatto ? (
                        <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm">
                          <Trash2 className="w-3 h-3 mr-1" /> Rifiuti depositati
                        </Badge>
                      ) : (
                        <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Rifiuti NON depositati
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 px-1">
                <Button
                  onClick={() => eseguiUscita(conc)}
                  disabled={loadingAzione}
                  className="flex-1 bg-red-500 hover:bg-red-500/80 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl font-bold min-w-0"
                >
                  <LogOut className="w-5 h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">USCITA MERCATO</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // ─── OVERLAY SPUNTA: ATTESA TURNO (giallo full-screen) ──────────────────────
  if (schermata === "spunta_attesa") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-yellow-600 to-yellow-800 flex flex-col items-center justify-center p-6 text-white">
        <Clock className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          IN ATTESA DEL TUO TURNO
        </h1>
        {spuntaTurno?.posizione_graduatoria && (
          <p className="text-2xl sm:text-3xl text-center text-white/90 mb-3 font-bold">
            Posizione in graduatoria: <strong>{spuntaTurno.posizione_graduatoria}°</strong>
          </p>
        )}
        {spuntaTurno?.presenze_totali !== undefined && spuntaTurno.presenze_totali > 0 && (
          <p className="text-lg sm:text-xl text-center text-white/80 mb-4 font-medium">
            Presenze accumulate: {spuntaTurno.presenze_totali}
          </p>
        )}
        <p className="text-lg sm:text-xl text-center text-white/80 mb-10 font-medium">
          VERRAI AVVISATO QUANDO SARÀ IL TUO TURNO!
        </p>
        <Button
          onClick={() => {
            if (sseRef.current) sseRef.current.close();
            setSchermata('scelta_tipo');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          TORNA AL MENU
        </Button>
        {/* Tab Rinuncia dalla schermata attesa */}
        <Button
          onClick={async () => {
            const confirmed = window.confirm(
              'Sei sicuro di voler RINUNCIARE alla spunta?\n\nNON riceverai un posteggio e NON guadagnerai il punto presenza in graduatoria.'
            );
            if (!confirmed) return;
            try {
              const rinunciaRes = await authenticatedFetch(
                `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/rinuncia`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coda_id: spuntaCodaId || spuntaTurno?.coda_id || null,
                    impresa_id: impresaId,
                    session_id: spuntaTurno?.session_id || null
                  }),
                }
              );
              const rinunciaData = await rinunciaRes.json();
              if (rinunciaData.success) {
                setPopup({
                  tipo: "avviso",
                  titolo: "RINUNCIA REGISTRATA",
                  messaggio: "Hai rinunciato alla spunta. Non riceverai un posteggio e non guadagni il punto presenza.",
                });
                // Aggiorna stato locale: segna come rinunciato
                setMercatoSelezionato(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    concessions: prev.concessions.map(c =>
                      c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: false, spunta_stato_coda: 'RINUNCIATO' } : c
                    )
                  };
                });
                setSpuntaTurno({ stato: 'RINUNCIATO' });
                setSchermata('scelta_tipo');
                if (sseRef.current) sseRef.current.close();
              } else {
                setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: rinunciaData.messaggio || 'Errore rinuncia' });
              }
            } catch (err) {
              setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: 'Errore durante la rinuncia' });
            }
          }}
          className="mt-4 bg-red-600/80 hover:bg-red-700 text-white border-2 border-red-400/50 text-lg px-12 py-4 rounded-2xl font-bold shadow-xl"
        >
          RINUNCIA ALLA SPUNTA
        </Button>
      </div>
    );
  }

  // ─── OVERLAY SPUNTA: È IL TUO TURNO! (giallo acceso full-screen) ──────────────
  if (schermata === "spunta_turno") {
    const minuti = Math.floor(timerSecondi / 60);
    const secondi = timerSecondi % 60;
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-yellow-500 to-amber-600 flex flex-col items-center justify-center p-6 text-white">
        <Star className="w-24 h-24 mb-6 drop-shadow-lg animate-pulse" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 leading-tight drop-shadow-lg">
          {nomeImpresa || ragioneSociale || 'LA TUA IMPRESA'}
        </h1>
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          È IL TUO TURNO!
        </h2>
        <p className="text-xl text-center text-white/90 mb-2">
          Tempo rimasto
        </p>
        <p className="text-5xl sm:text-6xl font-black font-mono mb-6 drop-shadow-lg">
          {String(minuti).padStart(2, '0')}:{String(secondi).padStart(2, '0')}
        </p>
        <p className="text-lg text-center text-white/80 mb-6">
          Posteggi disponibili: {spuntaTurno?.posteggi_disponibili ?? '—'}
        </p>
        <Button
          onClick={async () => {
            await caricaPosteggiLiberi();
            setSchermata('spunta_lista_posteggi');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          VISUALIZZA POSTEGGI LIBERI
        </Button>
        {/* Tab Rinuncia */}
        <Button
          onClick={async () => {
            const confirmed = window.confirm(
              'Sei sicuro di voler RINUNCIARE al turno?\n\nNON riceverai un posteggio e NON guadagnerai il punto presenza in graduatoria.'
            );
            if (!confirmed) return;
            try {
              const rinunciaRes = await authenticatedFetch(
                `${MIHUB_API_BASE_URL}/api/presenze-live/spunta/rinuncia`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coda_id: spuntaCodaId || spuntaTurno?.coda_id || null,
                    impresa_id: impresaId,
                    session_id: spuntaTurno?.session_id || null
                  }),
                }
              );
              const rinunciaData = await rinunciaRes.json();
              if (rinunciaData.success) {
                setPopup({
                  tipo: "avviso",
                  titolo: "RINUNCIA REGISTRATA",
                  messaggio: "Hai rinunciato al turno. Non riceverai un posteggio e non guadagni il punto presenza.",
                });
                // Aggiorna stato locale: segna come rinunciato
                setMercatoSelezionato(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    concessions: prev.concessions.map(c =>
                      c.tipo_posteggio === 'Spunta' ? { ...c, gia_presente_oggi: false, spunta_stato_coda: 'RINUNCIATO' } : c
                    )
                  };
                });
                setSpuntaTurno({ stato: 'RINUNCIATO' });
                setSchermata('scelta_tipo');
                if (sseRef.current) sseRef.current.close();
              } else {
                setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: rinunciaData.messaggio || 'Errore rinuncia' });
              }
            } catch (err) {
              setPopup({ tipo: "errore", titolo: "ERRORE", messaggio: 'Errore durante la rinuncia' });
            }
          }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white border-2 border-red-400 text-lg px-12 py-4 rounded-2xl font-bold shadow-xl"
        >
          RINUNCIA AL TURNO
        </Button>
      </div>
    );
  }

  // ─── SCHERMATA: LISTA POSTEGGI LIBERI (con timer in header) ──────────────────
  if (schermata === "spunta_lista_posteggi") {
    const minuti = Math.floor(timerSecondi / 60);
    const secondi = timerSecondi % 60;
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0b1220] flex flex-col">
        {/* Header con timer */}
        <div className="bg-amber-500 p-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSchermata('spunta_turno')} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-white font-bold text-lg">Posteggi Liberi</h2>
          <div className="bg-white/30 rounded-lg px-3 py-1">
            <span className="text-white font-mono font-bold text-lg">
              {String(minuti).padStart(2, '0')}:{String(secondi).padStart(2, '0')}
            </span>
          </div>
        </div>
        {/* Lista posteggi scorrevole */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {posteggiLiberi.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-lg">Nessun posteggio disponibile</p>
            </div>
          ) : (
            posteggiLiberi.map((p) => (
              <Card key={p.id} className="bg-[#1a2332] border-[#2a3a4a] cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => {
                  if (!loadingAzione) {
                    setSpuntaCodaId(spuntaTurno?.coda_id || spuntaCodaId);
                    scegliPosteggioSpunta(p);
                  }
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 font-bold text-lg">{p.number}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Posteggio {p.number}</p>
                      <p className="text-gray-400 text-sm">{p.area_mq} mq — €{p.daily_fee.toFixed(2)}/giorno</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-amber-400" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── OVERLAY SPUNTA: POSTEGGIO ASSEGNATO (verde full-screen) ───────────────
  if (schermata === "spunta_assegnato") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-green-600 to-green-800 flex flex-col items-center justify-center p-6 text-white">
        <CheckCircle className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          POSTEGGIO ASSEGNATO!
        </h1>
        <p className="text-xl sm:text-2xl text-center text-white/90 mb-2 max-w-md">
          Posteggio <strong>{spuntaTurno?.stall_number}</strong>
        </p>
        {spuntaTurno?.importo !== undefined && (
          <p className="text-lg sm:text-xl text-center text-white/80 mb-2">
            Importo addebitato: €{spuntaTurno.importo.toFixed(2)}
          </p>
        )}
        {spuntaTurno?.saldo_residuo !== undefined && (
          <p className="text-lg text-center text-white/70 mb-4">
            Saldo residuo: €{spuntaTurno.saldo_residuo.toFixed(2)}
          </p>
        )}
        <p className="text-lg sm:text-xl text-center text-white/80 mb-10 font-medium">
          RICORDATI DI DEPOSITARE L'IMMONDIZIA E DI ESEGUIRE L'USCITA!
        </p>
        <Button
          onClick={() => {
            if (sseRef.current) sseRef.current.close();
            cercaMercati();
            setSchermata('scelta_tipo');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          CHIUDI
        </Button>
      </div>
    );
  }

  // ─── OVERLAY SPUNTA: FINE SPUNTA (giallo full-screen) ──────────────────────
  if (schermata === "spunta_fine") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-yellow-600 to-yellow-800 flex flex-col items-center justify-center p-6 text-white">
        <AlertTriangle className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          SPUNTA TERMINATA
        </h1>
        <p className="text-xl sm:text-2xl text-center text-white/90 mb-4 max-w-md leading-relaxed">
          {spuntaTurno?.motivo_fine || 'La spunta è terminata.'}
        </p>
        {spuntaTurno?.posteggi_disponibili !== undefined && (
          <p className="text-lg text-center text-white/80 mb-10">
            Posteggi rimanenti: {spuntaTurno.posteggi_disponibili}
          </p>
        )}
        <Button
          onClick={() => {
            cercaMercati();
            setSchermata('scelta_tipo');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          CHIUDI
        </Button>
      </div>
    );
  }

  // ─── SCHERMATA: SALDO NEGATIVO (saltato automaticamente) ────────────────────────
  if (schermata === "spunta_saldo_negativo") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center p-6 text-white">
        <XCircle className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          SALDO NEGATIVO
        </h1>
        <p className="text-xl sm:text-2xl text-center text-white/90 mb-4 max-w-md leading-relaxed">
          Non puoi ricevere un posteggio perch\u00e9 il tuo saldo \u00e8 negativo.
        </p>
        {spuntaTurno?.saldo !== undefined && (
          <p className="text-2xl font-bold text-red-200 mb-10">
            Saldo: \u20ac{Number(spuntaTurno.saldo).toFixed(2)}
          </p>
        )}
        <Button
          onClick={() => {
            if (sseRef.current) sseRef.current.close();
            cercaMercati();
            setSchermata('scelta_tipo');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          CHIUDI
        </Button>
      </div>
    );
  }

  // ─── SCHERMATA: RINUNCIA CONFERMATA ─────────────────────────────────────────────
  if (schermata === "spunta_rinunciato") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-orange-600 to-orange-800 flex flex-col items-center justify-center p-6 text-white">
        <AlertTriangle className="w-24 h-24 mb-8 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 leading-tight drop-shadow-lg">
          RINUNCIA REGISTRATA
        </h1>
        <p className="text-xl sm:text-2xl text-center text-white/90 mb-4 max-w-md leading-relaxed">
          Hai rinunciato alla spunta. Non riceverai un posteggio e non guadagni il punto presenza.
        </p>
        <Button
          onClick={() => {
            if (sseRef.current) sseRef.current.close();
            cercaMercati();
            setSchermata('scelta_tipo');
          }}
          className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 text-xl px-12 py-6 rounded-2xl font-bold shadow-xl"
        >
          CHIUDI
        </Button>
      </div>
    );
  }

  // ─── SCHERMATA: VISTA MAPPA ─────────────────────────────────────────────────────
  if (schermata === "vista_mappa" && mercatoSelezionato && posteggioSelezionato) {
    const mapUrl = `https://api.mio-hub.me/tools/market-map-viewer.html?marketId=${mercatoSelezionato.market_id}&stallNumber=${posteggioSelezionato.stall_number}`;

    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader(`Mappa — Post. ${posteggioSelezionato.stall_number}`, () => setSchermata("presenza_posteggio"))}

        <div className="flex-1 relative">
          <iframe
            ref={mapIframeRef}
            src={mapUrl}
            className="w-full h-full border-0"
            style={{ minHeight: "calc(100vh - 120px)" }}
            title="Mappa Mercato"
            allow="geolocation"
          />
        </div>

        {/* Barra azione in basso */}
        <div className="bg-[#1a2332] border-t border-[#14b8a6]/30 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-[#e8fbff]">Posteggio {posteggioSelezionato.stall_number}</p>
              <p className="text-base text-[#e8fbff]/50">
                Canone: €{posteggioSelezionato.canone_giornaliero.toFixed(2)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg ${
              posteggioSelezionato.wallet_balance !== null && posteggioSelezionato.wallet_balance < 0
                ? "bg-red-500/20"
                : "bg-[#14b8a6]/20"
            }`}>
              <span className={`text-lg font-bold ${
                posteggioSelezionato.wallet_balance !== null && posteggioSelezionato.wallet_balance < 0
                  ? "text-red-400"
                  : "text-[#14b8a6]"
              }`}>
                €{posteggioSelezionato.wallet_balance?.toFixed(2) ?? "N/D"}
              </span>
            </div>
          </div>
          <Button
            onClick={() => eseguiPresenzaPosteggio(posteggioSelezionato)}
            disabled={loadingAzione}
            className="w-full bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-sm sm:text-base py-6 rounded-xl font-bold"
          >
            <LogIn className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>CONFERMA PRESENZA — €{posteggioSelezionato.canone_giornaliero.toFixed(2)}</span>
          </Button>
        </div>
      </div>
    );
  }

  // ─── FALLBACK ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-12 h-12 animate-spin text-[#14b8a6] mb-4" />
      <p className="text-lg text-[#e8fbff]/60">Caricamento...</p>
    </div>
  );
}
