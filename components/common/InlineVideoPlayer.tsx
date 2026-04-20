import React from 'react';

interface InlineVideoPlayerProps {
  videoUrl?: string;
  onBack: () => void;
}

const InlineVideoPlayer: React.FC<InlineVideoPlayerProps> = ({ 
  videoUrl = "https://www.youtube.com/embed/8Ry-TktBbtU", 
  onBack 
}) => {
  // Déterminer le séparateur correct (? ou &) pour les paramètres additionnels
  const separator = videoUrl.includes('?') ? '&' : '?';
  const finalUrl = `${videoUrl}${separator}autoplay=1&modestbranding=1&rel=0`;

  return (
    <div className="w-full h-full flex flex-col bg-black animate-in fade-in duration-300 overflow-hidden rounded-2xl">
      <div className="flex-1 relative bg-black">
        <iframe
          src={finalUrl}
          title="Tutoriel FILANT°225"
          className="absolute inset-0 w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Chargement du tutoriel FILANT°225...</p>
        </div>
      </div>
      
      <div className="p-4 bg-slate-900 border-t border-white/10">
        <button 
            onClick={onBack}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl transform active:scale-95 transition-all text-sm uppercase tracking-widest border-b-4 border-orange-800 flex items-center justify-center"
        >
            Retour au formulaire
        </button>
      </div>
    </div>
  );
};

export default InlineVideoPlayer;