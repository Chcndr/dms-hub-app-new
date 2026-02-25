import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, ArrowRight, ArrowDown, Calendar, Building2, MapPin,
  FileText, RefreshCw, ChevronDown, ChevronUp, History, X, User, Wallet
} from 'lucide-react';
import { addComuneIdToUrl } from '@/hooks/useImpersonation';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/formatUtils';

interface StoricoEvento {
  id: number;
  posteggio_id: number;
  market_id: number;
  data_evento: string;
  tipo_evento: string;
  cedente_impresa_id: number | null;
  cedente_ragione_sociale: string | null;
  cedente_cf: string | null;
  subentrante_impresa_id: number | null;
  subentrante_ragione_sociale: string | null;
  subentrante_cf: string | null;
  concessione_cedente_id: number | null;
  concessione_subentrante_id: number | null;
  scia_cedente_numero: string | null;
  scia_cedente_data: string | null;
  scia_cedente_comune: string | null;
  scia_subentrante_numero: string | null;
  scia_subentrante_data: string | null;
  scia_subentrante_comune: string | null;
  scia_subentrante_id: string | null;
  autorizzazione_precedente_pg: string | null;
  autorizzazione_precedente_data: string | null;
  autorizzazione_precedente_intestatario: string | null;
  riferimento_precedente_tipo: string | null;
  riferimento_precedente_id: string | null;
  riferimento_attuale_tipo: string | null;
  riferimento_attuale_id: string | null;
  saldo_trasferito: number;
  dati_presenze_cedente_json: any[] | null;
  dati_graduatoria_cedente_json: any[] | null;
  dati_scadenze_cedente_json: any[] | null;
  note: string | null;
  posteggio_numero: string | null;
  mercato_nome: string | null;
}

interface PosteggioChain {
  posteggio_id: number;
  posteggio_numero: string;
  eventi: StoricoEvento[];
  titolareAttuale: string | null;
  titolareAttualeId: number | null;
}

interface StoricoTitolaritaProps {
  comuneId?: number;
  marketId?: number;
}

const API_BASE = 'https://api.mio-hub.me/api';

export default function StoricoTitolarita({ comuneId, marketId: initialMarketId }: StoricoTitolaritaProps) {
  const [searchPosteggio, setSearchPosteggio] = useState('');
  const [eventi, setEventi] = useState<StoricoEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPosteggio, setExpandedPosteggio] = useState<number | null>(null);
  const [expandedEvento, setExpandedEvento] = useState<number | null>(null);
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedPosteggio, setSelectedPosteggio] = useState<number | null>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | undefined>(initialMarketId);

  // Raggruppa eventi per posteggio e costruisce la catena
  const buildChains = useCallback((eventiList: StoricoEvento[]): PosteggioChain[] => {
    const grouped: Record<number, StoricoEvento[]> = {};
    
    eventiList.forEach(e => {
      const pid = e.posteggio_id;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(e);
    });

    return Object.entries(grouped).map(([pid, evts]) => {
      // Ordina cronologicamente (dal più vecchio al più recente)
      const sorted = evts.sort((a, b) => 
        new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime()
      );
      
      // Il titolare attuale è il subentrante dell'ultimo evento
      const ultimo = sorted[sorted.length - 1];
      
      return {
        posteggio_id: parseInt(pid),
        posteggio_numero: sorted[0]?.posteggio_numero || pid,
        eventi: sorted,
        titolareAttuale: ultimo?.subentrante_ragione_sociale || null,
        titolareAttualeId: ultimo?.subentrante_impresa_id || null,
      };
    }).sort((a, b) => {
      // Ordina per numero posteggio
      const numA = parseInt(a.posteggio_numero) || 0;
      const numB = parseInt(b.posteggio_numero) || 0;
      if (numA !== numB) return numA - numB;
      return a.posteggio_numero.localeCompare(b.posteggio_numero);
    });
  }, []);

  // Carica lista mercati del comune
  const loadMarkets = useCallback(async () => {
    try {
      const url = addComuneIdToUrl(`${API_BASE}/markets`);
      const response = await fetch(url);
      const data = await response.json();
      const marketList = Array.isArray(data) ? data : (data.data || data.markets || []);
      setMarkets(marketList);
      if (!selectedMarketId && marketList.length > 0) {
        setSelectedMarketId(marketList[0].id);
      }
    } catch (err) {
      console.error('Errore caricamento mercati:', err);
    }
  }, [selectedMarketId]);

  const loadStalls = useCallback(async () => {
    if (!selectedMarketId) return;
    try {
      const url = addComuneIdToUrl(`${API_BASE}/stalls?market_id=${selectedMarketId}`);
      const response = await fetch(url);
      const data = await response.json();
      if (data.success !== false) {
        const stallList = Array.isArray(data) ? data : (data.data || []);
        setStalls(stallList.sort((a: any, b: any) => {
          const numA = parseInt(a.number) || 0;
          const numB = parseInt(b.number) || 0;
          return numA - numB;
        }));
      }
    } catch (err) {
      console.error('Errore caricamento posteggi:', err);
    }
  }, [selectedMarketId]);

  const loadStoricoMercato = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      let url = `${API_BASE}/concessions/storico-titolarita/mercato/${selectedMarketId}?limit=200`;
      if (comuneId) url += `&comune_id=${comuneId}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEventi(data.data || []);
      } else {
        toast.error('Errore nel caricamento dello storico');
      }
    } catch (err) {
      console.error('Errore:', err);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId, comuneId]);

  const loadStoricoPosteggio = useCallback(async (posteggioId: number) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/concessions/storico-titolarita/${posteggioId}`;
      if (comuneId) url += `?comune_id=${comuneId}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEventi(data.data || []);
        setSelectedPosteggio(posteggioId);
      } else {
        toast.error('Errore nel caricamento dello storico');
      }
    } catch (err) {
      console.error('Errore:', err);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, [comuneId]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);
  useEffect(() => {
    if (selectedMarketId) {
      loadStalls();
      loadStoricoMercato();
    }
  }, [selectedMarketId, loadStalls, loadStoricoMercato]);

  const getTipoEventoBadge = (tipo: string) => {
    switch (tipo) {
      case 'SUBINGRESSO':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Subingresso</Badge>;
      case 'RINNOVO':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Rinnovo</Badge>;
      case 'CREAZIONE':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Creazione</Badge>;
      case 'CESSAZIONE':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cessazione</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 text-xs">{tipo}</Badge>;
    }
  };

  const handleSearchPosteggio = () => {
    if (!searchPosteggio.trim()) {
      setSelectedPosteggio(null);
      loadStoricoMercato();
      return;
    }
    const found = stalls.find((s: any) =>
      String(s.number).toLowerCase() === searchPosteggio.toLowerCase().trim()
    );
    if (found) {
      loadStoricoPosteggio(found.id);
    } else {
      toast.error(`Posteggio "${searchPosteggio}" non trovato`);
    }
  };

  const clearSearch = () => {
    setSearchPosteggio('');
    setSelectedPosteggio(null);
    loadStoricoMercato();
  };

  const chains = buildChains(eventi);

  return (
    <div className="space-y-4">
      {/* Header con ricerca */}
      <Card className="bg-[#1e293b] border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <History className="h-5 w-5 text-amber-400" />
            Storico Titolarità Posteggio
          </CardTitle>
          <CardDescription className="text-gray-400">
            Timeline a catena dei cambi di titolarità per ogni posteggio.
            Dati archiviati per graduatorie Bolkestein e documentazione legale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mercato</label>
              <select
                value={selectedMarketId || ''}
                onChange={(e) => {
                  setSelectedMarketId(parseInt(e.target.value));
                  setSelectedPosteggio(null);
                  setSearchPosteggio('');
                  setExpandedPosteggio(null);
                }}
                className="bg-[#0f172a] border border-gray-600 text-white rounded-md px-3 py-2 text-sm min-w-[200px]"
              >
                {markets.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name || m.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-1 block">Cerca per numero posteggio</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Es. A001, 7, 151..."
                  value={searchPosteggio}
                  onChange={(e) => setSearchPosteggio(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPosteggio()}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
                <Button
                  onClick={handleSearchPosteggio}
                  className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                >
                  <Search className="h-4 w-4 mr-1" /> Cerca
                </Button>
                {selectedPosteggio && (
                  <Button onClick={clearSearch} variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                    <X className="h-4 w-4 mr-1" /> Tutti
                  </Button>
                )}
                <Button
                  onClick={() => { setSelectedPosteggio(null); loadStoricoMercato(); }}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {selectedPosteggio && (
            <div className="mt-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <MapPin className="h-3 w-3 mr-1" />
                Filtro attivo: Posteggio {stalls.find(s => s.id === selectedPosteggio)?.number || selectedPosteggio}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline a catena per posteggio */}
      {loading ? (
        <Card className="bg-[#1e293b] border-gray-700">
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-400 mr-2" />
            <span className="text-gray-400">Caricamento storico...</span>
          </CardContent>
        </Card>
      ) : chains.length === 0 ? (
        <Card className="bg-[#1e293b] border-gray-700">
          <CardContent className="text-center py-12 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nessun evento di titolarità registrato</p>
            <p className="text-sm mt-1">Gli eventi verranno registrati automaticamente durante i subingressi e i rinnovi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <Card key={chain.posteggio_id} className="bg-[#1e293b] border-gray-700 overflow-hidden">
              {/* Header posteggio - cliccabile per espandere */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#0f172a]/50 transition-colors"
                onClick={() => setExpandedPosteggio(expandedPosteggio === chain.posteggio_id ? null : chain.posteggio_id)}
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm font-bold px-3 py-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {chain.posteggio_numero}
                  </Badge>
                  
                  {/* Mini catena inline */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {chain.eventi.map((ev, idx) => (
                      <React.Fragment key={ev.id}>
                        {idx === 0 && ev.cedente_ragione_sociale && (
                          <>
                            <span className="text-gray-500 text-xs max-w-[120px] truncate" title={ev.cedente_ragione_sociale}>
                              {ev.cedente_ragione_sociale}
                            </span>
                            <ArrowRight className="h-3 w-3 text-orange-400 flex-shrink-0" />
                          </>
                        )}
                        {idx > 0 && (
                          <ArrowRight className="h-3 w-3 text-orange-400 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs max-w-[120px] truncate ${
                            idx === chain.eventi.length - 1 ? 'text-green-400 font-semibold' : 'text-gray-400'
                          }`}
                          title={ev.subentrante_ragione_sociale || ''}
                        >
                          {ev.subentrante_ragione_sociale || '?'}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                    {chain.eventi.length} passaggi
                  </Badge>
                  {expandedPosteggio === chain.posteggio_id ? (
                    <ChevronUp className="h-5 w-5 text-amber-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Timeline espansa */}
              {expandedPosteggio === chain.posteggio_id && (
                <div className="border-t border-gray-700 px-4 py-4">
                  <div className="relative">
                    {/* Linea verticale della timeline */}
                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-700" />

                    {chain.eventi.map((evento, idx) => (
                      <div key={evento.id} className="relative mb-6 last:mb-0">
                        {/* Nodo della timeline */}
                        <div className="flex items-start gap-4">
                          {/* Pallino timeline */}
                          <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                            idx === chain.eventi.length - 1
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : 'bg-orange-500/20 border-orange-500 text-orange-400'
                          }`}>
                            <span className="text-xs font-bold">{idx + 1}</span>
                          </div>

                          {/* Contenuto evento */}
                          <div className="flex-1 min-w-0">
                            {/* Riga principale */}
                            <div
                              className="flex items-center gap-3 flex-wrap cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedEvento(expandedEvento === evento.id ? null : evento.id);
                              }}
                            >
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(evento.data_evento)}
                              </span>
                              {getTipoEventoBadge(evento.tipo_evento)}

                              {/* Cedente → Subentrante */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-red-400" />
                                  <span className="text-gray-300 text-sm font-medium">
                                    {evento.cedente_ragione_sociale || 'N/D'}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-amber-400" />
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-green-400" />
                                  <span className="text-green-300 text-sm font-medium">
                                    {evento.subentrante_ragione_sociale || 'N/D'}
                                  </span>
                                </div>
                              </div>

                              {/* Saldo */}
                              {evento.saldo_trasferito !== 0 && (
                                <Badge className={`text-xs ${
                                  evento.saldo_trasferito < 0
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                                }`}>
                                  <Wallet className="h-3 w-3 mr-1" />
                                  €{Number(evento.saldo_trasferito).toFixed(2)}
                                </Badge>
                              )}

                              {/* SCIA refs */}
                              {(evento.scia_cedente_numero || evento.scia_subentrante_numero) && (
                                <span className="text-gray-600 text-xs">
                                  SCIA: {evento.scia_subentrante_numero || evento.scia_cedente_numero}
                                </span>
                              )}

                              <ChevronDown className={`h-4 w-4 text-gray-600 group-hover:text-amber-400 transition-transform ${
                                expandedEvento === evento.id ? 'rotate-180' : ''
                              }`} />
                            </div>

                            {/* CF sotto */}
                            <div className="flex items-center gap-4 mt-0.5">
                              {evento.cedente_cf && (
                                <span className="text-gray-600 text-xs">{evento.cedente_cf}</span>
                              )}
                              {evento.cedente_cf && evento.subentrante_cf && (
                                <span className="text-gray-700 text-xs">→</span>
                              )}
                              {evento.subentrante_cf && (
                                <span className="text-gray-600 text-xs">{evento.subentrante_cf}</span>
                              )}
                            </div>

                            {/* Dettagli espansi dell'evento */}
                            {expandedEvento === evento.id && (
                              <div className="mt-3 bg-[#0f172a] rounded-lg p-4 border border-gray-700/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Colonna 1: Riferimenti SCIA e Concessioni */}
                                  <div className="space-y-2">
                                    <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-1">
                                      <FileText className="h-4 w-4" /> Riferimenti
                                    </h4>
                                    <div className="text-sm space-y-1.5">
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Conc. Cedente:</span>
                                        <span className="text-gray-300 text-xs">#{evento.concessione_cedente_id || '-'}</span>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Conc. Subentrante:</span>
                                        <span className="text-gray-300 text-xs">#{evento.concessione_subentrante_id || '-'}</span>
                                      </div>
                                      {evento.scia_cedente_numero && (
                                        <div className="flex justify-between gap-2">
                                          <span className="text-gray-500 text-xs">SCIA Cedente:</span>
                                          <span className="text-gray-300 text-xs">{evento.scia_cedente_numero} ({formatDate(evento.scia_cedente_data)})</span>
                                        </div>
                                      )}
                                      {evento.scia_subentrante_numero && (
                                        <div className="flex justify-between gap-2">
                                          <span className="text-gray-500 text-xs">SCIA Subentrante:</span>
                                          <span className="text-gray-300 text-xs">{evento.scia_subentrante_numero} ({formatDate(evento.scia_subentrante_data)})</span>
                                        </div>
                                      )}
                                      {evento.autorizzazione_precedente_pg && (
                                        <div className="flex justify-between gap-2">
                                          <span className="text-gray-500 text-xs">Aut. Precedente:</span>
                                          <span className="text-gray-300 text-xs">PG {evento.autorizzazione_precedente_pg}</span>
                                        </div>
                                      )}
                                      {evento.riferimento_precedente_tipo && (
                                        <div className="flex justify-between gap-2">
                                          <span className="text-gray-500 text-xs">Rif. Precedente:</span>
                                          <span className="text-gray-300 text-xs">{evento.riferimento_precedente_tipo}</span>
                                        </div>
                                      )}
                                      {evento.riferimento_attuale_tipo && (
                                        <div className="flex justify-between gap-2">
                                          <span className="text-gray-500 text-xs">Rif. Attuale:</span>
                                          <span className="text-gray-300 text-xs">{evento.riferimento_attuale_tipo}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Colonna 2: Dati Archiviati */}
                                  <div className="space-y-2">
                                    <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-1">
                                      <History className="h-4 w-4" /> Dati Archiviati Dante Causa
                                    </h4>
                                    <div className="text-sm space-y-1.5">
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Presenze:</span>
                                        <span className="text-gray-300 text-xs">
                                          {evento.dati_presenze_cedente_json
                                            ? `${Array.isArray(evento.dati_presenze_cedente_json) ? evento.dati_presenze_cedente_json.length : 0} registrate`
                                            : 'Non disponibili'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Graduatoria:</span>
                                        <span className="text-gray-300 text-xs">
                                          {evento.dati_graduatoria_cedente_json
                                            ? `${Array.isArray(evento.dati_graduatoria_cedente_json) ? evento.dati_graduatoria_cedente_json.length : 0} record`
                                            : 'Non disponibile'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Scadenze canone:</span>
                                        <span className="text-gray-300 text-xs">
                                          {evento.dati_scadenze_cedente_json
                                            ? `${Array.isArray(evento.dati_scadenze_cedente_json) ? evento.dati_scadenze_cedente_json.length : 0} rate`
                                            : 'Non disponibili'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 text-xs">Saldo trasferito:</span>
                                        <span className={`text-xs font-semibold ${
                                          evento.saldo_trasferito < 0 ? 'text-red-400' : evento.saldo_trasferito > 0 ? 'text-green-400' : 'text-gray-500'
                                        }`}>
                                          €{Number(evento.saldo_trasferito).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Colonna 3: Note e Mercato */}
                                  <div className="space-y-2">
                                    <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-1">
                                      <Building2 className="h-4 w-4" /> Note
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                      {evento.note || 'Nessuna nota'}
                                    </p>
                                    <div className="text-xs text-gray-600 mt-2">
                                      Mercato: {evento.mercato_nome || '-'}
                                    </div>
                                  </div>
                                </div>

                                {/* Presenze archiviate */}
                                {evento.dati_presenze_cedente_json && Array.isArray(evento.dati_presenze_cedente_json) && evento.dati_presenze_cedente_json.length > 0 && (
                                  <div className="mt-4 border-t border-gray-700 pt-3">
                                    <h4 className="text-amber-400 font-semibold text-xs mb-2">
                                      Presenze Archiviate del Dante Causa ({evento.dati_presenze_cedente_json.length})
                                    </h4>
                                    <div className="max-h-40 overflow-y-auto rounded border border-gray-700/50 text-xs">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-gray-700">
                                            <th className="text-left text-gray-500 px-2 py-1">Data</th>
                                            <th className="text-left text-gray-500 px-2 py-1">Tipo</th>
                                            <th className="text-left text-gray-500 px-2 py-1">Stato</th>
                                            <th className="text-left text-gray-500 px-2 py-1">Ingresso</th>
                                            <th className="text-left text-gray-500 px-2 py-1">Uscita</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {evento.dati_presenze_cedente_json.slice(0, 20).map((p: any, pidx: number) => (
                                            <tr key={pidx} className="border-b border-gray-700/30">
                                              <td className="text-gray-300 px-2 py-1">{formatDate(p.data_presenza || p.date)}</td>
                                              <td className="text-gray-300 px-2 py-1">{p.tipo_presenza || p.type || '-'}</td>
                                              <td className="text-gray-300 px-2 py-1">{p.stato || p.status || '-'}</td>
                                              <td className="text-gray-300 px-2 py-1">{p.ora_ingresso || p.check_in || '-'}</td>
                                              <td className="text-gray-300 px-2 py-1">{p.ora_uscita || p.check_out || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {evento.dati_presenze_cedente_json.length > 20 && (
                                        <div className="text-center py-1 text-gray-500">
                                          ... e altre {evento.dati_presenze_cedente_json.length - 20} presenze
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Nodo finale: titolare attuale */}
                    {chain.titolareAttuale && (
                      <div className="relative">
                        <div className="flex items-start gap-4">
                          <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 bg-green-500/30 border-green-400 text-green-300">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-green-400 font-semibold text-sm">Titolare attuale:</span>
                            <span className="text-white font-semibold text-sm">{chain.titolareAttuale}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Riepilogo */}
      {chains.length > 0 && (
        <div className="flex gap-3 text-sm text-gray-500 flex-wrap">
          <span>Posteggi con storico: {chains.length}</span>
          <span>|</span>
          <span>Totale eventi: {eventi.length}</span>
          <span>|</span>
          <span>Subingressi: {eventi.filter(e => e.tipo_evento === 'SUBINGRESSO').length}</span>
          <span>|</span>
          <span>Rinnovi: {eventi.filter(e => e.tipo_evento === 'RINNOVO').length}</span>
        </div>
      )}
    </div>
  );
}
