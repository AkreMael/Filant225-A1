
import React, { useEffect, useState } from 'react';

const colors = [
  '#FFFFFF', // Blanc
  '#F97316', // Orange
  '#3B82F6', // Bleu
  '#795548', // Marron (approx)
  '#9CA3AF', // Gris
  '#8B5CF6', // Violet
  '#EF4444', // Rouge
  '#0EA5E9', // Bleu ciel
];

interface Particle {
  id: number;
  type: 'star' | 'heart';
  color: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

const MenuBackground: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles on client-side to ensure hydration consistency (randomness)
    const count = 30;
    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      type: Math.random() > 0.5 ? 'star' : 'heart',
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 20 + 10, // 10px to 30px
      duration: Math.random() * 20 + 15, // 15s to 35s duration
      delay: Math.random() * -30, // Negative delay to start mid-animation
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-0"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            color: p.color,
            animation: `wander ${p.duration}s infinite linear`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.type === 'heart' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
            </svg>
          )}
        </div>
      ))}
      <style>{`
        @keyframes wander {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          30% {
            transform: translate(60px, -40px) rotate(90deg) scale(1);
            opacity: 0.5;
          }
          60% {
            transform: translate(-40px, 80px) rotate(180deg) scale(0.8);
            opacity: 0.4;
            filter: hue-rotate(45deg); /* Slight color shift */
          }
          85% {
             opacity: 0.3;
          }
          100% {
            transform: translate(0, 0) rotate(360deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuBackground;
