import React from 'react';
import { motion } from 'motion/react';
import SpeakerIcon from './common/SpeakerIcon';

interface InfoTravailleursScreenProps {
  onBack: () => void;
}

const InfoTravailleursScreen: React.FC<InfoTravailleursScreenProps> = ({ onBack }) => {
  const audioText = `Bienvenue sur FILANT°225, la plateforme qui facilite la mise en relation entre professionnels et clients partout en Côte d'Ivoire.

INSCRIPTION : Pour rejoindre la plateforme, chaque travailleur, agence immobilière ou propriétaire d'équipements à louer doit effectuer une inscription de trois cent dix francs CFA. Cette inscription permet la création du profil et l'accès à la première mise en relation. Après l'inscription, la première mission est offerte sans frais de mise en relation supplémentaires.

CARTE Q R PROFESSIONNELLE : Pour accéder à plusieurs missions et bénéficier de toutes les fonctionnalités de la plateforme, l'utilisateur doit activer sa Carte Q R Professionnelle pour un coût d'activation de sept mille cent francs CFA. Les avantages majeurs de cette carte comprennent l'accès à plusieurs missions, une identification professionnelle sécurisée, une vérification simplifiée par les clients, une meilleure visibilité sur la plateforme et l'accès aux fonctionnalités avancées de FILANT°225.

Frais de mise en relation : La mise à jour de la carte code Q R est de cinq cents francs CFA chaque mois, avec activation automatique pour l'émission.

Sachez que FILANT°225 ne prélève aucun pourcentage sur vos revenus. L'intégralité de vos gains vous appartient. La plateforme facture uniquement des frais de mise en relation permettant de maintenir le service, de renforcer la sécurité et d'assurer le bon fonctionnement du système.

SÉCURITÉ ET VÉRIFICATION : Pour garantir un environnement fiable et sécurisé, une pièce d'identité valide peut être demandée, et certaines informations professionnelles peuvent être vérifiées. Vos données sont protégées et utilisées uniquement dans le cadre du fonctionnement de la plateforme.

POUR LES AGENCES IMMOBILIÈRES ET PROPRIÉTAIRES D'ÉQUIPEMENTS : Les agences immobilières peuvent publier leurs biens et recevoir des demandes directement depuis l'application. De même, les propriétaires d'équipements peuvent proposer leurs matériels à la location et recevoir des demandes de clients intéressés.

Notre objectif est de créer un réseau professionnel fiable, sécurisé et accessible à tous, tout en permettant aux travailleurs, agences et propriétaires d'équipements de développer leurs activités sans commission sur leurs revenus.`;

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
            className="p-2 -ml-1 hover:bg-gray-100 rounded-full text-gray-800 transition-all active:scale-95"
            id="back-btn-travailleurs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-slate-900 font-extrabold text-xl tracking-tighter uppercase select-none">
            Espace Professionnels
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <SpeakerIcon text={audioText} className="text-orange-500 bg-orange-50 hover:bg-orange-100 p-2 border border-orange-100" />
          <span className="text-[#FF8200] font-black text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            FILANT°225
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-slate-50/50 pb-20">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center p-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
            Bienvenue sur notre réseau
          </h2>
          <p className="text-gray-650 text-xs leading-relaxed">
            Bienvenue sur <span className="font-bold text-orange-600">FILANT°225</span>, la plateforme qui facilite la mise en relation entre professionnels et clients partout en Côte d'Ivoire.
          </p>
        </div>

        {/* Inscription & Première Mission */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            📝 INSCRIPTION & COMMENCEMENT
          </h3>
          
          <div className="space-y-2">
            <p className="text-xs text-gray-605 leading-relaxed">
              Pour rejoindre la plateforme, chaque travailleur, agence immobilière ou propriétaire d'équipements à louer doit effectuer une inscription sécurisée.
            </p>
            
            {/* Price Badge */}
            <div className="flex items-center justify-between p-3.5 bg-orange-50 border border-orange-100/70 rounded-xl mt-2">
              <span className="text-xs font-bold text-slate-800">Frais d'inscription</span>
              <span className="text-sm font-black text-orange-600 bg-white px-3 py-1 rounded-full border border-orange-200">
                310 FCFA
              </span>
            </div>
            
            <p className="text-[11px] text-gray-500 italic mt-1">
              Cette inscription permet la création du profil et l'accès à la première mise en relation.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              🎁 PREMIÈRE MISSION OFFERTE
            </h4>
            <p className="text-[11px] text-emerald-700 leading-relaxed font-semibold">
              Après l'inscription, la première mission est offerte sans frais de mise en relation supplémentaires.
            </p>
          </div>
        </div>

        {/* Carte QR Professionnelle */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            📱 CARTE QR PROFESSIONNELLE
          </h3>
          <p className="text-gray-650 text-xs leading-relaxed">
            Pour accéder à plusieurs missions et bénéficier de toutes les fonctionnalités de la plateforme, l'utilisateur doit activer sa Carte QR Professionnelle.
          </p>

          <div className="flex items-center justify-between p-3.5 bg-[#FF8200]/10 border border-orange-200 rounded-xl">
            <span className="text-xs font-bold text-slate-800">Coût d'activation</span>
            <span className="text-sm font-black text-[#FF8200] bg-white px-3 py-1 rounded-full border border-orange-300">
              7 100 FCFA
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              AVANTAGES DE LA CARTE QR :
            </h4>
            <ul className="grid grid-cols-1 gap-2.5">
              {[
                "Accès à plusieurs missions.",
                "Identification professionnelle sécurisée.",
                "Vérification simplifiée par les clients.",
                "Meilleure visibilité sur la plateforme.",
                "Accès aux fonctionnalités avancées de FILANT°225."
              ].map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                  <span className="text-orange-500 font-extrabold leading-none mt-0.5">•</span>
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Frais de mise en relation & Pas de commission */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#FF8200] uppercase tracking-wider border-b border-gray-100 pb-2">
            🪙 FRAIS DE MISE EN RELATION
          </h3>
          
          <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-800">
              Mise à jour de la carte code QR :
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md font-black">
                500 FCFA / mois
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                (Activation automatique pour l'émission)
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
              🚫 0% DE COMMISSION SUR VOS ENCAISSEMENTS
            </p>
            <p className="text-xs text-gray-700 font-bold">
              FILANT°225 ne prélève aucun pourcentage sur vos revenus. L'intégralité de vos gains vous appartient.
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              La plateforme facture uniquement des frais de mise en relation permettant de maintenir le service, renforcer la sécurité et assurer le bon fonctionnement du système.
            </p>
          </div>
        </div>

        {/* Sécurité et vérification */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            🛡️ SÉCURITÉ ET VÉRIFICATION
          </h3>
          <p className="text-gray-750 text-xs font-medium">
            Pour garantir un environnement fiable et sécurisé :
          </p>
          <div className="space-y-2">
            {[
              "Une pièce d'identité valide peut être demandée.",
              "Certaines informations professionnelles peuvent être vérifiées.",
              "Les données sont protégées et utilisées uniquement dans le cadre du fonctionnement de la plateforme."
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-orange-500 text-xs leading-none mt-0.5">•</span>
                <p className="text-gray-650 text-xs leading-relaxed font-medium">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portails Agences & Équipements */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            🏢 PORTAILS PARTENAIRES SPECIALISÉS
          </h3>
          
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                🏡 POUR LES AGENCES IMMOBILIÈRES
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Les agences immobilières peuvent publier leurs biens et recevoir des demandes directement depuis l'application.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                ⚙️ POUR LES PROPRIÉTAIRES D'ÉQUIPEMENTS
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Les propriétaires d'équipements peuvent proposer leurs matériels à la location et recevoir des demandes de clients intéressés.
              </p>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-lg space-y-2.5">
          <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest">
            🤝 ENGAGEMENT FILANT°225
          </h3>
          <p className="text-xs leading-relaxed text-gray-300 font-medium">
            Notre objectif est de créer un réseau professionnel fiable, sécurisé et accessible à tous, tout en permettant aux travailleurs, agences et propriétaires d'équipements de développer leurs activités sans commission sur leurs revenus.
          </p>
        </div>

      </div>
    </motion.div>
  );
};

export default InfoTravailleursScreen;
