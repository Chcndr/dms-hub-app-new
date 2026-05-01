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
  | "uscita_mercato";

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

  // ─── RISOLUZIONE IMPRESA ────────────────────────────────────────────────
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

  // ─── AZIONI ─────────────────────────────────────────────────────────────
  const eseguiPresenzaPosteggio = async (concessione: ConcessioneInfo) => {
    if (!mercatoSelezionato || !impresaId) return;

    // Verifica wallet
    if (concessione.wallet_balance !== null && concessione.wallet_balance < 0) {
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
            session_id: mercatoSelezionato.session_id,
            stall_id: concessione.stall_id,
            concession_id: concessione.concession_id,
            metodo: "app",
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setPopup({
          tipo: "successo",
          titolo: "PRESENZA EFFETTUATA CON SUCCESSO",
          messaggio: `Posteggio ${concessione.stall_number} — Canone: €${concessione.canone_giornaliero.toFixed(2)}`,
          sottomessaggio: "RICORDATI DI DEPOSITARE L'IMMONDIZIA E DI ESEGUIRE L'USCITA!",
        });
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
            session_id: mercatoSelezionato.session_id,
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setPopup({
          tipo: "successo",
          titolo: "PRESENZA SPUNTA ESEGUITA CON SUCCESSO",
          messaggio: `Posizione in graduatoria: ${data.posizione || "—"}`,
          sottomessaggio: "VERRAI AVVISATO QUANDO SARÀ IL TUO TURNO!",
        });
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.error || "Si è verificato un errore.",
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

  const eseguiDepositoRifiuti = async () => {
    if (!mercatoSelezionato || !impresaId) return;
    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/rifiuti`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            session_id: mercatoSelezionato.session_id,
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setPopup({
          tipo: "successo",
          titolo: "DEPOSITO IMMONDIZIA REGISTRATO",
          messaggio: "Il deposito dei rifiuti è stato registrato con successo.",
          sottomessaggio: "RICORDATI DI ESEGUIRE L'USCITA DAL MERCATO!",
        });
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.error || "Si è verificato un errore.",
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

  const eseguiUscita = async () => {
    if (!mercatoSelezionato || !impresaId) return;
    setLoadingAzione(true);
    try {
      const res = await authenticatedFetch(
        `${MIHUB_API_BASE_URL}/api/presenze-live/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impresa_id: impresaId,
            session_id: mercatoSelezionato.session_id,
            latitude: gpsPosition?.lat,
            longitude: gpsPosition?.lng,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setPopup({
          tipo: "successo",
          titolo: "USCITA REGISTRATA CON SUCCESSO",
          messaggio: "Hai completato la giornata di mercato.",
          sottomessaggio: "Grazie e buona giornata!",
        });
      } else {
        setPopup({
          tipo: "errore",
          titolo: "ERRORE",
          messaggio: data.error || "Si è verificato un errore.",
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack || (() => setLocation("/dashboard-impresa"))}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff] h-10 px-3"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-base">Indietro</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-[#14b8a6]" />
          <h1 className="text-lg font-bold text-[#e8fbff]">{titolo}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={cercaMercati}
          className="text-[#14b8a6] hover:text-[#14b8a6]/80 h-10 px-3"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
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
                    <Badge className="mt-3 bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30 text-sm px-3 py-1">
                      Fase: {mercato.session_fase}
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
              <Badge className="mt-2 bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30 text-sm">
                Fase: {mercatoSelezionato.session_fase}
              </Badge>
            )}
          </div>

          {/* Pulsante PRESENZA POSTEGGIO */}
          <button
            onClick={() => setSchermata("presenza_posteggio")}
            className="w-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] rounded-2xl p-6 text-left transition-all active:scale-[0.98] shadow-lg shadow-[#14b8a6]/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <LogIn className="w-9 h-9 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">PRESENZA POSTEGGIO</p>
                <p className="text-base text-white/70 mt-1">
                  Registra la presenza sul tuo posteggio assegnato
                </p>
              </div>
            </div>
          </button>

          {/* Pulsante PRESENZA SPUNTA */}
          <button
            onClick={() => setSchermata("presenza_spunta")}
            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 text-left transition-all active:scale-[0.98] shadow-lg shadow-[#8b5cf6]/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-9 h-9 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">PRESENZA SPUNTA</p>
                <p className="text-base text-white/70 mt-1">
                  Registrati nella graduatoria spuntisti
                </p>
              </div>
            </div>
          </button>

          {/* Separatore */}
          <div className="border-t border-[#e8fbff]/10 my-2" />

          {/* Pulsante DEPOSITO IMMONDIZIA */}
          <button
            onClick={() => eseguiDepositoRifiuti()}
            className="w-full bg-[#1a2332] border-2 border-yellow-500/30 hover:border-yellow-500 rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#e8fbff]">DEPOSITO IMMONDIZIA</p>
                <p className="text-sm text-[#e8fbff]/50">Registra il deposito rifiuti</p>
              </div>
            </div>
          </button>

          {/* Pulsante USCITA MERCATO */}
          <button
            onClick={() => eseguiUscita()}
            className="w-full bg-[#1a2332] border-2 border-red-500/30 hover:border-red-500 rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#e8fbff]">USCITA MERCATO</p>
                <p className="text-sm text-[#e8fbff]/50">Registra l'uscita dal mercato</p>
              </div>
            </div>
          </button>
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

          {concessioni.map((conc) => (
            <div key={conc.concession_id} className="space-y-2">
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
                        : "bg-gradient-to-br from-[#14b8a6]/30 to-[#3b82f6]/30"
                    }`}>
                      <span className="text-2xl font-black text-[#e8fbff]">{conc.stall_number}</span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#e8fbff]">
                        Posteggio {conc.stall_number}
                      </p>
                      <p className="text-base text-[#e8fbff]/50">
                        {conc.area_mq} mq — Canone: €{conc.canone_giornaliero.toFixed(2)}/giorno
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

              {/* Pulsanti azione sotto ogni posteggio */}
              {!conc.gia_presente_oggi && (
                <div className="flex gap-2 px-1">
                  <Button
                    onClick={() => eseguiPresenzaPosteggio(conc)}
                    disabled={loadingAzione}
                    className="flex-1 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-lg py-6 rounded-xl font-bold"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    CONFERMA PRESENZA
                  </Button>
                  <Button
                    onClick={() => {
                      setPosteggioSelezionato(conc);
                      setSchermata("vista_mappa");
                    }}
                    variant="outline"
                    className="border-[#14b8a6]/40 text-[#14b8a6] text-lg py-6 rounded-xl px-4"
                  >
                    <MapIcon className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: PRESENZA SPUNTA ─────────────────────────────────────────
  if (schermata === "presenza_spunta" && mercatoSelezionato) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        {renderHeader("Presenza Spunta", () => setSchermata("scelta_tipo"))}

        <div className="flex-1 p-4 flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
            <Users className="w-12 h-12 text-white" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#e8fbff] mb-2">Presenza Spunta</h2>
            <p className="text-lg text-[#e8fbff]/60 max-w-sm">
              Registra la tua presenza nella graduatoria spuntisti per il mercato <strong className="text-[#14b8a6]">{mercatoSelezionato.market_name}</strong>.
            </p>
          </div>

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
            className="w-full max-w-sm bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-2xl py-8 rounded-2xl font-black shadow-xl shadow-[#8b5cf6]/20"
          >
            <Users className="w-7 h-7 mr-3" />
            REGISTRA PRESENZA SPUNTA
          </Button>
        </div>
      </div>
    );
  }

  // ─── SCHERMATA: VISTA MAPPA ─────────────────────────────────────────────
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
            className="w-full bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-xl py-6 rounded-xl font-bold"
          >
            <LogIn className="w-6 h-6 mr-2" />
            CONFERMA PRESENZA — €{posteggioSelezionato.canone_giornaliero.toFixed(2)}
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
