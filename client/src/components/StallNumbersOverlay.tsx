import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface StallFeature {
  type: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: {
    number: string;
    [key: string]: any;
  };
}

interface StallNumbersOverlayProps {
  features: StallFeature[];
  minZoom?: number;
}

export function StallNumbersOverlay({ features, minZoom = 16 }: StallNumbersOverlayProps) {
  const map = useMap();

  useEffect(() => {
    // Crea un SVG overlay personalizzato
    const SvgOverlay = L.Layer.extend({
      onAdd: function (map: L.Map) {
        this._map = map;
        
        // Crea elemento SVG
        const svg = L.SVG.create('svg');
        svg.setAttribute('class', 'stall-numbers-overlay');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '600';
        
        this._container = svg;
        map.getPanes().overlayPane.appendChild(svg);
        
        // Render iniziale
        this._render();
        
        // Re-render su zoom e pan
        map.on('zoom', this._render, this);
        map.on('move', this._render, this);
        map.on('viewreset', this._render, this);
      },
      
      onRemove: function (map: L.Map) {
        map.off('zoom', this._render, this);
        map.off('move', this._render, this);
        map.off('viewreset', this._render, this);
        
        if (this._container && this._container.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
      },
      
      _render: function () {
        if (!this._container || !this._map) return;
        
        const zoom = this._map.getZoom();
        
        // Nascondi numeri sotto la soglia minima di zoom
        if (zoom < minZoom) {
          this._container.innerHTML = '';
          return;
        }
        
        // Pulisci SVG
        this._container.innerHTML = '';
        
        // Calcola dimensione font in base allo zoom
        // Formula: fontSize = base * 2^(zoom - referenceZoom)
        const referenceZoom = 18;
        const baseFontSize = 10;
        const fontSize = baseFontSize * Math.pow(1.4, zoom - referenceZoom);
        
        // Renderizza ogni numero
        features.forEach((feature) => {
          if (feature.geometry.type !== 'Polygon') return;
          
          // Calcola centro del polygon
          const coords = feature.geometry.coordinates[0];
          const lats = coords.map(c => c[1]);
          const lngs = coords.map(c => c[0]);
          const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
          const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
          
          // Converti coordinate geografiche in pixel
          const point = this._map.latLngToLayerPoint([centerLat, centerLng]);
          
          // Crea elemento text SVG
          const text = L.SVG.create('text');
          text.setAttribute('x', point.x.toString());
          text.setAttribute('y', point.y.toString());
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('fill', 'white');
          text.setAttribute('font-size', `${fontSize}px`);
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('font-family', 'Arial, sans-serif');
          text.setAttribute('stroke', 'rgba(0,0,0,0.8)');
          text.setAttribute('stroke-width', '0.5');
          text.setAttribute('paint-order', 'stroke');
          text.textContent = feature.properties.number;
          
          this._container.appendChild(text);
        });
      }
    });
    
    // Crea e aggiungi layer
    const overlay = new SvgOverlay();
    overlay.addTo(map);
    
    // Cleanup
    return () => {
      overlay.remove();
    };
  }, [map, features, minZoom]);
  
  return null;
}
