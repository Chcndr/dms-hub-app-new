import { useState, useEffect } from 'react';
import { Eye, X, ExternalLink, AlertTriangle } from 'lucide-react';

interface ImpersonationData {
  comune_id: number;
  comune_nome: string;
  user_id: number;
  user_email: string;
}

/**
 * Banner che mostra quando l'admin sta visualizzando come un comune
 * Appare in alto nella pagina con sfondo giallo
 */
export default function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se siamo in modalità impersonificazione
    const checkImpersonation = () => {
      // Controlla URL params
      const urlParams = new URLSearchParams(window.location.search);
      const isImpersonate = urlParams.get('impersonate') === 'true';
      const comuneId = urlParams.get('comune_id');
      
      // Controlla sessionStorage
      const storedData = sessionStorage.getItem('impersonating_comune');
      
      if (isImpersonate && storedData) {
        try {
          const data = JSON.parse(storedData);
          setImpersonationData(data);
          setIsVisible(true);
        } catch (e) {
          console.error('Error parsing impersonation data:', e);
        }
      } else if (isImpersonate && comuneId) {
        // Fallback: solo comune_id dall'URL
        setImpersonationData({
          comune_id: parseInt(comuneId),
          comune_nome: `Comune #${comuneId}`,
          user_id: 0,
          user_email: ''
        });
        setIsVisible(true);
      }
    };

    checkImpersonation();
    
    // Ascolta cambiamenti di storage
    window.addEventListener('storage', checkImpersonation);
    return () => window.removeEventListener('storage', checkImpersonation);
  }, []);

  const handleEndImpersonation = () => {
    sessionStorage.removeItem('impersonating_comune');
    // Rimuovi i parametri dall'URL e ricarica
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    url.searchParams.delete('comune_id');
    window.location.href = url.toString();
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
 */
export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [comuneId, setComuneId] = useState<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const impersonate = urlParams.get('impersonate') === 'true';
    const id = urlParams.get('comune_id');
    
    setIsImpersonating(impersonate);
    setComuneId(id ? parseInt(id) : null);
  }, []);

  return { isImpersonating, comuneId };
}
