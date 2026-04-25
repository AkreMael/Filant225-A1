
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tab, User } from '../types';
import { History as LucideHistory, Calendar as LucideCalendar, Star as LucideStar } from 'lucide-react';
import MenuBackground from './common/MenuBackground';
import { databaseService, SavedContact } from '../services/databaseService';
import ScannerOverlay from './ScannerOverlay';
import { SEARCHABLE_TITLES } from './common/formDefinitions';
import { audioService } from '../services/audioService';
import { chatService } from '../services/chatService';
import { isAdmin, getCardType } from '../utils/authUtils';

// --- SVG Icons ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
        {children}
    </div>
);

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SendIconSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);

const InscriptionIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536" /></svg>;
const MapPinIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EmergencyIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const AssistantIcon = () => <svg className="w-6 h-6 text-white" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 12H16C13.7909 12 12 13.7909 12 16V48C12 50.2091 13.7909 52 16 52H42C44.2091 52 46 50.2091 46 48V16C46 13.7909 44.2091 12 42 12Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M29 25C31.2091 25 33 23.2091 33 21C33 18.7909 31.2091 17 29 17C26.7909 17 25 18.7909 25 21C25 23.2091 26.7909 25 29 25Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M38 42C38 37.0294 33.9706 33 29 33C24.0294 33 20 37.0294 20 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 20H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 28H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 36H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const SearchBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const NotificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

const ServiceRapideIcon: React.FC = () => <IconWrapper className="w-12 h-12 bg-white/20"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></IconWrapper>;
const EquipmentIcon: React.FC = () => <IconWrapper className="w-12 h-12 bg-orange-600/20"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.94-2.197 1.088-3.386l-.738-2.652L3 14l2.652.738c1.19.147 2.35.56 3.386 1.088l3.03-2.496z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21.75l-4.135-4.134a1.21 1.21 0 010-1.707l4.134-4.135a1.21 1.21 0 011.707 0l4.135 4.135a1.21 1.21 0 010 1.707l-4.134 4.135a1.21 1.21 0 01-1.707 0z" /></svg></IconWrapper>;

// --- Admin Icons ---
const StorageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
const ActivationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const AssociationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const SMSAdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

const IvoryCoastFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className={className} aria-label="Drapeau Côte d'Ivoire">
        <rect width="10" height="20" x="0" fill="#FF8200" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="20" fill="#009B77" />
    </svg>
);

const PointerArrow: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const LargeMapPinIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-indigo-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    </IconWrapper>
);

const LargeHouseIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-blue-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    </IconWrapper>
);

const LargeCarteProIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-orange-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-4M9 4h6a2 2 0 012v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2zm4 8a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 16H8" />
        </svg>
    </IconWrapper>
);

const ASSISTANT_IMAGE_URL = "https://i.supaimg.com/c2d87a7d-60e1-4de2-abce-69cbdf1a2aac.png";
const TIKTOK_IMAGE_URL = "https://i.supaimg.com/5ee5d84d-9220-451a-95a6-a1a75146158d.png";

// --- DATA TRAVAILLEURS BATIMENT ---
const batimentWorkers = [
    { title: 'Plombier rapide', description: 'Réparation fuites d’eau et installations.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Électricien rapide', description: 'Dépannage électrique sécurisé.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Carreleur rapide', description: 'Pose de carreaux tous formats.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Charpentier rapide', description: 'Menuiserie et charpente bois.', img: "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg" },
    { title: 'Maçon rapide', description: 'Maçonnerie et rénovation rapide.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Soudeur rapide', description: 'Travaux de soudure et ferronnerie.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Peintre rapide', description: 'Peinture et finitions intérieures.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg" },
    { title: 'Technicien entretien climatisation Rapide', description: 'Entretien et recharge clim.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Installateur de caméras de surveillance Rapide', description: 'Installation vidéosurveillance.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ebb24cd2-8a14-45c1-b273-0b4a81361c8b.jpg" },
    { title: 'Installateur de fenêtres et portes vitrées Rapide', description: 'Pose menuiserie et vitrerie.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg" },
    { title: 'Menuisier Rapide', description: 'Menuiserie bois et meubles.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg" },
];

// --- COMPONENT CAROUSEL ---
const BuildingCarousel: React.FC<{ onSelectItem: (item: any) => void }> = ({ onSelectItem }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isUserInteracting, setIsUserInteracting] = useState(false);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || isUserInteracting) return;

        const scrollStep = () => {
            if (!scrollContainer) return;
            if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth)) {
                scrollContainer.scrollLeft = 0;
            } else {
                scrollContainer.scrollLeft += 0.8; // Vitesse de défilement douce
            }
        };

        const intervalId = window.setInterval(scrollStep, 30);
        return () => window.clearInterval(intervalId);
    }, [isUserInteracting]);

    return (
        <div className="w-full pt-1 pb-4 overflow-hidden">
            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-4 scrollbar-hide"
                onTouchStart={() => setIsUserInteracting(true)}
                onTouchEnd={() => setIsUserInteracting(false)}
                onMouseDown={() => setIsUserInteracting(true)}
                onMouseUp={() => setIsUserInteracting(false)}
                onMouseLeave={() => setIsUserInteracting(false)}
            >
                {batimentWorkers.map((item, idx) => (
                    <div 
                        key={idx}
                        onClick={() => onSelectItem(item)}
                        className="flex-shrink-0 w-[160px] bg-white rounded-[2rem] overflow-hidden shadow-xl flex flex-col transition-all relative border border-gray-100"
                    >
                        <div className="p-2">
                            <div className="h-[100px] w-full rounded-2xl overflow-hidden relative shadow-inner bg-slate-50 border border-gray-100">
                                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="px-4 pb-4 flex flex-col text-left">
                            <h4 className="text-[12px] font-black text-gray-900 uppercase leading-tight mb-1 tracking-tight truncate">{item.title}</h4>
                            <p className="text-[#ef4444] font-black text-[10px] leading-tight mb-1.5 uppercase">
                                H. Descente : <span className="text-black font-bold">18h30</span>
                            </p>
                            <p className="text-[9px] text-gray-400 leading-snug italic line-clamp-2 mb-2">
                                {item.description}
                            </p>
                            <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Filant Services</span>
                                <div className="flex h-2.5 w-2.5 rounded-full border-2 border-white shadow-md animate-flash-green-red"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface HomeScreenProps {
  onNavigate: (view: 'worker_list' | 'location_hub' | 'location_map' | 'notifications' | 'emergency_form' | 'assistant_qr', category?: 'appartement' | 'equipement') => void;
  user: User;
  setActiveTab: (tab: Tab) => void;
  onOpenBuildingService: (item: any) => void;
  onRestrictedAccess: (message?: string) => void;
  onOpenFavorites?: () => void;
  onShowPopup: (
    msg: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string
  ) => void;
  onRegisterDirectly?: (type: string) => void;
  onTriggerClosedNotification?: () => void;
  unreadChatCount?: number;
  unreadNotifCount?: number;
  deferredPrompt: any;
  onInstallPWA: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNavigate, 
  user, 
  setActiveTab, 
  onOpenBuildingService, 
  onRestrictedAccess, 
  onOpenFavorites, 
  onShowPopup, 
  onRegisterDirectly, 
  unreadChatCount = 0,
  unreadNotifCount = 0,
  deferredPrompt,
  onInstallPWA
}) => {
  const isMainServiceOpen = true;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNoOffer, setShowNoOffer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- CONVERSATIONAL ASSISTANT STATES ---
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [matchedResult, setMatchedResult] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState<{ min: number; sec: number } | null>(null);

  const isClientMode = user.role === 'Client';

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const isCardExpired = false;
  const cardData = null;

  const handleMainServiceClick = (view: 'worker_list' | 'location_hub' | 'location_map' | 'notifications' | 'emergency_form' | 'assistant_qr', category?: 'appartement' | 'equipement') => {
      onNavigate(view, category);
  };

  const formattedDate = useMemo(() => {
    const dayName = currentTime.toLocaleDateString('fr-FR', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNum = currentTime.toLocaleDateString('fr-FR', { day: '2-digit' });
    return `${capitalizedDay} ${dayNum}`;
  }, [currentTime]);
  
  const isClient = true; // Forcé car l'app est maintenant Client-only
  const isEntreprise = false;
  const isTravailleur = false;
  const isProprietaire = false;
  const isAgence = false;
  
  const isProRole = false;
  const isGroupA = true;

  const menuTitle = "Mise en relation & Solutions";

  const handleScanResult = (data: string) => {
    setShowScanner(false);
    const parseKeyValue = (text: string, key: string) => {
        const regex = new RegExp(`${key}\\s*[:=]\\s*([^\\n]+)`, 'i');
        return text.match(regex)?.[1]?.trim();
    };
    const sanitizePhoneNumber = (phone: string): string => {
        if (!phone) return '';
        let cleanPhone = phone.replace(/[\s-.]/g, '');
        if (cleanPhone.startsWith('+225')) cleanPhone = cleanPhone.slice(4);
        return cleanPhone;
    };

    const title = parseKeyValue(data, 'Poste') || parseKeyValue(data, 'Titre') || 'Assistant QR';
    const name = parseKeyValue(data, 'Nom') || parseKeyValue(data, 'Prénom') || 'Travailleur';
    const phone = parseKeyValue(data, 'Tél') || parseKeyValue(data, 'Phone') || parseKeyValue(data, 'WhatsApp') || parseKeyValue(data, 'Téléphone');
    const city = parseKeyValue(data, 'Ville') || parseKeyValue(data, 'Localité') || parseKeyValue(data, 'Commune') || 'Non spécifiée';
    const details = parseKeyValue(data, 'Details') || parseKeyValue(data, 'Infos') || parseKeyValue(data, 'Détails');

    let info: any = null;
    if (name && phone) {
        info = { name, phone: sanitizePhoneNumber(phone), city, title, details };
    }

    if (info) {
        const currentContacts = databaseService.getContacts(user.phone);
        const newContact: SavedContact = {
            id: Date.now().toString(),
            title: info.title || 'Assistant QR',
            name: info.name,
            phone: info.phone,
            city: info.city,
            review: info.details || info.city 
        };
        const updatedContacts = [...currentContacts, newContact];
        databaseService.saveContacts(user.phone, updatedContacts, user);
        onShowPopup("Information validée et intégrée dans l'Assistance QR !", "alert");
    } else {
        onShowPopup("Le format du code QR n'a pas pu être structuré automatiquement.", "alert");
    }
  };

  const handleSearchSubmit = async () => {
    const val = searchTerm.trim().toLowerCase();
    if (!val) return;

    setIsSearchSubmitted(true);
    setIsAssistantThinking(true);
    setMatchedResult(null);
    setAssistantText(''); 

    const match = SEARCHABLE_TITLES.find(item => 
        val.includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(val)
    );

    const response = await chatService.getHomeAssistantAdvice(searchTerm);
    
    setIsAssistantThinking(false);
    setAssistantText(response);
    audioService.speak(response);

    if (match && val.length > 2) {
        setMatchedResult(match);
    }
    
    setSearchTerm('');
  };

  const handleCancelSearch = () => {
    setIsSearchSubmitted(false);
    setAssistantText('');
    setMatchedResult(null);
    setSearchTerm('');
    audioService.cancel();
  };

  const handleSelectSearchResult = (item: any) => {
    const event = new CustomEvent('trigger-interactive-modal', { 
        detail: { title: item.title, formType: item.type } 
    });
    handleCancelSearch();
    handleMainServiceClick(item.type === 'worker' ? 'worker_list' : 'location_hub');
  };

  const bgClass = isClient ? 'bg-white' : 'bg-orange-500';
  const textClass = isClient ? 'text-slate-900' : 'text-white';

  if (showNoOffer) {
    return (
        <div className="absolute inset-0 z-[600] bg-orange-500 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <button 
                onClick={() => setShowNoOffer(false)}
                className="absolute top-8 left-8 p-3 bg-white/20 rounded-full text-white active:scale-90 transition-transform"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] border border-white/20 shadow-2xl text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-white font-black text-2xl uppercase tracking-tighter leading-tight">
                    Aucune offre disponible pour le moment
                </p>
            </div>
            <p className="mt-8 text-white/60 font-bold uppercase tracking-widest text-[10px]">Filant°225 • Service Client</p>
        </div>
    );
  }

  return (
    <div className={`${bgClass} ${textClass} min-h-full flex flex-col font-sans relative`}>
      
      <MenuBackground />
      
      <div className="relative z-10 flex flex-col w-full">
      
        <header className="pt-5">
            <div className="flex justify-between items-center px-4 h-20">
                <div className="flex items-center gap-1.5 relative flex-1">
                    <div className="flex items-center gap-2">
                         <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png" alt="Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                         <h2 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">FILANT°225</h2>
                    </div>
                </div>

                <div className="flex items-center space-x-1.5">
                    <div className={`px-3 py-1 border-2 border-blue-500 rounded-lg text-sm font-bold ${isClient ? 'text-slate-900 border-blue-500' : 'text-white border-white'} font-mono tracking-wider select-none bg-white/5 shadow-sm`}>
                        {formattedDate}
                    </div>
                    {!isAdmin(user) && (
                        <button 
                            onClick={() => handleMainServiceClick('notifications')}
                            className="relative active:scale-90 transition-transform focus:outline-none"
                            aria-label="Notifications"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                unreadNotifCount > 0 ? 'animate-blink-red-green' : ''
                            }`}>
                                <NotificationIcon />
                            </div>
                            {unreadNotifCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full border border-white shadow-sm">
                                    {unreadNotifCount}
                                </span>
                            )}
                        </button>
                    )}
                    {isAdmin(user) ? (
                        <button 
                            onClick={() => onNavigate('admin_sms')}
                            className="active:scale-90 transition-transform shadow-lg focus:outline-none"
                            aria-label="Gestion SMS Administrateur"
                        >
                            <IvoryCoastFlagIcon className="h-6 w-9 rounded-sm" />
                        </button>
                    ) : (
                        <IvoryCoastFlagIcon className="h-6 w-9 rounded-sm shadow-sm" />
                    )}
                </div>
            </div>

            <div className={`bg-white/10 backdrop-blur-md my-4 p-6 border-y ${isClient ? 'border-slate-200' : 'border-white/10'} overflow-hidden`}>
                <div className="flex flex-col items-center">
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter flex items-center justify-center flex-nowrap whitespace-nowrap">
                        <img 
                            src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png" 
                            alt="Logo" 
                            className="w-14 h-14 sm:w-20 sm:h-20 object-contain mr-3"
                            referrerPolicy="no-referrer"
                        />
                        <div className="flex">
                            {"FILANT".split("").map((letter, idx) => (
                                <span 
                                    key={idx} 
                                    className="text-green-500 drop-shadow-[0_2px_10px_rgba(34,197,94,0.4)] animate-logo-letter"
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    {letter}
                                </span>
                            ))}
                        </div>
                        <span className="text-white bg-orange-600 rounded-lg px-3 py-1 text-4xl sm:text-5xl ml-2 shadow-xl select-none animate-logo-225">225</span>
                    </h1>
                    <p className={`font-black text-xs mt-3 text-center uppercase tracking-[0.3em] ${isClient ? 'text-slate-400' : 'opacity-80'}`}>{menuTitle}</p>
                </div>
            </div>
            
            <div className="flex justify-between items-end px-4">
            <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Session active</p>
                <p className="text-lg font-bold capitalize">
                    {user.name} <span className="text-xs font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-1">Client</span>
                </p>
                <p className="text-sm font-medium">{user.city} <span className="text-green-400 font-bold animate-pulse ml-2">• EN LIGNE</span></p>
            </div>
            <div className="flex items-start space-x-3">
                <a href="https://www.tiktok.com/@filant225" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center space-y-1 group">
                    <div className="w-12 h-12 transform group-hover:scale-110 transition-transform flex items-center justify-center">
                        <img src={TIKTOK_IMAGE_URL} alt="TikTok" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">TikTok</span>
                </a>

                <button 
                    onClick={() => setActiveTab(Tab.UserChat)}
                    className="flex flex-col items-center space-y-1 group relative"
                >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform group-hover:scale-110 relative overflow-hidden ${
                        unreadChatCount > 0 ? 'animate-blink-red-green' : 'bg-blue-600'
                    }`}>
                        <ChatBubbleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Messages</span>
                    {unreadChatCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center px-1 bg-red-600 shadow-xl z-20">
                            <span className="text-[9px] font-black text-white leading-none">{unreadChatCount}</span>
                        </div>
                    )}
                </button>

                <button 
                    onClick={() => handleMainServiceClick('assistant_qr')}
                    className="flex flex-col items-center space-y-1 group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-full shadow-lg transform group-hover:scale-110 transition-transform flex items-center justify-center">
                        <AssistantIcon />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Assistant QR</span>
                </button>

                <button 
                    onClick={() => handleMainServiceClick('emergency_form')}
                    className="flex flex-col items-center space-y-1 group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-600 rounded-full shadow-lg transform group-hover:scale-110 transition-transform border border-red-400 animate-pulse flex items-center justify-center">
                        <EmergencyIcon />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Urgence</span>
                </button>
            </div>
            </div>

            <div className="px-4 mt-6">
                <div className={`h-px bg-gradient-to-r from-transparent ${isClient ? 'via-slate-200' : 'via-white/30'} to-transparent`}></div>
            </div>
        </header>

        <main className="w-full p-4 flex flex-col gap-0 pb-12">
            {/* PWA Install Banner */}
            {deferredPrompt && (
                <div className="mb-6 animate-in slide-in-from-top duration-500">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2rem] p-5 shadow-xl border-4 border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                                <img 
                                    src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png" 
                                    alt="Logo" 
                                    className="w-10 h-10 object-contain"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-black text-lg uppercase leading-tight tracking-tighter">Installer l'application</h3>
                                <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mt-0.5">Accès rapide & Notifications</p>
                            </div>
                            <button 
                                onClick={onInstallPWA}
                                className="bg-white text-orange-600 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-90 transition-all hover:bg-orange-50"
                            >
                                Installer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleMainServiceClick('worker_list')} 
                        className={`aspect-square bg-white text-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xl transform active:scale-95 transition-all border-2 border-green-500 relative overflow-hidden group`}
                    >
                        <img 
                            src="https://i.supaimg.com/2681e7cd-50eb-4001-a420-79f8832470c3.jpg" 
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover opacity-15"
                            referrerPolicy="no-referrer"
                        />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="absolute top-[-16px] left-[-16px] right-[-16px] h-1.5 bg-green-500"></div>
                            <ServiceRapideIcon />
                            <span className="text-sm font-black uppercase mt-3 tracking-tight">Travailleurs Qualifiés</span>
                            <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-green-100 text-green-700`}>
                                Disponibles
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => handleMainServiceClick('location_hub', 'appartement')} 
                        className={`aspect-square bg-white text-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xl transform active:scale-95 transition-all border-2 border-blue-500 relative overflow-hidden group`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="absolute top-[-16px] left-[-16px] right-[-16px] h-1.5 bg-blue-600"></div>
                            <LargeHouseIcon />
                            <span className="text-sm font-black uppercase mt-3 tracking-tight">Location d'appartements</span>
                            <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-blue-100 text-blue-700`}>
                                Voir offres
                            </div>
                        </div>
                    </button>
                </div>

                <div className="px-4 py-0 w-full flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-animated-search-border animate-search-border-flow shadow-lg"></div>
                        <div className="relative w-full max-w-[240px] h-11 rounded-full p-[2.5px] overflow-hidden group shadow-xl">
                            <div className="absolute inset-0 bg-animated-search-border animate-search-border-flow"></div>
                            <div className="relative w-full h-full bg-[#3d4234] rounded-full flex items-center px-4 gap-2 shadow-inner">
                                <div className="w-1 h-5 bg-white animate-search-cursor-color rounded-full"></div>
                                <div className="flex-1 flex items-center justify-between overflow-hidden">
                                    <input 
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter') handleSearchSubmit(); }}
                                        placeholder="Qu'est-ce que vous recherchez...."
                                        className="bg-transparent border-none outline-none text-white/80 font-bold text-[10px] tracking-tight truncate w-full placeholder-white/40 lowercase"
                                    />
                                    <button 
                                        onClick={handleSearchSubmit}
                                        className={`${searchTerm.trim().length > 0 ? 'bg-orange-500' : 'bg-transparent text-white/40'} p-1.5 rounded-full transition-all active:scale-90 ml-1`}
                                    >
                                        <SendIconSmall />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!isSearchSubmitted && (
                    <BuildingCarousel onSelectItem={(item) => onOpenBuildingService(item)} />
                )}

                <button 
                    onClick={() => handleMainServiceClick('location_hub', 'equipement')} 
                    className={`w-full bg-white text-slate-900 rounded-3xl p-5 flex items-center justify-between shadow-xl transform active:scale-[0.98] transition-all border-2 border-green-500`}
                >
                    <div className="flex items-center space-x-4 text-left">
                        <EquipmentIcon />
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-black uppercase tracking-tight leading-none">Location d’équipements</span>
                            <span className="text-[10px] opacity-80 mt-1 font-bold text-gray-500">Matériels, sonorisation, baches et plus</span>
                        </div>
                    </div>
                    <div className={`p-2 rounded-full bg-orange-100 text-orange-600`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            </div>
        </main>
      </div>

      {showScanner && <ScannerOverlay onScan={handleScanResult} onClose={() => setShowScanner(false)} />}

      <style>{`
        .text-outline-white {
          text-shadow: 1px 1px 0 #FFFFFF, -1px -1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px 1px 0 #FFFFFF;
        }
        @keyframes fast-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.05); }
        }
        .animate-fast-bounce {
          animation: fast-bounce 0.8s infinite ease-in-out;
        }
        @keyframes pointing-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-pointing-right {
          animation: pointing-right 1s infinite ease-in-out;
        }

        /* LOGO ANIMATIONS */
        @keyframes logo-letter {
          0%, 5% { opacity: 0; transform: scale(0.8) translateY(5px); }
          15%, 85% { opacity: 1; transform: scale(1) translateY(0); }
          95%, 100% { opacity: 0; }
        }
        .animate-logo-letter {
          animation: logo-letter 5s infinite;
          display: inline-block;
          opacity: 0;
        }

        @keyframes logo-225 {
          0%, 25% { opacity: 0; transform: translateX(0); }
          30%, 40% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0; transform: translateX(-150%); }
          51% { opacity: 0; transform: translateX(150%); }
          60%, 85% { opacity: 1; transform: translateX(0); }
          95%, 100% { opacity: 0; }
        }
        .animate-logo-225 {
          animation: logo-225 5s infinite;
          opacity: 0;
        }

        @keyframes scanner-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
        }
        .animate-scanner-float {
            animation: scanner-float 2.5s ease-in-out infinite;
        }

        @keyframes blink-fast {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .animate-blink-fast {
            animation: blink-fast 0.6s step-end infinite;
        }

        @keyframes blink-red-green {
            0%, 100% { background-color: #ef4444; }
            50% { background-color: #22c55e; }
        }
        .animate-blink-red-green {
            animation: blink-red-green 0.15s infinite;
        }

        /* SEARCH BAR ANIMATIONS */
        .bg-animated-search-border {
            background: linear-gradient(90deg, #FFFFFF, #16a34a, #000000, #f97316, #FFFFFF);
            background-size: 400% 100%;
        }
        
        @keyframes search-border-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        .animate-search-border-flow {
            animation: search-border-flow 3s linear infinite;
        }

        @keyframes search-cursor-color {
            0% { background-color: #FFFFFF; }
            25% { background-color: #16a34a; }
            50% { background-color: #000000; }
            75% { background-color: #f97316; }
            100% { background-color: #FFFFFF; }
        }
        .animate-search-cursor-color {
            animation: search-cursor-color 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;
