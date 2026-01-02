import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Search, Loader2 } from 'lucide-react';
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

export default function ConcessioneForm({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (data: any) => void }) {
  // Stati per dati dal database
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [loadingImpresa, setLoadingImpresa] = useState(false);

  const [formData, setFormData] = useState({
    // Dati Generali (Frontespizio)
    numero_protocollo: '',
    data_protocollazione: new Date().toISOString().split('T')[0],
    oggetto: 'RILASCIO CONCESSIONE OCCUPAZIONE SUOLO PUBBLICO VALIDO PER IL MERCATO PERIODICO SPECIALIZZATO NON ALIMENTARE LA PIAZZOLA',
    numero_file: '',
    
    // Dati Concessione
    durata_anni: '12',
    data_scadenza: '',
    tipo_concessione: 'subingresso', // nuova, subingresso, conversione
    
    // Concessionario
    cf_concessionario: '',
    ragione_sociale: '',
    nome: '',
    cognome: '',
    data_nascita: '',
    luogo_nascita: '',
    residenza_via: '',
    residenza_comune: '',
    residenza_cap: '',
    
    // Posteggio
    mercato: '',
    mercato_id: '',
    ubicazione: '',
    posteggio: '',
    posteggio_id: '',
    fila: '',
    mq: '',
    dimensioni_lineari: '',
    giorno: '',
    attrezzature: '',
    merceologia: 'Non Alimentare',
    
    // Dati Economici
    canone_unico: '',
    
    // Riferimenti
    scia_precedente_numero: '',
    scia_precedente_data: '',
    scia_precedente_comune: ''
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

  // Lookup Concessionario per CF/P.IVA
  const handleLookup = async () => {
    if (!formData.cf_concessionario) {
      toast.error('Inserire Codice Fiscale');
      return;
    }

    try {
      setLoadingImpresa(true);
      const res = await fetch(`${API_URL}/api/imprese?codice_fiscale=${formData.cf_concessionario}`);
      const json = await res.json();
      
      if (json.success && json.data && json.data.length > 0) {
        const data = json.data[0];
        setFormData(prev => ({
          ...prev,
          ragione_sociale: data.denominazione || '',
          nome: data.rappresentante_legale_nome || '',
          cognome: data.rappresentante_legale_cognome || '',
          data_nascita: data.rappresentante_legale_data_nascita ? data.rappresentante_legale_data_nascita.split('T')[0] : '',
          luogo_nascita: data.rappresentante_legale_luogo_nascita || '',
          residenza_via: data.rappresentante_legale_residenza_via ? `${data.rappresentante_legale_residenza_via} ${data.rappresentante_legale_residenza_civico || ''}`.trim() : `${data.indirizzo_via || ''} ${data.indirizzo_civico || ''}`.trim(),
          residenza_comune: data.rappresentante_legale_residenza_comune || data.comune || '',
          residenza_cap: data.rappresentante_legale_residenza_cap || data.cap || ''
        }));
        toast.success('Concessionario trovato!', { description: data.denominazione });
      } else {
        toast.error('Concessionario non trovato', { description: 'Inserire i dati manualmente' });
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
      ubicazione: market?.municipality || '',
      giorno: market?.days || '',
      // Reset posteggio quando cambia mercato
      posteggio: '',
      posteggio_id: '',
      mq: '',
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
        mq: stall.area_mq || '',
        dimensioni_lineari: stall.dimensions || `${stall.width} x ${stall.depth}`
      }));
      toast.success(`Posteggio ${stall.number} selezionato`, { 
        description: `${stall.area_mq} mq - ${stall.dimensions || `${stall.width} x ${stall.depth}`}` 
      });
    }
  };

  const calculateExpiry = (years: string) => {
    const date = new Date(formData.data_protocollazione);
    date.setFullYear(date.getFullYear() + parseInt(years));
    setFormData(prev => ({
      ...prev,
      durata_anni: years,
      data_scadenza: date.toISOString().split('T')[0]
    }));
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
          Generazione Atto di Concessione
        </CardTitle>
        <CardDescription className="text-[#e8fbff]/60">
          Frontespizio Documento Informatico e Concessione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* DATI GENERALI (FRONTESPIZIO) */}
          <div className="space-y-4 border-b border-[#1e293b] pb-6">
            <h3 className="text-lg font-semibold text-[#e8fbff]">Dati Generali (Frontespizio)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Numero / Anno PG</Label>
                <Input 
                  value={formData.numero_protocollo}
                  onChange={(e) => setFormData({...formData, numero_protocollo: e.target.value})}
                  placeholder="Es. 449021/2024"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data Protocollazione</Label>
                <Input 
                  type="date"
                  value={formData.data_protocollazione}
                  onChange={(e) => setFormData({...formData, data_protocollazione: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Numero File</Label>
                <Input 
                  value={formData.numero_file}
                  onChange={(e) => setFormData({...formData, numero_file: e.target.value})}
                  placeholder="Es. 2"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#e8fbff]">Oggetto</Label>
              <Textarea 
                value={formData.oggetto}
                onChange={(e) => setFormData({...formData, oggetto: e.target.value})}
                className="bg-[#020817] border-[#1e293b] text-[#e8fbff] min-h-[80px]"
              />
            </div>
          </div>

          {/* DATI CONCESSIONE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#e8fbff]">Durata (Anni)</Label>
              <Select value={formData.durata_anni} onValueChange={calculateExpiry}>
                <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Anni</SelectItem>
                  <SelectItem value="12">12 Anni</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label className="text-[#e8fbff]">Tipo Concessione</Label>
              <Select value={formData.tipo_concessione} onValueChange={(val) => setFormData({...formData, tipo_concessione: val})}>
                <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuova">Nuova Concessione</SelectItem>
                  <SelectItem value="subingresso">Subingresso</SelectItem>
                  <SelectItem value="conversione">Conversione</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CONCESSIONARIO */}
          <div className="space-y-4 border p-4 rounded-lg border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e8fbff]">Dati Concessionario</h3>
            
            {/* Riga 1: CF e Ragione Sociale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Codice Fiscale"
                  value={formData.cf_concessionario}
                  onChange={(e) => setFormData({...formData, cf_concessionario: e.target.value.toUpperCase()})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
                <Button 
                  type="button" 
                  onClick={handleLookup} 
                  variant="secondary"
                  disabled={loadingImpresa}
                >
                  {loadingImpresa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <Input 
                placeholder="Ragione Sociale"
                value={formData.ragione_sociale}
                onChange={(e) => setFormData({...formData, ragione_sociale: e.target.value})}
                className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
              />
            </div>

            {/* Riga 2: Dati Personali */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="space-y-2">
                <Label className="text-[#e8fbff]">Nome</Label>
                <Input 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Cognome</Label>
                <Input 
                  value={formData.cognome}
                  onChange={(e) => setFormData({...formData, cognome: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data di Nascita</Label>
                <Input 
                  type="date"
                  value={formData.data_nascita}
                  onChange={(e) => setFormData({...formData, data_nascita: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Luogo di Nascita</Label>
                <Input 
                  value={formData.luogo_nascita}
                  onChange={(e) => setFormData({...formData, luogo_nascita: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>

            {/* Riga 3: Residenza */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Residenza (Via/Piazza)</Label>
                <Input 
                  value={formData.residenza_via}
                  onChange={(e) => setFormData({...formData, residenza_via: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Comune</Label>
                <Input 
                  value={formData.residenza_comune}
                  onChange={(e) => setFormData({...formData, residenza_comune: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">CAP</Label>
                <Input 
                  value={formData.residenza_cap}
                  onChange={(e) => setFormData({...formData, residenza_cap: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
              </div>
            </div>
          </div>

          {/* POSTEGGIO */}
          <div className="space-y-4 border p-4 rounded-lg border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e8fbff]">Dati Posteggio</h3>
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
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Ubicazione</Label>
                <Input 
                  value={formData.ubicazione} 
                  onChange={(e) => setFormData({...formData, ubicazione: e.target.value})}
                  placeholder="Auto-popolato dal mercato"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]" 
                />
              </div>
            </div>
            
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
              {/* DROPDOWN POSTEGGI FILTRATO */}
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Posteggio *</Label>
                <Select 
                  onValueChange={handleStallChange} 
                  disabled={!selectedMarketId || loadingStalls}
                >
                  <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                    <SelectValue placeholder={
                      !selectedMarketId 
                        ? "Prima seleziona mercato" 
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
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">MQ</Label>
                <Input 
                  value={formData.mq} 
                  onChange={(e) => setFormData({...formData, mq: e.target.value})}
                  placeholder="Auto-popolato"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff] bg-[#0a1628]" 
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Dimensioni (m x m)</Label>
                <Input 
                  value={formData.dimensioni_lineari} 
                  onChange={(e) => setFormData({...formData, dimensioni_lineari: e.target.value})}
                  placeholder="Auto-popolato"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff] bg-[#0a1628]" 
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-[#e8fbff]">Attrezzature</Label>
                <Input 
                  value={formData.attrezzature} 
                  onChange={(e) => setFormData({...formData, attrezzature: e.target.value})}
                  placeholder="Es. Banco e automezzo"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]" 
                />
              </div>
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
                    <SelectItem value="Alimentare">Alimentare</SelectItem>
                    <SelectItem value="Non Alimentare">Non Alimentare</SelectItem>
                    <SelectItem value="Misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* RIFERIMENTI E CANONE */}
          <div className="space-y-4 border p-4 rounded-lg border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e8fbff]">Riferimenti e Canone</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">SCIA Precedente N.</Label>
                <Input 
                  value={formData.scia_precedente_numero} 
                  onChange={(e) => setFormData({...formData, scia_precedente_numero: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Data SCIA</Label>
                <Input 
                  type="date"
                  value={formData.scia_precedente_data} 
                  onChange={(e) => setFormData({...formData, scia_precedente_data: e.target.value})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Canone Annuo (€)</Label>
                <Input 
                  value={formData.canone_unico} 
                  onChange={(e) => setFormData({...formData, canone_unico: e.target.value})}
                  placeholder="Da Wallet/PagoPA"
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-[#e8fbff]/20 text-[#e8fbff]">
              Annulla
            </Button>
            <Button type="submit" className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90">
              <Printer className="mr-2 h-4 w-4" />
              Genera Atto
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
