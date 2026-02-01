import { ArrowLeft, Leaf, TrendingUp, Award } from 'lucide-react';

export default function WalletStorico() {
  // Dati demo
  const totalCO2 = 19185;
  const alberiEquivalenti = Math.round(totalCO2 / 22);
  const ultimoAcquisto = 450;
  const ultimoAcquistoAlberi = Math.round(ultimoAcquisto / 22);
  
  const transactions = [
    { id: 1, description: 'Acquisto Mercato Centrale', amount: 120, type: 'earn', date: '01/02/2026 10:30' },
    { id: 2, description: 'Pagamento Bar Roma', amount: 45, type: 'spend', date: '31/01/2026 15:20' },
    { id: 3, description: 'Acquisto Ortofrutta Bio', amount: 85, type: 'earn', date: '30/01/2026 09:15' },
    { id: 4, description: 'Bonus Eco-Friendly', amount: 200, type: 'earn', date: '29/01/2026 12:00' },
    { id: 5, description: 'Pagamento Ristorante', amount: 150, type: 'spend', date: '28/01/2026 20:45' },
    { id: 6, description: 'Acquisto Prodotti Locali', amount: 95, type: 'earn', date: '27/01/2026 11:30' },
    { id: 7, description: 'Pagamento Farmacia', amount: 32, type: 'spend', date: '26/01/2026 16:00' },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - stile coerente con Wallet */}
      <header className="bg-gradient-to-r from-primary via-primary/90 to-emerald-600 text-primary-foreground p-3 flex items-center gap-3 shadow-lg">
        <a href="/wallet" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">Storico & Impatto</span>
        </div>
      </header>

      {/* Indicatori - 2 colonne con più altezza */}
      <div className="grid grid-cols-2 gap-3 p-3">
        {/* Ultimo Acquisto */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-xl text-center border border-green-500/20">
          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <p className="text-3xl font-bold text-green-600">{ultimoAcquisto}</p>
          <p className="text-sm font-medium text-green-700">kg CO₂</p>
          <p className="text-xs text-muted-foreground mt-1">Ultimo Acquisto</p>
          <div className="mt-2 pt-2 border-t border-green-500/20">
            <p className="text-xs text-green-600 font-medium">≈ {ultimoAcquistoAlberi} alberi</p>
          </div>
        </div>

        {/* Trend / Livello */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-4 rounded-xl text-center border border-amber-500/20">
          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Award className="h-7 w-7 text-white" />
          </div>
          <p className="text-xl font-bold text-amber-600">Eco-Champion</p>
          <p className="text-sm font-medium text-amber-700">Livello Raggiunto</p>
          <p className="text-xs text-muted-foreground mt-1">{totalCO2.toLocaleString()} kg totali</p>
          <div className="mt-2 pt-2 border-t border-amber-500/20">
            <p className="text-xs text-amber-600 font-medium">≈ {alberiEquivalenti} alberi</p>
          </div>
        </div>
      </div>

      {/* Titolo Lista */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border/50">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Transazioni Recenti</h3>
      </div>

      {/* Lista Transazioni - scrollabile */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className={`text-lg font-bold ml-3 ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'earn' ? '+' : '-'}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
