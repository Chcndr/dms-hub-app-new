import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Store, Filter, Search, X } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { MarketMapComponent } from '@/components/MarketMapComponent';
import 'leaflet/dist/leaflet.css';
import { MIHUB_API_BASE_URL } from '@/config/api';

// Fix per icone marker Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE_URL = MIHUB_API_BASE_URL;

export default function MapPage() {
  // Redirect SEMPRE a Dashboard PA tab Mappa GIS (preservando parametri URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.location.href = `/dashboard-pa?tab=mappa&${params.toString()}`;
  }, []);

  const [mapData, setMapData] = useState<any>(null);
  const [stallsData, setStallsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStallNumber, setSelectedStallNumber] = useState<string | null>(null);
  const [routeConfig, setRouteConfig] = useState<any>(null);

  // Leggi parametri URL per routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = params.get('route');
    const userLat = params.get('userLat');
    const userLng = params.get('userLng');
    const destLat = params.get('destLat');
    const destLng = params.get('destLng');
    const mode = params.get('mode') as 'walking' | 'cycling' | 'driving';
    const stallNumber = params.get('stallNumber');
    
    if (route === 'true' && userLat && userLng && destLat && destLng) {
      setRouteConfig({
        enabled: true,
        userLocation: { lat: parseFloat(userLat), lng: parseFloat(userLng) },
        destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
        mode: mode || 'walking'
      });
      
      if (stallNumber) {
        setSelectedStallNumber(stallNumber);
      }
    }
  }, []);
  
  useEffect(() => {
    // Carica dati mappa mercato da API reali
    const loadMapData = async () => {
      try {
        const [mapRes, stallsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/gis/market-map`),
          fetch(`${API_BASE_URL}/api/markets/1/stalls`)
        ]);
        
        const mapJson = await mapRes.json();
        const stallsJson = await stallsRes.json();
        
        if (mapJson.success) {
          setMapData(mapJson.data);
        } else {
          console.warn('[MapPage] Map API returned success=false:', mapJson);
        }
        
        if (stallsJson.success) {
          const mappedStalls = stallsJson.data.map((s: any) => ({
            number: s.number,
            status: s.status,
            type: s.type,
            vendor_name: s.vendor_business_name || undefined,
            impresa_id: s.impresa_id || undefined
          }));
          setStallsData(mappedStalls);
        } else {
          console.warn('[MapPage] Stalls API returned success=false:', stallsJson);
        }
      } catch (error) {
        console.error('[MapPage] Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMapData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento mappa mercato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-3 shadow-md">
        <div className="w-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-lg font-bold">DMS Hub - Mappa Mercato</h1>
          </div>
          <p className="text-xs opacity-90">Mercato Grosseto</p>
        </div>
      </header>

      {/* Mappa */}
      <div className="relative" style={{ height: 'calc(100vh - 110px)' }}>
        {mapData && stallsData.length > 0 ? (
          <MarketMapComponent
            mapData={mapData}
            center={routeConfig?.destination ? [routeConfig.destination.lat, routeConfig.destination.lng] : [42.7669, 11.2588]}
            zoom={routeConfig?.enabled ? 16 : 17}
            height="100%"
            stallsData={stallsData}
            onStallClick={(stallNumber) => {
              setSelectedStallNumber(String(stallNumber));
            }}
            selectedStallNumber={selectedStallNumber ? Number(selectedStallNumber) : undefined}
            routeConfig={routeConfig}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nessun dato disponibile
          </div>
        )}

        {/* Pulsante toggle filtri laterale */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
            size="icon"
            variant="default"
            className="bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          </Button>
        </div>

        {/* Pannello filtri slide-in */}
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-card shadow-2xl z-[1001] transform transition-transform duration-300 ${
            showFilters ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Header pannello */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-semibold text-lg text-foreground">Info Mercato</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowFilters(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Statistiche */}
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-sm text-foreground/70 mb-1">Posteggi Liberi</div>
                <div className="text-2xl font-bold text-green-500">
                  {stallsData.filter(s => s.status === 'free').length}
                </div>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-sm text-foreground/70 mb-1">Posteggi Occupati</div>
                <div className="text-2xl font-bold text-red-500">
                  {stallsData.filter(s => s.status === 'occupied').length}
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="text-sm text-foreground/70 mb-1">Posteggi Riservati</div>
                <div className="text-2xl font-bold text-orange-500">
                  {stallsData.filter(s => s.status === 'reserved').length}
                </div>
              </div>
            </div>

            {/* Ricerca posteggio */}
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Search className="w-4 h-4 inline mr-2" />
                Cerca Posteggio
              </label>
              <input
                type="text"
                placeholder="Es: 42, 105..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                onChange={(e) => {
                  const num = e.target.value.trim();
                  if (num && stallsData.some(s => s.number === num)) {
                    setSelectedStallNumber(num);
                  } else {
                    setSelectedStallNumber(null);
                  }
                }}
              />
            </div>

            {/* Info */}
            <div className="mt-auto bg-primary/10 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-foreground mb-1">Mercato Grosseto</h4>
              <p className="text-xs text-muted-foreground">
                {stallsData.length} posteggi totali
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Dati aggiornati in tempo reale
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
