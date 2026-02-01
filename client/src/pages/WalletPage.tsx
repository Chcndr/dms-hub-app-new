import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { 
  Wallet, RefreshCw, Loader2, ArrowLeft, LogOut, Euro, History
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Link, useLocation } from 'wouter';

const API_BASE = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';
const TCC_VALUE_EUR = 0.089;

export default function WalletPage() {
  const [, setLocation] = useLocation();
  
  // Auth
  const [currentUser, setCurrentUser] = useState<{id: number; name: string; email: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Wallet data
  const [balance, setBalance] = useState(0);
  const [qrData, setQrData] = useState<{qr_string: string; expires_at: string} | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

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
    setLoading(false);
  }, []);

  // Load wallet
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
      
      // Generate QR
      generateQR();
    }
  }, [currentUser?.id]);

  const generateQR = async () => {
    if (!currentUser?.id) return;
    try {
      setGeneratingQR(true);
      const res = await fetch(`${API_BASE}/api/tcc/v2/generate-receive-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setQrData({ qr_string: data.qr_string, expires_at: data.expires_at });
      }
    } catch (err) {
      console.error('Errore QR:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
            </Link>
            <Wallet className="h-6 w-6 text-white" />
            <span className="text-white font-bold text-lg">Wallet TCC</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Wallet className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accedi al Wallet</h2>
          <p className="text-slate-400 text-center mb-6">Effettua il login per gestire i tuoi Token Carbon Credit</p>
          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 h-12 px-8">
              Accedi
            </Button>
          </Link>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  // Authenticated - Fullscreen layout
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header - Barra verde */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </Link>
          <Wallet className="h-6 w-6 text-white" />
          <div>
            <p className="text-white font-bold text-lg">Wallet TCC</p>
            <p className="text-white/70 text-xs">{currentUser?.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
          <LogOut className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Saldo - Fullscreen, no container */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-6 py-6 shrink-0">
        <p className="text-emerald-900/70 text-sm font-medium">Saldo TCC</p>
        <p className="text-5xl font-black text-slate-900">{balance.toLocaleString('it-IT')}</p>
        <p className="text-emerald-900/70 text-lg">≈ €{(balance * TCC_VALUE_EUR).toFixed(2)}</p>
      </div>

      {/* QR Code - Fullscreen, no container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 bg-slate-800">
        <div className="flex items-center justify-between w-full mb-3">
          <div>
            <p className="text-white font-semibold">Il tuo QR Code</p>
            <p className="text-slate-400 text-sm">Mostra per ricevere crediti</p>
          </div>
          <button 
            onClick={generateQR} 
            disabled={generatingQR}
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600"
          >
            <RefreshCw className={`h-5 w-5 text-emerald-400 ${generatingQR ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {qrData ? (
          <>
            <div className="bg-white p-4 rounded-xl shadow-2xl">
              <QRCodeSVG value={qrData.qr_string} size={220} level="H" />
            </div>
            <p className="text-slate-400 text-sm mt-3">
              Valido fino: {new Date(qrData.expires_at).toLocaleString('it-IT')}
            </p>
          </>
        ) : (
          <div className="bg-slate-700 w-[252px] h-[252px] rounded-xl flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {/* Tab Paga / Storico - Affiancati */}
      <div className="grid grid-cols-2 gap-0 shrink-0">
        <Link href="/wallet/paga">
          <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 flex items-center justify-center gap-2">
            <Euro className="h-5 w-5" />
            Paga
          </button>
        </Link>
        <Link href="/wallet/storico">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 flex items-center justify-center gap-2">
            <History className="h-5 w-5" />
            Storico
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
