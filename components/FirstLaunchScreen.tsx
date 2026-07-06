import React, { useState, useRef, useEffect } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
  deferredPrompt?: any;
  onShowPopup?: (message: string, type: 'alert' | 'confirm', onConfirm?: () => void) => void;
}

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete, deferredPrompt, onShowPopup }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  
  // Multi-touch tracking for pinch-to-zoom
  const touchStartRef = useRef<{
    distance: number;
    scale: number;
    x: number;
    y: number;
    posX: number;
    posY: number;
  }>({ distance: 0, scale: 1, x: 0, y: 0, posX: 0, posY: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartRef.current = {
        distance,
        scale,
        x: 0,
        y: 0,
        posX: position.x,
        posY: position.y
      };
    } else if (e.touches.length === 1) {
      // Pan start
      const touch = e.touches[0];
      touchStartRef.current = {
        distance: 0,
        scale,
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      e.preventDefault(); // Prevent browser default zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = distance / touchStartRef.current.distance;
      let newScale = touchStartRef.current.scale * factor;
      newScale = Math.max(1, Math.min(newScale, 5)); // Bound between 1x and 5x
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      const maxDeltaX = (scale - 1) * window.innerWidth / 2;
      const maxDeltaY = (scale - 1) * window.innerHeight / 2;
      
      const newX = Math.max(-maxDeltaX, Math.min(maxDeltaX, touchStartRef.current.posX + deltaX));
      const newY = Math.max(-maxDeltaY, Math.min(maxDeltaY, touchStartRef.current.posY + deltaY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (scale < 1.05) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse Wheel Zoom (Desktop Support)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.15;
    let newScale = scale + (e.deltaY < 0 ? 1 : -1) * zoomIntensity;
    newScale = Math.max(1, Math.min(newScale, 5));
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse Drag (Desktop Panning Support)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const maxDeltaX = (scale - 1) * window.innerWidth / 2;
      const maxDeltaY = (scale - 1) * window.innerHeight / 2;
      
      const newX = Math.max(-maxDeltaX, Math.min(maxDeltaX, dragStartRef.current.posX + deltaX));
      const newY = Math.max(-maxDeltaY, Math.min(maxDeltaY, dragStartRef.current.posY + deltaY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("User PWA choice:", outcome);
      } catch (err) {
        console.error("FCM / PWA Prompt error:", err);
      }
      setIsInstalling(false);
      onComplete();
    } else {
      // Compatibility fallback (iOS, already installed, or browser limitations)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        if (onShowPopup) {
          onShowPopup(
            "Pour installer sur iPhone / iOS :\n\n1. Appuyez sur le bouton de partage [↑] en bas de l'écran.\n2. Sélectionnez l'option 'Sur l'écran d'accueil'.",
            "alert",
            () => {
              setIsInstalling(false);
              onComplete();
            }
          );
        } else {
          alert("Pour installer sur iPhone / iOS :\n\n1. Appuyez sur le bouton de partage [↑] en bas de l'écran.\n2. Sélectionnez l'option 'Sur l'écran d'accueil'.");
          setIsInstalling(false);
          onComplete();
        }
      } else {
        if (onShowPopup) {
          onShowPopup(
            "Installation de l'application :\n\nPour installer manuellement, sélectionnez l'option 'Installer l'application' ou 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur.",
            "alert",
            () => {
              setIsInstalling(false);
              onComplete();
            }
          );
        } else {
          alert("Installation de l'application :\n\nPour installer manuellement, sélectionnez l'option 'Installer l'application' ou 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur.");
          setIsInstalling(false);
          onComplete();
        }
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black flex flex-col justify-between overflow-hidden select-none">
      
      {/* Zoomable Background Image Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-0 flex items-center justify-center cursor-zoom-in"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleTap}
        style={{ touchAction: 'none' }}
      >
        <img
          src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4b97bfd0-e940-4985-9b5d-d812a9d51885.png"
          alt="FILANT°225"
          className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            imageRendering: 'auto'
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Floating Header Label */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-black/30 backdrop-blur-md border border-white/5 p-3 px-5 rounded-2xl pointer-events-none">
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/90">FILANT°225</span>
        <span className="text-[9px] font-black tracking-widest text-[#FF7E00] uppercase bg-[#FF7E00]/10 px-2.5 py-1 rounded-full border border-[#FF7E00]/20">BIENVENUE</span>
      </div>

      {/* Action Glassmorphic Card (Overlaid at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center">
        <div className="w-full max-w-sm bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-12 duration-700">
          
          <div className="text-center pb-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Application Officielle</h3>
            <p className="text-[11px] font-bold text-white/40 mt-0.5">Pincez pour zoomer l'image et découvrir</p>
          </div>

          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-[#FF7E00] to-[#FF4500] hover:from-[#FF9400] hover:to-[#FF5A00] text-white text-sm font-black py-4 px-6 rounded-2xl shadow-[0_8px_30px_rgba(255,126,0,0.3)] active:scale-[0.98] transition-all duration-300 transform uppercase tracking-widest flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
          >
            {isInstalling ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Installation...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Cliquez ici pour installer</span>
              </>
            )}
          </button>

          <button
            onClick={() => onComplete()}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-black py-3 px-6 rounded-2xl active:scale-[0.98] transition-all duration-300 transform uppercase tracking-widest"
          >
            Se connecter
          </button>
        </div>
      </div>

    </div>
  );
};

export default FirstLaunchScreen;
