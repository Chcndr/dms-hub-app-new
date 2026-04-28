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

  const { associazioneId } = getImpersonationParams();

  const loadNotifiche = useCallback(async () => {
    if (!associazioneId) return;
    setLoading(true);
    try {
      const res = await fetch(
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

  useEffect(() => {
    loadNotifiche();
    // Polling ogni 30 secondi
    const interval = setInterval(loadNotifiche, 30000);
    return () => clearInterval(interval);
  }, [loadNotifiche]);

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

  // Determina direzione
  const getDirezione = (n: NotificaAssociazione): "INVIATO" | "RICEVUTO" => {
    if (
      n.mittente_tipo?.toUpperCase() === "ASSOCIAZIONE"
    )
      return "INVIATO";
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
  const messaggiFiltrati = notifiche.filter(n => {
    const dir = getDirezione(n);
    if (filtro === "inviati") return dir === "INVIATO";
    if (filtro === "ricevuti") return dir === "RICEVUTO";
    return true;
  });

  const countInviati = notifiche.filter(
    n => getDirezione(n) === "INVIATO"
  ).length;
  const countRicevuti = notifiche.filter(
    n => getDirezione(n) === "RICEVUTO"
  ).length;
  const nonLetti = notifiche.filter(n => !n.letta).length;

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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
