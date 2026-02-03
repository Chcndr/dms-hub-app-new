/**
 * GamingRewardsPanel - Pannello Gaming & Rewards per Dashboard PA
 * Versione: 1.0.0
 * Data: 03 Febbraio 2026
 * 
 * Sistema unificato di gamification e incentivi per l'ecosistema MioHub.
 * Include: Regolatori TCC, Heatmap Commerciale, Statistiche, Classifiche.
 */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, Settings, Save, RefreshCw, Loader2, 
  Radio, Bus, Landmark, ShoppingCart, Gift, Trophy,
  TrendingUp, Users, Leaf, Coins, MapPin, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useImpersonation } from '@/hooks/useImpersonation';
import { trpc } from '@/lib/trpc';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mio-hub.me';

// Coordinate centri comuni
const COMUNI_COORDS: Record<number, { lat: number; lng: number; nome: string }> = {
  1: { lat: 42.7635, lng: 11.1126, nome: 'Grosseto' },
  6: { lat: 44.4949, lng: 11.3426, nome: 'Bologna' },
  7: { lat: 44.4898, lng: 11.0123, nome: 'Vignola' },
  8: { lat: 44.6471, lng: 10.9252, nome: 'Modena' },
  9: { lat: 44.7842, lng: 10.8847, nome: 'Carpi' },
};

const DEFAULT_CENTER = { lat: 42.5, lng: 12.5 };
const DEFAULT_ZOOM = 6;

// Interfacce
interface GamingConfig {
  comune_id: number;
  // Segnalazioni Civiche
  civic_enabled: boolean;
  civic_tcc_default: number;
  civic_tcc_urgent: number;
  civic_tcc_photo_bonus: number;
  // Mobilità Sostenibile
  mobility_enabled: boolean;
  mobility_tcc_bus: number;
  mobility_tcc_bike_km: number;
  mobility_tcc_walk_km: number;
  // Cultura & Turismo
  culture_enabled: boolean;
  culture_tcc_museum: number;
  culture_tcc_monument: number;
  culture_tcc_route: number;
  // Acquisti Locali
  shopping_enabled: boolean;
  shopping_cashback_percent: number;
  shopping_km0_bonus: number;
  shopping_market_bonus: number;
}

interface HeatmapPoint {
  id: number;
  lat: number;
  lng: number;
  name: string;
  type: 'shop' | 'hub' | 'market';
  tcc_earned: number;
  tcc_spent: number;
  transactions: number;
}

interface GamingStats {
  total_tcc_issued: number;
  total_tcc_spent: number;
  active_users: number;
  co2_saved_kg: number;
  top_shops: Array<{ name: string; tcc: number }>;
}

// Default config
const DEFAULT_CONFIG: GamingConfig = {
  comune_id: 1,
  civic_enabled: true,
  civic_tcc_default: 10,
  civic_tcc_urgent: 5,
  civic_tcc_photo_bonus: 5,
  mobility_enabled: false,
  mobility_tcc_bus: 10,
  mobility_tcc_bike_km: 3,
  mobility_tcc_walk_km: 5,
  culture_enabled: false,
  culture_tcc_museum: 100,
  culture_tcc_monument: 50,
  culture_tcc_route: 300,
  shopping_enabled: true,
  shopping_cashback_percent: 1,
  shopping_km0_bonus: 20,
  shopping_market_bonus: 10,
};

// Componente per centrare la mappa
function MapCenterUpdater({ points, comuneId }: { points: HeatmapPoint[]; comuneId: number | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    if (points.length > 0) {
      const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
      const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
      map.flyTo([avgLat, avgLng], 14, { duration: 1.5 });
      return;
    }
    
    if (comuneId && COMUNI_COORDS[comuneId]) {
      const coords = COMUNI_COORDS[comuneId];
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 });
      return;
    }
    
    map.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM, { duration: 1 });
  }, [map, points, comuneId]);
  
  return null;
}

// Componente Heatmap Layer
function HeatmapLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    
    const heatData: [number, number, number][] = points.map(p => {
      const intensity = Math.min((p.tcc_earned + p.tcc_spent) / 5000, 1.0);
      return [p.lat, p.lng, intensity];
    });
    
    if (heatData.length === 0) return;
    
    const heatLayer = (L as any).heatLayer(heatData, {
      radius: 50,
      blur: 35,
      maxZoom: 18,
      max: 1.0,
      gradient: {
        0.0: '#22c55e',  // Verde
        0.25: '#84cc16', // Lime
        0.5: '#eab308',  // Giallo
        0.75: '#f97316', // Arancione
        1.0: '#8b5cf6'   // Viola (hotspot)
      }
    }).addTo(map);
    
    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);
  
  return null;
}

// Icone marker per tipo
const getMarkerIcon = (type: string, intensity: number) => {
  const emoji: Record<string, string> = {
    'shop': '🏪',
    'hub': '🏢',
    'market': '🛒',
  };
  
  const icon = emoji[type] || '📍';
  const bgColor = intensity > 0.7 ? '#8b5cf6' : intensity > 0.4 ? '#f97316' : '#22c55e';
  
  return L.divIcon({
    html: `<div style="
      background: ${bgColor};
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${icon}</div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Componente Card Categoria
function CategoryCard({ 
  title, 
  icon: Icon, 
  color, 
  enabled, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon: any; 
  color: string; 
  enabled: boolean; 
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={`bg-[#1a2332] border-${color}/30 ${!enabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Icon className={`h-5 w-5 text-${color}`} />
            {title}
          </CardTitle>
          <Switch 
            checked={enabled} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-[#8b5cf6]"
          />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Componente Input Parametro
function ParamInput({ 
  label, 
  value, 
  onChange, 
  suffix = 'TCC',
  min = 0,
  max = 1000
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[#e8fbff]/70 text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          className="bg-[#0b1220] border-[#8b5cf6]/30 text-[#e8fbff] h-8 text-sm"
          min={min}
          max={max}
        />
        <span className="text-[#e8fbff]/50 text-xs w-10">{suffix}</span>
      </div>
    </div>
  );
}

// Componente Principale
export default function GamingRewardsPanel() {
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<GamingStats | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(true);
  
  const { selectedComune, comuneId, comuneNome, isImpersonating } = useImpersonation();
  const currentComuneId = comuneId ? parseInt(comuneId) : 1;

  // Carica configurazione da tRPC
  useEffect(() => {
    if (gamingConfigQuery.data) {
      const data = gamingConfigQuery.data;
      setConfig({
        comune_id: currentComuneId,
        civic_enabled: data.civicEnabled ?? true,
        civic_tcc_default: data.civicTccDefault ?? 10,
        civic_tcc_urgent: data.civicTccUrgent ?? 5,
        civic_tcc_photo_bonus: data.civicTccPhotoBonus ?? 5,
        mobility_enabled: data.mobilityEnabled ?? false,
        mobility_tcc_bus: data.mobilityTccBus ?? 10,
        mobility_tcc_bike_km: data.mobilityTccBikeKm ?? 3,
        mobility_tcc_walk_km: data.mobilityTccWalkKm ?? 5,
        culture_enabled: data.cultureEnabled ?? false,
        culture_tcc_museum: data.cultureTccMuseum ?? 100,
        culture_tcc_monument: data.cultureTccMonument ?? 50,
        culture_tcc_route: data.cultureTccRoute ?? 300,
        shopping_enabled: data.shoppingEnabled ?? false,
        shopping_cashback_percent: data.shoppingCashbackPercent ?? 1,
        shopping_km0_bonus: data.shoppingKm0Bonus ?? 20,
        shopping_market_bonus: data.shoppingMarketBonus ?? 10,
      });
    }
  }, [gamingConfigQuery.data, currentComuneId]);

  // Carica statistiche TCC da tRPC
  useEffect(() => {
    if (gamingStatsQuery.data) {
      const data = gamingStatsQuery.data;
      setStats({
        total_tcc_issued: data.totalTccEarned || 0,
        total_tcc_spent: data.totalTccSpent || 0,
        active_users: data.totalEarnTransactions + data.totalSpendTransactions || 0,
        co2_saved_kg: data.co2Saved || 0,
        top_shops: []
      });
    }
  }, [gamingStatsQuery.data]);

  // Query tRPC per hub_locations e hub_shops
  const hubLocationsQuery = trpc.dmsHub.hub.locations.list.useQuery();
  const hubShopsQuery = trpc.dmsHub.hub.shops.list.useQuery({});
  
  // Query tRPC per Gaming & Rewards
  const gamingConfigQuery = trpc.dmsHub.gamingRewards.getConfig.useQuery({ comuneId: currentComuneId });
  const gamingStatsQuery = trpc.dmsHub.gamingRewards.getStats.useQuery({ comuneId: currentComuneId });
  const heatmapPointsQuery = trpc.dmsHub.gamingRewards.getHeatmapPoints.useQuery({ comuneId: currentComuneId });
  const saveConfigMutation = trpc.dmsHub.gamingRewards.saveConfig.useMutation();

  // Carica punti heatmap da tRPC
  useEffect(() => {
    if (heatmapPointsQuery.data) {
      const points: HeatmapPoint[] = heatmapPointsQuery.data.map((p: any) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        name: p.name,
        type: 'shop' as const,
        tcc_earned: p.tccEarned || 0,
        tcc_spent: p.tccSpent || 0,
        transactions: p.transactionCount || 0,
      }));
      setHeatmapPoints(points);
    }
  }, [heatmapPointsQuery.data]);

  // Salva configurazione con tRPC mutation
  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await saveConfigMutation.mutateAsync({
        comuneId: currentComuneId,
        civicEnabled: config.civic_enabled,
        civicTccDefault: config.civic_tcc_default,
        civicTccUrgent: config.civic_tcc_urgent,
        civicTccPhotoBonus: config.civic_tcc_photo_bonus,
        mobilityEnabled: config.mobility_enabled,
        mobilityTccBus: config.mobility_tcc_bus,
        mobilityTccBikeKm: config.mobility_tcc_bike_km,
        mobilityTccWalkKm: config.mobility_tcc_walk_km,
        cultureEnabled: config.culture_enabled,
        cultureTccMuseum: config.culture_tcc_museum,
        cultureTccMonument: config.culture_tcc_monument,
        cultureTccRoute: config.culture_tcc_route,
        shoppingEnabled: config.shopping_enabled,
        shoppingCashbackPercent: config.shopping_cashback_percent,
        shoppingKm0Bonus: config.shopping_km0_bonus,
        shoppingMarketBonus: config.shopping_market_bonus,
      });
      toast.success('Configurazione Gaming & Rewards salvata!');
      // Ricarica i dati
      gamingConfigQuery.refetch();
    } catch (error) {
      console.error('Errore salvataggio config:', error);
      toast.error('Errore nel salvataggio della configurazione');
    } finally {
      setSavingConfig(false);
    }
  };

  // Gestione loading state
  useEffect(() => {
    const isLoading = gamingConfigQuery.isLoading || gamingStatsQuery.isLoading || heatmapPointsQuery.isLoading;
    setLoading(isLoading);
  }, [gamingConfigQuery.isLoading, gamingStatsQuery.isLoading, heatmapPointsQuery.isLoading]);



  // Determina centro iniziale mappa
  const getInitialCenter = (): [number, number] => {
    if (currentComuneId && COMUNI_COORDS[currentComuneId]) {
      return [COMUNI_COORDS[currentComuneId].lat, COMUNI_COORDS[currentComuneId].lng];
    }
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-[#8b5cf6]" />
            Gaming & Rewards
            {comuneNome && <Badge variant="outline" className="ml-2 text-[#8b5cf6] border-[#8b5cf6]/50">{comuneNome}</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { gamingConfigQuery.refetch(); gamingStatsQuery.refetch(); heatmapPointsQuery.refetch(); }}
              className="border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Aggiorna
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setConfigExpanded(!configExpanded)}
              className="border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
            >
              <Settings className="h-4 w-4 mr-1" />
              Configura
              {configExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Pannello Configurazione (collassabile) */}
      {configExpanded && (
        <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-[#8b5cf6]" />
              Configurazione Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Segnalazioni Civiche */}
              <CategoryCard
                title="Segnalazioni Civiche"
                icon={Radio}
                color="[#06b6d4]"
                enabled={config.civic_enabled}
                onToggle={(v) => setConfig({ ...config, civic_enabled: v })}
              >
                <div className="space-y-3">
                  <ParamInput 
                    label="TCC Default (risolta)" 
                    value={config.civic_tcc_default} 
                    onChange={(v) => setConfig({ ...config, civic_tcc_default: v })}
                  />
                  <ParamInput 
                    label="TCC Urgenti" 
                    value={config.civic_tcc_urgent} 
                    onChange={(v) => setConfig({ ...config, civic_tcc_urgent: v })}
                  />
                  <ParamInput 
                    label="Bonus Foto" 
                    value={config.civic_tcc_photo_bonus} 
                    onChange={(v) => setConfig({ ...config, civic_tcc_photo_bonus: v })}
                  />
                </div>
              </CategoryCard>

              {/* Mobilità Sostenibile */}
              <CategoryCard
                title="Mobilità Sostenibile"
                icon={Bus}
                color="[#10b981]"
                enabled={config.mobility_enabled}
                onToggle={(v) => setConfig({ ...config, mobility_enabled: v })}
              >
                <div className="space-y-3">
                  <ParamInput 
                    label="TCC per corsa Bus/Tram" 
                    value={config.mobility_tcc_bus} 
                    onChange={(v) => setConfig({ ...config, mobility_tcc_bus: v })}
                  />
                  <ParamInput 
                    label="TCC per km Bici" 
                    value={config.mobility_tcc_bike_km} 
                    onChange={(v) => setConfig({ ...config, mobility_tcc_bike_km: v })}
                  />
                  <ParamInput 
                    label="TCC per km a Piedi" 
                    value={config.mobility_tcc_walk_km} 
                    onChange={(v) => setConfig({ ...config, mobility_tcc_walk_km: v })}
                  />
                </div>
              </CategoryCard>

              {/* Cultura & Turismo */}
              <CategoryCard
                title="Cultura & Turismo"
                icon={Landmark}
                color="[#f59e0b]"
                enabled={config.culture_enabled}
                onToggle={(v) => setConfig({ ...config, culture_enabled: v })}
              >
                <div className="space-y-3">
                  <ParamInput 
                    label="TCC per Museo" 
                    value={config.culture_tcc_museum} 
                    onChange={(v) => setConfig({ ...config, culture_tcc_museum: v })}
                  />
                  <ParamInput 
                    label="TCC per Monumento" 
                    value={config.culture_tcc_monument} 
                    onChange={(v) => setConfig({ ...config, culture_tcc_monument: v })}
                  />
                  <ParamInput 
                    label="TCC Percorso Completo" 
                    value={config.culture_tcc_route} 
                    onChange={(v) => setConfig({ ...config, culture_tcc_route: v })}
                  />
                </div>
              </CategoryCard>

              {/* Acquisti Locali */}
              <CategoryCard
                title="Acquisti Locali"
                icon={ShoppingCart}
                color="[#ec4899]"
                enabled={config.shopping_enabled}
                onToggle={(v) => setConfig({ ...config, shopping_enabled: v })}
              >
                <div className="space-y-3">
                  <ParamInput 
                    label="Cashback" 
                    value={config.shopping_cashback_percent} 
                    onChange={(v) => setConfig({ ...config, shopping_cashback_percent: v })}
                    suffix="%"
                    max={10}
                  />
                  <ParamInput 
                    label="Bonus Km0" 
                    value={config.shopping_km0_bonus} 
                    onChange={(v) => setConfig({ ...config, shopping_km0_bonus: v })}
                    suffix="%"
                    max={100}
                  />
                  <ParamInput 
                    label="Bonus Mercato" 
                    value={config.shopping_market_bonus} 
                    onChange={(v) => setConfig({ ...config, shopping_market_bonus: v })}
                    suffix="%"
                    max={100}
                  />
                </div>
              </CategoryCard>
            </div>

            {/* Pulsante Salva */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={saveConfig}
                disabled={savingConfig}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/80 text-white"
              >
                {savingConfig ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salva Configurazione
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#10b981]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-[#10b981]" />
              <span className="text-[#e8fbff]/70 text-sm">TCC Emessi</span>
            </div>
            <div className="text-2xl font-bold text-[#10b981]">
              {(stats?.total_tcc_issued || 0).toLocaleString('it-IT')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a2332] border-[#f59e0b]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[#f59e0b]" />
              <span className="text-[#e8fbff]/70 text-sm">TCC Spesi</span>
            </div>
            <div className="text-2xl font-bold text-[#f59e0b]">
              {(stats?.total_tcc_spent || 0).toLocaleString('it-IT')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-[#8b5cf6]" />
              <span className="text-[#e8fbff]/70 text-sm">Utenti Attivi</span>
            </div>
            <div className="text-2xl font-bold text-[#8b5cf6]">
              {(stats?.active_users || 0).toLocaleString('it-IT')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a2332] border-[#14b8a6]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-5 w-5 text-[#14b8a6]" />
              <span className="text-[#e8fbff]/70 text-sm">CO₂ Risparmiata</span>
            </div>
            <div className="text-2xl font-bold text-[#14b8a6]">
              {((stats?.co2_saved_kg || 0) / 1000).toFixed(1)}t
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Commerciale */}
      <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#8b5cf6]" />
            Heatmap Ecosistema
            {comuneNome && <span className="text-[#8b5cf6] text-sm ml-2">({comuneNome})</span>}
            {heatmapPoints.length > 0 && (
              <span className="text-xs text-emerald-400 ml-auto">● {heatmapPoints.length} punti attivi</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <MapContainer
              center={getInitialCenter()}
              zoom={currentComuneId ? 14 : DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              dragging={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapCenterUpdater points={heatmapPoints} comuneId={currentComuneId} />
              <HeatmapLayer points={heatmapPoints} />
              
              {heatmapPoints.map((point) => {
                const intensity = Math.min((point.tcc_earned + point.tcc_spent) / 5000, 1.0);
                return (
                  <Marker
                    key={point.id}
                    position={[point.lat, point.lng]}
                    icon={getMarkerIcon(point.type, intensity)}
                  >
                    <Popup>
                      <div className="text-sm min-w-[200px]">
                        <strong className="text-base">{point.name}</strong>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">TCC Guadagnati:</span>
                            <span className="font-semibold text-green-600">{point.tcc_earned.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">TCC Spesi:</span>
                            <span className="font-semibold text-orange-600">{point.tcc_spent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transazioni:</span>
                            <span className="font-semibold">{point.transactions}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#22c55e]"></div>
              <span className="text-[#e8fbff]/70">Bassa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#eab308]"></div>
              <span className="text-[#e8fbff]/70">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#f97316]"></div>
              <span className="text-[#e8fbff]/70">Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#8b5cf6]"></div>
              <span className="text-[#e8fbff]/70">Hotspot</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Negozi */}
      {heatmapPoints.length > 0 && (
        <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#f59e0b]" />
              Top Negozi per TCC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {heatmapPoints
                .sort((a, b) => (b.tcc_earned + b.tcc_spent) - (a.tcc_earned + a.tcc_spent))
                .slice(0, 5)
                .map((point, index) => (
                  <div key={point.id} className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-[#f59e0b]' : 
                        index === 1 ? 'text-[#94a3b8]' : 
                        index === 2 ? 'text-[#cd7f32]' : 'text-[#e8fbff]/50'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-[#e8fbff]">{point.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[#8b5cf6] font-bold">
                        {(point.tcc_earned + point.tcc_spent).toLocaleString()} TCC
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        {point.transactions} transazioni
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
