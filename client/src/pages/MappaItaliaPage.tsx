import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MappaItaliaComponent from '@/components/MappaItaliaComponent';

// useState è già importato da React sopra

/**
 * MappaItaliaPage - Pagina Pubblica Mappa Italia
 * Gemello Digitale del Commercio Nazionale
 * 
 * Visualizza interattivamente i mercati digitalizzati in Italia
 * con possibilità di ricerca, zoom su mercati specifici e accesso alle vetrine
 */
export default function MappaItaliaPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState<number | undefined>();

  const handleBack = () => {
    navigate('/');
  };

  const handleSearch = () => {
    // La ricerca verrà gestita dal componente MappaItaliaComponent
    // che già ha la logica di filtro integrata
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col">
      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-[#14b8a6] via-[#06b6d4] to-[#0891b2] py-8 px-4 md:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-8 w-8" />
                Mappa Italia
              </h1>
              <p className="text-white/80 mt-1">Gemello Digitale del Commercio Nazionale</p>
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-white/90 text-sm md:text-base max-w-2xl">
            Scopri i mercati, hub e negozi sostenibili in tutta Italia. Visualizza posteggi, imprese e servizi in tempo reale.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0b1220] px-4 md:px-8 py-6 border-b border-[#14b8a6]/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#14b8a6]/50" />
              <input
                type="text"
                placeholder="Cerca mercato, città, regione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0f1729] border border-[#14b8a6]/30 rounded-lg text-white placeholder-[#e8fbff]/40 focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/50 transition-all"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold px-6 rounded-lg transition-all"
            >
              Cerca
            </Button>
          </div>
          
          {/* Info Text */}
          <p className="text-[#e8fbff]/60 text-xs md:text-sm mt-3">
            💡 Digita il nome di un mercato, una città o una regione per trovare rapidamente quello che cerchi
          </p>
        </div>
      </div>

      {/* Main Content - Mappa */}
      <div className="flex-1 bg-[#0b1220] px-4 md:px-8 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-[#0f1729] border border-[#14b8a6]/20 rounded-2xl overflow-hidden shadow-2xl h-full">
            {/* Mappa Container */}
            <div className="h-full min-h-[600px] md:min-h-[calc(100vh-400px)]">
              <MappaItaliaComponent preselectedMarketId={selectedMarketId} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#0f1729] border-t border-[#14b8a6]/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14b8a6] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[#e8fbff]/70">
                  <span className="font-semibold text-[#14b8a6]">Clicca su un mercato</span> per visualizzare i posteggi disponibili
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14b8a6] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[#e8fbff]/70">
                  <span className="font-semibold text-[#14b8a6]">Clicca su un posteggio</span> per vedere l'impresa
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14b8a6] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[#e8fbff]/70">
                  <span className="font-semibold text-[#14b8a6]">Visualizza la vetrina</span> per scoprire i dettagli
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
