
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const BackArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const LogoWithWhatsApp = () => (
    <div className="relative w-16 h-16">
        <div className="absolute inset-0 bg-white rounded-full border-[4px] border-red-600 overflow-hidden flex items-center justify-center p-1 shadow-2xl">
            <img src="https://i.supaimg.com/5cd01a23-e101-4415-9e28-ff02a617cd11.png" alt="Filant Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" />
            </svg>
        </div>
    </div>
);

// --- HELPER PARSING UNIFIÉ ---
export const extractQRInfo = (data: string) => {
    // Support JSON
    try {
        const json = JSON.parse(data);
        if (json.name || json.nom) {
            return {
                title: json.title || json.poste || json.service || 'Assistant QR',
                name: json.name || json.nom || 'Prestataire',
                phone: json.phone || json.tel || 'N/A',
                city: json.city || json.ville || 'Non spécifiée',
                details: json.details || json.infos || ''
            };
        }
    } catch (e) {}

    // Support vCard
    if (data.toUpperCase().includes('BEGIN:VCARD')) {
        const getValue = (key: string) => {
            const regex = new RegExp(`${key}(?:;[^:]*)?:([^\\n;\\r]+)`, 'i');
            return data.match(regex)?.[1]?.trim();
        };
        const n = getValue('N')?.replace(/;/g, ' ').trim();
        const fn = getValue('FN');
        const tel = getValue('TEL');
        const org = getValue('ORG');
        const title = getValue('TITLE');

        return {
            title: title || org || 'Assistant QR',
            name: fn || n || 'Prestataire',
            phone: tel || 'N/A',
            city: 'Non spécifiée',
            details: 'vCard importée'
        };
    }

    const lines = data.split('\n').map(l => l.trim()).filter(Boolean);
    
    const parseKeyValue = (text: string, key: string) => {
        const regex = new RegExp(`${key}\\s*[:=]\\s*([^\\n\\r]+)`, 'i');
        return text.match(regex)?.[1]?.trim();
    };

    // Tentative 1: Format structuré avec clés
    const title = parseKeyValue(data, 'Métier') || parseKeyValue(data, 'MÉTIER') || parseKeyValue(data, 'Poste') || parseKeyValue(data, 'Titre') || parseKeyValue(data, 'Service');
    const name = parseKeyValue(data, 'Nom') || parseKeyValue(data, 'Prénom') || parseKeyValue(data, 'Prestataire');
    const phone = parseKeyValue(data, 'Numéro') || parseKeyValue(data, 'NUMÉRO') || parseKeyValue(data, 'Tél') || parseKeyValue(data, 'Phone') || parseKeyValue(data, 'WhatsApp') || parseKeyValue(data, 'Téléphone');
    const city = parseKeyValue(data, 'Ville') || parseKeyValue(data, 'Localité') || parseKeyValue(data, 'Commune');
    const details = parseKeyValue(data, 'Details') || parseKeyValue(data, 'Infos') || parseKeyValue(data, 'Détails');

    // Tentative 2: Fallback si les clés sont absentes (format ligne par ligne)
    if (!name && lines.length >= 2) {
        return {
            title: lines[0] || 'Assistant QR',
            name: lines[1] || 'Prestataire',
            city: lines[2] || 'Non spécifiée',
            phone: lines[3] || lines[1], // Heuristique si 3 lignes
            details: lines.slice(4).join(' ') || ''
        };
    }

    return {
        title: title || 'Assistant QR',
        name: name || 'Prestataire',
        phone: phone || 'N/A',
        city: city || 'Non spécifiée',
        details: details || ''
    };
};

interface ScannerOverlayProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [detectedData, setDetectedData] = useState<string | null>(null);
  const [parsedInfo, setParsedInfo] = useState<any>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    let animationFrameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true"); 
          try {
            await video.play();
          } catch (err) {
            console.error("Video playback failed:", err);
          }
          setHasPermission(true);
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    const tick = () => {
      if (!scanningRef.current) return;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            setDetectedData(code.data);
            setParsedInfo(extractQRInfo(code.data));
            scanningRef.current = false;
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleValidate = () => {
      if (detectedData) {
          onScan(detectedData);
      }
  };

  const handleRetry = () => {
      setDetectedData(null);
      setParsedInfo(null);
      scanningRef.current = true;
      requestAnimationFrame(tick);
  };

  // Re-définir tick pour handleRetry
  const tick = () => {
      if (!scanningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          if (code && code.data) {
            setDetectedData(code.data);
            setParsedInfo(extractQRInfo(code.data));
            scanningRef.current = false;
            return;
          }
        }
      }
      requestAnimationFrame(tick);
  };

  return (
    <div className="absolute inset-0 bg-black z-[101] flex flex-col font-sans overflow-hidden">
      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onClose} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-90">
          <BackArrowIcon className="w-8 h-8" />
        </button>
        <LogoWithWhatsApp />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative w-full flex flex-col items-center justify-center p-8">
              {!detectedData ? (
                  <div className="relative w-72 h-72 border-2 border-white/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                       {hasPermission === false ? (
                          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-center p-6">
                            <p className="text-white font-bold mb-2">Accès caméra refusé</p>
                            <p className="text-white/60 text-xs">Veuillez autoriser l'accès dans vos réglages.</p>
                          </div>
                       ) : (
                          <>
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] animate-scan-line z-20"></div>
                          </>
                       )}
                  </div>
              ) : (
                  <div className="w-full max-w-sm bg-white p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col gap-4 border-4 border-orange-500">
                      <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                              <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full w-fit mb-1 shadow-sm">
                                  {parsedInfo.title}
                              </span>
                              <h4 className="text-xl font-black text-slate-900 leading-tight uppercase">{parsedInfo.name}</h4>
                          </div>
                          <div className="bg-blue-50 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-blue-100">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="text-[11px] font-black text-blue-800 uppercase">{parsedInfo.city}</span>
                          </div>
                      </div>

                      <div className="h-px bg-gray-100 w-full"></div>

                      <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact structuré</p>
                              <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <p className="text-green-600 font-black text-lg tracking-tight">+225 {parsedInfo.phone}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                               <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-md">
                                  <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" /></svg>
                               </div>
                               <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                               </div>
                          </div>
                      </div>
                  </div>
              )}

              <p className="text-white text-sm font-bold text-center mt-10 px-8 opacity-80 uppercase tracking-widest">
                {!detectedData 
                    ? "Veuillez scanner pour une nouvelle demande de son service bien fait"
                    : "Information détectée. Prêt pour l'enregistrement."
                }
              </p>
          </div>

          <div className="w-full px-10 flex flex-col gap-4 mb-12">
              <button 
                  onClick={handleValidate}
                  disabled={!detectedData}
                  className={`w-full py-5 rounded-full font-black text-xl uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-3 ${detectedData ? 'bg-[#008000] text-white animate-demande-signal' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
              >
                  {detectedData && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  ENREGISTRER
              </button>
              
              {detectedData && (
                  <button 
                      onClick={handleRetry}
                      className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors"
                  >
                      ANNULER / RÉESSAYER
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};

export default ScannerOverlay;
