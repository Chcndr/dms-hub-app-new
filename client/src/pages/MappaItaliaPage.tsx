import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MappaItaliaComponent from '@/components/MappaItaliaComponent';
import { MIHUB_API_BASE_URL } from '@/config/api';

interface Market {
  id: number;
  code: string;
  name: string;
  municipality: string;
  days: string;
  total_stalls: number;
  status: string;
  gis_market_id: string;
  latitude: string;
  longitude: string;
}

const API_BASE_URL = MIHUB_API_BASE_URL;

/**
 * MappaItaliaPage - Pagina Pubblica Mappa Italia
 * Gemello Digitale del Commercio Nazionale
 * 
 * SOLO LETTURA - Visualizza mercati e posteggi
 * Logica Vista Italia/Mercato con animazione zoom
 */
export default function MappaItaliaPage() {
  const [, navigate] = useLocation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Carica mercati
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/markets`);
        const data = await response.json();
        if (data.success) {
          setMarkets(data.data);
          if (data.data.length > 0) {
            setSelectedMarketId(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching markets:', error);
        toast.error('Errore nel caricamento dei mercati');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Filtra mercati per ricerca
  const filteredMarkets = markets.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.municipality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    navigate('/');
  };

  const handleMarketSelect = (marketId: number) => {
    setSelectedMarketId(marketId);
  };

  const selectedMarket = markets.find(m => m.id === selectedMarketId);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header Gradient */}
      <header className="bg-gradient-to-r from-[#14b8a6] via-[#06b6d4] to-[#0891b2] text-white p-3 md:p-4 shadow-lg flex-shrink-0">
        <div className="w-full px-4 md:px-8 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold">Mappa Italia</h1>
            <p className="text-xs text-white/70">Gemello Digitale del Commercio</p>
          </div>
        </div>
      </header>

      {/* Search e Mercati - Compatti */}
      <div className="bg-[#0b1220] border-b border-[#14b8a6]/10 px-4 md:px-8 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto space-y-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#14b8a6]/50" />
            <Input
              type="text"
              placeholder="Cerca mercato, città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-[#0f1729] border border-[#14b8a6]/30"
            />
          </div>

          {/* Mercati - Grid Compatto */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 overflow-x-auto pb-1">
            {filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => handleMarketSelect(market.id)}
                className={`text-left p-2 rounded-lg transition-all duration-300 text-xs flex-shrink-0 ${
                  selectedMarketId === market.id
                    ? 'bg-[#14b8a6]/20 border border-[#14b8a6] shadow-lg'
                    : 'bg-[#0f1729] border border-[#14b8a6]/10 hover:border-[#14b8a6]/30'
                }`}
              >
                <p className="font-semibold text-white truncate">{market.name}</p>
                <p className="text-[#14b8a6] text-xs">{market.municipality}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {market.total_stalls}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mappa Full-Screen */}
      <div className="flex-1 w-full overflow-hidden">
        {selectedMarket ? (
          <MappaItaliaComponent preselectedMarketId={selectedMarket.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0b1220]">
            <p className="text-[#e8fbff]/60">Seleziona un mercato</p>
          </div>
        )}
      </div>
    </div>
  );
}
