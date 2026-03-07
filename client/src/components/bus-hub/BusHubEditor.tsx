/**
 * BUS HUB Editor - Integra gli editor originali via iframe
 * Usa i tool completi hostati su api.mio-hub.me
 * 
 * IMPORTANTE: L'iframe naviga internamente tra bus_hub e slot_editor
 * per preservare IndexedDB su Safari/iPad. Il parent (questo componente)
 * aggiorna solo il tab indicator, NON cambia mai l'iframe src.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Map, X, RotateCw } from "lucide-react";

interface BusHubEditorProps {
  marketName?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

type EditorStep = "bus" | "editor";

export function BusHubEditor({
  marketName = "",
  onClose,
  onSave,
}: BusHubEditorProps) {
  const [currentStep, setCurrentStep] = useState<EditorStep>("bus");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // URL iniziale - l'iframe parte sempre dal bus_hub
  const BUS_HUB_URL = "https://api.mio-hub.me/tools/bus_hub.html";

  // Ascolta messaggi dagli iframe (per comunicazione postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verifica origine
      if (!event.origin.includes("api.mio-hub.me")) return;

      const { type, data, payload } = event.data || {};

      // === BRIDGE: iframe salva dati → li mettiamo nel localStorage Vercel (first-party, Safari-safe) ===
      if (type === 'DMS_BRIDGE_SAVE') {
        try {
          const store = JSON.parse(localStorage.getItem('dms_bridge') || '{}');
          store[payload.key] = payload.value;
          store._ts = Date.now();
          localStorage.setItem('dms_bridge', JSON.stringify(store));
        } catch(e) { console.warn('Bridge save err:', e); }
        return;
      }
      if (type === 'DMS_BRIDGE_SAVE_BLOB') {
        try {
          const blobs = JSON.parse(localStorage.getItem('dms_bridge_blobs') || '{}');
          blobs[payload.key] = payload.value;
          localStorage.setItem('dms_bridge_blobs', JSON.stringify(blobs));
        } catch(e) { console.warn('Bridge blob save err:', e); }
        return;
      }
      if (type === 'DMS_BRIDGE_REQUEST') {
        // iframe chiede i dati salvati → glieli mandiamo
        try {
          const store = JSON.parse(localStorage.getItem('dms_bridge') || '{}');
          const blobs = JSON.parse(localStorage.getItem('dms_bridge_blobs') || '{}');
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              { type: 'DMS_BRIDGE_RESTORE', state: store, blobs: blobs },
              'https://api.mio-hub.me'
            );
          }
        } catch(e) { console.warn('Bridge restore err:', e); }
        return;
      }
      if (type === 'DMS_BRIDGE_CLEAR') {
        localStorage.removeItem('dms_bridge');
        localStorage.removeItem('dms_bridge_blobs');
        return;
      }

      // Aggiorna solo il tab indicator - NON cambiare iframe src!
      // L'iframe naviga internamente con window.location.href
      if (type === "GO_TO_EDITOR" || type === "BUS_PNG_READY") {
        setCurrentStep("editor");
      }

      if (type === "GO_TO_BUS") {
        setCurrentStep("bus");
      }

      if (type === "EDITOR_SAVE") {
        console.log("Dati salvati da Slot Editor:", data);
        if (onSave) {
          onSave(data);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSave]);

  // Navigazione tramite tab buttons - naviga l'iframe internamente
  const navigateToStep = useCallback((step: EditorStep) => {
    if (iframeRef.current?.contentWindow) {
      const url = step === "bus" 
        ? "https://api.mio-hub.me/tools/bus_hub.html"
        : "https://api.mio-hub.me/tools/slot_editor_v3_unified.html";
      iframeRef.current.contentWindow.location.href = url;
    }
    setCurrentStep(step);
  }, []);

  // Refresh dell'iframe senza uscire
  const refreshIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.location.reload();
    }
  }, []);

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

        {/* Step indicator + Refresh */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentStep === "bus" ? "default" : "outline"}
            size="sm"
            onClick={() => navigateToStep("bus")}
            className={
              currentStep === "bus"
                ? "bg-[#14b8a6] text-white"
                : "border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/20"
            }
          >
            <Bus className="h-4 w-4 mr-1" />
            1. PNG Tool
          </Button>
          <span className="text-[#e8fbff]/40">→</span>
          <Button
            variant={currentStep === "editor" ? "default" : "outline"}
            size="sm"
            onClick={() => navigateToStep("editor")}
            className={
              currentStep === "editor"
                ? "bg-[#f59e0b] text-white"
                : "border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20"
            }
          >
            <Map className="h-4 w-4 mr-1" />
            2. Slot Editor
          </Button>
          
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshIframe}
            className="text-[#e8fbff]/50 hover:text-[#e8fbff] hover:bg-[#14b8a6]/20 ml-1"
            title="Ricarica pagina"
          >
            <RotateCw className="h-4 w-4" />
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
      {/* L'iframe src è FISSO a bus_hub.html - la navigazione avviene internamente */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={BUS_HUB_URL}
          className="absolute inset-0 w-full h-full border-0"
          title="BUS HUB Editor"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}

export default BusHubEditor;
