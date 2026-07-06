import React, { useState, useRef, useEffect } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
  deferredPrompt?: any;
  onShowPopup?: (message: string, type: 'alert' | 'confirm', onConfirm?: () => void) => void;
}

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete, deferredPrompt, onShowPopup }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapsRef = useRef<number[]>([]);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  
  // Touch tracking for zoom
  const touchStartRef = useRef<{
    distance: number;
    scale: number;
    x: number;
    y: number;
    posX: number;
    posY: number;
  }>({ distance: 0, scale: 1, x: 0, y: 0, posX: 0, posY: 0 });

  // Standalone detection / bypass if already installed
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const isPWAInstalledFlag = localStorage.getItem('filant_pwa_installed') === 'true';
    if (isStandalone || isPWAInstalledFlag) {
      onComplete();
    }
  }, [onComplete]);

  // Listen to install completion
  useEffect(() => {
    const handleAppInstalled = () => {
      localStorage.setItem('filant_pwa_installed', 'true');
      onComplete();
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [onComplete]);

  // Triple tap detection helper
  const registerTap = () => {
    const now = Date.now();
    const taps = [...lastTapsRef.current, now].filter(t => now - t < 1200);
    lastTapsRef.current = taps;

    if (taps.length >= 3) {
      lastTapsRef.current = [];
      handleInstallPWA();
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("User installation outcome:", outcome);
        if (outcome === 'accepted') {
          localStorage.setItem('filant_pwa_installed', 'true');
        }
      } catch (err) {
        console.error("FCM PWA Prompt error:", err);
      }
      onComplete();
    } else {
      // Compatibility fallback (iOS, already installed, or browser limitations)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        if (onShowPopup) {
          onShowPopup(
            "Pour installer l'application sur iPhone / iOS :\n\n1. Appuyez sur le bouton de partage [↑] de Safari.\n2. Sélectionnez l'option 'Sur l'écran d'accueil'.",
            "alert",
            () => {
              onComplete();
            }
          );
        } else {
          alert("Pour installer l'application sur iPhone / iOS :\n\n1. Appuyez sur le bouton de partage [↑] de Safari.\n2. Sélectionnez l'option 'Sur l'écran d'accueil'.");
          onComplete();
        }
      } else {
        // Already installed or standard browser where installation is handled differently
        if (onShowPopup) {
          onShowPopup(
            "Pour installer manuellement, sélectionnez l'option 'Installer l'application' ou 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur.",
            "alert",
            () => {
              onComplete();
            }
          );
        } else {
          alert("Pour installer manuellement, sélectionnez l'option 'Installer l'application' ou 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur.");
          onComplete();
        }
      }
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    registerTap();
    if (e.touches.length === 2) {
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
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = distance / touchStartRef.current.distance;
      let newScale = touchStartRef.current.scale * factor;
      // Generous zoom boundaries "sans aucune limitation"
      newScale = Math.max(0.5, Math.min(newScale, 20));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Boundless/extremely generous panning boundaries
      const maxDeltaX = scale * window.innerWidth * 2;
      const maxDeltaY = scale * window.innerHeight * 2;
      
      const newX = Math.max(-maxDeltaX, Math.min(maxDeltaX, touchStartRef.current.posX + deltaX));
      const newY = Math.max(-maxDeltaY, Math.min(maxDeltaY, touchStartRef.current.posY + deltaY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (scale < 0.9) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    const zoomIntensity = 0.15;
    let newScale = scale + (e.deltaY < 0 ? 1 : -1) * zoomIntensity;
    newScale = Math.max(0.5, Math.min(newScale, 20));
    setScale(newScale);
    if (newScale < 0.9) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    registerTap();
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
      
      const maxDeltaX = scale * window.innerWidth * 2;
      const maxDeltaY = scale * window.innerHeight * 2;
      
      const newX = Math.max(-maxDeltaX, Math.min(maxDeltaX, dragStartRef.current.posX + deltaX));
      const newY = Math.max(-maxDeltaY, Math.min(maxDeltaY, dragStartRef.current.posY + deltaY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="absolute inset-0 bg-black flex flex-col overflow-hidden select-none">
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
        style={{ touchAction: 'none' }}
      >
        <img
          src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4b97bfd0-e940-4985-9b5d-d812a9d51885.png"
          alt="FILANT°225"
          className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            imageRendering: 'auto'
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default FirstLaunchScreen;
