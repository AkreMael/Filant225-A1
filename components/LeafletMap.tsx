import React, { useEffect, useRef, useState } from 'react';
import { Layers, Loader2, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface LeafletMapProps {
  userLat: number;
  userLng: number;
  userName?: string;
  providerLat: number | null;
  providerLng: number | null;
  providerName?: string;
  providerCity?: string;
  isSearching?: boolean;
}

// Global script/css loading utility to ensure single dynamic import of Leaflet
const loadLeafletAssets = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    const existingScript = document.getElementById('leaflet-cdn-script');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkInterval);
          resolve((window as any).L);
        }
      }, 50);
      return;
    }

    // Stylesheet Injection
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.id = 'leaflet-cdn-css';
    document.head.appendChild(link);

    // Javascript Injection
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.id = 'leaflet-cdn-script';
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.body.appendChild(script);
  });
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  userLat,
  userLng,
  userName = 'Ma Position',
  providerLat,
  providerLng,
  providerName = 'Prestataire',
  providerCity,
  isSearching = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const leafletL = useRef<any>(null);
  const activeTileLayer = useRef<any>(null);

  const userMarkerRef = useRef<any>(null);
  const providerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'plan' | 'satellite'>('plan');

  // Load Leaflet libraries dynamically
  useEffect(() => {
    loadLeafletAssets()
      .then((L) => {
        leafletL.current = L;
        
        if (!mapContainerRef.current) return;

        // Initialize map instance only once
        if (!mapInstance.current) {
          mapInstance.current = L.map(mapContainerRef.current, {
            center: [userLat, userLng],
            zoom: 10,
            zoomControl: false, // Turn off default zoom buttons so we can render beautiful custom ones
            attributionControl: false // Minimalist clean map design
          });

          // Custom attribution control located at corner
          L.control.attribution({ prefix: false }).addTo(mapInstance.current);
        }

        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('[LeafletMap] Failed to load Leaflet resources:', err);
        setLoadError('Impossible de charger les ressources cartographiques.');
      });

    return () => {
      // Cleanup map instance on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Update layout tile layer when plan or satellite is toggled
  useEffect(() => {
    if (!mapInstance.current || !leafletL.current) return;
    const L = leafletL.current;
    const map = mapInstance.current;

    if (activeTileLayer.current) {
      activeTileLayer.current.remove();
    }

    let tileUrl = '';
    let attributionText = '';

    if (mapMode === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}';
      attributionText = 'Imagery &copy; Esri, USDA, USGS';
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attributionText = '&copy; OpenStreetMap contributors';
    }

    activeTileLayer.current = L.tileLayer(tileUrl, {
      attribution: attributionText,
      maxZoom: 19
    }).addTo(map);

  }, [mapMode, mapLoaded]);

  // Handle markers & routes lifecycle
  useEffect(() => {
    if (!mapInstance.current || !leafletL.current || !mapLoaded) return;
    const L = leafletL.current;
    const map = mapInstance.current;

    // Clear previous items from map
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (providerMarkerRef.current) providerMarkerRef.current.remove();
    if (polylineRef.current) polylineRef.current.remove();

    const userLatLng = [userLat, userLng] as [number, number];

    // 1. Generate premium HTML for User Position marker (Blue pulse)
    const userHtml = `
      <div class="flex items-center justify-center relative w-8 h-8">
        <span class="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-65 animate-ping"></span>
        <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-xl"></span>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'custom-user-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    userMarkerRef.current = L.marker(userLatLng, { icon: userIcon })
      .addTo(map)
      .bindPopup(`<div class="p-1 text-xs font-sans text-gray-700"><strong>${userName}</strong><br/>Position de départ</div>`);

    // 2. Manage Provider Marker if GPS target is selected
    if (providerLat && providerLng) {
      const providerLatLng = [providerLat, providerLng] as [number, number];

      const providerHtml = `
        <div class="flex flex-col items-center justify-center relative w-12 h-12 -translate-y-2">
          <div class="px-1.5 py-0.5 rounded bg-orange-600 border border-orange-500 text-[9px] text-white font-sans font-black uppercase whitespace-nowrap shadow-md mb-1 animate-pulse">
            ${providerCity || 'Prestataire'}
          </div>
          <div class="relative flex items-center justify-center w-8 h-8 bg-white border border-orange-500 rounded-full shadow-lg">
            <svg class="w-5 h-5 text-orange-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      `;

      const providerIcon = L.divIcon({
        html: providerHtml,
        className: 'custom-provider-marker-icon',
        iconSize: [48, 48],
        iconAnchor: [24, 44]
      });

      providerMarkerRef.current = L.marker(providerLatLng, { icon: providerIcon })
        .addTo(map)
        .bindPopup(`<div class="p-1 text-xs font-sans text-gray-700"><strong>${providerName}</strong><br/>${providerCity || 'Côte d’Ivoire'}</div>`);

      // 3. Create dashed GPS trajectory route
      polylineRef.current = L.polyline([userLatLng, providerLatLng], {
        color: '#f97316',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        interactive: false
      }).addTo(map);

      // Auto-fit bounds
      const bounds = L.latLngBounds([userLatLng, providerLatLng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      // If no provider selected, center view closely on user location
      map.setView(userLatLng, 11);
    }
  }, [userLat, userLng, providerLat, providerLng, mapLoaded, providerName, providerCity]);

  // Custom Zoom Handlers
  const handleZoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  const handleCenterRefocus = () => {
    if (!mapInstance.current || !leafletL.current) return;
    const L = leafletL.current;
    
    const points = [[userLat, userLng]] as [number, number][];
    if (providerLat && providerLng) {
      points.push([providerLat, providerLng]);
      const bounds = L.latLngBounds(points);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      mapInstance.current.setView([userLat, userLng], 12);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      
      {/* Loading & Errors HUD overlays */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-xs text-slate-300 font-sans tracking-widest uppercase font-black">Initialisation de la carte...</span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-30 bg-rose-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <p className="text-sm font-black text-white uppercase tracking-wider">{loadError}</p>
          <p className="text-xs text-rose-200">Veuillez vérifier votre connexion internet.</p>
        </div>
      )}

      {/* Dynamic Active Indicator Overlay */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.8 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-sans">
              {isSearching 
                ? 'Calcul d’itinéraire en cours...' 
                : providerCity 
                  ? `Itinéraire actif : ${providerCity}` 
                  : 'Réseau National Côte d’Ivoire'}
            </span>
          </div>
        </div>
      )}

      {/* Map Mode Buttons/Controls (Satellite / Plan Toggle) */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/10 p-1 shadow-lg gap-1">
          <button
            onClick={() => setMapMode('plan')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              mapMode === 'plan' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Plan</span>
          </button>
          
          <button
            onClick={() => setMapMode('satellite')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              mapMode === 'satellite' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
        </div>
      )}

      {/* Custom Navigation HUD controls at bottom right */}
      {mapLoaded && (
        <div className="absolute bottom-18 right-4 z-20 pointer-events-auto flex flex-col gap-2">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
            title="S'approcher"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
            title="S'éloigner"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Center Refocus */}
          <button
            onClick={handleCenterRefocus}
            className="w-10 h-10 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
            title="Recadrer la carte"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Map Content Container */}
      <div 
        ref={mapContainerRef} 
        id="leaflet-map-element" 
        className="w-full h-full z-10 raw-map-leaflet" 
      />

    </div>
  );
};
