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
        } else if (item.profileType === 'Agence') {
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
          profileType: item.profileType || 'Travailleur',
          titleOrActivity,
          description: item.skillsDescription || item.equipmentDescription || item.companyServices || ''
        };
      });

    setResults(matches);
  };

  const handleDemandeDeService = async (item: InscriptionResult) => {
    if (isLinking) return;
    setIsLinking(true);

    try {
      // 1. Save Service Request to Firestore
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
          'Type de profil': item.profileType
        },
        readStatus: 'NON LU',
        prestataireName: item.name,
        prestataireCity: item.city,
        prestataireActivity: item.titleOrActivity
      };

      await databaseService.saveServiceRequest(serviceRequestData);

      // 2. Format custom chat message
      const chatMsgText = `📢 *Nouvelle Demande de Service*\n\nJe souhaite être mis en relation avec le profil suivant issu de ma recherche :\n\n• *Nom :* ${item.name}\n• *Ville :* ${item.city}\n• *Activité/Métier :* ${item.titleOrActivity}\n• *Type :* ${item.profileType}`;

      const chatMsg = {
        sender: 'user' as const,
        text: chatMsgText,
        timestamp: Date.now()
      };

      // 3. Save Private Chat Message
      await databaseService.savePrivateChatMessage(chatUserId, chatMsg);

      // 4. Trigger tab switch to Chat screen
      onSelectTab(Tab.UserChat);
    } catch (error) {
      console.error("Error creating service request connection:", error);
    } finally {
      setIsLinking(false);
    }
  };

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
                className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
              <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black uppercase tracking-wide text-slate-900">Recherche en cours...</h4>
              <p className="text-xs text-slate-400 font-bold">Vérification de la base de données FILANT°225</p>
            </div>
          </div>
        )}

        {/* Results layout */}
        {!isLoading && results !== null && (
          <div className="space-y-4">
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
                      onClick={() => handleDemandeDeService(item)}
                      disabled={isLinking}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
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
