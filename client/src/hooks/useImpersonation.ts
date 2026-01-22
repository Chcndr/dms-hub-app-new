/**
 * Hook per gestire la modalità impersonificazione
 * Legge i parametri dall'URL e fornisce helper per le chiamate API filtrate
 */

import { useMemo } from 'react';

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
  const state = useMemo(() => {
    // Legge i parametri dall'URL
    const params = new URLSearchParams(window.location.search);
    const isImpersonating = params.get('impersonate') === 'true';
    const comuneId = params.get('comune_id');
    const comuneNome = params.get('comune_nome');
    const userEmail = params.get('user_email');

    return {
      isImpersonating,
      comuneId,
      comuneNome,
      userEmail
    };
  }, []);

  // Helper per aggiungere comune_id alle URL delle API
  const addComuneIdToUrl = (url: string): string => {
    if (!state.isImpersonating || !state.comuneId) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}comune_id=${state.comuneId}`;
  };

  // Helper per opzioni fetch (per future estensioni)
  const getFetchOptions = () => {
    if (!state.isImpersonating || !state.comuneId) {
      return {};
    }
    return {
      headers: {
        'X-Comune-Id': state.comuneId
      }
    };
  };

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
