
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
    // Travailleur
    job: '',
    domain: '',
    specialty: '',
    learnedFrom: '' as 'Sur le tas' | 'Formation professionnelle' | 'Diplôme' | '',
    skillsDescription: '',
    availability: '',
    movementZone: '',
    // Propriétaire
    equipmentType: '',
    equipmentCategory: '',
    equipmentDescription: '',
    quantity: '',
    equipmentCity: '',
    rentalPrice: '',
    // Agence
    agencyName: '',
    agencyCity: '',
    agencyAddress: '',
    propertyTypes: '',
    agencyServices: '',
    agencyZone: '',
    agencyDocs: '',
    // Entreprise
    companyName: '',
    companyCity: '',
    companyAddress: '',
    companyDomain: '',
    companyServices: '',
    companyNeeds: '',
    proposedSalary: '',
    companyDocs: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  // Persistence logic
  useEffect(() => {
    const saved = localStorage.getItem('filant_registration_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.profile) setSelectedProfile(parsed.profile);
        if (parsed.step) setStep(parsed.step);
        if (parsed.isSaved !== undefined) setIsSaved(parsed.isSaved);
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = {
      formData,
      profile: selectedProfile,
      step,
      isSaved,
      updatedAt: new Date().getTime()
    };
    localStorage.setItem('filant_registration_draft', JSON.stringify(draft));
  }, [formData, selectedProfile, step, isSaved]);

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
          // Fields vary by profileType
          ...(selectedProfile === 'Travailleur' && {
              job: formData.job,
              domain: formData.domain,
              specialty: formData.specialty,
              learnedFrom: formData.learnedFrom,
              skillsDescription: formData.skillsDescription,
              availability: formData.availability,
              movementZone: formData.movementZone
          }),
          ...(selectedProfile === 'Propriétaire' && {
              equipmentType: formData.equipmentType,
              equipmentCategory: formData.equipmentCategory,
              equipmentDescription: formData.equipmentDescription,
              quantity: formData.quantity,
              equipmentCity: formData.equipmentCity,
              availability: formData.availability,
              rentalPrice: formData.rentalPrice
          }),
          ...(selectedProfile === 'Agence' && {
              agencyName: formData.agencyName,
              agencyCity: formData.agencyCity,
              agencyAddress: formData.agencyAddress,
              propertyTypes: formData.propertyTypes,
              agencyServices: formData.agencyServices,
              agencyZone: formData.agencyZone,
              agencyDocs: formData.agencyDocs
          }),
          ...(selectedProfile === 'Entreprise' && {
              companyName: formData.companyName,
              companyCity: formData.companyCity,
              companyAddress: formData.companyAddress,
              companyDomain: formData.companyDomain,
              companyServices: formData.companyServices,
              companyNeeds: formData.companyNeeds,
              proposedSalary: formData.proposedSalary,
              companyDocs: formData.companyDocs
          })
      }
    };

    const success = await databaseService.saveInscription(inscriptionData);
    setIsSubmitting(false);
    
    if (success) {
      // Initialize QR Code tracking status
      await databaseService.updateQRCodeActivation(formData.phone, {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        profileType: selectedProfile,
        profession: formData.job || formData.equipmentType || formData.companyDomain || formData.propertyTypes,
        domain: formData.domain || formData.equipmentCategory || formData.agencyServices || formData.companyServices,
        status: "En attente paiement frais (310 FCFA)",
        fraisDossierPayes: false
      });
      
      setIsSaved(true);
    }
  };

  const handlePayRegistration = () => {
      setPaymentInitiated(true);
      const event = new CustomEvent('trigger-payment-view', {
          detail: {
              title: `Frais Dossier (${selectedProfile})`,
              amount: '310',
              waveLink: 'https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=310',
              paymentType: 'Inscription'
          }
      });
      window.dispatchEvent(event);
      
      // Cleanup draft upon payment success is handled via a callback if possible, 
      // but we'll leave it for now to ensure persistence until confirmed
  };

  const handleModify = () => {
    setIsSaved(false);
    setStep(2);
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
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inscription Travailleur</h2>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Métier / profession</label>
              <input 
                type="text"
                value={formData.job}
                onChange={(e) => setFormData({...formData, job: e.target.value})}
                placeholder="Ex: Électricien, Menuisier..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domaine de travail</label>
              <input 
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="Ex: Bâtiment, Service..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Spécialité</label>
              <input 
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                placeholder="Votre spécialité précise"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">A appris :</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Sur le tas', 'Formation professionnelle', 'Diplôme'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFormData({...formData, learnedFrom: opt as any})}
                    className={`px-4 py-2 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.learnedFrom === opt ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description du savoir-faire</label>
              <textarea 
                value={formData.skillsDescription}
                onChange={(e) => setFormData({...formData, skillsDescription: e.target.value})}
                placeholder="Décrivez vos compétences..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disponibilité</label>
              <input 
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                placeholder="Ex: Lundi au Samedi, 8h-18h"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone de déplacement</label>
              <input 
                type="text"
                value={formData.movementZone}
                onChange={(e) => setFormData({...formData, movementZone: e.target.value})}
                placeholder="Ex: Toute la ville, Cocody uniquement..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Propriétaire':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inscription Propriétaire d’équipement</h2>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d’équipement</label>
              <input 
                type="text"
                value={formData.equipmentType}
                onChange={(e) => setFormData({...formData, equipmentType: e.target.value})}
                placeholder="Ex: Bétonnière, Échafaudage..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie d’équipement</label>
              <input 
                type="text"
                value={formData.equipmentCategory}
                onChange={(e) => setFormData({...formData, equipmentCategory: e.target.value})}
                placeholder="Ex: Construction, Transport..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description de l’équipement</label>
              <textarea 
                value={formData.equipmentDescription}
                onChange={(e) => setFormData({...formData, equipmentDescription: e.target.value})}
                placeholder="Détails techniques, état..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité disponible</label>
              <input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="Ex: 1"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville où l’équipement est situé</label>
              <input 
                type="text"
                value={formData.equipmentCity}
                onChange={(e) => setFormData({...formData, equipmentCity: e.target.value})}
                placeholder="Ville de localisation"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disponibilité</label>
              <input 
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                placeholder="Ex: Immédiate, sur réservation..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix ou mode de location</label>
              <input 
                type="text"
                value={formData.rentalPrice}
                onChange={(e) => setFormData({...formData, rentalPrice: e.target.value})}
                placeholder="Ex: 5000 CFA/jour"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Agence':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inscription Agence immobilière</h2>
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
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville où l’agence est située</label>
              <input 
                type="text"
                value={formData.agencyCity}
                onChange={(e) => setFormData({...formData, agencyCity: e.target.value})}
                placeholder="Ville du siège"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse de l’agence</label>
              <input 
                type="text"
                value={formData.agencyAddress}
                onChange={(e) => setFormData({...formData, agencyAddress: e.target.value})}
                placeholder="Adresse précise"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de biens proposés</label>
              <input 
                type="text"
                value={formData.propertyTypes}
                onChange={(e) => setFormData({...formData, propertyTypes: e.target.value})}
                placeholder="Ex: Studios, Appartements, Terrains..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Services proposés</label>
              <textarea 
                value={formData.agencyServices}
                onChange={(e) => setFormData({...formData, agencyServices: e.target.value})}
                placeholder="Vente, Location, Gestion..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone d’activité</label>
              <input 
                type="text"
                value={formData.agencyZone}
                onChange={(e) => setFormData({...formData, agencyZone: e.target.value})}
                placeholder="Ex: Abidjan, Côte Ouest..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documents de l’agence (optionnel)</label>
              <input 
                type="text"
                value={formData.agencyDocs}
                onChange={(e) => setFormData({...formData, agencyDocs: e.target.value})}
                placeholder="Précisez si documents disponibles"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'Entreprise':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inscription Entreprise</h2>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville de l’entreprise</label>
              <input 
                type="text"
                value={formData.companyCity}
                onChange={(e) => setFormData({...formData, companyCity: e.target.value})}
                placeholder="Ville du siège"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse de l’entreprise</label>
              <input 
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                placeholder="Adresse précise"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domaine d'activité</label>
              <input 
                type="text"
                value={formData.companyDomain}
                onChange={(e) => setFormData({...formData, companyDomain: e.target.value})}
                placeholder="Ex: Bâtiment, Transport..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Services proposés</label>
              <textarea 
                value={formData.companyServices}
                onChange={(e) => setFormData({...formData, companyServices: e.target.value})}
                placeholder="Décrivez vos services"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Besoins ou recherches</label>
              <textarea 
                value={formData.companyNeeds}
                onChange={(e) => setFormData({...formData, companyNeeds: e.target.value})}
                placeholder="Ce que l'entreprise recherche"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salaire proposé par mois ou semaine</label>
              <input 
                type="text"
                value={formData.proposedSalary}
                onChange={(e) => setFormData({...formData, proposedSalary: e.target.value})}
                placeholder="Ex: 150 000 CFA / mois"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documents professionnels (optionnel)</label>
              <input 
                type="text"
                value={formData.companyDocs}
                onChange={(e) => setFormData({...formData, companyDocs: e.target.value})}
                placeholder="Registre commerce, etc..."
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

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
          {isSaved ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-12 h-12 text-green-600 stroke-[3]" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">Validation Réussie !</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Votre inscription en tant que <span className="text-orange-600 font-black">{selectedProfile}</span> a été enregistrée avec succès.
                  </p>
                  <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                     <p className="text-orange-900 font-bold text-sm">
                        Pour finaliser et activer votre mise en ligne, veuillez régler les frais de dossier de :
                     </p>
                     <p className="text-3xl font-black text-orange-600 mt-2">310 FCFA</p>
                  </div>
               </div>

               <div className="w-full pt-8 space-y-4">
                  <button
                    onClick={handlePayRegistration}
                    disabled={paymentInitiated}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                  >
                    {paymentInitiated ? 'Redirection Wave...' : 'Payer les frais (310 FCFA)'}
                    {!paymentInitiated && <ArrowRight className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleModify}
                    className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-3xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Modifier mes informations
                  </button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Paiement sécurisé via Wave</p>
               </div>
            </div>
          ) : step === 1 ? (
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
              <h4 className="text-slate-600 font-black text-xs uppercase tracking-[0.2em] mb-4">VOS DÉTAILS PERSONNELS</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet (fixé)</label>
                    <input 
                      type="text"
                      value={formData.name}
                      readOnly
                      className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-slate-500 font-bold outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ville (fixée)</label>
                    <input 
                      type="text"
                      value={formData.city}
                      readOnly
                      className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-slate-500 font-bold outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro (fixé)</label>
                   <input 
                     type="text"
                     value={formData.phone}
                     readOnly
                     className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-slate-500 font-bold outline-none cursor-not-allowed"
                   />
                </div>

                <div className="h-[2px] bg-slate-100 my-4"></div>

                <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em]">Spécificités {selectedProfile}</h4>
                {renderCategoryFields()}
              </div>
            </div>
          )}
        </div>

        {!isSaved && (
          <div className="mt-auto pt-6 px-2">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.3)]"
            >
              {isSubmitting ? (
                 <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-lg uppercase tracking-wider">{step === 1 ? 'Suivant' : 'S’inscrire'}</span>
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
        )}
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
