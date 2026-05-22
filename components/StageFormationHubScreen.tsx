import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  GraduationCap, 
  Briefcase,
  Laptop,
  Zap,
  Droplets,
  Hammer,
  Calculator,
  ClipboardList,
  Users,
  Truck,
  Sprout,
  Wrench,
  Sparkles,
  Scissors,
  ChefHat,
  Utensils,
  Camera,
  Heart,
  Mic,
  HelpCircle
} from 'lucide-react';
import { User } from '../types';

const internWorkspaceImg = "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/40409b48-f425-4e5d-9e41-8a01279d5bfe.jpg";
const studentTrainingImg = "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/14242e9f-6ea7-44c5-a76f-220eb1759824.jpg";

interface StageFormationHubScreenProps {
  onBack: () => void;
  user: User;
  onOpenForm: (context: {
    formType: 'stage' | 'formation';
    title: string;
    imageUrl?: string;
    description?: string;
  }) => void;
}

const STAGES_LIST = [
  "Stage en Informatique",
  "Stage en Développement Web",
  "Stage en Développement Mobile",
  "Stage en Réseaux Informatiques",
  "Stage en Cybersécurité",
  "Stage en Infographie",
  "Stage en Community Management",
  "Stage en Marketing Digital",
  "Stage en Comptabilité",
  "Stage en Gestion Financière",
  "Stage en Banque",
  "Stage en Assurance",
  "Stage en Ressources Humaines",
  "Stage en Secrétariat Bureautique",
  "Stage en Assistant Administratif",
  "Stage en Transit-Douane",
  "Stage en Logistique",
  "Stage en Gestion Commerciale",
  "Stage en Vente",
  "Stage en Immobilier",
  "Stage en Architecture",
  "Stage en Génie Civil",
  "Stage en Électricité Bâtiment",
  "Stage en Électricité Industrielle",
  "Stage en Maintenance Informatique",
  "Stage en Maintenance Industrielle",
  "Stage en Mécanique Automobile",
  "Stage en Climatisation",
  "Stage en Froid Industriel",
  "Stage en Cuisine",
  "Stage en Hôtellerie",
  "Stage en Restauration",
  "Stage en Coiffure",
  "Stage en Esthétique",
  "Stage en Couture",
  "Stage en Photographie",
  "Stage en Vidéographie",
  "Stage en Agriculture",
  "Stage en Élevage",
  "Stage en Santé",
  "Stage en Aide-Soignant",
  "Stage en Pharmacie",
  "Stage en Communication",
  "Stage en Journalisme",
  "Stage en Gestion de Projet",
  "Stage en Commerce International"
];

const FORMATIONS_LIST = [
  "Formation en Développement Web",
  "Formation en Développement Mobile Flutter",
  "Formation en Intelligence Artificielle",
  "Formation en Cybersécurité",
  "Formation en Réseaux Informatiques",
  "Formation en Maintenance Informatique",
  "Formation en Excel Avancé",
  "Formation en Bureautique",
  "Formation en Secrétariat",
  "Formation en Comptabilité",
  "Formation en Gestion d’Entreprise",
  "Formation en Entrepreneuriat",
  "Formation en Marketing Digital",
  "Formation en Facebook Ads",
  "Formation en Community Management",
  "Formation en E-commerce",
  "Formation en Immobilier",
  "Formation en Vente et Négociation",
  "Formation en Leadership",
  "Formation en Gestion de Projet",
  "Formation en Ressources Humaines",
  "Formation en Transit-Douane",
  "Formation en Logistique",
  "Formation en Banque et Finance",
  "Formation en Assurance",
  "Formation en Cuisine Professionnelle",
  "Formation en Hôtellerie",
  "Formation en Pâtisserie",
  "Formation en Couture",
  "Formation en Stylisme",
  "Formation en Coiffure Professionnelle",
  "Formation en Esthétique",
  "Formation en Photographie",
  "Formation en Montage Vidéo",
  "Formation en Infographie",
  "Formation en Design Graphique",
  "Formation en Électricité Bâtiment",
  "Formation en Énergie Solaire",
  "Formation en Climatisation",
  "Formation en Mécanique Automobile",
  "Formation en Agriculture Moderne",
  "Formation en Élevage Moderne",
  "Formation en Anglais Professionnel",
  "Formation en Prise de Parole",
  "Formation en Communication Professionnelle"
];

const getIconAndColor = (title: string) => {
  const lower = title.toLowerCase();

  // IT, AI, Tech & Cyber
  if (
    lower.includes('informatique') || 
    lower.includes('web') || 
    lower.includes('mobile') || 
    lower.includes('réseaux') || 
    lower.includes('cybersécurité') || 
    lower.includes('intelligence artificielle') ||
    lower.includes('excel') ||
    lower.includes('bureautique')
  ) {
    return { icon: Laptop, color: "text-blue-500 bg-blue-50 border-blue-100" };
  }
  // Engineering, Construction & Masonry
  if (
    lower.includes('civil') || 
    lower.includes('architecture') || 
    lower.includes('maçonnerie') || 
    lower.includes('carrelage') || 
    lower.includes('menuiserie')
  ) {
    return { icon: Hammer, color: "text-amber-800 bg-amber-50 border-amber-100" };
  }
  // Tools, Auto, Maintenance
  if (lower.includes('mécanique') || lower.includes('maintenance')) {
    return { icon: Wrench, color: "text-slate-600 bg-slate-50 border-slate-100" };
  }
  // Finances, Bank, Insurance, Accounting
  if (
    lower.includes('comptabilité') || 
    lower.includes('financière') || 
    lower.includes('banque') || 
    lower.includes('assurance') || 
    lower.includes('finance')
  ) {
    return { icon: Calculator, color: "text-green-500 bg-green-50 border-green-100" };
  }
  // Electricity & Energy
  if (lower.includes('électricité') || lower.includes('solaire') || lower.includes('énergie')) {
    return { icon: Zap, color: "text-yellow-600 bg-yellow-50 border-yellow-100" };
  }
  // Logistics, Customs & Commerce
  if (
    lower.includes('transit') || 
    lower.includes('logistique') || 
    lower.includes('transport') || 
    lower.includes('climatisation') || 
    lower.includes('commerce')
  ) {
    return { icon: Truck, color: "text-cyan-600 bg-cyan-50 border-cyan-100" };
  }
  // Plumbing, Water, Cold
  if (lower.includes('plomberie') || lower.includes('froid')) {
    return { icon: Droplets, color: "text-sky-500 bg-sky-50 border-sky-100" };
  }
  // Agronomy
  if (lower.includes('agriculture') || lower.includes('élevage')) {
    return { icon: Sprout, color: "text-lime-600 bg-lime-50 border-lime-100" };
  }
  // Sewing & Aesthetics
  if (
    lower.includes('couture') || 
    lower.includes('stylisme') || 
    lower.includes('coiffure') || 
    lower.includes('esthétique')
  ) {
    return { icon: Scissors, color: "text-pink-500 bg-pink-50 border-pink-100" };
  }
  // Food, Pastry
  if (lower.includes('cuisine') || lower.includes('pâtisserie')) {
    return { icon: ChefHat, color: "text-orange-500 bg-orange-50 border-orange-100" };
  }
  // Hotels
  if (lower.includes('hôtellerie') || lower.includes('restauration')) {
    return { icon: Utensils, color: "text-amber-600 bg-amber-50 border-amber-100" };
  }
  // Multimedia, Photography
  if (
    lower.includes('photographie') || 
    lower.includes('vidéo') || 
    lower.includes('infographie') || 
    lower.includes('design')
  ) {
    return { icon: Camera, color: "text-purple-500 bg-purple-50 border-purple-100" };
  }
  // Care & Pharmacie
  if (lower.includes('santé') || lower.includes('aide-soignant') || lower.includes('pharmacie')) {
    return { icon: Heart, color: "text-rose-500 bg-rose-50 border-rose-100" };
  }
  // Office, Project & Management
  if (
    lower.includes('marketing') || 
    lower.includes('communauté') || 
    lower.includes('community') || 
    lower.includes('vente') || 
    lower.includes('immobilier') || 
    lower.includes('ressources humaines') || 
    lower.includes('gestion de projet') || 
    lower.includes('leadership') || 
    lower.includes('entrepreneuriat') ||
    lower.includes('secrétariat') || 
    lower.includes('assistant') || 
    lower.includes('gestion')
  ) {
    return { icon: Users, color: "text-indigo-500 bg-indigo-50 border-indigo-100" };
  }
  // Speech, PR & Language
  if (lower.includes('parole') || lower.includes('anglais') || lower.includes('communication') || lower.includes('journalisme')) {
    return { icon: Mic, color: "text-teal-500 bg-teal-50 border-teal-100" };
  }

  // Fallback
  return { icon: HelpCircle, color: "text-slate-500 bg-slate-50 border-slate-100" };
};

const StageFormationHubScreen: React.FC<StageFormationHubScreenProps> = ({ onBack, user, onOpenForm }) => {
  const [subView, setSubView] = useState<'main' | 'stage_list' | 'formation_list'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const currentList = useMemo(() => {
    const rawList = subView === 'stage_list' ? STAGES_LIST : subView === 'formation_list' ? FORMATIONS_LIST : [];
    return rawList.map(title => {
      const design = getIconAndColor(title);
      return {
        title,
        icon: design.icon,
        color: design.color
      };
    });
  }, [subView]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.toLowerCase();
    return currentList.filter(item => item.title.toLowerCase().includes(query));
  }, [currentList, searchQuery]);

  const handleSelectSubView = (view: 'stage_list' | 'formation_list') => {
    setSubView(view);
    setSearchQuery('');
  };

  const handleItemSelect = (item: { title: string }) => {
    const isStage = subView === 'stage_list';
    onOpenForm({
      formType: isStage ? 'stage' : 'formation',
      title: item.title,
      imageUrl: isStage ? internWorkspaceImg : studentTrainingImg,
      description: isStage 
        ? "Candidature de stage professionnel FILANT°225. Boostez vos aptitudes académiques." 
        : "Inscription en formation professionnelle FILANT°225. Perfectionnez vos acquis techniques."
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const isStage = subView === 'stage_list';
    let finalTitle = customTitle.trim();
    const lowerTitle = finalTitle.toLowerCase();

    if (isStage) {
      if (!lowerTitle.startsWith('stage')) {
        finalTitle = `Stage en ${finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1)}`;
      }
    } else {
      if (!lowerTitle.startsWith('formation')) {
        finalTitle = `Formation en ${finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1)}`;
      }
    }

    setShowCustomInput(false);
    setCustomTitle('');

    onOpenForm({
      formType: isStage ? 'stage' : 'formation',
      title: finalTitle,
      imageUrl: isStage ? internWorkspaceImg : studentTrainingImg,
      description: isStage 
        ? "Candidature de stage professionnel FILANT°225. Boostez vos aptitudes académiques." 
        : "Inscription en formation professionnelle FILANT°225. Perfectionnez vos acquis techniques."
    });
  };

  return (
    <div className="h-full bg-slate-50 text-gray-800 flex flex-col font-sans animate-in fade-in duration-300 overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-150 px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <button 
          onClick={subView === 'main' ? onBack : () => setSubView('main')}
          className="p-2 hover:bg-slate-100 active:scale-95 transition-all text-slate-800 rounded-full"
          aria-label="Retour"
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-sm font-black text-slate-900 tracking-wider uppercase">Stage & Formation</h1>
          <p className="text-[9px] text-orange-600 font-black tracking-widest uppercase mt-0.5">Professionnalisation</p>
        </div>
        <div className="w-10"></div> {/* Spacing balance */}
      </header>

      <main className="p-4 flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {subView === 'main' ? (
            <motion.div 
              key="main_hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 flex flex-col"
            >
              {/* Motivational Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" /> Évolution
                  </div>
                  <h2 className="text-xl font-black leading-tight uppercase tracking-tight">
                    Optimisez votre avenir professionnel
                  </h2>
                  <p className="text-indigo-200 text-xs font-medium leading-relaxed">
                    “Apprenez davantage pour devenir plus professionnel dans votre activité.”
                  </p>
                  <p className="text-[10px] text-indigo-300 italic font-medium leading-relaxed pt-1">
                    Les meilleures compétences pratiques à portée de main. Que vous cherchiez à acquérir de l'expérience sur le terrain ou à maîtriser une spécialisation technique certifiée, FILANT°225 vous guide.
                  </p>
                </div>
              </div>

              {/* Grid block sections */}
              <div className="grid grid-cols-1 gap-5">
                {/* Stage Block */}
                <div className="bg-white rounded-[2.2rem] border border-gray-150 overflow-hidden shadow-md flex flex-col">
                  <div className="h-44 relative overflow-hidden">
                    <img 
                      src={internWorkspaceImg} 
                      alt="Stage Professionnel" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
                    <span className="absolute bottom-4 left-4 text-white font-black text-lg uppercase tracking-tight">
                      Section Stage
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                      Saisissez l'opportunité de travailler aux côtés de professionnels expérimentés pour relever des défis réels et bâtir votre réseau.
                    </p>
                    <button 
                      onClick={() => handleSelectSubView('stage_list')}
                      className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Briefcase className="h-4 w-4 text-orange-400" />
                      Voir les stages disponibles
                    </button>
                  </div>
                </div>

                {/* Formation Block */}
                <div className="bg-white rounded-[2.2rem] border border-gray-150 overflow-hidden shadow-md flex flex-col">
                  <div className="h-44 relative overflow-hidden">
                    <img 
                      src={studentTrainingImg} 
                      alt="Formation Professionnelle" 
                      className="w-full h-full object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
                    <span className="absolute bottom-4 left-4 text-white font-black text-lg uppercase tracking-tight">
                      Section Formation
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                      Apprenez un nouveau métier ou perfectionnez-vous avec des modules modernes animés par des formateurs certifiés et reconnus.
                    </p>
                    <button 
                      onClick={() => handleSelectSubView('formation_list')}
                      className="w-full mt-auto bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="h-4 w-4 text-black" />
                      Découvrir les formations
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list_view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col space-y-4"
            >
              {/* Back to Hub Button */}
              <button 
                onClick={() => setSubView('main')}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 flex-shrink-0 align-self-start"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour aux sections
              </button>

              {/* Header Details */}
              <div className="flex-shrink-0 leading-tight">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {subView === 'stage_list' ? "Offres de Stages de Qualification" : "Formations Métier Qualifiantes"}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Prenez le contrôle de vos opportunités
                </p>
              </div>

              {/* Search Bar & 'Autre' Button Row */}
              <div className="flex gap-2 items-center flex-shrink-0">
                <div className="relative flex-1 h-12 bg-white border border-gray-150 rounded-2xl flex items-center px-4 gap-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une spécialité..."
                    className="bg-transparent flex-1 py-3 text-sm font-bold text-gray-800 outline-none placeholder-gray-400"
                  />
                </div>
                <button 
                  onClick={() => setShowCustomInput(true)}
                  className="h-12 px-5 bg-slate-900 border-2 border-orange-500 hover:bg-slate-800 active:scale-95 text-orange-400 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  Autre
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {filteredList.length > 0 ? (
                    filteredList.map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <motion.button 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.015, duration: 0.2 }}
                          onClick={() => handleItemSelect(item)}
                          className="w-full bg-white border border-gray-150 hover:bg-slate-50 active:scale-[0.99] transition-all p-4 rounded-2xl flex items-center justify-between shadow-sm text-left group gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-11 h-11 rounded-1.5xl border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                              <IconComponent className="h-5.5 w-5.5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight truncate">
                                {item.title}
                              </h3>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                Filant Services • CI
                              </p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors flex-shrink-0">
                            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                          </div>
                        </motion.button>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                      <Search className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">Aucune spécialité trouvée</p>
                      <p className="text-xs">Essayez un autre mot-clé ou cliquez sur "Autre".</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-Up Micro-Modal for Custom Specification */}
      <AnimatePresence>
        {showCustomInput && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setShowCustomInput(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden border border-gray-150 shadow-2xl pb-6 z-10"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Titre personnalisé</h3>
                  <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">
                    {subView === 'stage_list' ? "STAGE INDIVIDUEL" : "FORMATION SUR MESURE"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTitle('');
                  }}
                  className="p-1 px-3 rounded-xl bg-white/10 text-white font-black text-xs hover:bg-white/20 transition-all"
                >
                  Fermer
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCustomSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-black uppercase tracking-wide">
                    {subView === 'stage_list' 
                      ? "Nom du stage ou secteur souhaité" 
                      : "Nom de la formation souhaitée"
                    }
                  </label>
                  <input 
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={subView === 'stage_list' ? "Ex: IA, Cloudeering, Intelligence Artificielle..." : "Ex: Pâtisserie Moderne, Docker..."}
                    required
                    maxLength={60}
                    autoFocus
                    className="w-full h-12 border border-gray-150 rounded-2xl px-4 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-slate-50"
                  />
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    Saisissez ce que vous recherchez. Nous préfixerons automatiquement pour vous !
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTitle('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={!customTitle.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StageFormationHubScreen;
