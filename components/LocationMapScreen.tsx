
import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- ICONS ---
// Fix: All icon components now accept className prop
const BackIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const ClipboardIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const NavigationIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SearchIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ExitIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const GpsIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 3h-2.062a7.01 7.01 0 00-5.938-5.938V3h-2v2.062A7.01 7.01 0 005.062 11H3v2h2.062a7.01 7.01 0 005.938 5.938V21h2v-2.062a7.01 7.01 0 005.938-5.938H21v-2zM12 17a5 5 0 110-10 5 5 0 010 10z"/></svg>;

interface LocationMapScreenProps {
  onBack: () => void;
}

const LocationMapScreen: React.FC<LocationMapScreenProps> = ({ onBack }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setError("Veuillez activer le GPS pour un suivi optimal."),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [startTracking]);

  const parseLocationInput = (text: string) => {
    const geoRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = text.match(geoRegex);
    if (match) {
      return `${match[1]},${match[2]}`;
    }
    return text;
  };

  const handlePaste = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = parseLocationInput(text);
        setInputValue(cleaned);
        setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(cleaned)}&t=&z=16&ie=UTF8&iwloc=&output=embed`);
        setIsFollowing(false);
      } else {
        setError("Presse-papier vide.");
      }
    } catch (err) {
      setError("Autorisez l'accès au presse-papier dans les paramètres.");
    }
  };

  const handleSearch = () => {
    if (!inputValue) return;
    setError(null);
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(inputValue)}&t=&z=16&ie=UTF8&iwloc=&output=embed`);
    setIsFollowing(false);
  };

  const handleFollowItinerary = () => {
    if (!inputValue) return;
    setError(null);
    setIsFollowing(true);

    const origin = userPos ? `${userPos.lat},${userPos.lng}` : 'Ma+position';
    const destination = encodeURIComponent(inputValue);
    setMapUrl(`https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&dirflg=d&output=embed`);
  };

  const exitFollowing = () => {
    setIsFollowing(false);
    handleSearch();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white animate-in fade-in duration-500 overflow-hidden relative">
      
      {/* HEADER SECTION (Masqué uniquement en mode navigation active) */}
      {!isFollowing && (
        <header className="p-4 bg-slate-900 flex items-center border-b border-white/5 sticky top-0 z-20 shadow-2xl">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-90 transition-all">
            <BackIcon />
          </button>
          <div className="flex-1 px-4 flex flex-col">
              <h1 className="text-base font-black uppercase tracking-widest text-indigo-400">Localisation</h1>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">FILANT°225 • Système Intégré</p>
          </div>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${userPos ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-red-500'} animate-pulse`}></div>
             <NavigationIcon />
          </div>
        </header>
      )}

      {/* SEARCH & CONTROL ZONE */}
      {!isFollowing && (
        <div className="p-6 bg-slate-900 border-b border-white/5 space-y-4 shadow-inner flex-shrink-0">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">Saisir Destination</label>
                    {userPos && <span className="text-[8px] font-bold text-indigo-400 uppercase">GPS Actif</span>}
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Coordonnées, Lien ou Adresse..."
                          className="w-full bg-black border-2 border-slate-700 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold placeholder-white/5 shadow-inner"
                        />
                        {inputValue && (
                            <button 
                              onClick={() => { setInputValue(''); setMapUrl(''); }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <button 
                      onClick={handlePaste}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl shadow-xl flex flex-col items-center justify-center active:scale-95 transition-all group"
                    >
                      <ClipboardIcon />
                      <span className="font-black uppercase text-[8px] mt-1">Coller</span>
                    </button>
                </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={!inputValue}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-[0.98] shadow-lg"
            >
              <SearchIcon />
              <span className="uppercase text-xs tracking-[0.3em]">Afficher sur la carte</span>
            </button>
            
            {error && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest animate-bounce">⚠️ {error}</p>}
        </div>
      )}

      {/* MAP VIEWPORT */}
      <div className={`flex-1 relative bg-black overflow-hidden ${isFollowing ? 'h-full w-full absolute inset-0 z-[700] animate-in zoom-in-95' : ''}`}>
        {mapUrl ? (
          <iframe
            title="Maps Intégré FILANT"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, filter: isFollowing ? 'none' : 'invert(90%) hue-rotate(180deg) brightness(1.1) contrast(0.9)' }}
            src={mapUrl}
            allowFullScreen
            loading="lazy"
            className="w-full h-full transition-all duration-700"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-slate-950">
             <div className="w-32 h-32 bg-indigo-600/5 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-indigo-500/20">
                 <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center animate-ping">
                    <NavigationIcon />
                 </div>
             </div>
             <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white/40 mb-3">Terminal GPS</h3>
             <p className="text-[10px] text-gray-600 font-bold max-w-[240px] leading-relaxed uppercase tracking-widest">
                 Prêt pour le calcul d'itinéraire. Veuillez coller une position pour commencer.
             </p>
          </div>
        )}

        {/* NAVIGATION OVERLAYS */}
        {isFollowing && (
            <>
                <button 
                    onClick={exitFollowing}
                    className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all z-[800] border border-white/20 shadow-2xl"
                    aria-label="Quitter la navigation"
                >
                    <ExitIcon className="text-white w-5 h-5" />
                </button>

                {/* Bouton de recentrage position (GPS) */}
                <div className="absolute bottom-10 right-6 z-10">
                    <button 
                        onClick={() => {
                            if (userPos) {
                                 setMapUrl(`https://maps.google.com/maps?q=${userPos.lat},${userPos.lng}&t=&z=18&ie=UTF8&iwloc=&output=embed`);
                                 setTimeout(handleFollowItinerary, 1000);
                            }
                        }}
                        className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-2 border-white/10"
                    >
                        <GpsIcon />
                    </button>
                </div>
            </>
        )}
      </div>

      {/* FOOTER ACTION BAR (Hidden in Following mode) */}
      {!isFollowing && (
        <div className="p-6 bg-slate-900 border-t border-white/5 pb-28 shadow-[0_-15px_40px_rgba(0,0,0,0.7)] flex-shrink-0">
          <button 
            disabled={!inputValue}
            onClick={handleFollowItinerary}
            className={`w-full py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 font-black uppercase tracking-[0.25em] text-sm border-b-4 ${
              inputValue 
                  ? 'bg-indigo-600 border-indigo-800 animate-demande-signal' 
                  : 'bg-slate-800 border-slate-950 opacity-30 grayscale'
            }`}
          >
            {inputValue ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  Suivre l'itinéraire
                </>
            ) : (
                <>
                  <NavigationIcon className="opacity-40" />
                  Calculer l'itinéraire
                </>
            )}
          </button>
        </div>
      )}

      <style>{`
        iframe {
            border-radius: 0;
            transition: all 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default LocationMapScreen;
