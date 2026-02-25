/**
 * BUS HUB Editor - Integra gli editor originali via iframe
 * Usa i tool completi hostati su api.mio-hub.me
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bus, Map, X } from 'lucide-react';

interface BusHubEditorProps {
  marketName?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

type EditorStep = 'bus' | 'editor';

export function BusHubEditor({ marketName = '', onClose, onSave }: BusHubEditorProps) {
  const [currentStep, setCurrentStep] = useState<EditorStep>('bus');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // URL degli editor originali sul server Hetzner
  const BUS_HUB_URL = 'https://api.mio-hub.me/tools/bus_hub.html';
  const SLOT_EDITOR_URL = 'https://api.mio-hub.me/tools/slot_editor_v3_unified.html';

  // Ascolta messaggi dagli iframe (per comunicazione postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verifica origine
      if (!event.origin.includes('api.mio-hub.me')) return;

      const { type, data } = event.data || {};

      if (type === 'BUS_PNG_READY') {
        // PNG trasparente pronto, passa a Slot Editor
        console.log('PNG pronto dal BUS HUB:', data);
        setCurrentStep('editor');
      }

      if (type === 'EDITOR_SAVE') {
        // Dati GeoJSON pronti dall'editor
        console.log('Dati salvati da Slot Editor:', data);
        if (onSave) {
          onSave(data);
        }
      }

      if (type === 'GO_TO_EDITOR') {
        setCurrentStep('editor');
      }

      if (type === 'GO_TO_BUS') {
        setCurrentStep('bus');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSave]);

  const getCurrentUrl = () => {
    return currentStep === 'bus' ? BUS_HUB_URL : SLOT_EDITOR_URL;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b1220] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f2330] border-b border-[#14b8a6]/30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff] hover:bg-[#14b8a6]/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna a GIS
          </Button>
          
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-[#14b8a6]" />
            <span className="text-[#e8fbff] font-semibold">BUS HUB</span>
            {marketName && (
              <span className="text-[#14b8a6] bg-[#14b8a6]/20 px-2 py-0.5 rounded text-sm">
                {marketName}
              </span>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentStep === 'bus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStep('bus')}
            className={currentStep === 'bus' 
              ? 'bg-[#14b8a6] text-white' 
              : 'border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/20'
            }
          >
            <Bus className="h-4 w-4 mr-1" />
            1. PNG Tool
          </Button>
          <span className="text-[#e8fbff]/40">→</span>
          <Button
            variant={currentStep === 'editor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStep('editor')}
            className={currentStep === 'editor' 
              ? 'bg-[#f59e0b] text-white' 
              : 'border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20'
            }
          >
            <Map className="h-4 w-4 mr-1" />
            2. Slot Editor
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[#e8fbff]/70 hover:text-[#e8fbff] hover:bg-red-500/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Iframe container - occupa tutto lo spazio */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={getCurrentUrl()}
          className="absolute inset-0 w-full h-full border-0"
          title={currentStep === 'bus' ? 'BUS HUB - PNG Transparent Tool' : 'Slot Editor v3'}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}

export default BusHubEditor;
