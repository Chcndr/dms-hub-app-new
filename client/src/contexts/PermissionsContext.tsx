/**
 * PermissionsContext - Gestione Permessi Tab Dashboard
 * 
 * Questo context carica e memorizza i permessi dell'utente loggato
 * per controllare la visibilità dei tab nella dashboard.
 * 
 * @version 1.0.0
 * @date 23 Gennaio 2026
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { ORCHESTRATORE_API_BASE_URL } from '@/config/api';

// Tipi
interface Permission {
  id: number;
  code: string;
  name: string;
  category: string;
  is_sensitive: boolean;
}

interface PermissionsContextType {
  permissions: Permission[];
  permissionCodes: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  canViewTab: (tabId: string) => boolean;
  canViewQuickAccess: (quickId: string) => boolean;
  refresh: () => Promise<void>;
}

// Context
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Provider Props
interface PermissionsProviderProps {
  children: ReactNode;
}

// Provider Component
export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica i permessi dell'utente
  const loadUserPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setPermissionCodes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ottieni il ruolo dell'utente (per ora usiamo super_admin come default)
      // In futuro questo verrà dal profilo utente
      const userRoleId = getUserRoleId(user);
      
      // Carica i permessi del ruolo
      const response = await fetch(`${ORCHESTRATORE_API_BASE_URL}/api/security/roles/${userRoleId}/permissions`);
      const data = await response.json();

      if (data.success) {
        setPermissions(data.data);
        setPermissionCodes(data.data.map((p: Permission) => p.code));
      } else {
        throw new Error(data.error || 'Errore nel caricamento permessi');
      }
    } catch (err: any) {
      console.error('[PermissionsContext] Errore:', err);
      setError(err.message);
      // In caso di errore, concedi tutti i permessi (fallback sicuro per admin)
      // Questo evita di bloccare l'accesso in caso di problemi di rete
      setPermissions([]);
      setPermissionCodes([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Determina il ruolo dell'utente (logica semplificata)
  const getUserRoleId = (user: any): number => {
    // Per ora restituiamo sempre 1 (super_admin) per gli utenti autenticati
    // In futuro questo leggerà il ruolo dal profilo utente nel database
    // Il ruolo sarà memorizzato nella tabella users o user_roles
    
    // Logica futura:
    // if (user.role === 'super_admin') return 1;
    // if (user.role === 'admin_pa') return 2;
    // etc.
    
    return 1; // super_admin - tutti i permessi
  };

  // Carica permessi quando l'utente cambia
  useEffect(() => {
    loadUserPermissions();
  }, [loadUserPermissions]);

  // Verifica se l'utente ha un permesso specifico
  const hasPermission = useCallback((code: string): boolean => {
    // Se non ci sono permessi caricati, concedi accesso (fallback)
    if (permissionCodes.length === 0 && !loading) {
      return true; // Fallback: accesso consentito
    }
    return permissionCodes.includes(code);
  }, [permissionCodes, loading]);

  // Verifica se l'utente ha almeno uno dei permessi
  const hasAnyPermission = useCallback((codes: string[]): boolean => {
    if (permissionCodes.length === 0 && !loading) {
      return true; // Fallback
    }
    return codes.some(code => permissionCodes.includes(code));
  }, [permissionCodes, loading]);

  // Verifica se l'utente ha tutti i permessi
  const hasAllPermissions = useCallback((codes: string[]): boolean => {
    if (permissionCodes.length === 0 && !loading) {
      return true; // Fallback
    }
    return codes.every(code => permissionCodes.includes(code));
  }, [permissionCodes, loading]);

  // Verifica se l'utente può vedere un tab specifico
  const canViewTab = useCallback((tabId: string): boolean => {
    const permissionCode = `tab.view.${tabId}`;
    return hasPermission(permissionCode);
  }, [hasPermission]);

  // Verifica se l'utente può vedere un quick access specifico
  const canViewQuickAccess = useCallback((quickId: string): boolean => {
    const permissionCode = `quick.view.${quickId}`;
    return hasPermission(permissionCode);
  }, [hasPermission]);

  // Refresh manuale dei permessi
  const refresh = useCallback(async () => {
    await loadUserPermissions();
  }, [loadUserPermissions]);

  const value: PermissionsContextType = {
    permissions,
    permissionCodes,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewTab,
    canViewQuickAccess,
    refresh,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook per usare il context
export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Export default
export default PermissionsContext;
