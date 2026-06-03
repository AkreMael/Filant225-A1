import React, { useState, useEffect } from 'react';
import { User, Tab } from '../types';
import { databaseService } from '../services/databaseService';
import { ArrowLeft, Search, Loader2, Compass, MapPin, Briefcase, Building, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';

interface InscriptionResult {
  id: string;
  name: string;
  city: string;
  profileType: 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise';
  titleOrActivity: string;
  description?: string;
}

interface DemandeRechercheScreenProps {
  onBack: () => void;
  user: User;
  onSelectTab: (tab: Tab) => void;
}

export const DemandeRechercheScreen: React.FC<DemandeRechercheScreenProps> = ({ onBack, user, onSelectTab }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InscriptionResult[] | null>(null);
  const [inscriptionsFromDB, setInscriptionsFromDB] = useState<any[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // New subpath states for "Demande de service" form
  const [selectedItemForForm, setSelectedItemForForm] = useState<InscriptionResult | null>(null);

  // Agence fields
  const [agenceTypeBien, setAgenceTypeBien] = useState<'Appartement' | 'Terrain' | 'Bureau' | 'Local commercial'>('Appartement');
  const [agenceZone, setAgenceZone] = useState('');

  // Travailleur fields
  const [travailleurMode, setTravailleurMode] = useState<'Embauche' | 'Service rapide'>('Embauche');
  const [travailleurJours, setTravailleurJours] = useState(1);
  const [travailleurStep, setTravailleurStep] = useState(0); // 0: mode choice & days, 1: city, 2: salary/budget, 3: description
  const [travailleurCity, setTravailleurCity] = useState('');
  const [travailleurSalaryOrBudget, setTravailleurSalaryOrBudget] = useState('');
  const [travailleurDesc, setTravailleurDesc] = useState('');

  // Propriétaire (Équipement) fields
  const [equipStep, setEquipStep] = useState(0); // 0: city, 1: days, 2: budget, 3: details
  const [equipCity, setEquipCity] = useState('');
  const [equipDays, setEquipDays] = useState('1 jour');
  const [equipBudget, setEquipBudget] = useState('');
  const [equipDesc, setEquipDesc] = useState('');

  // Entreprise fields
  const [entrepriseNeed, setEntrepriseNeed] = useState('');

  // Form error message helper
  const [formErrors, setFormErrors] = useState<string>('');

  // Days list constant matching system
  const DURATION_DAYS_OPTIONS = [
    ...Array.from({ length: 14 }, (_, i) => {
      const d = i + 1;
      return { label: `${d} jour${d > 1 ? 's' : ''}`, value: `${d} jour${d > 1 ? 's' : ''}` };
    }),
    { label: 'Par mois', value: 'Par mois' }
  ];

  // Parse current user safe ID
  const chatUserId = ((user.phone || '').replace(/\D/g, '') || user.userId || user.id || 'anonymous_user');

  // Pre-fetch real Inscriptions from Firestore
  useEffect(() => {
    const fetchDBInscriptions = async () => {
      try {
        const data = await databaseService.getInscriptions();
        if (data && Array.isArray(data)) {
          setInscriptionsFromDB(data);
        }
      } catch (e) {
        console.error("Error fetching live inscriptions:", e);
      }
    };
    fetchDBInscriptions();
  }, []);

  const handleSearch = () => {
    const term = queryInput.trim();
    if (!term) return;

    setIsLoading(true);
    setResults(null);

    // Exact loading duration around 3 seconds (3000ms)
    setTimeout(() => {
      executeDatabaseSearch(term);
      setIsLoading(false);
    }, 3000);
  };

  const executeDatabaseSearch = (term: string) => {
    const normalizedTerm = term.toLowerCase();

    // Search exclusively in Firestore Inscriptions
    const matches: InscriptionResult[] = inscriptionsFromDB
      .filter((item: any) => {
        // Exclude disabled inscriptions
        if (item.isActive === false) return false;

        // Collect all text from fields that are relevant for search
        const textToSearch = [
          item.name,
          item.city,
          item.profileType,
          item.job,
          item.equipmentType,
          item.equipmentCategory,
          item.agencyName,
          item.propertyTypes,
          item.companyName,
          item.companyDomain,
          item.companyServices,
          item.equipmentDescription,
          item.skillsDescription
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return textToSearch.includes(normalizedTerm);
      })
      .map((item: any) => {
        // Map individual profileType properties into a clean structured display title
        let titleOrActivity = '';
        if (item.profileType === 'Travailleur') {
          titleOrActivity = item.job || 'Travailleur Qualifié';
        } else if (item.profileType === 'Propriétaire') {
          titleOrActivity = `${item.equipmentType || item.equipmentCategory || 'Équipement'}`;
        } else if (item.profileType === 'Agence' || item.profileType === 'Agence immobilière') {
          titleOrActivity = item.agencyName || 'Agence Immobilière';
          if (item.propertyTypes) {
            titleOrActivity += ` (${item.propertyTypes})`;
          }
        } else if (item.profileType === 'Entreprise') {
          titleOrActivity = item.companyName || 'Entreprise';
          if (item.companyDomain) {
            titleOrActivity += ` (${item.companyDomain})`;
          }
        }

        return {
          id: item.id || Math.random().toString(),
          name: item.name || item.agencyName || item.companyName || 'Prestataire',
          city: item.city || item.agencyCity || item.companyCity || item.equipmentCity || 'Non spécifié',
          profileType: (item.profileType === 'Agence immobilière' ? 'Agence' : item.profileType) || 'Travailleur',
          titleOrActivity,
          description: item.skillsDescription || item.equipmentDescription || item.companyServices || ''
        };
      });

    setResults(matches);
  };

  const handleSuccessSubmission = async (
    item: InscriptionResult,
    amountPaid: number,
    chatMsgText: string,
    answersData: Record<string, any>
  ) => {
    setIsLinking(true);
    try {
      const serviceRequestData = {
        userId: chatUserId,
        userName: user.name || 'Utilisateur',
        phone: user.phone || 'Non spécifié',
        city: user.city || 'Non spécifiée',
        serviceTitle: `Demande de service : ${item.titleOrActivity}`,
        formType: 'service_request_search',
        answers: {
          'Nom du prestataire': item.name,
          'Ville du prestataire': item.city,
          'Activité recherchée': item.titleOrActivity,
          'Type de profil': item.profileType,
          ...answersData
        },
        totalPrice: amountPaid,
        readStatus: 'NON LU',
        prestataireName: item.name,
        prestataireCity: item.city,
        prestataireActivity: item.titleOrActivity
      };

      // 1. Save Service Request to Firestore
      await databaseService.saveServiceRequest(serviceRequestData);

      // 2. Format custom chat message
      const chatMsg = {
        sender: 'user' as const,
        text: chatMsgText,
        timestamp: Date.now()
      };

      // 3. Save Private Chat Message
      await databaseService.savePrivateChatMessage(chatUserId, chatMsg);

      // Reset fields upon success
      setSelectedItemForForm(null);
      setAgenceZone('');
      setTravailleurCity('');
      setTravailleurSalaryOrBudget('');
      setTravailleurDesc('');
      setTravailleurStep(0);
      setEquipCity('');
      setEquipDays('1 jour');
      setEquipBudget('');
      setEquipDesc('');
      setEquipStep(0);
      setEntrepriseNeed('');

      // 4. Trigger tab switch to Chat screen
      onSelectTab(Tab.UserChat);
    } catch (error) {
      console.error("Error creating service request connection:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleAgenceSubmit = () => {
    if (!agenceZone.trim()) {
      setFormErrors('Veuillez remplir le champ Zone ou lieu recherché');
      return;
    }
    setFormErrors('');
    const amount = 530;
    const typeBien = agenceTypeBien;
    const zone = agenceZone.trim();

    if (!selectedItemForForm) return;

    const chatMsgText = `📢 *Nouvelle Demande de Service (Location de Biens)*\n\n` +
      `Je souhaite être mis en relation avec l'agence suivante :\n\n` +
      `• *Agence :* ${selectedItemForForm.name}\n` +
      `• *Ville :* ${selectedItemForForm.city}\n\n` +
      `*Spécificités :*\n` +
      `• *Type de bien :* ${typeBien}\n` +
      `• *Zone recherchée :* ${zone}\n\n` +
      `*Frais de mise en relation :* 530 FCFA (payés)`;

    const answersData = {
      'Type de bien recherché': typeBien,
      'Zone ou lieu recherché': zone
    };

    window.dispatchEvent(new CustomEvent('trigger-payment-view', {
      detail: {
        title: selectedItemForForm.name,
        amount: amount.toString(),
        paymentType: "Mise en relation",
        waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`,
        onSuccess: () => {
          handleSuccessSubmission(selectedItemForForm, amount, chatMsgText, answersData);
        }
      }
    }));
  };

  const handleTravailleurSubmit = () => {
    if (!travailleurDesc.trim()) {
      setFormErrors('Veuillez spécifier la description de votre demande.');
      return;
    }
    setFormErrors('');
    const amount = travailleurMode === 'Embauche' ? 6530 : Math.min(travailleurJours * 653, 6530);

    if (!selectedItemForForm) return;

    const chatMsgText = `📢 *Nouvelle Demande de Service (Travailleur)*\n\n` +
      `Je souhaite être mis en relation avec le travailleur suivant :\n\n` +
      `• *Nom :* ${selectedItemForForm.name}\n` +
      `• *Ville :* ${selectedItemForForm.city}\n` +
      `• *Activité/Métier :* ${selectedItemForForm.titleOrActivity}\n\n` +
      `*Spécificités :*\n` +
      `• *Contrat :* ${travailleurMode}\n` +
      (travailleurMode === 'Service rapide' ? `• *Durée :* ${travailleurJours} jour${travailleurJours > 1 ? 's' : ''}\n` : '') +
      `• *Lieu d'exercice :* ${travailleurCity.trim()}\n` +
      `• *Salaire/Budget proposé :* ${travailleurSalaryOrBudget.trim()}\n` +
      `• *Description du besoin :* ${travailleurDesc.trim()}\n\n` +
      `*Frais de mise en relation :* ${amount} FCFA (payés)`;

    const answersData = {
      'Type de contrat': travailleurMode,
      'Nombre de jours': travailleurMode === 'Service rapide' ? travailleurJours : 'N/A',
      'Lieu d\'exercice': travailleurCity.trim(),
      'Salaire ou Budget': travailleurSalaryOrBudget.trim(),
      'Description du besoin': travailleurDesc.trim()
    };

    window.dispatchEvent(new CustomEvent('trigger-payment-view', {
      detail: {
        title: selectedItemForForm.name,
        amount: amount.toString(),
        paymentType: "Mise en relation",
        waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`,
        onSuccess: () => {
          handleSuccessSubmission(selectedItemForForm, amount, chatMsgText, answersData);
        }
      }
    }));
  };

  const handleEquipSubmit = () => {
    if (!equipDesc.trim()) {
      setFormErrors('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }
    setFormErrors('');
    const amount = 530;

    if (!selectedItemForForm) return;

    const chatMsgText = `📢 *Nouvelle Demande de Service (Location Équipement)*\n\n` +
      `Je souhaite louer l'équipement de ce prestataire :\n\n` +
      `• *Prestataire :* ${selectedItemForForm.name}\n` +
      `• *Ville :* ${selectedItemForForm.city}\n` +
      `• *Équipement :* ${selectedItemForForm.titleOrActivity}\n\n` +
      `*Détails de la réservation :*\n` +
      `• *Ville d'utilisation :* ${equipCity.trim()}\n` +
      `• *Durée :* ${equipDays}\n` +
      `• *Budget prévu :* ${equipBudget.trim()}\n` +
      `• *Matériel options souhaitées :* ${equipDesc.trim()}\n\n` +
      `*Frais de mise en relation :* 530 FCFA (payés)`;

    const answersData = {
      'Ville d\'utilisation': equipCity.trim(),
      'Durée de location': equipDays,
      'Budget prévu': equipBudget.trim(),
      'Matériel options souhaitées': equipDesc.trim()
    };

    window.dispatchEvent(new CustomEvent('trigger-payment-view', {
      detail: {
        title: selectedItemForForm.name,
        amount: amount.toString(),
        paymentType: "Mise en relation",
        waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`,
        onSuccess: () => {
          handleSuccessSubmission(selectedItemForForm, amount, chatMsgText, answersData);
        }
      }
    }));
  };

  const handleEntrepriseSubmit = () => {
    if (!entrepriseNeed.trim()) {
      setFormErrors('Veuillez décrire le service demandé à l\'entreprise.');
      return;
    }
    setFormErrors('');
    const amount = 230;

    if (!selectedItemForForm) return;

    const chatMsgText = `📢 *Nouvelle Demande de Service (Entreprise)*\n\n` +
      `Je souhaite collaborer avec l'entreprise suivante :\n\n` +
      `• *Nom d'entreprise :* ${selectedItemForForm.name}\n` +
      `• *Ville :* ${selectedItemForForm.city}\n\n` +
      `*Détails du besoin :*\n` +
      `• *Service demandé :* ${entrepriseNeed.trim()}\n\n` +
      `*Frais de mise en relation :* 230 FCFA (payés)`;

    const answersData = {
      'Service demandé à l\'entreprise': entrepriseNeed.trim()
    };

    window.dispatchEvent(new CustomEvent('trigger-payment-view', {
      detail: {
        title: selectedItemForForm.name,
        amount: amount.toString(),
        paymentType: "Mise en relation",
        waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`,
        onSuccess: () => {
          handleSuccessSubmission(selectedItemForForm, amount, chatMsgText, answersData);
        }
      }
    }));
  };

  if (selectedItemForForm) {
    return (
      <div className="flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-300 font-sans" id="demande-recherche-form-view">
        {/* Header with back button */}
        <header className="p-4 flex items-center gap-4 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <button 
            type="button"
            onClick={() => {
              setSelectedItemForForm(null);
              setFormErrors('');
            }} 
            className="p-2.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0 border border-gray-200"
            id="demande-form-back-btn"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800 stroke-[2.5]" />
          </button>
          <span className="text-sm font-black uppercase tracking-wider text-slate-900">Demande de service</span>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 animate-in fade-in">
          {/* Highlight Card at Top: La carte actuelle reste affichée en haut sans modification */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex gap-4 items-center relative overflow-hidden">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              selectedItemForForm.profileType === 'Travailleur' ? 'bg-green-50 text-green-600' :
              selectedItemForForm.profileType === 'Propriétaire' ? 'bg-purple-50 text-purple-600' :
              selectedItemForForm.profileType === 'Agence' ? 'bg-blue-50 text-blue-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              {selectedItemForForm.profileType === 'Travailleur' ? <Briefcase className="h-5 w-5" /> :
               selectedItemForForm.profileType === 'Agence' ? <Building className="h-5 w-5" /> :
               selectedItemForForm.profileType === 'Propriétaire' ? <Compass className="h-5 w-5" /> :
               <CheckCircle className="h-5 w-5" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-sans font-black uppercase text-xs tracking-tight text-slate-900 truncate">{selectedItemForForm.name}</h4>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  selectedItemForForm.profileType === 'Travailleur' ? 'bg-green-50 text-green-700 border border-green-100' :
                  selectedItemForForm.profileType === 'Propriétaire' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                  selectedItemForForm.profileType === 'Agence' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  'bg-orange-50 text-orange-700 border border-orange-100'
                }`}>
                  {selectedItemForForm.profileType}
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400 stroke-[2.5]" />
                <span className="text-[10px] font-black uppercase tracking-tight">{selectedItemForForm.city}</span>
              </div>

              <div className="mt-1">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Activité / Titre :</span>
                <span className="text-xs text-slate-800 font-bold block">{selectedItemForForm.titleOrActivity}</span>
              </div>
            </div>
          </div>

          {/* Form under the card */}

          {/* 1. AGENCE IMMOBILIÈRE FORM */}
          {selectedItemForForm.profileType === 'Agence' && (
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choix du type de bien :</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Appartement', 'Terrain', 'Bureau', 'Local commercial'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAgenceTypeBien(type)}
                      className={`py-3.5 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 text-center ${
                        agenceTypeBien === type
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone ou lieu recherché <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={agenceZone}
                  onChange={(e) => {
                    setAgenceZone(e.target.value);
                    if (e.target.value.trim()) setFormErrors('');
                  }}
                  placeholder="Ex: Cocody Angré, Riviera..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                />
              </div>

              {formErrors && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>
              )}

              <div className="pt-2">
                <p className="text-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wide mb-3">
                  Frais de mise en relation : <span className="text-orange-600">530 FCFA</span>
                </p>
                <button
                  type="button"
                  onClick={handleAgenceSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* 2. TRAVAILLEURS FORM */}
          {selectedItemForForm.profileType === 'Travailleur' && (
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-6">
              {travailleurStep === 0 && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                     <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Titre recherché :</p>
                     <p className="text-sm font-black text-slate-800 mt-1 uppercase">{selectedItemForForm.titleOrActivity}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choix :</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Embauche', 'Service rapide'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTravailleurMode(mode)}
                          className={`py-3.5 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 text-center ${
                            travailleurMode === mode
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {travailleurMode === 'Service rapide' && (
                    <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-center">Nombre de jours souhaité :</label>
                      <div className="flex items-center gap-4 justify-center">
                        <button
                          type="button"
                          onClick={() => setTravailleurJours(Math.max(1, travailleurJours - 1))}
                          className="w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <span className="text-xl font-black text-slate-900 w-16 text-center">{travailleurJours} jour{travailleurJours > 1 ? 's' : ''}</span>
                        <button
                          type="button"
                          onClick={() => setTravailleurJours(travailleurJours + 1)}
                          className="w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormErrors('');
                      setTravailleurStep(1);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md"
                  >
                    Suivant
                  </button>
                </div>
              )}

              {travailleurStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {travailleurMode === 'Embauche' ? "Où le travailleur doit-il exercer ? *" : "Où le service doit s'exécuter ? *"}
                  </label>
                  <input
                    type="text"
                    value={travailleurCity}
                    onChange={(e) => {
                      setTravailleurCity(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: Abidjan, Cocody..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTravailleurStep(0)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!travailleurCity.trim()) {
                          setFormErrors('Veuillez spécifier la localisation / ville.');
                          return;
                        }
                        setFormErrors('');
                        setTravailleurStep(2);
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {travailleurStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {travailleurMode === 'Embauche' ? "Quel salaire mensuel proposez-vous ? *" : "Quel est votre budget par jour ? *"}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={travailleurSalaryOrBudget}
                    onChange={(e) => {
                      setTravailleurSalaryOrBudget(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: 65 000 FCFA"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTravailleurStep(1)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!travailleurSalaryOrBudget.trim()) {
                          setFormErrors('Veuillez spécifier le montant.');
                          return;
                        }
                        setFormErrors('');
                        setTravailleurStep(3);
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {travailleurStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {travailleurMode === 'Embauche' ? "Description du poste et des tâches souhaitées *" : "Détails de votre demande (tâche...) *"}
                  </label>
                  <textarea
                    rows={4}
                    value={travailleurDesc}
                    onChange={(e) => {
                      setTravailleurDesc(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Précisez votre besoin ici..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTravailleurStep(2)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleTravailleurSubmit}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. PROPRIÉTAIRES D'ÉQUIPEMENTS FORM */}
          {selectedItemForForm.profileType === 'Propriétaire' && (
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-6">
              {equipStep === 0 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ville de location de l'équipement ? *</label>
                  <input
                    type="text"
                    value={equipCity}
                    onChange={(e) => {
                      setEquipCity(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: Abidjan, Cocody..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      if (!equipCity.trim()) {
                        setFormErrors('Veuillez spécifier la ville.');
                        return;
                      }
                      setFormErrors('');
                      setEquipStep(1);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md text-center"
                  >
                    Suivant
                  </button>
                </div>
              )}

              {equipStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Pour combien de jours ? *</label>
                  <select
                    value={equipDays}
                    onChange={(e) => setEquipDays(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  >
                    {DURATION_DAYS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEquipStep(0)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => setEquipStep(2)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {equipStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Budget total ou par jour prévu ? *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={equipBudget}
                    onChange={(e) => {
                      setEquipBudget(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: 25 000 FCFA"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEquipStep(1)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!equipBudget.trim()) {
                          setFormErrors('Veuillez spécifier votre budget.');
                          return;
                        }
                        setFormErrors('');
                        setEquipStep(3);
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {equipStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Matériel spécifique ou options souhaitées ? *</label>
                  <textarea
                    rows={4}
                    value={equipDesc}
                    onChange={(e) => {
                      setEquipDesc(e.target.value);
                      if (e.target.value.trim()) setFormErrors('');
                    }}
                    placeholder="Précisez les détails du matériel ou options recherchées ici..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                  {formErrors && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEquipStep(2)}
                      className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleEquipSubmit}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all shadow-md text-center"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. ENTREPRISES FORM */}
          {selectedItemForForm.profileType === 'Entreprise' && (
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-4 font-sans">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block animate-in fade-in">
                  Quel service demandez-vous à cette entreprise ? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={entrepriseNeed}
                  onChange={(e) => {
                    setEntrepriseNeed(e.target.value);
                    if (e.target.value.trim()) setFormErrors('');
                  }}
                  placeholder="Décrivez précisément votre besoin ou le projet envisagé avec cette entreprise..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                />
              </div>

              {formErrors && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{formErrors}</p>
              )}

              <div className="pt-2">
                <p className="text-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wide mb-3">
                  Frais de mise en relation : <span className="text-orange-600">230 FCFA</span>
                </p>
                <button
                  type="button"
                  onClick={handleEntrepriseSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md font-sans"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-300 font-sans" id="demande-recherche-screen">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0 border border-gray-200"
          id="recherche-back-btn"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800 stroke-[2.5]" />
        </button>
        <span className="text-sm font-black uppercase tracking-wider text-slate-900">Demande de recherche</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl border-2 border-white/20 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10">
            <Search className="w-40 h-40 transform rotate-12" />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight leading-none text-white">Recherche Intelligente</h2>
            <p className="text-xs text-orange-50/90 font-medium leading-relaxed">
              Consultez instantanément les profils certifiés de FILANT°225. Saisissez l'activité recherchée pour initier une mise en relation directe.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quel métier ou service cherchez-vous ?</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex. Vendeur, Cuisinier, Agence immobilière..."
                className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                disabled={isLoading}
                id="search-query-input"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 p-2 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-xl transition-all shadow-md"
                disabled={isLoading || !queryInput.trim()}
                id="search-submit-btn"
              >
                <Search className="h-4 w-4 stroke-[3]" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !queryInput.trim()}
            className="w-full bg-slate-900 text-white py-4 px-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            id="search-main-action-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Recherche en cours...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 stroke-[2.5]" />
                <span>Demande de recherche</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Spinner Area */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-orange-50 border-t-transparent rounded-full animate-spin font-sans"></div>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black uppercase tracking-wide text-slate-900">Recherche en cours...</h4>
              <p className="text-xs text-slate-400 font-bold">Vérification de la base de données FILANT°225</p>
            </div>
          </div>
        )}

        {/* Results layout */}
        {!isLoading && results !== null && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {results.length} {results.length > 1 ? 'résultats correspondants' : 'résultat correspondant'}
              </h3>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-1">
                  <AlertCircle className="h-6 w-6 stroke-[2]" />
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs" id="no-results-message">
                  Aucun résultat disponible pour le moment pour ce titre.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative overflow-hidden group hover:shadow-xl transition-all"
                  >
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      {/* Icon container */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        item.profileType === 'Travailleur' ? 'bg-green-50 text-green-600' :
                        item.profileType === 'Propriétaire' ? 'bg-purple-50 text-purple-600' :
                        item.profileType === 'Agence' ? 'bg-blue-50 text-blue-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {item.profileType === 'Travailleur' ? <Briefcase className="h-5 w-5" /> :
                         item.profileType === 'Agence' ? <Building className="h-5 w-5" /> :
                         item.profileType === 'Propriétaire' ? <Compass className="h-5 w-5" /> :
                         <CheckCircle className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-sans font-black uppercase text-xs tracking-tight text-slate-900 truncate">{item.name}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            item.profileType === 'Travailleur' ? 'bg-green-50 text-green-700 border border-green-100' :
                            item.profileType === 'Propriétaire' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            item.profileType === 'Agence' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-orange-50 text-orange-700 border border-orange-100'
                          }`}>
                            {item.profileType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400 stroke-[2.5]" />
                          <span className="text-[10px] font-black uppercase tracking-tight">{item.city}</span>
                        </div>

                        {/* Title of profession or activity */}
                        <div className="mt-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Activité / Titre :</span>
                          <span className="text-xs text-slate-800 font-bold block">{item.titleOrActivity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button next to result */}
                    <button
                      onClick={() => setSelectedItemForForm(item)}
                      disabled={isLinking}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all font-sans"
                    >
                      {isLinking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      <span>Demande de service</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
