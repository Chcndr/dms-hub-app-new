import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, CreditCard, History, AlertCircle } from "lucide-react";

interface WalletTransaction {
  id: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: string;
  balance_after: string;
  description: string;
  created_at: string;
}

interface WalletData {
  id: number;
  type: 'CONCESSIONE' | 'SPUNTA';
  balance: string;
  market_name?: string;
  concession_code?: string;
  stall_number?: string;
  updated_at: string;
}

interface CompanyWalletProps {
  companyId: number;
  companyName: string;
}

export function CompanyWallet({ companyId, companyName }: CompanyWalletProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (companyId) {
      fetchWallets();
    }
  }, [companyId]);

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactions(selectedWallet.id);
    }
  }, [selectedWallet]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/wallets/company/${companyId}`);
      const data = await response.json();
      if (data.success) {
        setWallets(data.data);
        if (data.data.length > 0 && !selectedWallet) {
          setSelectedWallet(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error("Errore caricamento wallet");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (walletId: number) => {
    try {
      setLoadingTx(true);
      const response = await fetch(`${API_URL}/api/wallets/${walletId}/transactions`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTx(false);
    }
  };

  const getTrafficLight = (balance: number) => {
    // Logica semaforo: Verde >= 3 giorni (approx 50€), Giallo > 0, Rosso <= 0
    // Semplificazione: Verde > 50, Giallo > 0, Rosso <= 0
    if (balance >= 50) return "bg-green-500";
    if (balance > 0) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Portafoglio PagoPA - {companyName}
        </h2>
        <Button variant="outline" onClick={fetchWallets} disabled={loading}>
          Aggiorna
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Caricamento wallet...</div>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
            <p>Nessun wallet attivo per questa impresa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista Wallet */}
          <div className="md:col-span-1 space-y-4">
            {wallets.map((wallet) => (
              <Card 
                key={wallet.id} 
                className={`cursor-pointer transition-all ${selectedWallet?.id === wallet.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedWallet(wallet)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={wallet.type === 'CONCESSIONE' ? 'default' : 'secondary'}>
                      {wallet.type}
                    </Badge>
                    <div className={`h-3 w-3 rounded-full ${getTrafficLight(Number(wallet.balance))}`} />
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="font-bold text-lg">{formatCurrency(wallet.balance)}</h3>
                    <p className="text-xs text-gray-500">Saldo disponibile</p>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    {wallet.market_name && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Mercato:</span> {wallet.market_name}
                      </div>
                    )}
                    {wallet.stall_number && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Posteggio:</span> {wallet.stall_number}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dettaglio e Transazioni */}
          <div className="md:col-span-2">
            {selectedWallet && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Storico Transazioni</CardTitle>
                  <CardDescription>
                    Movimenti per {selectedWallet.type} 
                    {selectedWallet.market_name ? ` - ${selectedWallet.market_name}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {loadingTx ? (
                      <p className="text-center py-4">Caricamento transazioni...</p>
                    ) : transactions.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">Nessuna transazione trovata.</p>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.type === 'DEPOSIT' ? <CreditCard className="h-4 w-4" /> : <History className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{tx.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </p>
                              <p className="text-xs text-gray-400">Saldo: {formatCurrency(tx.balance_after)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
