import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

// Tipi per i dati dal database
interface Market {
  id: number;
  code: string;
  name: string;
  municipality: string;
  days: string;
  total_stalls: number;
  status: string;
}

interface Stall {
  id: number;
  market_id: number;
  number: string;
  width: string;
  depth: string;
  dimensions: string;
  area_mq: string;
  type: string;
  status: string;
  vendor_business_name?: string;
}

export default function SciaForm({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (data: any) => void }) {
  // Stati per dati dal database
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [loadingImpresa, setLoadingImpresa] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Sezione A - Subentrante
    cf_subentrante: '',
    ragione_sociale_sub: '',
    nome_sub: '',
    cognome_sub: '',
    data_nascita_sub: '',
    luogo_nascita_sub: '',
    residenza_via_sub: '',
    residenza_comune_sub: '',
    residenza_cap_sub: '',
    qualita_sub: 'titolare',
    sede_via_sub: '',
    sede_comune_sub: '',
    sede_cap_sub: '',
    pec_sub: '',
    
    // Sezione B - Cedente
    cf_cedente: '',
    ragione_sociale_ced: '',
    scia_precedente_protocollo: '',
    scia_precedente_data: '',
    scia_precedente_comune: 'BOLOGNA',

    // Sezione C - Posteggio
    mercato: '',
    mercato_id: '',
    posteggio: '',
    posteggio_id: '',
    fila: '',
    dimensioni_mq: '',
    dimensioni_lineari: '',
    settore: '',
    merceologia: 'non_alimentare',
    attrezzature: 'banco_automezzo',

    // Sezione D - Atto
    notaio: '',
    repertorio: '',
    data_atto: ''
  });

  // Carica mercati all'avvio
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoadingMarkets(true);
        const res = await fetch(`${API_URL}/api/markets`);
        const json = await res.json();
        
        if (json.success && json.data) {
          setMarkets(json.data);
        } else {
          console.error('Errore caricamento mercati:', json);
        }
      } catch (error) {
        console.error('Errore fetch mercati:', error);
        toast.error('Errore caricamento mercati');
      } finally {
        setLoadingMarkets(false);
      }
    };
    
    fetchMarkets();
  }, []);

  // Carica posteggi quando cambia mercato
  useEffect(() => {
    if (!selectedMarketId) {
      setStalls([]);
      return;
    }

    const fetchStalls = async () => {
      try {
        setLoadingStalls(true);
        const res = await fetch(`${API_URL}/api/markets/${selectedMarketId}/stalls`);
        const json = await res.json();
        
        if (json.success && json.data) {
          // Ordina posteggi per numero
          const sortedStalls = json.data.sort((a: Stall, b: Stall) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return numA - numB;
          });
          setStalls(sortedStalls);
        } else {
          console.error('Errore caricamento posteggi:', json);
        }
      } catch (error) {
        console.error('Errore fetch posteggi:', error);
        toast.error('Errore caricamento posteggi');
      } finally {
        setLoadingStalls(false);
      }
    };
    
    fetchStalls();
  }, [selectedMarketId]);

  // Lookup Subentrante per CF/P.IVA
  const handleLookupSubentrante = async () => {
    if (!formData.cf_subentrante) {
      toast.error('Inserire Codice Fiscale o P.IVA');
      return;
    }

    try {
      setLoadingImpresa(true);
      const res = await fetch(`${API_URL}/api/imprese?codice_fiscale=${formData.cf_subentrante}`);
      const json = await res.json();
      
      if (json.success && json.data && json.data.length > 0) {
        const data = json.data[0];
        setFormData(prev => ({
          ...prev,
          ragione_sociale_sub: data.denominazione || '',
          nome_sub: data.rappresentante_legale_nome || '',
          cognome_sub: data.rappresentante_legale_cognome || '',
          data_nascita_sub: data.rappresentante_legale_data_nascita ? data.rappresentante_legale_data_nascita.split('T')[0] : '',
          luogo_nascita_sub: data.rappresentante_legale_luogo_nascita || '',
          residenza_via_sub: data.rappresentante_legale_residenza_via ? `${data.rappresentante_legale_residenza_via} ${data.rappresentante_legale_residenza_civico || ''}`.trim() : '',
          residenza_comune_sub: data.rappresentante_legale_residenza_comune || '',
          residenza_cap_sub: data.rappresentante_legale_residenza_cap || '',
          sede_via_sub: `${data.indirizzo_via || ''} ${data.indirizzo_civico || ''}`.trim(),
          sede_comune_sub: data.comune || '',
          sede_cap_sub: data.cap || '',
          pec_sub: data.pec || ''
        }));
        toast.success('Impresa trovata!', { description: data.denominazione });
      } else {
        toast.error('Impresa non trovata', { description: 'Inserire i dati manualmente' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Errore ricerca', { description: 'Impossibile contattare il server' });
    } finally {
      setLoadingImpresa(false);
    }
  };

  // Lookup Cedente per CF/P.IVA
  const handleLookupCedente = async () => {
    if (!formData.cf_cedente) {
      toast.error('Inserire Codice Fiscale Cedente');
      return;
    }

    try {
      setLoadingImpresa(true);
      const res = await fetch(`${API_URL}/api/imprese?codice_fiscale=${formData.cf_cedente}`);
      const json = await res.json();
      
      if (json.success && json.data && json.data.length > 0) {
        const data = json.data[0];
        setFormData(prev => ({
          ...prev,
          ragione_sociale_ced: data.denominazione || ''
        }));
        toast.success('Cedente trovato!', { description: data.denominazione });
      } else {
        toast.error('Cedente non trovato', { description: 'Inserire i dati manualmente' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Errore ricerca', { description: 'Impossibile contattare il server' });
    } finally {
      setLoadingImpresa(false);
    }
  };

  // Handler cambio mercato
  const handleMarketChange = (marketId: string) => {
    const market = markets.find(m => m.id === parseInt(marketId));
    setSelectedMarketId(parseInt(marketId));
    setFormData(prev => ({
      ...prev,
      mercato: market?.name || '',
      mercato_id: marketId,
      // Reset posteggio quando cambia mercato
      posteggio: '',
      posteggio_id: '',
      dimensioni_mq: '',
      dimensioni_lineari: ''
    }));
  };

  // Handler cambio posteggio - Auto-popola dimensioni
  const handleStallChange = (stallId: string) => {
    const stall = stalls.find(s => s.id === parseInt(stallId));
    if (stall) {
      setFormData(prev => ({
        ...prev,
        posteggio: stall.number,
        posteggio_id: stallId,
        dimensioni_mq: stall.area_mq || '',
        dimensioni_lineari: stall.dimensions || `${stall.width} x ${stall.depth}`
      }));
      toast.success(`Posteggio ${stall.number} selezionato`, { 
        description: `${stall.area_mq} mq - ${stall.dimensions || `${stall.width} x ${stall.depth}`}` 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-[#0a1628] border-[#1e293b] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-[#e8fbff] flex items-center gap-2">
          <FileText className="text-[#00f0ff]" />
          Compilazione Guidata SCIA Subingresso
        </CardTitle>
        <CardDescription className="text-[#e8fbff]/60">
          Modello Unificato Regionale - Commercio su Aree Pubbliche
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SEZIONE A: SUBENTRANTE */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#e8fbff] border-b border-[#1e293b] pb-2">
              A. Dati Subentrante (Cessionario)
            </h3>
            
            {/* Riga 1: CF e Ricerca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Codice Fiscale / P.IVA *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.cf_subentrante}
                    onChange={(e) => setFormData({...formData, cf_subentrante: e.target.value.toUpperCase()})}
                    placeholder="Es. RSSMRA..."
                    className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                  />
                  <Button 
                    type="button" 
                    onClick={handleLookupSubentrante} 
                    variant="secondary"
                    disabled={loadingImpresa}
                  >
                    {loadingImpresa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Ragione Sociale / Denominazione</Label>
                <Input 
                  value={formData.ragione_sociale_sub}
                  onChange={(e) => setFormData({...formData, ragione_sociale_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>

            {/* Riga 2: Dati Personali Titolare */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="space-y-2">
                <Label className="text-[#e8fbff]">Nome</Label>
                <Input 
                  value={formData.nome_sub}
                  onChange={(e) => setFormData({...formData, nome_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Cognome</Label>
                <Input 
                  value={formData.cognome_sub}
                  onChange={(e) => setFormData({...formData, cognome_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data di Nascita</Label>
                <Input 
                  type="date"
                  value={formData.data_nascita_sub}
                  onChange={(e) => setFormData({...formData, data_nascita_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Luogo di Nascita</Label>
                <Input 
                  value={formData.luogo_nascita_sub}
                  onChange={(e) => setFormData({...formData, luogo_nascita_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>

            {/* Riga 3: Residenza Titolare */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Residenza (Via/Piazza)</Label>
                <Input 
                  value={formData.residenza_via_sub}
                  onChange={(e) => setFormData({...formData, residenza_via_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Comune Residenza</Label>
                <Input 
                  value={formData.residenza_comune_sub}
                  onChange={(e) => setFormData({...formData, residenza_comune_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">CAP</Label>
                <Input 
                  value={formData.residenza_cap_sub}
                  onChange={(e) => setFormData({...formData, residenza_cap_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>

            {/* Riga 4: Sede Impresa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Sede Impresa (Via/Piazza)</Label>
                <Input 
                  value={formData.sede_via_sub}
                  onChange={(e) => setFormData({...formData, sede_via_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Comune Sede</Label>
                <Input 
                  value={formData.sede_comune_sub}
                  onChange={(e) => setFormData({...formData, sede_comune_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">PEC</Label>
                <Input 
                  value={formData.pec_sub}
                  onChange={(e) => setFormData({...formData, pec_sub: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE B: CEDENTE */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#e8fbff] border-b border-[#1e293b] pb-2">
              B. Dati Cedente (Dante Causa)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Codice Fiscale Cedente *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.cf_cedente}
                    onChange={(e) => setFormData({...formData, cf_cedente: e.target.value.toUpperCase()})}
                    placeholder="Es. VRDLGI..."
                    className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                  />
                  <Button 
                    type="button" 
                    onClick={handleLookupCedente} 
                    variant="secondary"
                    disabled={loadingImpresa}
                  >
                    {loadingImpresa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Ragione Sociale Cedente</Label>
                <Input 
                  value={formData.ragione_sociale_ced}
                  onChange={(e) => setFormData({...formData, ragione_sociale_ced: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
            
            {/* Dati SCIA Precedente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                <Label className="text-[#e8fbff]">SCIA Precedente N. Prot.</Label>
                <Input 
                  value={formData.scia_precedente_protocollo}
                  onChange={(e) => setFormData({...formData, scia_precedente_protocollo: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data Presentazione</Label>
                <Input 
                  type="date"
                  value={formData.scia_precedente_data}
                  onChange={(e) => setFormData({...formData, scia_precedente_data: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Comune Presentazione</Label>
                <Input 
                  value={formData.scia_precedente_comune}
                  onChange={(e) => setFormData({...formData, scia_precedente_comune: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE C: POSTEGGIO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#e8fbff] border-b border-[#1e293b] pb-2">
              C. Dati Posteggio e Mercato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DROPDOWN MERCATI DINAMICO */}
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Mercato *</Label>
                <Select onValueChange={handleMarketChange} disabled={loadingMarkets}>
                  <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                    <SelectValue placeholder={loadingMarkets ? "Caricamento..." : "Seleziona Mercato"} />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.municipality})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DROPDOWN POSTEGGI FILTRATO */}
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Numero Posteggio *</Label>
                <Select 
                  onValueChange={handleStallChange} 
                  disabled={!selectedMarketId || loadingStalls}
                >
                  <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                    <SelectValue placeholder={
                      !selectedMarketId 
                        ? "Prima seleziona un mercato" 
                        : loadingStalls 
                          ? "Caricamento..." 
                          : "Seleziona Posteggio"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {stalls.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.number} - {s.area_mq} mq {s.vendor_business_name ? `(${s.vendor_business_name})` : '(Libero)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Dettagli Posteggio - AUTO-POPOLATI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Fila</Label>
                <Input 
                  value={formData.fila}
                  onChange={(e) => setFormData({...formData, fila: e.target.value})}
                  placeholder="Es. A, B, C"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Dimensioni (MQ)</Label>
                <Input 
                  value={formData.dimensioni_mq}
                  onChange={(e) => setFormData({...formData, dimensioni_mq: e.target.value})}
                  placeholder="Auto-popolato"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff] bg-[#0a1628]"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Dimensioni Lineari (m x m)</Label>
                <Input 
                  value={formData.dimensioni_lineari}
                  onChange={(e) => setFormData({...formData, dimensioni_lineari: e.target.value})}
                  placeholder="Auto-popolato"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff] bg-[#0a1628]"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Attrezzature</Label>
                <Input 
                  value={formData.attrezzature}
                  onChange={(e) => setFormData({...formData, attrezzature: e.target.value})}
                  placeholder="Es. Banco e automezzo"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-[#e8fbff]">Merceologia</Label>
                <Select 
                  value={formData.merceologia}
                  onValueChange={(val) => setFormData({...formData, merceologia: val})}
                >
                  <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alimentare">Alimentare</SelectItem>
                    <SelectItem value="non_alimentare">Non Alimentare</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SEZIONE D: ATTO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#e8fbff] border-b border-[#1e293b] pb-2">
              D. Estremi Atto Notarile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Notaio Rogante</Label>
                <Input 
                  value={formData.notaio}
                  onChange={(e) => setFormData({...formData, notaio: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">N. Repertorio</Label>
                <Input 
                  value={formData.repertorio}
                  onChange={(e) => setFormData({...formData, repertorio: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data Atto</Label>
                <Input 
                  type="date"
                  value={formData.data_atto}
                  onChange={(e) => setFormData({...formData, data_atto: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-[#e8fbff]/20 text-[#e8fbff]">
              Annulla
            </Button>
            <Button type="submit" className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90">
              Genera Pratica SCIA
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
