
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Tab } from '../types';
import { databaseService } from '../services/databaseService';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SpeakerIcon from './common/SpeakerIcon';
import { audioService } from '../services/audioService';

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
    { title: "Vendeuse / Vendeur", type: "worker" },
    { title: "Cuisinier / Cuisinière", type: "worker" },
    { title: "Serveur / Serveuse", type: "worker" },
    { title: "Coiffeur / Coiffeuse", type: "worker" },
    { title: "Hôtesse d’accueil", type: "worker" },
    { title: "Chauffeur", type: "worker" },
    { title: "Agent d’entretien / Femme de ménage", type: "worker" },
    { title: "Caissière / Caissier", type: "worker" },
    { title: "Réceptionniste", type: "worker" },
    { title: "Nounou / Baby-sitter", type: "worker" },
    { title: "Jardinier", type: "worker" },
    { title: "Couturière / Couturier", type: "worker" },
    { title: "Esthéticienne", type: "worker" },
    { title: "Magasinier", type: "worker" },
    { title: "Manutentionnaire", type: "worker" },
    { title: "Vigile", type: "worker" },
    { title: "Plombier", type: "worker" },
    { title: "Électricien", type: "worker" },
    { title: "Carreleur", type: "worker" },
    { title: "Charpentier", type: "worker" },
    { title: "Maçon", type: "worker" },
    { title: "Soudeur", type: "worker" },
    { title: "Peintre", type: "worker" },
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
    electricien: "https://i.supaimg.com/9f041925-62aa-4975-8ac1-1c8c2b8cddbc.jpg",
    plombier: "https://i.supaimg.com/2f48ca38-bff5-4ebb-9ac5-d72553710d0e.jpg",
    clim: "https://i.supaimg.com/e9e9e2cb-e3e2-4504-a37b-90c888c42740.jpg",
    macon: "https://i.supaimg.com/ddaa37a0-cc8d-4cdd-a857-8d1eb4f72383.jpg",
    peintre: "https://i.supaimg.com/8e6037b9-ce46-45e4-b620-0a04e4cf657d.jpg",
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
    { title: "Nounou / Garde d’enfants", name: "Puck", city: "Daloa", description: "Soutien et soins aux malades", price: "40 000 F", img: INTERV_IMAGES.garde_malade },
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
            <div className="h-[120px] w-full relative">
                <img 
                    src={item.img || "https://i.supaimg.com/c3c14402-3c1f-4484-bfe1-774bcc4ac6de.png"} 
                    alt={item.title} 
                    className={`w-full h-full object-cover transition-all duration-500 ${isUnblurred ? 'blur-0' : 'blur-[15px]'}`} 
                    referrerPolicy="no-referrer" 
                />
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
                    <span className="text-[8px] font-bold truncate">Filant Services</span>
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
                            <input 
                                type="text" 
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                placeholder="Ex: Bassam"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Salaire souhaité</label>
                            <input 
                                type="text" 
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                placeholder="Ex: 65000F"
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
}

const OfferScreen: React.FC<OfferScreenProps> = ({ onNavigateToMenu, setActiveTab, onOpenIntervention, onOpenCategory, onSelectItem, user }) => {
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

  useEffect(() => {
    setIsLoadingOffers(false);
  }, []);

  // Fetch Firebase offers
  useEffect(() => {
    console.log("Setting up Firestore onSnapshot listener for offres_emploi...");
    // We don't use orderBy here to avoid excluding documents missing the createdAt field
    const q = query(collection(db, 'offres_emploi'));
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
          <img 
            src="https://i.supaimg.com/5cd01a23-e101-4415-9e28-ff02a617cd11.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
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
            <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                La solution rapide pour <br/>
                <span className="text-orange-500">vos besoins quotidiens</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-10">
                Trouvez des travailleurs qualifiés, louez du matériel ou dénichez votre future maison. FILANT°225 connecte particuliers et professionnels en toute sécurité.
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
          
          {/* Intervention Rapide */}
          <InfoBox 
            title="Intervention rapide"
            description="Intervention rapide par des professionnels qualifiés for tous vos besoins de dépannage. Nos experts sont disponibles for résoudre vos problèmes efficacement et rapidement."
            onLinkClick={onOpenIntervention}
          />

          {/* Demande d'embauche simplified section */}
          <div className="bg-[#16a34a] pt-16 pb-16 mb-6 relative overflow-hidden transition-all duration-500">
             {/* Gradient Overlays for smooth transition */}
             <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F8F9FB] to-transparent pointer-events-none z-10"></div>
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8F9FB] to-transparent pointer-events-none z-10"></div>

             <div className="px-6 relative z-20">
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-6">
                    DEMANDE D'EMBAUCHE
                </h2>
                
                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-2xl">
                    <p className="text-white font-bold text-lg leading-tight mb-6">
                        🔥 Tu cherches travail sérieux ? Écoute ça d’abord !
                    </p>
                    
                    <div className="space-y-4 mb-8">
                        <p className="text-[#a3e635] font-black text-sm uppercase tracking-wide">Chez FILANT°225, on est dans le concret 👇</p>
                        
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">👉</span>
                                <p className="text-white text-sm font-bold">Pas besoin de diplôme compliqué</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-xl">👉</span>
                                <p className="text-white text-sm font-bold">Pas besoin de connexion spéciale</p>
                            </div>
                        </div>

                        <p className="text-white/80 text-xs font-black uppercase tracking-widest pt-2">Nous, on travaille avec :</p>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="text-xl">🔧</span>
                                <p className="text-white text-xs font-bold uppercase">Travailleurs qualifiés</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="text-xl">🚗</span>
                                <p className="text-white text-xs font-bold uppercase">Agents mobiles pour nos activités</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="text-xl">🏠</span>
                                <p className="text-white text-xs font-bold uppercase">Agents immobiliers</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-2">
                            <span className="text-xl">💼</span>
                            <p className="text-white text-sm font-bold italic">Ici, c'est la mise en relation</p>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <span className="text-xl">👉</span>
                            <p className="text-white text-sm font-bold">Si tu es motivé, sérieux et prêt à bouger, tu peux avoir ta place avec nous.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex flex-col items-center space-y-4">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2 text-center">
                            🎧 Clique ici pour écouter l’audio et comprendre tout clairement 👇
                        </p>
                        
                        <button 
                            onClick={() => {
                                const audioText = `Tu cherches travail sérieux ? Écoute ça d’abord ! Chez FILANT 225, on est dans le concret. Pas besoin de diplôme compliqué. Pas besoin de connexion spéciale. Nous, on travaille avec : Travailleurs qualifiés, Agents mobiles pour nos activités, Agents immobiliers. Ici, c'est la mise en relation. Si tu es motivé, sérieux et prêt à bouger, tu peux avoir ta place avec nous.`;
                                audioService.speak(audioText);
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                        >
                            <SpeakerIcon className="w-6 h-6" />
                            <span>ÉCOUTER</span>
                        </button>

                        <button 
                            onClick={() => window.open('https://filant-225-inscription.vercel.app/', '_blank')}
                            className="w-full bg-white text-[#16a34a] font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-2 border-white"
                        >
                            <span>S’inscrire</span>
                        </button>
                    </div>
                </div>
             </div>
          </div>

          {/* Agence Immobilière */}
          <div className="px-4 mb-6">
              <button 
                onClick={() => onOpenCategory('immobilier')}
                className="w-full bg-white text-gray-900 p-7 rounded-[2.5rem] flex justify-between items-center shadow-md border border-gray-100 active:scale-[0.98] transition-all"
              >
                  <span className="text-xl font-black">Agence Immobilière</span>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600"><ArrowRightIcon /></div>
              </button>
          </div>

          <div className="px-4 space-y-4 mb-12">
              <button 
                onClick={() => onOpenCategory('travailleurs')}
                className="w-full bg-slate-900 text-white p-7 rounded-[2.5rem] flex justify-between items-center shadow-lg active:scale-[0.98] transition-all"
              >
                  <span className="text-xl font-black">Travailleurs Qualifiés</span>
                  <div className="bg-white/20 p-2 rounded-full"><ArrowRightIcon /></div>
              </button>
              <button 
                onClick={() => onOpenCategory('equipement')}
                className="w-full bg-white text-gray-900 p-7 rounded-[2.5rem] flex justify-between items-center shadow-md border border-gray-100 active:scale-[0.98] transition-all"
              >
                  <span className="text-xl font-black">Location d'équipements</span>
                  <div className="bg-gray-100 p-2 rounded-full"><ArrowRightIcon /></div>
              </button>
          </div>
      </main>
    </div>
  );
};

export default OfferScreen;
