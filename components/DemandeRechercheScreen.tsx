import React, { useState, useEffect } from 'react';
import { User, Tab } from '../types';
import { databaseService } from '../services/databaseService';
import { ArrowLeft, Search, Loader2, Compass, MapPin, Briefcase, Building, CheckCircle, MessageSquare, AlertCircle, X } from 'lucide-react';

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
  initialQuery?: string;
}

export const DemandeRechercheScreen: React.FC<DemandeRechercheScreenProps> = ({ onBack, user, onSelectTab, initialQuery }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InscriptionResult[] | null>(null);
  const [inscriptionsFromDB, setInscriptionsFromDB] = useState<any[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // New states for top profile display & retrieval animation
  const [pinnedProfile, setPinnedProfile] = useState<InscriptionResult | null>(null);
  const [retrievingProfileId, setRetrievingProfileId] = useState<string | null>(null);
  const [isSearchingVille, setIsSearchingVille] = useState(false);
  const [searchingCityName, setSearchingCityName] = useState('');

  // Handle simulated profile retrieval duration before pinning it to top of search screen
  const handleRetrieveProfile = (item: InscriptionResult) => {
    setRetrievingProfileId(item.id);
    setIsSearchingVille(true);
    setSearchingCityName(item.city);
    // Pin the profile immediately so it renders at the top without delay
    setPinnedProfile(item);

    // Scroll all possible scroll containers (including App's .scroll-container) to top smoothly and immediately
    const selectors = ['.scroll-container', '#demande-recherche-main', '#demande-recherche-screen', 'main', '.overflow-y-auto'];
    selectors.forEach(sel => {
      const elements = document.querySelectorAll(sel);
      elements.forEach(el => {
        try {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          try {
            el.scrollTop = 0;
          } catch (err) {}
        }
      });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      setRetrievingProfileId(null);
      setIsSearchingVille(false);
    }, 2800); // 2.8 seconds simulated satellite lock routing
  };

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
  const [isSubmittingWithDelay, setIsSubmittingWithDelay] = useState(false);

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

  // Run automatic search if initialQuery prop is set
  useEffect(() => {
    if (initialQuery && inscriptionsFromDB.length > 0) {
      setQueryInput(initialQuery);
      
      const normalizedTerm = initialQuery.toLowerCase();
      const matches: InscriptionResult[] = inscriptionsFromDB
        .filter((item: any) => {
          if (item.isActive === false) return false;
          
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
    }
  }, [initialQuery, inscriptionsFromDB]);

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

  const startDelayedSubmissionAndPayment = async (
    item: InscriptionResult,
    amount: number,
    chatMsgText: string,
    answersData: Record<string, any>
  ) => {
    if (isSubmittingWithDelay) return;
    setIsSubmittingWithDelay(true);
    setFormErrors('');

    const startTime = Date.now();

    try {
      // 1. Create Service Request Data
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
        totalPrice: amount,
        readStatus: 'NON LU',
        prestataireName: item.name,
        prestataireCity: item.city,
        prestataireActivity: item.titleOrActivity
      };

      // 2. Format chat message
      const chatMsg = {
        sender: 'user' as const,
        text: chatMsgText,
        timestamp: Date.now()
      };

      // 3. Save to administrators DB & private chat
      await Promise.all([
        databaseService.saveServiceRequest(serviceRequestData),
        databaseService.savePrivateChatMessage(chatUserId, chatMsg)
      ]);

      // Calculate elapsed time and sleep up to 2 seconds
      const elapsed = Date.now() - startTime;
      const delayRemaining = Math.max(0, 2000 - elapsed);
      if (delayRemaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayRemaining));
      }

      // Reset fields representing the form state
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

      // Hide the form view by setting selectedItemForForm to null
      setSelectedItemForForm(null);

      // Now open the payment screen automatically
      window.dispatchEvent(new CustomEvent('trigger-payment-view', {
        detail: {
          title: item.name,
          amount: amount.toString(),
          paymentType: "Mise en relation",
          waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`,
          onSuccess: () => {
            // Once payment of "Mise en relation" is approved/finished,
            // direct the user to the chat screen to view their saved message.
            onSelectTab(Tab.UserChat);
          }
        }
      }));

    } catch (error) {
      console.error("Error during delayed submission process:", error);
      setFormErrors("Une erreur est survenue lors de l'enregistrement de votre demande.");
    } finally {
      setIsSubmittingWithDelay(false);
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

    startDelayedSubmissionAndPayment(selectedItemForForm, amount, chatMsgText, answersData);
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

    startDelayedSubmissionAndPayment(selectedItemForForm, amount, chatMsgText, answersData);
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

    startDelayedSubmissionAndPayment(selectedItemForForm, amount, chatMsgText, answersData);
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

    startDelayedSubmissionAndPayment(selectedItemForForm, amount, chatMsgText, answersData);
  };

  if (selectedItemForForm) {
    return (
      <div className="relative flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-300 font-sans" id="demande-recherche-form-view">
        {/* Loading overlay for the 2 seconds information saving */}
        {isSubmittingWithDelay && (
          <div className="absolute inset-0 z-[1100] bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-orange-100 rounded-full"></div>
                <div className="absolute inset-0 w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black uppercase tracking-wide text-slate-900">Enregistrement en cours...</h4>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-tight">Vos informations sont sagement enregistrées dans la messagerie et chez l'administrateur avant le paiement.</p>
              </div>
            </div>
          </div>
        )}

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
      <main id="demande-recherche-main" className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* 3D World Map & Automatic City Search Locator Panel */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#f2faf9] via-[#e2f1f0] to-[#cfe7e8] rounded-3xl p-5 shadow-xl border border-[#c6e3e1] h-80 flex flex-col justify-between" id="dynamic-3d-locator-map">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marker-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes radar-ripple {
              0% { r: 1px; opacity: 0.9; stroke-width: 1.5; }
              100% { r: 40px; opacity: 0; stroke-width: 0.5; }
            }
            @keyframes map-sweep {
              0% { transform: scale(0.98); opacity: 0.95; }
              50% { transform: scale(1.01); opacity: 1; }
              100% { transform: scale(0.98); opacity: 0.95; }
            }
            @keyframes rotate-globe {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes loader-progress {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}} />

          {/* Rotating Globe Accessory Widget (Top Right) */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-[#2dadac]/15 rounded-full border border-[#2dadac]/35 flex items-center justify-center overflow-hidden z-10 shadow-inner">
            <svg 
              className="w-8 h-8 text-[#2dadac]" 
              style={{ animation: 'rotate-globe 40s linear infinite' }}
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.2"
            >
              <circle cx="50" cy="50" r="45" />
              <ellipse cx="50" cy="50" rx="45" ry="12" />
              <ellipse cx="50" cy="50" rx="45" ry="28" />
              <ellipse cx="50" cy="50" rx="12" ry="45" />
              <ellipse cx="50" cy="50" rx="28" ry="45" />
              <line x1="5" y1="50" x2="95" y2="50" />
              <line x1="50" y1="5" x2="50" y2="95" />
            </svg>
          </div>

          {/* Interactive Status Info Banner (Top Left) */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#2dadac]/15 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#2dadac]/35 text-[10px] font-black uppercase tracking-wider text-[#1d706f]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f25c34] opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f25c34]"></span>
            </span>
            <span>
              {isSearchingVille ? `Localisation de ${searchingCityName}` : 'Recherche Côte d’Ivoire Active'}
            </span>
          </div>

          {/* Isometric World Map Grid & Landmasses */}
          <div className="absolute inset-0 z-0 opacity-90 pointer-events-none flex items-center justify-center translate-y-3">
            <svg viewBox="0 0 600 300" className="w-full h-full text-[#2dadac] filter drop-shadow-[0_8px_16px_rgba(43,159,158,0.18)]">
              {/* Latitude & Longitude lines creating 3D horizon */}
              <g stroke="#b8e2e0" strokeWidth="0.8" fill="none">
                <path d="M 50,80 Q 300,120 550,80" />
                <path d="M 50,140 Q 300,180 550,140" />
                <path d="M 50,200 Q 300,240 550,200" strokeWidth="1.2" stroke="#aad6d4" />
                <path d="M 50,260 Q 300,300 550,260" />
                
                <path d="M 120,40 Q 180,180 120,320" strokeDasharray="2 3" />
                <path d="M 220,40 Q 280,180 220,320" strokeDasharray="2 3" />
                <path d="M 320,40 Q 380,180 320,320" strokeWidth="1" stroke="#aad6d4" />
                <path d="M 420,40 Q 480,180 420,320" strokeDasharray="2 3" />
                <path d="M 520,40 Q 580,180 520,320" strokeDasharray="2 3" />
              </g>

              {/* Continents filled with high-contrast teal matching screenshot */}
              <g fill="#33a1a1" fillOpacity="0.85" stroke="#2a8585" strokeWidth="0.5">
                {/* North America */}
                <path d="M 60,110 C 75,85 110,75 140,80 C 170,85 190,70 195,50 C 180,30 140,40 110,45 C 90,48 70,35 60,40 C 45,47 40,65 52,90 Z" />
                <path d="M 100,105 C 120,112 145,115 160,122 C 175,128 178,142 165,155 C 150,170 142,160 135,148 C 122,142 110,135 100,125 Z" />
                {/* South America */}
                <path d="M 165,155 C 185,158 195,170 185,190 C 178,205 188,225 182,245 C 176,265 160,285 152,295 C 146,290 140,265 148,240 C 154,220 150,195 152,180 C 154,168 160,160 165,155 Z" />
                {/* Greenland */}
                <path d="M 205,35 C 220,30 238,25 245,35 C 250,42 240,55 230,58 C 215,62 205,50 205,35 Z" />
                {/* Eurasia & Africa */}
                <path d="M 285,100 C 310,95 340,90 355,75 C 370,60 390,48 415,52 C 440,55 455,72 470,80 C 490,90 520,85 530,105 C 500,120 480,110 465,118 C 450,125 435,140 405,138 C 385,136 365,145 350,130 C 330,115 310,120 285,100 Z" />
                <path d="M 285,100 C 305,115 320,130 315,150 C 310,170 325,188 320,205 C 315,222 295,245 285,255 C 275,240 270,220 278,198 C 284,180 275,160 270,145 C 265,130 275,115 285,100 Z" />
                {/* Australia */}
                <path d="M 445,185 C 465,180 485,190 495,205 C 490,225 470,235 455,225 C 440,215 435,195 445,185 Z" />
                <circle cx="340" cy="210" r="2" />
                <circle cx="218" cy="115" r="3" />
                <circle cx="490" cy="110" r="3.5" />
              </g>

              {/* Bouncing red location pins on continents */}
              <g>
                {[
                  { cx: 120, cy: 95 }, // NA
                  { cx: 175, cy: 200 }, // SA
                  { cx: 340, cy: 75 }, // Europe
                  { cx: 485, cy: 215 }, // Australia
                  { cx: 430, cy: 110 }, // Asia
                ].map((pt, i) => (
                  <g key={`static-pin-${i}`} className="animate-[marker-bounce_3s_infinite_ease-in-out]" style={{ animationDelay: `${i * 0.4}s` }}>
                    {/* Shadow underneath */}
                    <ellipse cx={pt.cx} cy={pt.cy} rx="2" ry="0.8" fill="black" fillOpacity="0.3" />
                    {/* Pin vector */}
                    <path 
                      d="M 0,-15 A 5,5 0 0,0 -5,-10 C -5,-5 0,2 0,2 C 0,2 5,-5 5,-10 A 5,5 0 0,0 0,-15 Z" 
                      fill="#f25c34" 
                      transform={`translate(${pt.cx}, ${pt.cy})`}
                    />
                    <circle cx={pt.cx} cy={pt.cy - 10} r="1.5" fill="white" />
                  </g>
                ))}
              </g>

              {/* Dynamic Target Finder / Satellite Lock routing radar sweep lines */}
              {isSearchingVille && (
                <g>
                  {/* Concentric pulsing circles focusing over searched city */}
                  <circle 
                    cx={
                      searchingCityName.toLowerCase().includes('bassam') ? 326 :
                      searchingCityName.toLowerCase().includes('abidjan') || searchingCityName.toLowerCase().includes('cocody') ? 318 :
                      searchingCityName.toLowerCase().includes('bouake') ? 322 :
                      searchingCityName.toLowerCase().includes('yamoussoukro') ? 317 : 318
                    } 
                    cy={155} 
                    r="8" 
                    fill="none" 
                    stroke="#2dadac" 
                    strokeWidth="1.8"
                  >
                    <animate attributeName="r" values="3;42" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle 
                    cx={
                      searchingCityName.toLowerCase().includes('bassam') ? 326 :
                      searchingCityName.toLowerCase().includes('abidjan') || searchingCityName.toLowerCase().includes('cocody') ? 318 :
                      searchingCityName.toLowerCase().includes('bouake') ? 322 :
                      searchingCityName.toLowerCase().includes('yamoussoukro') ? 317 : 318
                    } 
                    cy={155} 
                    r="12" 
                    fill="none" 
                    stroke="#f25c34" 
                    strokeWidth="2.5"
                  >
                    <animate attributeName="r" values="4;65" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}

              {/* Primary Active Côte d'Ivoire Locator node - Blinking and Pulses */}
              <g className="animate-[marker-bounce_2s_infinite_ease-in-out]">
                <circle 
                  cx={318} 
                  cy={155} 
                  r="6" 
                  fill="none" 
                  stroke="#2dadac" 
                  strokeWidth="1.2"
                  className="animate-[radar-ripple_2s_infinite_linear]"
                />
                <ellipse cx={318} cy={158} rx="3" ry="1" fill="black" fillOpacity="0.4" />
                <path 
                  d="M 0,-18 A 7,7 0 0,0 -7,-11 C -7,-4 0,3 0,3 C 0,3 7,-4 7,-11 A 7,7 0 0,0 0,-18 Z" 
                  fill="#f25c34" 
                  transform="translate(318, 155)"
                />
                <circle cx={318} cy={144} r="2" fill="white" />
              </g>
            </svg>
          </div>

          {/* Bottom Floating Area */}
          <div className="relative z-10 w-full mt-auto">
            {/* 1. Searching/Locating City State (Only show if there is no pinned profile details yet) */}
            {isSearchingVille && !pinnedProfile && (
              <div className="bg-slate-900/90 backdrop-blur-md p-4 text-white rounded-2xl border border-slate-700/60 flex flex-col items-center justify-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#2dadac] animate-spin" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#2dadac] animate-pulse">Recherche automatique de la ville...</span>
                </div>
                <p className="text-xs font-bold font-sans text-center">
                  Ciblage GPS : <span className="text-[#f25c34] font-black">{searchingCityName.toUpperCase()}</span>
                </p>
                <div className="w-1/2 bg-slate-800 h-1 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 bg-[#f25c34] h-full rounded-full" style={{ animation: 'loader-progress 2.8s linear' }} />
                </div>
              </div>
            )}

            {/* 2. Pinned Profile details (Constructed EXACTLY like the user screenshot image, showing live geolocating progress if currently matching) */}
            {pinnedProfile && (
              <div className={`bg-white rounded-2xl p-4 shadow-xl border transition-all duration-300 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300 ${
                isSearchingVille ? 'border-orange-200 bg-orange-50/5' : 'border-emerald-100/80 bg-white'
              }`} id="pinned-selected-profile">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Glowing Maps locator icon badge on the left */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0 shadow-inner relative transition-colors duration-300 ${
                    isSearchingVille 
                      ? 'bg-[#fdf4f2] border-orange-400' 
                      : 'bg-[#ebf7f5] border-emerald-400'
                  }`}>
                    <span className={`absolute inset-0 rounded-full animate-ping ${
                      isSearchingVille ? 'bg-orange-400/30 font-bold' : 'bg-emerald-400/20'
                    }`} style={{ animationDuration: isSearchingVille ? '1s' : '3s' }}></span>
                    <MapPin className={`h-5 w-5 stroke-[2.5] transition-colors duration-300 ${
                      isSearchingVille 
                        ? 'text-orange-500 fill-orange-100' 
                        : 'text-emerald-500 fill-emerald-100'
                    }`} />
                  </div>

                  {/* Information block */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap leading-none">
                      <span className="text-xs font-black uppercase tracking-tight text-slate-800 truncate">{pinnedProfile.name}</span>
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{pinnedProfile.profileType}</span>
                    </div>
                    
                    <span className="text-[10px] font-black uppercase text-slate-500 block leading-none">{pinnedProfile.city}</span>
                    
                    <div className="pt-1 leading-none">
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block leading-none">
                        {isSearchingVille ? 'CIBLAGE SATELLITE :' : 'ACTIVITÉ / TITRE :'}
                      </span>
                      <span className="text-[11.5px] text-slate-800 font-extrabold block truncate leading-none mt-0.5">
                        {pinnedProfile.titleOrActivity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: DEMANDE and close buttons OR dynamic geolocating status */}
                <div className="flex-shrink-0 min-w-[125px] flex items-center justify-end">
                  {isSearchingVille ? (
                    <div className="flex flex-col items-end space-y-1 w-full">
                      <div className="flex items-center gap-1 text-[#f25c34] font-black text-[9px] uppercase tracking-wide animate-pulse">
                        <Loader2 className="w-3 h-3 text-[#f25c34] animate-spin" />
                        <span>LOCALISATION...</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden relative border border-slate-200">
                        <div className="absolute top-0 left-0 bg-[#f25c34] h-full rounded-full" style={{ animation: 'loader-progress 2.8s linear' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                      <button
                        onClick={() => setSelectedItemForForm(pinnedProfile)}
                        className="bg-[#f06e30] hover:bg-[#e05d1f] active:scale-95 text-white py-3 px-5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-200"
                        id="pinned-submit-demande-btn"
                      >
                        <span>DEMANDE</span>
                      </button>
                      <button 
                        onClick={() => setPinnedProfile(null)}
                        className="p-1 px-2 text-slate-400 hover:text-slate-600 rounded text-[9px] font-extrabold uppercase transition-colors"
                        title="Désélectionner"
                      >
                        Masquer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Normal idle status when no profile is active */}
            {!pinnedProfile && !isSearchingVille && (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-[#c6e3e1] flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1d706f] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Recherche Automatique de Profils</span>
                  </h4>
                  <p className="text-[11px] text-[#257371]/80 font-bold leading-relaxed max-w-lg">
                    Scanner et simulation de liaison satellite à travers la Côte d'Ivoire. Choisissez un prestataire dans les résultats pour cibler sa localisation et soumettre une demande.
                  </p>
                </div>
              </div>
            )}
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
                      onClick={() => handleRetrieveProfile(item)}
                      disabled={isLinking || retrievingProfileId !== null}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all font-sans"
                    >
                      {retrievingProfileId === item.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Récupération...</span>
                        </>
                      ) : isLinking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Demande de service</span>
                        </>
                      )}
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
