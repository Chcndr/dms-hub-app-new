import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Trophy,
  List,
  Loader2,
  Eye,
  Trash2,
  Edit,
  BarChart3,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  addComuneIdToUrl,
  authenticatedFetch,
} from "@/hooks/useImpersonation";
import { MIHUB_API_BASE_URL } from "@/config/api";

// ============================================================================
// TIPI
// ============================================================================

interface Bando {
  id: number;
  comune_id: number;
  mercato_id: string | null;
  titolo: string;
  descrizione: string | null;
  data_apertura: string;
  data_chiusura: string;
  stato: string;
  posteggi_disponibili: number;
  note: string | null;
  comune_nome: string | null;
  mercato_nome: string | null;
  num_domande: string;
  created_at: string;
  updated_at: string;
}

interface GraduatoriaEntry {
  posizione: number;
  pratica_id: string;
  richiedente_nome: string;
  richiedente_cf: string;
  settore_merceologico: string;
  anni_impresa: number;
  num_dipendenti: number;
  is_microimpresa: boolean;
  punteggio_totale: number;
  dettaglio_punteggi: {
    criterio_6: number;
    criterio_7a: number;
    criterio_7b: number;
    criterio_8: number;
    criterio_9_1a: number;
    criterio_9_1b: number;
    criterio_9_1c: number;
    criterio_9_1d: number;
    criterio_9_1e: number;
    criterio_9_1f: number;
    criterio_9_1g: number;
  };
}

interface GraduatoriaResult {
  bando_id: number;
  bando_titolo: string;
  bando_stato: string;
  num_domande: number;
  max_values?: {
    max_dipendenti: number;
    max_anni_impresa: number;
    max_ore_formazione: number;
  };
  graduatoria: GraduatoriaEntry[];
}

interface Market {
  id: number;
  code: string;
  name: string;
  municipality: string;
}

// ============================================================================
// HELPER
// ============================================================================

function getStatoBadge(stato: string) {
  const variants: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    BOZZA: { bg: "bg-gray-500/20", text: "text-gray-400", icon: <Edit className="w-3 h-3" /> },
    APERTO: { bg: "bg-green-500/20", text: "text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    CHIUSO: { bg: "bg-red-500/20", text: "text-red-400", icon: <Clock className="w-3 h-3" /> },
    GRADUATORIA_PUBBLICATA: { bg: "bg-purple-500/20", text: "text-purple-400", icon: <Trophy className="w-3 h-3" /> },
  };
  const v = variants[stato] || variants["BOZZA"];
  return (
    <Badge className={`${v.bg} ${v.text} border-0 gap-1`}>
      {v.icon}
      {stato.replace("_", " ")}
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

export default function BandiBolkesteinPanel({
  comuneId,
  comuneNome,
}: {
  comuneId?: number;
  comuneNome?: string;
}) {
  const [activeTab, setActiveTab] = useState("lista");
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);

  // Form nuovo bando
  const [formBando, setFormBando] = useState({
    titolo: "",
    descrizione: "",
    mercato_id: "",
    data_apertura: "",
    data_chiusura: "",
    posteggi_disponibili: "",
    note: "",
  });
  const [savingBando, setSavingBando] = useState(false);

  // Graduatoria
  const [selectedBandoId, setSelectedBandoId] = useState<number | null>(null);
  const [graduatoria, setGraduatoria] = useState<GraduatoriaResult | null>(null);
  const [loadingGraduatoria, setLoadingGraduatoria] = useState(false);

  // Carica bandi
  const loadBandi = async () => {
    setLoading(true);
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/suap/bandi`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBandi(data.data || []);
      }
    } catch (error) {
      console.error("Error loading bandi:", error);
      toast.error("Errore nel caricamento dei bandi");
    } finally {
      setLoading(false);
    }
  };

  // Carica mercati
  const loadMarkets = async () => {
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/markets`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMarkets(data.data || []);
      }
    } catch (error) {
      console.error("Error loading markets:", error);
    }
  };

  useEffect(() => {
    loadBandi();
    loadMarkets();
  }, [comuneId]);

  // Crea nuovo bando
  const handleCreaBando = async () => {
    if (!formBando.titolo || !formBando.data_apertura || !formBando.data_chiusura) {
      toast.error("Compila i campi obbligatori: Titolo, Data Apertura, Data Chiusura");
      return;
    }

    setSavingBando(true);
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/suap/bandi`);
      const res = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comune_id: comuneId,
          mercato_id: formBando.mercato_id || null,
          titolo: formBando.titolo,
          descrizione: formBando.descrizione || null,
          data_apertura: formBando.data_apertura,
          data_chiusura: formBando.data_chiusura,
          posteggi_disponibili: parseInt(formBando.posteggi_disponibili) || 0,
          note: formBando.note || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Bando creato con successo!");
        setFormBando({
          titolo: "",
          descrizione: "",
          mercato_id: "",
          data_apertura: "",
          data_chiusura: "",
          posteggi_disponibili: "",
          note: "",
        });
        loadBandi();
        setActiveTab("lista");
      } else {
        toast.error(data.error || "Errore nella creazione del bando");
      }
    } catch (error: any) {
      console.error("Error creating bando:", error);
      toast.error(error.message || "Errore nella creazione del bando");
    } finally {
      setSavingBando(false);
    }
  };

  // Elimina bando (solo BOZZA)
  const handleDeleteBando = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo bando?")) return;
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/suap/bandi/${id}`);
      const res = await authenticatedFetch(url, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Bando eliminato");
        loadBandi();
      } else {
        toast.error(data.error || "Errore nell'eliminazione");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore nell'eliminazione");
    }
  };

  // Cambia stato bando
  const handleCambiaStato = async (id: number, nuovoStato: string) => {
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/suap/bandi/${id}`);
      const res = await authenticatedFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato: nuovoStato, comune_id: comuneId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Stato aggiornato a ${nuovoStato}`);
        loadBandi();
      } else {
        toast.error(data.error || "Errore nell'aggiornamento");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore nell'aggiornamento");
    }
  };

  // Calcola graduatoria
  const handleCalcolaGraduatoria = async (bandoId: number) => {
    setLoadingGraduatoria(true);
    setSelectedBandoId(bandoId);
    try {
      const url = addComuneIdToUrl(`${MIHUB_API_BASE_URL}/api/suap/bandi/${bandoId}/graduatoria`);
      const res = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comune_id: comuneId }),
      });
      const data = await res.json();
      if (data.success) {
        setGraduatoria(data.data);
        setActiveTab("graduatorie");
        toast.success("Graduatoria calcolata con successo!");
      } else {
        toast.error(data.error || "Errore nel calcolo della graduatoria");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore nel calcolo della graduatoria");
    } finally {
      setLoadingGraduatoria(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e8fbff] flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#f59e0b]" />
            Bandi Bolkestein
          </h2>
          <p className="text-sm text-[#e8fbff]/60">
            Gestione bandi di assegnazione posteggi (D.Lgs. 59/2010)
            {comuneNome && ` - ${comuneNome}`}
          </p>
        </div>
        <Button
          onClick={loadBandi}
          variant="outline"
          size="sm"
          className="border-[#14b8a6]/30 text-[#14b8a6]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-[#0b1220]/50">
          <TabsTrigger
            value="lista"
            className="data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
          >
            <List className="mr-2 h-4 w-4" />
            Bandi ({bandi.length})
          </TabsTrigger>
          <TabsTrigger
            value="crea"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crea Bando
          </TabsTrigger>
          <TabsTrigger
            value="graduatorie"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Graduatorie
          </TabsTrigger>
        </TabsList>

        {/* ================================================================== */}
        {/* TAB LISTA BANDI */}
        {/* ================================================================== */}
        <TabsContent value="lista" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
              <span className="ml-3 text-[#e8fbff]/60">Caricamento bandi...</span>
            </div>
          ) : bandi.length === 0 ? (
            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-[#e8fbff]/20 mx-auto mb-4" />
                <p className="text-[#e8fbff]/60">Nessun bando trovato</p>
                <p className="text-sm text-[#e8fbff]/40 mt-1">
                  Crea il primo bando Bolkestein dal tab "Crea Bando"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bandi.map(bando => (
                <Card
                  key={bando.id}
                  className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/20 hover:border-[#f59e0b]/40 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[#e8fbff]">
                            {bando.titolo}
                          </h3>
                          {getStatoBadge(bando.stato)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1 text-[#e8fbff]/60">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Apertura: {formatDate(bando.data_apertura)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#e8fbff]/60">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Chiusura: {formatDate(bando.data_chiusura)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#e8fbff]/60">
                            <Users className="h-3.5 w-3.5" />
                            <span>Domande: {bando.num_domande || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#e8fbff]/60">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Posteggi: {bando.posteggi_disponibili || 0}</span>
                          </div>
                        </div>
                        {bando.mercato_nome && (
                          <p className="text-xs text-[#14b8a6] mt-1">
                            Mercato: {bando.mercato_nome}
                          </p>
                        )}
                        {bando.descrizione && (
                          <p className="text-xs text-[#e8fbff]/40 mt-1">
                            {bando.descrizione}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {bando.stato === "BOZZA" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                              onClick={() => handleCambiaStato(bando.id, "APERTO")}
                            >
                              Pubblica
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteBando(bando.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {bando.stato === "APERTO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleCambiaStato(bando.id, "CHIUSO")}
                          >
                            Chiudi Bando
                          </Button>
                        )}
                        {(bando.stato === "CHIUSO" || bando.stato === "APERTO") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                            onClick={() => handleCalcolaGraduatoria(bando.id)}
                            disabled={loadingGraduatoria}
                          >
                            {loadingGraduatoria && selectedBandoId === bando.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Trophy className="h-4 w-4 mr-1" />
                            )}
                            Graduatoria
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================================================================== */}
        {/* TAB CREA BANDO */}
        {/* ================================================================== */}
        <TabsContent value="crea" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-400" />
                Nuovo Bando Bolkestein
              </CardTitle>
              <CardDescription className="text-[#e8fbff]/60">
                Definisci un nuovo bando per l'assegnazione dei posteggi mercatali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Titolo Bando *</Label>
                <Input
                  value={formBando.titolo}
                  onChange={e => setFormBando({ ...formBando, titolo: e.target.value })}
                  placeholder="es. Bando Assegnazione Posteggi Mercato Centrale 2026"
                  className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Descrizione</Label>
                <Input
                  value={formBando.descrizione}
                  onChange={e => setFormBando({ ...formBando, descrizione: e.target.value })}
                  placeholder="Descrizione del bando..."
                  className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#e8fbff]">Mercato</Label>
                  <Select
                    value={formBando.mercato_id}
                    onValueChange={value => setFormBando({ ...formBando, mercato_id: value })}
                  >
                    <SelectTrigger className="bg-[#0b1220] border-[#334155] text-[#e8fbff]">
                      <SelectValue placeholder="Seleziona mercato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name} ({m.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#e8fbff]">Posteggi Disponibili</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formBando.posteggi_disponibili}
                    onChange={e => setFormBando({ ...formBando, posteggi_disponibili: e.target.value })}
                    placeholder="0"
                    className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#e8fbff]">Data Apertura *</Label>
                  <Input
                    type="datetime-local"
                    value={formBando.data_apertura}
                    onChange={e => setFormBando({ ...formBando, data_apertura: e.target.value })}
                    className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#e8fbff]">Data Chiusura *</Label>
                  <Input
                    type="datetime-local"
                    value={formBando.data_chiusura}
                    onChange={e => setFormBando({ ...formBando, data_chiusura: e.target.value })}
                    className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Note</Label>
                <Input
                  value={formBando.note}
                  onChange={e => setFormBando({ ...formBando, note: e.target.value })}
                  placeholder="Note aggiuntive..."
                  className="bg-[#0b1220] border-[#334155] text-[#e8fbff]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("lista")}
                  className="border-[#334155] text-[#e8fbff]"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleCreaBando}
                  disabled={savingBando}
                  className="bg-[#f59e0b] text-black hover:bg-[#f59e0b]/80"
                >
                  {savingBando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Crea Bando
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================== */}
        {/* TAB GRADUATORIE */}
        {/* ================================================================== */}
        <TabsContent value="graduatorie" className="space-y-4 mt-4">
          {!graduatoria ? (
            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-[#e8fbff]/20 mx-auto mb-4" />
                <p className="text-[#e8fbff]/60">Nessuna graduatoria calcolata</p>
                <p className="text-sm text-[#e8fbff]/40 mt-1">
                  Seleziona un bando dalla lista e clicca "Graduatoria" per calcolarla
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header graduatoria */}
              <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#e8fbff]">
                        {graduatoria.bando_titolo}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-[#e8fbff]/60">
                        <span>Domande: {graduatoria.num_domande}</span>
                        {graduatoria.max_values && (
                          <>
                            <span>Max Dipendenti: {graduatoria.max_values.max_dipendenti}</span>
                            <span>Max Anni: {graduatoria.max_values.max_anni_impresa}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {getStatoBadge(graduatoria.bando_stato)}
                  </div>
                </CardContent>
              </Card>

              {/* Tabella graduatoria */}
              {graduatoria.graduatoria.length === 0 ? (
                <Card className="bg-[#0a1628] border-[#1e293b]">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500/60 mx-auto mb-3" />
                    <p className="text-[#e8fbff]/60">{graduatoria.graduatoria.length === 0 ? "Nessuna domanda presentata per questo bando" : ""}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[#0a1628] border-[#1e293b]">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#1e293b]">
                            <TableHead className="text-[#14b8a6]">#</TableHead>
                            <TableHead className="text-[#14b8a6]">Richiedente</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.6</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.7a</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.8</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.9.1b</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.9.1c</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.9.1d</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.9.1e</TableHead>
                            <TableHead className="text-[#14b8a6] text-center">Cr.9.1f</TableHead>
                            <TableHead className="text-[#f59e0b] text-center font-bold">TOTALE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {graduatoria.graduatoria.map((entry, idx) => (
                            <TableRow
                              key={entry.pratica_id}
                              className={`border-[#1e293b] ${idx === 0 ? "bg-[#f59e0b]/5" : ""}`}
                            >
                              <TableCell className="font-bold text-[#e8fbff]">
                                {idx === 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4 text-[#f59e0b]" />
                                    {entry.posizione}
                                  </span>
                                ) : (
                                  entry.posizione
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-[#e8fbff] font-medium">{entry.richiedente_nome}</p>
                                  <p className="text-xs text-[#e8fbff]/40">
                                    {entry.richiedente_cf} | Anni: {entry.anni_impresa} | Dip: {entry.num_dipendenti}
                                    {entry.is_microimpresa && " | Micro"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_6}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_7a}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_8}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_9_1b}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_9_1c}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_9_1d}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_9_1e}
                              </TableCell>
                              <TableCell className="text-center text-[#e8fbff]">
                                {entry.dettaglio_punteggi.criterio_9_1f}
                              </TableCell>
                              <TableCell className="text-center font-bold text-[#f59e0b] text-lg">
                                {entry.punteggio_totale}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legenda criteri */}
              <Card className="bg-[#0a1628] border-[#1e293b]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#e8fbff]/60">Legenda Criteri (100 punti totali)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#e8fbff]/50">
                    <span><strong className="text-[#14b8a6]">Cr.6</strong> Stabilita occ. (max 5pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.7a</strong> Anzianita impresa (max 35pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.8</strong> Microimpresa (5pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.9.1b</strong> Prodotti tipici (8pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.9.1c</strong> Consegna domicilio (7pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.9.1d</strong> Progetti innovativi (2pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.9.1e</strong> Mezzi green (6pt)</span>
                    <span><strong className="text-[#14b8a6]">Cr.9.1f</strong> Formazione (max 7pt)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
