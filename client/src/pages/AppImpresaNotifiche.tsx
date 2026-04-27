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
  const firmatoFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ID impresa demo (in produzione verrà dall'autenticazione)
  const getImpresaData = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.impresa_id || null,
        nome: user.impresa_nome || user.name || "Impresa",
      };
    }
    return { id: null, nome: "Impresa" };
  };
  const impresaData = getImpresaData();
  const IMPRESA_ID = impresaData.id;
  const IMPRESA_NOME = impresaData.nome;

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
        `${API_BASE_URL}/notifiche/impresa/${IMPRESA_ID}?limit=50${statoParam}`
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
                    Ricevuti ({notifiche.length})
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
                      {/* Messaggi Ricevuti */}
                      {(filtroTipo === "tutti" || filtroTipo === "ricevuti") &&
                        notifiche.map(notifica => (
                          <div
                            key={`ric-${notifica.id}`}
                            onClick={() => {
                              setNotificaSelezionata(notifica);
                              segnaComeLetta(notifica);
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
                                    ).toLocaleDateString("it-IT")}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#e8fbff]/30 flex-shrink-0" />
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
                                    "it-IT"
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
                          ).toLocaleString("it-IT")}
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

                  {/* Azioni Rapide */}
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
