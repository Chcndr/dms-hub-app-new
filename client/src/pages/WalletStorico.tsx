import { ArrowLeft, Leaf, TreeDeciduous, TrendingUp, Award } from 'lucide-react';

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
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <a href="/wallet" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-bold text-lg">Storico & Impatto</span>
        </div>
      </header>

      {/* Indicatori - 2 colonne */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {/* Ultimo Acquisto */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-3 rounded-lg text-center">
          <div className="w-10 h-10 mx-auto mb-1 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-green-600">{ultimoAcquisto} kg</p>
          <p className="text-xs text-muted-foreground">CO₂ Ultimo Acquisto</p>
          <p className="text-[10px] text-muted-foreground">= {ultimoAcquistoAlberi} alberi</p>
        </div>

        {/* Trend / Livello */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-3 rounded-lg text-center">
          <div className="w-10 h-10 mx-auto mb-1 bg-amber-500 rounded-lg flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <p className="text-lg font-bold text-amber-600">Eco-Champion</p>
          <p className="text-xs text-muted-foreground">{totalCO2.toLocaleString()} kg totali</p>
          <p className="text-[10px] text-muted-foreground">= {alberiEquivalenti} alberi</p>
        </div>
      </div>

      {/* Lista Transazioni - scrollabile */}
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Transazioni
        </h3>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className={`text-lg font-semibold ml-2 ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'earn' ? '+' : '-'}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
