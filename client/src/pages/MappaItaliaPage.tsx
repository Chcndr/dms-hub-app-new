import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Stall {
  id: number;
  number: string;
  status: string;
  [key: string]: any;
}

const API_BASE_URL = MIHUB_API_BASE_URL;

/**
 * MappaItaliaPage - Pagina Pubblica Mappa Italia
 * Gemello Digitale del Commercio Nazionale
 * 
 * Layout: Header + Barra ricerca/Indicatori + Mappa full-screen
 * Logica Vista Italia/Mercato con animazione zoom
 */
export default function MappaItaliaPage() {
  const [, navigate] = useLocation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallsLoading, setStallsLoading] = useState(false);

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

  // Carica posteggi del mercato selezionato
  useEffect(() => {
    if (!selectedMarketId) return;

    const fetchStalls = async () => {
      setStallsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/markets/${selectedMarketId}/stalls`);
        const data = await response.json();
        if (data.success) {
          setStalls(data.data);
        }
      } catch (error) {
        console.error('Error fetching stalls:', error);
      } finally {
        setStallsLoading(false);
      }
    };

    fetchStalls();
  }, [selectedMarketId]);

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

  // Calcola statistiche posteggi
  const occupiedCount = stalls.filter(s => s.status === 'occupato').length;
  const freeCount = stalls.filter(s => s.status === 'libero').length;
  const reservedCount = stalls.filter(s => s.status === 'riservato').length;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
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

      {/* Barra Ricerca + Scheda + Indicatori */}
      <div className="bg-[#0b1220] border-b border-[#14b8a6]/10 p-3 md:p-4 flex-shrink-0">
        <div className="w-full px-4 md:px-8 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#14b8a6]/50" />
            <Input
              type="text"
              placeholder="Cerca mercato, città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-[#0f1729] border border-[#14b8a6]/30"
            />
          </div>

          {/* Mercati Dropdown */}
          {loading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 text-[#14b8a6] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleMarketSelect(market.id)}
                  className={`text-left p-2 rounded-lg transition-all text-xs ${
                    selectedMarketId === market.id
                      ? 'bg-[#14b8a6]/20 border border-[#14b8a6] shadow-lg'
                      : 'bg-[#0f1729] border border-[#14b8a6]/10 hover:border-[#14b8a6]/30'
                  }`}
                >
                  <p className="font-semibold text-white truncate">{market.name}</p>
                  <p className="text-[#14b8a6] text-xs">{market.municipality}</p>
                </button>
              ))}
            </div>
          )}

          {/* Scheda Mercato + Indicatori + Tasto */}
          {selectedMarket && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              {/* Scheda Mercato */}
              <div className="md:col-span-3 bg-[#0f1729] border border-[#14b8a6]/20 rounded-lg p-2.5">
                <p className="text-xs font-semibold text-white mb-1">{selectedMarket.name}</p>
                <div className="text-xs text-[#e8fbff]/70 space-y-0.5">
                  <p>📍 {selectedMarket.municipality}</p>
                  <p>📦 {selectedMarket.total_stalls} posteggi</p>
                  <p>📅 {selectedMarket.days}</p>
                </div>
              </div>

              {/* Indicatori Posteggi */}
              {stallsLoading ? (
                <div className="md:col-span-6 flex justify-center">
                  <Loader2 className="h-4 w-4 text-[#14b8a6] animate-spin" />
                </div>
              ) : (
                <div className="md:col-span-6 grid grid-cols-3 gap-2">
                  <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 p-2 rounded-lg text-center">
                    <div className="text-xs text-[#ef4444] font-semibold">Occupati</div>
                    <div className="text-lg font-bold text-[#ef4444]">{occupiedCount}</div>
                  </div>
                  <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2 rounded-lg text-center">
                    <div className="text-xs text-[#10b981] font-semibold">Liberi</div>
                    <div className="text-lg font-bold text-[#10b981]">{freeCount}</div>
                  </div>
                  <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 p-2 rounded-lg text-center">
                    <div className="text-xs text-[#f59e0b] font-semibold">Riservati</div>
                    <div className="text-lg font-bold text-[#f59e0b]">{reservedCount}</div>
                  </div>
                </div>
              )}

              {/* Tasto Vista Mercato */}
              <Button
                className="md:col-span-3 text-xs h-10 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] hover:from-[#14b8a6]/80 hover:to-[#06b6d4]/80 text-white"
              >
                📍 Vista Mercato
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mappa Full-Screen */}
      <div className="flex-1 overflow-hidden">
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
