
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
  CheckCircle2,
  Camera,
  Upload
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
    profileImageUrl: currentUser?.profileImageUrl || '',
    // Travailleur
    job: '',
    learnedFrom: '' as 'Sur le tas' | 'Formation professionnelle' | 'Diplôme' | '',
    availability: '',
    movementZone: '',
    skillsDescription: '',
    // Propriétaire
    equipmentType: '',
    equipmentCategory: '',
    quantity: '',
    equipmentCity: '',
    rentalPrice: '',
    equipmentDescription: '',
    // Agence
    agencyName: '',
    agencyCity: '',
    agencyPhone: '',
    propertyTypes: '' as 'Appartement' | 'Terrain' | 'Automobile' | '',
    agencyZone: '',
    // Entreprise
    companyName: '',
    companyCity: '',
    companyPhone: '',
    companyDomain: '',
    companyServices: '',
    proposedSalary: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];
    
    // Base fields (even if fixed, check them)
    if (!formData.name) newErrors.push('name');
    if (!formData.city) newErrors.push('city');
    if (!formData.phone) newErrors.push('phone');

    if (selectedProfile === 'Travailleur') {
      if (!formData.job) newErrors.push('job');
      if (!formData.learnedFrom) newErrors.push('learnedFrom');
      if (!formData.availability) newErrors.push('availability');
      if (!formData.movementZone) newErrors.push('movementZone');
      if (!formData.skillsDescription) newErrors.push('skillsDescription');
    } else if (selectedProfile === 'Propriétaire') {
      if (!formData.equipmentType) newErrors.push('equipmentType');
      if (!formData.equipmentCategory) newErrors.push('equipmentCategory');
      if (!formData.quantity) newErrors.push('quantity');
      if (!formData.equipmentCity) newErrors.push('equipmentCity');
      if (!formData.rentalPrice) newErrors.push('rentalPrice');
      if (!formData.equipmentDescription) newErrors.push('equipmentDescription');
    } else if (selectedProfile === 'Agence') {
      if (!formData.agencyName) newErrors.push('agencyName');
      if (!formData.agencyCity) newErrors.push('agencyCity');
      if (!formData.agencyPhone) newErrors.push('agencyPhone');
      if (!formData.propertyTypes) newErrors.push('propertyTypes');
      if (!formData.agencyZone) newErrors.push('agencyZone');
    } else if (selectedProfile === 'Entreprise') {
      if (!formData.companyName) newErrors.push('companyName');
      if (!formData.companyCity) newErrors.push('companyCity');
      if (!formData.companyPhone) newErrors.push('companyPhone');
      if (!formData.companyDomain) newErrors.push('companyDomain');
      if (!formData.companyServices) newErrors.push('companyServices');
      if (!formData.proposedSalary) newErrors.push('proposedSalary');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    setIsSubmitting(true);
    let currentProfileImageUrl = formData.profileImageUrl;

    const inscriptionData = {
      profileType: selectedProfile,
      name: formData.name,
      city: formData.city,
      phone: formData.phone,
      profileImageUrl: currentProfileImageUrl,
      // Fields vary by profileType but should be flattened (each in its own column)
      ...(selectedProfile === 'Travailleur' && {
          job: formData.job,
          learnedFrom: formData.learnedFrom,
          availability: formData.availability,
          movementZone: formData.movementZone,
          skillsDescription: formData.skillsDescription
      }),
      ...(selectedProfile === 'Propriétaire' && {
          equipmentType: formData.equipmentType,
          equipmentCategory: formData.equipmentCategory,
          quantity: formData.quantity,
          equipmentCity: formData.equipmentCity,
          rentalPrice: formData.rentalPrice,
          equipmentDescription: formData.equipmentDescription
      }),
      ...(selectedProfile === 'Agence' && {
          agencyName: formData.agencyName,
          agencyCity: formData.agencyCity,
          agencyPhone: formData.agencyPhone,
          propertyTypes: formData.propertyTypes,
          agencyZone: formData.agencyZone
      }),
      ...(selectedProfile === 'Entreprise' && {
          companyName: formData.companyName,
          companyCity: formData.companyCity,
          companyPhone: formData.companyPhone,
          companyDomain: formData.companyDomain,
          companyServices: formData.companyServices,
          proposedSalary: formData.proposedSalary
      })
    };

    try {
      const success = await databaseService.saveInscription(inscriptionData);
      if (success) {
        // Initialize QR Code tracking status
        await databaseService.updateQRCodeActivation(formData.phone, {
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          profileType: selectedProfile,
          profession: formData.job || formData.equipmentType || formData.agencyName || formData.companyName,
          domain: formData.skillsDescription || formData.equipmentCategory || formData.propertyTypes || formData.companyDomain,
          status: "En attente paiement frais (310 FCFA)",
          fraisDossierPayes: false
        });
        
        setIsSaved(true);
        // Give a small delay so user can see the success state or just go directly
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (e) {
      console.error("Error saving inscription:", e);
      // Even if there's an error, we need to stop the spinner
    } finally {
      setIsSubmitting(false);
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
      if (selectedProfile) {
        setStep(2);
      }
    } else {
      handleSubmit();
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
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inscription Travailleur</h2>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Métier *</label>
              <input 
                id="job"
                type="text"
                value={formData.job}
                onChange={(e) => {
                    setFormData({...formData, job: e.target.value});
                    if (errors.includes('job')) setErrors(errors.filter(e => e !== 'job'));
                }}
                placeholder="Ex: Électricien, Menuisier..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('job') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">A appris : *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Sur le tas', 'Formation professionnelle', 'Diplôme'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                        setFormData({...formData, learnedFrom: opt as any});
                        if (errors.includes('learnedFrom')) setErrors(errors.filter(e => e !== 'learnedFrom'));
                    }}
                    className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.learnedFrom === opt ? 'bg-orange-500 border-orange-500 text-white shadow-md' : errors.includes('learnedFrom') ? 'bg-red-50 border-red-200 text-red-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Disponibilité *</label>
              <input 
                type="text"
                value={formData.availability}
                onChange={(e) => {
                    setFormData({...formData, availability: e.target.value});
                    if (errors.includes('availability')) setErrors(errors.filter(e => e !== 'availability'));
                }}
                placeholder="Ex: Lundi au Samedi, 8h-18h"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('availability') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Zone de déplacement *</label>
              <input 
                id="movementZone"
                type="text"
                value={formData.movementZone}
                onChange={(e) => {
                    setFormData({...formData, movementZone: e.target.value});
                    if (errors.includes('movementZone')) setErrors(errors.filter(e => e !== 'movementZone'));
                }}
                placeholder="Ex: Toute la ville, Cocody uniquement..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('movementZone') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Description du savoir-faire *</label>
              <textarea 
                id="skillsDescription"
                value={formData.skillsDescription}
                onChange={(e) => {
                    setFormData({...formData, skillsDescription: e.target.value});
                    if (errors.includes('skillsDescription')) setErrors(errors.filter(e => e !== 'skillsDescription'));
                }}
                placeholder="Décrivez vos compétences..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all min-h-[60px] ${errors.includes('skillsDescription') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
          </div>

        );
      case 'Propriétaire':
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inscription Propriétaire</h2>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Type d’équipement *</label>
              <input 
                type="text"
                value={formData.equipmentType}
                onChange={(e) => {
                    setFormData({...formData, equipmentType: e.target.value});
                    if (errors.includes('equipmentType')) setErrors(errors.filter(e => e !== 'equipmentType'));
                }}
                placeholder="Ex: Bétonnière, Échafaudage..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('equipmentType') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Catégorie d’équipement *</label>
              <input 
                type="text"
                value={formData.equipmentCategory}
                onChange={(e) => {
                    setFormData({...formData, equipmentCategory: e.target.value});
                    if (errors.includes('equipmentCategory')) setErrors(errors.filter(e => e !== 'equipmentCategory'));
                }}
                placeholder="Ex: Construction, Transport..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('equipmentCategory') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Quantité disponible *</label>
              <input 
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                    setFormData({...formData, quantity: e.target.value});
                    if (errors.includes('quantity')) setErrors(errors.filter(e => e !== 'quantity'));
                }}
                placeholder="Ex: 1"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('quantity') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Ville où l'équipement est situé *</label>
              <input 
                type="text"
                value={formData.equipmentCity}
                onChange={(e) => {
                    setFormData({...formData, equipmentCity: e.target.value});
                    if (errors.includes('equipmentCity')) setErrors(errors.filter(e => e !== 'equipmentCity'));
                }}
                placeholder="Ville de localisation"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('equipmentCity') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Prix de location en 1 jour *</label>
              <input 
                type="text"
                value={formData.rentalPrice}
                onChange={(e) => {
                    setFormData({...formData, rentalPrice: e.target.value});
                    if (errors.includes('rentalPrice')) setErrors(errors.filter(e => e !== 'rentalPrice'));
                }}
                placeholder="Ex: 5000 CFA"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('rentalPrice') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Description de l’équipement *</label>
              <textarea 
                value={formData.equipmentDescription}
                onChange={(e) => {
                    setFormData({...formData, equipmentDescription: e.target.value});
                    if (errors.includes('equipmentDescription')) setErrors(errors.filter(e => e !== 'equipmentDescription'));
                }}
                placeholder="Détails techniques, état..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all min-h-[50px] ${errors.includes('equipmentDescription') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
          </div>

        );
      case 'Agence':
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inscription Agence</h2>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Nom de l'agence *</label>
              <input 
                type="text"
                value={formData.agencyName}
                onChange={(e) => {
                    setFormData({...formData, agencyName: e.target.value});
                    if (errors.includes('agencyName')) setErrors(errors.filter(e => e !== 'agencyName'));
                }}
                placeholder="Nom de votre agence"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('agencyName') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Ville où l'agence est située *</label>
              <input 
                type="text"
                value={formData.agencyCity}
                onChange={(e) => {
                    setFormData({...formData, agencyCity: e.target.value});
                    if (errors.includes('agencyCity')) setErrors(errors.filter(e => e !== 'agencyCity'));
                }}
                placeholder="Ville du siège"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('agencyCity') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Numéro de l’agence *</label>
              <input 
                type="text"
                value={formData.agencyPhone}
                onChange={(e) => {
                    setFormData({...formData, agencyPhone: e.target.value});
                    if (errors.includes('agencyPhone')) setErrors(errors.filter(e => e !== 'agencyPhone'));
                }}
                placeholder="Téléphone de l'agence"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('agencyPhone') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Type de biens proposés : *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Appartement', 'Terrain', 'Automobile'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                        setFormData({...formData, propertyTypes: opt as any});
                        if (errors.includes('propertyTypes')) setErrors(errors.filter(e => e !== 'propertyTypes'));
                    }}
                    className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.propertyTypes === opt ? 'bg-orange-500 border-orange-500 text-white shadow-md' : errors.includes('propertyTypes') ? 'bg-red-50 border-red-200 text-red-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Zone d’activité *</label>
              <input 
                type="text"
                value={formData.agencyZone}
                onChange={(e) => {
                    setFormData({...formData, agencyZone: e.target.value});
                    if (errors.includes('agencyZone')) setErrors(errors.filter(e => e !== 'agencyZone'));
                }}
                placeholder="Ex: Abidjan, Côte Ouest..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('agencyZone') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
          </div>

        );
      case 'Entreprise':
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inscription Entreprise</h2>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Nom de l'entreprise *</label>
              <input 
                type="text"
                value={formData.companyName}
                onChange={(e) => {
                    setFormData({...formData, companyName: e.target.value});
                    if (errors.includes('companyName')) setErrors(errors.filter(e => e !== 'companyName'));
                }}
                placeholder="Ex: BTP Services CI"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('companyName') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Ville de l’entreprise *</label>
              <input 
                type="text"
                value={formData.companyCity}
                onChange={(e) => {
                    setFormData({...formData, companyCity: e.target.value});
                    if (errors.includes('companyCity')) setErrors(errors.filter(e => e !== 'companyCity'));
                }}
                placeholder="Ville du siège"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('companyCity') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Numéro de l’entreprise *</label>
              <input 
                type="text"
                value={formData.companyPhone}
                onChange={(e) => {
                    setFormData({...formData, companyPhone: e.target.value});
                    if (errors.includes('companyPhone')) setErrors(errors.filter(e => e !== 'companyPhone'));
                }}
                placeholder="Téléphone de l'entreprise"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('companyPhone') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Domaine d'activité *</label>
              <input 
                type="text"
                value={formData.companyDomain}
                onChange={(e) => {
                    setFormData({...formData, companyDomain: e.target.value});
                    if (errors.includes('companyDomain')) setErrors(errors.filter(e => e !== 'companyDomain'));
                }}
                placeholder="Ex: Bâtiment, Transport..."
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('companyDomain') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Services proposés *</label>
              <textarea 
                value={formData.companyServices}
                onChange={(e) => {
                    setFormData({...formData, companyServices: e.target.value});
                    if (errors.includes('companyServices')) setErrors(errors.filter(e => e !== 'companyServices'));
                }}
                placeholder="Décrivez vos services"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all min-h-[50px] ${errors.includes('companyServices') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Salaire proposé par mois ou semaine *</label>
              <input 
                type="text"
                value={formData.proposedSalary}
                onChange={(e) => {
                    setFormData({...formData, proposedSalary: e.target.value});
                    if (errors.includes('proposedSalary')) setErrors(errors.filter(e => e !== 'proposedSalary'));
                }}
                placeholder="Ex: 150 000 CFA / mois"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-2 px-4 text-slate-800 font-bold text-xs outline-none focus:border-orange-500 transition-all ${errors.includes('proposedSalary') ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}
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
                    className="w-full py-4 rounded-3xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-3 h-3" />
                    Modifier mes informations
                  </button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">Paiement sécurisé via Wave</p>
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
                    onClick={() => {
                      setSelectedProfile(profile.id as ProfileType);
                      setStep(2);
                    }}
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Nom complet (fixé)</label>
                    <input 
                      type="text"
                      value={formData.name}
                      readOnly
                      className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl py-2 px-4 text-slate-500 font-bold text-[11px] outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Ville actuelle (fixée)</label>
                    <input 
                      type="text"
                      value={formData.city}
                      readOnly
                      className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl py-2 px-4 text-slate-500 font-bold text-[11px] outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-1 block">Numéro personnel (fixé)</label>
                   <input 
                     type="text"
                     value={formData.phone}
                     readOnly
                     className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl py-2 px-4 text-slate-500 font-bold text-[11px] outline-none cursor-not-allowed opacity-80"
                   />
                </div>

                <div className="h-[2px] bg-slate-100 my-4"></div>

                <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Spécificités {selectedProfile}</h4>

                {renderCategoryFields()}
              </div>
            </div>
          )}
        </div>

        {!isSaved && (
          <div className="mt-auto pt-6 px-2">
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">!</span>
                  </div>
                  <p className="text-red-600 text-[10px] font-bold uppercase tracking-tight">
                    Veuillez remplir tous les champs obligatoires (*)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
