import { useState, useEffect } from 'react';
import { 
  Wallet, Euro, AlertTriangle, XCircle, CheckCircle, Clock,
  Search, ArrowUpRight, ArrowDownRight, FileText, Briefcase,
  Building2, Calendar, User, CreditCard, RefreshCw, Download,
  Plus, Filter, Eye, Edit, Trash2, Send, Bell, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Tipi per il sistema Wallet
interface WalletOperatore {
  id: number;
  impresaId: number;
  ragioneSociale: string;
  partitaIva: string;
  saldo: number;
  stato: 'ATTIVO' | 'SALDO_BASSO' | 'BLOCCATO';
  ultimoAggiornamento: string;
  tipoPosteggio: string;
  numeroPosteggio: string;
  tariffaGiornaliera: number;
  mercato: string;
}

interface WalletTransazione {
  id: number;
  impresaId: number;
  tipo: 'RICARICA' | 'DECURTAZIONE' | 'RIMBORSO';
  importo: number;
  data: string;
  riferimento: string;
  descrizione: string;
  saldoPrecedente: number;
  saldoSuccessivo: number;
}

interface TariffaPosteggio {
  id: number;
  tipoPosteggio: string;
  tariffaGiornaliera: number;
  descrizione: string;
}

interface AvvisoPagoPA {
  id: number;
  iuv: string;
  impresaId: number;
  ragioneSociale: string;
  importo: number;
  dataEmissione: string;
  dataScadenza: string;
  stato: 'EMESSO' | 'PAGATO' | 'SCADUTO' | 'ANNULLATO';
  causale: string;
}

// Mock data per il wallet
const mockWallets: WalletOperatore[] = [
  {
    id: 1,
    impresaId: 101,
    ragioneSociale: 'Alimentari Rossi & C.',
    partitaIva: '04567890123',
    saldo: 850.00,
    stato: 'ATTIVO',
    ultimoAggiornamento: '2025-12-22T10:30:00',
    tipoPosteggio: 'Alimentare',
    numeroPosteggio: '45',
    tariffaGiornaliera: 25.00,
    mercato: 'Mercato Centrale Grosseto'
  },
  {
    id: 2,
    impresaId: 102,
    ragioneSociale: 'Bio Market Italia',
    partitaIva: '06789012345',
    saldo: 45.00,
    stato: 'SALDO_BASSO',
    ultimoAggiornamento: '2025-12-22T09:15:00',
    tipoPosteggio: 'Alimentare Bio',
    numeroPosteggio: '78',
    tariffaGiornaliera: 30.00,
    mercato: 'Mercato Follonica Mare'
  },
  {
    id: 3,
    impresaId: 103,
    ragioneSociale: 'Calzature Neri',
    partitaIva: '45678901234',
    saldo: 0.00,
    stato: 'BLOCCATO',
    ultimoAggiornamento: '2025-12-21T16:45:00',
    tipoPosteggio: 'Non Alimentare',
    numeroPosteggio: '23',
    tariffaGiornaliera: 20.00,
    mercato: 'Mercato Centrale Grosseto'
  },
  {
    id: 4,
    impresaId: 104,
    ragioneSociale: 'Frutta e Verdura Rossi',
    partitaIva: '12345678901',
    saldo: 1250.00,
    stato: 'ATTIVO',
    ultimoAggiornamento: '2025-12-22T08:00:00',
    tipoPosteggio: 'Alimentare',
    numeroPosteggio: '12',
    tariffaGiornaliera: 25.00,
    mercato: 'Mercato Orbetello Centro'
  },
  {
    id: 5,
    impresaId: 105,
    ragioneSociale: 'Abbigliamento Verdi',
    partitaIva: '98765432101',
    saldo: 15.00,
    stato: 'BLOCCATO',
    ultimoAggiornamento: '2025-12-20T14:30:00',
    tipoPosteggio: 'Non Alimentare',
    numeroPosteggio: '56',
    tariffaGiornaliera: 20.00,
    mercato: 'Mercato Castiglione'
  },
  {
    id: 6,
    impresaId: 106,
    ragioneSociale: 'Formaggi Toscani DOP',
    partitaIva: '11223344556',
    saldo: 520.00,
    stato: 'ATTIVO',
    ultimoAggiornamento: '2025-12-22T11:00:00',
    tipoPosteggio: 'Alimentare',
    numeroPosteggio: '33',
    tariffaGiornaliera: 25.00,
    mercato: 'Mercato Centrale Grosseto'
  },
  {
    id: 7,
    impresaId: 107,
    ragioneSociale: 'Macelleria Bianchi',
    partitaIva: '55667788990',
    saldo: 65.00,
    stato: 'SALDO_BASSO',
    ultimoAggiornamento: '2025-12-22T07:30:00',
    tipoPosteggio: 'Alimentare',
    numeroPosteggio: '67',
    tariffaGiornaliera: 25.00,
    mercato: 'Mercato Follonica Mare'
  },
  {
    id: 8,
    impresaId: 108,
    ragioneSociale: 'Fiori e Piante Gialli',
    partitaIva: '99887766554',
    saldo: 180.00,
    stato: 'ATTIVO',
    ultimoAggiornamento: '2025-12-21T18:00:00',
    tipoPosteggio: 'Florovivaistico',
    numeroPosteggio: '89',
    tariffaGiornaliera: 15.00,
    mercato: 'Mercato Marina di Grosseto'
  }
];

const mockTransazioni: WalletTransazione[] = [
  {
    id: 1,
    impresaId: 101,
    tipo: 'RICARICA',
    importo: 500.00,
    data: '2025-12-20T14:30:00',
    riferimento: 'IUV-0123456789012345678',
    descrizione: 'Ricarica tramite PagoPA',
    saldoPrecedente: 375.00,
    saldoSuccessivo: 875.00
  },
  {
    id: 2,
    impresaId: 101,
    tipo: 'DECURTAZIONE',
    importo: 25.00,
    data: '2025-12-21T08:15:00',
    riferimento: 'PRES-2025-12-21-45',
    descrizione: 'Presenza mercato 21/12/2025',
    saldoPrecedente: 875.00,
    saldoSuccessivo: 850.00
  },
  {
    id: 3,
    impresaId: 102,
    tipo: 'DECURTAZIONE',
    importo: 30.00,
    data: '2025-12-22T08:00:00',
    riferimento: 'PRES-2025-12-22-78',
    descrizione: 'Presenza mercato 22/12/2025',
    saldoPrecedente: 75.00,
    saldoSuccessivo: 45.00
  },
  {
    id: 4,
    impresaId: 104,
    tipo: 'RICARICA',
    importo: 1000.00,
    data: '2025-12-18T10:00:00',
    riferimento: 'IUV-9876543210987654321',
    descrizione: 'Ricarica tramite PagoPA',
    saldoPrecedente: 350.00,
    saldoSuccessivo: 1350.00
  },
  {
    id: 5,
    impresaId: 104,
    tipo: 'DECURTAZIONE',
    importo: 25.00,
    data: '2025-12-19T08:10:00',
    riferimento: 'PRES-2025-12-19-12',
    descrizione: 'Presenza mercato 19/12/2025',
    saldoPrecedente: 1350.00,
    saldoSuccessivo: 1325.00
  }
];

const mockTariffe: TariffaPosteggio[] = [
  { id: 1, tipoPosteggio: 'Alimentare', tariffaGiornaliera: 25.00, descrizione: 'Posteggio per vendita prodotti alimentari' },
  { id: 2, tipoPosteggio: 'Alimentare Bio', tariffaGiornaliera: 30.00, descrizione: 'Posteggio per vendita prodotti biologici certificati' },
  { id: 3, tipoPosteggio: 'Non Alimentare', tariffaGiornaliera: 20.00, descrizione: 'Posteggio per vendita prodotti non alimentari' },
  { id: 4, tipoPosteggio: 'Florovivaistico', tariffaGiornaliera: 15.00, descrizione: 'Posteggio per vendita fiori e piante' },
  { id: 5, tipoPosteggio: 'Produttore Agricolo', tariffaGiornaliera: 18.00, descrizione: 'Posteggio riservato a produttori agricoli diretti' }
];

const mockAvvisiPagoPA: AvvisoPagoPA[] = [
  {
    id: 1,
    iuv: '0123456789012345678',
    impresaId: 101,
    ragioneSociale: 'Alimentari Rossi & C.',
    importo: 500.00,
    dataEmissione: '2025-12-18',
    dataScadenza: '2025-12-28',
    stato: 'PAGATO',
    causale: 'Ricarica Wallet Operatore Mercatale'
  },
  {
    id: 2,
    iuv: '0123456789012345679',
    impresaId: 102,
    ragioneSociale: 'Bio Market Italia',
    importo: 300.00,
    dataEmissione: '2025-12-20',
    dataScadenza: '2025-12-30',
    stato: 'EMESSO',
    causale: 'Ricarica Wallet Operatore Mercatale'
  },
  {
    id: 3,
    iuv: '0123456789012345680',
    impresaId: 103,
    ragioneSociale: 'Calzature Neri',
    importo: 200.00,
    dataEmissione: '2025-12-05',
    dataScadenza: '2025-12-15',
    stato: 'SCADUTO',
    causale: 'Ricarica Wallet Operatore Mercatale'
  },
  {
    id: 4,
    iuv: '9876543210987654321',
    impresaId: 104,
    ragioneSociale: 'Frutta e Verdura Rossi',
    importo: 1000.00,
    dataEmissione: '2025-12-15',
    dataScadenza: '2025-12-25',
    stato: 'PAGATO',
    causale: 'Ricarica Wallet Operatore Mercatale'
  }
];

export default function WalletPanel() {
  const [subTab, setSubTab] = useState<'wallet' | 'pagopa' | 'tariffe' | 'riconciliazione'>('wallet');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<WalletOperatore | null>(null);
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterMercato, setFilterMercato] = useState<string>('tutti');
  const [showRicaricaDialog, setShowRicaricaDialog] = useState(false);
  const [ricaricaImporto, setRicaricaImporto] = useState('');
  const [showNotificaDialog, setShowNotificaDialog] = useState(false);

  // Filtra wallet in base a ricerca e filtri
  const filteredWallets = mockWallets.filter(wallet => {
    const matchesSearch = 
      wallet.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.partitaIva.includes(searchQuery) ||
      wallet.numeroPosteggio.includes(searchQuery);
    
    const matchesStato = filterStato === 'tutti' || wallet.stato === filterStato;
    const matchesMercato = filterMercato === 'tutti' || wallet.mercato === filterMercato;
    
    return matchesSearch && matchesStato && matchesMercato;
  });

  // Calcola statistiche
  const stats = {
    totaleWallet: mockWallets.length,
    walletAttivi: mockWallets.filter(w => w.stato === 'ATTIVO').length,
    walletSaldoBasso: mockWallets.filter(w => w.stato === 'SALDO_BASSO').length,
    walletBloccati: mockWallets.filter(w => w.stato === 'BLOCCATO').length,
    saldoTotale: mockWallets.reduce((sum, w) => sum + w.saldo, 0),
    avvisiInAttesa: mockAvvisiPagoPA.filter(a => a.stato === 'EMESSO').length,
    avvisiPagati: mockAvvisiPagoPA.filter(a => a.stato === 'PAGATO').length,
    avvisiScaduti: mockAvvisiPagoPA.filter(a => a.stato === 'SCADUTO').length,
    totaleIncassato: mockAvvisiPagoPA.filter(a => a.stato === 'PAGATO').reduce((sum, a) => sum + a.importo, 0)
  };

  // Ottieni transazioni per wallet selezionato
  const getTransazioniWallet = (impresaId: number) => {
    return mockTransazioni.filter(t => t.impresaId === impresaId).sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  };

  // Calcola giorni coperti dal saldo
  const calcolaGiorniCoperti = (saldo: number, tariffaGiornaliera: number) => {
    return Math.floor(saldo / tariffaGiornaliera);
  };

  // Ottieni colore stato
  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'ATTIVO': return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';
      case 'SALDO_BASSO': return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'BLOCCATO': return 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  // Ottieni colore avviso PagoPA
  const getAvvisoColor = (stato: string) => {
    switch (stato) {
      case 'PAGATO': return 'border-[#10b981]/30';
      case 'EMESSO': return 'border-[#f59e0b]/30';
      case 'SCADUTO': return 'border-[#ef4444]/30';
      case 'ANNULLATO': return 'border-gray-500/30';
      default: return 'border-gray-500/30';
    }
  };

  // Lista mercati unici
  const mercatiUnici = [...new Set(mockWallets.map(w => w.mercato))];

  return (
    <div className="space-y-6">
      {/* Sotto-tab */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={subTab === 'wallet' ? 'default' : 'outline'}
          onClick={() => setSubTab('wallet')}
          className={subTab === 'wallet' ? 'bg-[#3b82f6] text-white' : 'border-[#3b82f6]/30 text-[#e8fbff]/70'}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Wallet Operatori
        </Button>
        <Button
          variant={subTab === 'pagopa' ? 'default' : 'outline'}
          onClick={() => setSubTab('pagopa')}
          className={subTab === 'pagopa' ? 'bg-[#10b981] text-white' : 'border-[#10b981]/30 text-[#e8fbff]/70'}
        >
          <Euro className="h-4 w-4 mr-2" />
          PagoPA
        </Button>
        <Button
          variant={subTab === 'tariffe' ? 'default' : 'outline'}
          onClick={() => setSubTab('tariffe')}
          className={subTab === 'tariffe' ? 'bg-[#8b5cf6] text-white' : 'border-[#8b5cf6]/30 text-[#e8fbff]/70'}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Tariffe
        </Button>
        <Button
          variant={subTab === 'riconciliazione' ? 'default' : 'outline'}
          onClick={() => setSubTab('riconciliazione')}
          className={subTab === 'riconciliazione' ? 'bg-[#f59e0b] text-white' : 'border-[#f59e0b]/30 text-[#e8fbff]/70'}
        >
          <FileText className="h-4 w-4 mr-2" />
          Riconciliazione
        </Button>
      </div>

      {/* SOTTO-TAB: WALLET OPERATORI */}
      {subTab === 'wallet' && (
        <>
          {/* Statistiche Wallet */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-[#3b82f6]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Totale Wallet</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">{stats.totaleWallet}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#10b981]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-[#10b981]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Attivi</p>
                    <p className="text-2xl font-bold text-[#10b981]">{stats.walletAttivi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#f59e0b]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-[#f59e0b]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Saldo Basso</p>
                    <p className="text-2xl font-bold text-[#f59e0b]">{stats.walletSaldoBasso}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#ef4444]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-[#ef4444]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Bloccati</p>
                    <p className="text-2xl font-bold text-[#ef4444]">{stats.walletBloccati}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Euro className="h-8 w-8 text-[#14b8a6]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Saldo Totale</p>
                    <p className="text-2xl font-bold text-[#14b8a6]">€ {stats.saldoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtri e Ricerca */}
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#e8fbff]/50" />
                  <input
                    type="text"
                    placeholder="Cerca per ragione sociale, P.IVA, n° posteggio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/50 focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <Select value={filterStato} onValueChange={setFilterStato}>
                  <SelectTrigger className="w-[180px] bg-[#0b1220] border-[#3b82f6]/30 text-[#e8fbff]">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3b82f6]/30">
                    <SelectItem value="tutti">Tutti gli stati</SelectItem>
                    <SelectItem value="ATTIVO">Attivo</SelectItem>
                    <SelectItem value="SALDO_BASSO">Saldo Basso</SelectItem>
                    <SelectItem value="BLOCCATO">Bloccato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMercato} onValueChange={setFilterMercato}>
                  <SelectTrigger className="w-[220px] bg-[#0b1220] border-[#3b82f6]/30 text-[#e8fbff]">
                    <SelectValue placeholder="Mercato" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3b82f6]/30">
                    <SelectItem value="tutti">Tutti i mercati</SelectItem>
                    {mercatiUnici.map(mercato => (
                      <SelectItem key={mercato} value={mercato}>{mercato}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista Wallet e Dettaglio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista Wallet */}
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#3b82f6]" />
                    Wallet Operatori ({filteredWallets.length})
                  </span>
                  <Button size="sm" className="bg-[#10b981] hover:bg-[#10b981]/80">
                    <Plus className="h-4 w-4 mr-1" />
                    Nuovo
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredWallets.map(wallet => (
                    <div 
                      key={wallet.id}
                      className={`p-4 bg-[#0b1220] rounded-lg border cursor-pointer transition-all ${
                        selectedWallet?.id === wallet.id 
                          ? 'border-[#3b82f6] ring-1 ring-[#3b82f6]' 
                          : `${getStatoColor(wallet.stato).split(' ')[2]} hover:border-[#3b82f6]/50`
                      }`}
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#e8fbff] font-semibold">{wallet.ragioneSociale}</p>
                          <p className="text-sm text-[#e8fbff]/70">P.IVA: {wallet.partitaIva}</p>
                          <p className="text-xs text-[#e8fbff]/50 mt-1">
                            Post. {wallet.numeroPosteggio} - {wallet.mercato}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-xl ${
                            wallet.stato === 'ATTIVO' ? 'text-[#10b981]' :
                            wallet.stato === 'SALDO_BASSO' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                          }`}>
                            € {wallet.saldo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${getStatoColor(wallet.stato)}`}>
                            {wallet.stato.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredWallets.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-[#e8fbff]/30 mx-auto mb-4" />
                      <p className="text-[#e8fbff]/50">Nessun wallet trovato</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dettaglio Wallet Selezionato */}
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#3b82f6]" />
                  {selectedWallet ? 'Dettaglio Wallet' : 'Seleziona un operatore'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedWallet ? (
                  <div className="space-y-4">
                    {/* Info Operatore */}
                    <div className="p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/30">
                      <h4 className="text-[#e8fbff] font-semibold mb-3">{selectedWallet.ragioneSociale}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-[#e8fbff]/70">P.IVA:</p>
                        <p className="text-[#e8fbff]">{selectedWallet.partitaIva}</p>
                        <p className="text-[#e8fbff]/70">Posteggio:</p>
                        <p className="text-[#e8fbff]">{selectedWallet.numeroPosteggio} - {selectedWallet.tipoPosteggio}</p>
                        <p className="text-[#e8fbff]/70">Mercato:</p>
                        <p className="text-[#e8fbff]">{selectedWallet.mercato}</p>
                        <p className="text-[#e8fbff]/70">Tariffa giornaliera:</p>
                        <p className="text-[#e8fbff]">€ {selectedWallet.tariffaGiornaliera.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Saldo e Azioni */}
                    <div className={`p-4 bg-[#0b1220] rounded-lg border ${getStatoColor(selectedWallet.stato).split(' ')[2]}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-[#e8fbff]/70">Saldo Attuale</p>
                          <p className={`text-3xl font-bold ${
                            selectedWallet.stato === 'ATTIVO' ? 'text-[#10b981]' :
                            selectedWallet.stato === 'SALDO_BASSO' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                          }`}>
                            € {selectedWallet.saldo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#e8fbff]/70">Giorni coperti</p>
                          <p className="text-2xl font-bold text-[#3b82f6]">
                            {calcolaGiorniCoperti(selectedWallet.saldo, selectedWallet.tariffaGiornaliera)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={showRicaricaDialog} onOpenChange={setShowRicaricaDialog}>
                          <DialogTrigger asChild>
                            <Button className="flex-1 bg-[#10b981] hover:bg-[#10b981]/80">
                              <Euro className="h-4 w-4 mr-2" />
                              Genera Avviso PagoPA
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1a2332] border-[#3b82f6]/30">
                            <DialogHeader>
                              <DialogTitle className="text-[#e8fbff]">Genera Avviso PagoPA</DialogTitle>
                              <DialogDescription className="text-[#e8fbff]/70">
                                Genera un avviso di pagamento PagoPA per la ricarica del wallet di {selectedWallet.ragioneSociale}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label className="text-[#e8fbff]">Importo ricarica (€)</Label>
                                <Input
                                  type="number"
                                  placeholder="Es. 500.00"
                                  value={ricaricaImporto}
                                  onChange={(e) => setRicaricaImporto(e.target.value)}
                                  className="bg-[#0b1220] border-[#3b82f6]/30 text-[#e8fbff]"
                                />
                              </div>
                              <div className="p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/30">
                                <p className="text-sm text-[#e8fbff]/70">Importi suggeriti:</p>
                                <div className="flex gap-2 mt-2">
                                  {[100, 250, 500, 1000].map(importo => (
                                    <Button
                                      key={importo}
                                      size="sm"
                                      variant="outline"
                                      className="border-[#3b82f6]/30 text-[#e8fbff]"
                                      onClick={() => setRicaricaImporto(importo.toString())}
                                    >
                                      € {importo}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowRicaricaDialog(false)} className="border-[#3b82f6]/30 text-[#e8fbff]">
                                Annulla
                              </Button>
                              <Button className="bg-[#10b981] hover:bg-[#10b981]/80" onClick={() => {
                                alert(`Avviso PagoPA generato per € ${ricaricaImporto}`);
                                setShowRicaricaDialog(false);
                                setRicaricaImporto('');
                              }}>
                                Genera Avviso
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          className="border-[#f59e0b]/30 text-[#f59e0b]"
                          onClick={() => setShowNotificaDialog(true)}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Notifica
                        </Button>
                      </div>
                    </div>

                    {/* Ultime Transazioni */}
                    <div>
                      <h4 className="text-[#e8fbff] font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Ultime Transazioni
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {getTransazioniWallet(selectedWallet.impresaId).map(transazione => (
                          <div 
                            key={transazione.id}
                            className={`flex items-center justify-between p-2 bg-[#0b1220] rounded border ${
                              transazione.tipo === 'RICARICA' ? 'border-[#10b981]/20' : 'border-[#ef4444]/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {transazione.tipo === 'RICARICA' ? (
                                <ArrowUpRight className="h-4 w-4 text-[#10b981]" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-[#ef4444]" />
                              )}
                              <div>
                                <span className="text-sm text-[#e8fbff]">{transazione.descrizione}</span>
                                <p className="text-xs text-[#e8fbff]/50">
                                  {new Date(transazione.data).toLocaleDateString('it-IT')}
                                </p>
                              </div>
                            </div>
                            <span className={`font-semibold ${
                              transazione.tipo === 'RICARICA' ? 'text-[#10b981]' : 'text-[#ef4444]'
                            }`}>
                              {transazione.tipo === 'RICARICA' ? '+' : '-'}€ {transazione.importo.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {getTransazioniWallet(selectedWallet.impresaId).length === 0 && (
                          <p className="text-center text-[#e8fbff]/50 py-4">Nessuna transazione</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 text-[#e8fbff]/30 mx-auto mb-4" />
                    <p className="text-[#e8fbff]/50">Seleziona un operatore dalla lista per vedere i dettagli del wallet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Regole Blocco */}
          <Card className="bg-[#1a2332] border-[#f59e0b]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
                Regole di Blocco Automatico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0b1220] rounded-lg border border-[#10b981]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">ATTIVO</span>
                  </div>
                  <p className="text-sm text-[#e8fbff]/70">Saldo ≥ Tariffa giornaliera × 3</p>
                  <p className="text-sm text-[#e8fbff]/70">Può effettuare presenza</p>
                </div>
                <div className="p-4 bg-[#0b1220] rounded-lg border border-[#f59e0b]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
                    <span className="text-[#f59e0b] font-semibold">SALDO BASSO</span>
                  </div>
                  <p className="text-sm text-[#e8fbff]/70">Saldo {'<'} Tariffa × 3 ma ≥ Tariffa</p>
                  <p className="text-sm text-[#e8fbff]/70">Notifica di ricarica inviata</p>
                </div>
                <div className="p-4 bg-[#0b1220] rounded-lg border border-[#ef4444]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-[#ef4444]" />
                    <span className="text-[#ef4444] font-semibold">BLOCCATO</span>
                  </div>
                  <p className="text-sm text-[#e8fbff]/70">Saldo {'<'} Tariffa giornaliera</p>
                  <p className="text-sm text-[#e8fbff]/70">Presenza NON consentita - Posteggio in spunta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SOTTO-TAB: PAGOPA */}
      {subTab === 'pagopa' && (
        <>
          {/* Statistiche PagoPA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#1a2332] border-[#10b981]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Euro className="h-8 w-8 text-[#10b981]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Totale Incassato</p>
                    <p className="text-2xl font-bold text-[#10b981]">€ {stats.totaleIncassato.toLocaleString('it-IT')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-[#3b82f6]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Pagati</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">{stats.avvisiPagati}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#f59e0b]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-[#f59e0b]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">In Attesa</p>
                    <p className="text-2xl font-bold text-[#f59e0b]">{stats.avvisiInAttesa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#ef4444]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-[#ef4444]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Scaduti</p>
                    <p className="text-2xl font-bold text-[#ef4444]">{stats.avvisiScaduti}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Avvisi PagoPA */}
          <Card className="bg-[#1a2332] border-[#10b981]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-[#10b981]" />
                  Avvisi PagoPA
                </span>
                <Button size="sm" className="bg-[#10b981] hover:bg-[#10b981]/80">
                  <Download className="h-4 w-4 mr-1" />
                  Esporta
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAvvisiPagoPA.map(avviso => (
                  <div key={avviso.id} className={`p-4 bg-[#0b1220] rounded-lg border ${getAvvisoColor(avviso.stato)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#e8fbff] font-semibold">{avviso.causale}</p>
                        <p className="text-sm text-[#e8fbff]/70">{avviso.ragioneSociale}</p>
                        <p className="text-xs text-[#e8fbff]/50 mt-1">
                          IUV: {avviso.iuv} | Emesso: {avviso.dataEmissione} | Scadenza: {avviso.dataScadenza}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-xl ${
                          avviso.stato === 'PAGATO' ? 'text-[#10b981]' :
                          avviso.stato === 'EMESSO' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>
                          € {avviso.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          avviso.stato === 'PAGATO' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          avviso.stato === 'EMESSO' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {avviso.stato}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-[#e8fbff]/50">Integrazione PagoPA in fase di configurazione</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SOTTO-TAB: TARIFFE */}
      {subTab === 'tariffe' && (
        <>
          <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#8b5cf6]" />
                  Tariffe Posteggio
                </span>
                <Button size="sm" className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuova Tariffa
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTariffe.map(tariffa => (
                  <div key={tariffa.id} className="p-4 bg-[#0b1220] rounded-lg border border-[#8b5cf6]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#e8fbff] font-semibold">{tariffa.tipoPosteggio}</p>
                        <p className="text-sm text-[#e8fbff]/70">{tariffa.descrizione}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#8b5cf6]">€ {tariffa.tariffaGiornaliera.toFixed(2)}</p>
                          <p className="text-xs text-[#e8fbff]/50">al giorno</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-[#8b5cf6]/30 text-[#e8fbff]">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#ef4444]/30 text-[#ef4444]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SOTTO-TAB: RICONCILIAZIONE */}
      {subTab === 'riconciliazione' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#1a2332] border-[#10b981]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-8 w-8 text-[#10b981]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Totale Ricariche</p>
                    <p className="text-2xl font-bold text-[#10b981]">€ 2.000,00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#ef4444]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="h-8 w-8 text-[#ef4444]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Totale Decurtazioni</p>
                    <p className="text-2xl font-bold text-[#ef4444]">€ 105,00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-[#3b82f6]" />
                  <div>
                    <p className="text-sm text-[#e8fbff]/70">Saldo Complessivo</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">€ {stats.saldoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1a2332] border-[#f59e0b]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#f59e0b]" />
                  Report Riconciliazione
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-[#f59e0b]/30 text-[#e8fbff]">
                    <Calendar className="h-4 w-4 mr-1" />
                    Periodo
                  </Button>
                  <Button size="sm" className="bg-[#f59e0b] hover:bg-[#f59e0b]/80">
                    <Download className="h-4 w-4 mr-1" />
                    Esporta Excel
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f59e0b]/30">
                      <th className="text-left py-3 px-4 text-[#e8fbff]/70">Data</th>
                      <th className="text-left py-3 px-4 text-[#e8fbff]/70">Operatore</th>
                      <th className="text-left py-3 px-4 text-[#e8fbff]/70">Tipo</th>
                      <th className="text-left py-3 px-4 text-[#e8fbff]/70">Riferimento</th>
                      <th className="text-right py-3 px-4 text-[#e8fbff]/70">Importo</th>
                      <th className="text-right py-3 px-4 text-[#e8fbff]/70">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTransazioni.slice(0, 5).map(t => (
                      <tr key={t.id} className="border-b border-[#f59e0b]/10">
                        <td className="py-3 px-4 text-[#e8fbff]">{new Date(t.data).toLocaleDateString('it-IT')}</td>
                        <td className="py-3 px-4 text-[#e8fbff]">
                          {mockWallets.find(w => w.impresaId === t.impresaId)?.ragioneSociale || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            t.tipo === 'RICARICA' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                          }`}>
                            {t.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#e8fbff]/70 text-xs">{t.riferimento}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${
                          t.tipo === 'RICARICA' ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}>
                          {t.tipo === 'RICARICA' ? '+' : '-'}€ {t.importo.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-[#e8fbff]">€ {t.saldoSuccessivo.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Notifica */}
      <Dialog open={showNotificaDialog} onOpenChange={setShowNotificaDialog}>
        <DialogContent className="bg-[#1a2332] border-[#f59e0b]/30">
          <DialogHeader>
            <DialogTitle className="text-[#e8fbff]">Invia Notifica</DialogTitle>
            <DialogDescription className="text-[#e8fbff]/70">
              Invia una notifica di sollecito ricarica a {selectedWallet?.ragioneSociale}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-[#0b1220] rounded-lg border border-[#f59e0b]/30">
              <p className="text-sm text-[#e8fbff]">
                <strong>Oggetto:</strong> Sollecito ricarica wallet operatore mercatale
              </p>
              <p className="text-sm text-[#e8fbff]/70 mt-2">
                Il saldo del wallet è insufficiente per coprire le prossime presenze al mercato. 
                Si prega di effettuare una ricarica tramite PagoPA per evitare il blocco delle presenze.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-[#3b82f6]/30 text-[#e8fbff]">
                <Send className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" className="flex-1 border-[#10b981]/30 text-[#10b981]">
                <Send className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificaDialog(false)} className="border-[#3b82f6]/30 text-[#e8fbff]">
              Annulla
            </Button>
            <Button className="bg-[#f59e0b] hover:bg-[#f59e0b]/80" onClick={() => {
              alert('Notifica inviata!');
              setShowNotificaDialog(false);
            }}>
              Invia Notifica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
