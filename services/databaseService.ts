import { User, Worker, Offer, FavoriteRequest, PersonalRequest, Notification } from '../types';
import { db, auth, rtdb, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc, getDoc, onSnapshot, writeBatch, updateDoc, where, limit } from 'firebase/firestore';
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
    if (user && user.phone) {
        const sanitizedPhone = user.phone.replace(/\D/g, '');
        // Recovery logic: if we are saving a user with placeholders but we have better data in localStorage, merge it
        const currentActive = databaseService.getActiveUser();
        const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);
        
        let finalUser = { ...user };
        
        if (currentActive && currentActive.phone.replace(/\D/g, '') === sanitizedPhone) {
            if (!isValid(finalUser.name) && isValid(currentActive.name)) {
                finalUser.name = currentActive.name;
            }
            if (!isValid(finalUser.city) && isValid(currentActive.city)) {
                finalUser.city = currentActive.city;
            }
        }
        
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(finalUser));
        localStorage.setItem('filant_currentUserPhone', sanitizedPhone);
    } else if (!user) {
        localStorage.removeItem(ACTIVE_USER_KEY);
        localStorage.removeItem('filant_currentUserPhone');
    }
  },

  logConnection: async (user: User) => {
    try {
        const sanitizedPhone = user.phone.replace(/\D/g, '');
        if (!sanitizedPhone) return;
        
        // Sync to Firestore 'Connexions' - One document per user (ligne dédiée)
        const connRef = doc(db, 'Connexions', sanitizedPhone);
        
        // Only update name and city if they are valid and not empty
        const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);
        
        const updateData: any = {
            phone: user.phone,
            timestamp: serverTimestamp(),
            adminReadStatus: 'NON LU'
        };

        if (isValid(user.name)) updateData.name = user.name;
        if (isValid(user.city)) updateData.city = user.city;

        await setDoc(connRef, updateData, { merge: true });

        // Sync to Firestore 'Clients' or relevant collection
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
    
    try {
      const fbUser = await databaseService.ensureAuth();

      // Find which collection this user belongs to
      let targetCollection = 'Clients';
      let existingData: any = {};
      
      const collections = ['Admin', 'Travailleurs', 'Agences immobilières', 'Équipements', 'Entreprises', 'Clients'];
      
      const checkPromises = collections.map(async (col) => {
          const ref = doc(db, col, sanitizedPhone);
          const snap = await getDoc(ref);
          return snap.exists() ? { col, data: snap.data() } : null;
      });

      const results = await Promise.all(checkPromises);
      const found = results.find(r => r !== null);
      
      if (found) {
          targetCollection = found.col;
          existingData = found.data;
      }

      const userRef = doc(db, targetCollection, sanitizedPhone);
      const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);

      // Construct update object
      const userData: any = {
        phone: sanitizedPhone,
        lastSeen: serverTimestamp()
      };

      if (fbUser?.uid) userData.userId = fbUser.uid;
      
      // PERSISTENCE LOGIC: 
      // 1. If incoming name is valid, use it.
      // 2. If incoming name is NOT valid but existing is, do NOT overwrite with placeholder.
      if (isValid(user.name)) {
          userData.name = user.name;
      } else if (existingData && isValid(existingData.name)) {
          // Keep existing name from Firestore if incoming is placeholder
          userData.name = existingData.name;
      }

      if (isValid(user.city)) {
          userData.city = user.city;
      } else if (existingData && isValid(existingData.city)) {
          userData.city = existingData.city;
      }
      
      if (user.role) userData.role = user.role;
      if (user.isVerified !== undefined) userData.isVerified = user.isVerified;
      
      await setDoc(userRef, userData, { merge: true });
    } catch (e) {
      console.error("Error in syncUserToFirestore:", e);
    }
  },

  getUserByUidFromFirestore: async (uid: string): Promise<User | null> => {
    try {
      const collections = ['Clients', 'Travailleurs', 'Agences immobilières', 'Équipements', 'Entreprises', 'Admin'];
      for (const col of collections) {
          const q = query(collection(db, col), where('userId', '==', uid), limit(1));
          const snapshot = await withTimeout(getDocs(q));
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
              id: doc.id,
              phone: data.phone || doc.id,
              ...data
            } as User;
          }
      }
    } catch (e) {
      console.error("Error fetching user by UID:", e);
    }
    return null;
  },

  getUserFromFirestore: async (name: string, phone: string): Promise<User | null> => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const userRef = doc(db, 'Clients', sanitizedPhone);
    
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
            } as User;
        }
      }
    } catch (e) {
      console.error("Error in getUserFromFirestore:", e);
    }
    return null;
  },

  getUserByPhoneFromFirestore: async (phone: string): Promise<User | null> => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      await databaseService.ensureAuth();
      const collections = ['Clients', 'Travailleurs', 'Agences immobilières', 'Équipements', 'Entreprises', 'Admin'];
      
      const promises = collections.map(async (col) => {
          const userRef = doc(db, col, sanitizedPhone);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             return {
                id: docSnap.id,
                phone: data.phone || docSnap.id,
                ...data
             } as User;
          }
          return null;
      });

      const results = await Promise.all(promises);
      const validUsers = results.filter((u): u is User => u !== null);
      
      if (validUsers.length === 0) return null;

      // Prioritize the user with the most filled standard fields (name and city)
      return validUsers.sort((a, b) => {
          const scoreA = (a.name && !["Utilisateur", "Inconnu"].includes(a.name) ? 2 : 0) + (a.city && !["Non spécifiée", "N/A"].includes(a.city) ? 1 : 0);
          const scoreB = (b.name && !["Utilisateur", "Inconnu"].includes(b.name) ? 2 : 0) + (b.city && !["Non spécifiée", "N/A"].includes(b.city) ? 1 : 0);
          return scoreB - scoreA;
      })[0];
      
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
    const userRef = doc(db, 'Clients', sanitizedPhone);
    
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

  loginUser: async (phone: string): Promise<{user: User | null, error?: string}> => {
    const users = getUsers();
    const normalizedInputPhone = phone.replace(/\D/g, '');
    
    // 1. Check Firestore first (Source of truth)
    console.log("Checking Firestore for user:", normalizedInputPhone);
    const firestoreUser = await databaseService.getUserByPhoneFromFirestore(normalizedInputPhone);
    
    if (firestoreUser) {
        const user = {
            ...firestoreUser,
            role: firestoreUser.role || 'Client'
        };
        
        // Update local cache
        const existingIndex = users.findIndex(u => u.phone === normalizedInputPhone);
        if (existingIndex !== -1) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }
        saveUsers(users);
        
        // Sync their data
        await databaseService.syncUserDataFromCloud(user);
        await databaseService.logConnection(user);
        databaseService.saveActiveUser(user);
        return { user };
    }
    
    // 2. Fallback to localStorage
    let localUser = users.find(u => u.phone === normalizedInputPhone);
    
    if (localUser) {
      await databaseService.logConnection(localUser);
      databaseService.saveActiveUser(localUser);
      return { user: localUser };
    }
    
    return { user: null, error: "Numéro non reconnu, veuillez vous inscrire" };
  },

  registerUser: async (name: string, city: string, phone: string): Promise<{user: User | null, error?: string}> => {
    const users = getUsers();
    const normalizedPhone = phone.replace(/\D/g, '');
    
    // 1. Check if user already exists
    const existingUser = await databaseService.getUserByPhoneFromFirestore(normalizedPhone);
    if (existingUser) {
        return { user: null, error: "Ce numéro existe déjà, veuillez vous connecter" };
    }

    const localUser = users.find(u => u.phone === normalizedPhone);
    if (localUser) {
        return { user: null, error: "Ce numéro existe déjà, veuillez vous connecter" };
    }

    const newUser: User = { 
        name: name.trim(), 
        city: city.trim(), 
        phone: normalizedPhone,
        role: localStorage.getItem('filant_user_role') || 'Client',
    };
    
    users.push(newUser);
    saveUsers(users);
    databaseService.saveActiveUser(newUser);
    
    // Sync to Firestore
    databaseService.syncUserToFirestore(newUser);
    databaseService.logConnection(newUser);
    
    return { user: newUser };
  },

  resetPin: async (phone: string, newPin: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const userRef = doc(db, 'Clients', normalizedPhone);
    
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
        'Clients',
        'Connexions',
        'Messagerie',
        'MessagerieAssistant',
        'MessageriePrivee',
        'Scanner',
        'Paiements',
        'Travailleurs',
        'Agences immobilières',
        'Équipements',
        'Entreprises'
      ];

      for (const colName of collectionsToClear) {
        try {
          const colRef = collection(db, colName);
          const snapshot = await getDocs(colRef);
          
          const batch = writeBatch(db);
          let deleteCount = 0;
          
          snapshot.forEach((doc) => {
            if ((colName === 'Clients' || colName === 'Admin') && doc.id === ADMIN_PHONE) {
              return;
            }
            batch.delete(doc.ref);
            deleteCount++;
          });
          
          if (deleteCount > 0) {
            await batch.commit();
            console.log(`Deleted ${deleteCount} documents from ${colName}.`);
          }
        } catch (colErr) {
          console.warn(`Error clearing collection ${colName}, maybe it doesn't exist yet.`);
        }
      }

      // Also clear RTDB
      try {
          await set(rtdbRef(rtdb, 'Scanner'), null);
          await set(rtdbRef(rtdb, 'Paiements'), null);
          console.log("RTDB Scanner and Paiements cleared.");
      } catch (rtdbErr) {
          console.warn("Error clearing RTDB paths.");
      }

      // 2. Ensure Admin exists
      const adminRef = doc(db, 'Clients', ADMIN_PHONE);
      const adminData: User = {
        name: 'Mael',
        city: 'Bassam',
        phone: ADMIN_PHONE,
        pin: '0661',
        role: 'Admin 225',
        isVerified: true,
        status: 'active'
      };
      
      await setDoc(adminRef, {
        ...adminData,
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      }, { merge: true });
      
      localStorage.clear();
      console.log("Database cleanup and local reset completed.");
      return true;
    } catch (e) {
      console.error("Error during database cleanup:", e);
      return false;
    }
  },
  
  saveInscription: async (inscriptionData: any) => {
    try {
      await databaseService.ensureAuth();
      const inscrRef = collection(db, 'Inscriptions');
      await addDoc(inscrRef, {
        ...inscriptionData,
        timestamp: serverTimestamp(),
        status: 'pending',
        adminReadStatus: 'NON LU'
      });
      console.log("Inscription saved successfully");
      return true;
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'Inscriptions');
        return false;
    }
  },

  updateQRCodeActivation: async (userId: string, data: any) => {
    try {
      const sanitizedPhone = userId.replace(/\D/g, '');
      const activationRef = doc(db, 'QRCodeActivations', sanitizedPhone);
      await setDoc(activationRef, {
        ...data,
        userId: sanitizedPhone,
        updatedAt: serverTimestamp(),
        adminReadStatus: 'NON LU'
      }, { merge: true });
      
      // Also update user profile for easy access
      const userRef = doc(db, 'Clients', sanitizedPhone);
      await updateDoc(userRef, {
        qrCodeStatus: data.status,
        fraisDossierPayes: data.fraisDossierPayes || false,
        qrCodeExpiryDate: data.expiryDate || null
      });
      
      return true;
    } catch (e) {
      console.error("Error updating QR Code Activation:", e);
      return false;
    }
  },

  getQRCodeActivation: async (userId: string) => {
    try {
      const sanitizedPhone = userId.replace(/\D/g, '');
      const activationRef = doc(db, 'QRCodeActivations', sanitizedPhone);
      const snap = await getDoc(activationRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (e) {
      console.error("Error fetching QR Code Activation:", e);
      return null;
    }
  },

  getInscriptions: async () => {
    try {
      const q = query(collection(db, 'Inscriptions'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'Inscriptions');
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
        const userRef = doc(db, 'Clients', sanitizedPhone);
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

  saveContacts: async (phone: string, contacts: SavedContact[], user?: User) => {
      const key = getScopedKey(phone, CONTACTS_KEY_PREFIX);
      localStorage.setItem(key, JSON.stringify(contacts));

      // Sync to RTDB if user info is provided
      if (user) {
          try {
              const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);
              const displayName = isValid(user.name) ? user.name : (localStorage.getItem('filant_last_valid_name') || 'Utilisateur');
              
              const sanitizedUserName = (displayName || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
              const sanitizedPhone = user.phone.replace(/\D/g, '');
              const userKey = `${sanitizedUserName}_${sanitizedPhone}`;
              const contactsRef = rtdbRef(rtdb, `Scanner/${userKey}`);
              
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

              await set(contactsRef, {
                  contacts: contactsObject,
                  lastUsername: displayName,
                  lastPhone: user.phone,
                  lastUpdated: rtdbTimestamp()
              });
              console.log("Scanned contacts synced to RTDB for:", userKey);
          } catch (e) {
              console.error("Error syncing scanned contacts to RTDB:", e);
          }
      }
  },

  saveIndividualScan: async (user: User, contact: SavedContact) => {
    if (!user || !contact) return;
    try {
        const sanitizedPhone = user.phone.replace(/\D/g, '');
        const scanData = {
            ...contact,
            scannerUser: user.name || 'Inconnu',
            scannerPhone: sanitizedPhone,
            timestamp: serverTimestamp(),
            syncedAt: Date.now(),
            adminReadStatus: 'NON LU'
        };

        // 1. Enregistrement dans Firestore (Base de données principale)
        const scansRef = collection(db, 'HistoriqueScans');
        await addDoc(scansRef, scanData);

        // 2. Enregistrement optionnel dans MessageriePrivee pour l'admin (comme demandé dans Request 1)
        // L'admin verra le scan dans sa liste de messages
        await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, {
            ...scanData,
            type: 'qr_scan_notification',
            message: `Nouveau scan QR effectué: ${contact.name} (${contact.title})`
        });

        console.log("Individual scan saved to Firestore and notify admin");
        return true;
    } catch (e) {
        console.error("Error saving individual scan:", e);
        return false;
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
      // Logic removed as we now use saveAssistantChatMessage or savePrivateChatMessage specifically.
      // Keeping this as a shell to prevent breakage in legacy code, redirecting to Assistant as default.
      const chatUserId = phone.replace(/\D/g, '');
      databaseService.saveAssistantChatMessage(chatUserId, message);
  },

  syncChatMessageToFirestore: async (phone: string, message: StoredChatMessage) => {
    // Deprecated: use saveTypedChatMessage instead
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
      const notifRef = collection(db, 'Clients', sanitizedPhone, 'notifications');
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
    const q = query(collection(db, 'Clients', sanitizedPhone, 'notifications'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
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
      const notifRef = doc(db, 'Clients', sanitizedPhone, 'notifications', notificationId);
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
      const notifRef = doc(db, 'Clients', sanitizedPhone, 'notifications', notificationId);
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
      const notifRef = collection(db, 'Clients', sanitizedPhone, 'notifications');
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

  saveAssistantRequest: async (requestData: any) => {
    const userId = (requestData.phone || requestData.userId || '').replace(/\D/g, '');
    return databaseService.saveTypedChatMessage('Assistant', userId, {
      ...requestData,
      type: 'assistant_request'
    });
  },

  savePaymentToRTDB: async (paymentData: any): Promise<string | null> => {
    try {
      const { userName, userId, amount, title, paymentType, phone, city, waveNumber } = paymentData;
      const sanitizedName = (userName || 'Utilisateur').replace(/[.#$[\]/]/g, '_');
      const userKey = sanitizedName + "_" + (userId || phone || 'Inconnu').replace(/\D/g, '');
      const paymentsRef = rtdbRef(rtdb, `Paiements/${userKey}`);
      const newPaymentRef = push(paymentsRef);
      
      const rtdbPath = `Paiements/${userKey}/${newPaymentRef.key}`;

      // Ensure key names match what AdminDashboard expects
      await set(newPaymentRef, { 
        ...paymentData, 
        userPhone: phone || userId,
        waveNumber: waveNumber || 'N/A',
        status: 'Paiement non validé',
        adminReadStatus: 'NON LU',
        rtdbPath: rtdbPath,
        timestamp: rtdbTimestamp() 
      });
      console.log("Payment synced to RTDB:", title);
      return rtdbPath;
    } catch (e) {
      console.error("Error saving payment to RTDB:", e);
      return null;
    }
  },

  validatePaymentStatus: async (payment: any) => {
    if (!payment.rtdbPath) return;
    try {
      await update(rtdbRef(rtdb, payment.rtdbPath), {
        status: 'Paiement validé',
        adminReadStatus: 'LU'
      });

      // Send automatic message to user
      const userPhone = (payment.userPhone || '').replace(/\D/g, '');
      const userId = (payment.userId || userPhone).replace(/\D/g, '');
      
      if (userId) {
        // Send to BOTH Assistant and Privee to be sure user sees it
        const msg = {
          text: "Votre paiement a été validé avec succès. Votre mise en relation est maintenant active.",
          sender: 'admin',
          timestamp: new Date().toISOString(),
          isRead: false,
          adminReadStatus: 'LU'
        };
        await databaseService.saveTypedChatMessage('Assistant', userId, msg);
        await databaseService.saveTypedChatMessage('Privee', userId, msg);
      }
    } catch (e) {
      console.error("Error validating payment:", e);
    }
  },

  invalidatePaymentStatus: async (payment: any) => {
    if (!payment.rtdbPath) return;
    try {
      await update(rtdbRef(rtdb, payment.rtdbPath), {
        status: 'Paiement non validé',
        adminReadStatus: 'LU'
      });
    } catch (e) {
      console.error("Error invalidating payment:", e);
    }
  },

  // --- DUMMIES & RESTORED FUNCTIONS FOR CLIENT-SIDE STABILITY ---
  onUnreadAssistantMessagesCount: (chatUserId: string, callback: (count: number) => void) => {
    return databaseService.onUnreadTypedMessagesCount('Assistant', chatUserId, callback);
  },

  onUnreadPrivateMessagesCount: (chatUserId: string, callback: (count: number) => void) => {
    return databaseService.onUnreadTypedMessagesCount('Privee', chatUserId, callback);
  },

  onUnreadTypedMessagesCount: (type: 'Assistant' | 'Privee', chatUserId: string, callback: (count: number) => void) => {
    const userId = chatUserId.replace(/\D/g, '');
    const collectionName = `Messagerie${type}`;
    const q = query(
      collection(db, collectionName, userId, 'messages'),
      where('sender', '==', 'admin'),
      where('isRead', '==', false)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    }, (error) => console.error(`Unread ${type} messages count error:`, error));
  },

  onUnreadMessagesCount: (chatUserId: string, callback: (count: number) => void) => {
    // Default main counter for Private Messages (Tab 4)
    return databaseService.onUnreadPrivateMessagesCount(chatUserId, callback);
  },

  saveServiceRequest: async (requestData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'ServiceRequests'), {
        ...requestData,
        timestamp: serverTimestamp(),
        adminReadStatus: 'NON LU'
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving service request:", error);
      throw error;
    }
  },

  saveAssistantChatMessage: async (chatUserId: string, message: any) => {
    return databaseService.saveTypedChatMessage('Assistant', chatUserId, message);
  },

  savePrivateChatMessage: async (chatUserId: string, message: any) => {
    return databaseService.saveTypedChatMessage('Privee', chatUserId, message);
  },

  saveTypedChatMessage: async (type: 'Assistant' | 'Privee', chatUserId: string, message: any) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const user = databaseService.getActiveUser();
      const collectionName = `Messagerie${type}`;
      
      const isValid = (val: string | undefined) => val && !['Utilisateur', 'Inconnu', 'Non spécifiée', 'N/A', ''].includes(val);
      
      let finalName = 'Utilisateur';
      if (isValid(user?.name)) finalName = user!.name;
      else if (isValid(message.userName)) finalName = message.userName;
      
      let finalCity = 'Non spécifiée';
      if (isValid(user?.city)) finalCity = user!.city;
      else if (isValid(message.city)) finalCity = message.city;

      // Use a consistent ID across collections
      const msgId = message.id || `${message.sender}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const docData = {
        ...message,
        id: msgId,
        userId: userId,
        userName: finalName,
        phone: user?.phone || userId,
        city: finalCity,
        timestamp: serverTimestamp(),
        isRead: false,
        adminReadStatus: 'NON LU'
      };

      // 1. Save to the user's specific conversation for sync across devices
      await setDoc(doc(db, collectionName, userId, 'messages', msgId), docData);
      
      // 2. Save to the global history for admin overview ONLY if it's from user or a form
      if (message.sender === 'user' || message.type === 'assistant_request' || message.type === 'form_submission' || message.type === 'status_submission') {
        await setDoc(doc(db, collectionName, msgId), {
          ...docData,
          chatType: type
        });
      }

      // 3. Reset typing status when a message is sent
      const sender = message.sender || 'user';
      databaseService.setTypingStatus(type, userId, sender, false);

      return true;
    } catch (e) {
      console.error(`Error saving ${type} chat message:`, e);
      return false;
    }
  },

  onTotalUnreadAdminMessagesCount: (callback: (count: number) => void) => {
    try {
      // We listen to the global collections for 'NON LU' messages
      const qAssistant = query(collection(db, 'MessagerieAssistant'), where('adminReadStatus', '==', 'NON LU'));
      const qPrivate = query(collection(db, 'MessageriePrivee'), where('adminReadStatus', '==', 'NON LU'));
      
      let assistantUnread = 0;
      let privateUnread = 0;

      const unsubA = onSnapshot(qAssistant, (snap) => {
        assistantUnread = snap.size;
        callback(assistantUnread + privateUnread);
      });

      const unsubP = onSnapshot(qPrivate, (snap) => {
        privateUnread = snap.size;
        callback(assistantUnread + privateUnread);
      });

      return () => {
        unsubA();
        unsubP();
      };
    } catch (e) {
      console.error("Error listening to total admin unread count:", e);
      return () => {};
    }
  },

  setTypingStatus: (type: 'Assistant' | 'Privee', userId: string, sender: 'user' | 'admin', isTyping: boolean) => {
    try {
      const typingRef = rtdbRef(rtdb, `TypingStatus/${type}/${userId}/${sender}`);
      set(typingRef, isTyping);
    } catch (e) {
      console.error("Error setting typing status:", e);
    }
  },

  uploadIdDocument: async (userId: string, side: 'front' | 'back', imageData: string) => {
    try {
      // In this environment, we use Firestore to store the base64 string directly 
      // or we can simulate storage if needed. Since we don't have a dedicated storage service 
      // initialized, we'll store the compressed base64 in a dedicated collection or field.
      const sanitizedPhone = userId.replace(/\D/g, '');
      const userRef = doc(db, 'Utilisateurs', sanitizedPhone);
      
      const fieldName = side === 'front' ? 'idCardFront' : 'idCardBack';
      
      // 1. Upload to Firebase Storage
      const storagePath = `ID_Documents/${sanitizedPhone}/${side}_${Date.now()}.jpg`;
      const downloadUrl = await databaseService.uploadFile(imageData, storagePath);
      
      // 2. Save URL to Firestore
      await setDoc(userRef, {
        [fieldName]: downloadUrl,
        idCardUploadedAt: serverTimestamp(),
        idCardStatus: 'EN ATTENTE'
      }, { merge: true });

      return downloadUrl;
    } catch (e) {
      console.error(`Error uploading ID document (${side}):`, e);
      return null;
    }
  },

  uploadUserProfileImage: async (phone: string, imageData: string) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      
      // Find the user's collection (Clients, Travailleurs, etc.)
      const userResult = await databaseService.getUserByPhoneFromFirestore(sanitizedPhone);
      if (!userResult) throw new Error('User not found');
      
      const targetCollection = userResult.role === 'Admin 225' ? 'Admin' : 
                             (userResult.role === 'Conseiller' ? 'Conseiller' : 
                             (userResult.role === 'Agence immobilière' ? 'Agences immobilières' :
                             (userResult.role === 'Équipements' ? 'Équipements' :
                             (userResult.role === 'Entreprise' ? 'Entreprises' : 'Clients'))));

      // 1. Upload to Firebase Storage
      const storagePath = `Profiles/${sanitizedPhone}/avatar_${Date.now()}.jpg`;
      const downloadUrl = await databaseService.uploadFile(imageData, storagePath);
      
      // 2. Save URL to Firestore
      const userRef = doc(db, targetCollection, sanitizedPhone);
      await updateDoc(userRef, {
        profileImageUrl: downloadUrl,
        updatedAt: serverTimestamp()
      });

      return downloadUrl;
    } catch (e) {
      console.error("Error uploading user profile image:", e);
      return null;
    }
  },

  onTypingStatusChange: (type: 'Assistant' | 'Privee', userId: string, sender: 'user' | 'admin', callback: (isTyping: boolean) => void) => {
    try {
      const typingRef = rtdbRef(rtdb, `TypingStatus/${type}/${userId}/${sender}`);
      return onValue(typingRef, (snapshot) => {
        callback(!!snapshot.val());
      });
    } catch (e) {
      console.error("Error listening to typing status:", e);
      return () => {};
    }
  },

  deleteMultipleTypedChatMessages: async (type: 'Assistant' | 'Privee', chatUserId: string, messageIds: string[]) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const collectionName = `Messagerie${type}`;
      const batch = writeBatch(db);
      
      messageIds.forEach(id => {
        // Delete from user subcollection
        batch.delete(doc(db, collectionName, userId, 'messages', id));
        // Delete from global collection
        batch.delete(doc(db, collectionName, id));
      });
      
      await batch.commit();
      return true;
    } catch (e) {
      console.error(`Error deleting multiple ${type} messages:`, e);
      return false;
    }
  },

  onAssistantChatUpdate: (chatUserId: string, callback: (messages: any[]) => void) => {
    return databaseService.onTypedChatUpdate('Assistant', chatUserId, callback);
  },

  onPrivateChatUpdate: (chatUserId: string, callback: (messages: any[]) => void) => {
    return databaseService.onTypedChatUpdate('Privee', chatUserId, callback);
  },

  onTypedChatUpdate: (type: 'Assistant' | 'Privee', chatUserId: string, callback: (messages: any[]) => void) => {
    const userId = chatUserId.replace(/\D/g, '');
    const collectionName = `Messagerie${type}`;
    const q = query(
      collection(db, collectionName, userId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Always use the Firestore document ID for CRUD operations
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now())
        };
      });
      callback(msgs);
    }, (error) => console.error(`${type} Chat sync error:`, error));
  },

  markAssistantMessagesAsRead: async (chatUserId: string, side: 'user' | 'admin') => {
    return databaseService.markTypedMessagesAsRead('Assistant', chatUserId, side);
  },

  markPrivateMessagesAsRead: async (chatUserId: string, side: 'user' | 'admin') => {
    return databaseService.markTypedMessagesAsRead('Privee', chatUserId, side);
  },

  markTypedMessagesAsRead: async (type: 'Assistant' | 'Privee', chatUserId: string, side: 'user' | 'admin') => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const collectionName = `Messagerie${type}`;
      const q = query(
        collection(db, collectionName, userId, 'messages'),
        where('sender', '==', side),
        where(side === 'user' ? 'adminReadStatus' : 'isRead', '==', side === 'user' ? 'NON LU' : false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(d => {
        const updateData: any = {};
        if (side === 'user') {
          updateData.adminReadStatus = 'VU';
        } else {
          updateData.isRead = true;
        }
        
        // Update subcollection docs
        batch.update(d.ref, updateData);
        
        // Update global collection docs
        batch.update(doc(db, collectionName, d.id), updateData);
      });
      
      await batch.commit();
    } catch (e) {
      console.warn(`Error in markTypedMessagesAsRead for ${type}:`, e);
    }
  },

  deleteAssistantChatMessage: async (chatUserId: string, messageId: string) => {
    return databaseService.deleteTypedChatMessage('Assistant', chatUserId, messageId);
  },

  clearAssistantChatHistory: async (chatUserId: string) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const messagesRef = collection(db, 'MessagerieAssistant', userId, 'messages');
      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      return true;
    } catch (e) {
      console.error("Error clearing assistant chat history in Firebase:", e);
      return false;
    }
  },

  deletePrivateChatMessage: async (chatUserId: string, messageId: string) => {
    return databaseService.deleteTypedChatMessage('Privee', chatUserId, messageId);
  },

  deleteTypedChatMessage: async (type: 'Assistant' | 'Privee', chatUserId: string, messageId: string) => {
    try {
      const userId = chatUserId.replace(/\D/g, '');
      const collectionName = `Messagerie${type}`;
      const batch = writeBatch(db);
      batch.delete(doc(db, collectionName, userId, 'messages', messageId));
      batch.delete(doc(db, collectionName, messageId));
      await batch.commit();
      return true;
    } catch (e) { return false; }
  },

  saveFormSubmission: async (formData: any) => {
    const userId = (formData.userPhone || formData.phone || '').replace(/\D/g, '');
    return databaseService.saveTypedChatMessage('Privee', userId, {
      ...formData,
      type: formData.type || 'form_submission'
    });
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

  publishStatusAsMessage: async (phone: string, data: any) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    return databaseService.saveTypedChatMessage('Privee', sanitizedPhone, {
        userId: sanitizedPhone,
        userName: data.name,
        phone: sanitizedPhone,
        city: data.city || "Non spécifiée",
        formTitle: "Demande de service / Inscription",
        whatsappMessage: `Service: ${data.service}\nDescription: ${data.description}\nPrix: ${data.price || 'À discuter'}`,
        type: 'status_submission'
    });
  },

  savePlacement: async (data: any, additional?: any) => {
    // Pro logic removed
    return true;
  }
};
