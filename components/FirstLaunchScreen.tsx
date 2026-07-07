
import React, { useState } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
}

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRegister = () => {
    // Lead directly to login/app as before
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6 shadow-xl"></div>
        <h2 className="text-2xl font-black uppercase tracking-tighter animate-pulse text-orange-500">FILANT°225</h2>
        <p className="text-xs text-white/50 mt-2 font-bold uppercase tracking-widest">Initialisation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FFA200] via-[#FF7E00] to-[#FF4500] text-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-8">
        
        {/* Welcome Section */}
        <div className="mb-1 transition-all duration-700 animate-in fade-in slide-in-from-top-10 ease-out">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-0 opacity-90">Bienvenue chez</h2>
          <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tighter leading-none mt-1">
            FILANT°225
          </h1>
        </div>

        {/* Description Section */}
        <div className="mt-6 space-y-4 max-w-sm transition-all duration-1000 delay-300 animate-in fade-in slide-in-from-bottom-10 ease-out">
          <p className="text-base sm:text-lg font-black leading-tight px-4 text-white">
            Trouvez facilement ce dont vous avez besoin.
          </p>
          
          <div className="bg-black/10 backdrop-blur-sm rounded-3xl p-5 py-3.5 space-y-1.5 border border-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-black/60">
              🔎 Recherchez rapidement :
            </p>
            <ul className="text-sm sm:text-base font-bold space-y-1">
              <li>• Des travailleurs (tous types de métiers)</li>
              <li>• Des équipements</li>
              <li>• Des appartements</li>
            </ul>
          </div>

          <p className="text-xs sm:text-sm font-bold leading-tight px-4 opacity-90">
            🤝 FILANT°225 vous met en relation directe avec les bonnes personnes.
          </p>
          
          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 py-1">
            Simple. Rapide. Efficace.
          </p>
          
          <p className="text-sm sm:text-base font-bold leading-tight px-4">
            Connectez-vous et commencez dès aujourd'hui.
          </p>
        </div>

        {/* Action Section */}
        <div className="mt-8 flex flex-col items-center gap-2.5 w-full max-w-xs transition-all duration-1000 delay-700 animate-in fade-in slide-in-from-bottom-10 ease-out">
          <button
            onClick={handleStartRegister}
            className="w-full bg-white text-black text-base font-black py-3 px-8 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:bg-gray-100 active:scale-95 transition-all duration-300 transform border border-white/20 uppercase tracking-widest"
          >
            Se connecter
          </button>
          
          <button className="w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform border border-white/10 group">
            <span className="text-white text-xs font-serif italic font-bold group-hover:scale-110 transition-transform">i</span>
          </button>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .font-sans {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default FirstLaunchScreen;
