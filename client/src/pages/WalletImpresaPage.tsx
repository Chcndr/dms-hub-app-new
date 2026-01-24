/**
 * Wallet Impresa - Pagamenti PagoPA
 * Pagina dedicata per visualizzare il wallet dell'impresa loggata
 * Riutilizza il componente WalletPanel esistente con filtro impresa
 * v3.70.0
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Wallet, Euro, Calendar, Clock, CreditCard, CheckCircle, 
  AlertCircle, ArrowLeft, RefreshCw, FileText, Building2,
  Receipt, TrendingUp, ChevronRight, ChevronDown, ChevronUp,
  Store, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Tipi wallet
interface WalletItem {
  id: number;
  type: 'SPUNTA' | 'CONCESSIONE';
  balance: number;
  status: 'ACTIVE' | 'BLOCKED' | 'LOW_BALANCE';
  market_name?: string;
  concession_code?: string;
  stall_number?: string;
  stall_area?: number;
  cost_per_sqm?: number;
  annual_market_days?: number;
  updated_at: string;
}

interface CompanyWallets {
  company_id: number;
  ragione_sociale: string;
  partita_iva: string;
  spunta_wallets: WalletItem[];
  concession_wallets: WalletItem[];
}

interface Scadenza {
  id: number;
  tipo: string;
  descrizione: string;
  importo: number;
  data_scadenza: string;
  stato: 'DA_PAGARE' | 'PAGATO' | 'SCADUTO';
  iuv?: string;
  mercato_nome?: string;
}

export default function WalletImpresaPage() {
  const [, setLocation] = useLocation();
  const [company, setCompany] = useState<CompanyWallets | null>(null);
  const [scadenze, setScadenze] = useState<Scadenza[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallet');
  const [expandedSpunta, setExpandedSpunta] = useState(false);
  const [expandedConcessioni, setExpandedConcessioni] = useState(false);
  
  // ID impresa dall'utente loggato (in produzione verrà dall'autenticazione)
  const getImpresaId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.impresa_id || 1; // Default a 1 per test
    }
    return 1;
  };
  
  const IMPRESA_ID = getImpresaId();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mio-hub.me';

  // Carica dati wallet impresa
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch wallet impresa usando l'API Hetzner
      const walletsRes = await fetch(`${API_BASE_URL}/api/wallets/company/${IMPRESA_ID}`);
      const walletsData = await walletsRes.json();
      if (walletsData.success && walletsData.data) {
        // Trasforma i dati dal formato API al formato atteso dal componente
        const wallets = walletsData.data;
        const spuntaWallets = wallets.filter((w: any) => w.type === 'SPUNTA').map((w: any) => ({
          id: w.id,
          type: 'SPUNTA' as const,
          balance: parseFloat(w.balance) || 0,
          status: w.status,
          market_name: w.market_name,
          updated_at: w.last_update
        }));
        const concessionWallets = wallets.filter((w: any) => w.type === 'CONCESSION').map((w: any) => ({
          id: w.id,
          type: 'CONCESSIONE' as const,
          balance: parseFloat(w.balance) || 0,
          status: w.status,
          market_name: w.market_name,
          concession_code: w.concession_code,
          stall_number: w.stall_number,
          stall_area: parseFloat(w.stall_area) || 0,
          updated_at: w.last_update
        }));
        
        // Fetch dati impresa
        const impresaRes = await fetch(`${API_BASE_URL}/api/imprese/${IMPRESA_ID}`);
        const impresaData = await impresaRes.json();
        
        setCompany({
          company_id: IMPRESA_ID,
          ragione_sociale: impresaData.success ? impresaData.data?.denominazione : 'Impresa',
          partita_iva: impresaData.success ? impresaData.data?.partita_iva : 'N/A',
          spunta_wallets: spuntaWallets,
          concession_wallets: concessionWallets
        });
      }
      
      // Fetch scadenze impresa
      const scadenzeRes = await fetch(`${API_BASE_URL}/api/canone-unico/scadenze-impresa/${IMPRESA_ID}`);
      const scadenzeData = await scadenzeRes.json();
      if (scadenzeData.success) {
        setScadenze(scadenzeData.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento dati wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcola totali
  const totaleSaldo = company ? 
    [...(company.spunta_wallets || []), ...(company.concession_wallets || [])]
      .reduce((sum, w) => sum + (w.balance || 0), 0) : 0;
  
  const totaleDaPagare = scadenze
    .filter(s => s.stato === 'DA_PAGARE' || s.stato === 'SCADUTO')
    .reduce((sum, s) => sum + s.importo, 0);

  // Gestisce pagamento
  const handlePaga = async (scadenza: Scadenza) => {
    alert(`Pagamento di €${scadenza.importo.toFixed(2)} per ${scadenza.descrizione}\n\nIntegrazione PagoPA in sviluppo...`);
  };

  // Colore stato wallet
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'BLOCKED': return 'bg-red-500/20 text-red-400';
      case 'LOW_BALANCE': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Colore stato scadenza
  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'PAGATO': return 'bg-green-500/20 text-green-400';
      case 'DA_PAGARE': return 'bg-yellow-500/20 text-yellow-400';
      case 'SCADUTO': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8fbff]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-b border-[#14b8a6]/20 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#3b82f6] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e8fbff]">Wallet Impresa</h1>
              <p className="text-sm text-[#e8fbff]/50">{company?.ragione_sociale || 'Caricamento...'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2332] border-[#14b8a6]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#e8fbff]/50">Saldo Totale</p>
                  <p className={`text-2xl font-bold ${totaleSaldo >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    €{totaleSaldo.toFixed(2)}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-[#14b8a6]/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2332] border-[#14b8a6]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#e8fbff]/50">Wallet Spunta</p>
                  <p className="text-2xl font-bold text-[#14b8a6]">{company?.spunta_wallets?.length || 0}</p>
                </div>
                <Wallet className="w-8 h-8 text-[#14b8a6]/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2332] border-[#14b8a6]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#e8fbff]/50">Concessioni</p>
                  <p className="text-2xl font-bold text-[#3b82f6]">{company?.concession_wallets?.length || 0}</p>
                </div>
                <Store className="w-8 h-8 text-[#3b82f6]/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2332] border-[#14b8a6]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#e8fbff]/50">Da Pagare</p>
                  <p className="text-2xl font-bold text-[#f59e0b]">€{totaleDaPagare.toFixed(2)}</p>
                </div>
                <Receipt className="w-8 h-8 text-[#f59e0b]/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a2332] border border-[#14b8a6]/20">
            <TabsTrigger value="wallet" className="data-[state=active]:bg-[#14b8a6]/20">
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="scadenze" className="data-[state=active]:bg-[#14b8a6]/20">
              <Receipt className="w-4 h-4 mr-2" />
              Scadenze
            </TabsTrigger>
            <TabsTrigger value="storico" className="data-[state=active]:bg-[#14b8a6]/20">
              <FileText className="w-4 h-4 mr-2" />
              Storico
            </TabsTrigger>
          </TabsList>

          {/* Tab Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-[#1a2332] border-[#14b8a6]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#14b8a6]" />
                      {company?.ragione_sociale || 'Impresa'}
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      P.IVA: {company?.partita_iva || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-[#14b8a6]/20 text-[#14b8a6] mb-1">
                      WALLET: {(company?.spunta_wallets?.length || 0) + (company?.concession_wallets?.length || 0)}
                    </Badge>
                    <p className={`text-lg font-bold ${totaleSaldo >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      TOTALE: €{totaleSaldo.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-[#e8fbff]/50">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    Caricamento...
                  </div>
                ) : (
                  <>
                    {/* Portafogli Spunta */}
                    <Collapsible open={expandedSpunta} onOpenChange={setExpandedSpunta}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20 hover:border-[#14b8a6]/40 transition-colors">
                        <div className="flex items-center gap-2 text-[#14b8a6]">
                          <Wallet className="w-4 h-4" />
                          <span className="font-medium">Portafogli Spunta ({company?.spunta_wallets?.length || 0})</span>
                        </div>
                        {expandedSpunta ? <ChevronUp className="w-4 h-4 text-[#e8fbff]/50" /> : <ChevronDown className="w-4 h-4 text-[#e8fbff]/50" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {company?.spunta_wallets?.map((wallet) => (
                          <div key={wallet.id} className="p-3 bg-[#0b1220]/50 rounded-lg border border-[#14b8a6]/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-[#14b8a6]" />
                                <div>
                                  <p className="font-medium text-[#e8fbff]">{wallet.market_name}</p>
                                  <p className="text-sm text-[#e8fbff]/50">Posteggio: {wallet.stall_number || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(wallet.status)}>{wallet.status}</Badge>
                                <p className={`text-lg font-bold ${wallet.balance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                  €{wallet.balance.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!company?.spunta_wallets || company.spunta_wallets.length === 0) && (
                          <p className="text-center py-4 text-[#e8fbff]/50">Nessun portafoglio spunta</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Concessioni Attive */}
                    <Collapsible open={expandedConcessioni} onOpenChange={setExpandedConcessioni}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/20 hover:border-[#3b82f6]/40 transition-colors">
                        <div className="flex items-center gap-2 text-[#3b82f6]">
                          <Store className="w-4 h-4" />
                          <span className="font-medium">Concessioni Attive ({company?.concession_wallets?.length || 0})</span>
                        </div>
                        {expandedConcessioni ? <ChevronUp className="w-4 h-4 text-[#e8fbff]/50" /> : <ChevronDown className="w-4 h-4 text-[#e8fbff]/50" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {company?.concession_wallets?.map((wallet) => (
                          <div key={wallet.id} className="p-3 bg-[#0b1220]/50 rounded-lg border border-[#3b82f6]/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Store className="w-4 h-4 text-[#3b82f6]" />
                                <div>
                                  <p className="font-medium text-[#e8fbff]">{wallet.market_name}</p>
                                  <p className="text-sm text-[#e8fbff]/50">
                                    Concessione: {wallet.concession_code} • {wallet.stall_area} mq
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(wallet.status)}>{wallet.status}</Badge>
                                <p className={`text-lg font-bold ${wallet.balance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                  €{wallet.balance.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!company?.concession_wallets || company.concession_wallets.length === 0) && (
                          <p className="text-center py-4 text-[#e8fbff]/50">Nessuna concessione attiva</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Scadenze */}
          <TabsContent value="scadenze">
            <Card className="bg-[#1a2332] border-[#14b8a6]/20">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#14b8a6]" />
                  Scadenze da Pagare
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scadenze.filter(s => s.stato !== 'PAGATO').length === 0 ? (
                  <div className="text-center py-8 text-[#e8fbff]/50">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <p>Nessuna scadenza da pagare</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scadenze
                      .filter(s => s.stato !== 'PAGATO')
                      .map((scadenza) => (
                        <div key={scadenza.id} className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/10">
                          <div className="flex items-center gap-4">
                            <Receipt className="w-5 h-5 text-[#14b8a6]" />
                            <div>
                              <h4 className="font-medium text-[#e8fbff]">{scadenza.descrizione}</h4>
                              <p className="text-sm text-[#e8fbff]/50">
                                Scadenza: {new Date(scadenza.data_scadenza).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={getStatoColor(scadenza.stato)}>{scadenza.stato.replace('_', ' ')}</Badge>
                            <span className="text-xl font-bold text-[#e8fbff]">€{scadenza.importo.toFixed(2)}</span>
                            <Button size="sm" onClick={() => handlePaga(scadenza)} className="bg-[#14b8a6] hover:bg-[#14b8a6]/80">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Paga
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Storico */}
          <TabsContent value="storico">
            <Card className="bg-[#1a2332] border-[#14b8a6]/20">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#14b8a6]" />
                  Storico Pagamenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scadenze.filter(s => s.stato === 'PAGATO').length === 0 ? (
                  <div className="text-center py-8 text-[#e8fbff]/50">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nessun pagamento effettuato</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scadenze
                      .filter(s => s.stato === 'PAGATO')
                      .map((scadenza) => (
                        <div key={scadenza.id} className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-4">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <div>
                              <h4 className="font-medium text-[#e8fbff]">{scadenza.descrizione}</h4>
                              <p className="text-sm text-[#e8fbff]/50">IUV: {scadenza.iuv || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className="bg-green-500/20 text-green-400">PAGATO</Badge>
                            <span className="text-xl font-bold text-green-400">€{scadenza.importo.toFixed(2)}</span>
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
    </div>
  );
}
