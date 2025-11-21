import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface ZoomFontUpdaterProps {
  minZoom?: number;
  baseFontSize?: number;
  scaleFactor?: number;
}

export function ZoomFontUpdater({ 
  minZoom = 16, 
  baseFontSize = 8,
  scaleFactor = 1.3 
}: ZoomFontUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    const updateFontSize = () => {
      const zoom = map.getZoom();
      
      // Calcola font size in base allo zoom
      // Formula: baseFontSize * scaleFactor^(zoom - minZoom)
      const fontSize = zoom >= minZoom 
        ? baseFontSize * Math.pow(scaleFactor, zoom - minZoom)
        : 0;
      
      // Aggiorna CSS dinamicamente
      const style = document.getElementById('dynamic-tooltip-style');
      if (style) {
        style.innerHTML = `
          .stall-number-tooltip.leaflet-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            color: white !important;
            font-size: ${fontSize}px !important;
            font-weight: bold !important;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
            display: ${zoom < minZoom ? 'none' : 'block'} !important;
          }
          .stall-number-tooltip.leaflet-tooltip-left:before,
          .stall-number-tooltip.leaflet-tooltip-right:before {
            display: none !important;
          }
        `;
      }
    };

    // Aggiorna al mount
    updateFontSize();

    // Ascolta eventi zoom
    map.on('zoomend', updateFontSize);
    map.on('zoom', updateFontSize);

    return () => {
      map.off('zoomend', updateFontSize);
      map.off('zoom', updateFontSize);
    };
  }, [map, minZoom, baseFontSize, scaleFactor]);

  return null;
}
