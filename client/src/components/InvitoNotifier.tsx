/**
 * InvitoNotifier — Componente globale per notifiche inviti riunione.
 * 
 * Si monta a livello App.tsx e resta sempre attivo.
 * Quando l'utente ha inviti pendenti, mostra una card flottante
 * nell'angolo alto-destra che lampeggia e NON sparisce finché
 * l'utente non accetta o rifiuta.
 * 
 * v10.31.7d: Risoluzione identità robusta con retry + storage listener
 * (stessa strategia di SpuntaNotifier) per garantire che il popup
 * appaia su /dashboard-impresa anche per utenti super admin con impresa_id.
 * 
 * v10.22.0: Supporta COMUNI, IMPRESE e ASSOCIAZIONI.
 * Cerca l'identità dell'utente da:
 * 1. sessionStorage "miohub_impersonation" (comuni e associazioni in impersonificazione)
 * 2. localStorage "user" (imprese loggati)
 * 3. localStorage "miohub_firebase_user" (utenti Firebase)
 * 4. URL params (comune_id, associazione_id)
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
  creato_da_nome?: string;
  creato_da_tipo?: string;
  partecipante_stato: string;
  token: string;
  partecipanti_count?: number;
}

interface UserIdentity {
  tipo: 'COMUNE' | 'IMPRESA' | 'ASSOCIAZIONE' | 'SUPERADMIN';
  email?: string;
  id?: number | string;
  nome?: string;
  comuneId?: number | string;
}

export default function InvitoNotifier() {
  const [inviti, setInviti] = useState<InvitoData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  // Persistere dismissedTokens in localStorage per sopravvivere ai reload
  const [dismissedTokens, setDismissedTokens] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('miohub_dismissed_inviti');
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });

  // Salva dismissedTokens in localStorage quando cambia
  useEffect(() => {
    try {
      localStorage.setItem('miohub_dismissed_inviti', JSON.stringify([...dismissedTokens]));
    } catch { /* ignore */ }
  }, [dismissedTokens]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // RISOLUZIONE IDENTITÀ ROBUSTA (pattern SpuntaNotifier)
  // Con retry ogni 2s per max 30s + storage event listener
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const tryResolve = (): UserIdentity | null => {
      try {
        const path = window.location.pathname;
        const isOnAppImpresa = path.includes('/dashboard-impresa') || path.includes('/app/impresa');

        // ─── PRIORITÀ 0: Se siamo su app impresa, SEMPRE trattare come IMPRESA ───
        // Questo DEVE venire PRIMA di qualsiasi altro check (incluso SUPERADMIN)
        // per gestire il caso chcndr@gmail.com (super admin con impresa_id=38)
        if (isOnAppImpresa) {
          let impresaId: number | null = null;
          let impresaNome = 'Impresa';
          let impresaEmail = '';
          let isCollaborator = false;

          // Fonte 1: miohub_firebase_user
          try {
            const fbStr = localStorage.getItem("miohub_firebase_user");
            if (fbStr) {
              const fb = JSON.parse(fbStr);
              if (fb.isCollaborator) isCollaborator = true;
              if (fb.impresaId && !fb.isCollaborator) {
                impresaId = Number(fb.impresaId);
                impresaNome = fb.impresaNome || fb.displayName || 'Impresa';
                impresaEmail = fb.email || '';
              }
            }
          } catch { /* ignore */ }

          // Fonte 2: localStorage['user'] (legacy bridge)
          if (!impresaId) {
            try {
              const userStr = localStorage.getItem("user");
              if (userStr) {
                const user = JSON.parse(userStr);
                if (user.isCollaborator) isCollaborator = true;
                // Collaboratori team NON ricevono il popup inviti
                // Gli inviti A99X vanno all'impresa titolare, non ai dipendenti
                if (user.impresa_id && !user.isCollaborator) {
                  impresaId = Number(user.impresa_id);
                  impresaNome = user.impresa_nome || user.name || 'Impresa';
                  impresaEmail = user.email || user.impresa_email || user.username || '';
                }
              }
            } catch { /* ignore */ }
          }

          // Collaboratori team: NON mostrare popup (ritorna SUPERADMIN per bloccare)
          if (isCollaborator) {
            return { tipo: 'SUPERADMIN', comuneId: 0, nome: '', email: '' };
          }

          if (impresaId) {
            return {
              tipo: 'IMPRESA',
              id: impresaId,
              nome: impresaNome,
              email: impresaEmail,
            };
          }
          // Se su app impresa ma impresaId non ancora disponibile → null (retry)
          return null;
        }

        // ─── PRIORITÀ 1: Impersonificazione (sessionStorage) ───
        const imp = sessionStorage.getItem("miohub_impersonation");
        if (imp) {
          const parsed = JSON.parse(imp);
          if (parsed.isImpersonating) {
            // Associazione
            if ((parsed.entityType === 'associazione' || parsed.role === 'associazione') && parsed.associazioneId) {
              return {
                tipo: 'ASSOCIAZIONE',
                id: parseInt(parsed.associazioneId) || parsed.associazioneId,
                nome: parsed.associazioneNome || 'Associazione',
                email: parsed.userEmail || parsed.email,
              };
            }
            // Comune
            if ((parsed.entityType === 'comune' || parsed.role === 'comune' || !parsed.entityType) && parsed.comuneId) {
              return {
                tipo: 'COMUNE',
                comuneId: parseInt(parsed.comuneId) || parsed.comuneId,
                nome: parsed.comuneNome || 'Comune',
                email: parsed.userEmail || parsed.email,
              };
            }
          }
        }

        // ─── PRIORITÀ 2: localStorage "user" ───
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);

          // Collaboratori team: NON mostrare popup inviti
          // Gli inviti A99X vanno all'impresa titolare, non ai dipendenti del team
          if (user.isCollaborator) {
            return { tipo: 'SUPERADMIN', comuneId: 0, nome: '', email: '' };
          }

          // Impresa (utente non-admin con impresa_id e NON su DashboardPA)
          if (user.impresa_id) {
            const isOnDashboardPA = path.includes('/dashboard-pa') || path === '/';
            if (!isOnDashboardPA) {
              return {
                tipo: 'IMPRESA',
                id: user.impresa_id,
                nome: user.impresa_nome || user.name || 'Impresa',
                email: user.email || user.impresa_email || user.username,
              };
            }
          }

          // Super admin — solo sulla DashboardPA
          if (user.email === 'chcndr@gmail.com' || user.is_super_admin === true || user.role === 'admin' || user.base_role === 'admin') {
            return {
              tipo: 'SUPERADMIN',
              comuneId: 0,
              nome: 'MIO HUB',
              email: user.email,
            };
          }

          // Impresa (fallback)
          if (user.impresa_id) {
            return {
              tipo: 'IMPRESA',
              id: user.impresa_id,
              nome: user.impresa_nome || user.name || 'Impresa',
              email: user.email || user.impresa_email || user.username,
            };
          }
        }

        // ─── PRIORITÀ 3: Firebase user ───
        const fbStr = localStorage.getItem("miohub_firebase_user");
        if (fbStr) {
          const fb = JSON.parse(fbStr);
          // Super admin
          if (fb.email === 'chcndr@gmail.com' || fb.isSuperAdmin === true || fb.role === 'pa') {
            return {
              tipo: 'SUPERADMIN',
              comuneId: 0,
              nome: 'MIO HUB',
              email: fb.email,
            };
          }
          if (fb.comune_id) {
            return {
              tipo: 'COMUNE',
              comuneId: fb.comune_id,
              nome: fb.comune_nome || 'Comune',
              email: fb.email,
            };
          }
        }

        // ─── PRIORITÀ 4: URL params ───
        const params = new URLSearchParams(window.location.search);
        const cid = params.get("comune_id");
        if (cid) {
          return {
            tipo: 'COMUNE',
            comuneId: parseInt(cid),
            email: params.get("user_email") || undefined,
          };
        }
        const aid = params.get("associazione_id");
        if (aid) {
          return {
            tipo: 'ASSOCIAZIONE',
            id: parseInt(aid),
            nome: params.get("associazione_nome") || 'Associazione',
            email: params.get("user_email") || undefined,
          };
        }
      } catch { /* ignore */ }
      return null;
    };

    // Primo tentativo immediato
    const immediateIdentity = tryResolve();
    if (immediateIdentity) {
      console.log(`[InvitoNotifier] identità trovata subito: ${immediateIdentity.tipo} id=${immediateIdentity.id || immediateIdentity.comuneId}`);
      setUserIdentity(immediateIdentity);
      return;
    }

    console.log('[InvitoNotifier] identità non trovata subito, attendo login...');

    // Retry ogni 2 secondi per max 30 secondi (il login potrebbe essere in corso)
    let attempts = 0;
    const maxAttempts = 15;
    const retryInterval = setInterval(() => {
      attempts++;
      const identity = tryResolve();
      if (identity) {
        console.log(`[InvitoNotifier] identità trovata dopo ${attempts * 2}s: ${identity.tipo} id=${identity.id || identity.comuneId}`);
        setUserIdentity(identity);
        clearInterval(retryInterval);
      } else if (attempts >= maxAttempts) {
        console.log('[InvitoNotifier] identità non trovata dopo 30s, rinuncio');
        clearInterval(retryInterval);
      }
    }, 2000);

    // Ascolta anche l'evento storage (il FirebaseAuthContext fa window.dispatchEvent(new Event('storage')))
    const onStorage = () => {
      const identity = tryResolve();
      if (identity) {
        console.log(`[InvitoNotifier] identità trovata via storage event: ${identity.tipo} id=${identity.id || identity.comuneId}`);
        setUserIdentity(identity);
        clearInterval(retryInterval);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(retryInterval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Polling inviti pendenti
  const fetchInviti = useCallback(async () => {
    if (!userIdentity) return;

    // v10.31.6: Il super admin NON riceve il popup inviti
    // Il super admin vede già tutte le riunioni nella sezione A99X della DashboardPA
    // Il popup con comune_id=0 restituiva TUTTI gli inviti di tutte le riunioni create dal super admin
    if (userIdentity.tipo === 'SUPERADMIN') return;

    // v10.31.7g: I comuni possono essere invitati come partecipanti alle riunioni.
    // Il fix è nel backend: inviti-ricevuti?comune_id=X ora filtra per p.tipo='COMUNE' AND p.riferimento_id=X
    // (cioè il comune come partecipante), NON più per r.comune_id=X (territorio della riunione).

    try {
      let url = '';

      if (userIdentity.tipo === 'COMUNE') {
        // Per comuni: usa inviti-ricevuti con comune_id (ora filtra per comune come partecipante)
        url = `${API_BASE}/api/a99x/inviti-ricevuti?comune_id=${userIdentity.comuneId}`;
      } else if (userIdentity.tipo === 'IMPRESA' || userIdentity.tipo === 'ASSOCIAZIONE') {
        // Per imprese e associazioni: usa le-mie-riunioni con riferimento_id e tipo
        url = `${API_BASE}/api/a99x/le-mie-riunioni?riferimento_id=${userIdentity.id}&tipo=${userIdentity.tipo}`;
      }

      if (!url) return;

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      let pendenti: InvitoData[] = [];

      if (userIdentity.tipo === 'COMUNE') {
        // Formato inviti-ricevuti
        if (data.success && Array.isArray(data.data)) {
          const now = new Date();
          pendenti = data.data
            .filter((inv: any) => {
              if (inv.partecipante_stato !== 'INVITATO' || !inv.token || dismissedTokens.has(inv.token)) return false;
              // Escludi riunioni passate (data_fine <= now)
              if (inv.data_inizio) {
                const dataFine = new Date(new Date(inv.data_inizio).getTime() + (inv.durata_minuti || 30) * 60000);
                if (dataFine <= now) return false;
              }
              // Escludi riunioni annullate/riprogrammate
              if (['ANNULLATA', 'RIPROGRAMMATA'].includes(inv.stato_riunione || inv.stato)) return false;
              return true;
            })
            .map((inv: any) => ({
              ...inv,
              urgenza: inv.urgenza || 3,
              importanza: inv.importanza || 3,
            }));
        }
      } else {
        // Formato le-mie-riunioni
        if (data.success && Array.isArray(data.data)) {
          const nowMs = new Date();
          pendenti = data.data
            .filter((r: any) => {
              if (r.partecipante_stato !== 'INVITATO' || !r.token || dismissedTokens.has(r.token)) return false;
              // Escludi riunioni passate (data_fine <= now)
              if (r.data_inizio) {
                const dataFine = new Date(new Date(r.data_inizio).getTime() + (r.durata_minuti || 30) * 60000);
                if (dataFine <= nowMs) return false;
              }
              // Escludi riunioni annullate/riprogrammate
              if (['ANNULLATA', 'RIPROGRAMMATA'].includes(r.stato)) return false;
              return true;
            })
            .map((r: any) => ({
              id: r.partecipante_id || r.id,
              riunione_id: r.id,
              titolo: r.titolo,
              data_inizio: r.data_inizio,
              durata_minuti: r.durata_minuti || 30,
              modalita: r.modalita || 'ONLINE',
              jitsi_link: r.jitsi_link,
              sede_indirizzo: r.sede_indirizzo,
              temi: r.temi,
              descrizione: r.descrizione,
              urgenza: r.urgenza || 3,
              importanza: r.importanza || 3,
              organizzatore_nome: r.creato_da_nome,
              creato_da_nome: r.creato_da_nome,
              creato_da_tipo: r.creato_da_tipo,
              partecipante_stato: r.partecipante_stato,
              token: r.token,
              partecipanti_count: r.partecipanti?.length || 0,
            }));
        }
      }

      setInviti(pendenti);
    } catch { /* ignore */ }
  }, [userIdentity, dismissedTokens]);

  // Avvia polling ogni 20 secondi (solo quando userIdentity è disponibile)
  useEffect(() => {
    if (!userIdentity) return;
    fetchInviti();
    pollRef.current = setInterval(fetchInviti, 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchInviti, userIdentity]);

  // Rispondi all'invito
  const rispondi = async (token: string, azione: 'accetta' | 'rifiuta') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/a99x/invito/${token}/${azione}?confirmed=1`);
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
    ? new Date(inv.data_inizio).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* Card flottante angolo alto-destra — z-[99998] per stare sotto SpuntaNotifier ma sopra tutto il resto */}
      <div 
        className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-[99998] w-[calc(100vw-1rem)] sm:w-[380px] max-w-[400px] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-2xl border-2 ${colorScheme.border} shadow-2xl ${colorScheme.glow} overflow-hidden ${colorScheme.pulse}`}
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
            <div className="flex gap-1">
              {inviti.length > 1 && (
                <>
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
                </>
              )}
              {/* X rimossa v10.26.0: il popup resta visibile finché l'utente non accetta o rifiuta */}
            </div>
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
            {(inv.organizzatore_nome || inv.creato_da_nome) && (
              <div className="flex items-center gap-2 text-[#e8fbff]/70 text-xs">
                <Users className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0" />
                <span>Da: <strong className="text-[#e8fbff]">{inv.organizzatore_nome || inv.creato_da_nome}</strong></span>
              </div>
            )}
            {inv.creato_da_tipo && (
              <div className="flex items-center gap-2 text-[#e8fbff]/50 text-[10px] ml-5">
                <span>Settore: <strong className="text-[#e8fbff]/70">{inv.creato_da_tipo === 'PA' ? 'Pubblica Amministrazione' : inv.creato_da_tipo}</strong></span>
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

          {/* Link Jitsi se disponibile */}
          {inv.jitsi_link && (
            <a
              href={inv.jitsi_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-1.5 bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs font-medium rounded-lg border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/30 transition-all"
            >
              🎥 Apri Videoconferenza Jitsi
            </a>
          )}
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
