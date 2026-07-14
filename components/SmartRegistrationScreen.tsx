
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CityAutocompleteInput from './common/CityAutocompleteInput';
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
  onShowPopup?: (
    message: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string,
    title?: string
  ) => void;
  onGoToMenu?: () => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
  tutorialStep?: number;
  onUpdateTutorialStep?: (step: number) => void;
}

type ProfileType = 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise';

const SmartRegistrationScreen: React.FC<SmartRegistrationScreenProps> = ({ 
  onComplete, 
  onBack, 
  currentUser,
  onShowPopup,
  onGoToMenu,
  onRegisterBackHandler,
  tutorialStep,
  onUpdateTutorialStep
}) => {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | ''>(() => (tutorialStep === 3) ? '' : 'Travailleur');
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
    propertyTypes: '',
    agencyZone: '',
    // Entreprise
    companyName: '',
    companyCity: '',
    companyPhone: '',
    companyDomain: '',
    companyServices: '',
    proposedSalary: '',
    companyOwner: '',
    companyPoste: '',
    companyWorkersCount: '',
    companyContractType: '',
    companySalary: '',
    companyHours: '',
    companySkills: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleBackWithConfirmation = () => {
    if (tutorialStep === 3 || tutorialStep === 4) {
      if (onShowPopup) {
        onShowPopup(
          "Veuillez terminer votre inscription avant de quitter cette étape.",
          "alert"
        );
      } else {
        alert("Veuillez terminer votre inscription avant de quitter cette étape.");
      }
      return true; // handled, blocks navigation!
    }
    const hasStarted = step > 1 || formData.name !== '' || formData.city !== '' || formData.job !== '' || formData.equipmentType !== '' || formData.agencyName !== '' || formData.companyName !== '';
    if (hasStarted && !isSaved) {
      if (onShowPopup && onGoToMenu) {
        onShowPopup(
          "Les informations non enregistrées seront perdues.",
          "confirm",
          (close) => {
            close();
            // Clear local draft so they can start fresh next time
            localStorage.removeItem('filant_registration_draft');
            onGoToMenu();
          },
          "Quitter",
          "Continuer la saisie",
          "Quitter ce formulaire ?"
        );
      } else {
        const confirmExit = window.confirm("Quitter ce formulaire ? Les informations non enregistrées seront perdues.");
        if (confirmExit) {
          localStorage.removeItem('filant_registration_draft');
          if (onGoToMenu) onGoToMenu(); else onBack();
        }
      }
      return true; // handled
    }
    onBack();
    return true; // handled
  };

  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(handleBackWithConfirmation);
      return () => {
        onRegisterBackHandler(null);
      };
    }
  }, [onRegisterBackHandler, step, formData, isSaved, onBack, onGoToMenu, onShowPopup]);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        setIsKeyboardVisible(window.visualViewport.height < window.innerHeight - 150);
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

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

  const getInputClass = (fieldName: string) => {
    const hasError = errors.includes(fieldName);
    return `w-full bg-white border-2 rounded-2xl py-3 px-4 text-black font-semibold text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all ${
      hasError ? 'border-red-500 bg-red-55/30' : 'border-blue-500'
    }`;
  };

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
      if (!formData.companyOwner) newErrors.push('companyOwner');
      if (!formData.companyPoste) newErrors.push('companyPoste');
      if (!formData.companyWorkersCount) newErrors.push('companyWorkersCount');
      if (!formData.companyContractType) newErrors.push('companyContractType');
      if (!formData.companySalary) newErrors.push('companySalary');
      if (!formData.companyHours) newErrors.push('companyHours');
      if (!formData.companySkills) newErrors.push('companySkills');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert("Veuillez remplir tous les champs obligatoires (indiqués par une étoile).");
        }
        return;
    }

    setIsSubmitting(true);
    
    // Safety timer to prevent stuck loading state (20s)
    const safetyTimer = setTimeout(() => {
        setIsSubmitting(false);
        // We don't alert here to avoid double alerts if it eventually finishes or fails
        console.warn("Submission is taking longer than expected...");
    }, 20000);

    try {
        let currentProfileImageUrl = formData.profileImageUrl;

        const inscriptionData: any = {
          profileType: selectedProfile,
          name: formData.name,
          city: formData.city,
          phone: formData.phone,
          profileImageUrl: currentProfileImageUrl,
          registrationStatus: 'pending',
          submissionType: 'SmartRegistration',
          submittedAt: new Date().toISOString(),
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
              companyOwner: formData.companyOwner,
              companyPoste: formData.companyPoste,
              companyWorkersCount: formData.companyWorkersCount,
              companyContractType: formData.companyContractType,
              companySalary: formData.companySalary,
              companyHours: formData.companyHours,
              companySkills: formData.companySkills,
              companyDomain: formData.companyPoste,
              companyServices: formData.companySkills,
              proposedSalary: formData.companySalary
          })
        };

        // Sanitize to prevent Firestore 'undefined value' crash
        const cleanedInscriptionData = Object.fromEntries(
          Object.entries(inscriptionData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        console.log("Submitting inscription data:", cleanedInscriptionData);
        const success = await databaseService.saveInscription(cleanedInscriptionData);
        
        if (success) {
            console.log("Inscription saved successfully, updating QR code activation...");
            try {
              await databaseService.updateQRCodeActivation(formData.phone, {
                name: formData.name,
                phone: formData.phone,
                city: formData.city,
                profileType: selectedProfile,
                profession: formData.job || formData.equipmentType || formData.agencyName || formData.companyName || '',
                domain: formData.skillsDescription || formData.equipmentCategory || formData.propertyTypes || formData.companyDomain || '',
                status: "En attente paiement frais (310 FCFA)",
                fraisDossierPayes: false,
                updatedAt: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Could not update QR code activation right now:", e);
            }
            
            clearTimeout(safetyTimer);
            setIsSubmitting(false); 
            setIsSaved(true);
            localStorage.removeItem('filant_registration_draft');
            
            setTimeout(() => {
              onComplete();
            }, 1200);
        } else {
            clearTimeout(safetyTimer);
            setIsSubmitting(false);
            alert("Une erreur est survenue lors de l'enregistrement de l'inscription. Veuillez vérifier votre connexion.");
        }
    } catch (e) {
        clearTimeout(safetyTimer);
        console.error("Critical error saving inscription:", e);
        setIsSubmitting(false);
        alert("Une erreur inattendue est survenue. Veuillez réessayer.");
    }
  };

  const handlePayRegistration = () => {
      setPaymentInitiated(true);
      if (tutorialStep === 4 && onUpdateTutorialStep) {
          onUpdateTutorialStep(5);
      }
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
        if (tutorialStep === 3 && onUpdateTutorialStep) {
          onUpdateTutorialStep(4);
        }
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
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Métier *</label>
              <input 
                id="job"
                type="text"
                value={formData.job}
                onChange={(e) => {
                    setFormData({...formData, job: e.target.value});
                    if (errors.includes('job')) setErrors(errors.filter(e => e !== 'job'));
                }}
                placeholder="Ex: Électricien, Menuisier..."
                className={getInputClass('job')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">A appris : *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Sur le tas', 'Formation professionnelle', 'Diplôme'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                        setFormData({...formData, learnedFrom: opt as any});
                        if (errors.includes('learnedFrom')) setErrors(errors.filter(e => e !== 'learnedFrom'));
                    }}
                    className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.learnedFrom === opt ? 'bg-orange-500 border-orange-500 text-white shadow-md' : errors.includes('learnedFrom') ? 'bg-red-50 border-red-200 text-red-500 font-bold' : 'bg-white border-blue-500/60 text-black'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Disponibilité *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Toujours disponible', 'Disponible en permanence'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                        setFormData({...formData, availability: opt});
                        if (errors.includes('availability')) setErrors(errors.filter(e => e !== 'availability'));
                    }}
                    className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.availability === opt ? 'bg-orange-500 border-orange-500 text-white shadow-md' : errors.includes('availability') ? 'bg-red-50 border-red-200 text-red-500 font-bold' : 'bg-white border-blue-500/60 text-black'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Zone de déplacement *</label>
              <CityAutocompleteInput 
                id="movementZone"
                value={formData.movementZone}
                onChange={(val) => {
                    setFormData({...formData, movementZone: val});
                    if (errors.includes('movementZone')) setErrors(errors.filter(e => e !== 'movementZone'));
                }}
                placeholder="Ex: Toute la ville, Cocody uniquement..."
                inputClassName={getInputClass('movementZone')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Description du savoir-faire *</label>
              <textarea 
                id="skillsDescription"
                value={formData.skillsDescription}
                onChange={(e) => {
                    setFormData({...formData, skillsDescription: e.target.value});
                    if (errors.includes('skillsDescription')) setErrors(errors.filter(e => e !== 'skillsDescription'));
                }}
                placeholder="Décrivez vos compétences..."
                className={`${getInputClass('skillsDescription')} min-h-[80px]`}
              />
            </div>
          </div>
        );
      case 'Propriétaire':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Type d’équipement *</label>
              <input 
                type="text"
                value={formData.equipmentType}
                onChange={(e) => {
                    setFormData({...formData, equipmentType: e.target.value});
                    if (errors.includes('equipmentType')) setErrors(errors.filter(e => e !== 'equipmentType'));
                }}
                placeholder="Ex: Bétonnière, Échafaudage..."
                className={getInputClass('equipmentType')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Catégorie d’équipement *</label>
              <input 
                type="text"
                value={formData.equipmentCategory}
                onChange={(e) => {
                    setFormData({...formData, equipmentCategory: e.target.value});
                    if (errors.includes('equipmentCategory')) setErrors(errors.filter(e => e !== 'equipmentCategory'));
                }}
                placeholder="Ex: Construction, Transport..."
                className={getInputClass('equipmentCategory')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Quantité disponible *</label>
              <input 
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.quantity}
                onChange={(e) => {
                    setFormData({...formData, quantity: e.target.value});
                    if (errors.includes('quantity')) setErrors(errors.filter(e => e !== 'quantity'));
                }}
                placeholder="Ex: 1"
                className={getInputClass('quantity')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Ville où l'équipement est situé *</label>
              <CityAutocompleteInput 
                id="equipmentCity"
                value={formData.equipmentCity || ''}
                onChange={(val) => {
                    setFormData({...formData, equipmentCity: val});
                    if (errors.includes('equipmentCity')) setErrors(errors.filter(e => e !== 'equipmentCity'));
                }}
                placeholder="Ville de localisation"
                inputClassName={getInputClass('equipmentCity')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Prix de location en 1 jour *</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={formData.rentalPrice}
                onChange={(e) => {
                    setFormData({...formData, rentalPrice: e.target.value});
                    if (errors.includes('rentalPrice')) setErrors(errors.filter(e => e !== 'rentalPrice'));
                }}
                placeholder="Ex: 5000"
                className={getInputClass('rentalPrice')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Description de l’équipement *</label>
              <textarea 
                value={formData.equipmentDescription}
                onChange={(e) => {
                    setFormData({...formData, equipmentDescription: e.target.value});
                    if (errors.includes('equipmentDescription')) setErrors(errors.filter(e => e !== 'equipmentDescription'));
                }}
                placeholder="Détails techniques, état..."
                className={`${getInputClass('equipmentDescription')} min-h-[80px]`}
              />
            </div>
          </div>
        );
      case 'Agence':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Nom de l'agence *</label>
              <input 
                type="text"
                value={formData.agencyName}
                onChange={(e) => {
                    setFormData({...formData, agencyName: e.target.value});
                    if (errors.includes('agencyName')) setErrors(errors.filter(e => e !== 'agencyName'));
                }}
                placeholder="Nom de votre agence"
                className={getInputClass('agencyName')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Ville où l'agence est située *</label>
              <CityAutocompleteInput 
                id="agencyCity"
                value={formData.agencyCity || ''}
                onChange={(val) => {
                    setFormData({...formData, agencyCity: val});
                    if (errors.includes('agencyCity')) setErrors(errors.filter(e => e !== 'agencyCity'));
                }}
                placeholder="Ville du siège"
                inputClassName={getInputClass('agencyCity')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Numéro de l’agence *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400 select-none flex items-center gap-1">
                  <span>🇨🇮</span>
                  <span>+225</span>
                </span>
                <input 
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9]*"
                  value={formData.agencyPhone}
                  onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, agencyPhone: clean});
                      if (errors.includes('agencyPhone')) setErrors(errors.filter(e => e !== 'agencyPhone'));
                  }}
                  placeholder="0701020304"
                  className={`${getInputClass('agencyPhone')} pl-20 text-sm font-semibold`}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Type de biens proposés : *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Appartement', 'Terrain', 'Automobile'].map((opt) => {
                  const selectedTypes = formData.propertyTypes ? formData.propertyTypes.split(',').map(s => s.trim()) : [];
                  const isSelected = selectedTypes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                          let newTypes: string[];
                          if (isSelected) {
                              newTypes = selectedTypes.filter(t => t !== opt);
                          } else {
                              newTypes = [...selectedTypes, opt];
                          }
                          const newPropertyTypesString = newTypes.join(', ');
                          setFormData({...formData, propertyTypes: newPropertyTypesString});
                          if (errors.includes('propertyTypes')) setErrors(errors.filter(e => e !== 'propertyTypes'));
                      }}
                      className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-md' : errors.includes('propertyTypes') ? 'bg-red-50 border-red-200 text-red-500 font-bold' : 'bg-white border-blue-500/60 text-black'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Zone d’activité *</label>
              <CityAutocompleteInput 
                id="agencyZone"
                value={formData.agencyZone}
                onChange={(val) => {
                    setFormData({...formData, agencyZone: val});
                    if (errors.includes('agencyZone')) setErrors(errors.filter(e => e !== 'agencyZone'));
                }}
                placeholder="Ex: Abidjan, Côte Ouest..."
                inputClassName={getInputClass('agencyZone')}
              />
            </div>
          </div>
        );
      case 'Entreprise':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Nom de l'entreprise *</label>
              <input 
                type="text"
                value={formData.companyName}
                onChange={(e) => {
                    setFormData({...formData, companyName: e.target.value});
                    if (errors.includes('companyName')) setErrors(errors.filter(e => e !== 'companyName'));
                }}
                placeholder="Ex: BTP Services CI"
                className={getInputClass('companyName')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Nom du responsable ou propriétaire *</label>
              <input 
                type="text"
                value={formData.companyOwner}
                onChange={(e) => {
                    setFormData({...formData, companyOwner: e.target.value});
                    if (errors.includes('companyOwner')) setErrors(errors.filter(e => e !== 'companyOwner'));
                }}
                placeholder="Ex: Mael Kouadio"
                className={getInputClass('companyOwner')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Ville de l’entreprise *</label>
              <CityAutocompleteInput 
                id="companyCity"
                value={formData.companyCity || ''}
                onChange={(val) => {
                    setFormData({...formData, companyCity: val});
                    if (errors.includes('companyCity')) setErrors(errors.filter(e => e !== 'companyCity'));
                }}
                placeholder="Ville du siège"
                inputClassName={getInputClass('companyCity')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Numéro de l’entreprise *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400 select-none flex items-center gap-1">
                  <span>🇨🇮</span>
                  <span>+225</span>
                </span>
                <input 
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9]*"
                  value={formData.companyPhone}
                  onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, companyPhone: clean});
                      if (errors.includes('companyPhone')) setErrors(errors.filter(e => e !== 'companyPhone'));
                  }}
                  placeholder="0701020304"
                  className={`${getInputClass('companyPhone')} pl-20 text-sm font-semibold`}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Poste recherché *</label>
              <input 
                type="text"
                value={formData.companyPoste}
                onChange={(e) => {
                    setFormData({...formData, companyPoste: e.target.value});
                    if (errors.includes('companyPoste')) setErrors(errors.filter(e => e !== 'companyPoste'));
                }}
                placeholder="Ex: Serveur, Cuisinier, Livreur..."
                className={getInputClass('companyPoste')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Nombre de travailleurs recherchés *</label>
              <input 
                type="number"
                min="1"
                value={formData.companyWorkersCount}
                onChange={(e) => {
                    setFormData({...formData, companyWorkersCount: e.target.value});
                    if (errors.includes('companyWorkersCount')) setErrors(errors.filter(e => e !== 'companyWorkersCount'));
                }}
                placeholder="Ex: 5"
                className={getInputClass('companyWorkersCount')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Type de contrat *</label>
              <select
                value={formData.companyContractType}
                onChange={(e) => {
                    setFormData({...formData, companyContractType: e.target.value});
                    if (errors.includes('companyContractType')) setErrors(errors.filter(e => e !== 'companyContractType'));
                }}
                className={getInputClass('companyContractType')}
              >
                <option value="">Sélectionner un contrat</option>
                <option value="Temps plein">Temps plein</option>
                <option value="Temps partiel">Temps partiel</option>
                <option value="Temporaire">Temporaire</option>
                <option value="Stage">Stage</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Salaire proposé *</label>
              <input 
                type="text"
                value={formData.companySalary}
                onChange={(e) => {
                    setFormData({...formData, companySalary: e.target.value});
                    if (errors.includes('companySalary')) setErrors(errors.filter(e => e !== 'companySalary'));
                }}
                placeholder="Ex: 150 000 FCFA / mois"
                className={getInputClass('companySalary')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Horaires de travail *</label>
              <input 
                type="text"
                value={formData.companyHours}
                onChange={(e) => {
                    setFormData({...formData, companyHours: e.target.value});
                    if (errors.includes('companyHours')) setErrors(errors.filter(e => e !== 'companyHours'));
                }}
                placeholder="Ex: 8H00 - 17H00, Lun au Ven"
                className={getInputClass('companyHours')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1 mb-1.5 block">Compétences recherchées *</label>
              <textarea 
                value={formData.companySkills}
                onChange={(e) => {
                    setFormData({...formData, companySkills: e.target.value});
                    if (errors.includes('companySkills')) setErrors(errors.filter(e => e !== 'companySkills'));
                }}
                placeholder="Ex: Ponctualité, rigueur, expérience en vente..."
                className={`${getInputClass('companySkills')} min-h-[90px]`}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isStep2Form = step === 2 && !isSaved;

  return (
    <div className={`flex flex-col h-full font-sans overflow-y-auto scrollbar-hide transition-colors duration-300 ${isStep2Form ? 'bg-white text-slate-900' : 'bg-[#0f172a] text-white'}`}>
      {/* Header */}
      {!isStep2Form ? (
        <header className={`px-6 flex flex-col items-center text-center relative shrink-0 transition-all duration-300 ${isKeyboardVisible ? 'pt-4 pb-2' : 'pt-8 pb-6'}`}>
          <button 
            type="button"
            onClick={handleBackWithConfirmation}
            className={`absolute left-6 p-2 bg-white/10 rounded-xl active:scale-90 transition-all text-white ${isKeyboardVisible ? 'top-4' : 'top-8'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 mb-2">
            <span className="text-orange-500 font-black text-3xl tracking-tighter transition-all duration-300">FILANT</span>
            <span className="text-white font-bold text-3xl tracking-tighter opacity-90">225</span>
          </div>
          <h2 className={`font-medium text-white/90 transition-all duration-300 ${isKeyboardVisible ? 'text-xs' : 'text-lg'}`}>Inscription intelligente</h2>
          <p className={`text-gray-400 text-xs mt-2 max-w-[280px] transition-all duration-300 overflow-hidden ${isKeyboardVisible ? 'h-0 mt-0 opacity-0' : 'h-auto opacity-100'}`}>
            Nous vous invitons à vous inscrire sur la plateforme afin d’être rapidement mis en relation avec des clients.
          </p>
          <p className={`text-gray-500 text-[10px] mt-1 italic font-light tracking-tight transition-all duration-300 overflow-hidden ${isKeyboardVisible ? 'h-0 mt-0 opacity-0' : 'h-auto opacity-100'}`}>
            Frais d’inscription : 310.CFA fin
          </p>
        </header>
      ) : (
        <header className={`px-6 flex flex-col items-start relative border-b border-slate-100 bg-white shrink-0 transition-all duration-300 ${isKeyboardVisible ? 'pt-3 pb-3' : 'pt-6 pb-4'}`}>
          <button 
            type="button"
            onClick={() => setStep(1)}
            className="p-2 bg-slate-100 rounded-xl active:scale-90 transition-all text-slate-800 hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className={`text-left transition-all duration-300 overflow-hidden ${isKeyboardVisible ? 'h-0 mt-0 opacity-0' : 'mt-4 h-auto opacity-100'}`}>
            <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">INSCRIPTION</h2>
            <p className="text-slate-500 text-xs mt-1">
              Complétez vos coordonnées et spécificités de <span className="text-blue-600 font-bold">{selectedProfile}</span>.
            </p>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className={`flex-1 flex flex-col ${isStep2Form ? 'p-0 bg-white w-full' : 'px-4 pb-10'}`}>
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`flex flex-col flex-1 ${
            isStep2Form 
              ? 'bg-white p-6 w-full max-w-xl mx-auto' 
              : 'bg-white rounded-[2.5rem] shadow-2xl p-6 min-h-[500px]'
          }`}
        >
          {/* Connexion Rapide & Progress */}
          <div className="flex justify-between items-center mb-8 px-2 shrink-0">
            <span className="text-slate-850 font-black text-sm uppercase tracking-wider">
              {isStep2Form ? "Étape 2 sur 2" : "Connexion rapide"}
            </span>
            <div className="flex gap-1">
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${selectedProfile ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          {!isStep2Form && (
            <div className="text-center mb-8 shrink-0">
              <h1 className="text-slate-900 font-black text-3xl tracking-tighter mb-1 uppercase">INSCRIPTION</h1>
              <h3 className="text-slate-400 font-bold text-sm tracking-widest uppercase">ÉTAPE {step} : {step === 1 ? 'PROFIL' : 'INFORMATION'}</h3>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide px-1">
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
                      type="button"
                      onClick={handlePayRegistration}
                      disabled={paymentInitiated}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                    >
                      {paymentInitiated ? 'Redirection Wave...' : 'Payer les frais (310 FCFA)'}
                      {!paymentInitiated && <ArrowRight className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
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
              <div className="px-2 mb-6 relative">
                {tutorialStep === 3 && !selectedProfile && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-[1400] pointer-events-none animate-bounce">
                    <div className="bg-yellow-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap mb-1.5 uppercase tracking-wider">
                      Choisissez une catégorie !
                    </div>
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
                <h4 className="text-slate-600 font-black text-xs uppercase tracking-[0.2em] mb-4">QUI ÊTES-VOUS ?</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      disabled={!profile.active}
                      onClick={() => {
                        setSelectedProfile(profile.id as ProfileType);
                        if (tutorialStep === 3 && onUpdateTutorialStep) {
                          onUpdateTutorialStep(4);
                        }
                      }}
                      className={`
                        relative p-4 rounded-3xl border-2 transition-all duration-300 text-left flex flex-col justify-between h-[120px]
                        ${!profile.active ? 'bg-slate-50 border-slate-100 opacity-60' : 
                          selectedProfile === profile.id ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/10' : 
                          tutorialStep === 3 ? 'bg-yellow-50/50 border-yellow-300 animate-pulse' : 'bg-slate-50 border-slate-200'}
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
                <h4 className="text-slate-800 font-black text-xs uppercase tracking-[0.2em] mb-4">VOS DÉTAILS PERSONNELS</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1 mb-1.5 block">Nom complet (fixé)</label>
                      <input 
                        type="text"
                        value={formData.name}
                        readOnly
                        className="w-full bg-slate-150 border-2 border-slate-300 rounded-2xl py-3 px-4 text-slate-800 font-black text-xs outline-none cursor-not-allowed opacity-90"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1 mb-1.5 block">Ville actuelle (fixée)</label>
                      <input 
                        type="text"
                        value={formData.city}
                        readOnly
                        className="w-full bg-slate-150 border-2 border-slate-300 rounded-2xl py-3 px-4 text-slate-800 font-black text-xs outline-none cursor-not-allowed opacity-90"
                      />
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1 mb-1.5 block">Numéro personnel (fixé)</label>
                     <div className="relative bg-slate-150 border-2 border-slate-300 rounded-2xl flex items-center opacity-90">
                       <span className="pl-4 text-xs font-black text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                         <span>🇨🇮</span>
                         <span>+225</span>
                       </span>
                       <input 
                         type="text"
                         value={formData.phone}
                         readOnly
                         className="w-full bg-transparent py-3 pl-4 pr-4 text-slate-800 font-black text-xs outline-none cursor-not-allowed"
                       />
                     </div>
                  </div>

                  <div className="h-[2px] bg-slate-100 my-4"></div>

                  <h4 className="text-slate-800 font-black text-xs uppercase tracking-[0.2em] mb-4">Spécificités {selectedProfile}</h4>

                  {renderCategoryFields()}
                </div>
              </div>
            )}
          </div>

          {!isSaved && (
            <div className="mt-auto pt-6 px-2 shrink-0 relative">
              {step === 1 && tutorialStep === 3 && selectedProfile && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-[1400] pointer-events-none animate-bounce">
                  <div className="bg-yellow-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap mb-1.5 uppercase tracking-wider">
                    Cliquez sur Suivant !
                  </div>
                  <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
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
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || (step === 1 && !selectedProfile)}
                className={`w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.3)] ${
                  step === 1 && tutorialStep === 3 && selectedProfile ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                }`}
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
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
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
