/**
 * TeamFormazionePanel.tsx
 * Cruscotto Matrice Formazione TEAM
 * 
 * Mostra per ogni collaboratore dell'impresa:
 * - Quali attestati ha (con stato: valido/in scadenza/scaduto)
 * - Quali attestati mancano (obbligatori per tipo impresa)
 * - Percentuale di conformità globale
 * - Scadenze prossime con alert
 * - Possibilità di aggiungere qualificazioni manuali
 * - Download PDF attestati
 * 
 * Integrato nel tab "Team" dell'AnagraficaPage
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  FileText,
  Calendar,
  User,
  Users,
  TrendingUp,
} from "lucide-react";

import { MIHUB_API_BASE_URL } from "@/config/api";
import { apiFetch } from "@/lib/apiFetch";
import { addAssociazioneIdToUrl, isAssociazioneImpersonation, addComuneIdToUrl } from "@/hooks/useImpersonation";

const API_BASE_URL = MIHUB_API_BASE_URL;

// Tipo attestato → label leggibile
const TIPO_ATTESTATO_LABELS: Record<string, string> = {
  SICUREZZA_LAVORO: "Sicurezza Lavoro",
  RSPP: "RSPP Datore Lavoro",
  ANTINCENDIO: "Antincendio",
  PRIMO_SOCCORSO: "Primo Soccorso",
  PREPOSTO: "Preposto",
  HACCP: "HACCP",
  SAB: "SAB",
  RLS: "RLS",
  DIRIGENTE: "Dirigente Sicurezza",
};

// Colori per stato
const STATO_COLORS: Record<string, string> = {
  VALIDO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PROSSIMO: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  IN_SCADENZA: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  SCADUTO: "bg-red-500/15 text-red-400 border-red-500/30",
  MANCANTE: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

const STATO_ICONS: Record<string, any> = {
  VALIDO: CheckCircle,
  PROSSIMO: Clock,
  IN_SCADENZA: AlertTriangle,
  SCADUTO: XCircle,
  MANCANTE: XCircle,
};

interface MatriceEntry {
  collaboratore: {
    id: number;
    nome: string;
    cognome: string;
    ruolo: string;
    mansione: string | null;
    ruolo_sicurezza: string | null;
    codice_fiscale: string | null;
  };
  attestati: Record<string, {
    stato: string;
    data_rilascio: string;
    data_scadenza: string | null;
    ente: string | null;
    attestato_id?: number | null;
  }>;
  mancanti: string[];
  completezza: number;
}

interface ScadenzaEntry {
  id: number;
  collaboratore_id: number;
  tipo_attestato: string;
  data_scadenza: string;
  nome: string;
  cognome: string;
  ruolo: string;
  giorni_alla_scadenza: number;
  stato_scadenza: string;
}

interface TeamFormazione {
  tipo_impresa: string;
  adempimenti_obbligatori: string[];
  matrice: MatriceEntry[];
  statistiche: {
    totale_collaboratori: number;
    conformi: number;
    non_conformi: number;
    percentuale_conformita: number;
  };
}

export default function TeamFormazionePanel({ impresaId }: { impresaId: number | null }) {
  const [data, setData] = useState<TeamFormazione | null>(null);
  const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCollab, setExpandedCollab] = useState<number | null>(null);
  const [showAddQual, setShowAddQual] = useState<number | null>(null);
  const [newQual, setNewQual] = useState({
    tipo_attestato: "SICUREZZA_LAVORO",
    ente_rilascio: "",
    numero_certificato: "",
    data_rilascio: "",
    data_scadenza: "",
    note: "",
  });

  const fetchData = useCallback(async () => {
    if (!impresaId) return;
    setLoading(true);
    try {
      let matriceUrl = `${API_BASE_URL}/api/collaboratori/team/matrice?impresa_id=${impresaId}`;
      let scadenzeUrl = `${API_BASE_URL}/api/collaboratori/team/scadenze?impresa_id=${impresaId}&giorni=90`;
      if (isAssociazioneImpersonation()) {
        matriceUrl = addAssociazioneIdToUrl(matriceUrl);
        scadenzeUrl = addAssociazioneIdToUrl(scadenzeUrl);
      } else {
        matriceUrl = addComuneIdToUrl(matriceUrl);
        scadenzeUrl = addComuneIdToUrl(scadenzeUrl);
      }
      const [matriceRes, scadenzeRes] = await Promise.all([
        apiFetch(matriceUrl),
        apiFetch(scadenzeUrl),
      ]);
      const matriceJson = await matriceRes.json();
      const scadenzeJson = await scadenzeRes.json();

      if (matriceJson.success) setData(matriceJson);
      if (scadenzeJson.success) setScadenze(scadenzeJson.data || []);
    } catch (err) {
      console.error("[TeamFormazione] Errore:", err);
    }
    setLoading(false);
  }, [impresaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addQualificazione = async (collaboratoreId: number) => {
    if (!impresaId || !newQual.data_rilascio) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/collaboratori/${collaboratoreId}/qualificazioni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impresa_id: impresaId, ...newQual }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddQual(null);
        setNewQual({ tipo_attestato: "SICUREZZA_LAVORO", ente_rilascio: "", numero_certificato: "", data_rilascio: "", data_scadenza: "", note: "" });
        fetchData();
      }
    } catch (err) {
      console.error("[TeamFormazione] Errore aggiunta:", err);
    }
  };

  const downloadAttestatoPdf = async (attestatoId: number) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/attestati/${attestatoId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attestato_${attestatoId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[TeamFormazione] Errore download:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (!data || data.matrice.length === 0) {
    return (
      <Card className="bg-[#1a2332] border-[#14b8a6]/20 py-0 gap-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
        <CardContent className="p-4 text-center">
          <GraduationCap className="w-10 h-10 text-[#14b8a6]/30 mx-auto mb-2" />
          <p className="text-sm text-[#e8fbff]/50">
            Aggiungi collaboratori per visualizzare la matrice formazione del team.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { statistiche, adempimenti_obbligatori, matrice } = data;

  return (
    <div className="space-y-3">
      {/* Header Statistiche */}
      <Card className="bg-gradient-to-r from-[#1a2332] to-[#14b8a6]/5 border-[#14b8a6]/20 py-0 gap-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#14b8a6]" />
              <h3 className="text-sm font-semibold text-[#e8fbff]">Conformità Formazione</h3>
            </div>
            <Badge className={`text-xs border ${
              statistiche.percentuale_conformita >= 80 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
              statistiche.percentuale_conformita >= 50 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
              "bg-red-500/15 text-red-400 border-red-500/30"
            }`}>
              {statistiche.percentuale_conformita}% conforme
            </Badge>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#0b1220] rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                statistiche.percentuale_conformita >= 80 ? "bg-emerald-500" :
                statistiche.percentuale_conformita >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${statistiche.percentuale_conformita}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-[#14b8a6]">{statistiche.totale_collaboratori}</p>
              <p className="text-[10px] text-gray-500">Collaboratori</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-400">{statistiche.conformi}</p>
              <p className="text-[10px] text-gray-500">Conformi</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{statistiche.non_conformi}</p>
              <p className="text-[10px] text-gray-500">Non Conformi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Scadenze */}
      {scadenze.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20 py-0 gap-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                {scadenze.length} attestat{scadenze.length === 1 ? 'o' : 'i'} in scadenza
              </span>
            </div>
            <div className="space-y-1.5">
              {scadenze.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[#e8fbff]/70">
                    {s.nome} {s.cognome} — {TIPO_ATTESTATO_LABELS[s.tipo_attestato] || s.tipo_attestato}
                  </span>
                  <Badge className={`text-[9px] border ${
                    s.stato_scadenza === "SCADUTO" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                    "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}>
                    {s.giorni_alla_scadenza < 0 ? `Scaduto ${Math.abs(s.giorni_alla_scadenza)}gg fa` : `${s.giorni_alla_scadenza}gg`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrice Collaboratori */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Users className="w-4 h-4 text-[#14b8a6]" />
          <h4 className="text-xs font-semibold text-[#e8fbff]/80 uppercase tracking-wider">Matrice Formazione</h4>
        </div>

        {matrice.map((entry) => {
          const isExpanded = expandedCollab === entry.collaboratore.id;
          const isAddingQual = showAddQual === entry.collaboratore.id;

          return (
            <Card
              key={entry.collaboratore.id}
              className="bg-[#1a2332] border-[#14b8a6]/20 py-0 gap-0 rounded-none sm:rounded-xl border-x-0 sm:border-x overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Header collaboratore */}
                <button
                  onClick={() => setExpandedCollab(isExpanded ? null : entry.collaboratore.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-[#14b8a6]/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.completezza === 100 ? "bg-emerald-500/15" :
                      entry.completezza >= 50 ? "bg-amber-500/15" : "bg-red-500/15"
                    }`}>
                      <User className={`w-4 h-4 ${
                        entry.completezza === 100 ? "text-emerald-400" :
                        entry.completezza >= 50 ? "text-amber-400" : "text-red-400"
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#e8fbff]">
                        {entry.collaboratore.nome} {entry.collaboratore.cognome}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {entry.collaboratore.ruolo}
                        {entry.collaboratore.mansione && ` — ${entry.collaboratore.mansione}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[9px] border ${
                      entry.completezza === 100 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                      entry.completezza >= 50 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-red-500/15 text-red-400 border-red-500/30"
                    }`}>
                      {entry.completezza}%
                    </Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>

                {/* Dettaglio espanso */}
                {isExpanded && (
                  <div className="border-t border-[#14b8a6]/10 p-3 space-y-2">
                    {/* Attestati posseduti */}
                    {adempimenti_obbligatori.map((tipo) => {
                      const att = entry.attestati[tipo];
                      const stato = att ? att.stato : "MANCANTE";
                      const StatoIcon = STATO_ICONS[stato] || XCircle;

                      return (
                        <div key={tipo} className="flex items-center justify-between py-1.5 border-b border-[#14b8a6]/5 last:border-0">
                          <div className="flex items-center gap-2">
                            <StatoIcon className={`w-3.5 h-3.5 ${
                              stato === "VALIDO" ? "text-emerald-400" :
                              stato === "PROSSIMO" ? "text-amber-400" :
                              stato === "IN_SCADENZA" ? "text-orange-400" :
                              stato === "SCADUTO" ? "text-red-400" : "text-gray-500"
                            }`} />
                            <span className="text-xs text-[#e8fbff]/80">
                              {TIPO_ATTESTATO_LABELS[tipo] || tipo}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {att && att.data_scadenza && (
                              <span className="text-[9px] text-gray-500">
                                scad. {new Date(att.data_scadenza).toLocaleDateString("it-IT")}
                              </span>
                            )}
                            <Badge className={`text-[8px] border ${STATO_COLORS[stato]}`}>
                              {stato === "MANCANTE" ? "Mancante" :
                               stato === "VALIDO" ? "Valido" :
                               stato === "PROSSIMO" ? "Prossimo" :
                               stato === "IN_SCADENZA" ? "In Scadenza" : "Scaduto"}
                            </Badge>
                            {att && att.attestato_id && (
                              <button
                                onClick={() => downloadAttestatoPdf(att.attestato_id!)}
                                className="text-blue-400 hover:text-blue-300 ml-1"
                                title="Scarica PDF attestato"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Attestati extra (non obbligatori ma posseduti) */}
                    {Object.keys(entry.attestati)
                      .filter(tipo => !adempimenti_obbligatori.includes(tipo))
                      .map(tipo => {
                        const att = entry.attestati[tipo];
                        return (
                          <div key={tipo} className="flex items-center justify-between py-1.5 border-b border-[#14b8a6]/5 last:border-0 opacity-70">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs text-[#e8fbff]/60">
                                {TIPO_ATTESTATO_LABELS[tipo] || tipo}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className="text-[8px] border bg-blue-500/15 text-blue-400 border-blue-500/30">
                                Extra
                              </Badge>
                              {att && att.attestato_id && (
                                <button
                                  onClick={() => downloadAttestatoPdf(att.attestato_id!)}
                                  className="text-blue-400 hover:text-blue-300"
                                  title="Scarica PDF attestato"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* Pulsante aggiungi qualificazione */}
                    {!isAddingQual ? (
                      <button
                        onClick={() => setShowAddQual(entry.collaboratore.id)}
                        className="w-full mt-2 border border-dashed border-[#14b8a6]/20 rounded-lg py-2 text-[10px] text-[#14b8a6]/60 hover:text-[#14b8a6] hover:border-[#14b8a6]/40 transition-all flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Aggiungi Attestato
                      </button>
                    ) : (
                      <div className="mt-2 p-2.5 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20 space-y-2">
                        <p className="text-[10px] font-medium text-[#14b8a6] uppercase">Nuovo Attestato</p>
                        <select
                          value={newQual.tipo_attestato}
                          onChange={(e) => setNewQual({ ...newQual, tipo_attestato: e.target.value })}
                          className="w-full bg-[#1a2332] border border-[#14b8a6]/20 rounded px-2 py-1.5 text-xs text-[#e8fbff]"
                        >
                          {Object.entries(TIPO_ATTESTATO_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Ente rilascio"
                          value={newQual.ente_rilascio}
                          onChange={(e) => setNewQual({ ...newQual, ente_rilascio: e.target.value })}
                          className="w-full bg-[#1a2332] border border-[#14b8a6]/20 rounded px-2 py-1.5 text-xs text-[#e8fbff] placeholder-gray-600"
                        />
                        <input
                          type="text"
                          placeholder="N. certificato"
                          value={newQual.numero_certificato}
                          onChange={(e) => setNewQual({ ...newQual, numero_certificato: e.target.value })}
                          className="w-full bg-[#1a2332] border border-[#14b8a6]/20 rounded px-2 py-1.5 text-xs text-[#e8fbff] placeholder-gray-600"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-gray-500">Data rilascio</label>
                            <input
                              type="date"
                              value={newQual.data_rilascio}
                              onChange={(e) => setNewQual({ ...newQual, data_rilascio: e.target.value })}
                              className="w-full bg-[#1a2332] border border-[#14b8a6]/20 rounded px-2 py-1.5 text-xs text-[#e8fbff]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500">Data scadenza</label>
                            <input
                              type="date"
                              value={newQual.data_scadenza}
                              onChange={(e) => setNewQual({ ...newQual, data_scadenza: e.target.value })}
                              className="w-full bg-[#1a2332] border border-[#14b8a6]/20 rounded px-2 py-1.5 text-xs text-[#e8fbff]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addQualificazione(entry.collaboratore.id)}
                            className="flex-1 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white text-xs h-7"
                          >
                            Salva
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddQual(null)}
                            className="text-xs h-7 text-gray-400"
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legenda */}
      <Card className="bg-[#1a2332]/50 border-[#14b8a6]/10 py-0 gap-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
        <CardContent className="p-2.5">
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: "Valido", color: "text-emerald-400" },
              { label: "Prossimo (90gg)", color: "text-amber-400" },
              { label: "In Scadenza (30gg)", color: "text-orange-400" },
              { label: "Scaduto", color: "text-red-400" },
              { label: "Mancante", color: "text-gray-500" },
            ].map(({ label, color }) => (
              <span key={label} className={`text-[9px] ${color}`}>● {label}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
