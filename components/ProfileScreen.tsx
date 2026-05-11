
import React, { useEffect, useRef, useState } from 'react';
import { User, Tab } from '../types';
import ScannerOverlay, { extractQRInfo } from './ScannerOverlay';
import { databaseService, SavedContact } from '../services/databaseService';
import { imageService } from '../services/imageService';
import { getQuestionsForType, generateWhatsAppMessage } from './common/formDefinitions';

// --- PROPS ---
interface ProfileScreenProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  setActiveTab: (tab: Tab) => void;
  onShowPopup: (msg: string, type: 'alert' | 'confirm', onConfirm?: (close: () => void) => void) => void; 
  deferredPrompt: any;
  onInstallPWA: () => void;
}

// --- CONSTANTS ---
const ADMIN_PHONE = "0705052632";
const PROFILE_IMAGE_KEY_PREFIX = 'filant_profile_image_';
const PROFILE_TS_KEY_PREFIX = 'filant_profile_ts_';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const COMPANY_PHONE = "2250705052632";

// --- ICONS ---
const ChevronRight: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const BackIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const SearchIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MapPinIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const PayeIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M52 20H12C10.8954 20 10 20.8954 10 22V48C10 49.1046 10.8954 50 12 50H52C53.1046 50 54 49.1046 54 48V22C54 20.8954 53.1046 20 52 20Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 28H54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M42 42H48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 14H42C42 14 45 14 45 17C45 20 42 20 42 20H22C22 20 19 20 19 17C19 14 22 14 22 14Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ContactIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 12H16C13.7909 12 12 13.7909 12 16V48C12 50.2091 13.7909 52 16 52H42C44.2091 52 46 50.2091 46 48V16C46 13.7909 44.2091 12 42 12Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M29 25C31.2091 25 33 23.2091 33 21C33 18.7909 31.2091 17 29 17C26.7909 17 25 18.7909 25 21C25 23.2091 26.7909 25 29 25Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M38 42C38 37.0294 33.9706 33 29 33C24.0294 33 20 37.0294 20 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 20H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 28H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 36H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const AdminIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29 32C33.4183 32 37 28.4183 37 24C37 19.5817 33.4183 16 29 16C24.5817 16 21 19.5817 21 24C21 28.4183 24.5817 32 29 32Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M29 48C21.268 48 15 41.732 15 34C15 33.364 15.054 32.738 15.16 32.124L11.83 30.084C9.722 28.776 9.428 25.896 11.21 24.114L13.17 22.154C14.952 20.372 17.832 20.666 19.14 22.774L21.18 26.1C21.794 26.054 22.42 26 23 26C23.636 26 24.262 26.054 24.876 26.16L26.916 22.83C28.224 20.722 31.104 20.428 32.886 22.21L34.846 24.17C36.628 25.952 36.334 28.832 34.226 30.14L30.9 32.18C30.946 32.794 31 33.42 31 34C31 41.732 36.732 48 44.464 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const RechercheIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H11V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M45 12H53V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 52H11V44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M45 52H53V44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 32H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const VideoIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 52C43.0457 52 52 43.0457 52 32C52 20.9543 43.0457 12 32 12C20.9543 12 12 20.9543 12 32C12 43.0457 20.9543 52 32 52Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M28 24L40 32L28 40V24Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IdIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="18" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="3"/><circle cx="22" cy="32" r="4" stroke="currentColor" strokeWidth="3"/><line x1="32" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="32" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CameraIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PhotoIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UsersIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

// --- HELPERS ---
const ProfileAvatar = ({ imageUrl, onUpload, isLocked }: { imageUrl?: string | null, onUpload: () => void, isLocked: boolean }) => (
    <div className="relative">
        <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm relative">
            {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400 mt-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 a4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
            )}
        </div>
        <button 
            onClick={isLocked ? undefined : onUpload}
            disabled={isLocked}
            className={`absolute bottom-0 right-0 w-9 h-9 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all ${isLocked ? 'bg-green-500 cursor-default scale-110' : 'bg-blue-600 text-white active:scale-90 hover:bg-blue-700'}`}
        >
            {isLocked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            )}
        </button>
    </div>
);

const ProfileRow: React.FC<{
    icon: React.ReactNode, 
    title: string, 
    subtitle?: string, 
    onClick?: () => void, 
    isDark?: boolean,
    rightElement?: React.ReactNode
}> = ({ icon, title, subtitle, onClick, isDark, rightElement }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center p-4 transition-colors active:bg-gray-100 ${isDark ? 'bg-[#212121] text-white rounded-2xl mb-4 shadow-md' : 'bg-white'}`}
    >
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg mr-4 ${isDark ? 'bg-transparent text-yellow-400' : 'text-gray-700'}`}>
            {icon}
        </div>
        <div className="flex-1 text-left overflow-hidden">
            <p className={`font-bold text-base leading-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
            {subtitle && <p className="text-gray-400 text-xs mt-0.5 truncate uppercase font-bold tracking-tighter">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0 ml-2">
            {rightElement || <ChevronRight className={isDark ? "text-red-500" : "text-gray-300"} />}
        </div>
    </button>
);

const ContactListView: React.FC<{ contacts: SavedContact[], onDelete: (id: string) => void }> = ({ contacts, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const generateWhatsAppUrl = (contact: SavedContact) => {
        const text = `*Contact Assistance QR - FILANT°225*\n\n` +
                     `*Service:* ${contact.title}\n` +
                     `*Nom:* ${contact.name}\n` +
                     `*Ville:* ${contact.city || 'Non spécifiée'}\n` +
                     `*Numéro:* +225 ${contact.phone}\n\n` +
                     `Bonjour FILANT°225, voici les informations pour ma demande.`;
        return `https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(text)}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F3F3]">
            <div className="p-4 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Rechercher un contact scanné..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        <p className="text-sm font-bold uppercase tracking-widest text-center px-4 leading-tight">Aucun contact trouvé dans Assistant QR</p>
                    </div>
                ) : (
                    filtered.map(contact => (
                        <div key={contact.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden animate-in fade-in duration-300">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit mb-1 tracking-tighter">
                                        {contact.title}
                                    </span>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[180px]">{contact.name}</h4>
                                </div>
                                <div className="bg-blue-50 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-blue-100">
                                    <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-tighter truncate max-w-[80px]">
                                        {contact.city || 'Non spécifiée'}
                                    </span>
                                </div>
                            </div>

                            {contact.review && contact.review !== (contact.city || 'Non spécifiée') && (
                                <p className="text-xs text-gray-500 italic leading-snug border-l-2 border-orange-100 pl-3">
                                    {contact.review}
                                </p>
                            )}

                            <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Numéro WhatsApp</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <p className="text-green-600 font-black text-sm tracking-tight">+225 {contact.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onDelete(contact.id)} className="p-2.5 bg-red-50 text-red-500 rounded-full active:scale-90 transition-transform">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    <a href={`tel:${COMPANY_PHONE}`} className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </a>
                                    <a href={generateWhatsAppUrl(contact)} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#25D366] text-white rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" /></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- PROFILE SCREEN COMPONENT ---
const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onClose, onLogout, setActiveTab, onShowPopup, deferredPrompt, onInstallPWA }) => {
  if (!user) return null;

  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [view, setView] = useState<'main' | 'contacts'>('main');
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [idImages, setIdImages] = useState({ front: user.idCardFront || '', back: user.idCardBack || '' });
  const [isUploading, setIsUploading] = useState(false);
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  
  const touchStartX = useRef<number | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;
      if (diff > 50) {
          handleClose();
      }
      touchStartX.current = null;
  };

  const [profileImage, setProfileImage] = useState<string | null>(() => {
      if (!user?.phone) return null;
      const stored = localStorage.getItem(`${PROFILE_IMAGE_KEY_PREFIX}${user.phone}`);
      const storedTs = localStorage.getItem(`${PROFILE_TS_KEY_PREFIX}${user.phone}`);
      if (storedTs) {
          const ts = parseInt(storedTs);
          if (Date.now() - ts < ONE_MONTH_MS) return stored; 
      }
      return stored;
  });

  const isProfileLocked = React.useMemo(() => {
    if (!user?.phone) return false;
    const storedTs = localStorage.getItem(`${PROFILE_TS_KEY_PREFIX}${user.phone}`);
    if (!storedTs || !profileImage) return false;
    const ts = parseInt(storedTs);
    return (Date.now() - ts) < ONE_MONTH_MS;
  }, [user?.phone, profileImage]);

  useEffect(() => {
    if (user?.phone) {
      setContacts(databaseService.getContacts(user.phone));
    }
    requestAnimationFrame(() => {
        if (panelRef.current) panelRef.current.classList.remove('translate-x-full');
        if (overlayRef.current) overlayRef.current.classList.remove('opacity-0');
    });
  }, [user?.phone]);

  const handleBack = () => {
    if (view !== 'main') setView('main');
    else handleClose();
  };

  const handleClose = () => {
    if (panelRef.current) panelRef.current.classList.add('translate-x-full');
    if (overlayRef.current) overlayRef.current.classList.add('opacity-0');
    setTimeout(onClose, 300);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProfileLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    onShowPopup("Compression et envoi de l'image sur Firebase...", "alert");
    
    try {
      // 1. Compress image
      const compressedBase64 = await imageService.compressImage(file, 800, 0.7);
      
      // 2. Upload to Firebase Storage and update Firestore
      const downloadUrl = await databaseService.uploadUserProfileImage(user.phone, compressedBase64);
      
      if (downloadUrl) {
          const now = Date.now();
          setProfileImage(downloadUrl);
          localStorage.setItem(`${PROFILE_IMAGE_KEY_PREFIX}${user.phone}`, downloadUrl);
          localStorage.setItem(`${PROFILE_TS_KEY_PREFIX}${user.phone}`, now.toString());
          onShowPopup("Photo de profil mise à jour avec succès !", "alert");
      } else {
          onShowPopup("Erreur lors de l'envoi de l'image.", "alert");
      }
    } catch (err) {
      console.error("Profile image upload error:", err);
      onShowPopup("Impossible de traiter l'image.", "alert");
    }
  };

  const handleScanResult = (data: string) => {
    setShowScanner(false);
    const info = extractQRInfo(data);
    const sanitizePhone = (phone: string): string => {
        if (!phone) return '';
        let cleanPhone = phone.replace(/[\s-.]/g, '');
        if (cleanPhone.startsWith('+225')) cleanPhone = cleanPhone.slice(4);
        return cleanPhone;
    };
    if (info.name && info.phone !== 'N/A') {
        const newContact: SavedContact = {
            id: Date.now().toString(),
            title: info.title,
            name: info.name,
            phone: sanitizePhone(info.phone),
            city: info.city,
            review: info.details || info.city 
        };
        const updated = [...contacts, newContact];
        setContacts(updated);
        
        // Enregistrement individuel proactif pour garantir la persistence et visibilité admin
        databaseService.saveIndividualScan(user, newContact);
        databaseService.saveContacts(user.phone, updated, user);
        
        onShowPopup("Information validée et intégrée dans l'Assistance QR !", "alert");
        setView('contacts');
    } else {
        onShowPopup("Le format du code QR n'a pas pu être structuré automatiquement.", "alert");
    }
  };

// Mode switching views removed

    const handleInstallPWA = () => {
        onInstallPWA();
    };

    const renderMainView = () => (
    <div className="flex flex-col h-full bg-[#F3F3F3]">
        <header className="p-4 flex items-center bg-white shadow-sm border-b border-gray-100">
            <button onClick={handleBack} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                <BackIcon />
            </button>
            <h1 className="flex-1 text-center font-black uppercase text-base tracking-tight mr-10">Mon Espace Profil</h1>
        </header>
        <div className="flex flex-col items-center justify-center pt-8 pb-8 px-4 bg-white shadow-sm mb-6">
            <ProfileAvatar imageUrl={profileImage} onUpload={() => fileInputRef.current?.click()} isLocked={isProfileLocked} />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="flex items-center gap-2 mt-5">
                <h1 className="text-2xl font-black text-gray-900 capitalize tracking-tight">{user.name || 'Utilisateur'}</h1>
                <div className="bg-orange-100 p-1 rounded-full"><ChevronRight className="h-4 w-4 text-orange-500" /></div>
            </div>
            <p className="text-gray-400 font-bold text-sm mt-0.5 tracking-tighter uppercase">Résidence: {user.city || 'Non spécifiée'}</p>
            <p className="text-slate-900 font-black text-sm mt-2 bg-gray-100 px-3 py-1 rounded-full">
                {(() => {
                    const p = user.phone || '';
                    if (p.startsWith('+')) return p;
                    if (p.startsWith('225')) return `+${p}`;
                    return `+225${p}`;
                })()}
            </p>
        </div>
        <div className="flex-1 space-y-6 pb-32">
            <div className="bg-white rounded-3xl overflow-hidden mx-4 shadow-sm border border-gray-100">
                <ProfileRow icon={<PayeIcon className="w-10 h-10 text-blue-600" />} title="Modes de paiement" subtitle="ESPÈCES / WAVE" onClick={() => { setActiveTab(Tab.Payment); handleClose(); }} rightElement={<div className="bg-green-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5"><span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Actif</span><ChevronRight className="h-3 w-3 text-green-700" /></div>} />
                <div className="h-px bg-gray-50 mx-4"></div>
                <ProfileRow icon={<ContactIcon className="w-10 h-10 text-orange-500" />} title="Assistance QR" subtitle="Contacts intégrés" onClick={() => setView('contacts')} />
            </div>
            
            <div className="bg-white rounded-3xl overflow-hidden mx-4 shadow-sm border border-gray-100">
                <ProfileRow icon={<IdIcon className="w-10 h-10 text-blue-600" />} title="Intégration de la pièce d'identité" subtitle={idImages.front && idImages.back ? "DOCUMENTS SOUMIS" : "CNI / CARTE PROF / OFFICIEL"} onClick={() => setShowIdModal(true)} rightElement={idImages.front && idImages.back ? <div className="bg-green-100 px-2 pl-1 rounded-full flex items-center gap-1"><div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div><span className="text-[9px] font-black text-green-700 uppercase tracking-tighter mr-1">OK</span></div> : undefined} />
                <div className="h-px bg-gray-50 mx-4"></div>
                <ProfileRow icon={<VideoIcon className="w-10 h-10 text-red-500" />} title="Vidéos Tuto" subtitle="Tutoriels FILANT°225" onClick={() => window.open('https://www.youtube.com/@FILANT225', '_blank')} />
            </div>

            <div className="bg-white rounded-3xl overflow-hidden mx-4 shadow-sm border border-gray-100">
                <ProfileRow 
                    icon={<svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>} 
                    title="Installer l'App (PWA)" 
                    subtitle="Version Web Installable" 
                    onClick={handleInstallPWA} 
                />
            </div>
            <div className="px-4 pt-6">
                <button onClick={handleLogoutClick} className="w-full py-4 text-red-600 font-black uppercase tracking-widest text-[10px] bg-white rounded-2xl shadow-sm border border-red-50 transition-all active:scale-[0.98] active:bg-red-50 flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Déconnexion</button>
            </div>
        </div>
    </div>
  );

  const handleLogoutClick = () => {
    onShowPopup("Voulez-vous vous déconnecter de votre session ?", 'confirm', (close) => { onLogout(); close(); });
  };

  const handleClearContacts = () => {
      onShowPopup("Voulez-vous vider toute votre liste d'Assistance QR ?", 'confirm', (close) => {
          databaseService.saveContacts(user.phone, [], user);
          setContacts([]);
          close();
      });
  };

  const handleDeleteContact = (id: string) => {
      const updated = contacts.filter(c => c.id !== id);
      setContacts(updated);
      databaseService.saveContacts(user.phone, updated, user);
  };

  const handleIdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSide) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Compress image
      const compressedBase64 = await imageService.compressImage(file, 1000, 0.6);
      
      // 2. Upload to Firebase Storage and update Firestore
      const downloadUrl = await databaseService.uploadIdDocument(user.phone, activeSide, compressedBase64);
      
      if (downloadUrl) {
          setIdImages(prev => ({ ...prev, [activeSide]: downloadUrl }));
      }
      
      setIsUploading(false);
      setActiveSide(null);
    } catch (err) {
      console.error("ID upload error:", err);
      setIsUploading(false);
    }
  };

  const renderIdModal = () => (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F3F3F3] animate-in slide-in-from-bottom duration-300">
      <header className="p-4 flex items-center bg-white shadow-sm border-b border-gray-100">
        <button onClick={() => setShowIdModal(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <BackIcon />
        </button>
        <h1 className="flex-1 text-center font-black uppercase text-sm tracking-tight mr-10">Intégration Pièce d'Identité</h1>
      </header>
      
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <h3 className="text-blue-800 font-bold text-xs uppercase mb-1">Documents acceptés</h3>
          <p className="text-[10px] text-blue-600 uppercase font-bold leading-relaxed">
            CNI • CARTE PROFESSIONNELLE • DOCUMENT OFFICIEL AUTORISÉ • PIÈCE NUMÉRISÉE
          </p>
        </div>

        <div className="grid gap-6">
          {/* Face Avant */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Face Avant de la pièce</label>
            <div 
              onClick={() => { setActiveSide('front'); idFileInputRef.current?.click(); }}
              className={`aspect-[1.6/1] w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${idImages.front ? 'border-green-500 bg-white' : 'border-gray-200 bg-gray-50'}`}
            >
              {idImages.front ? (
                <>
                  <img src={idImages.front} className="w-full h-full object-cover" alt="ID Front" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-[10px] font-black uppercase bg-blue-600 px-4 py-2 rounded-full">Modifier</p>
                  </div>
                </>
              ) : (
                <>
                  <CameraIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prendre / Importer</p>
                </>
              )}
            </div>
          </div>

          {/* Face Arrière */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Face Arrière de la pièce</label>
            <div 
              onClick={() => { setActiveSide('back'); idFileInputRef.current?.click(); }}
              className={`aspect-[1.6/1] w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${idImages.back ? 'border-green-500 bg-white' : 'border-gray-200 bg-gray-50'}`}
            >
              {idImages.back ? (
                <>
                  <img src={idImages.back} className="w-full h-full object-cover" alt="ID Back" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-[10px] font-black uppercase bg-blue-600 px-4 py-2 rounded-full">Modifier</p>
                  </div>
                </>
              ) : (
                <>
                  <CameraIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prendre / Importer</p>
                </>
              )}
            </div>
          </div>
        </div>

        {idImages.front && idImages.back && (
          <div className="bg-green-50 p-5 rounded-3xl border border-green-100 flex items-center gap-4 animate-in zoom-in duration-300">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h4 className="text-green-800 font-black text-[10px] uppercase tracking-widest">Documents ajoutés</h4>
              <p className="text-[10px] text-green-600 uppercase font-bold">Ils sont maintenant liés à votre profil.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <button 
          onClick={() => setShowIdModal(false)}
          className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
        >
          {idImages.front && idImages.back ? "Fermer et Valider" : "Continuer plus tard"}
        </button>
      </div>

      <input 
        type="file" 
        ref={idFileInputRef} 
        onChange={handleIdFileChange} 
        className="hidden" 
        accept="image/*" 
        capture={activeSide === 'front' || activeSide === 'back' ? 'environment' : undefined}
      />
    </div>
  );

  return (
    <div className="absolute inset-0 z-[100] flex justify-end" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div ref={overlayRef} className="absolute inset-0 bg-black/40 transition-opacity duration-300 opacity-0" onClick={handleClose}></div>
        <div ref={panelRef} className="relative z-10 w-full max-w-[320px] bg-[#F3F3F3] flex flex-col transition-transform duration-300 translate-x-full overflow-hidden">
            <main className="flex-1 overflow-y-auto scrollbar-hide">
                {view === 'main' && renderMainView()}
                {view === 'contacts' && (
                    <div className="bg-[#F3F3F3] h-full flex flex-col">
                        <header className="p-4 flex items-center bg-white shadow-sm border-b border-gray-100"><button onClick={() => setView('main')} className="p-2 -ml-2 active:scale-90 transition-transform"><BackIcon className="w-7 h-7 text-black"/></button><h1 className="flex-1 text-center font-black uppercase text-base tracking-tight mr-10">Assistance QR</h1><button onClick={handleClearContacts} className="p-2 text-red-500"><TrashIcon className="w-5 h-5"/></button></header>
                        <ContactListView contacts={contacts} onDelete={handleDeleteContact} />
                    </div>
                )}
            </main>
        </div>
        {showScanner && <ScannerOverlay onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
        {showIdModal && renderIdModal()}
    </div>
  );
};

export default ProfileScreen;
