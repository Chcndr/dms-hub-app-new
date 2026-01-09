/**
 * Login Page
 * Pagina di login con SPID/CIE/CNS via ARPA Regione Toscana
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startLogin, isAuthenticated, getAuthConfig, type AuthConfig } from '@/api/authClient';
import { Loader2, Shield, CreditCard, Key, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [config, setConfig] = useState<AuthConfig | null>(null);

  const returnUrl = searchParams.get('returnUrl') || '/dashboard-pa';

  useEffect(() => {
    // Verifica se già autenticato
    isAuthenticated().then(authenticated => {
      if (authenticated) {
        navigate(returnUrl, { replace: true });
      }
    });

    // Carica configurazione
    getAuthConfig()
      .then(setConfig)
      .catch(err => {
        console.error('Errore caricamento config:', err);
      });
  }, [navigate, returnUrl]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const authUrl = await startLogin(returnUrl);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        {/* Logo e titolo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MIO-HUB</h1>
          <p className="mt-2 text-gray-600">Sistema di Gestione Mercati</p>
        </div>

        {/* Card login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
            Accedi con identità digitale
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Metodi di autenticazione */}
          <div className="space-y-4">
            {/* SPID */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <img 
                    src="https://www.spid.gov.it/wp-content/themes/developer-flavor/assets/images/spid-logo.svg" 
                    alt="SPID" 
                    className="h-6 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="font-medium">Entra con SPID</span>
                </>
              )}
            </button>

            {/* CIE */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Entra con CIE</span>
                </>
              )}
            </button>

            {/* CNS */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span className="font-medium">Entra con CNS</span>
                </>
              )}
            </button>
          </div>

          {/* Info ambiente */}
          {config && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400">
                Ambiente: {config.environment === 'staging' ? 'Test' : 'Produzione'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Autenticazione gestita da
          </p>
          <p className="text-sm font-medium text-gray-700">
            ARPA - Regione Toscana
          </p>
        </div>

        {/* Link info */}
        <div className="mt-4 text-center space-x-4">
          <a 
            href="https://www.spid.gov.it/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Cos'è SPID?
          </a>
          <a 
            href="https://www.cartaidentita.interno.gov.it/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Cos'è CIE?
          </a>
        </div>
      </div>
    </div>
  );
}
