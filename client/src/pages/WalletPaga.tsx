import { useState } from 'react';
import { Euro, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

export default function WalletPaga() {
  const [importo, setImporto] = useState('');
  const [qrGenerato, setQrGenerato] = useState(false);
  
  const tccNecessari = importo ? Math.ceil(parseFloat(importo) / 0.089) : 0;
  const qrString = `tcc://pay/${Date.now()}/${importo}/${tccNecessari}`;

  const handleGeneraQR = () => {
    if (importo && parseFloat(importo) > 0) {
      setQrGenerato(true);
    }
  };

  const handleNuovoPagamento = () => {
    setImporto('');
    setQrGenerato(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - stile coerente con Wallet */}
      <header className="bg-gradient-to-r from-primary via-primary/90 to-emerald-600 text-primary-foreground p-3 flex items-center gap-3 shadow-lg">
        <a href="/wallet" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Euro className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">Paga con TCC</span>
        </div>
      </header>

      {/* Contenuto */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!qrGenerato ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Inserisci l'importo da pagare in Euro
            </p>
            
            <div className="w-full max-w-xs">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">€</span>
                <input
                  type="number"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-4xl font-bold py-4 pl-10 pr-4 bg-muted/30 border-2 border-muted rounded-xl focus:border-amber-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {importo && parseFloat(importo) > 0 && (
                <p className="text-center mt-3 text-lg">
                  = <span className="font-bold text-amber-600">{tccNecessari} TCC</span>
                </p>
              )}
            </div>

            <Button 
              onClick={handleGeneraQR}
              disabled={!importo || parseFloat(importo) <= 0}
              className="mt-6 px-8 py-3 text-lg border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 text-foreground"
              variant="outline"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Genera QR Pagamento
            </Button>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">Importo: €{parseFloat(importo).toFixed(2)}</p>
              <p className="text-amber-600 font-bold text-xl">{tccNecessari} TCC</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <QRCodeSVG value={qrString} size={200} level="H" />
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              Mostra questo QR al negoziante
            </p>

            <Button 
              onClick={handleNuovoPagamento}
              variant="outline"
              className="mt-6"
            >
              Nuovo Pagamento
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
