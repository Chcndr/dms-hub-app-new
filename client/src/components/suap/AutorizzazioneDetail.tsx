/**
 * AutorizzazioneDetail.tsx
 * 
 * Componente per visualizzare il dettaglio di un'autorizzazione.
 * Design identico a quello delle Concessioni.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileCheck, FileText, User, MapPin, Calendar, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mio-hub.me';

interface AutorizzazioneDetailProps {
  autorizzazioneId: number;
  onBack: () => void;
}

export default function AutorizzazioneDetail({ autorizzazioneId, onBack }: AutorizzazioneDetailProps) {
  const [autorizzazione, setAutorizzazione] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  useEffect(() => {
    const fetchAutorizzazione = async () => {
      try {
        const res = await fetch(`${API_URL}/api/autorizzazioni/${autorizzazioneId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setAutorizzazione(json.data);
        } else {
          toast.error('Errore nel caricamento dell\'autorizzazione');
        }
      } catch (err) {
        console.error('Errore:', err);
        toast.error('Errore nel caricamento dell\'autorizzazione');
      } finally {
        setLoading(false);
      }
    };
    fetchAutorizzazione();
  }, [autorizzazioneId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  if (!autorizzazione) {
    return (
      <div className="text-center text-gray-400 py-8">
        Autorizzazione non trovata
      </div>
    );
  }

  const handleExport = () => {
    const content = `
AUTORIZZAZIONE N. ${autorizzazione.numero_autorizzazione || autorizzazione.id}
${'='.repeat(50)}

DATI GENERALI
-------------
Numero Autorizzazione: ${autorizzazione.numero_autorizzazione || '-'}
Tipo: ${autorizzazione.tipo === 'A' ? 'Tipo A - Posteggio' : autorizzazione.tipo === 'B' ? 'Tipo B - Itinerante' : autorizzazione.tipo || '-'}
Ente Rilascio: ${autorizzazione.ente_rilascio || '-'}
Data Rilascio: ${formatDate(autorizzazione.data_rilascio)}
Data Scadenza: ${formatDate(autorizzazione.data_scadenza)}
Stato: ${autorizzazione.stato || '-'}
Settore: ${autorizzazione.settore || '-'}

TITOLARE
--------
Ragione Sociale: ${autorizzazione.company_name || autorizzazione.ragione_sociale || '-'}
Partita IVA: ${autorizzazione.company_piva || autorizzazione.partita_iva || '-'}
Codice Fiscale: ${autorizzazione.company_cf || autorizzazione.codice_fiscale || '-'}
Nome: ${autorizzazione.rappresentante_legale_nome || autorizzazione.rappresentante_nome || '-'}
Cognome: ${autorizzazione.rappresentante_legale_cognome || autorizzazione.rappresentante_cognome || '-'}

MERCATO (se Tipo A)
-------------------
Mercato: ${autorizzazione.market_name || '-'}
Posteggio: ${autorizzazione.posteggio_numero || '-'}
Giorno: ${autorizzazione.market_days || '-'}

REQUISITI
---------
DURC Valido: ${autorizzazione.durc_valido ? 'Sì' : 'No'}
Data DURC: ${formatDate(autorizzazione.durc_data)}

NOTE
----
${autorizzazione.note || '-'}

${'='.repeat(50)}
Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Autorizzazione_${autorizzazione.numero_autorizzazione || autorizzazione.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Autorizzazione esportata!', {
      description: `File scaricato: Autorizzazione_${autorizzazione.numero_autorizzazione || autorizzazione.id}.txt`
    });
  };

  const getStatoBadgeClass = () => {
    switch (autorizzazione.stato?.toUpperCase()) {
      case 'ATTIVA':
        return 'bg-green-500/20 text-green-400';
      case 'SCADUTA':
        return 'bg-red-500/20 text-red-400';
      case 'SOSPESA':
        return 'bg-orange-500/20 text-orange-400';
      case 'REVOCATA':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getStatoDotClass = () => {
    switch (autorizzazione.stato?.toUpperCase()) {
      case 'ATTIVA':
        return 'bg-green-500';
      case 'SCADUTA':
        return 'bg-red-500';
      case 'SOSPESA':
        return 'bg-orange-500';
      case 'REVOCATA':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con pulsante torna */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla lista
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatoDotClass()}`} />
            <span className="text-sm text-gray-400">
              {autorizzazione.stato || 'N/D'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Titolo autorizzazione */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#e8fbff] flex items-center gap-3">
            Autorizzazione {autorizzazione.numero_autorizzazione || `#${autorizzazione.id}`}
            <Badge className={getStatoBadgeClass()}>
              {autorizzazione.stato || 'N/D'}
            </Badge>
          </h3>
          <p className="text-gray-400">
            {autorizzazione.tipo === 'A' ? 'TIPO A - POSTEGGIO' : autorizzazione.tipo === 'B' ? 'TIPO B - ITINERANTE' : autorizzazione.tipo || 'N/D'} - {autorizzazione.company_name || autorizzazione.ragione_sociale || 'N/A'} ({autorizzazione.company_piva || autorizzazione.partita_iva || 'N/A'})
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#14b8a6]/30 text-[#e8fbff]"
            onClick={handleExport}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            Esporta
          </Button>
        </div>
      </div>
      
      {/* Sezione Dati Generali */}
      <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#14b8a6] flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Dati Generali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">N. Autorizzazione</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.numero_autorizzazione || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo</p>
              <p className="text-[#e8fbff] font-medium">
                {autorizzazione.tipo === 'A' ? 'Tipo A - Posteggio' : autorizzazione.tipo === 'B' ? 'Tipo B - Itinerante' : autorizzazione.tipo || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ente Rilascio</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.ente_rilascio || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Settore</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.settore || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Data Rilascio</p>
              <p className="text-[#e8fbff] font-medium">{formatDate(autorizzazione.data_rilascio)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Data Scadenza</p>
              <p className="text-[#e8fbff] font-medium">{formatDate(autorizzazione.data_scadenza)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Note</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.note || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sezione Titolare */}
      <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#14b8a6] flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Titolare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ragione Sociale</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.company_name || autorizzazione.ragione_sociale || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Partita IVA</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.company_piva || autorizzazione.partita_iva || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Codice Fiscale</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.company_cf || autorizzazione.codice_fiscale || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Nome</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.rappresentante_legale_nome || autorizzazione.rappresentante_nome || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cognome</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.rappresentante_legale_cognome || autorizzazione.rappresentante_cognome || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Qualità</p>
              <p className="text-[#e8fbff] font-medium">{autorizzazione.rappresentante_qualita || 'Legale Rappresentante'}</p>
            </div>
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sede Legale</p>
              <p className="text-[#e8fbff] font-medium">
                {[autorizzazione.sede_legale_via, autorizzazione.sede_legale_cap, autorizzazione.sede_legale_comune, autorizzazione.sede_legale_provincia].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sezione Mercato (solo per Tipo A) */}
      {autorizzazione.tipo === 'A' && (
        <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#14b8a6] flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Dati Mercato e Posteggio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Mercato</p>
                <p className="text-[#e8fbff] font-medium">{autorizzazione.market_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Comune</p>
                <p className="text-[#e8fbff] font-medium">{autorizzazione.market_municipality || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Posteggio</p>
                <p className="text-[#e8fbff] font-medium">{autorizzazione.posteggio_numero || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Giorno</p>
                <p className="text-[#e8fbff] font-medium">{autorizzazione.market_days || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Sezione Requisiti */}
      <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#14b8a6] flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Requisiti e Documentazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">DURC Valido</p>
              <p className="text-[#e8fbff] font-medium">
                {autorizzazione.durc_valido ? (
                  <span className="text-green-400">✓ Sì</span>
                ) : (
                  <span className="text-red-400">✗ No</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Data DURC</p>
              <p className="text-[#e8fbff] font-medium">{formatDate(autorizzazione.durc_data)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Requisiti Morali</p>
              <p className="text-[#e8fbff] font-medium">
                {autorizzazione.requisiti_morali ? (
                  <span className="text-green-400">✓ Verificati</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Requisiti Professionali</p>
              <p className="text-[#e8fbff] font-medium">
                {autorizzazione.requisiti_professionali ? (
                  <span className="text-green-400">✓ Verificati</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
