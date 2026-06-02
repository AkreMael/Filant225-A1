import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { ArrowLeft, Search, CheckCircle, Loader2, Compass, MapPin, Briefcase, Building, ChevronRight } from 'lucide-react';

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
}

// Fallback high-quality seed data representing realistic registrations matching user examples
const SEED_INSCRIPTIONS: InscriptionResult[] = [
  {
    id: 'seed-1',
    name: 'Koffi Kouadio',
    city: 'Abidjan',
    profileType: 'Travailleur',
    titleOrActivity: 'Plombier',
    description: 'Plomberie générale, installation sanitaire et dépannage rapide de fuites.'
  },
  {
    id: 'seed-2',
    name: 'Diallo Amadou',
    city: 'Bouaké',
    profileType: 'Travailleur',
    titleOrActivity: 'Électricien',
    description: 'Électricité bâtiment, dépannage, câblage et pose de disjoncteurs.'
  },
  {
    id: 'seed-3',
    name: 'Koné Mariam',
    city: 'Yamoussoukro',
    profileType: 'Travailleur',
    titleOrActivity: 'Cuisinier',
    description: 'Cuisinier professionnel à domicile, banquets, cuisine africaine et européenne.'
  },
  {
    id: 'seed-4',
    name: 'Immo Plus S.A.',
    city: 'Bassam',
    profileType: 'Agence',
    titleOrActivity: 'Agence Immobilière (Maison à louer, appartements, terrains)',
    description: 'Maison à louer, villa de luxe, appartements meublés et gestion locative.'
  },
  {
    id: 'seed-5',
    name: 'Location Express Côte d\'Ivoire',
    city: 'Abidjan',
    profileType: 'Propriétaire',
    titleOrActivity: 'Location de Pelleteuse',
    description: 'Pelleteuse Caterpillar 320 disponible pour tous vos travaux de terrassement.'
  },
  {
    id: 'seed-6',
    name: 'BatiMiel SARL',
    city: 'Bassam',
    profileType: 'Propriétaire',
    titleOrActivity: 'Location de Bétonnière',
    description: 'Bétonnière électrique 350L haute performance avec option de livraison sur chantier.'
  },
  {
    id: 'seed-7',
    name: 'SCI La Lagune',
    city: 'Assinie',
    profileType: 'Agence',
    titleOrActivity: 'Agence Immobilière (Magasin à louer, commerces)',
    description: 'Magasin à louer, espaces commerciaux d\'exception, bureaux et entrepôts.'
  },
  {
    id: 'seed-8',
    name: 'Groupe EGB BTP',
    city: 'Abidjan',
    profileType: 'Entreprise',
    titleOrActivity: 'Entreprise de construction',
    description: 'Gros œuvres, construction de bâtiments R+5, routes, assainissement et rénovations.'
  }
];

const SEARCH_SUGGESTIONS = [
  'Plombier',
  'Électricien',
  'Cuisinier',
  'Maison à louer',
  'Magasin à louer',
  'Pelleteuse',
  'Bétonnière',
  'Entreprise de construction'
];

export const DemandeRechercheScreen: React.FC<DemandeRechercheScreenProps> = ({ onBack, user }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InscriptionResult[] | null>(null);
  const [inscriptionsFromDB, setInscriptionsFromDB] = useState<any[]>([]);

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

  const handleSearch = (searchedTerm?: string) => {
    const term = (searchedTerm !== undefined ? searchedTerm : queryInput).trim();
    if (!term) return;

    if (searchedTerm !== undefined) {
      setQueryInput(searchedTerm);
    }

    setIsLoading(true);
    setResults(null);

    // Maintain loading state between 3 and 5 seconds to feel realistic (e.g. 3.5 seconds)
    const randomDuration = 3000 + Math.random() * 2000;
    setTimeout(() => {
      executeLocalAndDBSearch(term);
      setIsLoading(false);
    }, randomDuration);
  };

  const executeLocalAndDBSearch = (term: string) => {
    const normalizedTerm = term.toLowerCase();

    // 1. Search in Firestore Inscriptions
    const firestoreMatches: InscriptionResult[] = inscriptionsFromDB
      .filter((item: any) => {
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
          titleOrActivity = `Location ${item.equipmentType || item.equipmentCategory || 'Équipement'}`;
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

    // 2. Search in Static Fallback Elements
    const staticMatches = SEED_INSCRIPTIONS.filter((item) => {
      const textToSearch = [
        item.name,
        item.city,
        item.profileType,
        item.titleOrActivity,
        item.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return textToSearch.includes(normalizedTerm);
    });

    // Combine them, removing possible duplicate seeds of the match
    const combined = [...firestoreMatches];
    staticMatches.forEach((statItem) => {
      // Avoid adding if the term matches but we already matched something in firebase (for realism)
      const exists = combined.some(
        (existing) => existing.name.toLowerCase() === statItem.name.toLowerCase()
      );
      if (!exists) {
        combined.push(statItem);
      }
    });

    setResults(combined);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-500 font-sans" id="demande-recherche-screen">
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
        {/* Intro */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl border-2 border-white/20 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10">
            <Search className="w-40 h-40 transform rotate-12" />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight leading-none text-white">Recherche Intelligente</h2>
            <p className="text-xs text-orange-50/90 font-medium leading-relaxed">
              Dites-nous ce que vous cherchez. Notre système parcourt instantanément les inscriptions enregistrées (Travailleurs, Équipements, Agences, Entreprises) pour vous proposer les meilleurs résultats.
            </p>
          </div>
        </div>

        {/* Search Input Card */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quel service recherchez-vous ?</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex. Plombier, Maison à louer, Pelleteuse..."
                className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={isLoading}
                id="search-query-input"
              />
              <button
                onClick={() => handleSearch()}
                className="absolute right-3 p-2 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-xl transition-all shadow-md"
                disabled={isLoading || !queryInput.trim()}
                id="search-submit-btn"
              >
                <Search className="h-4 w-4 stroke-[3]" />
              </button>
            </div>
          </div>

          <button
            onClick={() => handleSearch()}
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

        {/* Suggested Queries */}
        {!isLoading && results === null && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Exemples de recherches populaires</h3>
            <div className="flex flex-wrap gap-2.5">
              {SEARCH_SUGGESTIONS.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(tag)}
                  className="bg-white border border-slate-200/80 hover:border-orange-200 hover:bg-orange-50/40 text-slate-700 text-xs font-bold px-4 py-3 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State Overlay / Card */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black uppercase tracking-wide text-slate-900">Recherche en cours...</h4>
              <p className="text-xs text-slate-400 font-bold">Analyse en temps réel de notre base de données</p>
            </div>
          </div>
        )}

        {/* Results View */}
        {!isLoading && results !== null && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {results.length} {results.length > 1 ? 'résultats trouvés' : 'résultat trouvé'}
              </h3>
              <button
                onClick={() => {
                  setResults(null);
                  setQueryInput('');
                }}
                className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-all"
              >
                Nouvelle recherche
              </button>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Compass className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Aucun prestataire trouvé</h4>
                  <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
                    Aucune inscription correspondant à votre recherche n'est disponible pour le moment. Veuillez vérifier l'orthographe ou essayer un autre terme.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex gap-4 items-start relative overflow-hidden group hover:shadow-xl transition-all"
                  >
                    {/* Visual Accents & Category Badge */}
                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        item.profileType === 'Travailleur' ? 'bg-green-50 text-green-700 border border-green-100' :
                        item.profileType === 'Propriétaire' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        item.profileType === 'Agence' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}>
                        {item.profileType}
                      </span>
                    </div>

                    {/* Icon wrapper based on category type */}
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

                    <div className="flex-1 min-w-0 pr-16 space-y-2">
                      <div>
                        <h4 className="font-sans font-black uppercase text-xs tracking-tight text-slate-900 truncate">{item.name}</h4>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <MapPin className="h-3 w-3 text-slate-400 stroke-[2.5]" />
                          <span className="text-[10px] font-black uppercase tracking-tight">{item.city}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Service ou activité</span>
                        <span className="text-xs text-slate-800 font-bold block mt-0.5">{item.titleOrActivity}</span>
                        {item.description && (
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 dark:text-slate-400 italic">
                            "{item.description}"
                          </p>
                        )}
                      </div>
                    </div>
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
