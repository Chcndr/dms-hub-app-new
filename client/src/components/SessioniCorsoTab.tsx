/**
 * SessioniCorsoTab.tsx
 * Tab "Sessioni" per la gestione delle sessioni live dei corsi
 * Stile card A99X riunioni: data/ora, partecipanti, istruttore, relatore, link Jitsi
 *
 * @version 10.31.0
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  Loader2,
  Trash2,
  Edit3,
  ExternalLink,
  UserCheck,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getImpersonationParams,
  authenticatedFetch,
} from "@/hooks/useImpersonation";
import { MIHUB_API_BASE_URL } from "@/config/api";

const API_BASE = MIHUB_API_BASE_URL;

interface Sessione {
  id: number;
  corso_id: number;
  titolo: string;
  descrizione?: string;
  data_inizio: string;
  data_fine?: string;
  durata_minuti: number;
  modalita: string;
  sede?: string;
  jitsi_room_id?: string;
  jitsi_link?: string;
  jitsi_embed_link?: string;
  stato: string;
  istruttore_id?: number;
  relatore_id?: number;
  istruttore_nome?: string;
  relatore_nome?: string;
  note?: string;
  presenze?: Presenza[];
  num_partecipanti?: number;
}

interface Presenza {
  id: number;
  sessione_id: number;
  impresa_id?: number;
  impresa_nome?: string;
  utente_nome?: string;
  utente_email?: string;
  stato: string;
  data_conferma?: string;
}

interface Relatore {
  id: number;
  nome: string;
  cognome: string;
  email?: string;
  specializzazione?: string;
}

interface Corso {
  id: number;
  titolo: string;
}

interface SessioniCorsoTabProps {
  corsi: Corso[];
  onSessioniCount?: (count: number) => void;
}

const STATI_SESSIONE: Record<string, { label: string; color: string }> = {
  PROGRAMMATA: { label: "Programmata", color: "#3b82f6" },
  IN_CORSO: { label: "In corso", color: "#f59e0b" },
  COMPLETATA: { label: "Completata", color: "#10b981" },
  ANNULLATA: { label: "Annullata", color: "#ef4444" },
};

const MODALITA_OPTIONS = [
  { value: "ONLINE", label: "Online (Jitsi)" },
  { value: "IN_SEDE", label: "In sede" },
  { value: "IBRIDA", label: "Ibrida" },
];

export default function SessioniCorsoTab({ corsi, onSessioniCount }: SessioniCorsoTabProps) {
  const [sessioni, setSessioni] = useState<Sessione[]>([]);
  const [relatori, setRelatori] = useState<Relatore[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCorsoId, setSelectedCorsoId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedSessione, setExpandedSessione] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    titolo: "",
    descrizione: "",
    data_inizio: "",
    data_fine: "",
    durata_minuti: 60,
    modalita: "ONLINE",
    sede: "",
    istruttore_id: "",
    relatore_id: "",
    note: "",
    auto_invita_iscritti: true,
  });

  const impState = getImpersonationParams();
  const associazioneId = impState.associazioneId;

  // Carica sessioni per il corso selezionato
  const loadSessioni = useCallback(async () => {
    if (!associazioneId || !selectedCorsoId) {
      setSessioni([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni`
      );
      const data = await res.json();
      if (data.success) {
        setSessioni(data.data || []);
        onSessioniCount?.(data.data?.length || 0);
      }
    } catch (err) {
      console.error("Errore caricamento sessioni:", err);
    } finally {
      setLoading(false);
    }
  }, [associazioneId, selectedCorsoId]);

  // Carica relatori
  const loadRelatori = useCallback(async () => {
    if (!associazioneId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/associazioni/${associazioneId}/relatori`
      );
      const data = await res.json();
      if (data.success) setRelatori(data.data || []);
    } catch (err) {
      console.error("Errore caricamento relatori:", err);
    }
  }, [associazioneId]);

  useEffect(() => {
    loadSessioni();
  }, [loadSessioni]);

  useEffect(() => {
    loadRelatori();
  }, [loadRelatori]);

  // Carica dettaglio sessione con presenze
  const loadDettaglio = async (sessioneId: number) => {
    if (!associazioneId || !selectedCorsoId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni/${sessioneId}`
      );
      const data = await res.json();
      if (data.success) {
        setSessioni((prev) =>
          prev.map((s) => (s.id === sessioneId ? { ...s, presenze: data.data.presenze } : s))
        );
      }
    } catch (err) {
      console.error("Errore dettaglio sessione:", err);
    }
  };

  const openNew = () => {
    setForm({
      titolo: "",
      descrizione: "",
      data_inizio: "",
      data_fine: "",
      durata_minuti: 60,
      modalita: "ONLINE",
      sede: "",
      istruttore_id: "",
      relatore_id: "",
      note: "",
      auto_invita_iscritti: true,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s: Sessione) => {
    setForm({
      titolo: s.titolo,
      descrizione: s.descrizione || "",
      data_inizio: s.data_inizio ? s.data_inizio.slice(0, 16) : "",
      data_fine: s.data_fine ? s.data_fine.slice(0, 16) : "",
      durata_minuti: s.durata_minuti || 60,
      modalita: s.modalita || "ONLINE",
      sede: s.sede || "",
      istruttore_id: s.istruttore_id ? String(s.istruttore_id) : "",
      relatore_id: s.relatore_id ? String(s.relatore_id) : "",
      note: s.note || "",
      auto_invita_iscritti: false,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const saveSessione = async () => {
    if (!associazioneId || !selectedCorsoId || !form.titolo.trim() || !form.data_inizio) {
      toast.error("Titolo e data inizio sono obbligatori");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni/${editingId}`
        : `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni`;

      const body = {
        ...form,
        istruttore_id: form.istruttore_id ? parseInt(form.istruttore_id) : null,
        relatore_id: form.relatore_id ? parseInt(form.relatore_id) : null,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Sessione aggiornata" : "Sessione creata con link Jitsi");
        setShowForm(false);
        loadSessioni();
      } else {
        toast.error(data.error || "Errore salvataggio");
      }
    } catch (err) {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const deleteSessione = async (sid: number) => {
    if (!confirm("Eliminare questa sessione?")) return;
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni/${sid}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Sessione eliminata");
        loadSessioni();
      }
    } catch (err) {
      toast.error("Errore eliminazione");
    }
  };

  const cambiaStato = async (sid: number, nuovoStato: string) => {
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/api/associazioni/${associazioneId}/corsi/${selectedCorsoId}/sessioni/${sid}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stato: nuovoStato }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`Stato aggiornato: ${nuovoStato}`);
        loadSessioni();
      }
    } catch (err) {
      toast.error("Errore cambio stato");
    }
  };


  const formatData = (d?: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSessionePassata = (s: Sessione) => {
    const fine = s.data_fine || s.data_inizio;
    if (!fine) return false;
    const fineDate = new Date(fine);
    if (s.durata_minuti && !s.data_fine) {
      fineDate.setMinutes(fineDate.getMinutes() + s.durata_minuti);
    }
    return fineDate < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Selettore corso */}
      <div className="flex items-center gap-3">
        <select
          className="flex-1 bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg px-3 py-2 text-sm text-[#e8fbff]"
          value={selectedCorsoId ?? ""}
          onChange={(e) => setSelectedCorsoId(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Seleziona un corso...</option>
          {corsi.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titolo}
            </option>
          ))}
        </select>
        {selectedCorsoId && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessioni}
              className="border-[#8b5cf6]/30 text-[#8b5cf6]"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={openNew}
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Nuova Sessione
            </Button>
          </>
        )}
      </div>

      {/* Form nuova/modifica sessione */}
      {showForm && selectedCorsoId && (
        <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-sm font-medium text-[#e8fbff]">
              {editingId ? "Modifica Sessione" : "Nuova Sessione"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs text-[#e8fbff]/50">Titolo sessione</Label>
                <Input
                  className="mt-1 bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff]"
                  placeholder="es. Lezione 1 - Introduzione"
                  value={form.titolo}
                  onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Data e ora inizio</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff]"
                  value={form.data_inizio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inizio: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Data e ora fine (opz.)</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff]"
                  value={form.data_fine}
                  onChange={(e) => setForm((f) => ({ ...f, data_fine: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Durata (minuti)</Label>
                <Input
                  type="number"
                  className="mt-1 bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff]"
                  value={form.durata_minuti}
                  onChange={(e) => setForm((f) => ({ ...f, durata_minuti: parseInt(e.target.value) || 60 }))}
                />
              </div>
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Modalità</Label>
                <select
                  className="mt-1 w-full bg-[#0b1220] border border-[#3b82f6]/20 rounded-md px-3 py-2 text-sm text-[#e8fbff]"
                  value={form.modalita}
                  onChange={(e) => setForm((f) => ({ ...f, modalita: e.target.value }))}
                >
                  {MODALITA_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.modalita !== "ONLINE" && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-[#e8fbff]/50">Sede</Label>
                  <Input
                    className="mt-1 bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff]"
                    placeholder="es. Bologna - Via Verdi 10"
                    value={form.sede}
                    onChange={(e) => setForm((f) => ({ ...f, sede: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Istruttore</Label>
                <select
                  className="mt-1 w-full bg-[#0b1220] border border-[#3b82f6]/20 rounded-md px-3 py-2 text-sm text-[#e8fbff]"
                  value={form.istruttore_id}
                  onChange={(e) => setForm((f) => ({ ...f, istruttore_id: e.target.value }))}
                >
                  <option value="">Nessuno</option>
                  {relatori.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} {r.cognome} {r.specializzazione ? `(${r.specializzazione})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#e8fbff]/50">Relatore</Label>
                <select
                  className="mt-1 w-full bg-[#0b1220] border border-[#3b82f6]/20 rounded-md px-3 py-2 text-sm text-[#e8fbff]"
                  value={form.relatore_id}
                  onChange={(e) => setForm((f) => ({ ...f, relatore_id: e.target.value }))}
                >
                  <option value="">Nessuno</option>
                  {relatori.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} {r.cognome} {r.specializzazione ? `(${r.specializzazione})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-[#e8fbff]/50">Note</Label>
                <textarea
                  className="mt-1 w-full bg-[#0b1220] border border-[#3b82f6]/20 rounded-md px-3 py-2 text-sm text-[#e8fbff] resize-none"
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              {!editingId && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.auto_invita_iscritti}
                      onChange={(e) => setForm((f) => ({ ...f, auto_invita_iscritti: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#8b5cf6]/30 bg-[#0b1220] accent-[#8b5cf6]"
                    />
                    <span className="text-[#e8fbff]/70 text-sm">
                      Invita automaticamente tutti gli iscritti al corso
                    </span>
                  </label>
                </div>
              )}
            </div>
            {form.modalita !== "IN_SEDE" && !editingId && (
              <p className="text-xs text-[#8b5cf6]/70 flex items-center gap-1">
                <Video className="h-3 w-3" />
                Il link Jitsi verrà generato automaticamente alla creazione
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="text-[#e8fbff]/50"
              >
                Annulla
              </Button>
              <Button
                onClick={saveSessione}
                disabled={saving}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {editingId ? "Salva Modifiche" : "Crea Sessione"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista sessioni */}
      {!selectedCorsoId ? (
        <div className="text-center py-12 text-[#e8fbff]/50">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Seleziona un corso per gestire le sessioni</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8b5cf6]" />
        </div>
      ) : sessioni.length === 0 ? (
        <div className="text-center py-12 text-[#e8fbff]/50">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nessuna sessione programmata</p>
          <Button
            variant="outline"
            size="sm"
            onClick={openNew}
            className="mt-3 border-[#8b5cf6]/30 text-[#8b5cf6]"
          >
            <Plus className="h-4 w-4 mr-1" /> Crea la prima sessione
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessioni.map((s) => {
            const statoInfo = STATI_SESSIONE[s.stato] || STATI_SESSIONE.PROGRAMMATA;
            const passata = isSessionePassata(s);
            const expanded = expandedSessione === s.id;

            return (
              <Card
                key={s.id}
                className={`bg-[#1a2332] border transition-all ${
                  s.stato === "IN_CORSO"
                    ? "border-[#f59e0b]/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : passata
                    ? "border-[#e8fbff]/10 opacity-70"
                    : "border-[#8b5cf6]/20"
                }`}
              >
                <CardContent className="pt-4 pb-3">
                  {/* Header sessione */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        if (expanded) {
                          setExpandedSessione(null);
                        } else {
                          setExpandedSessione(s.id);
                          if (!s.presenze) loadDettaglio(s.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#e8fbff]">{s.titolo}</span>
                        <Badge
                          style={{ backgroundColor: `${statoInfo.color}20`, color: statoInfo.color, borderColor: `${statoInfo.color}50` }}
                          className="text-[10px] border"
                        >
                          {statoInfo.label}
                        </Badge>
                        {s.modalita && (
                          <Badge variant="outline" className="text-[10px] text-[#e8fbff]/60 border-[#e8fbff]/20">
                            {s.modalita === "ONLINE" ? "🎥 Online" : s.modalita === "IN_SEDE" ? "🏢 In sede" : "🔄 Ibrida"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[#e8fbff]/50 flex-wrap">
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatData(s.data_inizio)}
                        </span>
                        <span>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {s.durata_minuti} min
                        </span>
                        {s.istruttore_nome && (
                          <span>
                            <UserCheck className="h-3 w-3 inline mr-1" />
                            {s.istruttore_nome}
                          </span>
                        )}
                        {s.sede && (
                          <span>
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {s.sede}
                          </span>
                        )}
                        {(s.num_partecipanti || (s.presenze && s.presenze.length > 0)) && (
                          <span>
                            <Users className="h-3 w-3 inline mr-1" />
                            {s.num_partecipanti || s.presenze?.length || 0} partecipanti
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Azioni rapide */}
                    <div className="flex items-center gap-1">
                      {s.jitsi_link && s.stato !== "ANNULLATA" && s.stato !== "COMPLETATA" && (
                        <a
                          href={s.jitsi_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 text-xs hover:bg-[#8b5cf6]/30 transition-colors"
                        >
                          <Video className="h-3 w-3" /> Partecipa
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        className="text-[#3b82f6] h-7 w-7"
                        title="Modifica"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSessione(s.id)}
                        className="text-[#ef4444] h-7 w-7"
                        title="Elimina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Pulsanti stato */}
                  {s.stato === "PROGRAMMATA" && !passata && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => cambiaStato(s.id, "IN_CORSO")}
                        className="bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-white h-7 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" /> Avvia Sessione
                      </Button>
                    </div>
                  )}
                  {s.stato === "IN_CORSO" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => cambiaStato(s.id, "COMPLETATA")}
                        className="bg-[#10b981] hover:bg-[#10b981]/80 text-white h-7 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Completa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cambiaStato(s.id, "ANNULLATA")}
                        className="border-[#ef4444]/30 text-[#ef4444] h-7 text-xs"
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Annulla
                      </Button>
                    </div>
                  )}

                  {/* Partecipanti — sempre visibili stile A99X */}
                  {s.presenze && s.presenze.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#e8fbff]/10">
                      {/* Istruttore/Relatore row */}
                      {(s.istruttore_nome || s.relatore_nome) && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {s.relatore_nome && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#8b5cf6]/10 rounded border border-[#8b5cf6]/20 text-xs">
                              <UserCheck className="h-3 w-3 text-[#8b5cf6]" />
                              <span className="text-[#e8fbff]/50">Relatore:</span>
                              <span className="text-[#e8fbff] font-medium">{s.relatore_nome}</span>
                            </div>
                          )}
                          {s.istruttore_nome && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20 text-xs">
                              <UserCheck className="h-3 w-3 text-[#3b82f6]" />
                              <span className="text-[#e8fbff]/50">Istruttore:</span>
                              <span className="text-[#e8fbff] font-medium">{s.istruttore_nome}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lista partecipanti (imprese iscritte) */}
                      <h5 className="text-xs font-medium text-[#e8fbff]/70 mb-2 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Partecipanti iscritti
                        <Badge variant="outline" className="text-[9px] ml-1 text-[#e8fbff]/50">
                          {s.presenze.length}
                        </Badge>
                      </h5>
                      <div className="space-y-1">
                        {s.presenze.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 bg-[#0b1220] rounded text-xs border border-[#e8fbff]/5"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6] text-[10px] font-bold">
                                {(p.impresa_nome || p.utente_nome || "P").charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[#e8fbff]">
                                {p.impresa_nome || p.utente_nome || p.utente_email || "Partecipante"}
                              </span>
                            </div>
                            <Badge
                              className={`text-[9px] ${
                                p.stato === "PRESENTE"
                                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30"
                                  : p.stato === "CONFERMATO"
                                  ? "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30"
                                  : p.stato === "ASSENTE"
                                  ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30"
                                  : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30"
                              } border`}
                            >
                              {p.stato}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dettaglio espanso: link Jitsi + note */}
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-[#e8fbff]/10 space-y-3">
                      {/* Link Jitsi */}
                      {s.jitsi_link && (
                        <div className="flex items-center gap-2 p-2 bg-[#8b5cf6]/10 rounded-lg border border-[#8b5cf6]/20">
                          <Video className="h-4 w-4 text-[#8b5cf6]" />
                          <a
                            href={s.jitsi_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#8b5cf6] hover:underline truncate flex-1"
                          >
                            {s.jitsi_link}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[#8b5cf6]"
                            onClick={() => {
                              navigator.clipboard.writeText(s.jitsi_link || "");
                              toast.success("Link copiato");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Note */}
                      {s.note && (
                        <p className="text-xs text-[#e8fbff]/50 italic">{s.note}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
