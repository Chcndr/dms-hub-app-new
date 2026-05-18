/**
 * AnagraficaAssociazionePanel - Anagrafica dell'associazione impersonificata
 * Mostra dati anagrafici, contratti e fatture dell'associazione
 * Visibile solo durante impersonificazione associazione
 *
 * @version 1.0.0
 */
import { useState, useEffect, useCallback, memo} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  FileText,
  Euro,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  Loader2,
  ClipboardCheck,
  Hash,
  Save,
  Users,
  Plus,
  Trash2,
  Edit3,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImpersonationParams, authenticatedFetch } from "@/hooks/useImpersonation";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { apiFetch } from "@/lib/apiFetch";

const API_BASE_URL = MIHUB_API_BASE_URL;

interface AssociazioneData {
  id: number;
  nome: string;
  codice_fiscale?: string;
  partita_iva?: string;
  indirizzo?: string;
  citta?: string;
  provincia?: string;
  cap?: string;
  email?: string;
  telefono?: string;
  pec?: string;
  tipo?: string;
  presidente?: string;
  data_costituzione?: string;
  num_associati?: number;
  quota_annuale?: number | string;
  stato?: string;
}

interface Contratto {
  id: number;
  tipo: string;
  descrizione: string;
  data_inizio: string;
  data_fine: string;
  importo?: number;
  stato: string;
}

interface Fattura {
  id: number;
  numero: string;
  data: string;
  importo: number;
  stato: "pagata" | "in_attesa" | "scaduta";
  descrizione?: string;
}

interface Responsabile {
  id: number;
  nome: string;
  cognome?: string;
  ruolo?: string;
  email?: string;
  telefono?: string;
  settore?: string;
  note?: string;
}

const formatQuotaInput = (value: unknown) => {
  const numero = Number(value);
  return Number.isFinite(numero) ? numero.toFixed(2) : "";
};

const AnagraficaAssociazionePanel = memo(function AnagraficaAssociazionePanel() {
  const [associazione, setAssociazione] = useState<AssociazioneData | null>(
    null
  );
  const [contratti, setContratti] = useState<Contratto[]>([]);
  const [fatture, setFatture] = useState<Fattura[]>([]);
  const [responsabili, setResponsabili] = useState<Responsabile[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaInput, setQuotaInput] = useState("");
  const [quotaSaving, setQuotaSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dati");
  const [showAddResp, setShowAddResp] = useState(false);
  const [editResp, setEditResp] = useState<Responsabile | null>(null);
  const [respForm, setRespForm] = useState({ nome: '', cognome: '', ruolo: 'Responsabile', email: '', telefono: '', settore: '', note: '' });
  const [respSaving, setRespSaving] = useState(false);

  const impState = getImpersonationParams();
  const associazioneId = impState.associazioneId;
  const associazioneNome = impState.associazioneNome
    ? decodeURIComponent(impState.associazioneNome)
    : null;

  const loadData = useCallback(async () => {
    if (!associazioneId) return;
    setLoading(true);
    try {
      const [assocRes, contrattiRes, fattureRes, respRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}`),
        apiFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}/contratti`),
        apiFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}/fatture`),
        apiFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}/responsabili`),
      ]);

      const assocData = await assocRes.json();
      if (assocData.success && assocData.data) {
        setAssociazione(assocData.data);
        setQuotaInput(formatQuotaInput(assocData.data.quota_annuale ?? 50));
      }

      const contrattiData = await contrattiRes.json();
      if (contrattiData.success && contrattiData.data) {
        setContratti(contrattiData.data);
      }

      const fattureData = await fattureRes.json();
      if (fattureData.success && fattureData.data) {
        setFatture(fattureData.data);
      }

      const respData = await respRes.json();
      if (respData.success && respData.responsabili) {
        setResponsabili(respData.responsabili);
      }
    } catch (error) {
      console.error("Errore caricamento anagrafica associazione:", error);
      // Fallback: dati vuoti senza toast (endpoints potrebbero non esistere ancora)
    } finally {
      setLoading(false);
    }
  }, [associazioneId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleQuotaUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ associazioneId?: number | string; quota_annuale?: number }>).detail;
      if (String(detail?.associazioneId) === String(associazioneId)) {
        const quota = formatQuotaInput(detail?.quota_annuale);
        setQuotaInput(quota);
        setAssociazione(prev => prev ? { ...prev, quota_annuale: quota } : prev);
      }
    };
    window.addEventListener("miohub:quota-associazione-updated", handleQuotaUpdated);
    return () => window.removeEventListener("miohub:quota-associazione-updated", handleQuotaUpdated);
  }, [associazioneId]);

  const handleSaveQuota = async () => {
    if (!associazioneId) return;
    const quota = Number(quotaInput);
    if (!Number.isFinite(quota) || quota < 0) {
      toast.error("Inserisci una quota associativa valida");
      return;
    }

    setQuotaSaving(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/associazioni/${associazioneId}/quota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quota_annuale: quota }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = formatQuotaInput(data.data.quota_annuale);
        setQuotaInput(formatted);
        setAssociazione(prev => prev ? { ...prev, quota_annuale: formatted } : prev);
        window.dispatchEvent(
          new CustomEvent("miohub:quota-associazione-updated", {
            detail: { associazioneId, quota_annuale: quota },
          })
        );
        toast.success("Quota associativa aggiornata");
      } else {
        toast.error(data.error || "Errore aggiornamento quota associativa");
      }
    } catch (error) {
      console.error("Errore salvataggio quota associazione:", error);
      toast.error("Errore di connessione");
    } finally {
      setQuotaSaving(false);
    }
  };

  if (!associazioneId) {
    return (
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-[#e8fbff]/50">Nessuna associazione selezionata</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
        </CardContent>
      </Card>
    );
  }

  const getStatoFatturaBadge = (stato: Fattura["stato"]) => {
    switch (stato) {
      case "pagata":
        return (
          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
            Pagata
          </Badge>
        );
      case "in_attesa":
        return (
          <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30">
            In attesa
          </Badge>
        );
      case "scaduta":
        return (
          <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30">
            Scaduta
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#3b82f6]" />
            Anagrafica Associazione
            {associazioneNome && (
              <Badge
                variant="outline"
                className="ml-2 text-[#3b82f6] border-[#3b82f6]/50"
              >
                {associazioneNome}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-[#3b82f6]/30 text-[#3b82f6]"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0b1220] border border-[#3b82f6]/20">
          <TabsTrigger
            value="dati"
            className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
          >
            <Building2 className="h-4 w-4 mr-1" /> Dati
          </TabsTrigger>
          <TabsTrigger
            value="contratti"
            className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
          >
            <ClipboardCheck className="h-4 w-4 mr-1" /> Contratti
          </TabsTrigger>
          <TabsTrigger
            value="fatture"
            className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
          >
            <Euro className="h-4 w-4 mr-1" /> Fatture
          </TabsTrigger>
          <TabsTrigger
            value="responsabili"
            className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
          >
            <Users className="h-4 w-4 mr-1" /> Responsabili
          </TabsTrigger>
        </TabsList>

        {/* Tab Dati */}
        <TabsContent value="dati">
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-6">
              {associazione ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    icon={Building2}
                    label="Nome"
                    value={associazione.nome}
                  />
                  <InfoRow
                    icon={Hash}
                    label="Codice Fiscale"
                    value={associazione.codice_fiscale}
                  />
                  <InfoRow
                    icon={Hash}
                    label="Partita IVA"
                    value={associazione.partita_iva}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label="Tipo"
                    value={associazione.tipo}
                  />
                  <div className="flex items-start gap-3 p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10">
                    <Euro className="h-4 w-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-[#e8fbff]/50">Quota associativa annua</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quotaInput}
                          onChange={e => setQuotaInput(e.target.value)}
                          className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm"
                          placeholder="50.00"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveQuota}
                          disabled={quotaSaving}
                          className="bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                        >
                          {quotaSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-[#e8fbff]/45">
                        Valore unico usato anche dal tab Tesserati e dall'app impresa.
                      </p>
                    </div>
                  </div>
                  <InfoRow
                    icon={MapPin}
                    label="Indirizzo"
                    value={[
                      associazione.indirizzo,
                      associazione.citta,
                      associazione.provincia,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={associazione.email}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Telefono"
                    value={associazione.telefono}
                  />
                  <InfoRow icon={Mail} label="PEC" value={associazione.pec} />
                  <InfoRow
                    icon={Briefcase}
                    label="Presidente"
                    value={associazione.presidente}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Data Costituzione"
                    value={associazione.data_costituzione}
                  />
                </div>
              ) : (
                <p className="text-[#e8fbff]/50 text-center py-8">
                  Dati non disponibili
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contratti */}
        <TabsContent value="contratti">
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-6">
              {contratti.length === 0 ? (
                <div className="text-center py-8 text-[#e8fbff]/50">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Nessun contratto registrato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contratti.map(c => (
                    <div
                      key={c.id}
                      className="p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#e8fbff]">
                          {c.tipo}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[#3b82f6] border-[#3b82f6]/50"
                        >
                          {c.stato}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#e8fbff]/60">
                        {c.descrizione}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#e8fbff]/40">
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {c.data_inizio} - {c.data_fine}
                        </span>
                        {c.importo && (
                          <span>
                            <Euro className="h-3 w-3 inline mr-1" />
                            {c.importo.toLocaleString("it-IT")} EUR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Fatture */}
        <TabsContent value="fatture">
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-6">
              {fatture.length === 0 ? (
                <div className="text-center py-8 text-[#e8fbff]/50">
                  <Euro className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Nessuna fattura registrata</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fatture.map(f => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10"
                    >
                      <div>
                        <p className="font-medium text-[#e8fbff]">
                          Fattura #{f.numero}
                        </p>
                        <p className="text-xs text-[#e8fbff]/50">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {f.data}
                          {f.descrizione && (
                            <span className="ml-2">· {f.descrizione}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#e8fbff]">
                          {f.importo.toLocaleString("it-IT", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          EUR
                        </span>
                        {getStatoFatturaBadge(f.stato)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Tab Responsabili */}
        <TabsContent value="responsabili">
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#e8fbff] font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#3b82f6]" />
                  Responsabili ({responsabili.length})
                </h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setRespForm({ nome: '', cognome: '', ruolo: 'Responsabile', email: '', telefono: '', settore: '', note: '' });
                    setEditResp(null);
                    setShowAddResp(true);
                  }}
                  className="bg-[#10b981] hover:bg-[#059669] text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Aggiungi
                </Button>
              </div>

              {/* Form Aggiungi/Modifica */}
              {(showAddResp || editResp) && (
                <div className="mb-4 p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[#e8fbff] text-sm font-medium">{editResp ? 'Modifica Responsabile' : 'Nuovo Responsabile'}</h4>
                    <Button variant="ghost" size="sm" onClick={() => { setShowAddResp(false); setEditResp(null); }}>
                      <X className="h-4 w-4 text-[#e8fbff]/50" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Nome *</Label>
                      <Input value={respForm.nome} onChange={e => setRespForm(p => ({ ...p, nome: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="Nome" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Cognome</Label>
                      <Input value={respForm.cognome} onChange={e => setRespForm(p => ({ ...p, cognome: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="Cognome" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Ruolo</Label>
                      <Input value={respForm.ruolo} onChange={e => setRespForm(p => ({ ...p, ruolo: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="Responsabile" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Settore</Label>
                      <Input value={respForm.settore} onChange={e => setRespForm(p => ({ ...p, settore: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="Es. Commercio, Turismo..." />
                    </div>
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Email</Label>
                      <Input value={respForm.email} onChange={e => setRespForm(p => ({ ...p, email: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="email@esempio.it" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#e8fbff]/50">Telefono</Label>
                      <Input value={respForm.telefono} onChange={e => setRespForm(p => ({ ...p, telefono: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="+39 ..." />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#e8fbff]/50">Note</Label>
                    <Input value={respForm.note} onChange={e => setRespForm(p => ({ ...p, note: e.target.value }))} className="bg-[#1a2332] border-[#334155] text-[#e8fbff] h-8 text-sm" placeholder="Note aggiuntive..." />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!respForm.nome.trim()) { toast.error('Nome obbligatorio'); return; }
                      setRespSaving(true);
                      try {
                        const url = editResp
                          ? `${API_BASE_URL}/api/associazioni/responsabili/${editResp.id}`
                          : `${API_BASE_URL}/api/associazioni/${associazioneId}/responsabili`;
                        const method = editResp ? 'PUT' : 'POST';
                        const res = await apiFetch(url, {
                          method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(respForm),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(editResp ? 'Responsabile aggiornato' : 'Responsabile aggiunto');
                          setShowAddResp(false);
                          setEditResp(null);
                          loadData();
                        } else {
                          toast.error(data.error || 'Errore');
                        }
                      } catch (err) {
                        toast.error('Errore di connessione');
                      } finally {
                        setRespSaving(false);
                      }
                    }}
                    disabled={respSaving}
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white w-full"
                  >
                    {respSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editResp ? 'Salva Modifiche' : 'Aggiungi Responsabile')}
                  </Button>
                </div>
              )}

              {/* Lista Responsabili */}
              {responsabili.length === 0 ? (
                <div className="text-center py-8 text-[#e8fbff]/50">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Nessun responsabile registrato</p>
                  <p className="text-xs mt-1">Aggiungi i funzionari e responsabili dell'associazione</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {responsabili.map(r => (
                    <div key={r.id} className="p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#e8fbff]">{r.nome} {r.cognome}</span>
                            <Badge variant="outline" className="text-[#8b5cf6] border-[#8b5cf6]/50 text-[10px]">{r.ruolo || 'Responsabile'}</Badge>
                            {r.settore && <Badge variant="outline" className="text-[#f59e0b] border-[#f59e0b]/50 text-[10px]">{r.settore}</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-[#e8fbff]/50">
                            {r.email && <span><Mail className="h-3 w-3 inline mr-1" />{r.email}</span>}
                            {r.telefono && <span><Phone className="h-3 w-3 inline mr-1" />{r.telefono}</span>}
                          </div>
                          {r.note && <p className="text-xs text-[#e8fbff]/30 mt-1">{r.note}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setRespForm({ nome: r.nome, cognome: r.cognome || '', ruolo: r.ruolo || 'Responsabile', email: r.email || '', telefono: r.telefono || '', settore: r.settore || '', note: r.note || '' });
                            setEditResp(r);
                            setShowAddResp(false);
                          }}>
                            <Edit3 className="h-4 w-4 text-[#3b82f6]" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            if (!confirm('Rimuovere questo responsabile?')) return;
                            try {
                              const res = await apiFetch(`${API_BASE_URL}/api/associazioni/responsabili/${r.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (data.success) { toast.success('Responsabile rimosso'); loadData(); }
                              else toast.error(data.error || 'Errore');
                            } catch { toast.error('Errore di connessione'); }
                          }}>
                            <Trash2 className="h-4 w-4 text-[#ef4444]" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10">
      <Icon className="h-4 w-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-[#e8fbff]/50">{label}</p>
        <p className="text-sm text-[#e8fbff]">{value || "-"}</p>
      </div>
    </div>
  );
}

export default AnagraficaAssociazionePanel;
