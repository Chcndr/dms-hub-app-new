/**
 * InvitoNotifier — Componente globale per notifiche inviti riunione.
 * 
 * Si monta a livello App.tsx e resta sempre attivo.
 * Quando l'utente ha inviti pendenti, mostra una card flottante
 * nell'angolo alto-destra che lampeggia e NON sparisce finché
 * l'utente non accetta o rifiuta.
 * 
 * Stile ispirato a SpuntaNotifier ma come card flottante, non full-screen.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarDays, Clock, Users, X, Check, XCircle, MapPin, Video, AlertTriangle } from "lucide-react";

const API_BASE = "https://api.miohub.it";

interface InvitoData {
  id: number;
  riunione_id: number;
  titolo: string;
  data_inizio: string;
  durata_minuti: number;
  modalita: string;
  jitsi_link?: string;
  sede_indirizzo?: string;
  temi?: string[];
  descrizione?: string;
  urgenza: number;
  importanza: number;
  organizzatore_nome?: string;
  organizzatore_email?: string;
  partecipante_stato: string;
  token: string;
  partecipanti_count?: number;
}

export default function InvitoNotifier() {
  const [inviti, setInviti] = useState<InvitoData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissedTokens, setDismissedTokens] = useState<Set<string>>(new Set());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Risolvi comune_id dall'utente loggato
  const getComuneId = useCallback((): number | null => {
    try {
      // Prova impersonation (vista PA)
      const imp = sessionStorage.getItem("miohub_impersonation");
      if (imp) {
        const parsed = JSON.parse(imp);
        if (parsed.isImpersonating && parsed.comuneId) return parsed.comuneId;
      }
      // Prova firebase user
      const fbStr = localStorage.getItem("miohub_firebase_user");
      if (fbStr) {
        const fb = JSON.parse(fbStr);
        if (fb.comune_id) return fb.comune_id;
      }
      // Prova URL
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("comune_id");
      if (cid) return parseInt(cid);
    } catch { /* ignore */ }
    return null;
  }, []);

  // Polling inviti pendenti
  const fetchInviti = useCallback(async () => {
    const comuneId = getComuneId();
    if (!comuneId) return;
    try {
      const res = await fetch(`${API_BASE}/api/a99x/inviti-ricevuti?comune_id=${comuneId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.inviti)) {
        // Filtra solo quelli INVITATO (pendenti) e non dismissati
        const pendenti = data.inviti.filter((inv: InvitoData) => 
          inv.partecipante_stato === 'INVITATO' && !dismissedTokens.has(inv.token)
        );
        setInviti(pendenti);
      }
    } catch { /* ignore */ }
  }, [getComuneId, dismissedTokens]);

  // Avvia polling ogni 30 secondi
  useEffect(() => {
    fetchInviti();
    pollRef.current = setInterval(fetchInviti, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchInviti]);

  // Rispondi all'invito
  const rispondi = async (token: string, azione: 'accetta' | 'rifiuta') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/a99x/invito/${token}/${azione}`);
      if (res.ok) {
        // Rimuovi dall'elenco
        setInviti(prev => prev.filter(inv => inv.token !== token));
        if (currentIdx >= inviti.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Niente da mostrare
  if (inviti.length === 0) return null;

  const inv = inviti[currentIdx] || inviti[0];
  if (!inv) return null;

  // Colore basato su urgenza
  const urgenza = inv.urgenza || 3;
  const colorScheme = urgenza >= 4
    ? { bg: 'from-red-600 to-red-800', border: 'border-red-400', glow: 'shadow-red-500/60', badge: 'bg-red-500', text: 'URGENTE', icon: '🚨', pulse: 'animate-pulse' }
    : urgenza >= 3
    ? { bg: 'from-amber-500 to-orange-600', border: 'border-amber-400', glow: 'shadow-amber-500/50', badge: 'bg-amber-500', text: 'IMPORTANTE', icon: '📨', pulse: 'animate-pulse' }
    : { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-400', glow: 'shadow-blue-500/40', badge: 'bg-blue-500', text: 'INVITO', icon: '📅', pulse: '' };

  const dataStr = inv.data_inizio 
    ? new Date(inv.data_inizio).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* Card flottante angolo alto-destra — z-[99998] per stare sotto SpuntaNotifier ma sopra tutto il resto */}
      <div 
        className={`fixed top-4 right-4 z-[99998] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 ${colorScheme.border} shadow-2xl ${colorScheme.glow} overflow-hidden ${colorScheme.pulse}`}
        style={{ animation: urgenza >= 3 ? 'invito-glow 2s ease-in-out infinite' : undefined }}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${colorScheme.bg} p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{colorScheme.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`${colorScheme.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                    {colorScheme.text}
                  </span>
                  {inviti.length > 1 && (
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {currentIdx + 1}/{inviti.length}
                    </span>
                  )}
                </div>
                <p className="text-white font-bold text-sm mt-1">Hai un invito riunione!</p>
              </div>
            </div>
            {/* Navigazione se multipli */}
            {inviti.length > 1 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs disabled:opacity-30"
                >&larr;</button>
                <button 
                  onClick={() => setCurrentIdx(Math.min(inviti.length - 1, currentIdx + 1))}
                  disabled={currentIdx === inviti.length - 1}
                  className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs disabled:opacity-30"
                >&rarr;</button>
              </div>
            )}
          </div>
        </div>

        {/* Corpo */}
        <div className="bg-[#1a2332] p-4 space-y-3">
          {/* Titolo riunione */}
          <h3 className="text-white font-bold text-base leading-tight">{inv.titolo}</h3>

          {/* Info riunione */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#e8fbff]/70 text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-[#8b5cf6] flex-shrink-0" />
              <span>{dataStr}</span>
              <span className="text-[#e8fbff]/40">•</span>
              <Clock className="h-3.5 w-3.5 text-[#8b5cf6] flex-shrink-0" />
              <span>{inv.durata_minuti} min</span>
            </div>
            <div className="flex items-center gap-2 text-[#e8fbff]/70 text-xs">
              {inv.modalita === 'ONLINE' || inv.modalita === 'IBRIDO' ? (
                <Video className="h-3.5 w-3.5 text-[#14b8a6] flex-shrink-0" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-[#14b8a6] flex-shrink-0" />
              )}
              <span>{inv.modalita === 'ONLINE' ? 'Online (Jitsi)' : inv.modalita === 'IBRIDO' ? 'Ibrido' : 'In Presenza'}</span>
              {inv.sede_indirizzo && <span className="text-[#e8fbff]/40 truncate">— {inv.sede_indirizzo}</span>}
            </div>
            {inv.organizzatore_nome && (
              <div className="flex items-center gap-2 text-[#e8fbff]/70 text-xs">
                <Users className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0" />
                <span>Da: <strong className="text-[#e8fbff]">{inv.organizzatore_nome}</strong></span>
              </div>
            )}
          </div>

          {/* Temi (espandibile) */}
          {inv.temi && inv.temi.length > 0 && (
            <div>
              <button onClick={() => setExpanded(!expanded)} className="text-[#8b5cf6] text-[10px] hover:underline">
                {expanded ? 'Nascondi temi ▲' : `Mostra ${inv.temi.length} temi ▼`}
              </button>
              {expanded && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {inv.temi.map((t, i) => (
                    <span key={i} className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-[9px] px-2 py-0.5 rounded-full border border-[#8b5cf6]/30">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Urgenza badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
              urgenza >= 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              urgenza >= 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <AlertTriangle className="h-3 w-3" />
              Urgenza: {urgenza}/5
            </div>
            {inv.importanza && (
              <div className="bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 px-2 py-1 rounded-lg text-[10px] font-bold">
                Importanza: {inv.importanza}/5
              </div>
            )}
          </div>

          {/* Bottoni ACCETTA / RIFIUTA */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => rispondi(inv.token, 'accetta')}
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              ACCETTA
            </button>
            <button
              onClick={() => rispondi(inv.token, 'rifiuta')}
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              RIFIUTA
            </button>
          </div>
        </div>
      </div>

      {/* CSS per animazione glow lampeggiante */}
      <style>{`
        @keyframes invito-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.1); }
          50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.8), 0 0 100px rgba(245, 158, 11, 0.3); }
        }
      `}</style>
    </>
  );
}
