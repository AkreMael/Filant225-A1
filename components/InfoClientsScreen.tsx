import React from 'react';
import { motion } from 'motion/react';

interface InfoClientsScreenProps {
  onBack: () => void;
}

const InfoClientsScreen: React.FC<InfoClientsScreenProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-white z-[500] flex flex-col font-sans overflow-hidden"
      id="info-clients-screen"
    >
      {/* Top Bar Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 hover:bg-gray-100 rounded-full text-gray-800 transition-all active:scale-95"
            id="back-btn-clients"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-slate-900 font-extrabold text-xl tracking-tighter uppercase select-none">
            Espace Clients
          </h1>
        </div>
        <span className="text-orange-500 font-black text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
          FILANT°225
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-slate-50/50 pb-20">
        
        {/* Intro Card */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center p-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
            Des services sécurisés & traçables
          </h2>
          <p className="text-slate-700 text-sm font-bold leading-normal mb-3">
            Des services sécurisés, traçables et accessibles partout en Côte d'Ivoire.
          </p>
          <p className="text-gray-600 text-xs leading-relaxed">
            FILANT°225 est une plateforme de mise en relation entre clients, travailleurs qualifiés, agences immobilières et propriétaires d'équipements à louer.
          </p>
        </div>

        {/* Comment utiliser ? */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span className="text-orange-500">⚡</span> COMMENT UTILISER FILANT°225 ?
          </h3>
          <div className="space-y-4">
            {[
              { num: "1", text: "Recherchez le service dont vous avez besoin." },
              { num: "2", text: "Consultez les profils disponibles." },
              { num: "3", text: "Sélectionnez le prestataire correspondant à votre besoin." },
              { num: "4", text: "Soumettez votre demande directement depuis l'application." },
              { num: "5", text: "Effectuez les frais de mise en relation lorsque cela est demandé." },
              { num: "6", text: "Recevez les informations nécessaires pour entrer en contact avec le prestataire." }
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100/85 text-orange-600 text-xs font-black flex items-center justify-center">
                  {step.num}
                </span>
                <p className="text-gray-700 text-xs font-medium leading-relaxed pt-0.5">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Services disponibles */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            💼 SERVICES DISPONIBLES
          </h3>
          <ul className="grid grid-cols-1 gap-2.5">
            {[
              "Travailleurs qualifiés",
              "Interventions rapides",
              "Formations et stages",
              "Agences immobilières",
              "Équipements à louer",
              "Opportunités et services professionnels"
            ].map((service, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                {service}
              </li>
            ))}
          </ul>
        </div>

        {/* Frais de mise en relation */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-[#FF8200] uppercase tracking-wider border-b border-gray-100 pb-2">
            🪙 FRAIS DE MISE EN RELATION
          </h3>
          <p className="text-gray-700 text-xs font-bold leading-normal">
            FILANT°225 ne prélève aucun pourcentage sur les revenus des travailleurs ni sur les transactions entre les utilisateurs.
          </p>
          <p className="text-gray-650 text-xs leading-relaxed">
            Les frais demandés correspondent uniquement aux frais de mise en relation permettant de sécuriser les échanges et le fonctionnement de la plateforme.
          </p>
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl mt-2">
            <p className="text-xs text-orange-850 font-medium">
              💡 Un portefeuille intégré est disponible dans l'application afin de faciliter les paiements des frais de mise en relation lorsque cela est nécessaire.
            </p>
          </div>
        </div>

        {/* Sécurité et vérification */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            🛡️ SÉCURITÉ ET VÉRIFICATION
          </h3>
          <p className="text-gray-750 text-xs font-medium">
            Pour renforcer la sécurité de tous les utilisateurs :
          </p>
          <div className="space-y-3">
            {[
              "Les travailleurs peuvent être amenés à fournir une pièce d'identité valide.",
              "Les clients peuvent également être invités à confirmer certaines informations selon le service demandé.",
              "Les informations sont utilisées uniquement dans le cadre de la sécurisation des mises en relation."
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-orange-500 text-sm leading-none mt-0.5">•</span>
                <p className="text-gray-650 text-xs leading-relaxed">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-lg space-y-2.5">
          <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest">
            🤝 ENGAGEMENT FILANT°225
          </h3>
          <p className="text-xs leading-relaxed text-gray-300 font-medium">
            Notre objectif est de fournir une plateforme fiable, rapide et sécurisée permettant aux utilisateurs de trouver facilement les services dont ils ont besoin partout en Côte d'Ivoire.
          </p>
        </div>

      </div>
    </motion.div>
  );
};

export default InfoClientsScreen;
