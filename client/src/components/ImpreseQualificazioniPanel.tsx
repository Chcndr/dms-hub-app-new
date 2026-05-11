import { useState, useEffect, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Building2,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Search,
  X,
  TrendingUp,
  Shield,
  GraduationCap,
  Download,
  AlertTriangle,
  XCircle,
  User,
  Eye,
} from "lucide-react";
import {
  addComuneIdToUrl,
  addAssociazioneIdToUrl,
  isAssociazioneImpersonation,
} from "@/hooks/useImpersonation";
import { MIHUB_API_BASE_URL } from "@/config/api";

// ============================================================================
// INTERFACCE TYPESCRIPT
// ============================================================================

export interface ImpresaDTO {
  id: number;
  denominazione: string;
  partita_iva: string;
  codice_fiscale: string;
  comune: string;
  settore?: string;
  concessioni_attive?: any[];
  autorizzazioni_attive?: any[];
  qualificazioni?: any[];
  id_impresa?: number;
  ragione_sociale?: string;
  piva?: string;
  num_qualificazioni_attive?: number;
}

export interface QualificazioneDTO {
  id_qualificazione: number;
  id_impresa: number;
  tipo: string;
  ente_rilascio: string;
  data_rilascio: string;
  data_scadenza: string;
  stato: "ATTIVA" | "SCADUTA" | "IN_VERIFICA";
  note?: string;
  numero_certificato?: string;
  attestato_pdf_id?: number;
}

interface CollaboratoreFormazione {
  id: number;
  nome: string;
  cognome: string;
  ruolo: string;
  mansione: string | null;
  ruolo_sicurezza: string | null;
  codice_fiscale: string | null;
}

interface MatriceEntry {
  collaboratore: CollaboratoreFormazione;
  attestati: Record<string, {
    stato: string;
    data_rilascio: string;
    data_scadenza: string | null;
    ente: string | null;
    attestato_id?: number;
  }>;
  mancanti: string[];
  completezza: number;
}

interface TeamFormazioneData {
  tipo_impresa: string;
  adempimenti_obbligatori: string[];
  tutti_tipi_attestati: string[];
  matrice: MatriceEntry[];
  statistiche: {
    totale_collaboratori: number;
    conformi: number;
    non_conformi: number;
    percentuale_conformita: number;
  };
}

// ============================================================================
// COSTANTI
// ============================================================================

const API_BASE_URL = MIHUB_API_BASE_URL;

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

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

const ImpreseQualificazioniPanel = memo(function ImpreseQualificazioniPanel() {
  const [imprese, setImprese] = useState<ImpresaDTO[]>([]);
  const [selectedImpresa, setSelectedImpresa] = useState<ImpresaDTO | null>(null);
  const [qualificazioni, setQualificazioni] = useState<QualificazioneDTO[]>([]);
  const [teamData, setTeamData] = useState<TeamFormazioneData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rightTab, setRightTab] = useState<"qualifiche" | "formazione">("qualifiche");
  const PAGE_SIZE = 50;

  // Carica lista imprese da API
  useEffect(() => {
    const fetchImprese = async () => {
      setLoading(true);
      try {
        const baseUrl = `${API_BASE_URL}/api/imprese?limit=200`;
        const response = await fetch(
          isAssociazioneImpersonation()
            ? addAssociazioneIdToUrl(baseUrl)
            : addComuneIdToUrl(baseUrl)
        );
        const data = await response.json();
        if (data.success && data.data) {
          const mappedImprese = data.data.map((imp: any) => ({
            ...imp,
            id_impresa: imp.id,
            ragione_sociale: imp.denominazione,
            piva: imp.partita_iva,
            num_qualificazioni_attive:
              (imp.concessioni_attive?.length || 0) +
              (imp.qualificazioni?.length || 0),
          }));
          setImprese(mappedImprese);
        } else {
          setImprese([]);
        }
      } catch (error) {
        console.error("Error fetching imprese:", error);
        setImprese([]);
      } finally {
        setLoading(false);
      }
    };
    fetchImprese();
  }, []);

  // Carica qualificazioni quando si seleziona un'impresa
  useEffect(() => {
    if (selectedImpresa) {
      const fetchQualificazioni = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            addComuneIdToUrl(
              `${API_BASE_URL}/api/imprese/${selectedImpresa.id}/qualificazioni`
            )
          );
          const data = await response.json();
          if (data.success) {
            setQualificazioni(data.data);
          } else {
            setQualificazioni([]);
          }
        } catch (error) {
          console.error("Error fetching qualificazioni:", error);
          setQualificazioni([]);
        } finally {
          setLoading(false);
        }
      };
      fetchQualificazioni();
    } else {
      setQualificazioni([]);
    }
  }, [selectedImpresa]);

  // Carica matrice formazione team quando si seleziona un'impresa
  useEffect(() => {
    if (selectedImpresa) {
      const fetchTeam = async () => {
        setLoadingTeam(true);
        try {
          const teamUrl = `${API_BASE_URL}/api/collaboratori/team/matrice?impresa_id=${selectedImpresa.id}`;
          const response = await fetch(
            isAssociazioneImpersonation()
              ? addAssociazioneIdToUrl(teamUrl)
              : addComuneIdToUrl(teamUrl)
          );
          const data = await response.json();
          if (data.success) {
            setTeamData(data);
          } else {
            setTeamData(null);
          }
        } catch (error) {
          console.error("Error fetching team formazione:", error);
          setTeamData(null);
        } finally {
          setLoadingTeam(false);
        }
      };
      fetchTeam();
    } else {
      setTeamData(null);
    }
  }, [selectedImpresa]);

  const getStatoBadge = (stato: QualificazioneDTO["stato"]) => {
    switch (stato) {
      case "ATTIVA":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Attiva
          </Badge>
        );
      case "SCADUTA":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Scaduta
          </Badge>
        );
      case "IN_VERIFICA":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <Clock className="w-3 h-3 mr-1" />
            In Verifica
          </Badge>
        );
    }
  };

  const getFormazioneBadge = (stato: string) => {
    switch (stato) {
      case "VALIDO":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
            <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Valido
          </Badge>
        );
      case "PROSSIMO":
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-0.5" /> 90gg
          </Badge>
        );
      case "IN_SCADENZA":
        return (
          <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px]">
            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> 30gg
          </Badge>
        );
      case "SCADUTO":
        return (
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">
            <XCircle className="w-2.5 h-2.5 mr-0.5" /> Scaduto
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/15 text-gray-500 border border-gray-500/30 text-[10px]">
            <XCircle className="w-2.5 h-2.5 mr-0.5" /> Mancante
          </Badge>
        );
    }
  };

  // Calcola statistiche
  const totalConcessioni = imprese.reduce(
    (acc, i) => acc + (i.concessioni_attive?.length || 0),
    0
  );
  const totalQualificazioni = imprese.reduce(
    (acc, i) => acc + (i.num_qualificazioni_attive || 0),
    0
  );
  const comuniUnici = Array.from(
    new Set(imprese.map(i => i.comune).filter(Boolean))
  ).length;
  const mediaConcessioni =
    imprese.length > 0 ? (totalConcessioni / imprese.length).toFixed(1) : "0";

  // Filtra imprese in base alla ricerca
  const filteredImprese = imprese.filter(impresa => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (impresa.ragione_sociale || impresa.denominazione)
        ?.toLowerCase()
        .includes(query) ||
      (impresa.piva || impresa.partita_iva)?.toLowerCase().includes(query) ||
      impresa.codice_fiscale?.toLowerCase().includes(query) ||
      impresa.comune?.toLowerCase().includes(query) ||
      impresa.settore?.toLowerCase().includes(query)
    );
  });

  // Paginazione client-side
  const totalPages = Math.ceil(filteredImprese.length / PAGE_SIZE);
  const paginatedImprese = filteredImprese.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset pagina quando cambia la ricerca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Download PDF attestato
  const downloadPdf = async (attestatoId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attestati/${attestatoId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attestato_${attestatoId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Errore download PDF:", err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <Building2 className="w-4 h-4" />
              Imprese Totali
            </div>
            <div className="text-2xl font-bold text-white">
              {imprese.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <FileCheck className="w-4 h-4" />
              Concessioni Attive
            </div>
            <div className="text-2xl font-bold text-white">
              {totalConcessioni}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Comuni Coperti
            </div>
            <div className="text-2xl font-bold text-white">{comuniUnici}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Media Concess./Impresa
            </div>
            <div className="text-2xl font-bold text-white">
              {mediaConcessioni}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLONNA SINISTRA: Lista Imprese */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Seleziona Impresa
            </CardTitle>
            <CardDescription>
              Clicca su un'impresa per visualizzare le sue qualificazioni
            </CardDescription>
            {/* Barra di ricerca */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per ragione sociale, P.IVA, comune..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && !selectedImpresa ? (
              <div className="text-center py-8 text-gray-500">
                Caricamento...
              </div>
            ) : filteredImprese.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? `Nessuna impresa trovata per "${searchQuery}"`
                  : "Nessuna impresa registrata"}
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ragione Sociale</TableHead>
                        <TableHead>P.IVA</TableHead>
                        <TableHead>Comune</TableHead>
                        <TableHead className="text-center">Qualif.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedImprese.map(impresa => (
                        <TableRow
                          key={impresa.id || impresa.id_impresa}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            (selectedImpresa?.id ||
                              selectedImpresa?.id_impresa) ===
                            (impresa.id || impresa.id_impresa)
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : ""
                          }`}
                          onClick={() => setSelectedImpresa(impresa)}
                        >
                          <TableCell className="font-medium">
                            {impresa.ragione_sociale || impresa.denominazione}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {impresa.piva || impresa.partita_iva}
                          </TableCell>
                          <TableCell className="text-sm">
                            {impresa.comune}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {impresa.concessioni_attive?.length || 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Controlli paginazione */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-sm text-gray-400">
                      {filteredImprese.length} imprese totali — Pagina{" "}
                      {currentPage} di {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Successiva
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* COLONNA DESTRA: Qualificazioni + Formazione Team */}
        <div className="space-y-0">
          {/* Sotto-Tab Navigation */}
          <div className="flex border-b border-gray-700 mb-0">
            <button
              onClick={() => setRightTab("qualifiche")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                rightTab === "qualifiche"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Qualifiche Impresa
            </button>
            <button
              onClick={() => setRightTab("formazione")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                rightTab === "formazione"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Formazione Team
              {teamData && teamData.statistiche.non_conformi > 0 && (
                <Badge className="ml-1 bg-red-500/20 text-red-400 border-red-500/30 text-[9px] px-1.5">
                  {teamData.statistiche.non_conformi}
                </Badge>
              )}
            </button>
          </div>

          {/* TAB: Qualifiche Impresa (esistente) */}
          {rightTab === "qualifiche" && (
            <Card className="rounded-t-none border-t-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Qualificazioni
                </CardTitle>
                <CardDescription>
                  {selectedImpresa
                    ? `Qualificazioni di ${selectedImpresa.ragione_sociale || selectedImpresa.denominazione}`
                    : "Seleziona un'impresa per visualizzare le qualificazioni"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImpresa ? (
                  <div className="text-center py-16 text-gray-400">
                    <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Nessuna impresa selezionata</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Caricamento...
                  </div>
                ) : qualificazioni.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Nessuna qualificazione trovata</p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ente</TableHead>
                          <TableHead>Scadenza</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qualificazioni.map(qual => (
                          <TableRow key={qual.id_qualificazione}>
                            <TableCell className="font-medium">
                              {qual.tipo}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {qual.ente_rilascio}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(qual.data_scadenza).toLocaleDateString("it-IT")}
                            </TableCell>
                            <TableCell>{getStatoBadge(qual.stato)}</TableCell>
                            <TableCell>
                              {(qual as any).attestato_pdf_id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const url = (qual as any).attestato_pdf_url
                                        ? `${API_BASE_URL}${(qual as any).attestato_pdf_url}`
                                        : `${API_BASE_URL}/api/attestati/${(qual as any).attestato_pdf_id}/pdf`;
                                      window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                    title="Visualizza PDF"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadPdf((qual as any).attestato_pdf_id)}
                                    className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
                                    title="Scarica PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Note aggiuntive */}
                    {qualificazioni.some(q => q.note) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Note:</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {qualificazioni
                            .filter(q => q.note)
                            .map(q => (
                              <li key={q.id_qualificazione}>
                                <strong>{q.tipo}:</strong> {q.note}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB: Formazione Team (NUOVO per controlli PM/Ispettorato) */}
          {rightTab === "formazione" && (
            <Card className="rounded-t-none border-t-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Conformità Formazione Team
                </CardTitle>
                <CardDescription>
                  {selectedImpresa
                    ? `Stato formazione collaboratori di ${selectedImpresa.ragione_sociale || selectedImpresa.denominazione}`
                    : "Seleziona un'impresa per verificare la conformità formativa"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImpresa ? (
                  <div className="text-center py-16 text-gray-400">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Seleziona un'impresa dalla lista</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Verifica attestati obbligatori di sicurezza, HACCP, antincendio, ecc.
                    </p>
                  </div>
                ) : loadingTeam ? (
                  <div className="text-center py-8 text-gray-500">
                    Caricamento formazione team...
                  </div>
                ) : !teamData || teamData.matrice.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Nessun collaboratore registrato</p>
                    <p className="text-xs mt-1 text-gray-500">
                      L'impresa non ha ancora inserito il proprio team
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Riepilogo Conformità */}
                    <div className={`p-4 rounded-lg border ${
                      teamData.statistiche.percentuale_conformita >= 80
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : teamData.statistiche.percentuale_conformita >= 50
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          Conformità Globale
                        </span>
                        <Badge className={`text-xs border ${
                          teamData.statistiche.percentuale_conformita >= 80
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : teamData.statistiche.percentuale_conformita >= 50
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}>
                          {teamData.statistiche.percentuale_conformita}%
                        </Badge>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-3">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            teamData.statistiche.percentuale_conformita >= 80 ? "bg-emerald-500" :
                            teamData.statistiche.percentuale_conformita >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${teamData.statistiche.percentuale_conformita}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div>
                          <p className="text-lg font-bold text-white">{teamData.statistiche.totale_collaboratori}</p>
                          <p className="text-gray-500">Collaboratori</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-400">{teamData.statistiche.conformi}</p>
                          <p className="text-gray-500">Conformi</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-400">{teamData.statistiche.non_conformi}</p>
                          <p className="text-gray-500">Non Conformi</p>
                        </div>
                      </div>
                    </div>

                    {/* Adempimenti Obbligatori */}
                    <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                        Adempimenti Obbligatori ({teamData.tipo_impresa})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {teamData.adempimenti_obbligatori.map(tipo => (
                          <Badge key={tipo} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]">
                            {TIPO_ATTESTATO_LABELS[tipo] || tipo}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Matrice Collaboratori */}
                    <div className="overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Collaboratore</TableHead>
                            {(teamData.tutti_tipi_attestati || teamData.adempimenti_obbligatori).map(tipo => (
                              <TableHead key={tipo} className="text-[9px] text-center px-1">
                                {(TIPO_ATTESTATO_LABELS[tipo] || tipo).split(" ")[0]}
                              </TableHead>
                            ))}
                            <TableHead className="text-xs text-center">%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamData.matrice.map(entry => (
                            <TableRow key={entry.collaboratore.id}>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-white leading-tight">
                                      {entry.collaboratore.nome} {entry.collaboratore.cognome}
                                    </p>
                                    <p className="text-[9px] text-gray-500">
                                      {entry.collaboratore.ruolo}
                                      {entry.collaboratore.codice_fiscale && ` — ${entry.collaboratore.codice_fiscale}`}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              {(teamData.tutti_tipi_attestati || teamData.adempimenti_obbligatori).map(tipo => {
                                const att = entry.attestati[tipo];
                                const stato = att ? att.stato : "MANCANTE";
                                return (
                                  <TableCell key={tipo} className="text-center px-1 py-2">
                                    <div className="flex flex-col items-center gap-0.5">
                                      {getFormazioneBadge(stato)}
                                      {att && att.attestato_id && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <button
                                            onClick={() => {
                                              window.open(`${API_BASE_URL}/api/attestati/${att.attestato_id}/pdf`, '_blank', 'noopener,noreferrer');
                                            }}
                                            className="text-[8px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                                            title="Visualizza PDF"
                                          >
                                            <Eye className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            onClick={() => downloadPdf(att.attestato_id!)}
                                            className="text-[8px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                                            title="Scarica PDF"
                                          >
                                            <Download className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center py-2">
                                <Badge className={`text-[10px] border ${
                                  entry.completezza === 100 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                                  entry.completezza >= 50 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                  "bg-red-500/15 text-red-400 border-red-500/30"
                                }`}>
                                  {entry.completezza}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Legenda */}
                    <div className="flex flex-wrap gap-3 justify-center pt-2 border-t border-gray-700">
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});

export default ImpreseQualificazioniPanel;
