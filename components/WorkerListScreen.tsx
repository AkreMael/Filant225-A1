
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Worker, User as UserType } from '../types';
import EmbeddedForm from './EmbeddedForm';
import { User } from 'lucide-react';

// --- ICONS (Matching the provided mockup) ---
const BackIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MicIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const IvoryCoastFlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className="w-6 h-4 rounded-sm" aria-label="Drapeau Côte d'Ivoire">
        <rect width="10" height="20" x="0" fill="#FF8200" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="20" fill="#009B77" />
    </svg>
);

// Mockup Icons
const PersonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.603 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const StarRating = ({ rating }: { rating: number }) => {
    const filledStars = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < filledStars} />
            ))}
            <span className="ml-1 text-[10px] text-gray-400 font-bold">{rating.toFixed(1)}</span>
        </div>
    );
};

// --- SYNCHRONIZED IMAGE URLS ---
export const HOTESSE_QUALIF_IMAGE = "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg";
export const CHAUFFEUR_QUALIF_IMAGE = "https://i.supaimg.com/76102a7e-85d6-464e-892a-a8d3f3dd46fe.jpg";
export const COIFFURE_QUALIF_IMAGE = "https://i.supaimg.com/e1a35002-fb22-4999-bd12-ea66e2edeb3b.jpg";
export const ENTRETIEN_QUALIF_IMAGE = "https://i.supaimg.com/1a00ed7f-3558-4457-b0df-72817cd28e6b.jpg";
export const VIGILE_QUALIF_IMAGE = "https://i.supaimg.com/dc4b2081-005b-4d18-9365-ec9e907da19d.jpg";
export const COUTURE_QUALIF_IMAGE = "https://i.supaimg.com/f0775ab3-05f0-4988-92be-412be89eb0e8.jpg";
export const VENDEUR_IMAGE = "https://i.supaimg.com/d807a5eb-bd7a-41d4-8ea2-6306c48c2ab2.jpg";
export const CUISINIER_IMAGE = "https://i.supaimg.com/a11f64e3-46cc-4699-9f1e-74aa787776f1.jpg";
export const NOUNOU_IMAGE = "https://i.supaimg.com/cd0f3a2a-ad0f-4485-8290-f4be3202234f.jpg";
export const JARDINIER_IMAGE = "https://i.supaimg.com/9f697c6c-d584-4957-972c-db8ae0ff856e.jpg";
export const SERVEUSE_IMAGE = "https://i.supaimg.com/74d6f946-9e73-42e0-b388-bd9db6cd2810.jpg";
export const ESTHETICIENNE_IMAGE = "https://i.supaimg.com/5d9fc475-4729-4a62-b51c-5532cacbad5a.jpg";
export const CAISSIER_IMAGE = "https://i.supaimg.com/372b060c-b798-4857-b9b7-a4422cb39736.jpg";
export const RECEPTIONNISTE_IMAGE = "https://i.supaimg.com/be0cec2e-4385-47cb-9c38-38e89b669813.jpg";
export const MAGASINIER_IMAGE = "https://i.supaimg.com/66c538ba-3804-4ef9-a31e-f29481528d08.jpg";
export const MANUTENTIONNAIRE_IMAGE = "https://i.supaimg.com/fa944bb3-6204-4588-80f8-010136729ab7.jpg";
export const VENTE_EN_LIGNE_IMAGE = "https://i.supaimg.com/f8359f5e-0db9-41b2-b717-08b02070000e.jpg";
export const GROSSISTE_IMAGE = "https://i.supaimg.com/7b114b92-0a02-4b0c-8135-0562854f888d.jpg";
export const VENTE_VETEMENTS_IMAGE = "https://i.supaimg.com/12e2fe4a-3481-4c3c-af35-ad043f899c13.jpg";
export const DECORATEUR_NEW_IMAGE = "https://i.supaimg.com/071d3fc3-3339-4d7e-bc2c-c1856576a5f2.jpg";
export const PLAFOND_IMAGE = "https://i.supaimg.com/a033c8f7-2ba0-4b85-92f6-c7bff3d8f723.jpg";
export const COMMUNITY_MANAGER_IMAGE = "https://i.supaimg.com/f76371ac-d945-4d9f-8cef-9389835fb07e.jpg";
export const VIDEASTE_IMAGE = "https://i.supaimg.com/0b29471a-3d31-4d69-a4a0-3b254ff72f5a.jpg";
export const AIDE_DOMICILE_IMAGE = "https://i.supaimg.com/c3c14402-3c1f-4484-bfe1-774bcc4ac6de.png";
export const TEACHER_IMAGE = "https://i.supaimg.com/e1505024-e850-4db2-b2d1-6281d7f21dae.jpg";
export const PHOTOGRAPHE_IMAGE = "https://i.supaimg.com/d600fd73-adb7-431b-8414-42a8065299e5.jpg";
export const MAQUILLAGE_IMAGE = "https://i.supaimg.com/f5cb3f59-9518-4703-b187-98901456c91f.jpg";
export const MANUCURE_IMAGE = "https://i.supaimg.com/fad6642a-a767-4442-a038-aca825747fb5.jpg";
export const MASSAGE_IMAGE = "https://i.supaimg.com/eb12af34-45d2-43a5-805f-ae76c582109c.jpg";
export const LAVEUR_VITRES_IMAGE = "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg";
const UNIFORM_WORKER_IMAGE = "https://i.supaimg.com/17697fbb-4850-449b-8aae-1e5074f46e78.jpg";

export const getSynchronizedWorkerImage = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('chauffeur')) return CHAUFFEUR_QUALIF_IMAGE;
    if (nameLower.includes('vendeur') || nameLower.includes('vendeuse')) return VENDEUR_IMAGE;
    if (nameLower.includes('cuisinier') || nameLower.includes('cuisinière')) return CUISINIER_IMAGE;
    if (nameLower.includes('vigile')) return VIGILE_QUALIF_IMAGE;
    if (nameLower.includes('nounou') || nameLower.includes('baby-sitter')) return NOUNOU_IMAGE;
    if (nameLower.includes('jardinier')) return JARDINIER_IMAGE;
    if (nameLower.includes('serveur') || nameLower.includes('serveuse')) return SERVEUSE_IMAGE;
    if (nameLower.includes('femme de ménage') || nameLower.includes('entretien')) return ENTRETIEN_QUALIF_IMAGE;
    if (nameLower.includes('esthéticienne') || nameLower.includes('estheticienne')) return ESTHETICIENNE_IMAGE;
    if (nameLower.includes('caissière') || nameLower.includes('caissier')) return CAISSIER_IMAGE;
    if (nameLower.includes('réceptionniste')) return RECEPTIONNISTE_IMAGE;
    if (nameLower.includes('magasinier')) return MAGASINIER_IMAGE;
    if (nameLower.includes('manutentionnaire')) return MANUTENTIONNAIRE_IMAGE;
    if (nameLower.includes('vente en ligne')) return VENTE_EN_LIGNE_IMAGE;
    if (nameLower.includes('grossiste')) return GROSSISTE_IMAGE;
    if (nameLower.includes('vêtements')) return VENTE_VETEMENTS_IMAGE;
    if (nameLower.includes('décorateur')) return DECORATEUR_NEW_IMAGE;
    if (nameLower.includes('faux plafond')) return PLAFOND_IMAGE;
    if (nameLower.includes('community manager')) return COMMUNITY_MANAGER_IMAGE;
    if (nameLower.includes('vidéaste') || nameLower.includes('monteur')) return VIDEASTE_IMAGE;
    if (nameLower.includes('garde malade')) return VIGILE_QUALIF_IMAGE;
    if (nameLower.includes('aide à domicile')) return AIDE_DOMICILE_IMAGE;
    if (nameLower.includes('enseignant')) return TEACHER_IMAGE;
    if (nameLower.includes('photographe')) return PHOTOGRAPHE_IMAGE;
    if (nameLower.includes('maquillage')) return MAQUILLAGE_IMAGE;
    if (nameLower.includes('manucure') || nameLower.includes('pédicure')) return MANUCURE_IMAGE;
    if (nameLower.includes('massage')) return MASSAGE_IMAGE;
    if (nameLower.includes('laveur de vitres')) return LAVEUR_VITRES_IMAGE;
    if (nameLower.includes('hôtesse') || nameLower.includes('hotesse')) return HOTESSE_QUALIF_IMAGE;
    if (nameLower.includes('coiffeur') || nameLower.includes('coiffeuse')) return COIFFURE_QUALIF_IMAGE;
    if (nameLower.includes('couturière') || nameLower.includes('couturier')) return COUTURE_QUALIF_IMAGE;
    return UNIFORM_WORKER_IMAGE;
};

const workerTallyLinks: Record<string, string> = {
    'Vendeuse / Vendeur': 'https://tally.so/r/obEROM',
    'Vigile': 'https://tally.so/r/rj5BRX',
    'Nounou / Baby-sitter': 'https://tally.so/r/ODalqa',
    'Caissière / Caissier': 'https://tally.so/r/0Qd7Y9',
    'Agent d’entretien / Femme de ménage': 'https://tally.so/r/BzaKYe',
    'Chauffeur': 'https://tally.so/r/aQ9e1Z',
    'Coiffeur / Coixeuse': 'https://tally.so/r/9qBXYE',
    'Cuisinier / Cuisinière': 'https://tally.so/r/zxjN4g',
    'Réceptionniste': 'https://tally.so/r/D4BKol',
    'Hôtesse d’accueil': 'https://tally.so/r/pbrdN1',
    'Serveur / Serveuse': 'https://tally.so/r/NprDx0',
    'Jardinier': 'https://tally.so/r/J9qlR7',
    'Esthéticienne': 'https://tally.so/r/kdl9jr',
    'Magasinier': 'https://tally.so/r/1AXk0g',
    'Couturière / Couturier': 'https://tally.so/r/WO2rbe',
    'Manucure / Pédicure': 'https://tally.so/r/9qBXYE',
    'Massage': 'https://tally.so/r/9qBXYE'
};

interface WorkerCardProps {
  worker: any;
  user: UserType;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onScheduleService: (url?: string, title?: string) => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
}

const VerifiedBadge = () => (
  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812 3.066 3.066 0 00.723 1.745 3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  </div>
);

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, user, isFavorite, onToggleFavorite, onScheduleService, onOpenForm }) => {
  const isDisponible = worker.category === 'Disponible' || true;
  const imageSrc = getSynchronizedWorkerImage(worker.name || worker.title);
  
  const displayName = worker.name || worker.title;

  const handleExigeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = workerTallyLinks[displayName];
      onScheduleService(url, displayName);
  };

  const handleDemandeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenForm({
      formType: 'worker',
      title: displayName,
      imageUrl: imageSrc,
      description: worker.description
    });
  };

  const handleAppelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`bg-white rounded-[2.5rem] p-5 flex flex-col transition-all relative overflow-hidden animate-in zoom-in-95 duration-300 shadow-xl border border-gray-100`}>
      <div className="flex gap-4">
        {/* Profile Image - Large Rounded Rectangle */}
        <div className="w-24 h-24 rounded-3xl border-2 border-orange-500 overflow-hidden flex-shrink-0 relative bg-gray-50 flex items-center justify-center shadow-inner">
             {/* If we have an image link, we could use it, but keeping the User icon as requested by design consistency */}
            <User className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
            {worker.isVerified && <VerifiedBadge />}
        </div>
        
        {/* Info Area */}
        <div className="flex-1 flex flex-col justify-start">
            <div className="flex justify-between items-start">
                <h3 className="font-black text-black text-lg leading-none mb-2 uppercase tracking-tighter pr-8">
                  {displayName}
                </h3>
                <button 
                  onClick={onToggleFavorite}
                  className={`absolute top-5 right-12 p-1 transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.603 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
            </div>
            {isDisponible && (
                <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={worker.rating || 4.5} />
                </div>
            )}
            <p className="text-gray-600 text-[11px] leading-tight font-medium line-clamp-3">
                {worker.description}
            </p>
        </div>
      </div>
      
      {/* Footer Area with Circular Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4">
        {/* Proposer - Person Icon (Orange Outline) */}
        <button
          onClick={handleExigeClick}
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Proposer"
        >
          <PersonIcon />
        </button>


        {/* Demander - Send/Plane Icon (Orange Outline) */}
        <button
          onClick={handleDemandeClick}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all shadow-md active:scale-90 animate-demande-signal bg-white border-orange-500 text-orange-500`}
          title="Demander"
        >
          <SendIcon />
        </button>

        {/* Appel - Phone Icon (Orange Outline) */}
        <a
          href={`tel:${worker.phone}`}
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Appel"
        >
          <PhoneIcon />
        </a>
      </div>
      
      {/* Decorative Status Dot */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Disponible</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]"></div>
      </div>
    </div>
  );
};

interface WorkerListScreenProps {
  onBack: () => void;
  user: UserType;
  onScheduleService: (url?: string, title?: string) => void;
  onOpenSiteWorkers: () => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
}

const WorkerListScreen: React.FC<WorkerListScreenProps> = ({ onBack, user, onScheduleService, onOpenSiteWorkers, onOpenForm }) => {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Disponible');
  const [selectedSubCategory, setSelectedSubCategory] = useState<'all' | 'depannage' | 'construction' | 'nettoyage' | 'evenementiel' | 'transport' | 'location'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('filant_worker_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Individual section collapses
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    depannage: false,
    construction: false,
    nettoyage: false,
    evenementiel: false,
    transport: false,
    location: false
  });

  useEffect(() => {
    localStorage.setItem('filant_worker_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setFavorites(prev => 
        prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const depannageWorkers = [
    { title: 'Plombier rapide', description: 'Expert en fuites et canalisations.' },
    { title: 'Électricien rapide', description: 'Installations et dépannages électriques.' },
    { title: 'Serrurier rapide', description: 'Ouverture de portes et serrures.' },
    { title: 'Vitrier rapide', description: 'Pose et réparation de vitrages.' },
    { title: 'Réparation climatiseur rapide', description: 'Maintenance clim habitations.' },
    { title: 'Réparation frigo rapide', description: 'Spécialiste froid ménager.' },
    { title: 'Réparation télévision rapide', description: 'Maintenance TV et écrans.' },
    { title: 'Réparation machine à laver rapide', description: 'Dépannage gros électroménager.' },
    { title: 'Réparation pompe à eau rapide', description: 'Entretien systèmes pompage.' },
    { title: 'Réparation fuite d’eau rapide', description: 'Interventions plomberie d’urgence.' },
    { title: 'Dépannage Internet rapide', description: 'Réseaux WiFi et connexion.' },
    { title: 'Dépannage parabole rapide', description: 'Installation antennes satellite.' },
    { title: 'Dépannage électroménager rapide', description: 'Fours, micro-ondes, aspirateurs.' },
    { title: 'Dépannage groupe électrogène rapide', description: 'Maintenance sources secours.' },
    { title: 'Dépannage auto rapide', description: 'Mécanique et assistance route.' },
  ];

  const constructionWorkers = [
    { title: 'Maçon rapide', description: 'Gros œuvre et maçonnerie.' },
    { title: 'Ferrailleur rapide', description: 'Armatures acier bâtiment.' },
    { title: 'Coffreur rapide', description: 'Structures bois pour béton.' },
    { title: 'Carreleur rapide', description: 'Pose carrelage et dallage.' },
    { title: 'Peintre bâtiment rapide', description: 'Revêtements murs et plafonds.' },
    { title: 'Électricien bâtiment rapide', description: 'Réseau complet installations.' },
    { title: 'Plombier bâtiment rapide', description: 'Installation sanitaire bâtiment.' },
    { title: 'Soudeur rapide', description: 'Chaudronnerie et soudures fer.' },
    { title: 'Charpentier rapide', description: 'Structures bois toitures.' },
    { title: 'Menuisier aluminium rapide', description: 'Baies et portes alu.' },
    { title: 'Menuisier bois rapide', description: 'Conception meubles bois.' },
    { title: 'Staffeur rapide', description: 'Plâtre et déco plafonds.' },
    { title: 'Étancheur rapide', description: 'Isolation eau toitures.' },
    { title: 'Poseur de portail rapide', description: 'Sécurité accès maisons.' },
    { title: 'Poseur de caméra rapide', description: 'Sécurité électronique.' },
    { title: 'Climatisation bâtiment rapide', description: 'Installations clim centralisées.' },
    { title: 'Technicien forage rapide', description: 'Eaux souterraines puits.' },
    { title: 'Constructeur maison rapide', description: 'Maître d’œuvre bâtiment.' },
    { title: 'Finition bâtiment rapide', description: 'Peinture, carrelage, déco.' },
  ];

  const nettoyageWorkers = [
    { title: 'Technicien de surface rapide', description: 'Nettoyage professionnel bureaux.' },
    { title: 'Nettoyage maison rapide', description: 'Entretien complet domicile.' },
    { title: 'Nettoyage bureau rapide', description: 'Hygiène espaces travail.' },
    { title: 'Nettoyage chantier rapide', description: 'Retrait gravats après travaux.' },
    { title: 'Lavage automobile rapide', description: 'Propreté véhicule express.' },
    { title: 'Désinfection rapide', description: 'Traitement anti-germes pro.' },
    { title: 'Entretien jardin rapide', description: 'Tonte et entretien vert.' },
    { title: 'Entretien piscine rapide', description: 'Nettoyage bassins et filtres.' },
  ];

  const evenementielWorkers = [
    { title: 'Cuisinier rapide', description: 'Traiteur événements privés.' },
    { title: 'Serveur rapide', description: 'Service buffet et accueil.' },
    { title: 'Décorateur rapide', description: 'Ambiance salles de fête.' },
    { title: 'DJ rapide', description: 'Ambiance musicale pro.' },
    { title: 'Sonorisateur rapide', description: 'Installation audio events.' },
    { title: 'Organisateur événementiel rapide', description: 'Gestion complète mariages.' },
    { title: 'Photographe rapide', description: 'Couverture photo événement.' },
    { title: 'Vidéaste rapide', description: 'Film et montage souvenir.' },
  ];

  const transportWorkers = [
    { title: 'Chauffeur rapide', description: 'Transport privé personnes.' },
    { title: 'Déménageur rapide', description: 'Manutention objets lourds.' },
    { title: 'Transport marchandises rapide', description: 'Logistique colis lourds.' },
    { title: 'Transport matériaux rapide', description: 'Livraison ciment, sable.' },
    { title: 'Transport déménagement rapide', description: 'Logistique déménagement pro.' },
  ];

  const locationEquipmentWorkers = [
    { title: 'Camion benne', description: 'Transport sable, gravier pro.' },
    { title: 'Camion de campagne', description: 'Camion podium sonorisé.' },
    { title: 'Bâche à louer', description: 'Toutes tailles dispo.' },
    { title: 'Chaise à louer', description: 'Chaises confortables.' },
    { title: 'Table à louer', description: 'Tables réception pro.' },
    { title: 'Groupe électrogène', description: 'Puissance garantie.' },
    { title: 'Bétonnière', description: 'Mélange efficace BTP.' },
    { title: 'Échafaudage', description: 'Travaux hauteur safe.' },
    { title: 'Tracteur', description: 'Labourage agricole.' },
    { title: 'Mini pelle', description: 'Accès restreint.' },
    { title: 'Pelle mécanique', description: 'Terrassement pro.' },
    { title: 'Marteau piqueur', description: 'Démolition béton.' },
    { title: 'Compresseur', description: 'Outils pneumatiques.' },
    { title: 'Sonorisation', description: 'Full audio events.' },
    { title: 'Tente événementielle', description: 'Grands formats dispo.' },
    { title: 'Véhicule de transport', description: 'Utilitaires déménagement.' },
    { title: 'Engin de chantier', description: 'BTP lourds.' },
  ];

  const workersCategorized = [
    { id: 'depannage', title: 'DÉPANNAGE RAPIDE', items: depannageWorkers, btnLabel: 'Tous les dépannages' },
    { id: 'construction', title: 'SERVICES CONSTRUCTION', items: constructionWorkers, btnLabel: 'Tous les services construction' },
    { id: 'nettoyage', title: 'NETTOYAGE & ENTRETIEN (TECHNICIENS DE SURFACE)', items: nettoyageWorkers, btnLabel: 'Tous les services nettoyage' },
    { id: 'evenementiel', title: 'CUISINE ET ÉVÉNEMENTIELS', items: evenementielWorkers, btnLabel: 'Tous les services événementiels' },
    { id: 'transport', title: 'TRANSPORT ET LIVRAISON', items: transportWorkers, btnLabel: 'Tous les services transport' },
    { id: 'location', title: 'SERVICES DE LOCATION D’ÉQUIPEMENTS', items: locationEquipmentWorkers, btnLabel: 'Tous les équipements' },
  ];

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        // Only show loading if we don't have workers yet
        if (allWorkers.length === 0) {
          setLoading(true);
        }
        const workers = await databaseService.getWorkers();
        setAllWorkers(workers);
        setError(null);
      } catch (e) {
        setError("Impossible de charger la liste des professionnels.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const filteredWorkers = allWorkers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = w.category === selectedCategory;
    
    // Sub-category matching logic
    const matchesSubCategory = (() => {
        if (selectedSubCategory === 'all') return true;
        const nameLower = w.name.toLowerCase();
        const descLower = (w.description || '').toLowerCase();
        const t = `${nameLower} ${descLower}`;

        if (selectedSubCategory === 'depannage') {
            return t.includes('plombier') || t.includes('électri') || t.includes('serrurier') || t.includes('vitrier') || 
                   t.includes('réparation') || t.includes('clim') || t.includes('frigo') || t.includes('télévision') || 
                   t.includes('machine à laver') || t.includes('pompe') || t.includes('fuite') || t.includes('internet') || 
                   t.includes('parabole') || t.includes('électroménager') || t.includes('groupe') || t.includes('auto');
        }
        if (selectedSubCategory === 'construction') {
            return t.includes('maçon') || t.includes('ferrailleur') || t.includes('coffreur') || t.includes('carreleur') || 
                   t.includes('peintre') || t.includes('menuisier') || t.includes('charpentier') || t.includes('staff') || 
                   t.includes('étanch') || t.includes('portail') || t.includes('caméra') || t.includes('forage') || t.includes('bâti') || t.includes('déco');
        }
        if (selectedSubCategory === 'nettoyage') {
            return t.includes('surface') || t.includes('ménage') || t.includes('entretien') || t.includes('lavage') || 
                   t.includes('désinfection') || t.includes('jardin') || t.includes('piscine') || t.includes('vitre');
        }
        if (selectedSubCategory === 'evenementiel') {
            return t.includes('cuisin') || t.includes('serveur') || t.includes('décorat') || t.includes('dj') || 
                   t.includes('sono') || t.includes('organisat') || t.includes('photom') || t.includes('vidéaste') || 
                   t.includes('hôtesse') || t.includes('maquillage') || t.includes('massage');
        }
        if (selectedSubCategory === 'transport') {
            return t.includes('chauffeur') || t.includes('déménageur') || t.includes('livreur');
        }
        if (selectedSubCategory === 'location') {
            return t.includes('magasinier') || t.includes('manutentionnaire');
        }
        return true;
    })();

    // Titles to exclude
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  return (
    <div className="bg-white flex-1 flex flex-col h-full">
        <header className="bg-white pt-2 pb-2 px-4 sticky top-0 z-20 border-b border-gray-100 shadow-sm">
            <div className="flex flex-row items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-xl shadow-sm">
                        <span className="font-black text-xl">F</span>
                    </div>
                    <h1 className="text-xl font-black text-orange-500 tracking-tight whitespace-nowrap">
                        FILANT<span className="text-lg align-top">°</span>225
                    </h1>
                </div>

                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-orange-500 text-xs text-center shadow-sm text-black bg-gray-50 font-bold"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <MicIcon className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <SearchIcon className="h-3 w-3 text-gray-400" />
                    </div>
                </div>

                <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0 border border-gray-200 dark:border-slate-600">
                    <BackIcon className="h-6 w-6 text-gray-800 dark:text-white" />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <IvoryCoastFlagIcon />
                <p className="text-xs font-bold text-black truncate">Trouvez rapidement le service dont vous avez besoin</p>
            </div>

            <div className="flex items-center gap-3 pb-3 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => {
                        setSelectedCategory('Disponible');
                        setSelectedSubCategory('all');
                    }}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-[12px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 relative shadow-lg active:scale-95 ${
                        selectedCategory === 'Disponible' && selectedSubCategory === 'all'
                            ? 'bg-green-600 text-white border-2 border-white/20' 
                            : 'bg-gray-100 text-gray-400'
                    }`}
                >
                    <span>Disponible</span>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                </button>

                {[
                    { id: 'depannage', label: 'Dépannage' },
                    { id: 'construction', label: 'Construction' },
                    { id: 'nettoyage', label: 'Nettoyage' },
                    { id: 'evenementiel', label: 'Événementiel' },
                    { id: 'transport', label: 'Transport' },
                    { id: 'location', label: 'Location' }
                ].map(sub => (
                    <button
                        key={sub.id}
                        onClick={() => {
                            setSelectedCategory('Disponible');
                            setSelectedSubCategory(sub.id as any);
                        }}
                        className={`flex-shrink-0 px-5 py-2 rounded-full font-black text-[12px] uppercase transition-all whitespace-nowrap ${
                            selectedSubCategory === sub.id 
                            ? 'bg-orange-500 text-white shadow-lg scale-105' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}

                <button 
                    onClick={onOpenSiteWorkers}
                    className="px-5 py-2 bg-orange-600 text-white rounded-full font-black text-[12px] uppercase whitespace-nowrap shadow-md hover:bg-orange-700 active:scale-95 transition-all flex-shrink-0"
                >
                    Option site travailleur
                </button>
            </div>
        </header>
      
      <main className="flex-1 bg-gray-100 p-4 overflow-y-auto pb-24">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        ) : error ? (
            <div className="p-4 text-center text-red-500 h-full">{error}</div>
        ) : (
            <div className="flex flex-col gap-10">
                {workersCategorized.filter(s => selectedSubCategory === 'all' || selectedSubCategory === s.id).map(section => {
                    const filtered = section.items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
                    if (filtered.length === 0 && searchTerm) return null;

                    const isExpanded = expandedSections[section.id];
                    const displayItems = isExpanded ? filtered : filtered.slice(0, 3);

                    return (
                        <div key={section.id} className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <div className="bg-[#f97316] px-4 py-1.5 rounded-full shadow-md">
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => toggleSection(section.id)} 
                                    className="text-orange-600 text-[11px] font-black uppercase hover:opacity-80 active:scale-95 transition-all"
                                >
                                    {isExpanded ? 'Réduire' : 'Plus'}
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {displayItems.map((worker: any, idx: number) => (
                                    <WorkerCard 
                                        key={`${section.id}-${idx}`} 
                                        worker={{...worker, category: 'Disponible', rating: 4.8, isVerified: true, phone: '0101010101'}} 
                                        user={user}
                                        isFavorite={favorites.includes(worker.title)}
                                        onToggleFavorite={(e) => toggleFavorite(e, worker.title)}
                                        onScheduleService={onScheduleService}
                                        onOpenForm={onOpenForm}
                                    />
                                ))}
                            </div>

                            {!isExpanded && filtered.length > 3 && (
                                <button 
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full py-2 bg-white rounded-2xl text-orange-500 font-black text-[11px] uppercase border border-dashed border-orange-200 active:scale-[0.98] transition-all shadow-sm"
                                >
                                    {section.btnLabel}
                                </button>
                            )}
                        </div>
                    );
                })}

                {selectedSubCategory === 'all' && searchTerm === '' && filteredWorkers.length > 0 && (
                    <div className="space-y-4 mt-4">
                        <div className="bg-green-600 px-4 py-1.5 rounded-full shadow-md w-fit inline-block">
                            <h2 className="text-[11px] font-black text-white uppercase tracking-tight">
                                AUTRES PROFESSIONNELS DISPONIBLES
                            </h2>
                        </div>
                        {filteredWorkers
                            .filter(w => !workersCategorized.some(s => s.items.some(i => i.title.toLowerCase() === w.name.toLowerCase())))
                            .map(worker => (
                            <WorkerCard 
                                key={worker.id} 
                                worker={worker} 
                                user={user}
                                isFavorite={favorites.includes(worker.name)}
                                onToggleFavorite={(e) => toggleFavorite(e, worker.name)}
                                onScheduleService={onScheduleService}
                                onOpenForm={onOpenForm}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default WorkerListScreen;
