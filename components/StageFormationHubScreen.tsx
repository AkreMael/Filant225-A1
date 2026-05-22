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
  Grid,
  Wind,
  Flame,
  Calculator,
  ClipboardList,
  Palette,
  Share2,
  Users,
  FileText,
  Truck,
  Sprout,
  Wrench,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

import internWorkspaceImg from '../src/assets/images/intern_workspace_1779434542154.png';
import studentTrainingImg from '../src/assets/images/student_training_1779434561305.png';

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
  { title: "Stage en Informatique", icon: Laptop, color: "text-blue-500 bg-blue-50 border-blue-100" },
  { title: "Stage en Électricité", icon: Zap, color: "text-yellow-500 bg-yellow-50 border-yellow-100" },
  { title: "Stage en Plomberie", icon: Droplets, color: "text-sky-500 bg-sky-50 border-sky-100" },
  { title: "Stage en Maçonnerie", icon: Hammer, color: "text-amber-700 bg-amber-50 border-amber-100" },
  { title: "Stage en Carrelage", icon: Grid, color: "text-purple-500 bg-purple-50 border-purple-100" },
  { title: "Stage en Menuiserie", icon: Hammer, color: "text-orange-500 bg-orange-50 border-orange-100" },
  { title: "Stage en Climatisation", icon: Wind, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
  { title: "Stage en Soudure", icon: Flame, color: "text-red-500 bg-red-50 border-red-100" },
  { title: "Stage en Comptabilité", icon: Calculator, color: "text-green-500 bg-green-50 border-green-100" },
  { title: "Stage en Gestion de Projet", icon: ClipboardList, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
  { title: "Stage en Infographie / Design", icon: Palette, color: "text-pink-500 bg-pink-50 border-pink-100" },
  { title: "Stage en Marketing Digital", icon: Share2, color: "text-teal-500 bg-teal-50 border-teal-100" },
  { title: "Stage en Ressources Humaines", icon: Users, color: "text-rose-500 bg-rose-50 border-rose-100" },
  { title: "Stage en Secrétariat / Assistanat", icon: FileText, color: "text-neutral-500 bg-neutral-50 border-neutral-100" },
  { title: "Stage en Transit / Douane", icon: Truck, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  { title: "Stage en Élevage / Agriculture", icon: Sprout, color: "text-lime-600 bg-lime-50 border-lime-100" },
  { title: "Stage en Mécanique Auto.", icon: Wrench, color: "text-gray-600 bg-gray-50 border-gray-100" }
];

const FORMATIONS_LIST = [
  { title: "Formation en Informatique", icon: Laptop, color: "text-blue-500 bg-blue-50 border-blue-100" },
  { title: "Formation en Électricité", icon: Zap, color: "text-yellow-500 bg-yellow-50 border-yellow-100" },
  { title: "Formation en Plomberie", icon: Droplets, color: "text-sky-500 bg-sky-50 border-sky-100" },
  { title: "Formation en Maçonnerie", icon: Hammer, color: "text-amber-700 bg-amber-50 border-amber-100" },
  { title: "Formation en Carrelage", icon: Grid, color: "text-purple-500 bg-purple-50 border-purple-100" },
  { title: "Formation en Menuiserie", icon: Hammer, color: "text-orange-500 bg-orange-50 border-orange-100" },
  { title: "Formation en Climatisation", icon: Wind, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
  { title: "Formation en Soudure", icon: Flame, color: "text-red-500 bg-red-50 border-red-100" },
  { title: "Formation en Comptabilité", icon: Calculator, color: "text-green-500 bg-green-50 border-green-100" },
  { title: "Formation en Gestion de Projet", icon: ClipboardList, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
  { title: "Formation en Infographie / Design", icon: Palette, color: "text-pink-500 bg-pink-50 border-pink-100" },
  { title: "Formation en Marketing Digital", icon: Share2, color: "text-teal-500 bg-teal-50 border-teal-100" },
  { title: "Formation en Ressources Humaines", icon: Users, color: "text-rose-500 bg-rose-50 border-rose-100" },
  { title: "Formation en Secrétariat / Assistanat", icon: FileText, color: "text-neutral-500 bg-neutral-50 border-neutral-100" },
  { title: "Formation en Transit / Douane", icon: Truck, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  { title: "Formation en Élevage / Agriculture", icon: Sprout, color: "text-lime-600 bg-lime-50 border-lime-100" },
  { title: "Formation en Mécanique Auto.", icon: Wrench, color: "text-gray-600 bg-gray-50 border-gray-100" }
];

const StageFormationHubScreen: React.FC<StageFormationHubScreenProps> = ({ onBack, user, onOpenForm }) => {
  const [subView, setSubView] = useState<'main' | 'stage_list' | 'formation_list'>('main');
  const [searchQuery, setSearchQuery] = useState('');

  const currentList = useMemo(() => {
    if (subView === 'stage_list') return STAGES_LIST;
    if (subView === 'formation_list') return FORMATIONS_LIST;
    return [];
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

  return (
    <div className="min-h-full bg-slate-50 text-gray-800 flex flex-col font-sans animate-in fade-in duration-300">
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

      <div className="p-4 flex-1 flex flex-col overflow-y-auto">
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
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 flex-shrink-0"
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

              {/* Search Bar */}
              <div className="relative w-full h-12 flex-shrink-0 bg-white border border-gray-150 rounded-2xl flex items-center px-4 gap-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm">
                <Search className="h-5 w-5 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une spécialité..."
                  className="bg-transparent flex-1 py-3 text-sm font-bold text-gray-800 outline-none placeholder-gray-400"
                />
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
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
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
                      <p className="text-xs">Essayez un autre mot-clé.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StageFormationHubScreen;
