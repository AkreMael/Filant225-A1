
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { Briefcase, Calendar, Clock, ChevronRight } from 'lucide-react';

interface MyQRCodeScreenProps {
  user: User;
  onBack: () => void;
  onTriggerPayment: (context: any) => void;
  onStartRegistration: () => void;
}

const MyQRCodeScreen: React.FC<MyQRCodeScreenProps> = ({ user, onBack, onTriggerPayment, onStartRegistration }) => {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMissions, setShowMissions] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);

  useEffect(() => {
    if (!user.phone) return;
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    
    // Listen to missions for this user
    const missionsQuery = query(
      collection(db, 'Missions'),
      where('userId', '==', user.phone), // Try both phone and sanitized if needed, but usually it's the raw phone
      orderBy('timestamp', 'desc')
    );

    const unsubMissions = onSnapshot(missionsQuery, (snap) => {
      setMissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      // Fallback if userId is different or query fails (e.g. missing index)
      console.warn("Missions listener error:", err);
    });

    const activationRef = doc(db, 'QRCodeActivations', sanitizedPhone);
    
    const unsubscribe = onSnapshot(activationRef, (doc) => {
      if (doc.exists()) {
        setQrData(doc.data());
      } else {
        setQrData({
            status: "S'inscrire pour obtenir un code QR",
            requiresRegistration: true
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to QR Code Activation:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubMissions();
    };
  }, [user.phone]);

  const generateQRCodeValue = () => {
    // Standard format for scanner recognition
    return `Poste: ${user.role || 'Client'}\nNom: ${user.name}\nTél: ${user.phone}\nVille: ${user.city}\nDetails: FILANT225 - COMPTE ACTIF`;
  };

  const currentStatus = qrData?.status || "S'inscrire pour obtenir un code QR";
  const isActive = currentStatus === "Code QR Actif";
  
  const getStepNumber = () => {
      if (qrData?.requiresRegistration) return 1;
      if (currentStatus.includes("310")) return 2;
      if (currentStatus.includes("7 100")) return 3;
      if (isActive) return 4;
      if (currentStatus.includes("500")) return 5;
      return 1;
  };

  const step = getStepNumber();

  const handleAction = () => {
      if (step === 1) {
          onStartRegistration();
      } else if (step === 2) {
          onTriggerPayment({
              title: "Frais de Dossier",
              amount: "310",
              waveLink: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=310",
              paymentType: "Inscription"
          });
      } else if (step === 3) {
          onTriggerPayment({
              title: "Activation QR Code",
              amount: "7100",
              waveLink: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=7100",
              paymentType: "Activation"
          });
      } else if (step === 5) {
          onTriggerPayment({
              title: "Renouvellement QR Code",
              amount: "500",
              waveLink: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=500",
              paymentType: "Renouvellement"
          });
      }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full bg-white">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-orange-600 font-bold uppercase text-xs tracking-widest">Synchronisation...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-500">
      <header className="p-5 flex items-center bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2.5 bg-gray-50 rounded-full active:scale-90 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-slate-900 uppercase tracking-tight mr-10 italic">VOTRE CARTE QR</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
          {/* Status Tracker */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 mb-8">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xs uppercase text-slate-400 tracking-widest">Tunnel d'activation</h3>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">Étape {Math.min(step, 4)}/4</div>
              </div>
              
              <div className="relative flex justify-between items-center px-4">
                  <div className="absolute left-8 right-8 h-1 bg-gray-100 top-1/2 -translate-y-1/2 z-0">
                      <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min((step - 1) * 33.3, 100)}%` }}></div>
                  </div>
                  {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${step >= s ? 'bg-orange-500 border-orange-100 text-white scale-110 shadow-lg' : 'bg-white border-gray-50 text-gray-300'}`}>
                          <span className="font-black text-[10px]">{s}</span>
                      </div>
                  ))}
              </div>

              <div className="mt-8 p-5 bg-slate-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Statut Actuel</p>
                  <p className={`text-center font-black text-sm uppercase leading-tight ${isActive ? 'text-green-600' : 'text-orange-600'}`}>
                      {currentStatus}
                  </p>
                  {qrData?.expiryDate && isActive && (
                      <p className="text-center text-[10px] font-bold text-gray-400 mt-2">
                          Expire le : {new Date(qrData.expiryDate).toLocaleDateString('fr-FR')}
                      </p>
                  )}
              </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center text-center">
              <div className={`relative p-8 rounded-[3rem] bg-white shadow-2xl transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-sm grayscale'}`}>
                   {!isActive && (
                       <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center bg-white/40 backdrop-blur-[2px] rounded-[3rem]">
                           <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl rotate-[-5deg]">
                               QR Code Désactivé
                           </div>
                       </div>
                   )}
                   <QRCodeSVG 
                      value={generateQRCodeValue()} 
                      size={200}
                      level="H"
                      includeMargin={false}
                   />
              </div>

              <div className="mt-10 w-full">
                  {!isActive ? (
                      <div className="space-y-4">
                          <button 
                            onClick={handleAction}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                          >
                            {step === 1 ? 'Commencer Inscription' : 
                             step === 2 ? 'Payer Frais Dossier (310 CFA)' : 
                             'Activer mon QR Code (7 100 CFA)'}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" /></svg>
                          </button>
                      </div>
                  ) : (
                      <>
                      <div className="bg-green-500 rounded-[2.5rem] p-6 text-white shadow-xl text-center relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                          <h3 className="font-black text-xl uppercase tracking-tighter mb-1">FÉLICITATIONS !</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Votre QR Code est entièrement actif</p>
                          <div className="mt-4 pt-4 border-t border-white/20">
                             <p className="text-[10px] font-bold leading-relaxed px-4">
                                Présentez ce code lors de vos interventions ou scannages pour être instantanément identifié par Filant°225.
                             </p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setShowMissions(true)}
                        className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                      >
                         Mes missions
                         {missions.length > 0 && (
                            <span className="w-5 h-5 bg-white text-orange-600 rounded-full flex items-center justify-center text-[10px]">
                                {missions.length}
                            </span>
                         )}
                      </button>
                      </>
                  )}

                  {step === 5 && (
                      <button 
                         onClick={handleAction}
                         className="w-full mt-4 bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                      >
                         Renouveler ma mise en relation (500 CFA)
                      </button>
                  )}
              </div>
          </div>
      </main>

      {/* Missions Overlay */}
      <AnimatePresence>
        {showMissions && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <header className="p-5 flex items-center bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 transition-all">
                <button onClick={() => setShowMissions(false)} className="p-2.5 bg-gray-50 rounded-full active:scale-90 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="flex-1 text-center font-black text-lg text-slate-900 uppercase tracking-tight mr-10 italic">MES MISSIONS</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Missions</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Historique de vos interventions</p>
                    </div>
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                        Total: {missions.length}
                    </div>
                </div>

                {missions.length > 0 ? (
                    <div className="grid gap-6">
                        {missions.map((mission, idx) => (
                            <motion.div 
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               key={mission.id} 
                               className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 group relative overflow-hidden active:scale-[0.98] transition-all"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                                    <Briefcase size={80} className="text-orange-600" />
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-2xl flex items-center justify-center font-black">
                                       {missions.length - idx}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        Validé
                                    </div>
                                </div>

                                <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight mb-2 leading-tight">
                                    {mission.title}
                                </h3>
                                
                                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                                    {mission.message}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar size={12} />
                                            <span className="text-[9px] font-black uppercase">{mission.timestamp ? new Date(mission.timestamp.seconds * 1000).toLocaleDateString('fr-FR') : 'Date...'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Clock size={12} />
                                            <span className="text-[9px] font-black uppercase">{mission.timestamp ? new Date(mission.timestamp.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Heure...'}</span>
                                        </div>
                                    </div>
                                    <button className="text-orange-600 w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                            <Briefcase size={40} className="text-slate-200" />
                        </div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                            Vous n'avez pas encore de mission assignée.
                        </p>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="p-8 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Signature Numérique • Filant°225</p>
      </footer>
    </div>
  );
};

export default MyQRCodeScreen;
