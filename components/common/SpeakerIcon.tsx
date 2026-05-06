import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';

const SpeakerIcon: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => audioService.cancel();
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
        audioService.cancel();
        setIsPlaying(false);
        return;
    }

    audioService.speak(
        text,
        () => setIsPlaying(true),
        () => setIsPlaying(false)
    );
  };

  return (
    <div 
        role="button"
        tabIndex={0}
        onClick={handleTogglePlay} 
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleTogglePlay(e as any);
            }
        }}
        className={`p-1.5 rounded-full transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer ${className}`}
        title="Lire le texte"
    >
       <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isPlaying ? 'text-orange-500 animate-pulse' : 'text-gray-400 dark:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
       </svg>
    </div>
  );
};

export default SpeakerIcon;
