import { useState, useEffect } from 'react';
import { Eye, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { getImpersonationParams, endImpersonation } from '@/hooks/useImpersonation';

interface ImpersonationData {
  comune_id: number;
  comune_nome: string;
  user_id: number;
  user_email: string;
}

/**
 * Banner che mostra quando l'admin sta visualizzando come un comune
 * Appare in alto nella pagina con sfondo giallo
 * 
 * NOTA: Usa sessionStorage per persistere l'impersonificazione tra pagine
 */
export default function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se siamo in modalità impersonificazione (URL o sessionStorage)
    const checkImpersonation = () => {
      const state = getImpersonationParams();
      
      if (state.isImpersonating && state.comuneId) {
        setImpersonationData({
          comune_id: parseInt(state.comuneId),
          comune_nome: state.comuneNome ? decodeURIComponent(state.comuneNome) : `Comune #${state.comuneId}`,
          user_id: 0,
          user_email: state.userEmail ? decodeURIComponent(state.userEmail) : ''
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setImpersonationData(null);
      }
    };

    checkImpersonation();
    
    // Ascolta cambiamenti di storage
    window.addEventListener('storage', checkImpersonation);
    window.addEventListener('popstate', checkImpersonation);
    
    return () => {
      window.removeEventListener('storage', checkImpersonation);
      window.removeEventListener('popstate', checkImpersonation);
    };
  }, []);

  const handleEndImpersonation = () => {
    endImpersonation();
    setIsVisible(false);
    setImpersonationData(null);
    // Ricarica la pagina per pulire lo stato
    window.location.href = window.location.pathname;
  };

  if (!isVisible || !impersonationData) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-black px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-yellow-600/30 px-3 py-1 rounded-full">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">MODALITÀ VISUALIZZAZIONE</span>
          </div>
          <span className="text-sm">
            Stai visualizzando come: <strong>{impersonationData.comune_nome}</strong>
            {impersonationData.user_email && (
              <span className="ml-2 text-yellow-800">({impersonationData.user_email})</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-yellow-800">
            <AlertTriangle className="w-3 h-3" />
            Tutte le azioni sono registrate
          </div>
          <button
            onClick={handleEndImpersonation}
            className="flex items-center gap-1 px-3 py-1 bg-black/20 hover:bg-black/30 rounded-lg text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Termina Sessione
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook per verificare se siamo in modalità impersonificazione
 * e ottenere il comune_id per filtrare i dati
 * 
 * @deprecated Usa useImpersonation da '@/hooks/useImpersonation' invece
 */
export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [comuneId, setComuneId] = useState<number | null>(null);

  useEffect(() => {
    const state = getImpersonationParams();
    setIsImpersonating(state.isImpersonating);
    setComuneId(state.comuneId ? parseInt(state.comuneId) : null);
  }, []);

  return { isImpersonating, comuneId };
}
