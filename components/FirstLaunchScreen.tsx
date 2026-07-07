import React, { useState, useRef, useEffect } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
}

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep track of interaction states using a ref to avoid re-running effects or event listeners
  const stateRef = useRef({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    positionStart: { x: 0, y: 0 },

    isPinching: false,
    initialDistance: 0,
    initialScale: 1,
    midpointStart: { x: 0, y: 0 },

    // Detection for click vs scroll/drag
    touchStartTime: 0,
    hasMovedSignificant: false,
  });

  // Calculate distance between two touches
  const getTouchDistance = (e: TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // Calculate midpoint between two touches
  const getTouchMidpoint = (e: TouchEvent) => {
    if (e.touches.length < 2) return { x: 0, y: 0 };
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We use raw event listeners with { passive: false } to support e.preventDefault() for custom scrolling control.
    const onTouchStart = (e: TouchEvent) => {
      const state = stateRef.current;
      state.touchStartTime = Date.now();
      state.hasMovedSignificant = false;

      if (e.touches.length === 1) {
        state.isDragging = true;
        const touch = e.touches[0];
        state.dragStart = { x: touch.clientX, y: touch.clientY };
        state.positionStart = { ...position };
      } else if (e.touches.length === 2) {
        state.isDragging = false;
        state.isPinching = true;
        state.initialDistance = getTouchDistance(e);
        state.initialScale = scale;
        state.midpointStart = getTouchMidpoint(e);
        state.positionStart = { ...position };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const state = stateRef.current;

      if (e.touches.length === 1 && state.isDragging) {
        const touch = e.touches[0];
        const dx = touch.clientX - state.dragStart.x;
        const dy = touch.clientY - state.dragStart.y;

        if (Math.hypot(dx, dy) > 6) {
          state.hasMovedSignificant = true;
        }

        setPosition({
          x: state.positionStart.x + dx,
          y: state.positionStart.y + dy,
        });
      } else if (e.touches.length === 2 && state.isPinching) {
        e.preventDefault(); // Prevent native zoom/pan behavior
        state.hasMovedSignificant = true;
        const currentDistance = getTouchDistance(e);
        if (currentDistance > 0 && state.initialDistance > 0) {
          const newScale = state.initialScale * (currentDistance / state.initialDistance);
          // Wide flexible bounds, allowing extreme zoom as requested ("sans aucune limitation")
          const clampedScale = Math.max(0.1, Math.min(40, newScale));
          setScale(clampedScale);

          const currentMidpoint = getTouchMidpoint(e);
          const dx = currentMidpoint.x - state.midpointStart.x;
          const dy = currentMidpoint.y - state.midpointStart.y;
          setPosition({
            x: state.positionStart.x + dx,
            y: state.positionStart.y + dy,
          });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const state = stateRef.current;
      const timeElapsed = Date.now() - state.touchStartTime;

      // If it was a quick, stationary touch, treat it as a click to dismiss/proceed
      if (!state.hasMovedSignificant && !state.isPinching && timeElapsed < 250) {
        onComplete();
        return;
      }

      state.isDragging = false;
      state.isPinching = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      let newScale = scale;
      if (e.deltaY < 0) {
        newScale = scale * zoomFactor;
      } else {
        newScale = scale / zoomFactor;
      }
      setScale(Math.max(0.1, Math.min(40, newScale)));
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
    };
  }, [scale, position, onComplete]);

  // Mouse Handlers for Desktop fallback dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const state = stateRef.current;
    state.touchStartTime = Date.now();
    state.hasMovedSignificant = false;
    state.isDragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY };
    state.positionStart = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const state = stateRef.current;
    if (state.isDragging) {
      const dx = e.clientX - state.dragStart.x;
      const dy = e.clientY - state.dragStart.y;

      if (Math.hypot(dx, dy) > 6) {
        state.hasMovedSignificant = true;
      }

      setPosition({
        x: state.positionStart.x + dx,
        y: state.positionStart.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    const state = stateRef.current;
    const timeElapsed = Date.now() - state.touchStartTime;

    if (state.isDragging && !state.hasMovedSignificant && timeElapsed < 250) {
      onComplete();
      return;
    }

    state.isDragging = false;
  };

  const handleDoubleClick = () => {
    // Reset zoom and position on double click
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      id="first-launch-screen-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      className="absolute inset-0 z-[1000] w-full h-full bg-black overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <img
        id="first-launch-splash-img"
        src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4b97bfd0-e940-4985-9b5d-d812a9d51885.png"
        alt="Splash Screen Image"
        className="w-full h-full object-contain select-none pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default FirstLaunchScreen;
