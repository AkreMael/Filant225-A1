import { User, Worker, Offer, FavoriteRequest, PersonalRequest, Notification } from '../types';
import { db, auth, rtdb, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc, getDoc, onSnapshot, writeBatch, updateDoc, where } from 'firebase/firestore';
import { ref as rtdbRef, push, set, serverTimestamp as rtdbTimestamp, get, update, onValue, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

// --- ENUMS & INTERFACES FOR ERROR HANDLING ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const isQuotaExceeded = error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded');
  
  const errInfo: any = {
    error: isQuotaExceeded ? 'Quota Firestore dépassé pour aujourd\'hui. Le service reprendra demain.' : (error instanceof Error ? error.message : String(error)),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  if (isQuotaExceeded) {
    console.error('CRITICAL: Firestore Quota Exceeded. The app will have limited functionality until the quota resets.');
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Scoped keys for client storage
const USERS_KEY = 'filant_users';
const CONNECTION_LOGS_KEY = 'filant_connection_logs';
const FAVORITES_KEY_PREFIX = 'filant_user_favorites_';
const CONTACTS_KEY_PREFIX = 'filant_user_contacts_';
const CHAT_KEY_PREFIX = 'filant_chat_history_';
const NOTIFICATIONS_KEY_PREFIX = 'filant_user_notifications_';
const REQUESTS_KEY_PREFIX = 'filant_user_requests_';
const CARD_KEY_PREFIX = 'filant_user_card_';
const SESSION_ID_KEY = 'filant_session_id';
const ACTIVE_USER_KEY = 'filant_active_user';
const ADMIN_PHONE = "0705052632";
const CHAT_RETENTION_MS = 24 * 60 * 60 * 1000;

let workersCache: Worker[] | null = null;

// --- HELPER FUNCTIONS ---
const getScopedKey = (phone: string, prefix: string) => `${prefix}${phone.replace(/\s/g, '')}`;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation Timeout')), timeoutMs))
    ]);
};

// --- User Management ---
const getUsers = (): User[] => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return [];
    }
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export interface SavedContact {
  id: string;
  title: string;
  name: string;
  review: string;
  phone: string;
  city?: string;
}

export interface ConnectionLog {
    name: string;
    city: string;
    phone: string;
    lastConnection: string;
    firstConnection: string;
}

export interface StoredChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
    paymentInfo?: any;
    whatsAppPayload?: string;
}

// --- Mock Data ---
const workerDataList = [
  { name: 'Vendeuse / Vendeur', description: 'Assure la vente, l’accueil des clients et la gestion d’une boutique.', category: 'Disponible' },
  { name: 'Cuisinier / Cuisinière', description: 'Prépare les repas quotidiennement pour restaurant, foyer ou entreprise.', category: 'Disponible' },
  { name: 'Serveur / Serveuse', description: 'Accueille les clients, sert les plats et s’occupe des commandes.', category: 'Disponible' },
  { name: 'Coiffeur / Coiffeuse', description: 'S’occupe des cheveux, coiffure, tresses et soins capillaires.', category: 'Disponible' },
  { name: 'Hôtesse d’accueil', description: 'Accueille les visiteurs, gère les informations et la réception.', category: 'Disponible' },
  { name: 'Chauffeur', description: '(Taxi, VTC, Entreprise) Conduit les clients ou le personnel d’un lieu à un autre.', category: 'Disponible' },
  { name: 'Agent d’entretien / Femme de ménage', description: 'Nettoyeur bureaux et maisons.', category: 'Disponible' },
  { name: 'Caissière / Caissier', description: 'Gère les paiements, la caisse et l’accueil dans les commerces.', category: 'Disponible' },
  { name: 'Réceptionniste', description: 'Accueille les clients dans hôtels, entreprises ou agences.', category: 'Disponible' },
  { name: 'Nounou / Baby-sitter', description: 'Garde les enfants, aide aux devoirs et accompagne la famille.', category: 'Disponible' },
  { name: 'Jardinier', description: 'Entretient les jardins, pelouses, fleurs et espaces verts.', category: 'Disponible' },
  { name: 'Couturière / Couturier', description: 'Coud, répare et crée des vêtements pour clients.', category: 'Disponible' },
  { name: 'Esthéticienne', description: 'Fait les soins du visage, manucure, pédicure, beauté.', category: 'Disponible' },
  { name: 'Magasinier', description: 'Gère les stocks, rangement et réception des marchandises.', category: 'Disponible' },
  { name: 'Manutentionnaire', description: 'Charge, décharge et organise les marchandises.', category: 'Disponible' },
  { name: 'Vigile', description: 'Sécurise l’entrée d’un commerce ou d’un bâtiment.', category: 'Disponible' },
  { name: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres et surfaces vitrées.', category: 'Disponible' },
  { name: 'Technicien entretien climatisation Rapide', description: 'Entretien, nettoyage et recharge de climatiseurs.', category: 'Disponible' },
  { name: 'Installateur de caméras de surveillance Rapide', description: 'Installation et configuration de systèmes de vidéosurveillance.', category: 'Disponible' },
  { name: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs et coussins.', category: 'Disponible' },
  { name: 'Installateur de fenêtres et portes vitrées Rapide', description: 'Pose de menuiserie aluminium et vitrerie.', category: 'Disponible' },
  { name: 'Menuisier Rapide', description: 'Travaux de menuiserie bois et réparation de meubles.', category: 'Disponible' },
  { name: 'Aide à domicile', description: 'Services humains', category: 'Disponible' },
  { name: 'Garde malade (jour / nuit)', description: 'Services humains', category: 'Disponible' },
  { name: 'Vente en ligne', description: 'Vend des produits via internet.', category: 'Commerce & Vente' },
  { name: 'Grossiste', description: 'Fournit des produits en grande quantité aux commerçants.', category: 'Commerce & Vente' },
  { name: 'Vente de vêtements', description: 'Propose des vêtements à la vente aux clients.', category: 'Commerce & Vente' },
  { name: 'Cuisinier / Restaurateur', description: 'Prépare et cuisine des plats pour les clients.', category: 'Services' },
  { name: 'Décorateur intérieur', description: 'Aménage et décore des espaces intérieurs.', category: 'Bâtiment & Construction' },
  { name: 'Pose de faux plafond', description: 'Installe des plafond suspendus dans les maisons ou bureaux.', category: 'Bâtiment & Construction' },
  { name: 'Community manager', description: 'Gère les réseaux sociaux pour les entreprises ou projets.', category: 'Numérique & Internet' },
  { name: 'Photographe', description: 'Prend des photos pour événements ou projets.', category: 'Numérique & Internet' },
  { name: 'Vidéaste / Monteur', description: 'Réalise et monte des vidéos.', category: 'Numérique & Internet' },
  { name: 'Manucure / Pédicure', description: 'S’occupe des soins des mains et pieds.', category: 'Beauté & Bien-être' },
  { name: 'Massage', description: 'Pratique des massages pour le bien-être.', category: 'Beauté & Bien-être' },
  { name: 'Maquillage professionnel', description: 'Maquille pour événements ou spectacles.', category: 'Beauté & Bien-être' },
  { name: 'Enseignant privé', description: 'Donne des cours particuliers aux élèves.', category: 'Éducation & Formation' },
];

const mockWorkers: Worker[] = workerDataList.map((worker, index) => ({
  id: `${index + 1}`,
  name: worker.name,
  description: worker.description,
  category: worker.category,
  profileImageUrl: '',
  phone: `+22507050526${32 + index}`,
  rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
}));

const mockOffers: Offer[] = [
    { id: '1', title: 'Service de Nettoyage Pro', description: '20% de réduction pour les nouveaux clients sur le nettoyage de bureaux.', imageUrl: 'https://picsum.photos/seed/nettoyage/500/300' },
    { id: '2', title: 'Chauffeur Privé Express', description: 'Besoin d\'un transport rapide et fiable ? Nos chauffeurs sont à votre service 24/7.', imageUrl: 'https://picsum.photos/seed/chauffeur/500/300' },
    { id: '3', title: 'Jardinage et Entretien', description: 'Donnez une nouvelle vie à votre jardin avec nos experts paysagistes.', imageUrl: 'https://picsum.photos/seed/jardinage/500/300' },
    { id: '4', title: 'Soutien Scolaire à Domicile', description: 'Aidez vos enfants à réussir avec des tuteurs qualifiés et expérimentés.', imageUrl: 'https://picsum.photos/seed/ecole/500/300' },
    { id: '5', title: 'Coiffure et Maquillage Pro', description: 'Soyez la plus belle pour vos événements. Services à domicile disponibles.', imageUrl: 'https://picsum.photos/seed/coiffure/500/300' },
    { id: '6', title: 'Agence Immobilière FILANT', description: 'Trouvez la maison de vos rêves with notre catalogue exclusif de propriétés.', imageUrl: 'https://picsum.photos/seed/immobilier/500/300' },
];

// --- Database Service ---

export const databaseService = {
  getSessionId: (): string => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  },

  getActiveUser: (): User | null => {
    try {
        const userJson = localStorage.getItem(ACTIVE_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        return null;
    }
  },

  saveActiveUser: (user: User | null) => {
    if (user) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
        localStorage.setItem('filant_currentUserPhone', user.phone);
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
        localStorage.removeItem('filant_currentUserPhone');
    }
  },

  logConnection: async (user: User) => {
    try {
        const logsString = localStorage.getItem(CONNECTION_LOGS_KEY);
        let logs: ConnectionLog[] = logsString ? JSON.parse(logsString) : [];
        const now = new Date().toISOString();
        const existingIndex = logs.findIndex(log => log.phone === user.phone);
        if (existingIndex !== -1) {
            logs[existingIndex].lastConnection = now;
            logs[existingIndex].name = user.name;
            logs[existingIndex].city = user.city;
        } else {
            logs.unshift({
                name: user.name,
                city: user.city,
                phone: user.phone,
                firstConnection: now,
                lastConnection: now
            });
        }
        localStorage.setItem(CONNECTION_LOGS_KEY, JSON.stringify(logs));
        
        // Sync to Firestore (Non-blocking)
        databaseService.syncUserToFirestore(user);
    } catch (e) {
        console.error("Error logging connection", e);
    }
  },

  ensureAuth: async () => {
    if (!auth.currentUser) {
      const { signInAnonymously } = await import('firebase/auth');
      try {
        const cred = await withTimeout(signInAnonymously(auth), 5000);
        console.log("Authenticated anonymously as:", cred.user.uid);
        return cred.user;
      } catch (authError: any) {
        if (authError.code === 'auth/admin-restricted-operation') {
          console.error("Anonymous authentication is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
        } else {
          console.warn("Anonymous authentication failed or restricted:", authError.message);
        }
      }
    }
    return auth.currentUser;
  },

  syncUserToFirestore: async (user: User) => {
    if (!user.phone) return;
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    const path = `users/${sanitizedPhone}`;
    
    try {
      const fbUser = await databaseService.ensureAuth();

      // Update Firebase Auth Profile (displayName)
      if (fbUser && user.name && fbUser.displayName !== user.name) {
        const { updateProfile } = await import('firebase/auth');
        try {
          await updateProfile(fbUser, {
            displayName: user.name
          });
          console.log("Firebase Auth Profile updated with name:", user.name);
        } catch (profileError) {
          console.warn("Failed to update Firebase Auth profile:", profileError);
        }
      }

      const userRef = doc(db, 'users', sanitizedPhone);
      const docSnap = await getDoc(userRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};

      const userData: any = {
        userId: fbUser?.uid || existingData.userId || null,
        name: (user.name && !['Utilisateur', 'Inconnu', ''].includes(user.name)) ? user.name : (existingData.name || user.name || ''),
        phone: sanitizedPhone,
        city: (user.city && !['Non spécifiée', ''].includes(user.city)) ? user.city : (existingData.city || user.city || ''),
        pin: user.pin || existingData.pin || null,
        role: 'Client',
        isVerified: existingData.isVerified || user.isVerified || false,
        lastConnection: new Date().toISOString(),
        activeSessionId: user.activeSessionId || existingData.activeSessionId || null
      };

      userData.lastSeen = serverTimestamp();
      userData.updatedAt = serverTimestamp();
      
      await setDoc(userRef, userData, { merge: true });
      console.log("User synced to Firestore successfully:", user.name);
    } catch (e) {
      console.error("Error in syncUserToFirestore:", e);
      // Don't throw here to avoid blocking the main flow if sync fails
    }
  },

  getUserByUidFromFirestore: async (uid: string): Promise<User | null> => {
    const path = 'users';
    try {
      const { getDocs, query, collection, where, limit } = await import('firebase/firestore');
      const q = query(collection(db, path), where('userId', '==', uid), limit(1));
      const snapshot = await withTimeout(getDocs(q));
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          phone: data.phone || doc.id, // Ensure phone is present
          ...data
        } as User;
      }
    } catch (e) {
      console.error("Error fetching user by UID:", e);
    }
    return null;
  },

  getUserFromFirestore: async (name: string, phone: string): Promise<User | null> => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const path = `users/${sanitizedPhone}`;
    const userRef = doc(db, 'users', sanitizedPhone);
    
    try {
      await databaseService.ensureAuth();
      const docSnap = await withTimeout(getDoc(userRef));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Strict verification: Name must match (case insensitive)
        if (data.name.trim().toLowerCase() === name.trim().toLowerCase()) {
            return {
              name: data.name,
              phone: data.phone,
              city: data.city,
              role: data.role
            };
        }
      }
    } catch (e) {
      console.error("Error in getUserFromFirestore:", e);
    }
    return null;
  },

  getUserByPhoneFromFirestore: async (phone: string): Promise<User | null> => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const userRef = doc(db, 'users', sanitizedPhone);
    
    try {
      await databaseService.ensureAuth();
      const docSnap = await withTimeout(getDoc(userRef));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          phone: data.phone || docSnap.id, // Ensure phone is present
          ...data
        } as User;
      }
    } catch (e) {
      console.error("Error in getUserByPhoneFromFirestore:", e);
    }
    return null;
  },

  syncUserDataFromCloud: async (user: User) => {
    if (!user.phone) return;
    
    // Sync Scanned Contacts from RTDB
    try {
        const { get, child } = await import('firebase/database');
        const sanitizedUserName = (user.name || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
        const userKey = `${sanitizedUserName}_${user.phone}`;
        const dbRef = rtdbRef(rtdb);
        const snapshot = await get(child(dbRef, `scanned_contacts/${userKey}`));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.contacts) {
                const contactsArray: SavedContact[] = Object.values(data.contacts);
                const key = getScopedKey(user.phone, CONTACTS_KEY_PREFIX);
                localStorage.setItem(key, JSON.stringify(contactsArray));
                console.log("Contacts synced from RTDB for:", userKey);
            }
        }
    } catch (e) {
        console.error("Error syncing data from cloud:", e);
    }
  },

  saveFCMToken: async (user: User, token: string) => {
    if (!user || !user.phone || !token) return;
    
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    const userRef = doc(db, 'users', sanitizedPhone);
    
    try {
      await setDoc(userRef, { fcmToken: token, updatedAt: serverTimestamp() }, { merge: true });
      console.log("FCM Token saved to Firestore for:", user.name);
    } catch (e) {
      console.error("Error saving FCM token to Firestore:", e);
    }
  },

  getConnectionLogs: (): ConnectionLog[] => {
      try {
          const logs = localStorage.getItem(CONNECTION_LOGS_KEY);
          return logs ? JSON.parse(logs) : [];
      } catch (e) {
          return [];
      }
  },

  getUserByPhoneFromLocalStorage: (phone: string): User | null => {
    const users = getUsers();
    return users.find(u => u.phone === phone.replace(/\D/g, '')) || null;
  },

  getUserByPhone: (phone: string): User | null => {
    return databaseService.getUserByPhoneFromLocalStorage(phone);
  },

  loginUser: async (phone: string, pin: string): Promise<{user: User | null, error?: string}> => {
    const users = getUsers();
    const normalizedInputPhone = phone.replace(/\D/g, '');
    
    // 1. Check Firestore first (Source of truth)
    console.log("Checking Firestore for user:", normalizedInputPhone);
    const firestoreUser = await databaseService.getUserByPhoneFromFirestore(normalizedInputPhone);
    
    if (firestoreUser) {
        // Verify PIN
        if (firestoreUser.pin !== pin) {
            return { user: null, error: "Code PIN incorrect." };
        }

        // Enforce Single Session
        const currentSessionId = databaseService.getSessionId();
        if (firestoreUser.activeSessionId && firestoreUser.activeSessionId !== currentSessionId) {
            return { user: null, error: "Vous êtes déjà connecté sur un autre appareil." };
        }

        const user = {
            ...firestoreUser,
            activeSessionId: currentSessionId,
            role: 'Client'
        };
        
        // Update local cache with latest data from Firestore
        const existingIndex = users.findIndex(u => u.phone === normalizedInputPhone);
        if (existingIndex !== -1) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }
        saveUsers(users);
        
        console.log("User found in Firestore and local cache updated:", user.name, user.city);
        
        // Sync their data (contacts, etc.)
        await databaseService.syncUserDataFromCloud(user);
        await databaseService.logConnection(user);
        databaseService.saveActiveUser(user);
        return { user };
    }
    
    // 2. Fallback to localStorage (if offline or legacy)
    let localUser = users.find(u => 
        u.phone === normalizedInputPhone && 
        u.pin === pin
    );
    
    if (localUser) {
      await databaseService.logConnection(localUser);
      databaseService.saveActiveUser(localUser);
      return { user: localUser };
    }
    
    return { user: null, error: "Utilisateur non trouvé ou Code PIN incorrect." };
  },

  registerUser: async (name: string, city: string, phone: string, pin: string): Promise<{user: User | null, error?: string}> => {
    const users = getUsers();
    const normalizedPhone = phone.replace(/\D/g, '');
    
    // 1. Check Firestore (Source of truth)
    const existingFirestoreUser = await databaseService.getUserByPhoneFromFirestore(normalizedPhone);
    
    if (existingFirestoreUser) {
        return { user: null, error: "Ce numéro est déjà enregistré. Veuillez vous connecter." };
    }

    // 2. Check localStorage (Legacy/Offline)
    const localUser = users.find(u => u.phone === normalizedPhone);
    if (localUser) {
        return { user: null, error: "Ce numéro est déjà enregistré localement. Veuillez vous connecter." };
    }

    const currentSessionId = databaseService.getSessionId();
    const newUser: User = { 
        name: name.trim(), 
        city: city.trim(), 
        phone: normalizedPhone,
        pin: pin,
        role: localStorage.getItem('filant_user_role') || 'Client',
        activeSessionId: currentSessionId
    };
    
    users.push(newUser);
    saveUsers(users);
    databaseService.saveActiveUser(newUser);
    
    // Sync to Firestore (Non-blocking)
    databaseService.syncUserToFirestore(newUser);
    databaseService.logConnection(newUser);
    
    return { user: newUser };
  },

  resetPin: async (phone: string, newPin: string): Promise<{success: boolean, error?: string}> => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const userRef = doc(db, 'users', normalizedPhone);
    
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        return { success: false, error: "Utilisateur non trouvé." };
      }
      
      await updateDoc(userRef, {
        pin: newPin,
        updatedAt: serverTimestamp()
      });
      
      // Update local storage too
      const users = getUsers();
      const userIdx = users.findIndex(u => u.phone === normalizedPhone);
      if (userIdx !== -1) {
        users[userIdx].pin = newPin;
        saveUsers(users);
      }
      
      return { success: true };
    } catch (e) {
      console.error("Error resetting PIN:", e);
      return { success: false, error: "Erreur lors de la réinitialisation du code PIN." };
    }
  },

  cleanupDatabase: async () => {
    const ADMIN_PHONE = '0705052632';
    console.log("Starting full database cleanup...");
    
    try {
      await databaseService.ensureAuth();
      
      const collectionsToClear = [
        'users',
        'recruitments',
        'messages',
        'travailleurs',
        'agences',
        'proprietaires',
        'entreprises',
        'Chats',
        'scanned_contacts',
        'reviews',
        'interventions',
        'availabilities'
      ];

      for (const colName of collectionsToClear) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        
        const batch = writeBatch(db);
        let deleteCount = 0;
        
        snapshot.forEach((doc) => {
          // Preserve admin in users collection
          if (colName === 'users' && doc.id === ADMIN_PHONE) {
            return;
          }
          batch.delete(doc.ref);
          deleteCount++;
        });
        
        if (deleteCount > 0) {
          await batch.commit();
          console.log(`Deleted ${deleteCount} documents from ${colName}.`);
        }
      }

      // 2. Ensure Admin exists with PIN 1234
      const adminRef = doc(db, 'users', ADMIN_PHONE);
      const adminData: User = {
        name: 'Mael',
        city: 'Bassam',
        phone: ADMIN_PHONE,
        pin: '1234',
        role: 'Admin 225',
        isVerified: true,
        status: 'active'
      };
      
      await setDoc(adminRef, {
        ...adminData,
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      }, { merge: true });
      
      console.log("Admin account verified/created with PIN 1234.");

      // 3. Cleanup LocalStorage
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(CONNECTION_LOGS_KEY);
      
      // Remove all scoped keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith(FAVORITES_KEY_PREFIX) || 
          key.startsWith(CONTACTS_KEY_PREFIX) || 
          key.startsWith(REQUESTS_KEY_PREFIX) || 
          key.startsWith(CARD_KEY_PREFIX) || 
          key.startsWith(CHAT_KEY_PREFIX) || 
          key.startsWith(NOTIFICATIONS_KEY_PREFIX)
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      console.log("LocalStorage cleanup completed.");
      return true;
    } catch (e) {
      console.error("Error during database cleanup:", e);
      return false;
    }
  },
  
  getWorkers: async (): Promise<Worker[]> => {
    if (workersCache) return workersCache;
    try {
      const response = await fetch('/api/workers');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const workers = await response.json();
          if (workers && workers.length > 0) {
            workersCache = workers;
            return workers;
          }
        } else {
          const text = await response.text();
          console.warn("API returned non-JSON response for workers:", text.substring(0, 100));
        }
      } else {
        console.warn(`API returned status ${response.status} for workers`);
      }
    } catch (e) {
      console.error("Failed to fetch workers from API, using mock data", e);
    }
    await new Promise(res => setTimeout(res, 500)); 
    workersCache = mockWorkers;
    return mockWorkers;
  },

  getOffers: async (): Promise<Offer[]> => {
    try {
      const response = await fetch('/api/offers');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const offers = await response.json();
          if (offers && offers.length > 0) return offers;
        } else {
          const text = await response.text();
          console.warn("API returned non-JSON response for offers:", text.substring(0, 100));
        }
      } else {
        console.warn(`API returned status ${response.status} for offers`);
      }
    } catch (e) {
      console.error("Failed to fetch offers from API, using mock data", e);
    }
    await new Promise(res => setTimeout(res, 800)); 
    return mockOffers;
  },

  uploadFile: async (file: File | Blob | string, path: string): Promise<string> => {
    try {
      const fileRef = storageRef(storage, path);
      if (typeof file === 'string') {
        await uploadString(fileRef, file, 'data_url');
      } else {
        await uploadBytes(fileRef, file);
      }
      return await getDownloadURL(fileRef);
    } catch (e) {
      console.error(`Error uploading file to ${path}:`, e);
      throw e;
    }
  },

  logoutUser: async (phone: string) => {
    try {
        databaseService.saveActiveUser(null);
        const sanitizedPhone = phone.replace(/\D/g, '');
        const userRef = doc(db, 'users', sanitizedPhone);
        await updateDoc(userRef, {
            activeSessionId: null
        });
        console.log("Session cleared in Firestore for:", phone);
    } catch (e) {
        console.error("Error clearing session in Firestore:", e);
    }
  },

  getFavorites: (phone: string): FavoriteRequest[] => {
      try {
          const key = getScopedKey(phone, FAVORITES_KEY_PREFIX);
          const favs = localStorage.getItem(key);
          return favs ? JSON.parse(favs) : [];
      } catch (e) {
          return [];
      }
  },

  saveFavorite: (phone: string, request: Omit<FavoriteRequest, 'id'>) => {
      const key = getScopedKey(phone, FAVORITES_KEY_PREFIX);
      const favsString = localStorage.getItem(key);
      const favs: FavoriteRequest[] = favsString ? JSON.parse(favsString) : [];
      const newFav: FavoriteRequest = { ...request, id: Date.now().toString() };
      favs.unshift(newFav);
      if (favs.length > 50) favs.pop();
      localStorage.setItem(key, JSON.stringify(favs));
  },

  removeFavorite: (phone: string, id: string) => {
      const key = getScopedKey(phone, FAVORITES_KEY_PREFIX);
      const favsString = localStorage.getItem(key);
      if (!favsString) return;
      const favs: FavoriteRequest[] = JSON.parse(favsString);
      const updated = favs.filter(f => f.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
  },

  clearFavorites: (phone: string) => {
      const key = getScopedKey(phone, FAVORITES_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify([]));
  },

  getContacts: (phone: string): SavedContact[] => {
      try {
          const key = getScopedKey(phone, CONTACTS_KEY_PREFIX);
          const contacts = localStorage.getItem(key);
          return contacts ? JSON.parse(contacts) : [];
      } catch (e) {
          return [];
      }
  },

  saveContacts: (phone: string, contacts: SavedContact[], user?: User) => {
      const key = getScopedKey(phone, CONTACTS_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify(contacts));

      // Sync to RTDB if user info is provided
      if (user) {
          try {
              const sanitizedUserName = (user.name || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
              const userKey = `${sanitizedUserName}_${user.phone}`;
              const contactsRef = rtdbRef(rtdb, `scanned_contacts/${userKey}`);
              
              // Create an object where keys are "Nom_Numero"
              const contactsObject: Record<string, any> = {};
              contacts.forEach(c => {
                  const sanitizedContactName = (c.name || 'Inconnu').replace(/[.#$[\]/]/g, '_');
                  const contactKey = `${sanitizedContactName}_${c.phone.replace(/\s+/g, '')}`;
                  contactsObject[contactKey] = {
                      ...c,
                      syncedAt: rtdbTimestamp()
                  };
              });

              set(contactsRef, {
                  contacts: contactsObject,
                  lastUpdated: rtdbTimestamp()
              });
              console.log("Scanned contacts synced to RTDB for:", userKey);
          } catch (e) {
              console.error("Error syncing scanned contacts to RTDB:", e);
          }
      }
  },

  getPersonalRequests: (phone: string): PersonalRequest[] => {
      try {
          const key = getScopedKey(phone, REQUESTS_KEY_PREFIX);
          const reqs = localStorage.getItem(key);
          return reqs ? JSON.parse(reqs) : [];
      } catch (e) {
          return [];
      }
  },

  savePersonalRequests: (phone: string, requests: PersonalRequest[]) => {
      const key = getScopedKey(phone, REQUESTS_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify(requests));
  },

  getChatHistory: (phone: string): StoredChatMessage[] => {
      try {
          const key = getScopedKey(phone, CHAT_KEY_PREFIX);
          const historyString = localStorage.getItem(key);
          if (!historyString) return [];
          const history: StoredChatMessage[] = JSON.parse(historyString);
          const now = Date.now();
          return history.filter(msg => (now - msg.timestamp) < CHAT_RETENTION_MS);
      } catch (e) {
          return [];
      }
  },

  saveChatHistory: (phone: string, history: StoredChatMessage[]) => {
      try {
          const key = getScopedKey(phone, CHAT_KEY_PREFIX);
          localStorage.setItem(key, JSON.stringify(history));
      } catch (e) {}
  },

  saveChatMessage: (phone: string, message: StoredChatMessage) => {
      try {
          const historyKey = getScopedKey(phone, CHAT_KEY_PREFIX);
          const historyString = localStorage.getItem(historyKey);
          let history: StoredChatMessage[] = historyString ? JSON.parse(historyString) : [];
          history.push(message);
          if (history.length > 100) history.shift();
          localStorage.setItem(historyKey, JSON.stringify(history));
          databaseService.syncChatMessageToFirestore(phone, message);
      } catch (e) {}
  },

  syncChatMessageToFirestore: async (phone: string, message: StoredChatMessage) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const user = databaseService.getUserByPhoneFromLocalStorage(phone);
      const userName = user?.name || 'Utilisateur';
      const messageId = `${userName}_${sanitizedPhone}`;
      const messageRef = doc(db, 'messages', messageId);
      
      await setDoc(messageRef, {
        userId: sanitizedPhone,
        userName: userName,
        role: message.sender,
        content: message.text,
        timestamp: serverTimestamp(),
        paymentInfo: message.paymentInfo || null
      });
    } catch (e) {
      console.error("Error syncing chat message:", e);
    }
  },

  clearChatHistory: (phone: string) => {
      try {
          const historyKey = getScopedKey(phone, CHAT_KEY_PREFIX);
          localStorage.removeItem(historyKey);
      } catch (e) {}
  },

  getNotifications: (phone: string): Notification[] => {
      try {
          const key = getScopedKey(phone, NOTIFICATIONS_KEY_PREFIX);
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  },

  saveNotifications: (phone: string, notifications: Notification[]) => {
      const key = getScopedKey(phone, NOTIFICATIONS_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify(notifications));
  },

  addNotification: (phone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      const key = getScopedKey(phone, NOTIFICATIONS_KEY_PREFIX);
      const current = databaseService.getNotifications(phone);
      const newNotif: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
          isRead: false
      };
      const updated = [newNotif, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      if (phone) databaseService.sendNotificationToFirestore(phone, notification);
      return updated;
  },

  sendNotificationToFirestore: async (phone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      const notifRef = collection(db, 'users', sanitizedPhone, 'notifications');
      await addDoc(notifRef, {
        ...notification,
        timestamp: serverTimestamp(),
        isRead: false
      });
      // Push notification API call removed as it depends on external backend
    } catch (e) {
      console.error("Error saving notification to Firestore:", e);
    }
  },

  onNotificationsUpdate: (phone: string, callback: (notifications: Notification[]) => void) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const q = query(collection(db, 'users', sanitizedPhone, 'notifications'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis() || Date.now()
      } as Notification));
      callback(notifications);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });
  },

  markNotificationAsReadInFirestore: async (phone: string, notificationId: string) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      const notifRef = doc(db, 'users', sanitizedPhone, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
      const current = databaseService.getNotifications(phone);
      const updated = current.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
      databaseService.saveNotifications(phone, updated);
    } catch (e) {
      console.error("Error marking notification read:", e);
    }
  },

  deleteNotificationFromFirestore: async (phone: string, notificationId: string) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      const notifRef = doc(db, 'users', sanitizedPhone, 'notifications', notificationId);
      await deleteDoc(notifRef);
      const current = databaseService.getNotifications(phone);
      const updated = current.filter(n => n.id !== notificationId);
      databaseService.saveNotifications(phone, updated);
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  },

  clearAllNotificationsFromFirestore: async (phone: string) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      const notifRef = collection(db, 'users', sanitizedPhone, 'notifications');
      const snapshot = await getDocs(notifRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      databaseService.clearNotifications(phone);
    } catch (e) {
      console.error("Error clearing notifications:", e);
    }
  },

  clearNotifications: (phone: string) => {
      const key = getScopedKey(phone, NOTIFICATIONS_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify([]));
  },

  saveAssistantRequestToRTDB: async (requestData: any) => {
    try {
      const { userName, userId } = requestData;
      const sanitizedName = (userName || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
      const userKey = `${sanitizedName}_${userId}`;
      const requestsRef = rtdbRef(rtdb, `assistant_requests/${userKey}`);
      const newRequestRef = push(requestsRef);
      await set(newRequestRef, { ...requestData, timestamp: rtdbTimestamp() });
    } catch (e) {
      console.error("Error saving assistant request:", e);
    }
  },

  savePaymentToRTDB: async (paymentData: any) => {
    try {
      const { userName, userId } = paymentData;
      const sanitizedName = (userName || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
      const userKey = `${sanitizedName}_${userId}`;
      const paymentsRef = rtdbRef(rtdb, `wave_payments/${userKey}`);
      const newPaymentRef = push(paymentsRef);
      await set(newPaymentRef, { ...paymentData, timestamp: rtdbTimestamp() });
    } catch (e) {
      console.error("Error saving payment:", e);
    }
  },

  // --- DUMMIES & RESTORED FUNCTIONS FOR CLIENT-SIDE STABILITY ---
  onUnreadMessagesCount: (chatUserId: string, callback: (count: number) => void) => {
    // Basic placeholder for message count logic
    return () => {};
  },

  onAdminChatUpdate: (chatUserId: string, callback: (messages: any[]) => void) => {
    const userId = chatUserId.replace(/\D/g, '');
    const q = query(
      collection(db, 'chats', userId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(msgs);
    }, (error) => console.error("Chat sync error:", error));
  },

  markAdminMessagesAsRead: async (chatUserId: string, side: 'user' | 'admin') => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const q = query(
        collection(db, 'chats', userId, 'messages'),
        where('sender', '==', side),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => {
        batch.update(d.ref, { isRead: true });
      });
      await batch.commit();
    } catch (e) {}
  },

  saveAdminChatMessage: async (chatUserId: string, message: any) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      await addDoc(collection(db, 'chats', userId, 'messages'), {
        ...message,
        isRead: false
      });
      await setDoc(doc(db, 'chats', userId), {
        lastMessage: message.text,
        lastSender: message.sender,
        updatedAt: serverTimestamp(),
        userId: userId
      }, { merge: true });
      return true;
    } catch (e) {
      return false;
    }
  },

  deleteAdminChatMessage: async (chatUserId: string, messageId: string) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      await deleteDoc(doc(db, 'chats', userId, 'messages', messageId));
      return true;
    } catch (e) { return false; }
  },

  saveFormSubmission: async (formData: any) => {
    try {
      const submissionsRef = collection(db, 'form_submissions');
      await addDoc(submissionsRef, {
        ...formData,
        submittedAt: serverTimestamp()
      });
      return true;
    } catch (e) { return false; }
  },

  getCardData: (phone: string, role: string) => {
    // Card logic removed, returning null
    return null;
  },

  saveCardData: async (phone: string, data: any) => {
    // Card logic removed
    return true;
  },

  updateOfferBlur: async (offerId: string, isBlurred: boolean) => {
    // Pro logic removed
    return true;
  },

  publishStatusAsMessage: async (phone: string, message: string) => {
    // Pro logic removed
    return true;
  },

  savePlacement: async (data: any, additional?: any) => {
    // Pro logic removed
    return true;
  }
};
