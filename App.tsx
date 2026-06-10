import React, { useState, useCallback, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Tab, User } from './types';
import BottomNav from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import LoginScreen from './components/LoginScreen';
import WorkerListScreen from './components/WorkerListScreen';
import PaymentScreen from './components/PaymentScreen';
import WavePaymentScreen from './components/WavePaymentScreen';
import InteractiveModal from './components/InteractiveModal';
import GlobalPopup from './components/common/GlobalPopup';
import SplashScreen from './components/SplashScreen';
import FirstLaunchScreen from './components/FirstLaunchScreen';
import SmartRegistrationScreen from './components/SmartRegistrationScreen';
import OfferScreen from './components/OfferScreen';
import GlobalRippleEffect from './components/common/GlobalRippleEffect';
import NotificationsScreen from './components/NotificationsScreen';
import EmergencyFormScreen from './components/EmergencyFormScreen';
import ScannerOverlay, { extractQRInfo } from './components/ScannerOverlay';
import AssistantQRScreen from './components/AssistantQRScreen';
import MyQRCodeScreen from './components/MyQRCodeScreen';
import PaymentConfirmationScreen from './components/PaymentConfirmationScreen';
import ChatScreen from './components/ChatScreen';
import LocationScreen from './components/LocationScreen';
import InterventionShopScreen from './components/InterventionShopScreen';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import StageFormationHubScreen from './components/StageFormationHubScreen';
import { DemandeRechercheScreen } from './components/DemandeRechercheScreen';
import { motion, AnimatePresence } from 'motion/react';
import { isAdmin } from './utils/authUtils';
import { databaseService, SavedContact } from './services/databaseService';
import { messagingService } from './services/messagingService';
import app from './firebase';
import { getAnalytics } from "firebase/analytics";

import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Initialisation Analytics si supporté
if (typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics not supported in this environment");
  }
}

const maelUser: User = {
  name: 'Mael',
  city: 'Bassam',
  phone: '0705052632',
};

type InteractiveModalContext = {
  formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service' | 'stage' | 'formation' | 'simple_demande';
  title: string;
  imageUrl?: string | string[];
  isBlurredImage?: boolean;
  description?: string;
  price?: string;
};

interface PaymentConfirmationContext {
  title: string;
  amount: string;
  waveLink: string;
  paymentType: string;
  onSuccess?: () => void;
  formData?: {
    formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service' | 'stage' | 'formation' | 'simple_demande';
    formTitle: string;
    data: any;
    whatsappMessage: string;
  };
}

interface PopupState {
    show: boolean;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isConfirmLoading?: boolean;
}

const REGISTRATION_URLS: Record<string, string> = {};

const RestrictedNotification = ({ show, message }: { show: boolean, message: string }) => (
  <div className={`absolute top-4 left-4 right-4 z-[400] transition-all duration-500 ease-out transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
    <div className="bg-red-600 text-white px-4 py-4 rounded-xl shadow-2xl flex items-start gap-3 border-2 border-red-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="text-sm">
        <p className="font-bold text-base mb-1">Accès refusé</p>
        <p className="opacity-95 leading-relaxed">{message}</p>
      </div>
    </div>
  </div>
);

const GlobalModeLoading = ({ message }: { message: string }) => (
    <div className="absolute inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
        <div className="relative">
            <div className="w-24 h-24 border-4 border-orange-500/20 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="mt-8 text-2xl font-black text-slate-900 uppercase tracking-widest animate-pulse">Chargement</h2>
        <p className="mt-4 text-orange-600 font-bold text-sm max-w-xs">{message}</p>
        <div className="mt-12 flex gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);

interface NavigationPoint {
  activeTab: Tab;
  menuView: string;
  offerSubView: 'main' | 'shop';
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => databaseService.getActiveUser());
  const [isAuthChecking, setIsAuthChecking] = useState(() => !databaseService.getActiveUser());
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showSmartRegistration, setShowSmartRegistration] = useState(false);
  const [hasCompletedFirstLaunch, setHasCompletedFirstLaunch] = useState(() => {
      return localStorage.getItem('filant_has_selected_profile') === 'true';
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.Menu);
  const [showFullRegistration, setShowFullRegistration] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminForceAppView, setAdminForceAppView] = useState(false);
  const [menuView, setMenuView] = useState<'hub' | 'worker_list' | 'notifications' | 'emergency_form' | 'assistant_qr' | 'admin_dashboard' | 'location_hub' | 'location_map' | 'stage_formation_hub' | 'demande_recherche'>('hub');
  const [adminChatContext, setAdminChatContext] = useState<{ userId: string, userName: string, type: 'Privee' } | null>(null);
  const [offerSubView, setOfferSubView] = useState<'main' | 'shop'>('main');
  
  const [navHistory, setNavHistory] = useState<NavigationPoint[]>([]);

  // --- INITIAL CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
      const activeUser = databaseService.getActiveUser();
      if (activeUser) {
        setCurrentUser(activeUser);
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  const navigateTo = useCallback((updates: Partial<NavigationPoint>) => {
    const currentState: NavigationPoint = { activeTab, menuView, offerSubView };
    
    const willChange = 
      (updates.activeTab !== undefined && updates.activeTab !== activeTab) ||
      (updates.menuView !== undefined && updates.menuView !== menuView) ||
      (updates.offerSubView !== undefined && updates.offerSubView !== offerSubView);

    if (willChange) {
      setNavHistory(prev => [...prev, currentState]);
      if (updates.activeTab !== undefined) setActiveTab(updates.activeTab);
      if (updates.menuView !== undefined) setMenuView(updates.menuView as any);
      if (updates.offerSubView !== undefined) setOfferSubView(updates.offerSubView);
    }
  }, [activeTab, menuView, offerSubView]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showScannerGlobal, setShowScannerGlobal] = useState(false);
  const [paymentConfirmationContext, setPaymentConfirmationContext] = useState<PaymentConfirmationContext | null>(null);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('filant_darkMode');
    return savedMode ? JSON.parse(savedMode) : true;
  });

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [privateUnreadCount, setPrivateUnreadCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!isAdmin(currentUser)) {
      setUnreadChatCount(privateUnreadCount);
    }
  }, [privateUnreadCount, currentUser]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
        showPopup("Pour installer l'application sur Android :\n1. Appuyez sur les 3 points (⋮) en haut à droite du navigateur.\n2. Sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.", "alert");
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  const handleLogout = useCallback(() => {
    if (currentUser?.phone) {
      databaseService.logoutUser(currentUser.phone);
    }
    setIsProfileOpen(false);
    setCurrentUser(null);
    setShowSplash(false);
    localStorage.removeItem('filant_currentUserPhone');
    localStorage.removeItem('filant_user_role');
    localStorage.removeItem('filant_has_selected_profile');
    setNavHistory([]);
    setActiveTab(Tab.Menu);
    setMenuView('hub');
  }, [currentUser?.phone]);

  const showPopup = useCallback((
    message: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string
  ) => {
      setPopup({
          show: true,
          message,
          type,
          confirmLabel,
          cancelLabel,
          isConfirmLoading: false,
          onConfirm: () => {
              const close = () => setPopup(p => ({ ...p, show: false }));
              const setLoading = (l: boolean) => setPopup(p => ({ ...p, isConfirmLoading: l }));
              if (onConfirm) {
                  onConfirm(close, setLoading);
              } else {
                  close();
              }
          },
          onCancel: () => setPopup(prev => ({ ...prev, show: false }))
      });
  }, []);

  // Authentification anonyme pour Firestore
  useEffect(() => {
    let isMounted = true;

    const testConnection = async () => {
      try {
        // Test de connexion selon les directives
        // Use a simple getDoc with a timeout-like behavior (Promise.race)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        await Promise.race([
          getDoc(doc(db, 'test', 'connection')),
          timeoutPromise
        ]);
        
        console.log("Firestore connection test successful");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
        // On ignore les autres erreurs (ex: permission denied sur le doc de test) car c'est juste un test de connectivité
      }
    };

    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      try {
        if (user) {
          console.log("Auth state changed: User logged in", user.uid);
          setIsAuthReady(true);
          
          // Try to recover user data from Firestore using UID or stored phone
          const storedPhone = localStorage.getItem('filant_currentUserPhone');
          let userData: User | null = null;

          // Use a timeout for Firestore recovery to avoid hanging the app
          const recoverUser = async () => {
            if (storedPhone) {
              console.log("Attempting to recover user from phone:", storedPhone);
              userData = await databaseService.getUserByPhoneFromFirestore(storedPhone);
            }

            if (!userData) {
              console.log("Attempting to recover user from UID:", user.uid);
              userData = await databaseService.getUserByUidFromFirestore(user.uid);
            }
            
            // Fallback to local storage if Firestore recovery failed
            if (!userData) {
              console.log("Firestore recovery failed, falling back to local storage");
              userData = databaseService.getActiveUser();
              // If we have a local user, ensure it has the current UID
              if (userData) {
                userData.userId = user.uid;
              }
            }
          };

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Recovery Timeout')), 10000)
          );

          try {
            await Promise.race([recoverUser(), timeoutPromise]);
          } catch (e) {
            console.warn("User recovery timed out or failed:", e);
          }

          if (userData && isMounted) {
            // Logic to preserve valid name/city if the recovered data is partial
            const localUser = databaseService.getActiveUser();
            let fullUser = { ...userData, userId: user.uid };
            
            if (localUser && localUser.phone === fullUser.phone) {
                const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);
                if (!isValid(fullUser.name) && isValid(localUser.name)) fullUser.name = localUser.name;
                if (!isValid(fullUser.city) && isValid(localUser.city)) fullUser.city = localUser.city;
            }

            setCurrentUser(fullUser);
            if (isAdmin(fullUser)) {
              setIsAdminAuthenticated(true);
            }
            databaseService.saveActiveUser(fullUser);
            if (isAuthChecking) {
              setShowSplash(true);
            }
            localStorage.setItem('filant_currentUserPhone', userData.phone);
            
            // Safety check: Only sync if we have something meaningful to sync
            const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', ''].includes(val);
            if (isValid(fullUser.name) || isValid(fullUser.city)) {
              databaseService.syncUserToFirestore(fullUser);
              databaseService.logConnection(fullUser);
            } else {
              console.log("Skipping early sync for partial user data:", fullUser.phone);
              // Log connection anyway with what we have (phone is enough for presence)
              databaseService.logConnection(fullUser);
            }
          }
        } else {
          console.log("Auth state changed: No user");
          // If no user is authenticated, try to sign in anonymously if we have a stored phone
          const storedPhone = localStorage.getItem('filant_currentUserPhone');
          if (storedPhone && isMounted) {
            try {
              const { signInAnonymously } = await import('firebase/auth');
              await signInAnonymously(auth);
            } catch (e: any) {
              if (e.code === 'auth/admin-restricted-operation') {
                console.error("Anonymous authentication is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
              } else {
                console.error("Failed to sign in anonymously during recovery:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  
  // Firebase Messaging
  useEffect(() => {
    if (currentUser) {
      messagingService.requestPermission(currentUser);
      messagingService.onMessageListener(currentUser.phone);
    }
  }, [currentUser]);

// Real-time synchronization logic removed

  useEffect(() => {
    if (activeTab === Tab.UserChat && currentUser) {
      const sanitizedPhone = currentUser.phone.replace(/\D/g, '');
      databaseService.markAllNotificationsAsRead(sanitizedPhone).catch(e => console.error("Error marking notifications as read:", e));
    }
  }, [activeTab, currentUser]);

  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const [activeNotificationModal, setActiveNotificationModal] = useState<Notification | null>(null);
  const [activeNotificationStepIndex, setActiveNotificationStepIndex] = useState<number>(0);

  useEffect(() => {
    setActiveNotificationStepIndex(0);
  }, [activeNotificationModal?.id]);

  const [locationInitialTab, setLocationInitialTab] = useState<'appartement' | 'equipement'>('appartement');
  const [demandeRechercheInitialQuery, setDemandeRechercheInitialQuery] = useState<string>('');
  const [interactiveModalContext, setInteractiveModalContext] = useState<InteractiveModalContext | null>(null);
  const [shopCategory, setShopCategory] = useState<'intervention' | 'immobilier' | 'equipement' | 'travailleurs'>('intervention');

  const [showRestrictedToast, setShowRestrictedToast] = useState(false);
  const [restrictedMessage] = useState("");

  const [popup, setPopup] = useState<PopupState>({
      show: false,
      message: '',
      type: 'alert',
      onConfirm: () => {},
      onCancel: () => {}
  });

  const FULL_SCREEN_MENU_VIEWS = [
    'worker_list',
    'location_hub',
    'notifications',
    'assistant_qr',
    'emergency_form',
    'stage_formation_hub'
  ];

  const shouldShowAdminDashboard = isAdmin(currentUser) && !adminForceAppView && !adminChatContext;

  const isFullScreenView = shouldShowAdminDashboard ||
                           (activeTab === Tab.Menu && FULL_SCREEN_MENU_VIEWS.includes(menuView)) || 
                           (activeTab === Tab.Offer && offerSubView === 'shop') ||
                           activeTab === Tab.Emergency ||
                           activeTab === Tab.Admin ||
                           activeTab === Tab.UserChat;

  const displayUser: User = {
    name: currentUser?.name ? currentUser.name.charAt(0).toUpperCase() + currentUser.name.slice(1) : '',
    city: currentUser?.city ? currentUser.city.charAt(0).toUpperCase() + currentUser.city.slice(1) : '',
    phone: currentUser?.phone || '',
    role: 'Client',
  };

  const handleRestrictedAccess = useCallback(() => {
      // Logic removed as all features are now accessible to clients
  }, []);

  useEffect(() => {
    if (!currentUser?.phone || !isAuthReady) return;
    
    const unsubscribe = databaseService.onNotificationsUpdate(currentUser.phone, (notifications) => {
      const unread = notifications.filter(n => !n.isRead);
      setUnreadNotifCount(unread.length);
      
      if (unread.length > 0) {
        const latest = unread[0];
        if (latest.id !== lastNotificationId) {
          setLastNotificationId(latest.id);
          setActiveNotificationModal(latest);
        }
      }
    });
    
    return () => unsubscribe();
  }, [currentUser?.phone, isAuthReady, lastNotificationId]);

// Card data and role sync logic removed

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('filant_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
      const handlePaymentTrigger = (event: CustomEvent<PaymentConfirmationContext>) => {
          setPaymentConfirmationContext(event.detail);
      };

      window.addEventListener('trigger-payment-view' as any, handlePaymentTrigger as any);
      
      return () => {
          window.removeEventListener('trigger-payment-view' as any, handlePaymentTrigger as any);
      };
  }, []);

  const isUserAdmin = currentUser?.phone === '0705052632';

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    databaseService.saveActiveUser(user);
    
    // Redirect to admin dashboard if admin
    if (isAdmin(user)) {
      setAdminForceAppView(false);
      setIsAdminAuthenticated(true);
      setMenuView('admin_dashboard');
    }
    
    setShowSplash(true);
    localStorage.setItem('filant_currentUserPhone', user.phone);
  };

  // Écoute des messages non lus pour les badges
  useEffect(() => {
    if (currentUser?.phone && isAuthReady) {
      const sanitizedPhone = currentUser.phone.replace(/\D/g, '');
      const chatUserId = sanitizedPhone || currentUser.userId || currentUser.id || `${currentUser.name}_${sanitizedPhone}`;
      const isUserAdmin = isAdmin(currentUser);

      if (isUserAdmin) {
        return databaseService.onTotalUnreadAdminMessagesCount((count) => {
          setUnreadChatCount(count);
        });
      }

      // Counter for Private Messages (Tab 4)
      const unsubPrivate = databaseService.onUnreadPrivateMessagesCount(chatUserId, (count) => {
        setPrivateUnreadCount(count);
      });

      return () => {
        unsubPrivate();
      };
    }
  }, [currentUser?.phone, currentUser?.userId, currentUser?.id, currentUser?.name, isAuthReady]);

  const handleToggleProfile = () => {
    setIsProfileOpen(prev => !prev);
  };

  const backHandlerRef = useRef<(() => boolean) | null>(null);

  const handleBack = useCallback(() => {
    // 1. Check if a registered custom back handler intercepts
    if (backHandlerRef.current && backHandlerRef.current()) {
      return;
    }

    // 2. Clear overlays or popups (if any)
    if (interactiveModalContext) {
      setInteractiveModalContext(null);
      return;
    }

    if (paymentConfirmationContext) {
      setPaymentConfirmationContext(null);
      return;
    }

    if (showSmartRegistration) {
      setShowSmartRegistration(false);
      return;
    }

    if (showFullRegistration) {
      setShowFullRegistration(false);
      return;
    }

    if (adminChatContext) {
      setAdminChatContext(null);
      return;
    }

    if (isProfileOpen) {
      setIsProfileOpen(false);
      return;
    }

    if (showScannerGlobal) {
      setShowScannerGlobal(false);
      return;
    }

    // 3. Navigate back through history
    if (navHistory.length > 0) {
      const lastPoint = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setActiveTab(lastPoint.activeTab);
      setMenuView(lastPoint.menuView as any);
      setOfferSubView(lastPoint.offerSubView);
      return;
    }

    // 4. Default home state or exit
    if (activeTab === Tab.Menu && menuView === 'hub') {
      showPopup(
        "Voulez-vous quitter l’application ?",
        "confirm",
        (close) => {
          CapApp.exitApp();
          close();
        },
        "Oui",
        "Non"
      );
    } else {
      navigateTo({ activeTab: Tab.Menu, menuView: 'hub' });
    }
  }, [
    activeTab, 
    menuView, 
    isProfileOpen, 
    showScannerGlobal, 
    navHistory, 
    showPopup, 
    navigateTo,
    interactiveModalContext,
    paymentConfirmationContext,
    showSmartRegistration,
    showFullRegistration,
    adminChatContext
  ]);

  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      handleBack();
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [handleBack]);

  const handleTabChange = (tab: Tab) => {
    const role = displayUser.role;

    if (tab !== Tab.Menu && activeTab === Tab.Menu) {
        navigateTo({ activeTab: tab, menuView: 'hub' });
    } else if (tab === Tab.Offer) {
        navigateTo({ activeTab: tab, offerSubView: 'main' });
    } else {
        navigateTo({ activeTab: tab });
    }
  };

  const handleFirstLaunchComplete = () => {
    setHasCompletedFirstLaunch(true);
    localStorage.setItem('filant_has_selected_profile', 'true');
  };

  const handleSmartRegistrationComplete = () => {
    // This will be used from Site page now
  };

  const handleNavigateFromOffer = (view: 'worker_list' | 'location_hub') => {
      navigateTo({ activeTab: Tab.Menu, menuView: view });
  };

  const handleOpenSiteWorkers = useCallback(() => {
    setShopCategory('travailleurs');
    navigateTo({ activeTab: Tab.Offer, offerSubView: 'shop', menuView: 'hub' });
  }, []);

  const handleHomeNavigate = (view: any, category?: 'appartement' | 'equipement') => {
      if (view === 'location_hub' && category) {
          setLocationInitialTab(category);
      }
      setMenuView(view);
  };

  const isImageUrl = (url?: string): boolean => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    
    if (clean.startsWith('data:image/')) return true;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) return false;
    
    if (
      clean.includes('supaimg.com') ||
      clean.includes('picsum.photos') ||
      clean.includes('firebasestorage.googleapis.com') ||
      clean.includes('images.unsplash.com') ||
      clean.includes('imgur.com')
    ) {
      return true;
    }
    
    try {
      const urlPath = clean.split('?')[0];
      const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'];
      if (extensions.some(ext => urlPath.endsWith(ext))) {
         return true;
      }
    } catch (e) {}

    const imageRegex = /\.(jpg|jpeg|png|webp|gif|svg|bmp)(\?|#|$)/i;
    return imageRegex.test(clean);
  };

  const handleUniversalLink = (url?: string) => {
    if (!url) return;
    const clean = url.trim();
    const lower = clean.toLowerCase();

    // Check if it matches worker form
    if (lower.includes('worker_list') || lower.includes('travailleur') || lower === 'travailleurs') {
      setInteractiveModalContext({
        formType: 'personal_worker',
        title: "Demande de service Travailleur",
      });
    }
    // Check if equipment form
    else if (lower.includes('location_hub') || lower.includes('equipement') || lower === 'equipements') {
      setLocationInitialTab('equipement');
      setInteractiveModalContext({
        formType: 'personal_location',
        title: "Location d'Équipement"
      });
    }
    // Check if agency / apartment form
    else if (lower.includes('appartement') || lower.includes('agence') || lower.includes('immobilier') || lower === 'agences') {
      setLocationInitialTab('appartement');
      setInteractiveModalContext({
        formType: 'location',
        title: "Demande de Logement (Agence)"
      });
    }
    // Check if search / request page
    else if (lower.includes('recherche') || lower.includes('demande_recherche') || lower === 'recherche') {
      navigateTo({ activeTab: Tab.Menu, menuView: 'demande_recherche' });
    }
    // Check if simple request form
    else if (lower.includes('simple_demande') || lower.includes('demande') || lower === 'simple_demande') {
      setInteractiveModalContext({
        formType: 'simple_demande',
        title: "Formulaire de Demande"
      });
    }
    // Check if dynamic http target
    else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      window.open(clean, '_blank');
    }
    // General fallback as target page inside app
    else {
      navigateTo({ activeTab: Tab.Menu, menuView: clean as any });
    }
  };

  const handleNotificationButtonAction = (action: 'travailleurs' | 'equipements' | 'agences' | 'recherche' | 'simple_demande' | 'next', searchFilter?: string) => {
    switch (action) {
      case 'travailleurs':
        setInteractiveModalContext({
          formType: 'personal_worker',
          title: "Demande de service Travailleur",
        });
        break;
      case 'equipements':
        setLocationInitialTab('equipement');
        setInteractiveModalContext({
          formType: 'personal_location',
          title: "Location d'Équipement"
        });
        break;
      case 'agences':
        setLocationInitialTab('appartement');
        setInteractiveModalContext({
          formType: 'location',
          title: "Demande de Logement (Agence)"
        });
        break;
      case 'recherche':
        setDemandeRechercheInitialQuery(searchFilter || '');
        navigateTo({ activeTab: Tab.Menu, menuView: 'demande_recherche' });
        break;
      case 'simple_demande':
        setInteractiveModalContext({
          formType: 'simple_demande',
          title: "Formulaire de Demande"
        });
        break;
      case 'next':
        // Handled directly inside step navigation
        break;
      default:
        navigateTo({ activeTab: Tab.Menu, menuView: 'hub' });
        break;
    }
  };

  const handleScanResultGlobal = (data: string) => {
    setShowScannerGlobal(false);
    
    // Utilisation de la logique unifiée d'extraction
    const info = extractQRInfo(data);
    
    const sanitizePhone = (phone: string): string => {
        if (!phone) return '';
        let cleanPhone = phone.replace(/[\s-.]/g, '');
        if (cleanPhone.startsWith('+225')) cleanPhone = cleanPhone.slice(4);
        return cleanPhone;
    };

    if (info.name && currentUser) {
        const currentContacts = databaseService.getContacts(currentUser.phone);
        const newContact: SavedContact = {
            id: Date.now().toString(),
            title: info.title,
            name: info.name,
            phone: info.phone && info.phone !== 'N/A' ? sanitizePhone(info.phone) : 'N/A',
            city: info.city,
            review: info.details || info.city 
        };
        const updatedContacts = [...currentContacts, newContact];
        
        // Enregistrement individuel proactif pour garantir la persistence et visibilité admin
        databaseService.saveIndividualScan(currentUser, newContact);
        databaseService.saveContacts(currentUser.phone, updatedContacts, currentUser);
        
        // Envoi automatique d'un message de félicitations à l'utilisateur scanné
        databaseService.sendAutomatedCongratsMessageAfterScan(currentUser, info);

        showPopup("Information validée et intégrée dans l'Assistance QR !", "alert");
        
        // Redirection automatique vers l'Assistance QR
        navigateTo({ activeTab: Tab.Menu, menuView: 'assistant_qr' });
    } else {
        showPopup("Le format du code QR n'a pas pu être structuré automatiquement.", "alert");
    }
  };

  if (!hasCompletedFirstLaunch) {
      return (
        <GlobalRippleEffect>
          <div className="flex justify-center bg-white w-full h-full min-h-[100dvh]">
            <div className="w-full max-w-[480px] h-[100dvh] relative flex flex-col overflow-hidden bg-white shadow-2xl">
              <div className="flex-1 relative overflow-hidden">
                {!showSmartRegistration ? (
                  <FirstLaunchScreen onComplete={handleFirstLaunchComplete} />
                ) : (
                  <SmartRegistrationScreen 
                    onComplete={handleSmartRegistrationComplete} 
                    onBack={() => setShowSmartRegistration(false)} 
                  />
                )}
              </div>
            </div>
          </div>
        </GlobalRippleEffect>
      );
  }

  if (isAuthChecking) {
    return <GlobalModeLoading message="Vérification de votre session..." />;
  }

  if (!currentUser) {
    return (
        <GlobalRippleEffect>
          <div className="flex justify-center bg-white w-full h-full min-h-[100dvh]">
            <div className="w-full max-w-[480px] h-[100dvh] relative flex flex-col overflow-hidden bg-white shadow-2xl">
              <div className="flex-1 relative overflow-hidden">
                <LoginScreen onLoginSuccess={handleLogin} onShowPopup={showPopup} />
                {popup.show && (
                    <GlobalPopup 
                        message={popup.message} 
                        type={popup.type} 
                        onConfirm={popup.onConfirm} 
                        onCancel={popup.onCancel}
                        confirmLabel={popup.confirmLabel}
                        cancelLabel={popup.cancelLabel}
                        isConfirmLoading={popup.isConfirmLoading}
                    />
                )}
              </div>
            </div>
          </div>
        </GlobalRippleEffect>
    );
  }

  if (showSplash) {
      return (
          <div className="flex justify-center bg-white w-full h-full min-h-[100dvh]">
            <div className="w-full max-w-[480px] h-[100dvh] relative flex flex-col overflow-hidden bg-white shadow-2xl">
              <div className="flex-1 relative overflow-hidden">
                <SplashScreen 
                  userName={currentUser.name} 
                  onFinish={() => setShowSplash(false)} 
                />
              </div>
            </div>
          </div>
      );
  }

  let activeScreen: React.ReactNode;

  if (shouldShowAdminDashboard) {
    activeScreen = (
      <AdminDashboard 
        onBack={handleBack} 
        user={displayUser} 
        onOpenChat={(userId, userName, type) => {
          setIsAdminAuthenticated(true);
          setActiveTab(Tab.Admin);
          setAdminChatContext({ userId, userName, type });
        }}
        onSwitchToApp={() => setAdminForceAppView(true)}
      />
    );
  } else {
    switch (activeTab) {
    case Tab.Menu:
      switch (menuView) {
        case 'worker_list':
          activeScreen = <WorkerListScreen 
            onBack={handleBack} 
            user={displayUser}
            onScheduleService={(url, title) => {
                showPopup("Contact de l'assistance en cours...", "alert");
            }}
            onOpenSiteWorkers={handleOpenSiteWorkers}
            onOpenForm={(context) => setInteractiveModalContext(context)}
          />;
          break;
        case 'location_hub':
          activeScreen = <LocationScreen 
            onBack={handleBack} 
            user={displayUser}
            initialCategory={locationInitialTab}
            onPropose={(url, title) => {
                showPopup("Contact de l'agence en cours...", "alert");
            }}
            onOpenForm={(context) => setInteractiveModalContext(context)}
          />;
          break;
        case 'notifications':
          activeScreen = (
            <NotificationsScreen 
              onBack={handleBack} 
              user={displayUser} 
              onViewDetails={(notif) => {
                setActiveNotificationModal(notif);
              }}
              onNotificationAction={handleNotificationButtonAction}
              onUniversalLink={handleUniversalLink}
            />
          );
          break;
        case 'emergency_form':
          activeScreen = <EmergencyFormScreen onBack={handleBack} user={displayUser} />;
          break;
        case 'assistant_qr':
          activeScreen = <AssistantQRScreen onBack={handleBack} user={displayUser} onShowPopup={showPopup} />;
          break;
        case 'stage_formation_hub':
          activeScreen = <StageFormationHubScreen 
            onBack={handleBack} 
            user={displayUser} 
            onOpenForm={(context) => setInteractiveModalContext(context as any)} 
            onRegisterBackHandler={(handler) => backHandlerRef.current = handler}
          />;
          break;
        case 'demande_recherche':
          activeScreen = <DemandeRechercheScreen 
            onBack={handleBack} 
            user={displayUser} 
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setMenuView('hub');
            }}
            initialQuery={demandeRechercheInitialQuery}
          />;
          break;
        case 'admin_dashboard':
          activeScreen = (
            <AdminDashboard 
              onBack={handleBack} 
              user={displayUser} 
              onOpenChat={(userId, userName, type) => {
                setIsAdminAuthenticated(true);
                setActiveTab(Tab.Admin);
                setAdminChatContext({ userId, userName, type });
              }}
              onSwitchToApp={() => setAdminForceAppView(true)}
            />
          );
          break;
        case 'hub':
        default:
          activeScreen = <HomeScreen 
            onNavigate={handleHomeNavigate} 
            user={displayUser} 
            setActiveTab={handleTabChange}
            onOpenBuildingService={(item) => setInteractiveModalContext({ 
                formType: item.formType || 'rapid_building_service', 
                title: item.title, 
                imageUrl: item.img || item.profileImageUrl,
                description: item.description
            })}
            onRestrictedAccess={handleRestrictedAccess}
            onShowPopup={showPopup}
            unreadChatCount={unreadChatCount}
            unreadNotifCount={unreadNotifCount}
            deferredPrompt={deferredPrompt}
            onInstallPWA={handleInstallPWA}
          />;
          break;
      }
      break;
    case Tab.MyQRCode:
      activeScreen = <MyQRCodeScreen 
        user={displayUser!} 
        onBack={() => setActiveTab(Tab.Menu)} 
        onTriggerPayment={(context) => setPaymentConfirmationContext(context)}
        onStartRegistration={() => setShowFullRegistration(true)}
      />;
      break;
    case Tab.Offer:
        if (offerSubView === 'shop') {
            activeScreen = <InterventionShopScreen 
                category={shopCategory}
                user={displayUser}
                onBack={handleBack} 
                onOpenForm={(context) => setInteractiveModalContext(context)}
            />;
        } else {
            activeScreen = <OfferScreen 
                onNavigateToMenu={handleNavigateFromOffer} 
                setActiveTab={handleTabChange} 
                onOpenIntervention={() => {
                    setShopCategory('intervention');
                    navigateTo({ offerSubView: 'shop' });
                }}
                onOpenCategory={(category) => {
                    setShopCategory(category);
                    navigateTo({ offerSubView: 'shop' });
                }}
                onSelectItem={(item, type, img, isBlurred, desc, price) => setInteractiveModalContext({ 
                  formType: type, 
                  title: item, 
                  imageUrl: img,
                  isBlurredImage: isBlurred,
                  description: desc,
                  price: price
                })}
                user={currentUser}
            />;
        }
      break;
    case Tab.Payment:
      activeScreen = <PaymentScreen onBack={handleBack} />;
      break;
    case Tab.UserChat:
      activeScreen = (
        <ChatScreen 
          currentUser={currentUser || maelUser} 
          isAdmin={false}
          onBack={handleBack}
        />
      );
      break;
    case Tab.Admin:
      if (isAdminAuthenticated) {
        if (adminChatContext) {
          activeScreen = (
            <ChatScreen 
              currentUser={currentUser || maelUser} 
              targetUser={{ phone: adminChatContext.userId, name: adminChatContext.userName } as any}
              isAdmin={true}
              type={adminChatContext.type}
              onBack={() => setAdminChatContext(null)}
            />
          );
        } else {
          activeScreen = (
            <AdminDashboard 
              onBack={handleBack} 
              user={displayUser}
              onOpenChat={(userId, userName, type) => setAdminChatContext({ userId, userName, type })}
              onSwitchToApp={() => setAdminForceAppView(true)}
            />
          );
        }
      } else {
        activeScreen = (
          <AdminLogin 
            onSuccess={() => setIsAdminAuthenticated(true)} 
            onBack={() => setActiveTab(Tab.Menu)} 
          />
        );
      }
      break;
    default:
      activeScreen = <HomeScreen 
        onNavigate={handleHomeNavigate} 
        user={displayUser} 
        setActiveTab={handleTabChange}
        onOpenBuildingService={(item) => setInteractiveModalContext({ 
            formType: item.formType || 'rapid_building_service', 
            title: item.title, 
            imageUrl: item.img || item.profileImageUrl,
            description: item.description
        })}
        onRestrictedAccess={handleRestrictedAccess}
        onShowPopup={showPopup}
        unreadChatCount={unreadChatCount}
      />;
      break;
    }
  }

  const isAdminView = shouldShowAdminDashboard || (menuView === 'admin_dashboard' && activeTab === Tab.Menu) || (activeTab === Tab.Admin && isAdminAuthenticated);

  if (currentUser?.isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-tight">
          Accès Restreint
        </h2>
        <p className="text-gray-600 font-bold text-lg leading-relaxed max-w-xs">
          “Vous ne pouvez plus effectuer une demande. Veuillez patienter. Une demande d’agence va vous contacter.”
        </p>
        <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-xs">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FILANT°225 • SERVICE SÉCURITÉ</p>
        </div>
      </div>
    );
  }

  return (
    <GlobalRippleEffect>
      <div className="flex justify-center bg-white w-full min-h-[100dvh]">
        <div className={`w-full ${isAdminView ? 'admin-layout' : 'max-w-[480px]'} h-[100dvh] relative flex flex-col bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 shadow-2xl overflow-hidden`}>
          
          {/* App Content Area */}
          <div className="flex-1 relative flex flex-col overflow-hidden">
            <RestrictedNotification show={showRestrictedToast} message={restrictedMessage} />

            {isTransitioning && <GlobalModeLoading message={transitionMessage} />}

            <main className="flex-1 flex flex-col overflow-hidden relative">
              <div ref={scrollContainerRef} className="absolute inset-0 scroll-container pb-20 scrollbar-hide">
                {!isFullScreenView && activeScreen}
              </div>
            </main>
            
            {/* Full Screen Forms Overlay */}
            <AnimatePresence>
              {isFullScreenView && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-[800] bg-white"
                >
                  {activeScreen}
                </motion.div>
              )}
            </AnimatePresence>

            {popup.show && (
                <GlobalPopup 
                  message={popup.message} 
                  type={popup.type} 
                  onConfirm={popup.onConfirm} 
                  onCancel={popup.onCancel}
                  confirmLabel={popup.confirmLabel}
                  cancelLabel={popup.cancelLabel}
                  isConfirmLoading={popup.isConfirmLoading}
                />
            )}

            {isProfileOpen && (
              <div className="absolute inset-0 z-[500] pointer-events-none">
                <div className="pointer-events-auto h-full w-full">
                  <ProfileScreen 
                      user={currentUser} 
                      onClose={() => setIsProfileOpen(false)}
                      onLogout={handleLogout}
                      setActiveTab={handleTabChange}
                      onShowPopup={showPopup}
                      deferredPrompt={deferredPrompt}
                      onInstallPWA={handleInstallPWA}
                  />
                </div>
              </div>
            )}


            {showScannerGlobal && (
                <ScannerOverlay 
                  onScan={handleScanResultGlobal}
                  onClose={() => setShowScannerGlobal(false)}
                />
            )}

            {paymentConfirmationContext && (
                <div className="absolute inset-0 z-[1000]">
                    <PaymentConfirmationScreen 
                      {...paymentConfirmationContext}
                      user={displayUser}
                      onBack={() => setPaymentConfirmationContext(null)}
                      onModify={() => {
                        setPaymentConfirmationContext(null);
                        setShowFullRegistration(true);
                      }}
                    />
                </div>
            )}

            <AnimatePresence>
              {activeNotificationModal && (() => {
                const pages = [
                  { 
                    message: activeNotificationModal.message, 
                    imageUrl: activeNotificationModal.imageUrl, 
                    buttons: activeNotificationModal.buttons || [] 
                  },
                  ...(activeNotificationModal.steps || []).map((st: any) => ({
                    message: st.message,
                    imageUrl: st.imageUrl,
                    buttons: st.buttons || []
                  }))
                ];
                
                const currentPageIndex = Math.min(activeNotificationStepIndex, pages.length - 1);
                const currentPage = pages[currentPageIndex] || pages[0];
                const currentMessage = currentPage?.message;
                const currentImageUrl = currentPage?.imageUrl;
                const currentButtons = currentPage?.buttons || [];
                const isLastPage = currentPageIndex === pages.length - 1;

                const renderedButtons = [...currentButtons];
                if (!isLastPage) {
                  if (!renderedButtons.some(b => b.action === 'next')) {
                    renderedButtons.push({ label: 'Suivant', action: 'next' as any });
                  }
                } else if (currentImageUrl && !isImageUrl(currentImageUrl)) {
                  if (renderedButtons.length === 0) {
                    renderedButtons.push({ label: 'Ouvrir', action: 'url_link' as any });
                  }
                }

                return (
                  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-sm rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative border-none bg-slate-900 max-h-[90vh] md:max-h-[85vh]"
                    >
                      {/* Dismiss X button on top right */}
                      <button 
                        onClick={() => {
                          if (currentUser?.phone) {
                            databaseService.markNotificationAsReadInFirestore(currentUser.phone, activeNotificationModal.id);
                          }
                          setActiveNotificationModal(null);
                        }}
                        className="absolute top-4 right-4 z-[2010] w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border-2 border-white/60 transition-all shadow-md active:scale-90"
                        aria-label="Fermer"
                      >
                        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Scrollable container for Content */}
                      <div className="overflow-y-auto flex-1 flex flex-col scrollbar-hide rounded-[2rem]">
                        {/* Image space if present - Full format, Borderless, Fits to edges */}
                        {currentImageUrl && isImageUrl(currentImageUrl) && (
                          <div className="w-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                            <img 
                              src={currentImageUrl} 
                              alt="Notification" 
                              className="w-full h-auto max-h-[45vh] object-cover block"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Blue Banner - Under the image with no background spacing */}
                        <div className="bg-[#0B01AA] text-white p-5 flex flex-col gap-4 w-full flex-grow">
                          <div>
                            <p className="text-white text-sm sm:text-base font-bold leading-snug whitespace-pre-wrap break-words">
                              {currentMessage}
                            </p>
                          </div>
                          
                          {/* Button space */}
                          <div className="flex flex-col gap-2.5 w-full mt-auto">
                            {/* Classic Single Button Fallback */}
                            {activeNotificationModal.hasButton && renderedButtons.length === 0 && (
                              <button 
                                onClick={() => {
                                  if (currentUser?.phone) {
                                    databaseService.markNotificationAsReadInFirestore(currentUser.phone, activeNotificationModal.id);
                                  }
                                  setActiveNotificationModal(null);
                                  if (currentImageUrl && !isImageUrl(currentImageUrl)) {
                                    handleUniversalLink(currentImageUrl);
                                  }
                                }}
                                className="w-full bg-white hover:bg-slate-50 active:scale-95 text-[#F25C05] font-black uppercase text-xs py-3.5 rounded-2xl transition-all duration-200 shadow-md text-center"
                              >
                                cliquez ici
                              </button>
                            )}

                            {/* Multiple Dynamic Redirection Buttons or Autogenerated Next/Link Buttons */}
                            {renderedButtons.length > 0 && (
                              <div className="grid grid-cols-1 gap-2.5 w-full">
                                {renderedButtons.map((btn, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => {
                                      if (btn.action === 'next') {
                                        setActiveNotificationStepIndex(prev => prev + 1);
                                      } else {
                                        if (currentUser?.phone) {
                                          databaseService.markNotificationAsReadInFirestore(currentUser.phone, activeNotificationModal.id);
                                        }
                                        setActiveNotificationModal(null);
                                        if (btn.action === 'url_link') {
                                          handleUniversalLink(currentImageUrl);
                                        } else {
                                          handleNotificationButtonAction(btn.action as any, btn.searchFilter);
                                        }
                                      }
                                    }}
                                    className="w-full bg-white hover:bg-slate-50 active:scale-95 text-[#F25C05] font-black uppercase text-xs py-3.5 rounded-2xl transition-all duration-200 shadow-md text-center"
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </AnimatePresence>

            <AnimatePresence>
              {showFullRegistration && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[1100] bg-white overflow-y-auto"
                >
                  <SmartRegistrationScreen 
                    currentUser={currentUser}
                    onComplete={() => {
                        setShowFullRegistration(false);
                        // Trigger payment process after registration
                        window.dispatchEvent(new CustomEvent('trigger-payment-view', {
                          detail: {
                            title: "Frais de Dossier",
                            amount: "310",
                            waveLink: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=310",
                            paymentType: "Inscription"
                          }
                        }));
                    }}
                    onBack={() => setShowFullRegistration(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {interactiveModalContext && (
                <div className="absolute inset-0 z-[800]">
                  <InteractiveModal
                      title={interactiveModalContext.title}
                      formType={interactiveModalContext.formType}
                      user={displayUser}
                      imageUrl={interactiveModalContext.imageUrl}
                      isBlurredImage={interactiveModalContext.isBlurredImage}
                      description={interactiveModalContext.description}
                      price={interactiveModalContext.price}
                      onClose={() => setInteractiveModalContext(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
                if (isProfileOpen) setIsProfileOpen(false);
                handleTabChange(tab);
            }}
            onToggleProfile={handleToggleProfile}
            onOpenScanner={() => setShowScannerGlobal(true)}
            isProfileOpen={isProfileOpen}
            userRole="Client"
            isMiseEnRelationActive={false}
            unreadChatCount={unreadChatCount}
            isHidden={isFullScreenView}
            showAdmin={isAdmin(currentUser) || isAdminAuthenticated}
          />
        </div>
      </div>
    </GlobalRippleEffect>
  );
};

export default App;
