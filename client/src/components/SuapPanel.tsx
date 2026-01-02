import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, 
  Search, Filter, Eye, Play, User, Building2, MapPin, FileCheck, Users,
  Plus
} from 'lucide-react';
import { 
  getSuapStats, getSuapPratiche, getSuapPraticaById, 
  createSuapPratica, evaluateSuapPratica,
  SuapStats, SuapPratica, SuapEvento, SuapCheck 
} from '@/api/suap';
import SciaForm from '@/components/suap/SciaForm';
import ConcessioneForm from '@/components/suap/ConcessioneForm';
import { toast } from 'sonner';

// ============================================================================
// TIPI
// ============================================================================

type ViewMode = 'dashboard' | 'list' | 'detail';

interface SuapPraticaFull extends SuapPratica {
  timeline: SuapEvento[];
  checks: SuapCheck[];
  numero_protocollo?: string;
  comune_presentazione?: string;
  tipo_segnalazione?: string;
  motivo_subingresso?: string;
  settore_merceologico?: string;
  ruolo_dichiarante?: string;
  sub_ragione_sociale?: string;
  sub_nome?: string;
  sub_cognome?: string;
  sub_data_nascita?: string;
  sub_luogo_nascita?: string;
  sub_residenza_via?: string;
  sub_residenza_comune?: string;
  sub_residenza_cap?: string;
  sub_sede_via?: string;
  sub_sede_comune?: string;
  sub_sede_provincia?: string;
  sub_sede_cap?: string;
  sub_pec?: string;
  sub_telefono?: string;
  ced_cf?: string;
  ced_ragione_sociale?: string;
  ced_nome?: string;
  ced_cognome?: string;
  ced_data_nascita?: string;
  ced_luogo_nascita?: string;
  ced_residenza_via?: string;
  ced_residenza_comune?: string;
  ced_residenza_cap?: string;
  ced_pec?: string;
  ced_scia_precedente?: string;
  ced_data_presentazione?: string;
  ced_comune_presentazione?: string;
  mercato_id?: string;
  mercato_nome?: string;
  posteggio_id?: string;
  posteggio_numero?: string;
  ubicazione_mercato?: string;
  giorno_mercato?: string;
  fila?: string;
  dimensioni_mq?: number;
  dimensioni_lineari?: string;
  attrezzature?: string;
  notaio_rogante?: string;
  numero_repertorio?: string;
  data_atto?: string;
  del_nome?: string;
  del_cognome?: string;
  del_cf?: string;
  del_data_nascita?: string;
  del_luogo_nascita?: string;
  del_qualifica?: string;
  del_residenza_via?: string;
  del_residenza_comune?: string;
  del_residenza_cap?: string;
}

// ============================================================================
// COMPONENTI HELPER
// ============================================================================

function DataSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="bg-[#0a1628] border-[#1e293b]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-[#00f0ff]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function DataField({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-[#e8fbff]/50 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-[#e8fbff] mt-0.5">{value}</p>
    </div>
  );
}

function formatDate(dateString?: string | null) {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('it-IT');
  } catch {
    return dateString;
  }
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

export default function SuapPanel() {
  // Stati principali
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [stats, setStats] = useState<SuapStats | null>(null);
  const [pratiche, setPratiche] = useState<SuapPratica[]>([]);
  const [selectedPratica, setSelectedPratica] = useState<SuapPraticaFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPratiche, setLoadingPratiche] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showSciaForm, setShowSciaForm] = useState(false);
  const [showConcessioneForm, setShowConcessioneForm] = useState(false);
  const [search, setSearch] = useState('');

  const ENTE_ID = '00000000-0000-0000-0000-000000000001';

  // Carica statistiche
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getSuapStats(ENTE_ID);
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Carica pratiche
  useEffect(() => {
    loadPratiche();
  }, []);

  async function loadPratiche() {
    setLoadingPratiche(true);
    try {
      const data = await getSuapPratiche(ENTE_ID);
      // Ordina per data di creazione (più recenti prima)
      const sorted = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPratiche(sorted);
    } catch (error) {
      console.error('Failed to load pratiche', error);
      setPratiche([]);
    } finally {
      setLoadingPratiche(false);
    }
  }

  // Carica dettaglio pratica
  async function loadPraticaDetail(id: string) {
    setLoadingDetail(true);
    try {
      const data = await getSuapPraticaById(id, ENTE_ID);
      setSelectedPratica(data as SuapPraticaFull);
      setViewMode('detail');
    } catch (error) {
      console.error('Failed to load pratica detail', error);
      toast.error('Errore caricamento pratica');
    } finally {
      setLoadingDetail(false);
    }
  }

  // Valuta pratica
  async function handleEvaluate() {
    if (!selectedPratica) return;
    setEvaluating(true);
    try {
      await evaluateSuapPratica(selectedPratica.id, ENTE_ID);
      toast.success('Valutazione completata');
      await loadPraticaDetail(selectedPratica.id);
      await loadPratiche();
      const newStats = await getSuapStats(ENTE_ID);
      setStats(newStats);
    } catch (error) {
      console.error('Evaluation failed', error);
      toast.error('Errore durante la valutazione');
    } finally {
      setEvaluating(false);
    }
  }

  // Handler per submit SCIA
  const handleSciaSubmit = async (data: any) => {
    try {
      const praticaData = {
        tipo_pratica: `SCIA ${data.tipo_segnalazione || data.motivazione_scia || 'Subingresso'}`.toUpperCase(),
        richiedente_nome: data.ragione_sociale_sub || `${data.nome_sub || ''} ${data.cognome_sub || ''}`.trim() || 'Non specificato',
        richiedente_cf: data.cf_subentrante || 'NON_SPECIFICATO',
        oggetto: `${(data.tipo_segnalazione || data.motivazione_scia || 'Subingresso').toUpperCase()} - Mercato: ${data.mercato || 'N/D'} - Posteggio: ${data.posteggio || 'N/D'}`,
        numero_protocollo: data.numero_protocollo,
        data_presentazione: data.data_presentazione,
        comune_presentazione: data.comune_presentazione,
        tipo_segnalazione: data.tipo_segnalazione,
        motivo_subingresso: data.motivo_subingresso,
        settore_merceologico: data.settore_merceologico,
        ruolo_dichiarante: data.ruolo_dichiarante,
        sub_ragione_sociale: data.ragione_sociale_sub,
        sub_nome: data.nome_sub,
        sub_cognome: data.cognome_sub,
        sub_data_nascita: data.data_nascita_sub,
        sub_luogo_nascita: data.luogo_nascita_sub,
        sub_residenza_via: data.residenza_sub,
        sub_residenza_comune: data.comune_residenza_sub,
        sub_residenza_cap: data.cap_residenza_sub,
        sub_sede_via: data.sede_impresa_sub,
        sub_sede_comune: data.comune_sede_sub,
        sub_sede_provincia: data.provincia_sede_sub,
        sub_sede_cap: data.cap_sede_sub,
        sub_pec: data.pec_sub,
        sub_telefono: data.telefono_sub,
        ced_cf: data.cf_cedente,
        ced_ragione_sociale: data.ragione_sociale_cedente,
        ced_nome: data.nome_cedente,
        ced_cognome: data.cognome_cedente,
        ced_data_nascita: data.data_nascita_cedente,
        ced_luogo_nascita: data.luogo_nascita_cedente,
        ced_residenza_via: data.residenza_cedente,
        ced_residenza_comune: data.comune_cedente,
        ced_residenza_cap: data.cap_cedente,
        ced_pec: data.pec_cedente,
        ced_scia_precedente: data.scia_precedente,
        ced_data_presentazione: data.data_presentazione_cedente,
        ced_comune_presentazione: data.comune_presentazione_cedente,
        mercato_id: data.mercato,
        mercato_nome: data.mercato_nome,
        posteggio_id: data.posteggio,
        posteggio_numero: data.posteggio_numero,
        ubicazione_mercato: data.ubicazione_mercato,
        giorno_mercato: data.giorno_mercato,
        fila: data.fila,
        dimensioni_mq: data.dimensioni_mq,
        dimensioni_lineari: data.dimensioni_lineari,
        attrezzature: data.attrezzature,
        notaio_rogante: data.notaio,
        numero_repertorio: data.repertorio,
        data_atto: data.data_atto,
        del_nome: data.delegato_nome,
        del_cognome: data.delegato_cognome,
        del_cf: data.delegato_cf,
        del_data_nascita: data.delegato_data_nascita,
        del_luogo_nascita: data.delegato_luogo_nascita,
        del_qualifica: data.delegato_qualifica,
        del_residenza_via: data.delegato_residenza,
        del_residenza_comune: data.delegato_comune,
        del_residenza_cap: data.delegato_cap
      };
      
      const newPratica = await createSuapPratica(ENTE_ID, praticaData);
      setShowSciaForm(false);
      toast.success("SCIA Inviata con successo!", { 
        description: `Protocollo: ${newPratica.cui || data.numero_protocollo}` 
      });
      
      await loadPratiche();
      const newStats = await getSuapStats(ENTE_ID);
      setStats(newStats);
    } catch (error: any) {
      console.error('Errore creazione SCIA:', error);
      toast.error("Errore Creazione SCIA", { 
        description: error?.message?.includes('Failed') 
          ? "Impossibile contattare il server. Riprova tra poco." 
          : error?.message || 'Errore sconosciuto'
      });
    }
  };

  // Formatta la data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT');
  };

  // Mappa stato a colore badge
  const getStatoBadge = (stato: string) => {
    const colors: Record<string, string> = {
      'RECEIVED': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'PRECHECK': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'EVALUATED': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'APPROVED': 'bg-green-500/20 text-green-400 border-green-500/30',
      'REJECTED': 'bg-red-500/20 text-red-400 border-red-500/30',
      'IN_LAVORAZIONE': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'INTEGRATION_NEEDED': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[stato] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Filtra pratiche
  const filteredPratiche = pratiche.filter(p => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      p.cui?.toLowerCase().includes(query) ||
      p.richiedente_nome?.toLowerCase().includes(query) ||
      p.richiedente_cf?.toLowerCase().includes(query) ||
      p.tipo_pratica?.toLowerCase().includes(query)
    );
  });

  // Torna indietro
  const goBack = () => {
    if (viewMode === 'detail') {
      setViewMode('list');
      setSelectedPratica(null);
    } else if (viewMode === 'list') {
      setViewMode('dashboard');
    }
  };

  // ============================================================================
  // RENDER: DASHBOARD VIEW
  // ============================================================================

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header con pulsanti */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#e8fbff]">SSO SUAP</h2>
          <p className="text-[#e8fbff]/60 text-sm">Gestione pratiche amministrative e integrazione PDND</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-[#e8fbff]/20 text-[#e8fbff] hover:bg-[#e8fbff]/10"
            onClick={() => setViewMode('list')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Lista Pratiche
          </Button>
          <Button 
            className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90"
            onClick={() => setShowSciaForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuova SCIA
          </Button>
          <Button 
            className="bg-[#e8fbff] text-black hover:bg-[#e8fbff]/90"
            onClick={() => setShowConcessioneForm(true)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Concessione
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0a1628] border-[#1e293b]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#e8fbff]/80">Totale Pratiche</CardTitle>
            <FileText className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e8fbff]">{stats?.total || 0}</div>
            <p className="text-xs text-[#e8fbff]/60">+20.1% dal mese scorso</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1628] border-[#1e293b]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#e8fbff]/80">In Lavorazione</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e8fbff]">{stats?.in_lavorazione || 0}</div>
            <p className="text-xs text-[#e8fbff]/60">Richiedono attenzione</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1628] border-[#1e293b]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#e8fbff]/80">Approvate Auto</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e8fbff]">{stats?.approvate || 0}</div>
            <p className="text-xs text-[#e8fbff]/60">Processate automaticamente</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1628] border-[#1e293b]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#e8fbff]/80">Rigettate / Bloccate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e8fbff]">{stats?.rigettate || 0}</div>
            <p className="text-xs text-[#e8fbff]/60">Anomalie rilevate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-[#0a1628] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-[#e8fbff]">Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingPratiche ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00f0ff]" />
                  <span className="ml-2 text-[#e8fbff]/60">Caricamento pratiche...</span>
                </div>
              ) : pratiche.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-[#e8fbff]/20 mb-4" />
                  <p className="text-[#e8fbff]/60">Nessuna pratica presente</p>
                  <p className="text-sm text-[#e8fbff]/40 mt-2">
                    Clicca su "Nuova SCIA" per creare la prima pratica
                  </p>
                </div>
              ) : (
                pratiche.slice(0, 5).map((pratica) => (
                  <div 
                    key={pratica.id} 
                    className="flex items-center cursor-pointer hover:bg-[#1e293b]/30 p-2 rounded-lg transition-colors"
                    onClick={() => loadPraticaDetail(pratica.id)}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none text-[#e8fbff]">
                          {pratica.tipo_pratica}
                        </p>
                        <Badge variant="outline" className={getStatoBadge(pratica.stato)}>
                          {pratica.stato}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#e8fbff]/60">
                        {pratica.richiedente_nome} - {pratica.richiedente_cf}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-[#e8fbff]/60 text-sm">
                      {formatRelativeTime(pratica.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-[#0a1628] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-[#e8fbff]">Stato Integrazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-[#e8fbff]">PDND Interoperabilità</span>
                </div>
                <span className="text-xs text-[#e8fbff]/60">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-[#e8fbff]">INPS DURC OnLine</span>
                </div>
                <span className="text-xs text-[#e8fbff]/60">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-[#e8fbff]">Agenzia Entrate</span>
                </div>
                <span className="text-xs text-[#e8fbff]/60">Latenza Alta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: LIST VIEW
  // ============================================================================

  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#e8fbff]/60 hover:text-[#e8fbff]"
            onClick={goBack}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#e8fbff]">Lista Pratiche</h2>
            <p className="text-[#e8fbff]/60 text-sm">Elenco completo delle istanze ricevute</p>
          </div>
        </div>
        <Button 
          className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90"
          onClick={() => setShowSciaForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuova SCIA
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#e8fbff]/40" />
          <Input 
            placeholder="Cerca per CUI, Richiedente o CF..." 
            className="pl-10 bg-[#0a1628] border-[#1e293b] text-[#e8fbff]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-[#e8fbff]/20 text-[#e8fbff]">
          <Filter className="mr-2 h-4 w-4" />
          Filtri Avanzati
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#0a1628] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b [&_tr]:border-[#1e293b]">
                <tr className="border-b border-[#1e293b] transition-colors hover:bg-[#1e293b]/50">
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">CUI</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Tipo</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Richiedente</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Data</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Stato</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Score</th>
                  <th className="h-12 px-4 align-middle font-medium text-[#e8fbff]/60">Azioni</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loadingPratiche ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-[#e8fbff]/60">
                      <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                      Caricamento...
                    </td>
                  </tr>
                ) : filteredPratiche.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-[#e8fbff]/60">Nessuna pratica trovata</td>
                  </tr>
                ) : (
                  filteredPratiche.map((p) => (
                    <tr key={p.id} className="border-b border-[#1e293b] transition-colors hover:bg-[#1e293b]/50">
                      <td className="p-4 font-medium text-[#e8fbff]">{p.cui}</td>
                      <td className="p-4 text-[#e8fbff]">{p.tipo_pratica}</td>
                      <td className="p-4 text-[#e8fbff]">
                        <div>{p.richiedente_nome}</div>
                        <div className="text-xs text-[#e8fbff]/40">{p.richiedente_cf}</div>
                      </td>
                      <td className="p-4 text-[#e8fbff]">{new Date(p.data_presentazione).toLocaleDateString('it-IT')}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={getStatoBadge(p.stato)}>
                          {p.stato}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#e8fbff]">
                        {p.score !== undefined && p.score !== null ? (
                          <span className={p.score >= 80 ? 'text-green-400' : p.score >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                            {p.score}/100
                          </span>
                        ) : <span className="text-[#e8fbff]/40">0/100</span>}
                      </td>
                      <td className="p-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#00f0ff] hover:text-[#00f0ff]/80 hover:bg-[#00f0ff]/10"
                          onClick={() => loadPraticaDetail(p.id)}
                          disabled={loadingDetail}
                        >
                          {loadingDetail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================================
  // RENDER: DETAIL VIEW
  // ============================================================================

  const renderDetail = () => {
    if (!selectedPratica) return null;
    
    const hasSciaData = selectedPratica.sub_nome || selectedPratica.sub_cognome || selectedPratica.mercato_nome || selectedPratica.ced_cf;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#e8fbff]/60 hover:text-[#e8fbff]"
              onClick={goBack}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[#e8fbff]">{selectedPratica.cui}</h2>
                <Badge variant="outline" className={getStatoBadge(selectedPratica.stato)}>
                  {selectedPratica.stato}
                </Badge>
              </div>
              <p className="text-[#e8fbff]/60 text-sm">
                {selectedPratica.tipo_pratica} - {selectedPratica.richiedente_nome} ({selectedPratica.richiedente_cf})
              </p>
            </div>
          </div>
          <Button 
            onClick={handleEvaluate} 
            disabled={evaluating || selectedPratica.stato === 'APPROVED' || selectedPratica.stato === 'REJECTED'}
            className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90"
          >
            {evaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Esegui Valutazione
          </Button>
        </div>

        {/* Dati SCIA Completi */}
        {hasSciaData && (
          <div className="space-y-6">
            {/* Dati Pratica */}
            <DataSection title="Dati Pratica SCIA" icon={FileCheck}>
              <DataField label="Numero Protocollo" value={selectedPratica.numero_protocollo || selectedPratica.cui} />
              <DataField label="Data Presentazione" value={formatDate(selectedPratica.data_presentazione)} />
              <DataField label="Comune Presentazione" value={selectedPratica.comune_presentazione} />
              <DataField label="Tipo Segnalazione" value={selectedPratica.tipo_segnalazione} />
              <DataField label="Motivo Subingresso" value={selectedPratica.motivo_subingresso} />
              <DataField label="Settore Merceologico" value={selectedPratica.settore_merceologico} />
              <DataField label="Ruolo Dichiarante" value={selectedPratica.ruolo_dichiarante} />
            </DataSection>

            {/* Dati Subentrante */}
            {(selectedPratica.sub_nome || selectedPratica.sub_cognome || selectedPratica.sub_ragione_sociale) && (
              <DataSection title="Dati Subentrante (Cessionario)" icon={User}>
                <DataField label="Ragione Sociale" value={selectedPratica.sub_ragione_sociale} />
                <DataField label="Nome" value={selectedPratica.sub_nome} />
                <DataField label="Cognome" value={selectedPratica.sub_cognome} />
                <DataField label="Codice Fiscale" value={selectedPratica.richiedente_cf} />
                <DataField label="Data di Nascita" value={formatDate(selectedPratica.sub_data_nascita)} />
                <DataField label="Luogo di Nascita" value={selectedPratica.sub_luogo_nascita} />
                <DataField label="PEC" value={selectedPratica.sub_pec} />
                <DataField label="Telefono" value={selectedPratica.sub_telefono} />
              </DataSection>
            )}

            {/* Dati Cedente */}
            {(selectedPratica.ced_nome || selectedPratica.ced_cognome || selectedPratica.ced_cf) && (
              <DataSection title="Dati Cedente (Dante Causa)" icon={Users}>
                <DataField label="Codice Fiscale" value={selectedPratica.ced_cf} />
                <DataField label="Ragione Sociale" value={selectedPratica.ced_ragione_sociale} />
                <DataField label="Nome" value={selectedPratica.ced_nome} />
                <DataField label="Cognome" value={selectedPratica.ced_cognome} />
                <DataField label="SCIA Precedente N. Prot." value={selectedPratica.ced_scia_precedente} />
              </DataSection>
            )}

            {/* Dati Atto Notarile */}
            {(selectedPratica.notaio_rogante || selectedPratica.numero_repertorio) && (
              <DataSection title="Estremi Atto Notarile" icon={FileText}>
                <DataField label="Notaio Rogante" value={selectedPratica.notaio_rogante} />
                <DataField label="N. Repertorio" value={selectedPratica.numero_repertorio} />
                <DataField label="Data Atto" value={formatDate(selectedPratica.data_atto)} />
              </DataSection>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Checks */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-[#e8fbff]">Controlli Automatici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedPratica.checks.length === 0 ? (
                    <p className="text-[#e8fbff]/40 italic">Nessun controllo eseguito ancora.</p>
                  ) : (
                    selectedPratica.checks.map((check) => (
                      <div key={check.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1e293b]/30 border border-[#1e293b]">
                        <div className="flex items-center gap-3">
                          {check.esito ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#e8fbff]">{check.check_code}</p>
                            <p className="text-xs text-[#e8fbff]/60">Fonte: {check.fonte}</p>
                          </div>
                        </div>
                        <div className="text-xs text-[#e8fbff]/40">
                          {new Date(check.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-[#e8fbff]">Documentazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#1e293b] rounded-lg">
                  <p className="text-[#e8fbff]/40">Nessun documento allegato</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Score & Timeline */}
          <div className="space-y-6">
            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-[#e8fbff]">Punteggio Affidabilità</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-[#1e293b]">
                  <span className="text-4xl font-bold text-[#e8fbff]">{selectedPratica.score ?? 0}</span>
                </div>
                <p className="mt-4 text-sm text-[#e8fbff]/60 text-center">
                  Basato su {selectedPratica.checks.length} controlli effettuati
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0a1628] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-[#e8fbff]">Timeline Eventi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-[#1e293b] ml-2 space-y-6">
                  {selectedPratica.timeline.map((event) => (
                    <div key={event.id} className="ml-6 relative">
                      <div className="absolute -left-[29px] h-3 w-3 rounded-full bg-[#00f0ff] border-2 border-[#0a1628]" />
                      <p className="text-xs text-[#e8fbff]/40 mb-1">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-[#e8fbff]">{event.tipo_evento}</p>
                      <p className="text-xs text-[#e8fbff]/60 mt-1">{event.descrizione}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPALE
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
        <span className="ml-3 text-[#e8fbff]">Caricamento SUAP...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Modal Form SCIA */}
      {showSciaForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <SciaForm 
              onCancel={() => setShowSciaForm(false)} 
              onSubmit={handleSciaSubmit} 
            />
          </div>
        </div>
      )}

      {/* Modal Form Concessione */}
      {showConcessioneForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <ConcessioneForm 
              onCancel={() => setShowConcessioneForm(false)} 
              onSubmit={async (data) => {
                setShowConcessioneForm(false);
                toast.success("Concessione Rilasciata", { description: `N. ${data.numero_concessione}` });
              }} 
            />
          </div>
        </div>
      )}

      {/* Contenuto principale basato sulla vista */}
      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
    </div>
  );
}
