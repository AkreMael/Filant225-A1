import React from 'react';
import { motion } from 'motion/react';

interface InfoTravailleursScreenProps {
  onBack: () => void;
}

const InfoTravailleursScreen: React.FC<InfoTravailleursScreenProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-white z-[500] flex flex-col font-sans overflow-hidden"
      id="info-travailleurs-screen"
    >
      {/* Top Bar Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full text-gray-850 transition-all active:scale-95"
            id="back-btn-travailleurs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[#FF8200] font-black text-2xl tracking-tighter uppercase select-none">
            FILANT°225
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        {/* Banner Logo */}
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center p-2 border border-orange-100 mb-8 shadow-inner animate-pulse-slow">
          <img
            src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/49d4592c-b74d-4904-b209-a32e8c921f1b.png"
            alt="FILANT°225"
            className="w-full h-full object-contain"
            id="img-logo-travailleurs"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center mb-4 leading-tight">
          Informations Travailleurs
        </h2>

        {/* Pending Stage Badge */}
        <div className="bg-orange-100 border border-orange-200 text-[#FF8200] rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-8">
          🚀 Bientôt disponible
        </div>

        {/* Informative placeholder text */}
        <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 w-full max-w-md shadow-sm space-y-4 text-gray-650 text-sm leading-relaxed">
          <p className="font-bold text-slate-800 text-base border-b border-gray-200/60 pb-2">
            Rejoignez notre réseau national de confiance
          </p>
          <p>
            Cette section regroupera toutes les ressources, guides cliniques de travail, les conditions de partenariat et les opportunités professionnelles offertes par <span className="font-bold text-orange-500">FILANT°225</span>.
          </p>
          <p>
            En tant que travailleur indépendant ou entreprise qualifiée, vous accéderez bientôt à un espace dédié facilitant la gestion de vos demandes d'interventions rapides partout en Côte d'Ivoire.
          </p>
          <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-start gap-3 mt-4">
            <span className="text-xl">ℹ️</span>
            <p className="text-xs text-gray-500 font-medium">
              Notre équipe finalise actuellement la rédaction des contenus réglementaires pour vous garantir la meilleure expérience de mise en relation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfoTravailleursScreen;
