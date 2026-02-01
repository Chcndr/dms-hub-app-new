import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import LoginModal from '@/components/LoginModal';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Search, MapPin, Store, Building2, Leaf, TrendingUp, BarChart3, LogIn, LogOut,
  Bell, Wallet, Activity, ClipboardList, Menu, Presentation
} from 'lucide-react';
import { geoAPI } from '@/utils/api';

interface SearchResult {
  id: string;
  name: string;
  type: 'mercato' | 'hub' | 'negozio' | 'servizio' | 'impresa' | 'vetrina' | 'merceologia' | 'citta';
  city: string;
  distance?: number;
  isOpen?: boolean;
  lat?: number;
  lng?: number;
  mercato?: string;
  impresa?: string;
  descrizione?: string;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Permessi utente per controllare visibilità tab
  const { canViewTab, canViewQuickAccess, loading: permissionsLoading } = usePermissions();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controlla autenticazione all'avvio
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!(userStr && token));
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Fetch notifiche non lette per l'impresa dell'utente
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const impresaId = user.impresa_id;
        if (!impresaId) return;
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mio-hub.me';
        const response = await fetch(`${API_BASE_URL}/api/notifiche/impresa/${impresaId}?limit=100`);
        if (response.ok) {
          const data = await response.json();
          // v3.73.0: Usa il conteggio non_lette dal backend invece di filtrare
          if (data.success && data.data) {
            setUnreadNotifications(data.data.non_lette || 0);
          }
        }
      } catch (error) {
        console.error('Errore fetch notifiche:', error);
      }
    };
    
    if (isAuthenticated) {
      fetchUnreadNotifications();
      // Aggiorna ogni 60 secondi
      const interval = setInterval(fetchUnreadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Naviga dopo login riuscito
  useEffect(() => {
    if (isAuthenticated && pendingRoute) {
      setLocation(pendingRoute);
      setPendingRoute(null);
    }
  }, [isAuthenticated, pendingRoute]);

  // Gestisce click su tab protetti
  const handleProtectedNavigation = (route: string) => {
    if (isAuthenticated) {
      setLocation(route);
    } else {
      setPendingRoute(route);
      setShowLoginModal(true);
    }
  };

  // Ricerca globale
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowResults(false);
      return;
    }
    
    try {
      const results = await geoAPI.searchGlobal(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Errore ricerca:', error);
      setSearchResults([]);
      setShowResults(true);
    }
  };

  // Click su risultato ricerca
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    // Naviga in base al tipo
    switch (result.type) {
      case 'mercato':
      case 'hub':
        setLocation(`/mappa-italia?focus=${result.id}&lat=${result.lat}&lng=${result.lng}`);
        break;
      case 'negozio':
      case 'vetrina':
        setLocation(`/vetrine?search=${encodeURIComponent(result.name)}`);
        break;
      case 'impresa':
        setLocation(`/vetrine?impresa=${result.id}`);
        break;
      case 'citta':
        setLocation(`/mappa-italia?city=${encodeURIComponent(result.name)}`);
        break;
      default:
        setLocation(`/mappa-italia?search=${encodeURIComponent(result.name)}`);
    }
  };

  // Icona per tipo risultato
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mercato': return <Store className="w-5 h-5" />;
      case 'hub': return <Building2 className="w-5 h-5" />;
      case 'negozio': return <Store className="w-5 h-5" />;
      case 'vetrina': return <Store className="w-5 h-5" />;
      case 'impresa': return <Building2 className="w-5 h-5" />;
      case 'citta': return <MapPin className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  // Label per tipo risultato
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mercato': return 'Mercato';
      case 'hub': return 'Hub';
      case 'negozio': return 'Negozio';
      case 'vetrina': return 'Vetrina';
      case 'impresa': return 'Impresa';
      case 'citta': return 'Città';
      case 'merceologia': return 'Categoria';
      case 'servizio': return 'Servizio';
      default: return type;
    }
  };

  // ============================================
  // VERSIONE MOBILE FULLSCREEN
  // ============================================
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
        {/* Header compatto mobile */}
        <header className="bg-emerald-600 px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-sm">DMS Hub</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  localStorage.removeItem('permissions');
                  setIsAuthenticated(false);
                  window.location.reload();
                }}
                className="text-white/80 text-xs px-2 py-1 rounded bg-red-500/30"
              >
                Esci
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-white text-xs px-2 py-1 rounded bg-white/20"
              >
                Accedi
              </button>
            )}
          </div>
        </header>

        {/* Sfondo Italia centrato e piccolo */}
        <div className="flex-1 flex flex-col items-center justify-start px-2 py-3 overflow-hidden relative">
          {/* Italia piccola centrata */}
          <div 
            className="w-32 h-32 bg-contain bg-center bg-no-repeat opacity-30 absolute top-4 left-1/2 -translate-x-1/2"
            style={{ backgroundImage: 'url(/italia-network.png)' }}
          />
          
          {/* Titolo compatto */}
          <div className="text-center mb-3 relative z-10">
            <h1 className="text-lg font-bold text-white">Rete Mercati</h1>
            <p className="text-emerald-400 text-xs">Made in Italy</p>
          </div>

          {/* Barra ricerca compatta */}
          <div className="w-full mb-3 relative z-10">
            <div className="flex gap-1">
              <Input
                type="text"
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-10 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button 
                size="sm" 
                onClick={handleSearch}
                className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Risultati ricerca mobile */}
            {showResults && (
              <Card className="absolute top-12 left-0 right-0 bg-slate-800 border-slate-700 max-h-48 overflow-y-auto z-50">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-sm">
                    Nessun risultato
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {searchResults.slice(0, 5).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-2 hover:bg-slate-700 text-left flex items-center gap-2"
                      >
                        <span className="text-emerald-400">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{result.name}</p>
                          <p className="text-slate-400 text-xs">{result.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* GRIGLIA PULSANTI - 2 colonne, rettangolari, tutto in una schermata */}
          <div className="w-full grid grid-cols-2 gap-2 relative z-10 flex-1 overflow-hidden">
            {/* Tab Pubblici */}
            <button
              onClick={() => handleProtectedNavigation('/mappa-italia')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Mappa</span>
            </button>
            
            <button
              onClick={() => handleProtectedNavigation('/route')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Route</span>
            </button>
            
            <button
              onClick={() => handleProtectedNavigation('/wallet')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <Leaf className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Wallet</span>
            </button>
            
            <button
              onClick={() => handleProtectedNavigation('/civic')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Segnala</span>
            </button>
            
            <button
              onClick={() => handleProtectedNavigation('/vetrine')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <Store className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Vetrine</span>
            </button>
            
            <button
              onClick={() => setLocation('/presentazione')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
            >
              <Presentation className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-white text-sm font-medium">Info</span>
            </button>

            {/* Tab Impresa - mostrati solo se permessi */}
            {(permissionsLoading || canViewTab('presenze')) && (
              <button
                onClick={() => handleProtectedNavigation('/app/impresa/presenze')}
                className="bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
              >
                <ClipboardList className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-white text-sm font-medium">Presenze</span>
              </button>
            )}
            
            {(permissionsLoading || canViewTab('wallet_impresa')) && (
              <button
                onClick={() => handleProtectedNavigation('/app/impresa/wallet')}
                className="bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
              >
                <Wallet className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-white text-sm font-medium">Wallet Imp.</span>
              </button>
            )}
            
            {(permissionsLoading || canViewQuickAccess('hub_operatore')) && (
              <button
                onClick={() => handleProtectedNavigation('/hub-operatore')}
                className="bg-orange-900/50 hover:bg-orange-800/50 border border-orange-700/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
              >
                <Activity className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-white text-sm font-medium">Hub Op.</span>
              </button>
            )}
            
            {(permissionsLoading || canViewQuickAccess('notifiche')) && (
              <button
                onClick={() => handleProtectedNavigation('/app/impresa/notifiche')}
                className="bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors relative"
              >
                <Bell className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="text-white text-sm font-medium">Notifiche</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
            )}
            
            {(permissionsLoading || canViewTab('anagrafica')) && (
              <button
                onClick={() => handleProtectedNavigation('/app/impresa/anagrafica')}
                className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-white text-sm font-medium">Anagrafica</span>
              </button>
            )}
            
            {(permissionsLoading || canViewTab('dashboard')) && (
              <button
                onClick={() => isAuthenticated ? setLocation('/dashboard-pa') : handleProtectedNavigation('/dashboard-pa')}
                className="bg-teal-900/50 hover:bg-teal-800/50 border border-teal-700/50 rounded-lg p-3 flex items-center gap-2 text-left transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-teal-400 shrink-0" />
                <span className="text-white text-sm font-medium">Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer minimo */}
        <footer className="bg-slate-800 px-2 py-1 text-center shrink-0">
          <p className="text-slate-500 text-[10px]">PA Digitale 2026 • Cloud First</p>
        </footer>

        {/* Login Modal */}
        <LoginModal 
          isOpen={showLoginModal}
          redirectRoute={pendingRoute || '/'}
          onClose={() => {
            setShowLoginModal(false);
            setPendingRoute(null);
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (userStr && token) {
              setIsAuthenticated(true);
            }
          }} 
        />
      </div>
    );
  }

  // ============================================
  // VERSIONE DESKTOP/TABLET (invariata)
  // ============================================
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sfondo Italia con rete digitale */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url(/italia-network.png)' }}
      />
      
      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      {/* Contenuto */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-primary/95 backdrop-blur-sm text-primary-foreground p-4 shadow-lg border-b border-primary/20">
          <div className="w-full px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">DMS Hub</h1>
                <p className="text-xs opacity-90">Gemello Digitale del Commercio</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Presentazione - link pubblico senza login (v3.74.0) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/presentazione')}
                className="bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <Presentation className="w-4 h-4 mr-2" />
                Presentazione
              </Button>
              {/* Dashboard PA - spostato nell'header (v3.70.0) */}
              {(permissionsLoading || canViewTab('dashboard')) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isAuthenticated ? setLocation('/dashboard-pa') : handleProtectedNavigation('/dashboard-pa')}
                  className="bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard PA
                </Button>
              )}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    localStorage.removeItem('permissions');
                    setIsAuthenticated(false);
                    window.location.reload();
                  }}
                  className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                  className="bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Accedi
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          {/* Titolo */}
          <div className="text-center space-y-3 w-full px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Rete Mercati <span className="text-primary">Made in Italy</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Scopri mercati, hub e negozi sostenibili in tutta Italia
            </p>
          </div>

          {/* Barra di ricerca */}
          <div className="w-full px-4 space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Cerca mercato, hub, città, azienda, servizio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-14 text-lg bg-card/90 backdrop-blur-sm border-primary/30 focus:border-primary"
              />
              <Button 
                size="lg" 
                onClick={handleSearch}
                className="h-14 px-6"
              >
                <Search className="w-5 h-5 mr-2" />
                Cerca
              </Button>
            </div>

            {/* Risultati ricerca */}
            {showResults && (
              <Card className="bg-card/95 backdrop-blur-sm border-primary/20 max-h-96 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Nessun risultato trovato
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-4 hover:bg-accent/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="mt-1 text-primary">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{result.name}</h3>
                            {result.isOpen && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                Aperto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getTypeLabel(result.type)} • {result.city}
                            {result.mercato && ` • ${result.mercato}`}
                            {result.impresa && ` • ${result.impresa}`}
                            {result.distance && ` • ${result.distance.toFixed(1)} km`}
                          </p>
                          {result.descrizione && (
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                              {result.descrizione}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Tab Pubblici - Riga 1 (v3.70.0) */}
          <div className="flex flex-wrap justify-center gap-4 w-full px-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleProtectedNavigation('/mappa-italia')}
              className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
            >
              <MapPin className="w-6 h-6" />
              <span>Mappa</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleProtectedNavigation('/route')}
              className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
            >
              <TrendingUp className="w-6 h-6" />
              <span>Route</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleProtectedNavigation('/wallet')}
              className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
            >
              <Leaf className="w-6 h-6" />
              <span>Wallet</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleProtectedNavigation('/civic')}
              className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
            >
              <Search className="w-6 h-6" />
              <span>Segnala</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleProtectedNavigation('/vetrine')}
              className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
            >
              <Store className="w-6 h-6" />
              <span>Vetrine</span>
            </Button>
          </div>

          {/* Tab Impresa - Riga 2 (v3.70.0) */}
          <div className="flex flex-wrap justify-center gap-4 w-full px-4">
            {/* Presenze - apre app Heroku */}
            {(permissionsLoading || canViewTab('presenze')) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigation('/app/impresa/presenze')}
                className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
              >
                <ClipboardList className="w-6 h-6" />
                <span>Presenze</span>
              </Button>
            )}
            {/* Wallet Impresa - pagamenti PagoPA */}
            {(permissionsLoading || canViewTab('wallet_impresa')) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigation('/app/impresa/wallet')}
                className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
              >
                <Wallet className="w-6 h-6" />
                <span>Wallet Impresa</span>
              </Button>
            )}
            {/* Hub Operatore - già esistente */}
            {(permissionsLoading || canViewQuickAccess('hub_operatore')) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigation('/hub-operatore')}
                className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
              >
                <Activity className="w-6 h-6" />
                <span>Hub Operatore</span>
              </Button>
            )}
            {/* Notifiche - già esistente */}
            {(permissionsLoading || canViewQuickAccess('notifiche')) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigation('/app/impresa/notifiche')}
                className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30 relative"
              >
                <Bell className="w-6 h-6" />
                <span>Notifiche</span>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Button>
            )}
            {/* Anagrafica - placeholder per sviluppi futuri */}
            {(permissionsLoading || canViewTab('anagrafica')) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigation('/app/impresa/anagrafica')}
                className="h-24 w-36 flex-col gap-2 bg-card/80 backdrop-blur-sm hover:bg-primary/20 border-primary/30"
              >
                <Menu className="w-6 h-6" />
                <span>Anagrafica</span>
              </Button>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-muted-foreground">
          <p>PA Digitale 2026 • Cloud First • Rete Mercati Made in Italy</p>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        redirectRoute={pendingRoute || '/'}
        onClose={() => {
          setShowLoginModal(false);
          setPendingRoute(null);
          // Ricontrolla autenticazione dopo chiusura modal
          const userStr = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          if (userStr && token) {
            setIsAuthenticated(true);
          }
        }} 
      />
    </div>
  );
}
