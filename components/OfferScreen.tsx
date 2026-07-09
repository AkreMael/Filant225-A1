
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Tab } from '../types';
import { databaseService } from '../services/databaseService';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../firebase';
import SpeakerIcon from './common/SpeakerIcon';
import CityAutocompleteInput from './common/CityAutocompleteInput';
import { audioService } from '../services/audioService';
import { MapPin, X, ChevronLeft, ChevronRight, Share2, Heart } from 'lucide-react';

// Define WorkerOffer locally since we're removing googleSheetsService
export interface WorkerOffer {
    id?: string;
    userId?: string;
    img: string;
    name: string;
    city: string;
    price: string;
    title: string;
    description: string;
    isUnblurred?: boolean;
}

import SmartRegistrationScreen from './SmartRegistrationScreen';
import { motion, AnimatePresence } from 'motion/react';

// --- Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-2.2c0-.81.24-1.356 1.442-1.356h2.558v-4.148c-.443-.058-1.961-.191-3.727-.191-3.69 0-6.213 2.253-6.213 6.388v1.511z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.395.26-3.236 1.079-.841.84-1.044 1.959-1.101 3.236-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.26 2.395 1.079 3.236.84 1.218 1.959 1.42 3.236 1.477 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.395-.26 3.236-1.079.841-.84 1.044-1.959 1.101-3.236.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.057-1.277-.26-2.395-1.079-3.236-.84-.841-1.959-1.044-3.236-1.101-1.28-.058-1.688-.072-4.947-.072zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const TikTokIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27.98-1.58 1.72-.45.91-.42 1.91-.04 2.81.37.91 1.07 1.69 1.91 2.15 1.22.69 2.72.71 3.99.14 1.1-.46 1.97-1.39 2.32-2.48.1-.34.15-.7.18-1.07.03-3.14.02-6.28.02-9.42z"/></svg>;

const EyeIcon = ({ open }: { open: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057-5.064-7 9.542-7 1.225 0 2.39.26 3.44.725M15 12a3 3 0 11-6 0 3 3 0 016 0z M3 3l18 18" />
        )}
    </svg>
);

const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
const ShopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632V21a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V6.632l-8.622-5.03zM12 4.457l6.5 3.791V20.25H5.5V8.248l6.5-3.791zM9.5 12.25a2.5 2.5 0 005 0v-1.5a.75.75 0 00-1.5 0v1.5a1 1 0 01-2 0v-1.5a.75.75 0 00-1.5 0v1.5z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// --- Search Constants ---
const SEARCHABLE_TITLES = [
    // Métiers Travailleurs
    { title: "Vendeuse", type: "worker" },
    { title: "Cuisinier", type: "worker" },
    { title: "Serveur", type: "worker" },
    { title: "Coiffeur Homme", type: "worker" },
    { title: "Coiffeuse Femme", type: "worker" },
    { title: "Hôtesse d’accueil", type: "worker" },
    { title: "Chauffeur", type: "worker" },
    { title: "Agent d’entretien", type: "worker" },
    { title: "Femme de ménage", type: "worker" },
    { title: "Caissier", type: "worker" },
    { title: "Réceptionniste", type: "worker" },
    { title: "Baby-sitter", type: "worker" },
    { title: "Jardinier", type: "worker" },
    { title: "Couturier", type: "worker" },
    { title: "Esthéticienne", type: "worker" },
    { title: "Magasinier", type: "worker" },
    { title: "Manutentionnaire", type: "worker" },
    { title: "Agent de sécurité", type: "worker" },
    { title: "Plombier", type: "worker" },
    { title: "Électricien", type: "worker" },
    { title: "Carreleur", type: "worker" },
    { title: "Charpentier", type: "worker" },
    { title: "Maçon", type: "worker" },
    { title: "Soudeur", type: "worker" },
    { title: "Peintre", type: "worker" },
    { title: "MANUCURE À DOMICILE RAPIDE", type: "worker" },
    { title: "ESTHÉTICIENNE-MASSAGE", type: "worker" },
    { title: "MAQUILLEUSE PROFESSIONNELLE", type: "worker" },
    { title: "Pâtissier", type: "worker" },
    { title: "Laveur de vitres Rapide", type: "worker" },
    { title: "Technicien entretien climatisation Rapide", type: "worker" },
    { title: "Installateur de caméras de surveillance Rapide", type: "worker" },
    { title: "Fabricant de poufs Rapide", type: "worker" },
    { title: "Installateur de fenêtres et portes vitrées Rapide", type: "worker" },
    { title: "Menuisier Rapide", type: "worker" },
    
    // Immobilier
    { title: "Studio à louer", type: "location" },
    { title: "Villa à louer", type: "location" },
    { title: "Chambre-salon à louer", type: "location" },
    { title: "Petit local à louer", type: "location" },
    { title: "Terrain à louer ou à vendre", type: "location" },
    { title: "Magasin à louer", type: "location" },

    // Équipements
    { title: "Camion de campagne à louer", type: "location" },
    { title: "Bâche à louer", type: "location" },
    { title: "Groupe électrogène à louer", type: "location" },
    { title: "Sonorisation à louer", type: "location" },
    { title: "Espace d’événement à louer", type: "location" },
    { title: "Table d’événement à louer", type: "location" },
    { title: "Écran géant à louer", type: "location" },
    { title: "Podium à louer", type: "location" },
    { title: "Poubelle mobile à louer", type: "location" },
    { title: "Mégaphone à louer", type: "location" },
    { title: "Échelle pliante (petite) à louer", type: "location" },
    { title: "Corde / rallonge corde à louer", type: "location" },
    { title: "Nappe de table à louer", type: "location" },
    { title: "Tapis à louer", type: "location" },
    { title: "Distributeur d’eau à louer", type: "location" },
    { title: "Plateau de service", type: "location" },
    { title: "Microphone événement à louer", type: "location" },
    { title: "Haut-parleur / baffle Bluetooth à louer", type: "location" },
    { title: "Projecteur LED portable à louer", type: "location" },
    { title: "Lampe éclairage forte à louer", type: "location" },
    { title: "Glacière à louer", type: "location" },
    { title: "Tente pliante (petite) à louer", type: "location" },
    { title: "Parasol à louer", type: "location" },
    { title: "Banc à louer", type: "location" },
    { title: "Chaise pliante à louer", type: "location" },
    { title: "Table en bois à louer", type: "location" },
    { title: "Matelas une place à louer", type: "location" }
];

// --- Images ---
const INTERV_IMAGES = {
    electricien: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg",
    plombier: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg",
    clim: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/053eff8b-328c-4314-96fe-1fec715749b3.jpg",
    macon: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7759e2a2-e89b-4f9a-981d-1498c014e9cf.jpg",
    peintre: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg",
    videaste: "https://i.supaimg.com/0b29471a-3d31-4d69-a4a0-3b254ff72f5a.jpg",
    garde_malade: "https://i.supaimg.com/17697fbb-4850-449b-8aae-1e5074f46e78.jpg",
    aide_domicile: "https://i.supaimg.com/c3c14402-3c1f-4484-bfe1-774bcc4ac6de.png"
};

const carouselItems = [
    { title: "vendeuse (restaurant)", name: "Aïcha", city: "Cocody", description: "Dépannage électrique sécurisé", price: "45 000 F", img: INTERV_IMAGES.electricien },
    { title: "Caissière (super marché)", name: "Khadi", city: "Yopougon", description: "Réparation fuites d'eau", price: "25 000 F", img: INTERV_IMAGES.plombier },
    { title: "Chauffeur (camions)", name: "Fatimaa", city: "Abidjan", description: "Maintenance climatisation", price: "60 000 F", img: INTERV_IMAGES.clim },
    { title: "Animateur (d’événements)", name: "Mariam", city: "Bouaké", description: "Maçonnerie et rénovation", price: "1 000 000 F", img: INTERV_IMAGES.macon },
    { title: "Cuisinier / hôtel Pro", name: "Bintou", city: "Yamoussoukro", description: "Peinture et finitions", price: "35 000 F", img: INTERV_IMAGES.peintre },
    { title: "Vendeuse (en boutique)", name: "Kore", city: "San-Pédro", description: "Réalisation et montage vidéo pro", price: "50 000 F", img: INTERV_IMAGES.videaste },
    { title: "Technicien (sonorisation)", name: "Fenrir", city: "Korhogo", description: "Assistance quotidienne à domicile", price: "30 000 F", img: INTERV_IMAGES.aide_domicile },
];

const InterventionCard: React.FC<{ item: WorkerOffer, currentUser?: any }> = ({ item, currentUser }) => {
    const [isCopying, setIsCopying] = useState(false);
    const [isUpdatingBlur, setIsUpdatingBlur] = useState(false);
    const pressTimer = useRef<number | null>(null);
    const startPos = useRef<{x: number, y: number} | null>(null);

    const isOwner = useMemo(() => {
        if (!currentUser || !item.userId) return false;
        
        // Avoid matching on generic or empty strings
        if (item.userId === 'undefined' || item.userId === 'null' || item.userId === '') return false;

        const sanitize = (id: string) => typeof id === 'string' ? id.replace(/[.#$[\]/]/g, '_') : '';
        
        // Collect all possible IDs for the current user, ensuring they are valid strings
        const possibleIds = [
            currentUser.userId,
            currentUser.id,
            currentUser.phone
        ].filter(id => id && typeof id === 'string' && id !== 'undefined' && id !== 'null')
         .map(id => sanitize(id as string));
        
        // If any of the user's IDs match the item's userId, they are the owner
        return possibleIds.includes(item.userId);
    }, [currentUser, item.userId]);

    const isUnblurred = item.isUnblurred !== false;

    const handleToggleBlur = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOwner || !item.id || isUpdatingBlur) return;
        
        try {
            setIsUpdatingBlur(true);
            await databaseService.updateOfferBlur(item.id, !isUnblurred);
        } catch (error: any) {
            console.error("Failed to toggle blur:", error);
            // No alert as requested
        } finally {
            setIsUpdatingBlur(false);
        }
    };

    const handleCopy = () => {
        const textToCopy = `Nom: ${item.name}\nVille: ${item.city}\nPrix: ${item.price}\nMétier: ${item.title}\nDisponibilité: ${item.description}\nFilant Services`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopying(true);
            setTimeout(() => setIsCopying(false), 2000);
        });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        pressTimer.current = window.setTimeout(handleCopy, 600);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startPos.current) {
            const deltaX = Math.abs(e.touches[0].clientX - startPos.current.x);
            const deltaY = Math.abs(e.touches[0].clientY - startPos.current.y);
            if (deltaX > 10 || deltaY > 10) {
                if (pressTimer.current) {
                    window.clearTimeout(pressTimer.current);
                    pressTimer.current = null;
                }
            }
        }
    };

    return (
        <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="flex-shrink-0 w-[150px] bg-white rounded-3xl overflow-hidden shadow-md flex flex-col transform active:scale-95 transition-all relative"
        >
            {isCopying && (
                <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-2 text-center animate-in fade-in duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Informations copiées !</span>
                </div>
            )}
            <div className="h-[120px] w-full relative bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                {item.title.toLowerCase().includes('louer') || item.title.toLowerCase().includes('vendre') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                )}
                {!isUnblurred && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px]">
                        <span className="text-white text-[12px] font-black uppercase tracking-[0.3em] text-center px-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">masqué</span>
                    </div>
                )}
                {isOwner && (
                    <button 
                        onClick={handleToggleBlur}
                        disabled={isUpdatingBlur}
                        className={`absolute top-2 right-2 p-2 ${isUnblurred ? 'bg-green-500' : 'bg-black/50'} text-white rounded-full backdrop-blur-md active:scale-90 transition-all z-20 shadow-lg ${isUpdatingBlur ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isUnblurred ? "Masquer" : "Afficher"}
                    >
                        <EyeIcon open={isUnblurred} />
                    </button>
                )}
            </div>
            <div className="p-3 flex flex-col flex-1">
                <div className="flex flex-col mb-1.5">
                    <p className="text-[11px] font-black text-gray-900 truncate uppercase leading-tight mb-0.5">{item.name}</p>
                    <p className="text-[8px] font-bold text-gray-500 italic leading-none mb-1">Ville : {item.city}</p>
                    <span className="text-red-600 font-black text-[11px] leading-tight">
                        {item.price}
                    </span>
                </div>
                <h4 className="text-[10px] font-bold text-gray-700 leading-tight mb-1 line-clamp-1">{item.title}</h4>
                <p className="text-[9px] text-gray-400 leading-tight italic line-clamp-2 mt-auto mb-1">{item.description}</p>
                <div className="flex items-center gap-1 opacity-40">
                    <ShopIcon />
                    <span className="text-[8px] font-bold truncate">FILANT°225</span>
                </div>
            </div>
        </div>
    );
};

const InfoBox = ({ title, description, onLinkClick }: { title: string, description: string, onLinkClick: () => void }) => (
    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mx-4 mb-6 relative border border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
        <div className="p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{description}</p>
            <button 
                onClick={onLinkClick}
                className="text-orange-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 group"
            >
                EN SAVOIR PLUS 
                <span className="group-hover:translate-x-1 transition-transform"><ArrowRightIcon /></span>
            </button>
        </div>
    </div>
);

const PublicationModal = ({ isOpen, onClose, onPublish, initialData }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onPublish: (data: any) => Promise<void>,
    initialData: any
}) => {
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        price: '',
        frequency: 'mois',
        service: '',
        description: ''
    });
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData.name || '',
                city: initialData.city || '',
                price: initialData.price || '',
                frequency: initialData.frequency || 'mois',
                service: initialData.service || '',
                description: initialData.description || ''
            });
            setIsPublishing(false);
        }
    }, [isOpen, initialData]);

    const handlePublish = async () => {
        if (isPublishing) return;
        setIsPublishing(true);
        
        // Add a minimum delay of 2 seconds as requested by the user to avoid duplicates
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await Promise.all([onPublish(formData), minDelay]);
            // The modal will be closed by the parent on success
        } catch (error) {
            console.error("Publication error in modal:", error);
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Publier votre statut</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Métier / Titre</label>
                            <input 
                                type="text" 
                                value={formData.service}
                                onChange={(e) => setFormData({...formData, service: e.target.value})}
                                placeholder="Ex: Cuisinier"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nom Complet</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Mimi"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ville</label>
                            <CityAutocompleteInput 
                                id="offer-city"
                                value={formData.city}
                                onChange={(val) => setFormData({...formData, city: val})}
                                placeholder="Ex: Bassam, Cocody..."
                                inputClassName="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Salaire souhaité (FCFA)</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                pattern="[0-9]*"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                placeholder="Ex: 65000"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description (optionnel)</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Ex: Disponible immédiatement..."
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[80px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className={`flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isPublishing ? 'Publication...' : 'Publier'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2 } from 'lucide-react';

const ProfessionalRegistrationStatus: React.FC<{ user: any, onEnrolledChange?: (enrolled: boolean) => void, onModify: () => void }> = ({ user, onEnrolledChange, onModify }) => {
    const [activation, setActivation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.phone) return;
        const sanitizedPhone = user.phone.replace(/\D/g, '');
        const unsub = onSnapshot(doc(db, 'QRCodeActivations', sanitizedPhone), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setActivation(data);
                if (onEnrolledChange) onEnrolledChange(data.fraisDossierPayes === true);
            } else {
                if (onEnrolledChange) onEnrolledChange(false);
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, [user?.phone, onEnrolledChange]);

    if (!user || (!activation && !isLoading)) return null;
    if (isLoading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

    const isEnrolled = activation?.fraisDossierPayes;
    if (!isEnrolled) return null;

    const isActive = activation?.status === 'Code QR Actif';
    const isExpired = activation?.expiryDate && new Date(activation.expiryDate) < new Date();
    const showingStatus = (isActive && !isExpired) ? 'Activé' : 'Désactivé';

    const qrData = JSON.stringify({
        nom: user.name,
        tel: user.phone,
        ville: user.city,
        metier: activation?.profession || 'Professionnel',
        categorie: activation?.domain || 'Général',
        profil: activation?.profileType || 'Professionnel',
        status: showingStatus
    });

    const handleActivate = () => {
        const event = new CustomEvent('trigger-payment-view', {
            detail: {
                title: 'Activation Mise en Relation',
                amount: '7100',
                waveLink: 'https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=7100',
                paymentType: 'Activation'
            }
        });
        window.dispatchEvent(event);
    };

    const handleRenew = () => {
        const event = new CustomEvent('trigger-payment-view', {
            detail: {
                title: 'Renouvellement Mise en Relation',
                amount: '500',
                waveLink: 'https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=500',
                paymentType: 'Renouvellement'
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mx-4 mb-8 border border-gray-100 p-8 flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight text-center">Votre Code QR Professionnel</h2>
            
            <div className="relative p-6 bg-gray-50 rounded-3xl border-2 border-gray-100 shadow-inner mb-6">
                <div className={`${(isActive && !isExpired) ? 'opacity-100' : 'opacity-20 grayscale'} transition-all duration-500`}>
                    <QRCodeSVG 
                        value={qrData} 
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                
                {(!isActive || isExpired) && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl rotate-[-5deg]">
                            Code QR non actif
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mb-8">
                {(isActive && !isExpired) ? (
                    <p className="text-xs font-black text-orange-600 max-w-xs mx-auto px-4 uppercase tracking-wide leading-relaxed">
                        Veuillez me scanner pour une nouvelle demande de mon service.
                    </p>
                ) : (
                    <>
                        <p className="text-sm font-bold text-slate-700 mb-1">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user.phone}</p>
                        <p className="text-xs font-bold text-orange-600 mt-2">
                            {isExpired ? '❌ Votre code QR a expiré (Désactivé)' : '❌ Votre code QR est actuellement inactif'}
                        </p>
                    </>
                )}
                {(isActive && !isExpired) && activation.expiryDate && (
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                        Expire le : {new Date(activation.expiryDate).toLocaleDateString('fr-FR')}
                    </p>
                )}
            </div>

            {(!isActive || isExpired) ? (
                <div className="w-full space-y-3">
                    <button 
                        onClick={isExpired ? handleRenew : handleActivate}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-sm"
                    >
                        <span>{isExpired ? 'Renouveler votre mise en relation (500 FCFA)' : 'Activer votre mise en relation (7 100 FCFA)'}</span>
                        <span className="text-[10px] opacity-80 font-bold lowercase tracking-normal">Validation instantanée</span>
                    </button>
                    
                    <button 
                        onClick={onModify}
                        className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-gray-100"
                    >
                        Modifier mes informations
                    </button>
                </div>
            ) : (
                <div className="w-full space-y-3">
                    <div className="w-full bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Profil Actif</span>
                    </div>
                </div>
            )}
        </div>
    );
};

interface OfferScreenProps {
  onNavigateToMenu: (view: 'worker_list' | 'location_hub') => void;
  setActiveTab: (tab: Tab) => void;
  onOpenIntervention: () => void;
  onOpenCategory: (category: 'intervention' | 'immobilier' | 'equipement' | 'travailleurs') => void;
  onSelectItem: (
    item: string, 
    type: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service', 
    imageUrl?: string | string[], 
    isBlurred?: boolean,
    description?: string,
    price?: string
  ) => void;
  user: any;
  onOpenInfoTravailleurs?: () => void;
  onOpenInfoClients?: () => void;
}

const OfferScreen: React.FC<OfferScreenProps> = ({ 
  onNavigateToMenu, 
  setActiveTab, 
  onOpenIntervention, 
  onOpenCategory, 
  onSelectItem, 
  user,
  onOpenInfoTravailleurs,
  onOpenInfoClients
}) => {
  const mainRef = useRef<HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [workerOffers, setWorkerOffers] = useState<WorkerOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const [firebaseOffers, setFirebaseOffers] = useState<WorkerOffer[]>([]);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [selectedServiceForPublication, setSelectedServiceForPublication] = useState('');
  const [publicationData, setPublicationData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSmartRegistration, setShowSmartRegistration] = useState(false);
  const [isProfessionalEnrolled, setIsProfessionalEnrolled] = useState(false);

  // States for online ads integration
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [selectedAdDetail, setSelectedAdDetail] = useState<any | null>(null);
  const [showAllOnlineAds, setShowAllOnlineAds] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Live listener to all Inscriptions for real-time online ads syncing
  useEffect(() => {
    const q = query(collection(db, 'Inscriptions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setInscriptions(data);
    }, (err) => {
      console.error("Error setting up live Inscriptions listener for OfferScreen:", err);
    });
    return () => unsubscribe();
  }, []);

  const onlineAds = useMemo(() => {
    return inscriptions.filter((item) => {
      if (item.isActive === false) return false;
      const isOnline = item.isOnline === true;
      const onlineEnd = item.onlineEnd;
      const isExpired = onlineEnd ? Date.now() > onlineEnd : false;
      return isOnline && !isExpired;
    });
  }, [inscriptions]);

  useEffect(() => {
    setIsLoadingOffers(false);
  }, []);

  // Fetch Firebase offers
  useEffect(() => {
    console.log("Setting up Firestore onSnapshot listener for Travailleurs...");
    // We don't use orderBy here to avoid excluding documents missing the createdAt field
    const q = query(collection(db, 'Travailleurs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Firestore snapshot received: ${snapshot.size} documents`);
      const offers = snapshot.docs.map(doc => {
        const data = doc.data();
        const cleanPrice = data.price?.toString().replace(/F/gi, '').trim();
        return {
          id: doc.id,
          userId: data.userId,
          img: data.photoUrl || "https://i.supaimg.com/c3c14402-3c1f-4484-bfe1-774bcc4ac6de.png",
          name: data.name || data.fullName || 'Anonyme',
          city: data.city || 'Non spécifiée',
          price: cleanPrice ? `${cleanPrice}F par ${data.frequency || 'mois'}` : '',
          title: data.service || data.jobTitle || 'Travailleur',
          description: data.description || `Disponible pour : ${data.service || data.jobTitle || 'Travailleur'}`,
          isUnblurred: data.isUnblurred !== false,
          createdAt: data.createdAt?.toDate?.() || data.submittedAt?.toDate?.() || new Date(0) // Handle potential missing/null createdAt
        } as WorkerOffer & { createdAt: Date };
      });

      // Sort by createdAt desc in memory
      const sortedOffers = offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setFirebaseOffers(sortedOffers);
    }, (error) => {
        console.error("Error fetching Firebase offers:", error);
    });
    return () => unsubscribe();
  }, []);

  const allOffers = useMemo(() => {
    return firebaseOffers;
  }, [firebaseOffers]);

  const userOffer = useMemo(() => {
    if (!user) return null;
    const sanitizedUserId = (user.userId || user.id || user.phone || '').replace(/[.#$[\]/]/g, '_');
    return firebaseOffers.find(o => o.userId === sanitizedUserId);
  }, [firebaseOffers, user]);

  const handlePublishClick = (service: string) => {
    setSelectedServiceForPublication(service);
    setIsPublicationModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      console.log("Submitting publication form via databaseService:", data);
      
      const userId = user?.userId || user?.id || user?.phone;
      if (!userId) {
        console.error("No user ID available for publication");
        return;
      }

      // Include current user info
      const publicationPayload = {
        ...data,
        photoUrl: user?.photoUrl || user?.avatar || null,
      };

      // Use the new method that mimics chat message sending
      const success = await databaseService.publishStatusAsMessage(userId, publicationPayload);

      if (success) {
        setIsPublicationModalOpen(false);
        setToastMessage("Statut publié avec succès !");
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        console.error("Publication failed");
      }
    } catch (error: any) {
      console.error("Error publishing offer:", error);
    }
  };

  const handleContact = () => {
    window.open('tel:0705052632', '_self');
  };

  const scrollIntoView = () => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredSearchItems = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return SEARCHABLE_TITLES.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [searchTerm]);

  const handleSelectSearchResult = (item: typeof SEARCHABLE_TITLES[0]) => {
      setSearchTerm('');
      setIsSearchFocused(false);
      onSelectItem(item.title, item.type as any);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F8F9FB] font-sans animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">
            FILANT<span className="text-orange-500 font-black">°225</span>
          </span>
        </div>
        
        {/* Social & Call Icons Container */}
        <div className="flex items-center gap-2">
          {/* Facebook */}
          <a 
            href="https://www.facebook.com/share/182w7A2dsH/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#1877F2] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <FacebookIcon />
          </a>
          
          {/* Instagram */}
          <a 
            href="https://filant-225-a1-477450931553.us-west1.run.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <InstagramIcon />
          </a>
          
          {/* TikTok */}
          <a 
            href="https://vm.tiktok.com/ZS9eJGsLNfVJx-Hc2XW/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <TikTokIcon />
          </a>
          
          {/* Call Icon */}
          <button 
            onClick={handleContact}
            className="bg-orange-500 hover:bg-orange-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <PhoneIcon />
          </button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full bg-white border-b border-gray-100">
        <div className="relative z-10 px-6 pt-12 pb-12 flex flex-col items-center text-center">
            <div className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                DISPONIBLE PARTOUT EN CÔTE D'IVOIRE
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                Bienvenue chez <span className="text-orange-500">FILANT°225</span>
            </h1>
            <p className="text-lg font-bold text-gray-800 mb-6">
                Trouvez facilement ce dont vous avez besoin.
            </p>
            
            <div className="bg-gray-50 rounded-3xl p-6 mb-8 w-full max-w-sm border border-gray-100 shadow-sm">
                <p className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
                    🔎 Recherchez rapidement :
                </p>
                <ul className="space-y-3 text-sm font-bold text-gray-600">
                    <li className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        Des travailleurs (tous types de métiers)
                    </li>
                    <li className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        Des équipements
                    </li>
                    <li className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        Des appartements
                    </li>
                </ul>
            </div>

            <p className="text-sm font-bold text-slate-800 px-4 mb-4">
                🤝 FILANT°225 vous met en relation directe avec les bonnes personnes.
            </p>
            
            <p className="text-orange-600 font-black text-xs uppercase tracking-[0.2em] mb-4">
                Simple. Rapide. Efficace.
            </p>
            
            <p className="text-gray-500 text-xs font-medium mb-10">
                Connectez-vous et commencez dès aujourd'hui.
            </p>
            <button 
              onClick={scrollIntoView}
              className="w-full max-w-xs bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all mb-8"
            >
                <span className="text-base uppercase tracking-wider">Découvrir nos services</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>

            {/* --- SECTION ANNONCES EN LIGNE (Horizontal Slider) --- */}
            {onlineAds.length > 0 && (
              <div className="w-full flex flex-col items-center mb-10 mt-2">
                <div className="w-full max-w-xs mb-3 flex items-center justify-between ml-1 self-center">
                  <div className="text-left flex flex-col justify-start">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#ff4500] rounded-full animate-pulse"></span>
                      Annonces en ligne
                    </h3>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Offres actives en temps réel</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAllOnlineAds(true);
                    }}
                    className="text-xs font-extrabold text-slate-700 hover:text-[#ff4500] active:scale-95 transition-all cursor-pointer select-none"
                  >
                    Tout afficher
                  </button>
                </div>
                
                <div className="w-full overflow-hidden">
                  <div className="flex gap-4 overflow-x-auto py-2 px-6 scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4">
                    {onlineAds.map((item) => {
                      const cardImages = item.onlineImages && item.onlineImages.length > 0
                        ? item.onlineImages
                        : (item.images && item.images.length > 0 ? item.images : [item.imageLink || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"]);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedAdDetail(item);
                            setActiveImageIndex(0);
                            setIsSaved(false);
                          }}
                          className="snap-start shrink-0 w-[240px] bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[340px] cursor-pointer text-left relative"
                        >
                          {/* Thumbnail layout with profileType */}
                          <div className="relative w-full h-36 bg-slate-50 overflow-hidden shrink-0">
                            <img 
                              src={cardImages[0]} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-3 left-3 bg-[#ff4500] text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                              {item.profileType === 'Propriétaire' ? 'ÉQUIPEMENT À LOUER' : item.profileType}
                            </span>
                          </div>

                          {/* Description & info content */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-[#2dadac] block truncate">
                                {item.titleOrActivity || (item.profileType === 'Travailleur' ? item.job : (item.profileType === 'Propriétaire' ? item.equipmentCategory : (item.profileType === 'Agence' ? 'IMMOBILIER' : 'ENTREPRISE')))}
                              </span>
                              <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">
                                {item.name}
                              </h4>
                              
                              <div className="flex items-center gap-1 mt-1 text-slate-500">
                                <MapPin className="h-3 w-3 text-[#ff00ff]" />
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-600 truncate">{item.city}</span>
                              </div>

                              <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2 mt-1.5 h-8">
                                {item.description || item.skillsDescription || "Aucune description fournie par le prestataire."}
                              </p>
                            </div>

                            {/* Action label resembling see details button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAdDetail(item);
                                setActiveImageIndex(0);
                                setIsSaved(false);
                              }}
                              className="w-full mt-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-100/60 text-slate-700 font-black text-[9px] uppercase tracking-widest text-center py-2.5 rounded-xl transition-all cursor-pointer block"
                            >
                              VOIR L'ANNONCE
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Functional Search Bar */}
            <div className="w-full max-w-xs relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Recherche rapide (ex: Cuisinier...)"
                    className="w-full py-4 pl-12 pr-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                />

                {/* Search Results Dropdown */}
                {isSearchFocused && searchTerm.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {filteredSearchItems.length > 0 ? (
                            filteredSearchItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectSearchResult(item)}
                                    className="w-full p-4 text-left border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{item.title}</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                            {item.type === 'worker' ? 'Travailleur' : 'Location / Immobilier'}
                                        </span>
                                    </div>
                                    <ArrowRightIcon />
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-gray-400 italic">
                                Aucun titre correspondant trouvé.
                            </div>
                        )}
                        <button 
                            onClick={() => setIsSearchFocused(false)}
                            className="w-full p-2 bg-gray-50 text-[10px] font-black uppercase text-gray-400"
                        >
                            Fermer
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <main ref={mainRef} className="mt-8 flex flex-col scroll-mt-24 pb-32 relative">
        {toastMessage && (
            <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 bg-green-600 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-2xl animate-in slide-in-from-top-8 fade-in duration-500 border-2 border-white/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    {toastMessage}
                </div>
            </div>
        )}
          
          {/* Bloc 1 : Informations Travailleurs */}
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mx-4 mb-8 border border-gray-100 flex flex-col">
              <div className="w-full h-56 overflow-hidden bg-gray-50">
                  <img 
                      src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/43431356-ccd9-4855-a4a0-46fe3e599176.jpg" 
                      alt="Informations Travailleurs" 
                      className="w-full h-full object-cover select-none transition-transform duration-700 hover:scale-105"
                      referrerPolicy="no-referrer"
                  />
              </div>
              <div className="p-8 flex flex-col flex-1">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
                      Informations Travailleurs
                  </h2>
                  <p className="text-gray-550 text-[13px] font-medium leading-relaxed mb-6">
                      Rejoignez notre réseau national de confiance en Côte d'Ivoire. Retrouvez d'importants guides, vos opportunités de carrière, les chartes de travail et les modalités de partenariat avec FILANT°225.
                  </p>
                  <button 
                      onClick={onOpenInfoTravailleurs}
                      className="px-6 py-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-md transition-all self-start cursor-pointer flex items-center gap-2"
                      id="btn-voir-plus-travailleurs"
                  >
                      Voir plus
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                  </button>
              </div>
          </div>

          {/* Bloc 2 : Informations Clients */}
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mx-4 mb-8 border border-gray-100 flex flex-col">
              <div className="w-full h-56 overflow-hidden bg-gray-50">
                  <img 
                      src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/d6277a00-1ce3-4fb7-b027-457eee0cca21.png" 
                      alt="Informations Clients" 
                      className="w-full h-full object-cover select-none transition-transform duration-700 hover:scale-105"
                      referrerPolicy="no-referrer"
                  />
              </div>
              <div className="p-8 flex flex-col flex-1">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
                      Informations Clients
                  </h2>
                  <p className="text-gray-550 text-[13px] font-medium leading-relaxed mb-6">
                      Bénéficiez de prestations transparentes, traçables et entièrement sécurisées. Prenez connaissance de notre charte qualité, de vos garanties de sécurité et de notre assistance rapide.
                  </p>
                  <button 
                      onClick={onOpenInfoClients}
                      className="px-6 py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-md transition-all self-start cursor-pointer flex items-center gap-2"
                      id="btn-voir-plus-clients"
                  >
                      Voir plus
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                  </button>
              </div>
          </div>

          <ProfessionalRegistrationStatus 
            user={user} 
            onEnrolledChange={setIsProfessionalEnrolled}
            onModify={() => setShowSmartRegistration(true)}
          />

          {/* Demande d'embauche simplified section */}
          {!isProfessionalEnrolled && (
            <div className="bg-[#16a34a] pt-16 pb-16 mb-6 relative overflow-hidden transition-all duration-500">
             {/* Gradient Overlays for smooth transition */}
             <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F8F9FB] to-transparent pointer-events-none z-10"></div>
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8F9FB] to-transparent pointer-events-none z-10"></div>

             <div className="px-6 relative z-20">
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-6">
                    DEMANDE D'EMBAUCHE
                </h2>
                
                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-2xl">
                    <p className="text-white font-black text-xl leading-tight mb-6 uppercase tracking-tighter">
                        Rejoignez la Révolution du Travail en Côte d’Ivoire avec FILANT°225 !
                    </p>
                    
                    <div className="space-y-6 mb-8">
                        <p className="text-[#a3e635] font-bold text-sm leading-relaxed">
                            Vous êtes un travailleur qualifié, un propriétaire d'équipement, une agence immobilière ou une entreprise ambitieuse ? Ne restez plus dans l'ombre !
                        </p>
                        
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                             <p className="text-white text-sm font-medium leading-relaxed">
                                <span className="text-orange-500 font-black">FILANT°225</span> vous ouvre les portes d'une visibilité nationale.
                            </p>
                            <p className="text-white text-sm font-bold leading-relaxed">
                                Inscrivez-vous dès maintenant pour être mis en relation directe avec des clients sérieux, partout en Côte d’Ivoire.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex flex-col items-center space-y-4">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2 text-center">
                            🎧 Cliquez ici pour écouter l’audio et comprendre tout clairement 👇
                        </p>
                        
                        <div 
                            onClick={() => {
                                const audioText = `Rejoignez la Révolution du Travail en Côte d’Ivoire avec FILANT°225 ! Vous êtes un travailleur qualifié, un propriétaire d'équipement, une agence immobilière ou une entreprise ambitieuse ? Ne restez plus dans l'ombre ! FILANT°225 vous ouvre les portes d'une visibilité nationale. Inscrivez-vous dès maintenant pour être mis en relation directe avec des clients sérieux, partout en Côte d’Ivoire.`;
                                audioService.speak(audioText);
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                            <span>ÉCOUTER</span>
                        </div>

                        <button 
                            onClick={() => setShowSmartRegistration(true)}
                            className="w-full bg-white text-[#16a34a] font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-2 border-white"
                        >
                            <span>S’inscrire</span>
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Public Info Footer */}
          <footer className="mt-12 mb-6 px-6 pt-8 border-t border-gray-150 flex flex-col items-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
              <a
                href="/informations-utilisation"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-sm hover:shadow active:scale-[0.98] transition-all text-center cursor-pointer decoration-transparent block"
              >
                Informations sur l'utilisation
              </a>
              <a
                href="/conditions-services"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-sm hover:shadow active:scale-[0.98] transition-all text-center cursor-pointer decoration-transparent block"
              >
                Conditions des services
              </a>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-2">
              FILANT°225 • TRANSPARENCE & RESPONSABILITÉ
            </p>
          </footer>

             <AnimatePresence>
                {showSmartRegistration && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[100] bg-white flex flex-col"
                    >
                        <SmartRegistrationScreen 
                            currentUser={user}
                            onComplete={() => setShowSmartRegistration(false)}
                            onBack={() => setShowSmartRegistration(false)}
                        />
                    </motion.div>
                )}
              </AnimatePresence>

              {/* All Online Ads Page Overlay */}
              <AnimatePresence>
                {showAllOnlineAds && (
                  <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[4000] bg-slate-50 flex flex-col overflow-y-auto scroll-smooth select-none"
                  >
                    {/* Header Bar */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100/80 z-[4010] px-4 py-4 flex items-center justify-between shrink-0 shadow-sm">
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setShowAllOnlineAds(false)}
                          className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all cursor-pointer shadow-sm"
                          title="Retour"
                        >
                          <svg className="w-5 h-5 stroke-current -ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="text-left">
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#ff4500] rounded-full animate-pulse"></span>
                            Annonces en ligne
                          </h2>
                          <p className="text-[9px] text-[#2dadac] font-black uppercase tracking-widest mt-0.5">Offres actives en temps réel</p>
                        </div>
                      </div>
                      <span className="bg-orange-500/10 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {onlineAds.length} Annonces
                      </span>
                    </div>

                    {/* scrollable items list */}
                    <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-6 pb-24 text-left">
                      {onlineAds.map((item) => {
                        const cardImages = item.onlineImages && item.onlineImages.length > 0
                          ? item.onlineImages
                          : (item.images && item.images.length > 0 ? item.images : [item.imageLink || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"]);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedAdDetail(item);
                              setActiveImageIndex(0);
                              setIsSaved(false);
                            }}
                            className="w-full bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer text-left relative"
                          >
                            {/* Card Image */}
                            <div className="relative w-full h-48 bg-slate-50 overflow-hidden shrink-0">
                              <img 
                                src={cardImages[0]} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-4 left-4 bg-[#ff4500] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                                {item.profileType === 'Propriétaire' ? 'ÉQUIPEMENT À LOUER' : item.profileType}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] block truncate">
                                  {item.titleOrActivity || (item.profileType === 'Travailleur' ? item.job : (item.profileType === 'Propriétaire' ? item.equipmentCategory : (item.profileType === 'Agence' ? 'IMMOBILIER' : 'ENTREPRISE')))}
                                </span>
                                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase leading-snug truncate">
                                  {item.name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                  <MapPin className="h-3.5 w-3.5 text-[#ff00ff]" />
                                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-600 truncate">{item.city}</span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">
                                {item.description || item.skillsDescription || "Aucune description fournie par le prestataire."}
                              </p>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAdDetail(item);
                                  setActiveImageIndex(0);
                                  setIsSaved(false);
                                }}
                                className="w-full mt-4 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-100 text-slate-800 font-black text-[10px] uppercase tracking-widest text-center py-3.5 rounded-2xl transition-all cursor-pointer block"
                              >
                                VOIR L'ANNONCE
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic announcement detailed overlay */}
              <AnimatePresence>
                {selectedAdDetail && (
                  <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[5000] bg-white flex flex-col overflow-hidden select-none"
                  >
                    {/* Top Bar Floating Buttons */}
                    <div className="absolute top-4 left-4 z-[5010]">
                      <button 
                        type="button"
                        onClick={() => setSelectedAdDetail(null)}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/75 active:scale-90 transition-all cursor-pointer border border-white/10"
                        title="Retour"
                      >
                        <svg className="w-5 h-5 stroke-current -ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </div>

                    <div className="absolute top-4 right-4 z-[5010] flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsSaved(prev => !prev);
                          audioService.speak(isSaved ? "Retiré des favoris" : "Annonce ajoutée aux favoris");
                        }}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/75 active:scale-95 transition-all cursor-pointer border border-white/10"
                      >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          const mainTitle = selectedAdDetail.titleOrActivity || (selectedAdDetail.profileType === 'Travailleur' ? selectedAdDetail.job : (selectedAdDetail.profileType === 'Propriétaire' ? selectedAdDetail.equipmentCategory : (selectedAdDetail.profileType === 'Agence' ? 'IMMOBILIER' : 'ENTREPRISE')));
                          const userName = selectedAdDetail.name;
                          const shareTitle = `${mainTitle} - ${userName}`;
                          const shareUrl = `${window.location.protocol}//${window.location.host}/?adId=${encodeURIComponent(selectedAdDetail.id)}&col=Inscriptions`;
                          const shareText = selectedAdDetail.description || selectedAdDetail.skillsDescription || "";

                          if (navigator.share) {
                            navigator.share({
                              title: shareTitle,
                              text: shareText,
                              url: shareUrl,
                            }).catch(console.error);
                          } else {
                            try {
                              navigator.clipboard.writeText(shareUrl);
                              audioService.speak("Lien copié dans le presse-papier");
                            } catch (e) {
                              alert("Lien de l'annonce : " + shareUrl);
                            }
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/75 active:scale-95 transition-all cursor-pointer border border-white/10"
                      >
                        <Share2 className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Scrollable Area (Images + Detailed Info) */}
                    <div className="flex-1 overflow-y-auto scroll-smooth">
                      {(() => {
                        const detailImages = selectedAdDetail.onlineImages && selectedAdDetail.onlineImages.length > 0
                          ? selectedAdDetail.onlineImages
                          : (selectedAdDetail.images && selectedAdDetail.images.length > 0 ? selectedAdDetail.images : [selectedAdDetail.imageLink || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"]);
                          
                        return (
                          <>
                            <div className="relative w-full h-[45vh] sm:h-[50vh] bg-slate-100 overflow-hidden shrink-0">
                              <div className="w-full h-full relative">
                                {detailImages.map((imgUrl: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                      idx === activeImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                                    }`}
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`product-${idx}`}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Center Chevron Controllers */}
                              {detailImages.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveImageIndex((prev) => (prev - 1 + detailImages.length) % detailImages.length);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black/50 active:scale-90 transition-all z-20 cursor-pointer"
                                  >
                                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveImageIndex((prev) => (prev + 1) % detailImages.length);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black/50 active:scale-90 transition-all z-20 cursor-pointer"
                                  >
                                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                                  </button>
                                </>
                              )}

                              {/* Bottom visual dots / counter */}
                              <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black z-20 tracking-wider">
                                {activeImageIndex + 1} / {detailImages.length}
                              </div>
                              
                              {detailImages.length > 1 && (
                                <div className="absolute bottom-5 right-5 flex gap-1 z-20 bg-black/40 backdrop-blur-[2px] px-2 py-1 rounded-full border border-white/10 text-white font-black">
                                  {detailImages.map((_: any, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setActiveImageIndex(idx)}
                                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        idx === activeImageIndex ? 'bg-orange-500 scale-125' : 'bg-white/60 hover:bg-white'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Body Information */}
                            <div className="bg-white rounded-t-[2.5rem] -mt-6 relative z-30 p-6 md:p-8 space-y-6 pb-32 text-left">
                              <div className="space-y-1.5">
                                <span className="bg-[#ff4500]/10 text-[#ff4500] text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                  {selectedAdDetail.profileType === 'Propriétaire' ? 'ÉQUIPEMENT À LOUER' : selectedAdDetail.profileType}
                                </span>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase pt-2">
                                  {selectedAdDetail.name}
                                </h2>
                                <p className="text-xs font-black text-[#2dadac] uppercase tracking-wider">
                                  {selectedAdDetail.titleOrActivity || (selectedAdDetail.profileType === 'Travailleur' ? selectedAdDetail.job : (selectedAdDetail.profileType === 'Propriétaire' ? selectedAdDetail.equipmentCategory : (selectedAdDetail.profileType === 'Agence' ? 'IMMOBILIER' : 'ENTREPRISE')))}
                                </p>
                              </div>

                              {/* Location Display */}
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#ff00ff]/10 text-[#ff00ff] rounded-full flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Localisation de l'offre</p>
                                  <p className="text-xs font-black text-slate-800 uppercase truncate">{selectedAdDetail.city}, CÔTE D'IVOIRE</p>
                                </div>
                              </div>

                              {/* Description block */}
                              <div className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Description de l'offre</h3>
                                <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100/50 whitespace-pre-line">
                                  {selectedAdDetail.description || selectedAdDetail.skillsDescription || selectedAdDetail.equipmentDescription || selectedAdDetail.companySkills || "Aucune description n'a été spécifiée."}
                                </p>
                              </div>

                              {/* Complementary data */}
                              <div className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Informations complémentaires</h3>
                                <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-100/80 rounded-2xl overflow-hidden text-xs">
                                  {selectedAdDetail.profileType === 'Travailleur' && (
                                    <>
                                      {selectedAdDetail.job && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Métier</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.job}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.learnedFrom && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Apprentissage / Formation</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.learnedFrom}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.availability && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Disponibilité</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.availability}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.movementZone && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Zone d'intervention</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.movementZone}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Salaire souhaité</span>
                                        <span className="font-extrabold text-slate-900 uppercase">
                                          {selectedAdDetail.desiredSalary ? `${selectedAdDetail.desiredSalary} FCFA / ${selectedAdDetail.salaryPeriod === 'Par semaine' ? 'Semaine' : 'Mois'}` : (selectedAdDetail.proposedSalary || 'Non spécifié')}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {(selectedAdDetail.profileType === 'Agence' || selectedAdDetail.profileType === 'Agence immobilière') && (
                                    <>
                                      {selectedAdDetail.agencyName && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Nom de l'agence</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.agencyName}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.agencyCity && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Ville de l'agence</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.agencyCity}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.agencyZone && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Zone couverte</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.agencyZone}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Biens proposés</span>
                                        <span className="font-extrabold text-slate-900 uppercase">
                                          {selectedAdDetail.propertyTypes ? (Array.isArray(selectedAdDetail.propertyTypes) ? selectedAdDetail.propertyTypes.join(', ') : selectedAdDetail.propertyTypes) : 'Tous types'}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {selectedAdDetail.profileType === 'Propriétaire' && (
                                    <>
                                      {selectedAdDetail.equipmentType && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Type de matériel</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.equipmentType}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Catégorie d'équipement</span>
                                        <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.equipmentCategory || 'Général'}</span>
                                      </div>
                                      {selectedAdDetail.equipmentCity && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Ville de l'équipement</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.equipmentCity}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Unités disponibles</span>
                                        <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.quantity || selectedAdDetail.equipmentsAvailable || '1'}</span>
                                      </div>
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Prix de location</span>
                                        <span className="font-extrabold text-[#ff4500] uppercase">
                                          {selectedAdDetail.rentalPrice ? `${selectedAdDetail.rentalPrice} FCFA / Jour` : 'Non spécifié'}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {selectedAdDetail.profileType === 'Entreprise' && (
                                    <>
                                      {selectedAdDetail.companyName && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Nom Entreprise</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyName}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.companyOwner && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Responsable</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyOwner}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.companyCity && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Ville de l'entreprise</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyCity}</span>
                                        </div>
                                      )}
                                      {(selectedAdDetail.companyPoste || selectedAdDetail.companyDomain) && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Poste recherché</span>
                                          <span className="font-extrabold text-[#2dadac] uppercase">{selectedAdDetail.companyPoste || selectedAdDetail.companyDomain}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.companyWorkersCount && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Nombre de postes</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyWorkersCount}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.companyContractType && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Type de contrat</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyContractType}</span>
                                        </div>
                                      )}
                                      {selectedAdDetail.companyHours && (
                                        <div className="flex justify-between items-center py-3 px-4">
                                          <span className="text-slate-500 font-bold">Horaires</span>
                                          <span className="font-extrabold text-slate-900 uppercase">{selectedAdDetail.companyHours}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center py-3 px-4">
                                        <span className="text-slate-500 font-bold">Salaire proposé</span>
                                        <span className="font-extrabold text-orange-600 uppercase">
                                          {selectedAdDetail.companySalary || selectedAdDetail.proposedSalary || 'Non spécifié'}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  <div className="flex justify-between items-center py-3 px-4">
                                    <span className="text-slate-500 font-bold">Statut de l'annonce</span>
                                    <span className="text-emerald-500 font-black uppercase flex items-center gap-1.5 text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      ACTIVE EN LIGNE
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Fixed/Sticky Bottom Floating Action Bar with Full Available Width */}
                    <div className="shrink-0 p-4 bg-white/95 border-t border-slate-100 backdrop-blur-md z-[5020] flex justify-center w-full pb-safe">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('go-to-demande-recherche', { detail: { targetProfile: selectedAdDetail } }));
                          setSelectedAdDetail(null);
                          setShowAllOnlineAds(false);
                        }}
                        className="w-full py-4 bg-[#ff4500] hover:bg-[#e03a00] active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        DEMANDE DE SERVICE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
      </main>
    </div>
  );
};

export default OfferScreen;
