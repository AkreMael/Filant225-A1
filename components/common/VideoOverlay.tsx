import React from 'react';

interface VideoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({ isOpen, onClose, videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ" }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-2xl relative border-2 border-white/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black text-white p-2 rounded-full transition-colors shadow-lg border border-white/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <iframe
          src={`${videoUrl}?autoplay=1&modestbranding=1&rel=0`}
          title="Tutoriel FILANT°225"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default VideoOverlay;