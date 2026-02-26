/**
 * PagaConWallet — Dialog di pagamento da wallet generico
 * Componente riutilizzabile per tutti i flussi di pagamento:
 * - Quota associativa
 * - Servizio associazione
 * - Iscrizione corso formazione
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { MIHUB_API_BASE_URL } from '@/config/api';
import { addComuneIdToUrl, authenticatedFetch, getImpersonationParams } from '@/hooks/useImpersonation';

const API_BASE_URL = MIHUB_API_BASE_URL;

interface PagaConWalletProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  importo: number;
  descrizione: string;
  tipo: 'quota_associativa' | 'servizio' | 'corso' | 'generico';
  riferimentoId?: number;
  impresaId: number | null;
}

export function PagaConWallet({ open, onClose, onSuccess, importo, descrizione, tipo, riferimentoId, impresaId }: PagaConWalletProps) {
  const [saldo, setSaldo] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [walletComuneId, setWalletComuneId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!open || !impresaId) return;
    setPaid(false);
    setLoading(true);
    // Carica saldo wallet generico dell'impresa
    // Usa /api/wallets/company/{id} che non richiede comune_id (a differenza di /api/wallets)
    const loadSaldo = async () => {
      try {
        const res = await fetch(addComuneIdToUrl(`${API_BASE_URL}/api/wallets/company/${impresaId}`));
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Trova il wallet GENERICO/SPUNTISTA (case-insensitive)
          const generico = data.data.find((w: any) => {
            const t = (w.type || w.tipo || '').toUpperCase();
            return t === 'GENERICO' || t === 'SPUNTISTA' || t === 'GENERAL' || t === 'MAIN';
          });
          // Se non trova un tipo specifico, usa il primo wallet disponibile
          const wallet = generico || data.data[0];
          setSaldo(wallet ? parseFloat(wallet.balance || wallet.saldo || '0') || 0 : 0);
          setWalletId(wallet?.id || null);
          setWalletComuneId(wallet?.comune_id || data.data.find((w: any) => w.comune_id)?.comune_id || null);
        } else if (data.success && typeof data.data === 'object' && data.data !== null && !Array.isArray(data.data)) {
          // Risposta singola (non array)
          setSaldo(parseFloat(data.data.balance || data.data.saldo || '0') || 0);
          setWalletId(data.data.id || null);
          setWalletComuneId(data.data.comune_id || null);
        } else {
          setSaldo(0);
        }
      } catch {
        setSaldo(0);
      } finally {
        setLoading(false);
      }
    };
    loadSaldo();
  }, [open, impresaId]);

  const handlePaga = async () => {
    if (!impresaId || !importo || importo <= 0) {
      alert('Importo non valido');
      return;
    }
    if (!walletId) {
      alert('Wallet non trovato. Riprova.');
      return;
    }
    setPaying(true);
    try {
      // Usa /api/wallets/withdraw (endpoint FUNZIONANTE) per il prelievo dal wallet
      // Stesso pattern usato da WalletImpresaPage e WalletPanel per deposit
      const descWithType = `[${tipo}] ${descrizione}${riferimentoId ? ` (rif: ${riferimentoId})` : ''}`;
      // comune_id: dal wallet, oppure fallback dall'impersonation state
      const impState = getImpersonationParams();
      const comuneId = walletComuneId
        || (impState.comuneId ? parseInt(impState.comuneId, 10) : null);
      const res = await authenticatedFetch(`${API_BASE_URL}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: walletId,
          amount: importo,
          description: descWithType,
          company_id: impresaId,
          ...(comuneId && { comune_id: comuneId })
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaid(true);
        onSuccess?.();
      } else {
        alert(data.error || 'Errore durante il pagamento');
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="bg-[#1a2332] border-[#14b8a6]/30 w-full max-w-md py-0 gap-0" onClick={e => e.stopPropagation()}>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#14b8a6]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#e8fbff]">Paga con Wallet</h3>
                <p className="text-xs text-[#e8fbff]/50">Pagamento da wallet generico</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#e8fbff]/40 hover:text-[#e8fbff]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {paid ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-[#10b981] mx-auto mb-3" />
              <p className="text-lg font-semibold text-[#e8fbff]">Pagamento effettuato</p>
              <p className="text-sm text-[#e8fbff]/60 mt-1">{descrizione}</p>
              <Button onClick={onClose} className="mt-4 bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white">
                Chiudi
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-[#14b8a6] animate-spin mx-auto" />
              <p className="text-sm text-[#e8fbff]/50 mt-2">Caricamento saldo...</p>
            </div>
          ) : (
            <>
              {/* Descrizione operazione */}
              <div className="bg-[#0b1220]/50 rounded-lg p-4 border border-[#14b8a6]/10">
                <p className="text-sm text-[#e8fbff]/60 mb-1">Operazione</p>
                <p className="text-base font-medium text-[#e8fbff]">{descrizione}</p>
              </div>

              {/* Saldo e importo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b1220]/50 rounded-lg p-3 text-center border border-[#14b8a6]/10">
                  <p className="text-xs text-[#e8fbff]/50">Saldo attuale</p>
                  <p className={`text-xl font-bold ${(saldo || 0) >= importo ? 'text-[#10b981]' : 'text-red-400'}`}>
                    &euro;{(saldo || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#0b1220]/50 rounded-lg p-3 text-center border border-[#f59e0b]/20">
                  <p className="text-xs text-[#e8fbff]/50">Da pagare</p>
                  <p className="text-xl font-bold text-[#f59e0b]">&euro;{importo.toFixed(2)}</p>
                </div>
              </div>

              {(saldo || 0) >= importo ? (
                <Button
                  onClick={handlePaga}
                  disabled={paying}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-6 text-base"
                >
                  {paying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  {paying ? 'Pagamento in corso...' : `Conferma Pagamento - €${importo.toFixed(2)}`}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Saldo insufficiente</p>
                      <p className="text-xs text-[#e8fbff]/50 mt-1">
                        Servono &euro;{(importo - (saldo || 0)).toFixed(2)} in piu'. Ricarica il wallet per procedere.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                    onClick={() => {
                      onClose();
                      window.location.href = '/app/impresa/wallet';
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Vai al Wallet per Ricaricare
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
