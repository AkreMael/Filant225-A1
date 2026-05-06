
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Check, 
  User, 
  HardHat, 
  Home, 
  Building2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface SmartRegistrationScreenProps {
  onComplete: () => void;
  onBack: () => void;
  currentUser?: any;
}

type ProfileType = 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise';

const SmartRegistrationScreen: React.FC<SmartRegistrationScreenProps> = ({ onComplete, onBack, currentUser }) => {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>('Travailleur');
  const [formData, setFormData] = useState({ 
    name: currentUser?.name || '', 
    city: currentUser?.city || '', 
    phone: currentUser?.phone || '',
    job: '',
    experience: '',
    equipmentType: '',
    agencyName: '',
    companyName: '',
    domain: '',
    details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        city: currentUser.city || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

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
      icon: <Briefcase className="w-8 h-8" />,
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
      active: true 
    }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const inscriptionData = {
      profileType: selectedProfile,
      name: formData.name,
      city: formData.city,
      phone: formData.phone,
      details: {
          job: formData.job,
          experience: formData.experience,
          equipmentType: formData.equipmentType,
          agencyName: formData.agencyName,
          companyName: formData.companyName,
          domain: formData.domain,
          additionalDetails: formData.details
      }
    };

    const success = await databaseService.saveInscription(inscriptionData);
    setIsSubmitting(false);
    
    if (success) {
      setShowConfirmation(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (formData.name && formData.city) {
        handleSubmit();
      }
    }
  };

  if (showConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6 text-center">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
        >
          <CheckCircle2 className="w-16 h-16 text-white" />
        </motion.div>
        <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Inscription Envoyée !</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Votre demande d'inscription a été transmise avec succès à notre équipe administrative.
        </p>
      </div>
    );
  }

  const renderCategoryFields = () => {
    switch (selectedProfile) {
      case 'Travailleur':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Métier / Spécialité</label>
              <input 
                type="text"
                value={formData.job}
                onChange={(e) => setFormData({...formData, job: e.target.value})}
                placeholder="Ex: Électricien, Maçon..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Années d'expérience</label>
              <input 
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                placeholder="Ex: 5 ans"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Propriétaire':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Types d'équipements</label>
              <input 
                type="text"
                value={formData.equipmentType}
                onChange={(e) => setFormData({...formData, equipmentType: e.target.value})}
                placeholder="Ex: Bétonnière, Échafaudage..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Agence':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'agence</label>
              <input 
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                placeholder="Nom de votre agence"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Entreprise':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'entreprise</label>
              <input 
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="Ex: BTP Services CI"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domaine d'activité</label>
              <input 
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="Ex: Bâtiment, Transport..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white font-sans overflow-y-auto scrollbar-hide">
      {/* Header */}
      <header className="pt-8 pb-6 px-6 flex flex-col items-center text-center relative">
        <button 
          onClick={onBack}
          className="absolute left-6 top-8 p-2 bg-white/10 rounded-xl active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

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
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${selectedProfile ? 'bg-green-500' : 'bg-gray-200'}`}></div>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville</label>
                    <input 
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Ex: Cocody"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                   <input 
                     type="text"
                     value={formData.phone}
                     disabled
                     className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-slate-500 font-bold outline-none cursor-not-allowed"
                   />
                </div>

                <div className="h-[2px] bg-slate-100 my-4"></div>

                <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em]">Spécificités {selectedProfile}</h4>
                {renderCategoryFields()}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Autres détails (Optionnel)</label>
                  <textarea 
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    placeholder="Précisez vos besoins ou services ici..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 px-2">
            <button
              onClick={handleNext}
              disabled={isSubmitting || (step === 2 && (!formData.name || !formData.city))}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.3)]"
            >
              {isSubmitting ? (
                 <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-lg uppercase tracking-wider">{step === 1 ? 'Suivant' : 'Terminer'}</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
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
