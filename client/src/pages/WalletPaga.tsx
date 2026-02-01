import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Euro, QrCode, RefreshCw, Loader2, ArrowLeft, Wallet
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Link } from 'wouter';

const API_BASE = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

// Valore TCC in euro (basato su EU ETS: €89/tonnellata / 1000 = €0,089 per kg CO₂)
const TCC_VALUE_EUR = 0.089;

export default function WalletPaga() {
  // Autenticazione
  const [currentUser, setCurrentUser] = useState<{id: number; name: string; email: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Stato pagamento
  const [spendAmount, setSpendAmount] = useState('');
  const [spendQRData, setSpendQRData] = useState<{qr_string: string; tcc_amount: number; expires_at: string} | null>(null);
  const [generatingSpendQR, setGeneratingSpendQR] = useState(false);
  const [balance, setBalance] = useState(0);

  // Check auth
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  // Carica saldo
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`${API_BASE}/api/tcc/wallet/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBalance(data.wallet.balance);
          }
        })
        .catch(console.error);
    }
  }, [currentUser?.id]);

  // Genera QR per spendere TCC
  const generateSpendQR = async () => {
    if (!spendAmount || parseFloat(spendAmount) <= 0 || !currentUser?.id) return;
    
    try {
      setGeneratingSpendQR(true);
      const res = await fetch(`${API_BASE}/api/tcc/v2/generate-spend-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          euro_amount: parseFloat(spendAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSpendQRData({
          qr_string: data.qr_string,
          tcc_amount: data.tcc_amount,
          expires_at: data.expires_at
        });
      } else {
        alert(data.error || 'Errore generazione QR');
      }
    } catch (err) {
      console.error('Errore generazione QR spesa:', err);
      alert('Errore di connessione');
    } finally {
      setGeneratingSpendQR(false);
    }
  };

  const resetPayment = () => {
    setSpendQRData(null);
    setSpendAmount('');
  };

  // Se non autenticato
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 flex items-center gap-3 shrink-0">
          <Link href="/wallet">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <Euro className="h-6 w-6" />
          <h1 className="text-lg font-bold">Paga con TCC</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">Devi accedere per pagare</p>
              <Link href="/wallet">
                <Button>Vai al Wallet</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 sm:p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/wallet">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </Link>
          <Euro className="h-5 w-5 sm:h-6 sm:w-6" />
          <div>
            <h1 className="text-base sm:text-lg font-bold">Paga con TCC</h1>
            <p className="text-xs text-white/70">Saldo: {balance} TCC</p>
          </div>
        </div>
      </header>

      {/* Contenuto */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!spendQRData ? (
          // Form inserimento importo
          <Card className="w-full max-w-sm border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Euro className="h-5 w-5" />
                Paga con TCC
              </CardTitle>
              <CardDescription>Genera un QR code per pagare con i tuoi Token Carbon Credit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Importo da pagare (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="text-3xl font-bold h-16 text-center"
                />
              </div>
              
              {spendAmount && parseFloat(spendAmount) > 0 && (
                <div className="p-3 bg-amber-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">TCC necessari</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {Math.ceil(parseFloat(spendAmount) / TCC_VALUE_EUR).toLocaleString('it-IT')} TCC
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 TCC = €{TCC_VALUE_EUR.toFixed(3)} = 1 kg CO₂
                  </p>
                </div>
              )}
              
              <Button
                className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-lg font-semibold"
                onClick={generateSpendQR}
                disabled={!spendAmount || parseFloat(spendAmount) <= 0 || generatingSpendQR}
              >
                {generatingSpendQR ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-5 w-5 mr-2" />
                )}
                Genera QR Pagamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          // QR Code generato
          <Card className="w-full max-w-sm border-2 border-amber-500/30">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-inner inline-block">
                <QRCodeSVG value={spendQRData.qr_string} size={200} level="H" />
              </div>
              
              <div className="p-4 bg-amber-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Importo</p>
                <p className="text-3xl font-bold">
                  €{parseFloat(spendAmount).toLocaleString('it-IT', {minimumFractionDigits: 2})}
                </p>
                <p className="text-xl text-amber-600 font-semibold">{spendQRData.tcc_amount} TCC</p>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Valido fino: {new Date(spendQRData.expires_at).toLocaleTimeString('it-IT')}
              </p>
              
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={resetPayment}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nuovo Pagamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
