import { useState, useEffect } from 'react';
import { 
  History, TrendingUp, Leaf, ArrowLeft, Loader2, TreeDeciduous
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Link } from 'wouter';

const API_BASE = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function WalletStorico() {
  // Auth
  const [currentUser, setCurrentUser] = useState<{id: number; name: string; email: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      setLoading(false);
    }
  }, []);

  // Load transactions
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`${API_BASE}/api/tcc/wallet/${currentUser.id}/transactions`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTransactions(data.transactions || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentUser?.id]);

  // Calculations
  const totalCO2 = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalTrees = (totalCO2 / 22).toFixed(1);
  const lastTx = transactions.length > 0 ? transactions[0] : null;
  const lastCO2 = lastTx ? Math.abs(lastTx.amount) : 0;

  // Not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center gap-3">
          <Link href="/wallet">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </Link>
          <History className="h-6 w-6 text-white" />
          <span className="text-white font-bold text-lg">Storico</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-slate-400">Devi accedere per vedere lo storico</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/wallet">
          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </Link>
        <History className="h-6 w-6 text-white" />
        <div>
          <p className="text-white font-bold text-lg">Storico</p>
          <p className="text-white/70 text-xs">{transactions.length} transazioni</p>
        </div>
      </div>

      {/* Stats - Due colonne fullscreen */}
      <div className="grid grid-cols-2 gap-0 shrink-0">
        {/* CO2 + Alberi */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="h-5 w-5 text-green-300" />
            <span className="text-green-200 text-sm">Impatto</span>
          </div>
          <p className="text-3xl font-black text-white">{totalCO2.toLocaleString('it-IT')}</p>
          <p className="text-green-200 text-sm">kg CO₂ totale</p>
          <div className="mt-3 pt-3 border-t border-green-500/30">
            <div className="flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-green-300" />
              <span className="text-2xl font-bold text-white">{totalTrees}</span>
            </div>
            <p className="text-green-200 text-xs">alberi equivalenti</p>
          </div>
        </div>

        {/* Trend */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-300" />
            <span className="text-blue-200 text-sm">Trend</span>
          </div>
          <p className="text-3xl font-black text-white">{lastCO2}</p>
          <p className="text-blue-200 text-sm">kg ultima op.</p>
          <div className="mt-3 pt-3 border-t border-blue-500/30">
            <p className="text-lg font-semibold text-white">
              {lastTx?.type === 'earn' ? '↑ Accredito' : '↓ Pagamento'}
            </p>
            <p className="text-blue-200 text-xs">
              {lastTx ? new Date(lastTx.created_at).toLocaleDateString('it-IT') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions list - Scrollable fullscreen */}
      <div className="flex-1 overflow-y-auto bg-slate-800">
        <div className="px-4 py-3 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-white font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            Transazioni
          </p>
        </div>
        
        <div className="divide-y divide-slate-700">
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nessuna transazione</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{tx.description}</p>
                  <p className="text-slate-500 text-sm">
                    {new Date(tx.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className={`text-xl font-bold ml-3 ${tx.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
