/**
 * Hook per gestire la modalità impersonificazione
 * Legge i parametri dall'URL e li salva in sessionStorage per persistenza tra pagine
 * 
 * IMPORTANTE: Usa sessionStorage per mantenere l'impersonificazione quando si naviga
 * a nuove pagine (es. da dashboard a nuovo-verbale)
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'miohub_impersonation';

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
  // Helper per terminare l'impersonificazione
  endImpersonation: () => void;
}

// Funzione per salvare in sessionStorage
function saveToStorage(state: ImpersonationState): void {
  try {
    if (state.isImpersonating) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[Impersonation] Errore salvataggio sessionStorage:', e);
  }
}

// Funzione per leggere da sessionStorage
function loadFromStorage(): ImpersonationState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[Impersonation] Errore lettura sessionStorage:', e);
  }
  return null;
}

// Funzione per leggere i parametri dall'URL
function getParamsFromUrl(): ImpersonationState {
  const params = new URLSearchParams(window.location.search);
  return {
    isImpersonating: params.get('impersonate') === 'true',
    comuneId: params.get('comune_id'),
    comuneNome: params.get('comune_nome'),
    userEmail: params.get('user_email')
  };
}

// Funzione per ottenere lo stato combinato (URL ha priorità, poi sessionStorage)
function getCombinedState(): ImpersonationState {
  const urlState = getParamsFromUrl();
  
  // Se l'URL ha i parametri di impersonificazione, usali e salvali
  if (urlState.isImpersonating && urlState.comuneId) {
    saveToStorage(urlState);
    return urlState;
  }
  
  // Altrimenti, prova a leggere da sessionStorage
  const storedState = loadFromStorage();
  if (storedState && storedState.isImpersonating && storedState.comuneId) {
    return storedState;
  }
  
  // Nessuna impersonificazione attiva
  return {
    isImpersonating: false,
    comuneId: null,
    comuneNome: null,
    userEmail: null
  };
}

export function useImpersonation(): UseImpersonationReturn {
  const [state, setState] = useState<ImpersonationState>(getCombinedState);

  // Aggiorna lo state quando cambia l'URL o al mount
  useEffect(() => {
    const handleUrlChange = () => {
      const newState = getCombinedState();
      setState(newState);
    };

    // Ascolta cambiamenti di popstate (navigazione browser)
    window.addEventListener('popstate', handleUrlChange);
    
    // Ascolta storage events (per sincronizzare tra tab)
    window.addEventListener('storage', handleUrlChange);
    
    // Aggiorna immediatamente
    handleUrlChange();

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('storage', handleUrlChange);
    };
  }, []);

  // Helper per aggiungere comune_id alle URL delle API
  const addComuneIdToUrl = useCallback((url: string): string => {
    // Prima controlla URL, poi sessionStorage
    const currentState = getCombinedState();
    
    if (!currentState.isImpersonating || !currentState.comuneId) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}comune_id=${currentState.comuneId}`;
  }, []);

  // Helper per opzioni fetch
  const getFetchOptions = useCallback(() => {
    const currentState = getCombinedState();
    
    if (!currentState.isImpersonating || !currentState.comuneId) {
      return {};
    }
    return {
      headers: {
        'X-Comune-Id': currentState.comuneId
      }
    };
  }, []);

  // Helper per terminare l'impersonificazione
  const endImpersonation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({
      isImpersonating: false,
      comuneId: null,
      comuneNome: null,
      userEmail: null
    });
    // Rimuovi i parametri dall'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    url.searchParams.delete('comune_id');
    url.searchParams.delete('comune_nome');
    url.searchParams.delete('user_email');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return {
    ...state,
    addComuneIdToUrl,
    getFetchOptions,
    endImpersonation
  };
}

// Funzione standalone per uso fuori dai componenti React
export function getImpersonationParams(): ImpersonationState {
  return getCombinedState();
}

// Helper standalone per aggiungere comune_id alle URL
export function addComuneIdToUrl(url: string): string {
  const { isImpersonating, comuneId } = getCombinedState();
  
  if (!isImpersonating || !comuneId) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}comune_id=${comuneId}`;
}

// Helper per terminare l'impersonificazione (standalone)
export function endImpersonation(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  const url = new URL(window.location.href);
  url.searchParams.delete('impersonate');
  url.searchParams.delete('comune_id');
  url.searchParams.delete('comune_nome');
  url.searchParams.delete('user_email');
  window.history.replaceState({}, '', url.toString());
}

export default useImpersonation;
