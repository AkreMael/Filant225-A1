
import React, { useState } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
}

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRegister = () => {
    setIsLoading(true);
    
    // Smooth transition to smart registration
    setTimeout(() => {
      onComplete();
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6 shadow-xl"></div>
        <h2 className="text-2xl font-black uppercase tracking-tighter animate-pulse text-orange-500">Filant°225</h2>
        <p className="text-xs text-white/50 mt-2 font-bold uppercase tracking-widest">Initialisation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FFA200] via-[#FF7E00] to-[#FF4500] text-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center py-10">
        
        {/* Welcome Section */}
        <div className="mb-2 transition-all duration-700 animate-in fade-in slide-in-from-top-10 ease-out">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-0">Bienvenue chez</h2>
          <h1 className="text-6xl sm:text-7xl font-black text-black tracking-tighter leading-none mt-2">
            FILANT°225
          </h1>
        </div>

        {/* Description Section */}
        <div className="mt-10 space-y-5 max-w-sm transition-all duration-1000 delay-300 animate-in fade-in slide-in-from-bottom-10 ease-out">
          <p className="text-[20px] sm:text-[22px] font-black leading-tight">
            Trouvez facilement ce dont vous avez besoin.
          </p>
          
          <div className="bg-black/10 backdrop-blur-sm rounded-3xl p-6 py-4 space-y-2 border border-white/20">
            <p className="text-sm font-black uppercase tracking-widest text-black/60 translate-y-[-2px]">
              🔎 Recherchez rapidement :
            </p>
            <ul className="text-[17px] sm:text-[18px] font-bold space-y-1">
              <li>• Des travailleurs (tous types de métiers)</li>
              <li>• Des équipements</li>
              <li>• Des appartements</li>
            </ul>
          </div>

          <p className="text-[15px] sm:text-[16px] font-bold leading-tight px-2">
            🤝 FILANT°225 vous met en relation directe avec les bonnes personnes.
          </p>
          
          <p className="text-[14px] font-black uppercase tracking-[0.2em] opacity-80 pt-2">
            Simple. Rapide. Efficace.
          </p>
          
          <p className="text-[17px] sm:text-[18px] font-bold leading-tight px-2">
            Connectez-vous et commencez dès aujourd'hui.
          </p>
        </div>

        {/* Action Section */}
        <div className="mt-16 flex items-center gap-3 transition-all duration-1000 delay-700 animate-in fade-in slide-in-from-bottom-10 ease-out">
          <button
            onClick={handleStartRegister}
            className="bg-white text-black text-lg font-black py-3 px-8 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-gray-100 active:scale-95 transition-all duration-300 transform border-2 border-white/20"
          >
            S'inscrire
          </button>
          
          <button className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border-2 border-white/10 group">
            <span className="text-white text-lg font-serif italic font-bold group-hover:scale-110 transition-transform">i</span>
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
