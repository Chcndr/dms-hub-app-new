import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

export default function ConcessioneForm({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    numero_concessione: '2025/' + Math.floor(Math.random() * 1000),
    data_rilascio: new Date().toISOString().split('T')[0],
    durata_anni: '12',
    data_scadenza: '',
    
    // Concessionario
    cf_concessionario: '',
    ragione_sociale: '',
    
    // Posteggio
    mercato: 'Modena - Novi Sad',
    posteggio: '',
    mq: '32',
    giorno: 'Lunedì'
  });

  const handleLookup = async () => {
    try {
      const res = await fetch(`${API_URL}/api/imprese?codice_fiscale=${formData.cf_concessionario}`);
      const json = await res.json();
      
      if (json.success && json.data && json.data.length > 0) {
        const data = json.data[0];
        setFormData(prev => ({
          ...prev,
          ragione_sociale: data.denominazione
        }));
        toast.success('Concessionario trovato!', { description: data.denominazione });
      } else {
        toast.error('Concessionario non trovato', { description: 'Inserire i dati manualmente' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Errore ricerca', { description: 'Impossibile contattare il server' });
    }
  };

  const calculateExpiry = (years: string) => {
    const date = new Date(formData.data_rilascio);
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
    <Card className="bg-[#0a1628] border-[#1e293b] max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-[#e8fbff] flex items-center gap-2">
          <FileText className="text-[#00f0ff]" />
          Generazione Atto di Concessione
        </CardTitle>
        <CardDescription className="text-[#e8fbff]/60">
          Rilascio Concessione Decennale/Dodicennale per Posteggio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* DATI ATTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#e8fbff]">Numero Concessione</Label>
              <Input 
                value={formData.numero_concessione}
                readOnly
                className="bg-[#020817]/50 border-[#1e293b] text-[#e8fbff]/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#e8fbff]">Data Rilascio</Label>
              <Input 
                type="date"
                value={formData.data_rilascio}
                onChange={(e) => setFormData({...formData, data_rilascio: e.target.value})}
                className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
              />
            </div>
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
          </div>

          {/* CONCESSIONARIO */}
          <div className="space-y-4 border p-4 rounded-lg border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e8fbff]">Dati Concessionario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Codice Fiscale"
                  value={formData.cf_concessionario}
                  onChange={(e) => setFormData({...formData, cf_concessionario: e.target.value.toUpperCase()})}
                  className="bg-[#020817] border-[#1e293b] text-[#e8fbff]"
                />
                <Button type="button" onClick={handleLookup} variant="secondary">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <Input 
                placeholder="Ragione Sociale"
                value={formData.ragione_sociale}
                readOnly
                className="bg-[#020817]/50 border-[#1e293b] text-[#e8fbff]/60"
              />
            </div>
          </div>

          {/* POSTEGGIO */}
          <div className="space-y-4 border p-4 rounded-lg border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e8fbff]">Dati Posteggio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Mercato</Label>
                <Input value={formData.mercato} readOnly className="bg-[#020817]/50 border-[#1e293b] text-[#e8fbff]/60" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e8fbff]">Posteggio</Label>
                <Select onValueChange={(val) => setFormData({...formData, posteggio: val})}>
                  <SelectTrigger className="bg-[#020817] border-[#1e293b] text-[#e8fbff]">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A01">A01 (32 mq)</SelectItem>
                    <SelectItem value="A02">A02 (40 mq)</SelectItem>
                  </SelectContent>
                </Select>
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
