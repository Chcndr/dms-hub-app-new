/**
 * NotificheAssociazionePanel - Notifiche SUAP inviate e ricevute dall'associazione
 *
 * Layout identico al NotificationManager SUAP (pannello Messaggi del Comune):
 * - Righe compatte con icona cerchio, nome destinatario/mittente, badge tipo, preview, data
 * - Modal dettaglio al click
 * - Filtri Tutti / Inviati / Ricevuti
 *
 * Endpoint backend:
 *   GET /api/associazioni/:id/notifiche → lista notifiche
 *   PUT /api/associazioni/:id/notifiche/:notificaId/letta → segna come letta
 *   PUT /api/associazioni/:id/notifiche/lette-tutte → segna tutte come lette
 */

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  MailOpen,
  Send,
  MessageSquare,
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  Users,
  X,
  BookOpen,
  Link as LinkIcon,
  MapPin,
  Settings,
  FileText,
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
import {
  getImpersonationParams,
  authenticatedFetch,
} from "@/hooks/useImpersonation";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { formatDateTime as formatDate } from "@/lib/formatUtils";
import { apiFetch } from "@/lib/apiFetch";

const API_BASE_URL = MIHUB_API_BASE_URL;

interface NotificaAssociazione {
  id: number;
  associazione_id?: number;
  target_id?: number;
  target_tipo?: string;
  target_nome?: string;
  pratica_id?: number;
  tipo: string;
  tipo_messaggio?: string;
  titolo?: string;
  oggetto?: string;
  messaggio: string;
  mittente_tipo?: string;
  mittente_nome?: string;
  mittente_id?: number;
  letta: boolean;
  data_invio?: string;
  created_at: string;
  direzione?: string;
  totale_destinatari?: number;
  letti?: number;
  non_letti?: number;
}

interface CorsoAssociazione {
  id: number;
  titolo: string;
  sede?: string;
}

interface NotificheAssociazionePanelProps {
  onNotificheUpdate?: () => void;
}

export default function NotificheAssociazionePanel({
  onNotificheUpdate,
}: NotificheAssociazionePanelProps) {
  const [notifiche, setNotifiche] = useState<NotificaAssociazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"tutti" | "inviati" | "ricevuti">(
    "tutti"
  );
  const [selectedNotifica, setSelectedNotifica] =
    useState<NotificaAssociazione | null>(null);
  const [corsi, setCorsi] = useState<CorsoAssociazione[]>([]);
  const [showCorsoModal, setShowCorsoModal] = useState(false);
  const [selectedCorsoId, setSelectedCorsoId] = useState<number | "">("");
  const [modalitaCorso, setModalitaCorso] = useState<"ONLINE" | "SEDE">("ONLINE");
  const [corsoPiattaforma, setCorsoPiattaforma] = useState<"A99X" | "ESTERNO">("A99X");
  const [linkCorso, setLinkCorso] = useState("");
  const [sedeCorso, setSedeCorso] = useState("");
  const [titoloCorso, setTitoloCorso] = useState("Accesso corso");
  const [messaggioCorso, setMessaggioCorso] = useState(
    "Gentile impresa, ti inviamo le informazioni operative per partecipare al corso selezionato."
  );
  const [sendingCorso, setSendingCorso] = useState(false);

  const { associazioneId } = getImpersonationParams();

  const loadNotifiche = useCallback(async () => {
    if (!associazioneId) return;
    setLoading(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/notifiche`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setNotifiche(data.data);
      } else {
        setNotifiche([]);
      }
    } catch (error) {
      console.error("Errore caricamento notifiche associazione:", error);
      setNotifiche([]);
    } finally {
      setLoading(false);
    }
  }, [associazioneId]);

  const loadCorsi = useCallback(async () => {
    if (!associazioneId) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}/corsi`);
      const data = await res.json();
      setCorsi(data.success && data.data ? data.data : []);
    } catch (error) {
      console.error("Errore caricamento corsi associazione:", error);
      setCorsi([]);
    }
  }, [associazioneId]);

  useEffect(() => {
    loadNotifiche();
    loadCorsi();
    // Polling ogni 30 secondi
    const interval = setInterval(loadNotifiche, 30000);
    return () => clearInterval(interval);
  }, [loadNotifiche, loadCorsi]);

  const markAsRead = async (notificaId: number) => {
    if (!associazioneId) return;
    try {
      await authenticatedFetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/notifiche/${notificaId}/letta`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      setNotifiche(prev =>
        prev.map(n => (n.id === notificaId ? { ...n, letta: true } : n))
      );
      onNotificheUpdate?.();
    } catch (error) {
      console.error("Errore marcatura notifica:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!associazioneId) return;
    try {
      await authenticatedFetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/notifiche/lette-tutte`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      setNotifiche(prev => prev.map(n => ({ ...n, letta: true })));
      onNotificheUpdate?.();
    } catch (error) {
      console.error("Errore marcatura tutte notifiche:", error);
    }
  };

  const openCorsoModal = () => {
    const primoCorso = corsi[0];
    const corsoId = selectedCorsoId || primoCorso?.id || "";
    setSelectedCorsoId(corsoId);
    const corso = corsi.find(c => c.id === Number(corsoId)) || primoCorso;
    if (corso?.sede) setSedeCorso(corso.sede);
    setTitoloCorso(corso ? `Informazioni corso: ${corso.titolo}` : "Accesso corso");
    setShowCorsoModal(true);
  };

  const sendNotificaCorso = async () => {
    if (!associazioneId || !selectedCorsoId || !titoloCorso.trim() || !messaggioCorso.trim()) return;
    setSendingCorso(true);
    try {
      const res = await authenticatedFetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/notifiche-corso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corso_id: Number(selectedCorsoId),
            titolo: titoloCorso,
            messaggio: messaggioCorso,
            modalita: modalitaCorso,
            link_corso: modalitaCorso === "ONLINE" ? linkCorso.trim() : undefined,
            sede_corso: modalitaCorso === "SEDE" ? sedeCorso.trim() : undefined,
            tipo_messaggio: modalitaCorso === "ONLINE" ? "CORSO_ONLINE" : "CORSO_SEDE",
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Errore invio notifica corso");
      setShowCorsoModal(false);
      setLinkCorso("");
      await loadNotifiche();
      onNotificheUpdate?.();
      window.dispatchEvent(new CustomEvent("mihub:toast", { detail: { type: "success", message: data.message || "Notifica corso inviata" } }));
    } catch (error) {
      console.error("Errore invio notifica corso:", error);
      window.dispatchEvent(new CustomEvent("mihub:toast", { detail: { type: "error", message: error instanceof Error ? error.message : "Errore invio notifica corso" } }));
    } finally {
      setSendingCorso(false);
    }
  };

  // Determina direzione (usa campo dal backend se disponibile)
  const getDirezione = (n: NotificaAssociazione): "INVIATO" | "RICEVUTO" => {
    if (n.direzione) return n.direzione.toUpperCase() as "INVIATO" | "RICEVUTO";
    if (n.mittente_tipo?.toUpperCase() === "ASSOCIAZIONE") return "INVIATO";
    return "RICEVUTO";
  };

  // Colore tipo messaggio (identico al NotificationManager SUAP)
  const getTipoColor = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case "INFORMATIVA":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PROMOZIONALE":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "URGENTE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "RISPOSTA":
      case "MESSAGGIO":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "RICHIESTA_FIRMA":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "RICHIESTA_TESSERAMENTO":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "CONCESSIONE":
      case "CONCESSIONE_EMESSA":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Filtra
  // Escludi notifiche riunione (INVITO_RIUNIONE, RIUNIONE_ANNULLATA, RIUNIONE_RIMANDATA) - vanno nei sotto-tab Enti/Bandi
  const TIPI_RIUNIONE = ['INVITO_RIUNIONE', 'RIUNIONE_ANNULLATA', 'RIUNIONE_RIMANDATA', 'RIUNIONE'];
  const notificheSenzaRiunioni = notifiche.filter(n => {
    const tipo = (n.tipo_messaggio || n.tipo || '').toUpperCase();
    return !TIPI_RIUNIONE.includes(tipo);
  });

  const messaggiFiltrati = notificheSenzaRiunioni.filter(n => {
    const dir = getDirezione(n);
    if (filtro === "inviati") return dir === "INVIATO";
    if (filtro === "ricevuti") return dir === "RICEVUTO";
    return true;
  });

  const countInviati = notificheSenzaRiunioni.filter(
    n => getDirezione(n) === "INVIATO"
  ).length;
  const countRicevuti = notificheSenzaRiunioni.filter(
    n => getDirezione(n) === "RICEVUTO"
  ).length;
  const nonLetti = notificheSenzaRiunioni.filter(n => !n.letta && getDirezione(n) === "RICEVUTO").length;

  if (!associazioneId) {
    return (
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-[#e8fbff]/50">Nessuna associazione selezionata</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* NOTA: Notifiche riunione (INVITO_RIUNIONE, RIUNIONE_ANNULLATA) filtrate via - vanno nei sotto-tab Enti Formatori e Associazioni & Bandi (v10.26.0) */}

      {/* Invio notifiche corso */}
      <Card className="bg-[#1a2332] border-[#8b5cf6]/20">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#8b5cf6]" />
            Notifica imprese iscritte a un corso
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Seleziona un corso e invia in un unico passaggio il link alla piattaforma di streaming oppure le indicazioni della sede.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center">
          <select
            className="flex-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
            value={selectedCorsoId}
            onChange={e => {
              const value = e.target.value ? Number(e.target.value) : "";
              setSelectedCorsoId(value);
              const corso = corsi.find(c => c.id === Number(value));
              if (corso) {
                setTitoloCorso(`Informazioni corso: ${corso.titolo}`);
                setSedeCorso(corso.sede || "");
              }
            }}
          >
            <option value="">Scegli corso</option>
            {corsi.map(corso => (
              <option key={corso.id} value={corso.id}>
                {corso.titolo}
              </option>
            ))}
          </select>
          <Button
            onClick={openCorsoModal}
            disabled={corsi.length === 0}
            className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Prepara invio
          </Button>
        </CardContent>
      </Card>

      {/* Lista Messaggi - Layout identico al NotificationManager SUAP */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/20">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#3b82f6]" />
            Messaggi
            {nonLetti > 0 && (
              <Badge className="bg-red-500 text-white ml-2">
                {nonLetti} nuove
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Messaggi inviati e ricevuti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtri */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={filtro === "tutti" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("tutti")}
              className={
                filtro === "tutti"
                  ? "bg-[#3b82f6]"
                  : "border-[#3b82f6]/30 text-[#e8fbff]/70"
              }
            >
              Tutti
            </Button>
            <Button
              variant={filtro === "inviati" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("inviati")}
              className={
                filtro === "inviati"
                  ? "bg-[#3b82f6]"
                  : "border-[#3b82f6]/30 text-[#e8fbff]/70"
              }
            >
              Inviati ({countInviati})
            </Button>
            <Button
              variant={filtro === "ricevuti" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("ricevuti")}
              className={
                filtro === "ricevuti"
                  ? "bg-[#3b82f6]"
                  : "border-[#3b82f6]/30 text-[#e8fbff]/70"
              }
            >
              Ricevuti ({countRicevuti})
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {nonLetti > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-[#e8fbff]/70 hover:text-[#e8fbff] text-xs"
                >
                  <MailOpen className="w-3 h-3 mr-1" />
                  Segna tutte lette
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadNotifiche}
                className="text-[#e8fbff]/70 hover:text-[#e8fbff]"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2 max-h-[800px] overflow-y-auto">
            {loading && notifiche.length === 0 ? (
              <div className="text-center py-8 text-[#e8fbff]/50">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Caricamento...
              </div>
            ) : messaggiFiltrati.length === 0 ? (
              <div className="text-center py-8 text-[#e8fbff]/50">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nessun messaggio
              </div>
            ) : (
              messaggiFiltrati.map(msg => {
                const direzione = getDirezione(msg);
                const tipoLabel =
                  msg.tipo_messaggio || msg.tipo || "MESSAGGIO";
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedNotifica(msg);
                      if (!msg.letta && direzione === "RICEVUTO") {
                        markAsRead(msg.id);
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-[#0b1220]/50 ${
                      direzione === "RICEVUTO" && !msg.letta
                        ? "bg-[#3b82f6]/10 border-[#3b82f6]/30"
                        : "bg-[#0b1220]/30 border-[#3b82f6]/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            direzione === "INVIATO"
                              ? "bg-emerald-500/20"
                              : "bg-blue-500/20"
                          }`}
                        >
                          {direzione === "INVIATO" ? (
                            <Send className="w-4 h-4 text-emerald-400" />
                          ) : msg.letta ? (
                            <MailOpen className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Mail className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#e8fbff] truncate">
                              {direzione === "INVIATO" ? (
                                <>
                                  A:{" "}
                                  {msg.target_nome ||
                                    msg.target_tipo ||
                                    "Destinatario"}
                                </>
                              ) : (
                                <>
                                  Da:{" "}
                                  {msg.mittente_nome ||
                                    msg.mittente_tipo ||
                                    "Mittente"}
                                </>
                              )}
                            </span>
                            <Badge
                              className={`text-xs ${getTipoColor(tipoLabel)}`}
                            >
                              {tipoLabel.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#e8fbff]/80 font-medium truncate">
                            {msg.titolo || msg.oggetto || "Notifica"}
                          </p>
                          <p className="text-xs text-[#e8fbff]/50 truncate">
                            {msg.messaggio}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#e8fbff]/50">
                          {formatDate(msg.data_invio || msg.created_at)}
                        </p>
                        {direzione === "INVIATO" && msg.totale_destinatari != null && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-[#e8fbff]/50 justify-end">
                            <CheckCircle className="w-3 h-3" />
                            {msg.letti ?? 0}/{msg.totale_destinatari}
                          </div>
                        )}
                        {!msg.letta && direzione === "RICEVUTO" && (
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Popup invio notifica corso */}
      {showCorsoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a2332] border-[#8b5cf6]/30 w-full max-w-2xl max-h-[88vh] overflow-y-auto">
            <CardHeader className="border-b border-[#8b5cf6]/20">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#8b5cf6]" />
                    Invio alle imprese del corso
                  </CardTitle>
                  <CardDescription className="text-[#e8fbff]/50 mt-1">
                    Il messaggio sarà recapitato solo alle imprese iscritte al corso selezionato.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCorsoModal(false)}
                  className="text-[#e8fbff]/50 hover:text-[#e8fbff]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-xs text-[#e8fbff]/50">Corso</label>
                <select
                  className="w-full mt-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
                  value={selectedCorsoId}
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : "";
                    setSelectedCorsoId(value);
                    const corso = corsi.find(c => c.id === Number(value));
                    if (corso) {
                      setTitoloCorso(`Informazioni corso: ${corso.titolo}`);
                      setSedeCorso(corso.sede || "");
                    }
                  }}
                >
                  <option value="">Scegli corso</option>
                  {corsi.map(corso => (
                    <option key={corso.id} value={corso.id}>
                      {corso.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={modalitaCorso === "ONLINE" ? "default" : "outline"}
                  onClick={() => setModalitaCorso("ONLINE")}
                  className={modalitaCorso === "ONLINE" ? "bg-[#3b82f6]" : "border-[#3b82f6]/30 text-[#e8fbff]/70"}
                >
                  <LinkIcon className="w-4 h-4 mr-2" /> Link corso online
                </Button>
                <Button
                  variant={modalitaCorso === "SEDE" ? "default" : "outline"}
                  onClick={() => setModalitaCorso("SEDE")}
                  className={modalitaCorso === "SEDE" ? "bg-[#10b981]" : "border-[#3b82f6]/30 text-[#e8fbff]/70"}
                >
                  <MapPin className="w-4 h-4 mr-2" /> Specifiche sede
                </Button>
              </div>

              {modalitaCorso === "ONLINE" ? (
                <div className="space-y-3">
                  <label className="text-xs text-[#e8fbff]/50">Piattaforma corso</label>
                  <div className="flex gap-2">
                    <Button
                      variant={corsoPiattaforma === "A99X" ? "default" : "outline"}
                      onClick={() => setCorsoPiattaforma("A99X")}
                      className={corsoPiattaforma === "A99X" ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : "border-[#3b82f6]/30 text-[#e8fbff]/70"}
                    >
                      ⚡ A99X
                    </Button>
                    <Button
                      variant={corsoPiattaforma === "ESTERNO" ? "default" : "outline"}
                      onClick={() => setCorsoPiattaforma("ESTERNO")}
                      className={corsoPiattaforma === "ESTERNO" ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : "border-[#3b82f6]/30 text-[#e8fbff]/70"}
                    >
                      🔗 Link Esterno
                    </Button>
                  </div>
                  {corsoPiattaforma === "A99X" ? (
                    <div>
                      <label className="text-xs text-[#e8fbff]/50">Link A99X (Cal.com)</label>
                      <input
                        className="w-full mt-1 bg-[#0b1220] border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
                        placeholder="https://cal.miohub.it/..."
                        value={linkCorso}
                        onChange={e => setLinkCorso(e.target.value)}
                      />
                      <p className="text-xs text-purple-400/70 mt-1">Le imprese iscritte riceveranno il link diretto alla videoconferenza A99X</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-[#e8fbff]/50">Collegamento alla piattaforma streaming</label>
                      <input
                        className="w-full mt-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
                        placeholder="https://..."
                        value={linkCorso}
                        onChange={e => setLinkCorso(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs text-[#e8fbff]/50">Sede e indicazioni operative</label>
                  <input
                    className="w-full mt-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
                    placeholder="Indirizzo, aula, orario, note ingresso..."
                    value={sedeCorso}
                    onChange={e => setSedeCorso(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[#e8fbff]/50">Titolo notifica</label>
                <input
                  className="w-full mt-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
                  value={titoloCorso}
                  onChange={e => setTitoloCorso(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[#e8fbff]/50">Messaggio</label>
                <textarea
                  className="w-full mt-1 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-[#e8fbff] min-h-[120px] resize-y"
                  value={messaggioCorso}
                  onChange={e => setMessaggioCorso(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCorsoModal(false)}
                  className="border-[#ef4444]/30 text-[#ef4444]"
                >
                  Annulla
                </Button>
                <Button
                  onClick={sendNotificaCorso}
                  disabled={sendingCorso || !selectedCorsoId || !titoloCorso.trim() || !messaggioCorso.trim()}
                  className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white"
                >
                  {sendingCorso ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Invia alle imprese iscritte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Dettaglio Messaggio - Identico al NotificationManager SUAP */}
      {selectedNotifica && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a2332] border-[#3b82f6]/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b border-[#3b82f6]/20">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    {getDirezione(selectedNotifica) === "INVIATO" ? (
                      <Send className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Mail className="w-5 h-5 text-blue-400" />
                    )}
                    {selectedNotifica.titolo ||
                      selectedNotifica.oggetto ||
                      "Notifica"}
                  </CardTitle>
                  <CardDescription className="text-[#e8fbff]/50 mt-1">
                    {getDirezione(selectedNotifica) === "INVIATO" ? (
                      <>
                        Inviato a:{" "}
                        {selectedNotifica.target_nome ||
                          selectedNotifica.target_tipo}
                      </>
                    ) : (
                      <>
                        Da:{" "}
                        {selectedNotifica.mittente_nome ||
                          selectedNotifica.mittente_tipo}
                      </>
                    )}
                    {" \u2022 "}
                    {formatDate(
                      selectedNotifica.data_invio || selectedNotifica.created_at
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotifica(null)}
                  className="text-[#e8fbff]/50 hover:text-[#e8fbff]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Badge
                className={`mb-4 ${getTipoColor(selectedNotifica.tipo_messaggio || selectedNotifica.tipo || "MESSAGGIO")}`}
              >
                {(
                  selectedNotifica.tipo_messaggio ||
                  selectedNotifica.tipo ||
                  "MESSAGGIO"
                ).replace(/_/g, " ")}
              </Badge>
              <div className="bg-[#0b1220] rounded-lg p-4 text-[#e8fbff]/90 whitespace-pre-wrap">
                {selectedNotifica.messaggio || "Nessun contenuto"}
              </div>
              {getDirezione(selectedNotifica) === "INVIATO" && selectedNotifica.totale_destinatari != null && (
                <div className="mt-4 flex items-center gap-4 text-sm text-[#e8fbff]/50">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedNotifica.totale_destinatari} destinatari
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedNotifica.letti ?? 0} letti
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedNotifica.non_letti ?? 0} non letti
                  </span>
                </div>
              )}
              {/* Bottone Gestisci per notifiche RICHIESTA_SERVIZIO (Domanda Spunta) */}
              {(selectedNotifica.tipo === "RICHIESTA_SERVIZIO" || selectedNotifica.tipo === "CONFERMA_PAGAMENTO") &&
                getDirezione(selectedNotifica) === "RICEVUTO" &&
                (selectedNotifica.titolo?.toLowerCase().includes("domanda spunta") || selectedNotifica.messaggio?.toLowerCase().includes("domanda spunta")) && (
                <div className="mt-4 pt-4 border-t border-[#3b82f6]/20">
                  <button
                    onClick={() => {
                      setSelectedNotifica(null);
                      window.dispatchEvent(new CustomEvent("navigate-to-domanda-spunta-form", {
                        detail: { notifica: selectedNotifica }
                      }));
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white rounded-lg font-medium transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Gestisci - Nuova Domanda Spunta
                  </button>
                </div>
              )}
              {/* Bottone Gestisci per notifiche RICHIESTA_SERVIZIO (SCIA) */}
              {(selectedNotifica.tipo === "RICHIESTA_SERVIZIO" || selectedNotifica.tipo === "CONFERMA_PAGAMENTO") &&
                getDirezione(selectedNotifica) === "RICEVUTO" &&
                (selectedNotifica.titolo?.toLowerCase().includes("scia") || selectedNotifica.messaggio?.toLowerCase().includes("scia")) && (
                <div className="mt-4 pt-4 border-t border-[#3b82f6]/20 space-y-2">
                  {selectedNotifica.messaggio?.toLowerCase().includes("atto notarile") && (
                    <button
                      onClick={() => {
                        // Cerca la richiesta SCIA corrispondente per ottenere il documento allegato
                        const impresaId = selectedNotifica.mittente_id;
                        apiFetch(`${API_BASE_URL}/api/bandi/richieste?impresa_id=${impresaId}&servizio_nome=scia`)
                          .then(r => r.json())
                          .then(data => {
                            const richieste = data.data || [];
                            const conDoc = richieste.find((r: any) => r.documenti_allegati && r.documenti_allegati.length > 0);
                            if (conDoc) {
                              const docUrl = Array.isArray(conDoc.documenti_allegati) ? conDoc.documenti_allegati[0] : conDoc.documenti_allegati;
                              const fullUrl = docUrl.startsWith('http') ? docUrl : `${API_BASE_URL}${docUrl}`;
                              window.open(fullUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              alert('Documento atto notarile non trovato');
                            }
                          })
                          .catch(() => alert('Errore nel recupero del documento'));
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-white rounded-lg font-medium transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Apri Atto Notarile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedNotifica(null);
                      window.dispatchEvent(new CustomEvent("navigate-to-scia-form", {
                        detail: { notifica: selectedNotifica, openForm: true }
                      }));
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white rounded-lg font-medium transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Gestisci - Nuova SCIA
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
