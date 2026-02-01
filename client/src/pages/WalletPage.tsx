import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LoginModal from '@/components/LoginModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, Leaf, RefreshCw, Loader2,
  User, Euro, History, ArrowLeft, LogOut
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Link } from 'wouter';

const API_BASE = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

// ============================================================================
// INTERFACES
// ============================================================================

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  customer_name?: string;
}

interface WalletData {
  balance: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface QRData {
  qr_string: string;
  expires_at: string;
}

// ============================================================================
// WALLET PAGE COMPONENT - MOBILE OPTIMIZED
// ============================================================================

export default function WalletPage() {
  // ============================================================================
  // AUTENTICAZIONE
  // ============================================================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: number; name: string; email: string} | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Controlla autenticazione all'avvio
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (e) {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWalletData(null);
    setTransactions([]);
    setQrData(null);
  };
  
  // Cliente state
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingQR, setRefreshingQR] = useState(false);

  // Usa l'utente loggato invece di userId hardcoded
  const userId = currentUser?.id || 0;

  // Valore TCC in euro (basato su EU ETS: €89/tonnellata / 1000 = €0,089 per kg CO₂)
  const TCC_VALUE_EUR = 0.089;

  // ============================================================================
  // CLIENTE FUNCTIONS
  // ============================================================================

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      const walletRes = await fetch(`${API_BASE}/api/tcc/wallet/${userId}`);
      if (walletRes.ok) {
        const data = await walletRes.json();
        if (data.success) {
          setWalletData({
            balance: data.wallet.balance,
            user: data.wallet
          });
        }
      }

      const txRes = await fetch(`${API_BASE}/api/tcc/wallet/${userId}/transactions`);
      if (txRes.ok) {
        const data = await txRes.json();
        if (data.success) {
          setTransactions(data.transactions || []);
        }
      }

      await refreshQRCode();

    } catch (err) {
      console.error('Errore caricamento wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async () => {
    try {
      setRefreshingQR(true);
      const qrRes = await fetch(`${API_BASE}/api/tcc/qrcode/${userId}`);
      if (qrRes.ok) {
        const data = await qrRes.json();
        if (data.success) {
          setQrData({
            qr_string: data.qr_string,
            expires_at: data.expires_at
          });
        }
      }
    } catch (err) {
      console.error('Errore generazione QR:', err);
    } finally {
      setRefreshingQR(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchWalletData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser?.id]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const balance = walletData?.balance || 0;
  
  // CO2 totale cumulativo
  const totalCumulativeCO2 = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalCumulativeTrees = (totalCumulativeCO2 / 22).toFixed(1);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento wallet...</p>
        </div>
      </div>
    );
  }

  // Se non autenticato, mostra schermata di benvenuto con login
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        {/* Header compatto */}
        <header className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground p-3 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Link>
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Wallet TCC</h1>
              <p className="text-xs text-white/70 hidden sm:block">Token Carbon Credit</p>
            </div>
          </div>
        </header>
        
        {/* Contenuto non autenticato - centrato */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-primary/10 to-emerald-600/10 border-primary/30 w-full max-w-sm">
            <CardContent className="pt-6 pb-6 text-center">
              <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Benvenuto</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Accedi per vedere i tuoi Token Carbon Credit
              </p>
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-primary hover:bg-primary/90 py-5"
              >
                <User className="h-4 w-4 mr-2" />
                Accedi
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <LoginModal isOpen={showLoginModal} onClose={() => {
          setShowLoginModal(false);
          const userStr = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          if (userStr && token) {
            try {
              const user = JSON.parse(userStr);
              setCurrentUser(user);
              setIsAuthenticated(true);
            } catch (e) {}
          }
        }} />
        
        <BottomNav />
      </div>
    );
  }

  // ============================================================================
  // RENDER AUTENTICATO - LAYOUT FISSO MOBILE
  // ============================================================================
  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Header compatto */}
      <header className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground p-3 sm:p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </Link>
          <div className="p-2 bg-white/20 rounded-xl">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold">Wallet TCC</h1>
            <p className="text-xs text-white/70">{currentUser?.name || 'I tuoi crediti'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-white/10 hover:bg-red-500/50"
          title="Esci"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </header>

      {/* Contenuto principale - scrollabile solo su desktop */}
      <div className="flex-1 overflow-y-auto sm:overflow-visible p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Card Saldo - compatta su mobile */}
        <Card className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/70">Saldo TCC</p>
                <p className="text-3xl sm:text-5xl font-bold">{balance}</p>
              </div>
            </div>
            <p className="text-sm text-white/80">
              ≈ €{(balance * TCC_VALUE_EUR).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>

        {/* QR Code - compatto */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base">Il tuo QR Code</CardTitle>
                <CardDescription className="text-xs">Mostra per ricevere crediti</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={refreshQRCode} disabled={refreshingQR} className="h-8 w-8">
                <RefreshCw className={`h-4 w-4 ${refreshingQR ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg shadow-inner">
              <QRCodeSVG value={qrData?.qr_string || `tcc://${userId}/demo`} size={140} level="H" />
            </div>
            {qrData?.expires_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Valido fino: {new Date(qrData.expires_at).toLocaleString('it-IT')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statistiche CO2 - due colonne compatte */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{totalCumulativeCO2.toLocaleString('it-IT')}</div>
              <div className="text-xs text-muted-foreground">kg CO₂ Totale</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🌳</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{totalCumulativeTrees}</div>
              <div className="text-xs text-muted-foreground">Alberi equiv.</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab fissi in basso - PAGA e STORICO */}
      <div className="shrink-0 border-t bg-background p-2 sm:p-3 grid grid-cols-2 gap-2 sm:gap-3">
        <Link href="/wallet/paga">
          <Button className="w-full h-12 sm:h-14 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
            <Euro className="h-5 w-5 mr-2" />
            PAGA
          </Button>
        </Link>
        <Link href="/wallet/storico">
          <Button variant="outline" className="w-full h-12 sm:h-14 border-primary/30 font-semibold">
            <History className="h-5 w-5 mr-2" />
            STORICO
          </Button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
