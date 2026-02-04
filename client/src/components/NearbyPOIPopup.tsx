/**
 * Componente Popup per POI vicini
 * 
 * Mostra un popup quando l'utente è vicino a un POI (museo, fermata, ecc.)
 * e permette di fare check-in per guadagnare TCC
 * 
 * @version 3.77.0
 * @date 4 Febbraio 2026
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Bus, 
  Train, 
  Landmark, 
  Building2, 
  Trophy,
  CheckCircle2,
  Loader2,
  Navigation,
  Coins
} from 'lucide-react';
import type { NearbyPOI, CheckinResponse } from '@/hooks/useNearbyPOIs';

// Icone per tipo POI
const POI_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Cultura
  museo: Landmark,
  museum: Landmark,
  teatro: Building2,
  theatre: Building2,
  monumento: Landmark,
  monument: Landmark,
  memoriale: Landmark,
  memorial: Landmark,
  sito_archeologico: Landmark,
  archaeological_site: Landmark,
  edificio_storico: Building2,
  historic: Building2,
  // Mobilità
  bus: Bus,
  tram: Bus,
  train: Train,
  metro: Train,
  subway: Train,
};

// Colori per tipo
const POI_COLORS: Record<string, string> = {
  culture: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  mobility: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// Labels italiani per tipo
const POI_TYPE_LABELS: Record<string, string> = {
  museo: 'Museo',
  museum: 'Museo',
  teatro: 'Teatro',
  theatre: 'Teatro',
  monumento: 'Monumento',
  monument: 'Monumento',
  memoriale: 'Memoriale',
  memorial: 'Memoriale',
  sito_archeologico: 'Sito Archeologico',
  archaeological_site: 'Sito Archeologico',
  edificio_storico: 'Edificio Storico',
  historic: 'Edificio Storico',
  bus: 'Fermata Bus',
  tram: 'Fermata Tram',
  train: 'Stazione Treno',
  metro: 'Stazione Metro',
  subway: 'Stazione Metro',
};

interface NearbyPOIPopupProps {
  poi: NearbyPOI | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckin: (poi: NearbyPOI) => Promise<CheckinResponse>;
  isLoading?: boolean;
}

/**
 * Popup singolo POI
 */
export function NearbyPOIPopup({
  poi,
  isOpen,
  onClose,
  onCheckin,
  isLoading = false,
}: NearbyPOIPopupProps) {
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkinMessage, setCheckinMessage] = useState<string>('');

  if (!poi) return null;

  const Icon = POI_ICONS[poi.poi_type.toLowerCase()] || MapPin;
  const typeLabel = POI_TYPE_LABELS[poi.poi_type.toLowerCase()] || poi.poi_type;
  const colorClass = POI_COLORS[poi.type] || POI_COLORS.culture;

  const handleCheckin = async () => {
    setCheckinStatus('loading');
    try {
      const result = await onCheckin(poi);
      if (result.success) {
        setCheckinStatus('success');
        setCheckinMessage(result.message || `Hai guadagnato ${result.credits_earned || poi.tcc_reward} TCC!`);
        // Chiudi dopo 2 secondi
        setTimeout(() => {
          onClose();
          setCheckinStatus('idle');
          setCheckinMessage('');
        }, 2000);
      } else {
        setCheckinStatus('error');
        setCheckinMessage(result.error || 'Errore durante il check-in');
      }
    } catch (err) {
      setCheckinStatus('error');
      setCheckinMessage('Errore di connessione');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl ${colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="outline" className={colorClass}>
                {typeLabel}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl text-white">{poi.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            <div className="flex items-center gap-2 mt-2">
              <Navigation className="h-4 w-4" />
              <span>A {poi.distance_m} metri da te</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Reward TCC */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <span className="text-slate-300">Reward disponibile</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-emerald-400">{poi.tcc_reward}</span>
              <span className="text-emerald-400 text-sm">TCC</span>
            </div>
          </div>
        </div>

        {/* Status message */}
        {checkinStatus === 'success' && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-emerald-400 font-medium">{checkinMessage}</span>
          </div>
        )}

        {checkinStatus === 'error' && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <span className="text-red-400">{checkinMessage}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Chiudi
          </Button>
          {!poi.already_visited_today && checkinStatus !== 'success' && (
            <Button
              onClick={handleCheckin}
              disabled={checkinStatus === 'loading' || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {checkinStatus === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Check-in...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Fai Check-in
                </>
              )}
            </Button>
          )}
          {poi.already_visited_today && (
            <Badge className="bg-slate-700 text-slate-400">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Già visitato oggi
            </Badge>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Lista POI vicini (per mostrare più POI)
 */
interface NearbyPOIListProps {
  pois: NearbyPOI[];
  onSelectPOI: (poi: NearbyPOI) => void;
  isLoading?: boolean;
}

export function NearbyPOIList({ pois, onSelectPOI, isLoading }: NearbyPOIListProps) {
  if (pois.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nessun POI nelle vicinanze</p>
        <p className="text-sm mt-1">Avvicinati a un museo, monumento o fermata</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pois.map((poi) => {
        const Icon = POI_ICONS[poi.poi_type.toLowerCase()] || MapPin;
        const typeLabel = POI_TYPE_LABELS[poi.poi_type.toLowerCase()] || poi.poi_type;
        const colorClass = POI_COLORS[poi.type] || POI_COLORS.culture;

        return (
          <button
            key={`${poi.type}-${poi.id}`}
            onClick={() => onSelectPOI(poi)}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl border transition-all text-left
              ${poi.already_visited_today 
                ? 'bg-slate-800/50 border-slate-700 opacity-60' 
                : 'bg-slate-800 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{poi.name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Badge variant="outline" className={`${colorClass} text-xs`}>
                      {typeLabel}
                    </Badge>
                    <span>• {poi.distance_m}m</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {poi.already_visited_today ? (
                  <Badge className="bg-slate-700 text-slate-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Visitato
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Coins className="h-4 w-4" />
                    <span className="font-bold">{poi.tcc_reward}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Banner notifica POI vicino (per mostrare in alto nella pagina)
 */
interface NearbyPOIBannerProps {
  poi: NearbyPOI;
  onTap: () => void;
}

export function NearbyPOIBanner({ poi, onTap }: NearbyPOIBannerProps) {
  const Icon = POI_ICONS[poi.poi_type.toLowerCase()] || MapPin;
  const colorClass = poi.type === 'culture' ? 'from-purple-600' : 'from-blue-600';

  return (
    <button
      onClick={onTap}
      className={`w-full p-4 rounded-xl bg-gradient-to-r ${colorClass} to-slate-800 
        border border-white/10 shadow-lg animate-pulse-slow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium">Sei vicino a {poi.name}!</p>
            <p className="text-white/70 text-sm">Tocca per guadagnare {poi.tcc_reward} TCC</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-500 px-3 py-1 rounded-full">
          <Coins className="h-4 w-4 text-white" />
          <span className="text-white font-bold">{poi.tcc_reward}</span>
        </div>
      </div>
    </button>
  );
}

export default NearbyPOIPopup;
