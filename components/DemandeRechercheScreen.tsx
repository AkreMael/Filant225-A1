import React, { useState, useEffect } from 'react';
import { User, Tab } from '../types';
import { databaseService } from '../services/databaseService';
import { imageService } from '../services/imageService';
import { LeafletMap } from './LeafletMap';
import CityAutocompleteInput from './common/CityAutocompleteInput';
import { ArrowLeft, Search, Loader2, Compass, MapPin, Briefcase, Building, CheckCircle, MessageSquare, AlertCircle, X, ChevronLeft, ChevronRight, Camera, Trash2, Check, RefreshCw, Heart, Share2 } from 'lucide-react';
import { doc, onSnapshot, collection, query, orderBy, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface InscriptionResult {
  id: string;
  name: string;
  city: string;
  profileType: 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise';
  titleOrActivity: string;
  description?: string;
  imageLink?: string;
  [key: string]: any;
}

const CardImageCarousel = ({ images, onImageClick }: { images: string[], onImageClick: (url: string) => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {/* Slides view wrapper */}
      <div className="w-full h-full relative">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={imgUrl}
              alt={`slide-${idx}`}
              className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
              onClick={() => onImageClick(imgUrl)}
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-black/40 backdrop-blur-[2px] px-2 py-1 rounded-full border border-white/10">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === activeIndex ? 'bg-orange-500 scale-125' : 'bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Manual swipe control overlays (chevrons left/right) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 active:scale-95 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 active:scale-95 shadow-sm"
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </>
      )}
    </div>
  );
};

interface DemandeRechercheScreenProps {
  onBack: () => void;
  user: User;
  onSelectTab: (tab: Tab) => void;
  initialQuery?: string;
}

const getCategoryColors = (profileType: 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise' | string) => {
  switch (profileType) {
    case 'Travailleur':
      return {
        textColor: 'text-green-600',
        buttonBg: 'bg-green-600 hover:bg-green-700 active:bg-green-800'
      };
    case 'Propriétaire':
      return {
        textColor: 'text-purple-600',
        buttonBg: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
      };
    case 'Agence':
      return {
        textColor: 'text-blue-600',
        buttonBg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
      };
    case 'Entreprise':
    default:
      return {
        textColor: 'text-orange-600',
        buttonBg: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
      };
  }
};

const CITY_COORDINATES: Record<string, { x: number; y: number; lat: number; lng: number }> = {
  'abidjan': { x: 318, y: 175, lat: 5.3600, lng: -4.0083 },
  'cocody': { x: 322, y: 172, lat: 5.3484, lng: -3.9877 },
  'yopougon': { x: 310, y: 176, lat: 5.3400, lng: -4.0600 },
  'plateau': { x: 318, y: 174, lat: 5.3200, lng: -4.0200 },
  'treichville': { x: 319, y: 176, lat: 5.3000, lng: -4.0100 },
  'marcory': { x: 321, y: 176, lat: 5.2900, lng: -3.9900 },
  'koumassi': { x: 324, y: 177, lat: 5.2800, lng: -3.9600 },
  'port-bouët': { x: 326, y: 180, lat: 5.2500, lng: -3.9400 },
  'adjame': { x: 317, y: 172, lat: 5.3500, lng: -4.0200 },
  'abobo': { x: 319, y: 167, lat: 5.4200, lng: -4.0200 },
  'bingerville': { x: 332, y: 173, lat: 5.3500, lng: -3.8900 },
  'grand-bassam': { x: 342, y: 179, lat: 5.2100, lng: -3.7300 },
  'bassam': { x: 342, y: 179, lat: 5.2100, lng: -3.7300 },
  'yamoussoukro': { x: 275, y: 135, lat: 6.8276, lng: -5.2744 },
  'bouake': { x: 298, y: 105, lat: 7.6939, lng: -5.0311 },
  'bouaké': { x: 298, y: 105, lat: 7.6939, lng: -5.0311 },
  'san-pedro': { x: 205, y: 185, lat: 4.7485, lng: -6.6371 },
  'san pedro': { x: 205, y: 185, lat: 4.7485, lng: -6.6371 },
  'korhogo': { x: 260, y: 55, lat: 9.4580, lng: -5.6290 },
  'man': { x: 210, y: 125, lat: 7.4125, lng: -7.5536 },
  'daloa': { x: 245, y: 138, lat: 6.8773, lng: -6.4502 },
  'gagnoa': { x: 255, y: 155, lat: 6.1319, lng: -5.9472 },
  'odienne': { x: 195, y: 58, lat: 9.5051, lng: -7.5643 },
  'odienné': { x: 195, y: 58, lat: 9.5051, lng: -7.5643 },
  'ferkessedougou': { x: 282, y: 62, lat: 9.5928, lng: -5.1983 },
  'ferké': { x: 282, y: 62, lat: 9.5928, lng: -5.1983 },
  'assinie': { x: 355, y: 181, lat: 5.1200, lng: -3.3000 },
  'bouna': { x: 335, y: 62, lat: 9.2690, lng: -2.9904 },
  'bondoukou': { x: 342, y: 102, lat: 8.0333, lng: -2.8000 },
  'abengourou': { x: 344, y: 140, lat: 6.7297, lng: -3.4964 },
};

const COCI_CENTER = { x: 285, y: 120, lat: 7.5399, lng: -5.5471 };

const projectLatLng = (lat: number, lng: number): { x: number; y: number } => {
  const minLat = 4.4;
  const maxLat = 10.7;
  const minLng = -8.6;
  const maxLng = -2.5;

  const xMin = 230;
  const xMax = 350;
  const yMin = 190;
  const yMax = 80;

  const xPercent = (lng - minLng) / (maxLng - minLng);
  const xPct = Math.max(0, Math.min(1, xPercent));
  const x = xMin + xPct * (xMax - xMin);

  const yPercent = (lat - minLat) / (maxLat - minLat);
  const yPct = Math.max(0, Math.min(1, yPercent));
  const y = yMin - yPct * (yMin - yMax);

  return { x, y };
};

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getStableCoordinatesForCity = (cityName: string): { x: number; y: number; lat: number; lng: number } => {
  const normalized = cityName.toLowerCase().trim();
  const keyMap = Object.keys(CITY_COORDINATES).find(k => normalized.includes(k) || k.includes(normalized));
  if (keyMap) {
    return CITY_COORDINATES[keyMap];
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const x = 240 + (Math.abs(hash) % 90);
  const y = 90 + (Math.abs(hash >> 2) % 60);

  const lat = 5.0 + ((Math.abs(hash >> 4) % 300) / 100);
  const lng = -6.5 + ((Math.abs(hash >> 8) % 300) / 100);

  return { x, y, lat, lng };
};

export const DemandeRechercheScreen: React.FC<DemandeRechercheScreenProps> = ({ onBack, user, onSelectTab, initialQuery }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InscriptionResult[] | null>(null);
  const [inscriptionsFromDB, setInscriptionsFromDB] = useState<any[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // Real-time current user ad states, detail view states & lightbox states
  const [currentUserAd, setCurrentUserAd] = useState<any | null>(null);
  const [selectedAdDetail, setSelectedAdDetail] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [qrData, setQrData] = useState<any | null>(null);
  const [showQRBlockedModal, setShowQRBlockedModal] = useState(false);
  const [isOnlineFormOpen, setIsOnlineFormOpen] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Online Form inputs & steps
  const [formProfileType, setFormProfileType] = useState<'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise'>('Travailleur');
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDesc, setFormDesc] = useState('');
  
  // Worker specialized fields
  const [formJob, setFormJob] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formSalaryPeriod, setFormSalaryPeriod] = useState<'Par semaine' | 'Par mois'>('Par mois');

  // Real estate Agence specialized fields
  const [formAgencyName, setFormAgencyName] = useState('');
  const [formPropertyTypes, setFormPropertyTypes] = useState<string[]>([]); // Checked categories list

  // Equipment Owner specialized fields
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formEquipCount, setFormEquipCount] = useState<number>(1);
  const [formEquipCategory, setFormEquipCategory] = useState('');

  // Enterprise specialized fields
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formCompanyDomain, setFormCompanyDomain] = useState('');
  const [formCompanyServices, setFormCompanyServices] = useState('');
  const [formCompanyOwner, setFormCompanyOwner] = useState('');
  const [formCompanyPoste, setFormCompanyPoste] = useState('');
  const [formCompanyWorkersCount, setFormCompanyWorkersCount] = useState('');
  const [formCompanyContractType, setFormCompanyContractType] = useState('');
  const [formCompanySalary, setFormCompanySalary] = useState('');
  const [formCompanyHours, setFormCompanyHours] = useState('');
  const [formCompanySkills, setFormCompanySkills] = useState('');

  // Duration selection & images Base64 array
  const [formDuration, setFormDuration] = useState<'1_week' | '1_month'>('1_week');
  const [formImages, setFormImages] = useState<string[]>([]); // Previews of Base64 attachments (up to 2 maximum)

  // Interactive Payment simulation states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [phoneNumberForPayment, setPhoneNumberForPayment] = useState('');

  // New states for top profile display & retrieval animation
  const [pinnedProfile, setPinnedProfile] = useState<InscriptionResult | null>(null);
  const [retrievingProfileId, setRetrievingProfileId] = useState<string | null>(null);
  const [isSearchingVille, setIsSearchingVille] = useState(false);
  const [searchingCityName, setSearchingCityName] = useState('');

  // User current geolocation state with auto permission and fallbacks
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    x: number;
    y: number;
    authorized: boolean;
  } | null>(null);

  // Request browser GPS permission
  const requestGPSPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = projectLatLng(lat, lng);
          setUserLocation({
            lat,
            lng,
            name: "Ma position",
            x: coords.x,
            y: coords.y,
            authorized: true,
          });
        },
        (error) => {
          console.warn("GPS error callback:", error);
          const abidjanCoords = projectLatLng(5.3600, -4.0083);
          setUserLocation({
            lat: 5.3600,
            lng: -4.0083,
            name: "Abidjan",
            x: abidjanCoords.x,
            y: abidjanCoords.y,
            authorized: false,
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  // Auto request location permission on component mounting
  useEffect(() => {
    requestGPSPermission();
  }, []);

  // Redirect to Google Maps with pre-filled driving route
  const openGoogleMapsRoute = () => {
    if (!pinnedProfile) return;
    const origin = userLocation?.authorized 
      ? `${userLocation.lat},${userLocation.lng}` 
      : `${userLocation?.lat || 5.3600},${userLocation?.lng || -4.0083}`;
    const destination = `${pinnedProfile.city}, Côte d'Ivoire`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  // Handle simulated profile retrieval duration before pinning it to top of search screen
  const handleRetrieveProfile = (item: InscriptionResult) => {
    setRetrievingProfileId(item.id);
    setIsSearchingVille(true);
    setSearchingCityName(item.city);
    // Pin the profile immediately so it renders at the top without delay
    setPinnedProfile(item);

    // Scroll helper to target all potential scroll containers smoothly and immediately
    const performScroll = (behavior: 'smooth' | 'auto') => {
      const selectors = [
        '.scroll-container', 
        '#demande-recherche-main', 
        '#demande-recherche-screen', 
        'main', 
        '.overflow-y-auto'
      ];
      selectors.forEach(sel => {
        const elements = document.querySelectorAll(sel);
        elements.forEach(el => {
          try {
            el.scrollTo({ top: 0, behavior });
          } catch (e) {
            try {
              el.scrollTop = 0;
            } catch (err) {}
          }
        });
      });
      try {
        window.scrollTo({ top: 0, behavior });
        document.documentElement.scrollTo({ top: 0, behavior });
        document.body.scrollTo({ top: 0, behavior });
      } catch (err) {}
    };

    // Execute scroll instantly first to react immediately to the click
    performScroll('auto');

    // Also trigger smooth scrolling across multiple frames & timeouts
    // to override any layout shifts or delayed renders from React state updates
    requestAnimationFrame(() => performScroll('smooth'));
    setTimeout(() => performScroll('smooth'), 10);
    setTimeout(() => performScroll('smooth'), 50);
    setTimeout(() => performScroll('smooth'), 100);
    setTimeout(() => performScroll('smooth'), 200);
    setTimeout(() => performScroll('smooth'), 400);
    
    setTimeout(() => {
      setRetrievingProfileId(null);
      setIsSearchingVille(false);
    }, 2800); // 2.8 seconds simulated satellite lock routing
  };

  // Automatically scroll to the top of the search view whenever pinning/locating starts
  useEffect(() => {
    if (isSearchingVille || pinnedProfile) {
      const performScroll = (behavior: 'smooth' | 'auto') => {
        const selectors = [
          '.scroll-container', 
          '#demande-recherche-main', 
          '#demande-recherche-screen', 
          'main', 
          '.overflow-y-auto'
        ];
        selectors.forEach(sel => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => {
            try {
              el.scrollTo({ top: 0, behavior });
            } catch (e) {
              try {
                el.scrollTop = 0;
              } catch (err) {}
            }
          });
        });
        try {
          window.scrollTo({ top: 0, behavior });
          document.documentElement.scrollTo({ top: 0, behavior });
          document.body.scrollTo({ top: 0, behavior });
        } catch (err) {}
      };

      performScroll('smooth');
      const timer = setTimeout(() => performScroll('smooth'), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchingVille, pinnedProfile]);

  // New subpath states for "Demande de service" form
  const [selectedItemForForm, setSelectedItemForForm] = useState<InscriptionResult | null>(null);
  const [showActionOptions, setShowActionOptions] = useState<InscriptionResult | null>(null);
  const [showReportModal, setShowReportModal] = useState<InscriptionResult | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  // 1. Listen to all Inscriptions in real-time
  useEffect(() => {
    const q = query(collection(db, 'Inscriptions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setInscriptionsFromDB(data);
    }, (err) => {
      console.error("Error setting up live Inscriptions listener:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to current user's specific registration in real-time
  useEffect(() => {
    if (!user?.phone) return;
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    const docRef = doc(db, 'Inscriptions', sanitizedPhone);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const ad = snap.data();
        setCurrentUserAd(ad);
      }
    }, (err) => {
      console.warn("Silent current user ad subscribe fail:", err);
    });
    return () => unsubscribe();
  }, [user?.phone]);

  // 3. Listen to current user's QR activation status in real-time
  useEffect(() => {
    if (!user?.phone) return;
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    const docRef = doc(db, 'QRCodeActivations', sanitizedPhone);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setQrData(snap.data());
      } else {
        setQrData(null);
      }
    }, (err) => {
      console.warn("Silent current user QR activation subscribe fail:", err);
    });
    return () => unsubscribe();
  }, [user?.phone]);

  const getQRActivationStep = () => {
    if (!qrData) return 1;
    if (qrData.requiresRegistration) return 1;
    if (qrData.fraisDossierPayes === true) {
      const status = qrData.status || '';
      const isActive = status === "Code QR Actif";
      if (status.includes("7 100") || status.includes("activation")) return 3;
      if (isActive) return 4;
      if (status.includes("500")) return 5;
      return 3;
    }
    const s = qrData.status || '';
    if (s.includes("310")) return 2;
    if (s.includes("7 100")) return 3;
    const isActive = s === "Code QR Actif";
    if (isActive) return 4;
    if (s.includes("500")) return 5;
    return 1;
  };

  // Set initial query on mount
  useEffect(() => {
    if (initialQuery) {
      setQueryInput(initialQuery);
    }
  }, [initialQuery]);

  // Hook to handle external auto pinnings (e.g. from Site page)
  useEffect(() => {
    const handleAutoPinEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const profileData = customEvent.detail?.profile;
      if (profileData) {
        console.log("Auto-pinning profile requested:", profileData.name);
        // We match by id to make sure we pass the fully populated database object to handleRetrieveProfile
        const exactDBMatch = inscriptionsFromDB.find(x => x.id === profileData.id);
        if (exactDBMatch) {
          handleRetrieveProfile(exactDBMatch);
        } else {
          handleRetrieveProfile(profileData);
        }
      }
    };
    
    window.addEventListener('auto-pin-profile', handleAutoPinEvent);
    return () => window.removeEventListener('auto-pin-profile', handleAutoPinEvent);
  }, [inscriptionsFromDB]);

  // Run automatic search or reactive update on db change or query change
  useEffect(() => {
    executeDatabaseSearch(queryInput.trim());
  }, [inscriptionsFromDB, queryInput]);

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
    const normalizedTerm = term.toLowerCase().trim();

    // Search exclusively in Firestore Inscriptions
    const matches: InscriptionResult[] = inscriptionsFromDB
      .filter((item: any) => {
        // Exclude disabled inscriptions
        if (item.isActive === false) return false;

        // Check online and expiration
        const isOnline = item.isOnline === true;
        const onlineEnd = item.onlineEnd;
        const isExpired = onlineEnd ? Date.now() > onlineEnd : false;

        if (!isOnline || isExpired) return false;

        // If a term is provided, filter based on fields
        if (normalizedTerm) {
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
            item.skillsDescription,
            item.description
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return textToSearch.includes(normalizedTerm);
        }

        // If search term is empty, let's keep all active items
        return true;
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
        } else if (item.profileType === 'Entreprise') {
          titleOrActivity = item.companyName || 'Entreprise';
        }

        return {
          ...item,
          id: item.id || Math.random().toString(),
          name: item.name || item.agencyName || item.companyName || 'Prestataire',
          city: item.city || item.agencyCity || item.companyCity || item.equipmentCity || 'Non spécifié',
          profileType: (item.profileType === 'Agence immobilière' ? 'Agence' : item.profileType) || 'Travailleur',
          titleOrActivity,
          description: item.skillsDescription || item.equipmentDescription || item.companyServices || item.description || '',
          imageLink: item.imageLink || '',
          // Include new custom fields for cards
          images: item.onlineImages || item.images || [],
          desiredSalary: item.desiredSalary || '',
          salaryPeriod: item.salaryPeriod || '',
          propertyTypes: item.propertyTypes || '',
          equipmentsAvailable: item.equipmentsAvailable || '',
          equipmentCategory: item.equipmentCategory || '',
          companyDomain: item.companyDomain || '',
          companyServices: item.companyServices || ''
        };
      });

    setResults(matches);
  };

  const handleOpenOnlineForm = () => {
    const currentStep = getQRActivationStep();
    if (currentStep < 3) {
      setShowQRBlockedModal(true);
      return;
    }

    if (currentUserAd?.onlinePending === true) {
      alert("Votre demande de mise en ligne est actuellement en attente de validation par l'administrateur. Vous ne pouvez pas la modifier pour le moment.");
      return;
    }

    const profileType = currentUserAd?.profileType || (user?.role === 'Agence immobilière' ? 'Agence' : user?.role) || 'Travailleur';
    const cleanProfileType = (profileType === 'Clients' || profileType === 'Client') ? 'Travailleur' : profileType;
    setFormProfileType(cleanProfileType);
    
    setFormName(currentUserAd?.name || user?.name || '');
    setFormCity(currentUserAd?.city || user?.city || '');
    setFormDesc(currentUserAd?.skillsDescription || currentUserAd?.description || '');

    setFormJob(currentUserAd?.job || '');
    setFormSalary(currentUserAd?.desiredSalary || '');
    setFormSalaryPeriod(currentUserAd?.salaryPeriod || 'Par mois');

    setFormAgencyName(currentUserAd?.agencyName || currentUserAd?.name || user?.name || '');
    setFormPropertyTypes(currentUserAd?.propertyTypes || []);

    setFormOwnerName(currentUserAd?.ownerName || currentUserAd?.name || user?.name || '');
    setFormEquipCount(currentUserAd?.equipmentsAvailable || 1);
    setFormEquipCategory(currentUserAd?.equipmentCategory || '');

    setFormCompanyName(currentUserAd?.companyName || currentUserAd?.name || user?.name || '');
    setFormCompanyDomain(currentUserAd?.companyDomain || '');
    setFormCompanyServices(currentUserAd?.companyServices || '');
    setFormCompanyOwner(currentUserAd?.companyOwner || '');
    setFormCompanyPoste(currentUserAd?.companyPoste || currentUserAd?.companyDomain || '');
    setFormCompanyWorkersCount(currentUserAd?.companyWorkersCount || '');
    setFormCompanyContractType(currentUserAd?.companyContractType || '');
    setFormCompanySalary(currentUserAd?.companySalary || currentUserAd?.proposedSalary || '');
    setFormCompanyHours(currentUserAd?.companyHours || '');
    setFormCompanySkills(currentUserAd?.companySkills || currentUserAd?.companyServices || currentUserAd?.skillsDescription || '');

    setFormImages(currentUserAd?.onlineImages || []);

    setIsPaying(false);
    setPaymentStep('method');
    setPhoneNumberForPayment((user?.phone || '').replace(/\D/g, ''));

    setIsOnlineFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const count = files.length;
    if (count + formImages.length > 4) {
      alert("Vous pouvez sélectionner un maximum de 4 images.");
      return;
    }

    const compressedImages: string[] = [];
    for (const file of Array.from(files) as File[]) {
      try {
        const compressed = await imageService.compressImage(file, 800, 0.75);
        compressedImages.push(compressed);
      } catch (err) {
        console.error("Compression error for file:", file.name, err);
        const fallback = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        compressedImages.push(fallback);
      }
    }
    setFormImages(prev => [...prev, ...compressedImages].slice(0, 4));
  };

  const removeFormImage = (indexToRemove: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOnlineFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.phone) {
      alert("Erreur de session: Impossible de soumettre le formulaire car votre numéro de téléphone n'est pas détecté. Veuillez vous reconnecter.");
      return;
    }
    
    if (formProfileType === 'Travailleur') {
      if (!formName.trim() || !formCity.trim() || !formJob.trim() || !formDesc.trim() || !formSalary.trim()) {
        alert("Veuillez remplir tous les champs obligatoires (*) pour votre profil de Travailleur.");
        return;
      }
    } else if (formProfileType === 'Agence') {
      if (!formAgencyName.trim() || !formCity.trim() || !formDesc.trim()) {
        alert("Veuillez remplir tous les champs obligatoires (*) pour votre agence.");
        return;
      }
    } else if (formProfileType === 'Propriétaire') {
      if (!formOwnerName.trim() || !formCity.trim() || !formDesc.trim() || !formEquipCategory.trim()) {
        alert("Veuillez remplir tous les champs obligatoires (*) pour vos équipements.");
        return;
      }
    } else if (formProfileType === 'Entreprise') {
      if (
        !formCompanyName.trim() || 
        !formCity.trim() || 
        !formCompanyOwner.trim() || 
        !formCompanyPoste.trim() || 
        !formCompanyWorkersCount.toString().trim() || 
        !formCompanyContractType.trim() || 
        !formCompanySalary.trim() || 
        !formCompanyHours.trim() || 
        !formCompanySkills.trim()
      ) {
        alert("Veuillez remplir tous les champs obligatoires (*) pour l'entreprise.");
        return;
      }
    }

    if (formProfileType !== 'Travailleur' && formImages.length < 2) {
      alert("Vous devez sélectionner au moins 2 images pour une annonce professionnelle.");
      return;
    }

    setIsUploadingImages(true);
    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await Promise.all(
        formImages.map(img => databaseService.uploadImageOrFallback(user?.phone || '', img))
      );
    } catch (uploadErr) {
      console.error("Failed to upload/convert images to URLs:", uploadErr);
      alert("Erreur lors de la conversion et de la préparation de vos images. Veuillez réessayer.");
      setIsUploadingImages(false);
      return;
    }

    const isCurrentlyActive = currentUserAd?.isOnline === true && currentUserAd?.onlineEnd && Date.now() <= currentUserAd.onlineEnd;

    const adData: any = {
      profileType: formProfileType,
      city: formCity,
      skillsDescription: formProfileType === 'Entreprise' ? formCompanySkills : formDesc,
      onlineImages: uploadedUrls,
    };

    if (formProfileType === 'Travailleur') {
      adData.name = formName;
      adData.job = formJob;
      adData.desiredSalary = formSalary;
      adData.salaryPeriod = formSalaryPeriod;
    } else if (formProfileType === 'Agence') {
      adData.name = formAgencyName;
      adData.agencyName = formAgencyName;
      adData.propertyTypes = formPropertyTypes;
    } else if (formProfileType === 'Propriétaire') {
      adData.name = formOwnerName;
      adData.ownerName = formOwnerName;
      adData.equipmentsAvailable = formEquipCount;
      adData.equipmentCategory = formEquipCategory;
    } else if (formProfileType === 'Entreprise') {
      adData.name = formCompanyName;
      adData.companyName = formCompanyName;
      adData.companyOwner = formCompanyOwner;
      adData.companyPoste = formCompanyPoste;
      adData.companyWorkersCount = formCompanyWorkersCount;
      adData.companyContractType = formCompanyContractType;
      adData.companySalary = formCompanySalary;
      adData.companyHours = formCompanyHours;
      adData.companySkills = formCompanySkills;
      adData.companyDomain = formCompanyPoste;
      adData.companyServices = `${formCompanyWorkersCount} poste(s) • ${formCompanyContractType}`;
    }

    try {
      if (isCurrentlyActive) {
        const success = await databaseService.saveOnlineAnnouncementActiveModifications(user?.phone || '', adData);
        setIsUploadingImages(false);
        if (!success) {
          alert("Erreur de connexion avec Firestore. Veuillez réessayer.");
          return;
        }
        setIsOnlineFormOpen(false);
        alert("Votre annonce a été modifiée et enregistrée directement avec succès sans frais supplémentaires !");
        return;
      }

      // Default logic for new submission (Offline -> Pending standard, or Instant Wallet Debit)
      const onlinePrice = formDuration === '1_week' ? 200 : 350;
      adData.isOnline = false;
      adData.onlinePending = true;
      adData.onlineRefused = false;
      adData.onlineDuration = formDuration;
      adData.onlinePrice = onlinePrice;
      adData.timestamp = Date.now();

      const success = await databaseService.saveOnlineAnnouncementPending(user?.phone || '', adData);
      setIsUploadingImages(false);
      if (!success) {
        alert("Erreur de connexion avec Firestore. Veuillez réessayer.");
        return;
      }

      setIsOnlineFormOpen(false);

      // Trigger the standard system payment confirmation view
      window.dispatchEvent(new CustomEvent('trigger-payment-view', {
        detail: {
          title: `Mise en ligne d'annonce (${formDuration === '1_week' ? '1 Semaine' : '1 Mois'})`,
          amount: onlinePrice.toString(),
          paymentType: "Mise en ligne",
          waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${onlinePrice}`,
          onSuccess: (isAutoValidated?: boolean) => {
            if (isAutoValidated) {
              alert("Félicitations ! Votre paiement a été débité avec succès depuis votre portefeuille. Votre annonce est EN LIGNE immédiatement !");
            } else {
              alert("Paiement effectué ! Votre demande de mise en ligne est en statut 'En attente de validation' par l'administrateur.");
            }
          }
        }
      }));
    } catch (err) {
      setIsUploadingImages(false);
      console.error("Save online announcement execution fault:", err);
      alert("Une erreur s'est produite lors de l'enregistrement de l'annonce.");
    }
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
                <CityAutocompleteInput
                  id="agenceZone"
                  value={agenceZone}
                  onChange={(val) => {
                    setAgenceZone(val);
                    if (val.trim()) setFormErrors('');
                  }}
                  placeholder="Ex: Cocody Angré, Riviera..."
                  inputClassName="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
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
                  <CityAutocompleteInput
                    id="travailleurCity"
                    value={travailleurCity}
                    onChange={(val) => {
                      setTravailleurCity(val);
                      if (val.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: Abidjan, Cocody..."
                    inputClassName="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
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
                  <CityAutocompleteInput
                    id="equipCity"
                    value={equipCity}
                    onChange={(val) => {
                      setEquipCity(val);
                      if (val.trim()) setFormErrors('');
                    }}
                    placeholder="Ex: Abidjan, Cocody..."
                    inputClassName="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
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
        {(() => {
          // Compute geographic parameters for rendering
          const startCoordsInfo = userLocation || { x: 318, y: 175, lat: 5.3600, lng: -4.0083 };
          const destCoordsInfo = pinnedProfile ? getStableCoordinatesForCity(pinnedProfile.city) : null;
          const distanceBetweenKm = (pinnedProfile && destCoordsInfo) 
            ? calculateHaversineDistance(startCoordsInfo.lat, startCoordsInfo.lng, destCoordsInfo.lat, destCoordsInfo.lng)
            : 0;
          const formattedDistanceInfo = distanceBetweenKm < 1 
            ? `${(distanceBetweenKm * 1000).toFixed(0)} m` 
            : `${distanceBetweenKm.toFixed(1)} km`;

          // Control point for curvy quadratic path
          const curveControlY = destCoordsInfo ? Math.min(startCoordsInfo.y, destCoordsInfo.y) - 45 : 100;
          const curveMidX = destCoordsInfo ? (startCoordsInfo.x + destCoordsInfo.x) / 2 : 318;
          const curveMidY = destCoordsInfo ? (startCoordsInfo.y + destCoordsInfo.y) / 2 - 15 : 155;

          return (
            <div className="flex flex-col gap-4">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes loader-progress {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              `}} />

              {/* Live Interactive Geographic Navigation Map Container */}
              <div 
                id="dynamic-3d-locator-map"
                className="relative overflow-hidden -mx-5 -mt-6 w-[calc(100%+2.5rem)] h-[380px]"
              >
                <LeafletMap 
                  userLat={startCoordsInfo.lat}
                  userLng={startCoordsInfo.lng}
                  userName="Ma Position"
                  providerLat={destCoordsInfo ? destCoordsInfo.lat : null}
                  providerLng={destCoordsInfo ? destCoordsInfo.lng : null}
                  providerName={pinnedProfile ? pinnedProfile.name : undefined}
                  providerCity={pinnedProfile ? pinnedProfile.city : undefined}
                  isSearching={isSearchingVille}
                />

                {/* Itinéraire GPS Floating Trigger Button overlayed over Map */}
                {pinnedProfile && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openGoogleMapsRoute();
                    }}
                    className="absolute bottom-4 left-4 z-[400] flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 px-3.5 py-2.5 rounded-2xl border border-orange-400 text-[10px] font-black uppercase tracking-wider text-white shadow-xl transition-all font-sans cursor-pointer hover:shadow-orange-500/20"
                    title="Ouvrir l'itinéraire Google Maps"
                  >
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Itinéraire GPS ↗</span>
                  </button>
                )}
              </div>

              {/* Informative Dashboard HUD sheet below Map */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm relative z-10 w-full" onClick={(e) => e.stopPropagation()}>
                {/* 1. Searching/Locating City State */}
                {isSearchingVille && !pinnedProfile && (
                  <div className="bg-transparent p-1 flex flex-col items-center justify-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#2dadac] animate-pulse">Recherche automatique de la ville...</span>
                    </div>
                    <p className="text-xs font-bold font-sans text-center text-slate-700">
                      Ciblage GPS : <span className="text-[#f25c34] font-black">{searchingCityName.toUpperCase()}</span>
                    </p>
                    <div className="w-1/2 bg-slate-200 h-1 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 bg-[#f25c34] h-full rounded-full" style={{ animation: 'loader-progress 2.8s linear' }} />
                    </div>
                  </div>
                )}

                {/* 2. Pinned Profile details */}
                {pinnedProfile && (
                  <div className="bg-transparent transition-all duration-300 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300 py-1" id="pinned-selected-profile">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Glowing Maps locator icon badge on the left - clickable to open Maps */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMapsRoute();
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 flex-shrink-0 relative transition-colors duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
                          isSearchingVille 
                            ? 'bg-orange-500/10 border-orange-400/80' 
                            : 'bg-emerald-500/10 border-emerald-400/80 hover:bg-emerald-50/15'
                        }`}
                        title="Voir trajet sur Google Maps"
                      >
                        <span className={`absolute inset-0 rounded-full animate-ping ${
                          isSearchingVille ? 'bg-orange-400/20' : 'bg-emerald-400/15'
                        }`} style={{ animationDuration: isSearchingVille ? '1s' : '3s' }}></span>
                        <MapPin className={`h-4.5 w-4.5 stroke-[2.5] transition-colors duration-300 ${
                          isSearchingVille 
                            ? 'text-orange-600' 
                            : 'text-emerald-600'
                        }`} />
                      </div>

                      {/* Information block with clean contrast text */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap leading-none">
                          <span className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">{pinnedProfile.name}</span>
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{pinnedProfile.profileType}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-600 block leading-none">{pinnedProfile.city}</span>
                          {!isSearchingVille && (
                            <span className="text-[9px] font-extrabold text-orange-600 bg-orange-600/10 px-1.5 py-0.5 rounded border border-orange-200/40 block leading-none">
                              {formattedDistanceInfo}
                            </span>
                          )}
                        </div>
                        
                        <div className="pt-1 leading-none">
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block leading-none">
                            {isSearchingVille ? 'CIBLAGE SATELLITE :' : 'ACTIVITÉ / TITRE :'}
                          </span>
                          <span className="text-[11px] text-slate-950 font-black block truncate leading-none mt-0.5 font-sans">
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
                          <div className="w-24 bg-slate-200 h-1 rounded-full overflow-hidden relative border border-slate-300/40">
                            <div className="absolute top-0 left-0 bg-[#f25c34] h-full rounded-full" style={{ animation: 'loader-progress 2.8s linear' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5 w-full">
                          <button
                            onClick={() => setShowActionOptions(pinnedProfile)}
                            className="bg-[#f06e30] hover:bg-[#e05d1f] active:scale-95 text-white py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-normal transition-all shadow-md flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-200 cursor-pointer w-full text-center"
                            id="pinned-submit-demande-btn"
                          >
                            <span>Cliquez ici pour soumettre votre demande</span>
                          </button>
                          <button 
                            onClick={() => setPinnedProfile(null)}
                            className="p-1 px-1.5 text-slate-500 hover:text-slate-800 rounded text-[9px] font-black uppercase transition-colors cursor-pointer"
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
                  <div className="bg-transparent flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-300 py-1">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1d706f] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Recherche Automatique de Profils</span>
                      </h4>
                      <p className="text-[10.5px] text-[#257371]/90 font-bold leading-relaxed max-w-lg">
                        Scanner et simulation de liaison satellite à travers la Côte d'Ivoire. Choisissez un prestataire dans les résultats pour cibler sa localisation et soumettre une demande.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Input area */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quel métier ou service cherchez-vous ?</label>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex. Vendeur, Cuisinier, Agence immobilière..."
                className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 focus:border-orange-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all font-sans shadow-sm"
                disabled={isLoading}
                id="search-query-input"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 p-2.5 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-xl transition-all shadow-md"
                disabled={isLoading || !queryInput.trim()}
                id="search-submit-btn"
              >
                <Search className="h-4 w-4 stroke-[3]" />
              </button>
            </div>

            {/* The brand-new "Se mettre en ligne" / "Remettre en ligne" controls button */}
            <button
              onClick={handleOpenOnlineForm}
              className={`py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 ${
                currentUserAd?.onlinePending === true
                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                  : currentUserAd?.isOnline === true && currentUserAd?.onlineEnd && Date.now() <= currentUserAd.onlineEnd
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {currentUserAd?.onlinePending === true ? (
                <>
                  <span className="w-2.5 h-2.5 bg-white rounded-full shrink-0 animate-ping" />
                  <span>🟡 En attente de validation</span>
                </>
              ) : currentUserAd?.isOnline === true && currentUserAd?.onlineEnd && Date.now() <= currentUserAd.onlineEnd ? (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                  <span>🟢 En ligne - Modifier</span>
                </>
              ) : currentUserAd?.onlineEnd && Date.now() > currentUserAd.onlineEnd ? (
                <>
                  <span className="w-2.5 h-2.5 bg-white rounded-full shrink-0 animate-pulse" />
                  <span>🔴 Remettre en ligne</span>
                </>
              ) : currentUserAd?.onlineRefused === true ? (
                <>
                  <span className="w-2.5 h-2.5 bg-white rounded-full shrink-0" />
                  <span>🔴 Refusé / Recommencer</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-white rounded-full shrink-0" />
                  <span>🔴 Hors ligne - Se mettre en ligne</span>
                </>
              )}
            </button>
          </div>

          {/* Pending or Refused status announcements */}
          {currentUserAd?.onlinePending === true && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 font-bold text-xs space-y-1 mt-3 animate-in fade-in duration-300">
              <p className="font-extrabold uppercase tracking-wide">⏳ En attente de validation</p>
              <p className="text-amber-700/90 font-medium">Votre demande d'inscription et de mise en ligne est en attente de validation par l'administrateur. Votre preuve de dépôt/paiement est en cours de vérification. L'annonce sera publiée automatiquement dès validation. Merci de patienter.</p>
            </div>
          )}

          {currentUserAd?.onlineRefused === true && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 font-bold text-xs space-y-1 mt-3 animate-in fade-in duration-300">
              <p className="font-extrabold uppercase tracking-wide">⚠️ Validation refusée ou paiement rejeté</p>
              <p className="text-rose-700/90 font-medium">Votre demande de publication en ligne a été refusée par l'administrateur ou la transaction n'est pas confirmée. Vous pouvez recliquer sur le bouton ci-dessus pour soumettre à nouveau une demande claire.</p>
            </div>
          )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {results.map((item) => {
                  const cardImages = item.images && item.images.length > 0
                    ? item.images
                    : [item.imageLink || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"];

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex flex-col h-full cursor-pointer"
                      id={`display-card-${item.id}`}
                      onClick={() => {
                        setSelectedAdDetail(item);
                        setActiveImageIndex(0);
                        setIsSaved(false);
                      }}
                    >
                      {/* Swipe & Auto-fade horizontal image gallery */}
                      <div className="relative w-full h-52 bg-slate-50 overflow-hidden shrink-0 group">
                        <CardImageCarousel
                          images={cardImages}
                          onImageClick={() => {
                            setSelectedAdDetail(item);
                            setActiveImageIndex(0);
                            setIsSaved(false);
                          }}
                        />

                        <span className="absolute top-3 left-3 bg-[#ff4500] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm z-20">
                          {item.profileType}
                        </span>
                      </div>

                      {/* Info & Text Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2.5">
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#2dadac] block mb-0.5 truncate">
                                {item.titleOrActivity}
                              </span>
                              <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight uppercase truncate">
                                {item.name}
                              </h3>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full shrink-0">
                              <MapPin className="h-3.5 w-3.5 text-[#ff00ff] fill-[#ff00ff]/10" />
                              <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{item.city}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                            {item.description || "Aucune description fournie par le prestataire."}
                          </p>
                        </div>

                        {/* Complementary data */}
                        <div className="py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col gap-1 text-[10px] text-slate-600 font-bold shrink-0">
                          <span className="font-extrabold text-[#2dadac] uppercase tracking-wider text-[9px] mb-1">
                            Informations complémentaires :
                          </span>

                          {item.profileType === 'Travailleur' && (
                            <div className="flex justify-between items-center font-bold">
                              <span>Salaire souhaité :</span>
                              <span className="font-black text-slate-900 uppercase text-right max-w-[150px] truncate items-center">
                                {item.desiredSalary ? `${item.desiredSalary} FCFA / ${item.salaryPeriod === 'Par semaine' ? 'Semaine' : 'Mois'}` : 'Non spécifié'}
                              </span>
                            </div>
                          )}

                          {item.profileType === 'Agence' && (
                            <div className="flex justify-between items-start font-bold">
                              <span>Biens proposés :</span>
                              <span className="font-black text-slate-900 text-right max-w-[150px] truncate uppercase">
                                {item.propertyTypes ? (Array.isArray(item.propertyTypes) ? item.propertyTypes.join(', ') : item.propertyTypes) : 'Tous types'}
                              </span>
                            </div>
                          )}

                          {item.profileType === 'Propriétaire' && (
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center font-bold">
                                <span>Matériels d'équipements :</span>
                                <span className="font-black text-slate-900 uppercase">
                                  {item.equipmentCategory || 'Général'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center font-bold">
                                <span>Disponibles :</span>
                                <span className="font-black text-slate-900 uppercase">
                                  {item.equipmentsAvailable || '1'} unité(s)
                                </span>
                              </div>
                            </div>
                          )}

                          {item.profileType === 'Entreprise' && (
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center font-bold">
                                <span>Domaine principal :</span>
                                <span className="font-black text-slate-900 uppercase truncate max-w-[160px]">
                                  {item.companyDomain || 'Général'}
                                </span>
                              </div>
                              <div className="flex justify-between items-start font-bold">
                                <span>Services :</span>
                                <span className="font-black text-slate-900 text-right uppercase truncate max-w-[150px]">
                                  {item.companyServices || 'Inconnu'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom action button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetrieveProfile(item);
                          }}
                          disabled={isLinking || retrievingProfileId !== null}
                          className="w-full bg-[#ff4500] hover:bg-[#e03a00] disabled:bg-slate-300 text-white py-3.5 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 duration-200 cursor-pointer"
                        >
                          {retrievingProfileId === item.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span>RÉCUPÉRATION...</span>
                            </>
                          ) : (
                            <span>DEMANDE DE SERVICE</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX FOR ZOOMED IMAGE */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
          id="image-lightbox-overlay"
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95"
            id="image-lightbox-close"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoom produit" 
            className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border-2 border-white/10 animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* ONLINE FORM MODAL */}
      {isOnlineFormOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          id="online-form-overlay"
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-100 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            id="online-form-modal"
          >
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="space-y-1.5">
                <span className="bg-[#2dadac]/10 text-[#2dadac] text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                  Mise en ligne d'annonce
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight font-sans">
                  Détails de votre annonce
                </h3>
              </div>
              <button 
                onClick={() => setIsOnlineFormOpen(false)}
                className="p-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-full transition-all duration-200 active:scale-95 shadow-sm"
                id="online-form-close-btn"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body & Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Form Inputs Screen */}
              <form onSubmit={handleOnlineFormSubmit} className="space-y-6" id="online-form-details">
                  {/* Prefilled Profile Type selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type de profil</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['Travailleur', 'Propriétaire', 'Agence', 'Entreprise'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormProfileType(type)}
                          className={`py-3 px-2 text-center rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all border active:scale-95 ${
                            formProfileType === type
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                          }`}
                        >
                          {type === 'Propriétaire' ? 'Équipements' : type === 'Agence' ? 'Immobilier' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* General inputs (Prefilled, but editable) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dynamic Name Input Label */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        {formProfileType === 'Travailleur'
                          ? 'Nom complet *'
                          : formProfileType === 'Agence'
                            ? "Nom de l'agence *"
                            : formProfileType === 'Propriétaire'
                              ? "Nom du propriétaire d'équipements *"
                              : "Nom de l'entreprise *"}
                      </label>
                      <input
                        type="text"
                        value={
                          formProfileType === 'Travailleur'
                            ? formName
                            : formProfileType === 'Agence'
                              ? formAgencyName
                              : formProfileType === 'Propriétaire'
                                ? formOwnerName
                                : formCompanyName
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (formProfileType === 'Travailleur') setFormName(val);
                          else if (formProfileType === 'Agence') setFormAgencyName(val);
                          else if (formProfileType === 'Propriétaire') setFormOwnerName(val);
                          else if (formProfileType === 'Entreprise') setFormCompanyName(val);
                        }}
                        placeholder="Ex. Cabinet Mael, Kouadio Jean..."
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                        required
                      />
                    </div>

                    {/* Zone d'activité (Ville) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ville ou zone d'activité *</label>
                      <CityAutocompleteInput
                        id="formCity"
                        value={formCity}
                        onChange={(val) => setFormCity(val)}
                        placeholder="Ex. Abidjan, Cocody, Bouaké..."
                        inputClassName="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Specialized Inputs block according to profile */}
                  {formProfileType === 'Travailleur' && (
                    <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Spécialité / Métier *</label>
                        <input
                          type="text"
                          value={formJob}
                          onChange={(e) => setFormJob(e.target.value)}
                          placeholder="Ex. Électricien, Menuisier, Cuisinier..."
                          className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Salaire souhaité (FCFA) *</label>
                          <input
                            type="text"
                            value={formSalary}
                            onChange={(e) => setFormSalary(e.target.value.replace(/\D/g, ''))}
                            placeholder="Ex. 150000"
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Période de salaire *</label>
                          <select
                            value={formSalaryPeriod}
                            onChange={(e: any) => setFormSalaryPeriod(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold focus:outline-none transition-all font-sans appearance-none cursor-pointer"
                          >
                            <option value="Par mois">Par mois</option>
                            <option value="Par semaine">Par semaine</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formProfileType === 'Agence' && (
                    <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-700 ml-1">Catégories de biens immobiliers proposés</label>
                        <div className="flex flex-wrap gap-2">
                          {["Terrain", "Appartement", "Résidence", "Bureau", "Commerce", "Véhicule", "Autre"].map((cat) => {
                            const isSelected = formPropertyTypes.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormPropertyTypes(prev => prev.filter(c => c !== cat));
                                  } else {
                                    setFormPropertyTypes(prev => [...prev, cat]);
                                  }
                                }}
                                className={`py-2 px-4 rounded-full text-xs font-bold transition-all border active:scale-95 ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {formProfileType === 'Propriétaire' && (
                    <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#ff4500] ml-1">Nom / Catégories d'équipements *</label>
                          <input
                            type="text"
                            value={formEquipCategory}
                            onChange={(e) => setFormEquipCategory(e.target.value)}
                            placeholder="Ex. Mini-pelle, Camion Citerne..."
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#ff4500] ml-1">Nombre d'équipements disponibles *</label>
                          <input
                            type="number"
                            min="1"
                            value={formEquipCount}
                            onChange={(e) => setFormEquipCount(parseInt(e.target.value) || 1)}
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold focus:outline-none transition-all font-sans"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formProfileType === 'Entreprise' && (
                    <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Nom du responsable ou propriétaire *</label>
                        <input
                          type="text"
                          value={formCompanyOwner}
                          onChange={(e) => setFormCompanyOwner(e.target.value)}
                          placeholder="Ex. Kouadio Jean"
                          className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Poste recherché *</label>
                          <input
                            type="text"
                            value={formCompanyPoste}
                            onChange={(e) => setFormCompanyPoste(e.target.value)}
                            placeholder="Ex. Serveur, Cuisinier, Chauffeur..."
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Nombre de travailleurs recherchés *</label>
                          <input
                            type="number"
                            min="1"
                            value={formCompanyWorkersCount}
                            onChange={(e) => setFormCompanyWorkersCount(e.target.value)}
                            placeholder="Ex. 3"
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Type de contrat *</label>
                          <select
                            value={formCompanyContractType}
                            onChange={(e) => setFormCompanyContractType(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold focus:outline-none transition-all font-sans cursor-pointer"
                            required
                          >
                            <option value="">Sélectionner un contrat</option>
                            <option value="Temps plein">Temps plein</option>
                            <option value="Temps partiel">Temps partiel</option>
                            <option value="Temporaire">Temporaire</option>
                            <option value="Stage">Stage</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Salaire proposé *</label>
                          <input
                            type="text"
                            value={formCompanySalary}
                            onChange={(e) => setFormCompanySalary(e.target.value)}
                            placeholder="Ex. 150000 FCFA"
                            className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Horaires de travail *</label>
                        <input
                          type="text"
                          value={formCompanyHours}
                          onChange={(e) => setFormCompanyHours(e.target.value)}
                          placeholder="Ex. 8H00 - 17H00, Lun au Ven"
                          className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#2dadac] ml-1">Compétences recherchées *</label>
                        <textarea
                          value={formCompanySkills}
                          onChange={(e) => setFormCompanySkills(e.target.value)}
                          placeholder="Précisez les compétences et qualités recherchées..."
                          className="w-full px-5 py-4 min-h-[90px] bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans resize-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Description field */}
                  {formProfileType !== 'Entreprise' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description de vos services / compétences *</label>
                      <textarea
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Décrivez précisément ce que vous proposez pour attirer vos clients..."
                        className="w-full px-5 py-4 min-h-[100px] bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-black text-sm font-bold placeholder-slate-400 focus:outline-none transition-all font-sans resize-none"
                        required
                      />
                    </div>
                  )}

                  {/* Duration selector */}
                  {!(currentUserAd?.isOnline === true && currentUserAd?.onlineEnd && Date.now() <= currentUserAd.onlineEnd) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Durée de mise en ligne souhaitée</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormDuration('1_week')}
                          className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between active:scale-95 ${
                            formDuration === '1_week'
                              ? 'border-orange-500 bg-orange-50/10'
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <span className="text-xs font-black uppercase text-slate-800">1 SEMAINE</span>
                          <span className="text-sm font-black text-orange-600">200 FCFA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormDuration('1_month')}
                          className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between active:scale-95 ${
                            formDuration === '1_month'
                              ? 'border-orange-500 bg-orange-50/10'
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <span className="text-xs font-black uppercase text-slate-800">1 MOIS</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-orange-600">350 FCFA</span>
                            <span className="bg-orange-100 text-orange-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">-50% économie</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attachment Images Section */}
                  <div className="space-y-3 p-5 bg-slate-50/60 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Galerie photo de l'annonce</label>
                        <span className="text-[8px] text-slate-400 font-bold block">
                          Sélectionnez de 1 à 4 images de votre téléphone. (Converties en base64 pour affichage immédiat)
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full block shrink-0 select-none uppercase">
                        {formImages.length} SUR 4
                      </span>
                    </div>

                    {/* Previews Grid */}
                    {formImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {formImages.map((b64, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200/50 bg-slate-100 group animate-in zoom-in-95">
                            <img src={b64} alt={`Upload ${idx}`} className="w-full h-full object-cover animate-fade-in" />
                            <button
                              type="button"
                              onClick={() => removeFormImage(idx)}
                              className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-150 active:scale-90 shadow-md"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload trigger button */}
                    {formImages.length < 4 && (
                      <label className="w-full flex flex-col items-center justify-center p-5 bg-white border border-dashed border-slate-300 rounded-2xl hover:border-orange-500 transition-all cursor-pointer select-none group active:scale-[0.99] shadow-sm">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Camera className="h-6 w-6 text-slate-400 group-hover:text-orange-500 transition-colors duration-150 mb-1" />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-orange-600">Ajouter des photos</span>
                      </label>
                    )}

                    {/* Pro profile helper banner */}
                    {formProfileType !== 'Travailleur' && (
                      <div className="flex items-center gap-2 text-[9px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100 font-bold animate-in fade-in duration-200">
                        <AlertCircle className="h-4 w-4 stroke-[2.5] text-amber-600 shrink-0 animate-pulse" />
                        <span>⚠️ Les annonces de types professionnels (Agences, Équipements, Entreprises) requièrent un minimum de 2 images.</span>
                      </div>
                    )}
                  </div>

                  {/* Submission and close buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      disabled={isUploadingImages}
                      onClick={() => setIsOnlineFormOpen(false)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-black uppercase text-xs tracking-wider rounded-2xl transition-all active:scale-95 border border-slate-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingImages}
                      className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 active:scale-95 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isUploadingImages ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Envoi des images...</span>
                        </>
                      ) : (
                        <span>
                          {currentUserAd?.isOnline === true && currentUserAd?.onlineEnd && Date.now() <= currentUserAd.onlineEnd
                            ? "Enregistrer"
                            : "Aller au paiement"}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {showQRBlockedModal && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          id="qr-blocked-modal"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-200">
              <span className="text-2xl">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-sans">
                Activation requise
              </h3>
              <p className="text-sm font-bold text-slate-600 leading-relaxed font-sans mt-1">
                Veuillez terminer l'activation de votre code QR avant de continuer.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowQRBlockedModal(false);
                  onSelectTab(Tab.MyQRCode);
                }}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 animate-pulse"
                id="qr-redirect-btn"
              >
                <span>Ma carte QR</span>
              </button>
              
              <button
                onClick={() => setShowQRBlockedModal(false)}
                className="w-full py-3 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all"
                id="qr-close-btn"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
                <ChevronLeft className="w-6 h-6 stroke-[3.5] text-white -ml-0.5" />
              </button>
            </div>

            <div className="absolute top-4 right-4 z-[5010] flex items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsSaved(prev => !prev);
                }}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/75 active:scale-95 transition-all cursor-pointer border border-white/10"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedAdDetail.name,
                      text: selectedAdDetail.description || "",
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    try {
                      navigator.clipboard.writeText(window.location.href);
                    } catch (e) {
                      alert("Lien de l'annonce : " + window.location.href);
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
                          {selectedAdDetail.profileType}
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
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Localisation du prestataire</p>
                          <p className="text-xs font-black text-slate-800 uppercase truncate">{selectedAdDetail.city}, CÔTE D'IVOIRE</p>
                        </div>
                      </div>

                      {/* Description block */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Description des services</h3>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100/50 whitespace-pre-line">
                          {selectedAdDetail.description || selectedAdDetail.skillsDescription || selectedAdDetail.equipmentDescription || selectedAdDetail.companySkills || selectedAdDetail.companyServices || "Aucune description de service n'a été spécifiée."}
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
                            <span className="text-slate-500 font-bold">Statut du prestataire</span>
                            <span className="text-emerald-500 font-black uppercase flex items-center gap-1.5 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              DISPONIBLE EN LIGNE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Fixed/Sticky Bottom Floating Action Bar */}
            <div className="shrink-0 p-4 bg-white/95 border-t border-slate-100 backdrop-blur-md z-[5020] flex justify-center w-full pb-safe">
              <button
                type="button"
                onClick={() => {
                  setPinnedProfile(selectedAdDetail);
                  setSelectedItemForForm(selectedAdDetail);
                  setSelectedAdDetail(null);
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

      {/* Modern Popups/Modals for Actions and Reports */}
      {showActionOptions && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <div 
            onClick={() => setShowActionOptions(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          {/* Card Modal */}
          <div className="relative bg-white dark:bg-slate-950 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 ease-out duration-250 text-left">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1.5 text-center">
                <h3 className="font-sans font-black text-sm uppercase text-slate-900 dark:text-white tracking-tight leading-snug">{showActionOptions.name}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{showActionOptions.profileType} • {showActionOptions.city}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Choisissez l'action que vous souhaitez effectuer :</p>
              </div>

              {/* Options Stack */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    setSelectedItemForForm(showActionOptions);
                    setShowActionOptions(null);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Soumettre une demande de service
                </button>

                <button
                  onClick={() => {
                    setShowReportModal(showActionOptions);
                    setShowActionOptions(null);
                  }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 py-3.5 px-4 rounded-2xl font-black uppercase text-[11px] tracking-wider border border-red-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Signaler ce profil / cette annonce
                </button>

                <button
                  onClick={() => setShowActionOptions(null)}
                  className="w-full py-2 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer border-none bg-transparent"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
          <div 
            onClick={() => {
              if (!isSubmittingReport) setShowReportModal(null);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="relative bg-white dark:bg-slate-950 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 ease-out duration-250 text-left">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1.5 text-center">
                <h3 className="font-sans font-black text-sm uppercase text-slate-900 dark:text-white tracking-tight">Signaler un abus</h3>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{showReportModal.name}</p>
                <p className="text-xs text-slate-500 font-medium">Pourquoi souhaitez-vous signaler ce prestataire / cette annonce ?</p>
              </div>

              {/* Reasons list */}
              <div className="space-y-2 text-left pt-2">
                {[
                  "Faux profil / tentative d'arnaque",
                  "Prestataire introuvable ou injoignable",
                  "Comportement abusif / inapproprié",
                  "Tarif ou service mensonger",
                  "Autre problème"
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    type="button"
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                      reportReason === reason
                        ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
                        : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100/60'
                    }`}
                  >
                    <span>{reason}</span>
                    {reportReason === reason && (
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  disabled={!reportReason || isSubmittingReport}
                  onClick={async () => {
                    if (!reportReason) return;
                    setIsSubmittingReport(true);
                    try {
                      const success = await databaseService.saveSignalement(
                        user?.phone || 'Anonyme',
                        showReportModal,
                        reportReason
                      );
                      if (success) {
                        alert(`Signalement enregistré d'office ! Merci pour votre collaboration. Nos administrateurs vont examiner le profil de ${showReportModal.name} dans les plus brefs délais.`);
                      } else {
                        alert("Erreur lors de l'enregistrement de votre signalement. Veuillez réessayer.");
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsSubmittingReport(false);
                      setReportReason('');
                      setShowReportModal(null);
                    }
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 text-white border-none ${
                    !reportReason || isSubmittingReport
                      ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50'
                      : 'bg-red-600 hover:bg-red-700 active:scale-98 cursor-pointer'
                  }`}
                >
                  {isSubmittingReport ? 'Envoi...' : 'Soumettre le signalement'}
                </button>

                <button
                  disabled={isSubmittingReport}
                  onClick={() => {
                    setReportReason('');
                    setShowReportModal(null);
                  }}
                  className="w-full py-2 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer border-none bg-transparent"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
