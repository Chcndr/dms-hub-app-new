/**
 * Hook per gestire la modalità impersonificazione
 * Legge i parametri dall'URL e fornisce helper per le chiamate API filtrate
 */

import { useState, useEffect, useCallback } from 'react';

export interface ImpersonationState {
  isImpersonating: boolean;
  comuneId: string | null;
  comuneNome: string | null;
  userEmail: string | null;
}

export interface UseImpersonationReturn extends ImpersonationState {
  // Helper per aggiungere comune_id alle URL
  addComuneIdToUrl: (url: string) => string;
  // Helper per aggiungere comune_id ai parametri fetch
  getFetchOptions: () => { headers?: Record<string, string> };
}

export function useImpersonation(): UseImpersonationReturn {
  // Legge i parametri direttamente dall'URL (sincrono, sempre aggiornato)
  const getParamsFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      isImpersonating: params.get('impersonate') === 'true',
      comuneId: params.get('comune_id'),
      comuneNome: params.get('comune_nome'),
      userEmail: params.get('user_email')
    };
  }, []);

  const [state, setState] = useState<ImpersonationState>(getParamsFromUrl);

  // Aggiorna lo state quando cambia l'URL
  useEffect(() => {
    const handleUrlChange = () => {
      setState(getParamsFromUrl());
    };

    // Ascolta cambiamenti di popstate (navigazione browser)
    window.addEventListener('popstate', handleUrlChange);
    
    // Aggiorna immediatamente
    handleUrlChange();

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [getParamsFromUrl]);

  // Helper per aggiungere comune_id alle URL delle API
  // IMPORTANTE: Legge direttamente dall'URL per garantire valori aggiornati
  const addComuneIdToUrl = useCallback((url: string): string => {
    const params = new URLSearchParams(window.location.search);
    const isImpersonating = params.get('impersonate') === 'true';
    const comuneId = params.get('comune_id');
    
    if (!isImpersonating || !comuneId) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}comune_id=${comuneId}`;
  }, []);

  // Helper per opzioni fetch (per future estensioni)
  const getFetchOptions = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const isImpersonating = params.get('impersonate') === 'true';
    const comuneId = params.get('comune_id');
    
    if (!isImpersonating || !comuneId) {
      return {};
    }
    return {
      headers: {
        'X-Comune-Id': comuneId
      }
    };
  }, []);

  return {
    ...state,
    addComuneIdToUrl,
    getFetchOptions
  };
}

// Funzione standalone per uso fuori dai componenti React
export function getImpersonationParams(): ImpersonationState {
  const params = new URLSearchParams(window.location.search);
  return {
    isImpersonating: params.get('impersonate') === 'true',
    comuneId: params.get('comune_id'),
    comuneNome: params.get('comune_nome'),
    userEmail: params.get('user_email')
  };
}

// Helper standalone per aggiungere comune_id alle URL
export function addComuneIdToUrl(url: string): string {
  const { isImpersonating, comuneId } = getImpersonationParams();
  
  if (!isImpersonating || !comuneId) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}comune_id=${comuneId}`;
}

export default useImpersonation;
