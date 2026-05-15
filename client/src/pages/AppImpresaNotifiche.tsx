/**
 * App Impresa - Gestione Notifiche
 * Pagina dedicata per visualizzare e gestire le notifiche ricevute dall'impresa
 * Può essere integrata nell'app DMS per ambulanti o come pagina web per negozianti
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Bell,
  BellRing,
  Mail,
  MailOpen,
  Send,
  Calendar,
  Clock,
  Building2,
  GraduationCap,
  Landmark,
  CheckCircle,
  Archive,
  MessageSquare,
  ArrowLeft,
  User,
  Users,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  FileText,
  Briefcase,
  ChevronRight,
  Download,
  ExternalLink,
  Wallet,
  FileCheck,
  CreditCard,
  PenTool,
  Upload,
  Loader2,
  CheckCircle2,
  Video,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authenticatedFetch } from "@/hooks/useImpersonation";

// Tipo notifica
interface Notifica {
  id: number;
  mittente_id: number;
  mittente_tipo: string;
  mittente_nome: string;
  titolo: string;
  messaggio: string;
  tipo_messaggio: string;
  data_invio: string;
  id_conversazione: number | null;
  target_tipo: string;
  target_nome: string;
  destinatario_id: number;
  stato: string;
  data_lettura: string | null;
  link_riferimento: string | null;
}

export default function AppImpresaNotifiche() {
  const [, setLocation] = useLocation();
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [notificaSelezionata, setNotificaSelezionata] =
    useState<Notifica | null>(null);
  const [nonLette, setNonLette] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"tutte" | "non_lette" | "lette">(
    "tutte"
  );
  // v3.73.1: Ripristinato filtroTipo per vedere Tutti/Ricevuti/Inviati
  const [filtroTipo, setFiltroTipo] = useState<
    "tutti" | "ricevuti" | "inviati"
  >("ricevuti");
  const [messaggiInviati, setMessaggiInviati] = useState<any[]>([]);
  const [rispostaText, setRispostaText] = useState("");
  const [invioRisposta, setInvioRisposta] = useState(false);
  const [uploadingFirmato, setUploadingFirmato] = useState(false);
  const [firmatoSuccess, setFirmatoSuccess] = useState(false);
  const [invRiunioneStato, setInvRiunioneStato] = useState<string | null>(null);
  const [invRiunioneLink, setInvRiunioneLink] = useState<string>('');
  const [invRiunioneScaduta, setInvRiunioneScaduta] = useState(false);
  // v10.30.3b: Dismissal persistente per notifiche — le notifiche dismissate non riappaiono dopo polling
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('a99x_dismissed_notifiche_impresa');
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });
  const firmatoFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // v10.25.0: Stato persistente - legge da più fonti di storage (come InvitoNotifier e DashboardImpresa)
  const getImpresaData = () => {
    // 1. Prova sessionStorage impersonation
    try {
      const impStr = sessionStorage.getItem('miohub_impersonation');
      if (impStr) {
        const imp = JSON.parse(impStr);
        if (imp.impresaId) {
          return { id: imp.impresaId, nome: imp.impresaNome || 'Impresa', email: imp.impresaEmail || '' };
        }
      }
    } catch {}
    // 2. Prova localStorage user (legacy)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.impresa_id || user.email) {
          return {
            id: user.impresa_id || null,
            nome: user.impresa_nome || user.name || 'Impresa',
            email: user.email || user.impresa_email || user.username || '',
          };
        }
      }
    } catch {}
    // 3. Prova miohub_firebase_user
    try {
      const fbStr = localStorage.getItem('miohub_firebase_user');
      if (fbStr) {
        const fb = JSON.parse(fbStr);
        if (fb.impresa_id || fb.email) {
          return {
            id: fb.impresa_id || null,
            nome: fb.impresa_nome || fb.displayName || 'Impresa',
            email: fb.email || '',
          };
        }
      }
    } catch {}
    // 4. Prova URL params
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('impresa_id');
    const urlEmail = params.get('email');
    if (urlId || urlEmail) {
      return { id: urlId ? parseInt(urlId) : null, nome: 'Impresa', email: urlEmail || '' };
    }
    return { id: null, nome: 'Impresa', email: '' };
  };
  const impresaData = getImpresaData();
  const IMPRESA_ID = impresaData.id;
  const IMPRESA_NOME = impresaData.nome;
  const IMPRESA_EMAIL = impresaData.email;

  // v5.9.0: Usa MIHUB Hetzner (stesso backend dove le notifiche vengono create da ControlliSanzioniPanel)
  // In produzione usa proxy Vercel (/api/notifiche/* → mihub Hetzner), in dev URL diretto
  const API_BASE_URL = import.meta.env.DEV
    ? (import.meta.env.VITE_MIHUB_API_URL || "https://api.mio-hub.me") + "/api"
    : "/api";

  // Carica notifiche
  const fetchNotifiche = async () => {
    try {
      setLoading(true);
      const statoParam =
        filtro === "non_lette"
          ? "&stato=INVIATO"
          : filtro === "lette"
            ? "&stato=LETTO"
            : "";
      const response = await fetch(
        `${API_BASE_URL}/notifiche/impresa/${IMPRESA_ID}?limit=200${statoParam}`
      );
      const data = await response.json();

      if (data.success) {
        setNotifiche(data.data.notifiche || []);
        setNonLette(data.data.non_lette || 0);
      }
    } catch (error) {
      console.error("Errore caricamento notifiche:", error);
    } finally {
      setLoading(false);
    }
  };

  // v10.30.3b: Persistenza dismissal notifiche in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('a99x_dismissed_notifiche_impresa', JSON.stringify([...dismissedNotifIds]));
    } catch { /* ignore */ }
  }, [dismissedNotifIds]);

  // v10.30.3b: Helper per dismissare una notifica (non riapparirà dopo polling)
  const dismissNotifica = (notificaId: number) => {
    setDismissedNotifIds(prev => new Set([...prev, notificaId]));
    // Se la notifica dismissata è quella selezionata, deselezionala
    if (notificaSelezionata?.id === notificaId) {
      setNotificaSelezionata(null);
    }
  };

  useEffect(() => {
    fetchNotifiche();
    // Fetch messaggi inviati dall'impresa (risposte)
    fetch(`${API_BASE_URL}/notifiche/risposte`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          // Filtra solo i messaggi inviati da questa impresa
          const inviatiDaImpresa = data.data.filter(
            (m: any) => m.mittente_tipo === "IMPRESA"
          );
          setMessaggiInviati(inviatiDaImpresa);
        }
      })
      .catch(err => console.error("Messaggi inviati fetch error:", err));
    // Polling ogni 30 secondi per nuove notifiche
    const interval = setInterval(fetchNotifiche, 30000);
    return () => clearInterval(interval);
  }, [filtro]);

  // Segna come letta
  const segnaComeLetta = async (notifica: Notifica) => {
    if (notifica.stato === "LETTO") return;

    try {
      await authenticatedFetch(
        `${API_BASE_URL}/notifiche/leggi/${notifica.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ impresa_id: IMPRESA_ID }),
        }
      );

      // Aggiorna stato locale
      setNotifiche(prev =>
        prev.map(n =>
          n.id === notifica.id
            ? { ...n, stato: "LETTO", data_lettura: new Date().toISOString() }
            : n
        )
      );
      setNonLette(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Errore aggiornamento lettura:", error);
    }
  };

  // Invia risposta
  const inviaRisposta = async (tipoRisposta: string = "RISPOSTA") => {
    if (!notificaSelezionata || !rispostaText.trim()) return;

    setInvioRisposta(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/notifiche/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifica_originale_id: notificaSelezionata.id,
            impresa_id: IMPRESA_ID,
            impresa_nome: IMPRESA_NOME,
            messaggio: rispostaText,
            tipo_risposta: tipoRisposta,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setRispostaText("");
        alert("Risposta inviata con successo!");
        fetchNotifiche();
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      alert("Errore invio risposta");
    } finally {
      setInvioRisposta(false);
    }
  };

  // Archivia notifica
  const archiviaNotifica = async (notifica: Notifica) => {
    try {
      await authenticatedFetch(
        `${API_BASE_URL}/notifiche/archivia/${notifica.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ impresa_id: IMPRESA_ID }),
        }
      );

      setNotifiche(prev => prev.filter(n => n.id !== notifica.id));
      if (notificaSelezionata?.id === notifica.id) {
        setNotificaSelezionata(null);
      }
    } catch (error) {
      console.error("Errore archiviazione:", error);
    }
  };

  // Estrai ID pratica dal link_riferimento della notifica
  const extractPraticaId = (link: string | null): string | null => {
    if (!link) return null;
    // Formato: https://api.mio-hub.me/api/suap/pratiche/:id/download-pdf
    const match = link.match(/\/pratiche\/([a-f0-9-]+)\//i);
    return match ? match[1] : null;
  };

  // Upload PDF firmato dall'impresa
  const handleUploadFirmato = async (file: File) => {
    if (!notificaSelezionata) return;
    const praticaId = extractPraticaId(notificaSelezionata.link_riferimento);
    if (!praticaId) {
      alert('Errore: impossibile identificare la pratica dal link.');
      return;
    }

    setUploadingFirmato(true);
    setFirmatoSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (IMPRESA_ID) formData.append('impresa_id', String(IMPRESA_ID));

      // Usa API_BASE_URL + authenticatedFetch come tutte le altre chiamate
      const uploadUrl = `${API_BASE_URL}/suap/pratiche/${praticaId}/upload-firmato`;

      const response = await authenticatedFetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setFirmatoSuccess(true);
        alert(
          `PDF firmato caricato con successo!\n\n` +
          `Tipo firma: ${data.data?.tipo_firma || 'N/D'}\n` +
          `Stato: ${data.data?.firma_stato || 'SIGNED'}\n\n` +
          `La pratica è stata aggiornata. L'associazione e il SUAP riceveranno una notifica.`
        );
      } else {
        alert('Errore nel caricamento: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (error: any) {
      console.error('Errore upload firmato:', error);
      alert('Errore di rete nel caricamento del PDF firmato. Riprova.');
    } finally {
      setUploadingFirmato(false);
    }
  };

  // Icona mittente
  const getMittenteIcon = (tipo: string) => {
    switch (tipo) {
      case "ENTE_FORMATORE":
        return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case "ASSOCIAZIONE":
        return <Landmark className="w-5 h-5 text-emerald-400" />;
      case "PA":
        return <Building2 className="w-5 h-5 text-purple-400" />;
      default:
        return <Mail className="w-5 h-5 text-gray-400" />;
    }
  };

  // Colore tipo messaggio
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "INFORMATIVA":
        return "bg-blue-500/20 text-blue-400";
      case "PROMOZIONALE":
        return "bg-emerald-500/20 text-emerald-400";
      case "URGENTE":
        return "bg-red-500/20 text-red-400";
      case "ALLERTA_ANOMALIA":
        return "bg-red-500/20 text-red-400";
      case "RICHIESTA_SERVIZIO":
        return "bg-purple-500/20 text-purple-400";
      case "CONFERMA_PAGAMENTO":
        return "bg-green-500/20 text-green-400";
      case "ISCRIZIONE_CORSO":
        return "bg-blue-500/20 text-blue-400";
      case "ATTESTATO_RILASCIATO":
        return "bg-green-500/20 text-green-400";
      case "RINNOVO_TESSERA":
        return "bg-orange-500/20 text-orange-400";
      case "NOTIFICA_VERBALE":
        return "bg-red-500/20 text-red-400";
      case "RICHIESTA_FIRMA":
        return "bg-violet-500/20 text-violet-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Icona tipo messaggio
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ALLERTA_ANOMALIA":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "RICHIESTA_SERVIZIO":
        return <Briefcase className="w-4 h-4 text-purple-400" />;
      case "CONFERMA_PAGAMENTO":
        return <Wallet className="w-4 h-4 text-green-400" />;
      case "ISCRIZIONE_CORSO":
        return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case "ATTESTATO_RILASCIATO":
        return <FileCheck className="w-4 h-4 text-green-400" />;
      case "RINNOVO_TESSERA":
        return <CreditCard className="w-4 h-4 text-orange-400" />;
      case "RICHIESTA_FIRMA":
        return <PenTool className="w-4 h-4 text-violet-400" />;
      case "NOTIFICA_VERBALE":
        return <FileText className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const isNotificaCorso = (notifica: Notifica | null) => {
    if (!notifica) return false;
    return (
      notifica.target_tipo === "CORSO" ||
      notifica.tipo_messaggio === "ISCRIZIONE_CORSO" ||
      notifica.mittente_tipo === "ENTE_FORMATORE" ||
      /corso/i.test(notifica.titolo || "")
    );
  };

  const normalizzaLinkCorso = (link: string | null) => {
    if (!link) return null;
    let raw = link.trim();
    if (!raw) return null;
    // Fix v10.30.4: gestire il caso in cui link_riferimento sia un oggetto JSON stringificato
    // (bug pre-fix dove generaLinkCorso ritornava l'intero oggetto)
    if (raw === '[object Object]') return null;
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.link) raw = parsed.link;
        else return null;
      } catch { /* non è JSON, procedi normalmente */ }
    }
    // Rimuovere eventuale prefisso "https://{" che indica un oggetto serializzato male
    if (raw.startsWith('https://{') || raw.startsWith('http://{')) {
      try {
        const jsonPart = raw.replace(/^https?:\/\//, '');
        const parsed = JSON.parse(jsonPart);
        if (parsed && parsed.link) raw = parsed.link;
        else return null;
      } catch { /* non è JSON, procedi normalmente */ }
    }
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(withProtocol);
      if (IMPRESA_EMAIL) {
        if (url.hostname.includes("meet.google.com")) {
          url.searchParams.set("authuser", IMPRESA_EMAIL);
        } else if (!url.searchParams.has("email")) {
          url.searchParams.set("email", IMPRESA_EMAIL);
        }
      }
      return url.toString();
    } catch {
      return withProtocol;
    }
  };

  const apriLinkCorso = (notifica: Notifica) => {
    const corsoUrl = normalizzaLinkCorso(notifica.link_riferimento);
    if (!corsoUrl) {
      alert("Nessun link corso allegato a questa notifica. Contatta l'associazione o l'ente formatore.");
      return;
    }
    window.open(corsoUrl, "_blank", "noopener,noreferrer");
  };

  // Componente inline per la sezione "Le Mie Riunioni"
  const MieRiunioniSection = ({ email, nascosta }: { email: string; nascosta: boolean }) => {
    const [riunioni, setRiunioni] = useState<any[]>([]);
    const [loadingR, setLoadingR] = useState(true);
    // v10.30.3: Dismissal persistente in localStorage per riunioni ignorate
    const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => {
      try {
        const saved = localStorage.getItem('a99x_dismissed_riunioni_impresa');
        if (saved) return new Set(JSON.parse(saved));
      } catch { /* ignore */ }
      return new Set();
    });

    // Salva dismissedIds in localStorage quando cambia
    useEffect(() => {
      try {
        localStorage.setItem('a99x_dismissed_riunioni_impresa', JSON.stringify([...dismissedIds]));
      } catch { /* ignore */ }
    }, [dismissedIds]);

    const fetchRiunioni = async () => {
      if (!email) { setLoadingR(false); return; }
      try {
        const res = await fetch(`https://api.miohub.it/api/a99x/le-mie-riunioni?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success) setRiunioni(data.data || []);
      } catch (err) { console.error('Errore fetch riunioni:', err); }
      finally { setLoadingR(false); }
    };

    useEffect(() => {
      fetchRiunioni();
      const interval = setInterval(fetchRiunioni, 20000);
      return () => clearInterval(interval);
    }, [email]);

    // v10.30.3: Helper per calcolo isScaduta robusto
    const isRiunioneScaduta = (r: any): boolean => {
      // Check stato non attivo
      if (['ANNULLATA', 'COMPLETATA', 'RIPROGRAMMATA'].includes(r.stato)) return true;
      // Check data fine
      const now = Date.now();
      if (r.data_fine) {
        return new Date(r.data_fine).getTime() <= now;
      }
      if (r.data_inizio) {
        const dataFine = new Date(new Date(r.data_inizio).getTime() + (r.durata_minuti || 30) * 60000);
        return dataFine.getTime() <= now;
      }
      return false;
    };

    // Filtra riunioni: escludi dismissate e riunioni scadute dalla lista attiva
    const riunioniVisibili = riunioni.filter(r => !dismissedIds.has(r.id));

    if (!email || (riunioniVisibili.length === 0 && !loadingR)) return null;

    return (
      <div className={`mt-4 sm:mt-6 ${nascosta ? 'hidden sm:block' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#e8fbff] flex items-center gap-2">
            <Video className="w-5 h-5 text-[#8b5cf6]" />
            Le Mie Riunioni PA
          </h2>
          <button onClick={fetchRiunioni} className="px-3 py-1.5 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg text-[10px] font-medium hover:bg-[#8b5cf6]/30 transition-all flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${loadingR ? 'animate-spin' : ''}`} /> Aggiorna
          </button>
        </div>
        {loadingR ? (
          <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6] mx-auto" /></div>
        ) : (
          <div className="space-y-4">
            {riunioniVisibili.map((r: any) => {
              const partecipanti = r.partecipanti || [];
              const confermati = partecipanti.filter((p: any) => p.stato === 'CONFERMATO').length;
              const rifiutati = partecipanti.filter((p: any) => p.stato === 'RIFIUTATO').length;
              const inAttesa = partecipanti.filter((p: any) => p.stato === 'INVITATO').length;
              const totale = partecipanti.length;
              const percentuale = totale > 0 ? Math.round((confermati / totale) * 100) : 0;
              const dataR = r.data_inizio ? new Date(r.data_inizio).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/D';
              const mioStatoColors: Record<string, string> = {
                'CONFERMATO': 'bg-green-500/20 text-green-400 border-green-500/30',
                'RIFIUTATO': 'bg-red-500/20 text-red-400 border-red-500/30',
                'INVITATO': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
              };
              // v10.30.3: Calcolo isScaduta robusto (usa data_fine, fallback data_inizio + durata, check stato)
              const isScaduta = isRiunioneScaduta(r);
              return (
                <Card key={r.id} className={`bg-[#1a2332] ${isScaduta ? 'border-[#e8fbff]/10 opacity-60' : 'border-[#8b5cf6]/20'} relative`}>
                  <CardContent className="p-4">
                    {/* v10.30.3: Pulsante dismiss per nascondere la riunione */}
                    {isScaduta && (
                      <button
                        onClick={() => setDismissedIds(prev => new Set([...prev, r.id]))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#e8fbff]/10 hover:bg-[#e8fbff]/20 flex items-center justify-center text-[#e8fbff]/40 hover:text-[#e8fbff]/70 transition-all"
                        title="Nascondi riunione conclusa"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Header riunione */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{isScaduta ? '\u23F0' : '\uD83D\uDCC5'}</span>
                        <div className="min-w-0">
                          <h4 className="text-[#e8fbff] font-semibold text-sm truncate">{r.titolo || 'Riunione'}</h4>
                          <p className="text-[#e8fbff]/40 text-[10px]">{dataR}{isScaduta ? ' (conclusa)' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[9px] ${mioStatoColors[r.mio_stato] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {r.mio_stato === 'CONFERMATO' ? 'Accettato' : r.mio_stato === 'RIFIUTATO' ? 'Rifiutato' : 'In attesa'}
                        </Badge>
                        {r.jitsi_link && !isScaduta && (
                          <a href={r.jitsi_link} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#14b8a6]/20 border border-[#14b8a6]/30 text-[#14b8a6] rounded text-[10px] font-medium hover:bg-[#14b8a6]/30 transition-all">🌐 Jitsi</a>
                        )}
                      </div>
                    </div>
                    {/* Pulsanti ACCETTA / RIFIUTA se stato è INVITATO e c'è il token e non scaduta */}
                    {!isScaduta && (r.mio_stato === 'INVITATO' || r.partecipante_stato === 'INVITATO') && r.token && (
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`https://api.miohub.it/api/a99x/invito/${r.token}/accetta`);
                              if (res.ok) fetchRiunioni();
                            } catch {}
                          }}
                          className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          ✅ ACCETTA
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`https://api.miohub.it/api/a99x/invito/${r.token}/rifiuta`);
                              if (res.ok) fetchRiunioni();
                            } catch {}
                          }}
                          className="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-800 active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          ❌ RIFIUTA
                        </button>
                      </div>
                    )}
                    {/* Barra progresso conferme */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#e8fbff]/50 text-[10px]">Conferme: {confermati}/{totale}</span>
                        <span className="text-[#e8fbff]/50 text-[10px]">{percentuale}%</span>
                      </div>
                      <div className="w-full bg-[#0b1220] rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${totale > 0 ? ((confermati + rifiutati) / totale) * 100 : 0}%`, background: `linear-gradient(to right, #22c55e ${totale > 0 ? (confermati / (confermati + rifiutati || 1)) * 100 : 0}%, #ef4444 0%)` }}></div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span className="text-green-400">{confermati} confermati</span></span>
                        <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span><span className="text-red-400">{rifiutati} rifiutati</span></span>
                        <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span><span className="text-yellow-400">{inAttesa} in attesa</span></span>
                      </div>
                    </div>
                    {/* Lista partecipanti */}
                    <div className="space-y-1.5">
                      {partecipanti.map((p: any, idx: number) => {
                        const statoConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
                          'CONFERMATO': { bg: 'bg-green-500/15 border-green-500/30', text: 'text-green-400', icon: '✅', label: 'Confermato' },
                          'RIFIUTATO': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: '❌', label: 'Rifiutato' },
                          'INVITATO': { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', icon: '⏳', label: 'In attesa' },
                        };
                        const cfg = statoConfig[p.stato] || statoConfig['INVITATO'];
                        const tipoConfig: Record<string, { color: string; label: string }> = {
                          'IMPRESA': { color: 'text-[#14b8a6]', label: 'Impresa' },
                          'ASSOCIAZIONE': { color: 'text-[#f59e0b]', label: 'Associazione' },
                          'ASSESSORE': { color: 'text-[#8b5cf6]', label: 'Assessore' },
                        };
                        const tipoCfg = tipoConfig[p.tipo] || { color: 'text-[#e8fbff]/50', label: p.tipo };
                        return (
                          <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${cfg.bg} transition-all`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{cfg.icon}</span>
                              <span className="text-[#e8fbff] text-xs font-medium truncate">{p.nome}</span>
                              <Badge className={`text-[8px] ${tipoCfg.color} bg-transparent border-current/30`}>{tipoCfg.label}</Badge>
                            </div>
                            <span className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8fbff]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-b border-[#3b82f6]/20 p-2 sm:p-4">
        <div className="w-full sm:px-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (notificaSelezionata && window.innerWidth < 640) {
                setNotificaSelezionata(null);
              } else {
                setLocation("/");
              }
            }}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff] px-1 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {notificaSelezionata ? "Torna alla lista" : "Torna alla Home"}
            </span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-[#e8fbff]">
                Notifiche
              </h1>
              <p className="text-xs sm:text-sm text-[#e8fbff]/50 truncate max-w-[120px] sm:max-w-none">
                {IMPRESA_NOME}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {nonLette > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                {nonLette}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifiche}
              className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10 px-2 sm:px-3"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline ml-2">Aggiorna</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-1 sm:px-2 py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
          {/* Lista Notifiche - nascosta su mobile quando c'è dettaglio selezionato */}
          <div
            className={`lg:col-span-1 ${notificaSelezionata ? "hidden sm:block" : ""}`}
          >
            <Card className="bg-[#1a2332] border-[#3b82f6]/20 py-0 sm:py-6 gap-0 sm:gap-6 rounded-none sm:rounded-xl border-x-0 sm:border-x">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#e8fbff] text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#3b82f6]" />
                    Messaggi
                  </CardTitle>
                  <select
                    value={filtro}
                    onChange={e => setFiltro(e.target.value as any)}
                    className="bg-[#0b1220] border border-[#3b82f6]/30 rounded px-2 py-1 text-sm text-[#e8fbff]"
                  >
                    <option value="tutte">Tutte</option>
                    <option value="non_lette">Non lette</option>
                    <option value="lette">Lette</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {/* v3.73.1: Ripristinati filtri Tutti/Ricevuti/Inviati */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFiltroTipo("tutti")}
                    className={`px-3 py-1 rounded-full text-sm ${filtroTipo === "tutti" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setFiltroTipo("ricevuti")}
                    className={`px-3 py-1 rounded-full text-sm ${filtroTipo === "ricevuti" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                  >
                    Ricevuti ({notifiche.filter(n => !dismissedNotifIds.has(n.id)).length})
                  </button>
                  <button
                    onClick={() => setFiltroTipo("inviati")}
                    className={`px-3 py-1 rounded-full text-sm ${filtroTipo === "inviati" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                  >
                    Inviati ({messaggiInviati.length})
                  </button>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {loading ? (
                    <div className="text-center py-8 text-[#e8fbff]/50">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>Caricamento...</p>
                    </div>
                  ) : (
                    <>
                      {/* Messaggi Ricevuti — v10.30.3b: filtra notifiche dismissate */}
                      {(filtroTipo === "tutti" || filtroTipo === "ricevuti") &&
                        notifiche.filter(n => !dismissedNotifIds.has(n.id)).map(notifica => (
                          <div
                            key={`ric-${notifica.id}`}
                            onClick={() => {
                              setNotificaSelezionata(notifica);
                              setInvRiunioneStato('LOADING');
                              setInvRiunioneLink('');
                              setInvRiunioneScaduta(false);
                              segnaComeLetta(notifica);
                              // Se INVITO_RIUNIONE, carica lo stato reale dal backend
                              if (notifica.tipo_messaggio === 'INVITO_RIUNIONE' && IMPRESA_EMAIL) {
                                fetch(`https://api.miohub.it/api/a99x/le-mie-riunioni?email=${encodeURIComponent(IMPRESA_EMAIL)}`)
                                  .then(r => r.json())
                                  .then(data => {
                                    if (data.success && data.data) {
                                      // Match migliorato: cerca per titolo nel messaggio, con fallback fuzzy
                                      const msg = (notifica.messaggio || '').toLowerCase();
                                      const titolo = (notifica.titolo || '').toLowerCase();
                                      let riunione = data.data.find((r: any) => {
                                        const rTitolo = (r.titolo || '').toLowerCase();
                                        return msg.includes(rTitolo) || titolo.includes(rTitolo);
                                      });
                                      // Fallback: cerca per titolo nella notifica (es. "Invito Riunione: TITOLO")
                                      if (!riunione) {
                                        const match = (notifica.titolo || '').match(/Invito Riunione:\s*(.+)/i);
                                        if (match) {
                                          const titoloRiunione = match[1].trim().toLowerCase();
                                          riunione = data.data.find((r: any) => (r.titolo || '').toLowerCase() === titoloRiunione);
                                        }
                                      }
                                      if (riunione) {
                                        // v10.30.3: Check se riunione è scaduta/annullata
                                        const nowMs = Date.now();
                                        const dataFine = riunione.data_fine
                                          ? new Date(riunione.data_fine)
                                          : new Date(new Date(riunione.data_inizio).getTime() + (riunione.durata_minuti || 30) * 60000);
                                        const isStatoNonAttivo = ['ANNULLATA', 'COMPLETATA', 'RIPROGRAMMATA'].includes(riunione.stato);
                                        if (isStatoNonAttivo || dataFine.getTime() <= nowMs) {
                                          setInvRiunioneScaduta(true);
                                          setInvRiunioneStato(riunione.mio_stato || 'INVITATO');
                                        } else {
                                          setInvRiunioneScaduta(false);
                                          setInvRiunioneStato(riunione.mio_stato || 'INVITATO');
                                        }
                                        if (riunione.mio_stato === 'CONFERMATO') {
                                          setInvRiunioneLink(riunione.jitsi_link || '');
                                        }
                                      } else {
                                        // v10.30.3b: Riunione non trovata nel backend → trattare come scaduta
                                        // (la riunione potrebbe essere stata cancellata o il titolo non matcha)
                                        setInvRiunioneScaduta(true);
                                        setInvRiunioneStato('NON_TROVATA');
                                      }
                                    } else {
                                      // v10.30.3b: Backend non ha dati → trattare come scaduta
                                      setInvRiunioneScaduta(true);
                                      setInvRiunioneStato('NON_TROVATA');
                                    }
                                  }).catch(() => {
                                    // v10.30.3b: Errore fetch → trattare come scaduta per sicurezza
                                    setInvRiunioneScaduta(true);
                                    setInvRiunioneStato('NON_TROVATA');
                                  });
                              } else if (notifica.tipo_messaggio === 'INVITO_RIUNIONE') {
                                // v10.30.3b: IMPRESA_EMAIL vuota ma è un invito riunione → trattare come scaduta
                                setInvRiunioneScaduta(true);
                                setInvRiunioneStato('NON_TROVATA');
                              } else {
                                setInvRiunioneStato(null);
                              }
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              notificaSelezionata?.id === notifica.id
                                ? "bg-[#3b82f6]/20 border border-[#3b82f6]/50"
                                : notifica.stato === "INVIATO"
                                  ? "bg-[#0b1220] border border-[#3b82f6]/30 hover:border-[#3b82f6]/50"
                                  : "bg-[#0b1220]/50 border border-transparent hover:border-[#3b82f6]/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {notifica.stato === "INVIATO" ? (
                                  <BellRing className="w-4 h-4 text-[#3b82f6]" />
                                ) : (
                                  <MailOpen className="w-4 h-4 text-[#e8fbff]/30" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getMittenteIcon(notifica.mittente_tipo)}
                                  <span className="text-sm font-medium truncate">
                                    {notifica.mittente_nome}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm truncate ${notifica.stato === "INVIATO" ? "font-semibold" : ""}`}
                                >
                                  {notifica.titolo}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={`text-xs ${getTipoColor(notifica.tipo_messaggio)}`}
                                  >
                                    {notifica.tipo_messaggio}
                                  </Badge>
                                  <span className="text-xs text-[#e8fbff]/30">
                                    {new Date(
                                      notifica.data_invio
                                    ).toLocaleDateString("it-IT", { timeZone: 'Europe/Rome' })}
                                  </span>
                                </div>
                              </div>
                              {/* v10.30.3b: Pulsante dismiss per rimuovere notifica dalla lista */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <ChevronRight className="w-4 h-4 text-[#e8fbff]/30" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotifica(notifica.id);
                                  }}
                                  className="w-5 h-5 rounded-full bg-[#e8fbff]/5 hover:bg-red-500/20 flex items-center justify-center text-[#e8fbff]/20 hover:text-red-400 transition-all ml-1"
                                  title="Rimuovi notifica"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {/* Messaggi Inviati */}
                      {(filtroTipo === "tutti" || filtroTipo === "inviati") &&
                        messaggiInviati.map((msg: any, idx: number) => (
                          <div
                            key={`inv-${idx}`}
                            className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <Send className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-emerald-400">
                                    Inviato
                                  </span>
                                  <span className="text-xs text-[#e8fbff]/50">
                                    → {msg.target_nome || msg.mittente_nome}
                                  </span>
                                </div>
                                <p className="text-sm truncate">{msg.titolo}</p>
                                <p className="text-xs text-[#e8fbff]/60 mt-1 line-clamp-2">
                                  {msg.messaggio}
                                </p>
                                <span className="text-xs text-[#e8fbff]/30">
                                  {new Date(msg.created_at).toLocaleDateString(
                                    "it-IT", { timeZone: 'Europe/Rome' }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      {/* Empty states */}
                      {filtroTipo === "ricevuti" && notifiche.length === 0 && (
                        <div className="text-center py-8 text-[#e8fbff]/50">
                          <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Nessun messaggio ricevuto</p>
                        </div>
                      )}
                      {filtroTipo === "inviati" &&
                        messaggiInviati.length === 0 && (
                          <div className="text-center py-8 text-[#e8fbff]/50">
                            <Send className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio inviato</p>
                          </div>
                        )}
                      {filtroTipo === "tutti" &&
                        notifiche.length === 0 &&
                        messaggiInviati.length === 0 && (
                          <div className="text-center py-8 text-[#e8fbff]/50">
                            <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio</p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dettaglio Notifica - su mobile occupa tutto lo schermo */}
          <div
            className={`lg:col-span-2 overflow-hidden min-w-0 ${!notificaSelezionata ? "hidden sm:block" : ""}`}
          >
            {notificaSelezionata ? (
              <Card className="bg-[#1a2332] border-[#3b82f6]/20 py-0 sm:py-6 gap-0 sm:gap-6 rounded-none sm:rounded-xl border-x-0 sm:border-x overflow-hidden max-w-full">
                <CardHeader className="px-3 sm:px-6">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">{getMittenteIcon(notificaSelezionata.mittente_tipo)}</div>
                      <div className="min-w-0">
                        <CardTitle className="text-[#e8fbff] text-sm sm:text-base truncate">
                          {notificaSelezionata.titolo}
                        </CardTitle>
                        <CardDescription className="text-[#e8fbff]/50 text-xs truncate">
                          Da: {notificaSelezionata.mittente_nome} •{" "}
                          {new Date(
                            notificaSelezionata.data_invio
                          ).toLocaleString("it-IT", { timeZone: 'Europe/Rome' })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge
                        className={`text-[10px] sm:text-xs ${getTipoColor(
                          notificaSelezionata.tipo_messaggio
                        )}`}
                      >
                        {notificaSelezionata.tipo_messaggio.replace('RICHIESTA_', 'R.')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiviaNotifica(notificaSelezionata)}
                        className="text-[#e8fbff]/50 hover:text-[#e8fbff] px-1 sm:px-2"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-2 sm:px-6 overflow-hidden">
                  {/* Messaggio */}
                  <div className="bg-[#0b1220] rounded-lg p-3 sm:p-4 border border-[#3b82f6]/10 overflow-hidden">
                    <div className="prose prose-invert max-w-none break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {notificaSelezionata.messaggio
                        .split("\n")
                        .map((line, idx) => (
                          <p key={idx} className="text-[#e8fbff]/80 mb-2 text-sm sm:text-base break-words" style={{ overflowWrap: 'anywhere' }}>
                            {line.startsWith("**") && line.endsWith("**") ? (
                              <strong>{line.replace(/\*\*/g, "")}</strong>
                            ) : line.startsWith("- ") ? (
                              <span className="flex items-start gap-2">
                                <span className="text-[#3b82f6] flex-shrink-0">•</span>
                                <span className="break-words" style={{ overflowWrap: 'anywhere' }}>{line.substring(2)}</span>
                              </span>
                            ) : (
                              line
                            )}
                          </p>
                        ))}
                    </div>
                  </div>

                  {/* Bottone Visualizza Verbale per notifiche NOTIFICA_VERBALE */}
                  {notificaSelezionata.tipo_messaggio === "NOTIFICA_VERBALE" &&
                    notificaSelezionata.link_riferimento && (
                      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[#e8fbff] font-medium text-sm sm:text-base">
                                Verbale di Contestazione
                              </p>
                              <p className="text-[#e8fbff]/50 text-xs sm:text-sm">
                                Clicca per visualizzare il documento completo
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full sm:w-auto"
                              onClick={() =>
                                window.open(
                                  notificaSelezionata.link_riferimento!,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visualizza Verbale
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Bottone Visualizza PDF da Firmare per notifiche RICHIESTA_FIRMA */}
                  {notificaSelezionata.tipo_messaggio === "RICHIESTA_FIRMA" &&
                    notificaSelezionata.link_riferimento && (
                      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-lg p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[#e8fbff] font-medium text-sm sm:text-base">
                                Firma Digitale Richiesta
                              </p>
                              <p className="text-[#e8fbff]/50 text-xs sm:text-sm">
                                Firma il PDF e caricalo qui sotto
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-0 sm:ml-13">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs sm:text-sm"
                              onClick={() =>
                                window.open(
                                  notificaSelezionata.link_riferimento!,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">Visualizza PDF</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs sm:text-sm"
                              onClick={() =>
                                window.open(
                                  notificaSelezionata.link_riferimento!,
                                  "_blank"
                                )
                              }
                            >
                              <Download className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">Scarica PDF</span>
                            </Button>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-xs text-amber-300">
                            <strong>Istruzioni:</strong> Scarica il PDF, apponi la tua firma digitale qualificata (PAdES o CAdES/.p7m), 
                            poi carica il documento firmato usando il pulsante qui sotto.
                          </div>

                          {/* UPLOAD PDF FIRMATO */}
                          <div className="bg-[#0b1220] rounded-lg p-3 border border-emerald-500/30">
                            <input
                              type="file"
                              ref={firmatoFileInputRef}
                              className="hidden"
                              accept=".pdf,.p7m,application/pdf,application/pkcs7-mime,application/octet-stream"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFirmato(file);
                                e.target.value = '';
                              }}
                            />
                            {firmatoSuccess ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-emerald-400 font-medium text-sm">PDF Firmato Caricato con Successo</p>
                                  <p className="text-emerald-300/60 text-xs">La pratica e' stata aggiornata. L'associazione e il SUAP sono stati notificati.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <Upload className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[#e8fbff] font-medium text-sm">Carica PDF Firmato</p>
                                    <p className="text-[#e8fbff]/50 text-xs">PDF firmato (.pdf) o busta CAdES (.p7m)</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                                  disabled={uploadingFirmato}
                                  onClick={() => firmatoFileInputRef.current?.click()}
                                >
                                  {uploadingFirmato ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  {uploadingFirmato ? 'Caricamento...' : 'Seleziona File Firmato'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Blocco INVITO_RIUNIONE — Conferma/Rinuncia + Partecipa Video */}
                  {notificaSelezionata.tipo_messaggio === "INVITO_RIUNIONE" && (
                    <div className="bg-gradient-to-r from-[#8b5cf6]/10 to-[#6366f1]/10 border border-[#8b5cf6]/30 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-[#8b5cf6]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#e8fbff] font-medium text-sm sm:text-base">Invito Riunione</p>
                          <p className="text-[#e8fbff]/50 text-xs sm:text-sm">{invRiunioneScaduta ? 'Questa riunione è conclusa' : 'Conferma o rifiuta la tua partecipazione'}</p>
                        </div>
                      </div>
                      {/* Loading stato */}
                      {invRiunioneStato === 'LOADING' && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-5 h-5 text-[#8b5cf6] animate-spin" />
                          <span className="text-[#e8fbff]/50 text-xs ml-2">Caricamento stato...</span>
                        </div>
                      )}
                      {/* v10.30.3b: Messaggio riunione scaduta + pulsante dismiss */}
                      {invRiunioneScaduta && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/30 rounded-lg p-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-xs font-semibold">Riunione conclusa — non è più possibile confermare o rifiutare</span>
                          </div>
                          <button
                            onClick={() => dismissNotifica(notificaSelezionata.id)}
                            className="w-full py-2 bg-[#e8fbff]/5 hover:bg-red-500/10 border border-[#e8fbff]/10 hover:border-red-500/30 text-[#e8fbff]/40 hover:text-red-400 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rimuovi questa notifica
                          </button>
                        </div>
                      )}
                      {/* Pulsanti Conferma / Rinuncia */}
                      {(invRiunioneStato === 'INVITATO' && !invRiunioneScaduta) && (
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={async () => {
                              try {
                                // Cerca il token dall'endpoint le-mie-riunioni
                                const res = await fetch(`https://api.miohub.it/api/a99x/le-mie-riunioni?email=${encodeURIComponent(IMPRESA_EMAIL)}`);
                                const data = await res.json();
                                if (data.success) {
                                  // Trova la riunione corrispondente dalla notifica
                                  const riunione = data.data?.find((r: any) => 
                                    notificaSelezionata.messaggio?.includes(r.titolo)
                                  );
                                  if (riunione?.token) {
                                    const accRes = await fetch(`https://api.miohub.it/api/a99x/invito/${riunione.token}/accetta`);
                                    if (accRes.ok) {
                                      setInvRiunioneStato('CONFERMATO');
                                      setInvRiunioneLink(riunione.jitsi_link || '');
                                    }
                                  }
                                }
                              } catch {}
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> CONFERMA
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`https://api.miohub.it/api/a99x/le-mie-riunioni?email=${encodeURIComponent(IMPRESA_EMAIL)}`);
                                const data = await res.json();
                                if (data.success) {
                                  const riunione = data.data?.find((r: any) => 
                                    notificaSelezionata.messaggio?.includes(r.titolo)
                                  );
                                  if (riunione?.token) {
                                    const rifRes = await fetch(`https://api.miohub.it/api/a99x/invito/${riunione.token}/rifiuta`);
                                    if (rifRes.ok) setInvRiunioneStato('RIFIUTATO');
                                  }
                                }
                              } catch {}
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-800 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> RINUNCIA
                          </button>
                        </div>
                      )}
                      {/* Stato confermato + Pulsante Partecipa Video */}
                      {invRiunioneStato === 'CONFERMATO' && !invRiunioneScaduta && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-xs font-semibold">Partecipazione confermata!</span>
                          </div>
                          {invRiunioneLink && (
                            <a
                              href={invRiunioneLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-3 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#8b5cf6]/30 hover:from-[#7c3aed] hover:to-[#4f46e5] active:scale-95 transition-all text-center"
                            >
                              🎥 Partecipa alla Videoconferenza
                            </a>
                          )}
                        </div>
                      )}
                      {invRiunioneStato === 'CONFERMATO' && invRiunioneScaduta && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-xs font-semibold">Avevi confermato la partecipazione</span>
                        </div>
                      )}
                      {invRiunioneStato === 'RIFIUTATO' && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 text-xs font-semibold">Hai rifiutato questo invito</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Azioni Rapide */}
                  {isNotificaCorso(notificaSelezionata) ? (
                    <div className="bg-gradient-to-r from-[#10b981]/10 to-[#3b82f6]/10 border border-[#10b981]/30 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-[#10b981]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#e8fbff] font-medium text-sm sm:text-base">Accesso al corso</p>
                            <p className="text-[#e8fbff]/50 text-xs sm:text-sm">
                              Apri il collegamento; se sul telefono è installata l'app del corso, si aprirà automaticamente, altrimenti si aprirà il browser.
                            </p>
                            {notificaSelezionata.link_riferimento && (
                              <p className="text-[#10b981]/80 text-xs mt-1 break-all">
                                {normalizzaLinkCorso(notificaSelezionata.link_riferimento)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#10b981] hover:bg-[#059669] text-white w-full sm:w-auto"
                          onClick={() => apriLinkCorso(notificaSelezionata)}
                          disabled={!notificaSelezionata.link_riferimento}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apri link corso
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        className="border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 text-sm"
                        onClick={() =>
                          setRispostaText(
                            "Vorrei richiedere un appuntamento per discutere di questo argomento."
                          )
                        }
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Appuntamento
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 text-sm"
                        onClick={() =>
                          setRispostaText(
                            "Vorrei iscrivermi al corso menzionato. Potete inviarmi maggiori dettagli?"
                          )
                        }
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Iscriviti al Corso
                      </Button>
                      <Button
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm"
                        onClick={() =>
                          setRispostaText(
                            "Vorrei richiedere il rinnovo del DURC. Potete assistirmi nella procedura?"
                          )
                        }
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Rinnovo DURC
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm"
                        onClick={() =>
                          setRispostaText(
                            "Vorrei richiedere assistenza per la pratica SCIA. Potete aiutarmi?"
                          )
                        }
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Assistenza SCIA
                      </Button>
                    </div>
                  )}

                  {/* Form Risposta */}
                  <div className="bg-[#0b1220] rounded-lg p-4 border border-[#3b82f6]/10">
                    <label className="block text-sm text-[#e8fbff]/70 mb-2">
                      Rispondi al messaggio
                    </label>
                    <textarea
                      value={rispostaText}
                      onChange={e => setRispostaText(e.target.value)}
                      rows={3}
                      placeholder="Scrivi la tua risposta..."
                      className="w-full bg-[#1a2332] border border-[#3b82f6]/30 rounded-lg p-3 text-[#e8fbff] resize-none focus:outline-none focus:border-[#3b82f6]"
                    />
                    <div className="flex justify-end mt-3 gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setRispostaText("")}
                        className="text-[#e8fbff]/50"
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={() => inviaRisposta()}
                        disabled={!rispostaText.trim() || invioRisposta}
                        className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white"
                      >
                        {invioRisposta ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Invia Risposta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1a2332] border-[#3b82f6]/20 h-full flex items-center justify-center py-0 sm:py-6 gap-0 sm:gap-6 rounded-none sm:rounded-xl border-x-0 sm:border-x">
                <CardContent className="text-center py-8 sm:py-16 px-2 sm:px-6">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-[#3b82f6]/30" />
                  <p className="text-[#e8fbff]/50 text-lg">
                    Seleziona un messaggio per visualizzarlo
                  </p>
                  <p className="text-[#e8fbff]/30 text-sm mt-2">
                    Riceverai notifiche da enti formatori, associazioni e PA
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sezione Le Mie Riunioni PA */}
        <MieRiunioniSection email={IMPRESA_EMAIL} nascosta={!!notificaSelezionata} />

        {/* Sezione Azioni Rapide */}
        <div
          className={`mt-4 sm:mt-6 ${notificaSelezionata ? "hidden sm:block" : ""}`}
        >
          <h2 className="text-lg font-semibold text-[#e8fbff] mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#3b82f6]" />
            Azioni Rapide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Card
              className="bg-[#1a2332] border-[#3b82f6]/20 hover:border-[#3b82f6]/50 cursor-pointer transition-all py-0 sm:py-6 gap-0 sm:gap-6 rounded-md sm:rounded-xl"
              onClick={() =>
                setLocation("/app/impresa/anagrafica?tab=formazione")
              }
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-[#3b82f6]" />
                <p className="text-sm font-medium">Corsi Disponibili</p>
                <p className="text-xs text-[#e8fbff]/50">
                  Visualizza e iscriviti
                </p>
              </CardContent>
            </Card>
            <Card
              className="bg-[#1a2332] border-[#10b981]/20 hover:border-[#10b981]/50 cursor-pointer transition-all py-0 sm:py-6 gap-0 sm:gap-6 rounded-md sm:rounded-xl"
              onClick={() => setLocation("/app/impresa/anagrafica?tab=servizi")}
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#10b981]" />
                <p className="text-sm font-medium">Bandi Aperti</p>
                <p className="text-xs text-[#e8fbff]/50">
                  Opportunità di finanziamento
                </p>
              </CardContent>
            </Card>
            <Card
              className="bg-[#1a2332] border-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 cursor-pointer transition-all py-0 sm:py-6 gap-0 sm:gap-6 rounded-md sm:rounded-xl"
              onClick={() => {
                if (notificaSelezionata) {
                  setRispostaText(
                    "Vorrei prenotare un appuntamento. Potete indicarmi le disponibilità?"
                  );
                } else {
                  setLocation("/app/impresa/anagrafica?tab=associazione");
                }
              }}
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-[#8b5cf6]" />
                <p className="text-sm font-medium">Prenota Appuntamento</p>
                <p className="text-xs text-[#e8fbff]/50">Con l'associazione</p>
              </CardContent>
            </Card>
            <Card
              className="bg-[#1a2332] border-[#f59e0b]/20 hover:border-[#f59e0b]/50 cursor-pointer transition-all py-0 sm:py-6 gap-0 sm:gap-6 rounded-md sm:rounded-xl"
              onClick={() =>
                setLocation("/app/impresa/anagrafica?tab=qualificazioni")
              }
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#f59e0b]" />
                <p className="text-sm font-medium">Stato Regolarità</p>
                <p className="text-xs text-[#e8fbff]/50">
                  DURC, SCIA, Attestati
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
