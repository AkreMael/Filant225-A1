
import React, { useState, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const GlobalRippleEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const pressTimer = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const isLongPressActive = useRef(false);

  const spawnVaporRipple = (x: number, y: number) => {
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);
    
    // Nettoyage après l'animation (1.2s + marge)
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1500);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Ne pas empêcher le comportement par défaut pour laisser les boutons fonctionner normalement
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPressActive.current = false;

    // Début du chrono pour le maintien (450ms)
    pressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      // Optionnel: On pourrait ajouter un petit feedback haptique ici si supporté
    }, 450);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
    }

    // SI on a maintenu ET qu'on relâche maintenant
    if (isLongPressActive.current && touchStartPos.current) {
      spawnVaporRipple(touchStartPos.current.x, touchStartPos.current.y);
    }
    
    // Reset
    touchStartPos.current = null;
    isLongPressActive.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Si l'utilisateur glisse trop (swipe), on annule le maintien
    if (touchStartPos.current) {
      const touch = e.touches[0];
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.current.x, 2) +
        Math.pow(touch.clientY - touchStartPos.current.y, 2)
      );
      if (moveDistance > 15) {
        if (pressTimer.current) window.clearTimeout(pressTimer.current);
        isLongPressActive.current = false;
      }
    }
  };

  // Empêcher le menu contextuel natif lors du maintien pour ne pas polluer l'effet
  const onContextMenu = (e: React.MouseEvent) => {
    // On bloque le menu contextuel seulement si on a détecté un appui long personnalisé
    // Mais pour plus de simplicité et un feeling "App", on peut le bloquer globalement
    e.preventDefault();
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onContextMenu={onContextMenu}
    >
      {children}
      
      {/* Portails d'ondes de vapeur */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="vapeur-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '10px',
            height: '10px',
            marginLeft: '-5px',
            marginTop: '-5px',
          }}
        />
      ))}
    </div>
  );
};

export default GlobalRippleEffect;
