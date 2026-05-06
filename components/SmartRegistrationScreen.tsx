
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Check, 
  User, 
  HardHat, 
  Home, 
  Building2,
  ArrowRight
} from 'lucide-react';

interface SmartRegistrationScreenProps {
  onComplete: (profileType: string) => void;
  onBack: () => void;
}

type ProfileType = 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise';

const SmartRegistrationScreen: React.FC<SmartRegistrationScreenProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>('Travailleur');
  const [formData, setFormData] = useState({ name: '', city: '' });

  const profiles = [
    {
      id: 'Travailleur',
      label: 'Travailleur',
      icon: <HardHat className="w-8 h-8" />,
      description: 'Prestataire de service indépendant',
      active: true
    },
    {
      id: 'Propriétaire',
      label: 'Propriétaire d’équipement',
      icon: <User className="w-8 h-8" />,
      description: 'Location de matériel et engins',
      active: true
    },
    {
      id: 'Agence',
      label: 'Agence immobilière',
      icon: <Home className="w-8 h-8" />,
      description: 'Gestion et vente de biens',
      active: true
    },
    {
      id: 'Entreprise',
      label: 'Entreprise',
      icon: <Building2 className="w-8 h-8" />,
      description: 'Sociétés et organisations',
      active: false 
    }
  ];

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (formData.name && formData.city) {
        onComplete(selectedProfile);
        // We'll pass information through localStorage for LoginScreen to pick up
        localStorage.setItem('filant_temp_name', formData.name);
        localStorage.setItem('filant_temp_city', formData.city);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-white font-sans overflow-y-auto">
      {/* Header */}
      <header className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-orange-500 font-black text-3xl tracking-tighter">FILANT</span>
          <span className="text-white font-bold text-3xl tracking-tighter opacity-90">225</span>
        </div>
        <h2 className="text-lg font-medium text-white/90">Inscription intelligente</h2>
        <p className="text-gray-400 text-xs mt-2 max-w-[280px]">
          Nous vous invitons à vous inscrire sur la plateforme afin d’être rapidement mis en relation avec des clients.
        </p>
        <p className="text-gray-500 text-[10px] mt-1 italic font-light tracking-tight">
          Frais d’inscription : 310.CFA fin
        </p>
      </header>

      {/* Main Card */}
      <main className="flex-1 px-4 pb-10">
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl p-6 min-h-[500px] flex flex-col"
        >
          {/* Connexion Rapide & Progress */}
          <div className="flex justify-between items-center mb-8 px-2">
            <span className="text-slate-800 font-black text-sm uppercase tracking-wider">Connexion rapide</span>
            <div className="flex gap-1">
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-slate-900 font-black text-3xl tracking-tighter mb-1 uppercase">INSCRIPTION</h1>
            <h3 className="text-slate-400 font-bold text-sm tracking-widest uppercase">ÉTAPE {step} : {step === 1 ? 'PROFIL' : 'INFORMATION'}</h3>
          </div>

          {step === 1 ? (
            <div className="px-2 mb-6">
              <h4 className="text-slate-600 font-black text-xs uppercase tracking-[0.2em] mb-4">QUI ÊTES-VOUS ?</h4>
              
              <div className="grid grid-cols-2 gap-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    disabled={!profile.active}
                    onClick={() => setSelectedProfile(profile.id as ProfileType)}
                    className={`
                      relative p-4 rounded-3xl border-2 transition-all duration-300 text-left flex flex-col justify-between h-[120px]
                      ${!profile.active ? 'bg-slate-50 border-slate-100 opacity-60' : 
                        selectedProfile === profile.id ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/10' : 'bg-slate-50 border-slate-200'}
                    `}
                  >
                    <div className={`p-2 rounded-xl w-fit ${selectedProfile === profile.id && profile.active ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {profile.icon}
                    </div>
                    
                    <div className="mt-2 text-wrap">
                      <p className={`text-[10px] font-black leading-tight uppercase ${selectedProfile === profile.id && profile.active ? 'text-orange-600' : 'text-slate-500'}`}>
                        {profile.label}
                      </p>
                    </div>

                    {selectedProfile === profile.id && profile.active && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-2 mb-6 space-y-6">
              <h4 className="text-slate-600 font-black text-xs uppercase tracking-[0.2em] mb-4">VOS DÉTAILS</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Jean Kouassi"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville / Commune</label>
                  <input 
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: Abidjan, Cocody"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 px-2">
            <button
              onClick={handleNext}
              disabled={step === 2 && (!formData.name || !formData.city)}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.3)]"
            >
              <span className="text-lg uppercase tracking-wider">{step === 1 ? 'Suivant' : 'Terminer'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="w-full mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest"
              >
                Retour
              </button>
            )}
          </div>
        </motion.div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .font-sans {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default SmartRegistrationScreen;
