
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  userName: string;
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ userName, onFinish }) => {
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Trigger animation start slightly after mount
    setTimeout(() => setTextVisible(true), 100);

    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  // Split "FILANT225" for individual letter animation
  const titleText = "FILANT225".split("");

  return (
    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center font-sans overflow-hidden space-y-8">
      
      {/* Personalized Greeting */}
      <div className={`text-center transition-opacity duration-1000 ease-in-out ${textVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-wide">(Akwaba!)</h2>
        <h3 className="text-4xl font-extrabold text-orange-500 capitalize">
          {userName}
        </h3>
      </div>

      {/* Center Logo Icon */}
      <div className={`transition-all duration-1000 delay-300 ease-in-out transform ${textVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}`}>
          <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center p-4 border-2 border-orange-500/10 shadow-sm">
             <span className="text-white font-black text-6xl">F</span>
          </div>
      </div>

      {/* Main Title Animated */}
      <div className="flex space-x-1 sm:space-x-2">
        {titleText.map((letter, index) => (
          <span
            key={index}
            className={`text-6xl sm:text-7xl font-black text-orange-500 transform transition-all duration-700 ease-out
                ${textVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
            style={{
              transitionDelay: `${index * 100}ms` // Staggered delay speeded up for 2s loading
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Loading Bar (Visual Cue) */}
      <div className="absolute bottom-20 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 animate-[loading_2s_linear_forwards]" style={{ width: '0%' }}></div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
