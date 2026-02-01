import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Euro, QrCode, RefreshCw, Loader2, ArrowLeft
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Link, useLocation } from 'wouter';

const API_BASE = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';
const TCC_VALUE_EUR = 0.089;

export default function WalletPaga() {
  const [, setLocation] = useLocation();
  
  // Auth
  const [currentUser, setCurrentUser] = useState<{id: number; name: string; email: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Payment state
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

  // Load balance
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

  // Generate spend QR
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

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center gap-3">
          <Link href="/wallet">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </Link>
          <Euro className="h-6 w-6 text-white" />
          <span className="text-white font-bold text-lg">Paga con TCC</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-slate-400">Devi accedere per pagare</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/wallet">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </Link>
          <Euro className="h-6 w-6 text-white" />
          <div>
            <p className="text-white font-bold text-lg">Paga con TCC</p>
            <p className="text-white/70 text-xs">Saldo: {balance} TCC</p>
          </div>
        </div>
      </div>

      {/* Content - Fullscreen */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {!spendQRData ? (
          // Input form - Fullscreen
          <div className="w-full max-w-md">
            <p className="text-slate-400 text-center mb-4">Genera un QR code per pagare con i tuoi Token Carbon Credit</p>
            
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Importo da pagare (€)</p>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                className="text-4xl font-bold h-20 text-center bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            {spendAmount && parseFloat(spendAmount) > 0 && (
              <div className="bg-amber-500/20 px-4 py-4 mb-4 text-center">
                <p className="text-slate-400 text-sm">TCC necessari</p>
                <p className="text-3xl font-bold text-amber-500">
                  {Math.ceil(parseFloat(spendAmount) / TCC_VALUE_EUR).toLocaleString('it-IT')} TCC
                </p>
                <p className="text-slate-500 text-xs mt-1">1 TCC = €{TCC_VALUE_EUR.toFixed(3)} = 1 kg CO₂</p>
              </div>
            )}
            
            <Button
              className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-lg font-bold"
              onClick={generateSpendQR}
              disabled={!spendAmount || parseFloat(spendAmount) <= 0 || generatingSpendQR}
            >
              {generatingSpendQR ? (
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-6 w-6 mr-2" />
              )}
              Genera QR Pagamento
            </Button>
          </div>
        ) : (
          // QR Code generated - Fullscreen
          <div className="w-full text-center">
            <div className="bg-white p-6 rounded-xl shadow-2xl inline-block mb-4">
              <QRCodeSVG value={spendQRData.qr_string} size={240} level="H" />
            </div>
            
            <div className="bg-amber-500/20 px-6 py-4 mb-4">
              <p className="text-slate-400 text-sm">Importo</p>
              <p className="text-4xl font-bold text-white">
                €{parseFloat(spendAmount).toLocaleString('it-IT', {minimumFractionDigits: 2})}
              </p>
              <p className="text-2xl text-amber-500 font-semibold">{spendQRData.tcc_amount} TCC</p>
            </div>
            
            <p className="text-slate-500 text-sm mb-4">
              Valido fino: {new Date(spendQRData.expires_at).toLocaleTimeString('it-IT')}
            </p>
            
            <Button
              variant="outline"
              className="w-full h-12 border-slate-600 text-white hover:bg-slate-800"
              onClick={resetPayment}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Nuovo Pagamento
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
