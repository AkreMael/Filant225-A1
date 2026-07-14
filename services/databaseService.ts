import { User, Worker, Offer, FavoriteRequest, PersonalRequest, Notification } from '../types';
import { db, auth, rtdb, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc, getDoc, onSnapshot, writeBatch, updateDoc, where, limit, increment } from 'firebase/firestore';
import { ref as rtdbRef, push, set, serverTimestamp as rtdbTimestamp, get, update, onValue, remove, child } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

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

const convertFileOrBlobToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('FileReader is only available in the browser'));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlob);
    });
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
  { name: 'Vendeuse', description: 'Assure la vente, l’accueil des clients et la gestion d’une boutique.', category: 'Disponible' },
  { name: 'Cuisinier', description: 'Prépare les repas pour restaurant, foyer, entreprise ou événements.', category: 'Disponible' },
  { name: 'Serveur', description: 'Accueille les clients, sert les plats et s’occupe des commandes.', category: 'Disponible' },
  { name: 'Coiffeur Homme', description: 'Coupes et coiffures masculines, entretien barbe.', category: 'Disponible' },
  { name: 'Coiffeuse Femme', description: 'Tresses, tissages, tressages africains et soins capillaires féminins.', category: 'Disponible' },
  { name: 'Hôtesse d’accueil', description: 'Accueille les visiteurs, gère les informations et la réception.', category: 'Disponible' },
  { name: 'Chauffeur', description: '(Taxi, VTC, Entreprise) Conduit les clients ou le personnel d’un lieu à un autre.', category: 'Disponible' },
  { name: 'Agent d’entretien', description: 'Nettoyeur professionnel de bureaux et locaux.', category: 'Disponible' },
  { name: 'Femme de ménage', description: 'Entretien ménager rigoureux et soins à domicile.', category: 'Disponible' },
  { name: 'Caissier', description: 'Gère les paiements, la caisse et l’accueil dans les commerces.', category: 'Disponible' },
  { name: 'Réceptionniste', description: 'Accueille les clients dans hôtels, entreprises ou agences.', category: 'Disponible' },
  { name: 'Baby-sitter', description: 'Garde les enfants de façon ponctuelle ou régulière.', category: 'Disponible' },
  { name: 'Jardinier', description: 'Entretient les jardins, pelouses, fleurs et espaces verts.', category: 'Disponible' },
  { name: 'Couturier', description: 'Coupe, confectionne et retouche des vêtements.', category: 'Disponible' },
  { name: 'Esthéticienne', description: 'Fait les soins du visage, manucure, pédicure, beauté.', category: 'Disponible' },
  { name: 'Magasinier', description: 'Gère les stocks, rangement et réception des marchandises.', category: 'Disponible' },
  { name: 'Manutentionnaire', description: 'Charge, décharge et organise les marchandises.', category: 'Disponible' },
  { name: 'Agent de sécurité', description: 'Assure la sécurité et la surveillance d’un commerce, bâtiment ou d’une résidence.', category: 'Disponible' },
  { name: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres et surfaces vitrées.', category: 'Disponible' },
  { name: 'Technicien entretien climatisation Rapide', description: 'Entretien, nettoyage et recharge de climatiseurs.', category: 'Disponible' },
  { name: 'Installateur de caméras de surveillance Rapide', description: 'Installation et configuration de systèmes de vidéosurveillance.', category: 'Disponible' },
  { name: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs et coussins.', category: 'Disponible' },
  { name: 'Installateur de fenêtres et portes vitrées Rapide', description: 'Pose de menuiserie aluminium et vitrerie.', category: 'Disponible' },
  { name: 'Menuisier Rapide', description: 'Travaux de menuiserie bois et réparation de meubles.', category: 'Disponible' },
  { name: 'Aide à domicile', description: 'Services humains', category: 'Disponible' },
  { name: 'Garde malade (jour / nuit)', description: 'Services humains', category: 'Disponible' },
  { name: 'MANUCURE À DOMICILE RAPIDE', description: 'Soin et mise en beauté des mains et des pieds à domicile.', category: 'Disponible' },
  { name: 'ESTHÉTICIENNE-MASSAGE', description: 'Soins esthétiques du corps et du visage, massages de bien-être.', category: 'Disponible' },
  { name: 'MAQUILLEUSE PROFESSIONNELLE', description: 'Maquillage professionnel pour mariages, soirées et événements.', category: 'Disponible' },
  { name: 'Pâtissier', description: 'Création et préparation de pâtisseries artisanales pour événements et au quotidien.', category: 'Disponible' },
  { name: 'Vente en ligne', description: 'Vend des produits via internet.', category: 'Commerce & Vente' },
  { name: 'Grossiste', description: 'Fournit des produits en grande quantité aux commerçants.', category: 'Commerce & Vente' },
  { name: 'Vente de vêtements', description: 'Propose des vêtements à la vente aux clients.', category: 'Commerce & Vente' },
  { name: 'Restaurateur', description: 'Prépare et cuisine des plats pour les clients.', category: 'Services' },
  { name: 'Décorateur intérieur', description: 'Aménage et décore des espaces intérieurs.', category: 'Bâtiment & Construction' },
  { name: 'Pose de faux plafond', description: 'Installe des plafond suspendus dans les maisons ou bureaux.', category: 'Bâtiment & Construction' },
  { name: 'Community manager', description: 'Gère les réseaux sociaux pour les entreprises ou projets.', category: 'Numérique & Internet' },
  { name: 'Photographe', description: 'Prend des photos pour événements ou projets.', category: 'Numérique & Internet' },
  { name: 'Vidéaste', description: 'Réalise de superbes vidéos pour vos événements.', category: 'Numérique & Internet' },
  { name: 'Monteur', description: 'Monte des vidéos et films de tout format.', category: 'Numérique & Internet' },
  { name: 'Manucure', description: 'S’occupe des soins de mise en beauté esthétique de vos mains.', category: 'Beauté & Bien-être' },
  { name: 'Pédicure', description: 'S’occupe des soins d’hygiène et d’esthétique de vos pieds.', category: 'Beauté & Bien-être' },
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

      // Direct check for Admin phone to bypass collections searching completely
      if (sanitizedPhone === '0705052632') {
          const adminCollections = ['Admin', 'Clients'];
          for (const col of adminCollections) {
              const userRef = doc(db, col, sanitizedPhone);
              const docSnap = await getDoc(userRef);
              if (docSnap.exists()) {
                 const data = docSnap.data();
                 localStorage.setItem(`filant_user_collection_${sanitizedPhone}`, col);
                 return {
                    id: docSnap.id,
                    phone: data.phone || docSnap.id,
                    ...data
                 } as User;
              }
          }
      }

      // Try cached collection first for sub-millisecond retrieval
      const cachedCol = localStorage.getItem(`filant_user_collection_${sanitizedPhone}`);
      if (cachedCol) {
          const userRef = doc(db, cachedCol, sanitizedPhone);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             return {
                id: docSnap.id,
                phone: data.phone || docSnap.id,
                ...data
             } as User;
          }
      }

      const collections = ['Clients', 'Travailleurs', 'Agences immobilières', 'Équipements', 'Entreprises', 'Admin'];
      
      const promises = collections.map(async (col) => {
          const userRef = doc(db, col, sanitizedPhone);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             return {
                id: docSnap.id,
                phone: data.phone || docSnap.id,
                colName: col,
                ...data
             } as unknown as User;
          }
          return null;
      });

      const results = await Promise.all(promises);
      const validUsers = results.filter((u): u is User => u !== null);
      
      if (validUsers.length === 0) return null;

      // Prioritize the user with the most filled standard fields (name and city)
      const bestUser = validUsers.sort((a, b) => {
          const scoreA = (a.name && !["Utilisateur", "Inconnu"].includes(a.name) ? 2 : 0) + (a.city && !["Non spécifiée", "N/A"].includes(a.city) ? 1 : 0);
          const scoreB = (b.name && !["Utilisateur", "Inconnu"].includes(b.name) ? 2 : 0) + (b.city && !["Non spécifiée", "N/A"].includes(b.city) ? 1 : 0);
          return scoreB - scoreA;
      })[0];

      if (bestUser && (bestUser as any).colName) {
          localStorage.setItem(`filant_user_collection_${sanitizedPhone}`, (bestUser as any).colName);
      }

      return bestUser;
      
    } catch (e) {
      console.error("Error in getUserByPhoneFromFirestore:", e);
    }
    return null;
  },

  syncUserDataFromCloud: async (user: User) => {
    if (!user.phone) return;
    
    // Sync Scanned Contacts from RTDB
    try {
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
    
    // 0. Quick connect via local cached user to guarantee sub-millisecond connection
    const localUser = users.find(u => u.phone === normalizedInputPhone);
    if (localUser) {
        console.log("Instant login via local cache for:", normalizedInputPhone);
        
        // Save to active user
        databaseService.saveActiveUser(localUser);
        
        // Log connection in the background non-blockingly
        databaseService.logConnection(localUser);
        databaseService.syncUserDataFromCloud(localUser);

        // Perform non-blocking Firestore sync in the background
        databaseService.getUserByPhoneFromFirestore(normalizedInputPhone).then((firestoreUser) => {
            if (firestoreUser) {
                const updatedUser = {
                    ...firestoreUser,
                    role: firestoreUser.role || 'Client'
                };
                const latestUsers = getUsers();
                const existingIndex = latestUsers.findIndex(u => u.phone === normalizedInputPhone);
                if (existingIndex !== -1) {
                    latestUsers[existingIndex] = { ...latestUsers[existingIndex], ...updatedUser };
                } else {
                    latestUsers.push(updatedUser);
                }
                saveUsers(latestUsers);
                
                // If the active user matches, update their session too
                const active = databaseService.getActiveUser();
                if (active && active.phone === normalizedInputPhone) {
                    databaseService.saveActiveUser(updatedUser);
                }
            }
        }).catch(err => console.warn("Background Firestore user sync failed:", err));

        return { user: localUser };
    }
    
    // 1. Fallback to direct Firestore fetch if no local cache exists
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
        
        // Non-blocking background sync & logging
        databaseService.syncUserDataFromCloud(user);
        databaseService.logConnection(user);
        databaseService.saveActiveUser(user);
        
        return { user };
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
      const phoneRaw = inscriptionData.phone || '';
      const sanitizedPhone = phoneRaw.replace(/\D/g, '');
      
      if (sanitizedPhone) {
        // Post the user's own registration details in the chat first
        try {
          const activity = inscriptionData.job || inscriptionData.equipmentType || inscriptionData.agencyName || inscriptionData.companyName || 'Inscrit';
          const userMsg = {
            text: `📝 *Nouveau Formulaire d'Inscription Soumis*\n\nJe viens de terminer mon inscription sur FILANT°225.\n\n• *Nom :* ${inscriptionData.name || 'Utilisateur'}\n• *Ville :* ${inscriptionData.city || 'Non spécifiée'}\n• *Type de Profil :* ${inscriptionData.profileType || 'Inscrit'}\n• *Activité/Catégorie :* ${activity}`,
            sender: 'user',
            type: 'inscription_submission'
          };
          await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, userMsg);
        } catch (msgErr) {
          console.error("Error sending user inscription message to chat:", msgErr);
        }

        const docRef = doc(db, 'Inscriptions', sanitizedPhone);
        await setDoc(docRef, {
          ...inscriptionData,
          timestamp: serverTimestamp(),
          status: 'pending',
          adminReadStatus: 'NON LU'
        });
        console.log("Inscription saved/updated successfully for profile:", sanitizedPhone);

        // Trigger evolution update
        databaseService.triggerEvolutionUpdate(sanitizedPhone);

        // Send automated message on registration completion with 1.2s delay to preserve proper chat sequence
        setTimeout(async () => {
          try {
            const autoMsg = {
              text: "Merci pour votre inscription. Votre dossier a bien été reçu. Nous allons examiner vos informations et vous contacter dans les meilleurs délais. Veuillez suivre les différentes étapes de l'application pour finaliser votre mise en relation.",
              sender: 'admin',
              isRead: false,
              adminReadStatus: 'LU'
            };
            await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, autoMsg);
          } catch (msgErr) {
            console.error("Error sending auto message after inscription:", msgErr);
          }
        }, 1250);

        return true;
      } else {
        const inscrRef = collection(db, 'Inscriptions');
        await addDoc(inscrRef, {
          ...inscriptionData,
          timestamp: serverTimestamp(),
          status: 'pending',
          adminReadStatus: 'NON LU'
        });
        console.log("Inscription saved successfully (fallback with addDoc)");

        // Send automated message for fallback if phone is present
        if (phoneRaw) {
          try {
            const activity = inscriptionData.job || inscriptionData.equipmentType || inscriptionData.agencyName || inscriptionData.companyName || 'Inscrit';
            const userMsg = {
            text: `📝 *Nouveau Formulaire d'Inscription Soumis*\n\nJe viens de terminer mon inscription sur FILANT°225.\n\n• *Nom :* ${inscriptionData.name || 'Utilisateur'}\n• *Ville :* ${inscriptionData.city || 'Non spécifiée'}\n• *Type de Profil :* ${inscriptionData.profileType || 'Inscrit'}\n• *Activité/Catégorie :* ${activity}`,
            sender: 'user',
            type: 'inscription_submission'
          };
          await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, userMsg);

          setTimeout(async () => {
            try {
              const autoMsg = {
                text: "Merci pour votre inscription. Votre dossier a bien été reçu. Nous allons examiner vos informations et vous contacter dans les meilleurs délais. Veuillez suivre les différentes étapes de l'application pour finaliser votre mise en relation.",
                sender: 'admin',
                isRead: false,
                adminReadStatus: 'LU'
              };
              await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, autoMsg);
            } catch (msgErr) {
                console.error("Error sending auto message after inscription fallback:", msgErr);
              }
            }, 1250);
          } catch (msgErr) {
            console.error("Error sending user registration message fallback to chat:", msgErr);
          }
        }

        return true;
      }
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
      await setDoc(userRef, {
        qrCodeStatus: data.status,
        fraisDossierPayes: data.fraisDossierPayes || false,
        qrCodeExpiryDate: data.expiryDate || null
      }, { merge: true });
      
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

  getUserInscription: async (phone: string) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(db, 'Inscriptions', sanitizedPhone);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (e) {
      console.error("Error fetching user inscription:", e);
      return null;
    }
  },

  saveOnlineAnnouncementPending: async (phone: string, adData: any) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(db, 'Inscriptions', sanitizedPhone);
      
      const existingSnap = await getDoc(docRef);
      let previousData: any = {};
      if (existingSnap.exists()) {
        previousData = existingSnap.data() || {};
      }
      
      const updatedData = {
        ...previousData,
        ...adData,
        isOnline: false,         // Keep offline until admin validates
        onlinePending: true,      // Mark as pending
        onlineRefused: false,     // Reset refused flag
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedData, { merge: true });
      
      const profileType = adData.profileType || previousData.profileType || 'Travailleur';
      let targetCollection = '';
      if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
      else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
      else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
      else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

      if (targetCollection) {
        try {
          const profRef = doc(db, targetCollection, sanitizedPhone);
          await setDoc(profRef, {
            ...adData,
            isOnline: false,
            onlinePending: true,
            onlineRefused: false,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn(`Could not sync pending state to professional table:`, dbErr);
        }
      }

      databaseService.triggerEvolutionUpdate(sanitizedPhone);
      return true;
    } catch (e) {
      console.error("Error saving pending online ad:", e);
      return false;
    }
  },

  activateOnlineAnnouncementDirectly: async (phone: string, durationType: string, amount: number) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(db, 'Inscriptions', sanitizedPhone);
      const userInscr = await getDoc(docRef);
      let profileType = 'Travailleur';
      if (userInscr.exists()) {
        profileType = userInscr.data()?.profileType || 'Travailleur';
      }

      const isOneMonth = durationType === '1_month' || amount === 350;
      const durationMs = isOneMonth ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
      const onlineStart = Date.now();
      const onlineEnd = onlineStart + durationMs;

      const updatedFields = {
        isOnline: true,
        onlinePending: false,
        onlineApproved: true,
        onlineRefused: false,
        onlineStart,
        onlineEnd,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedFields, { merge: true });

      let targetCollection = '';
      if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
      else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
      else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
      else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

      if (targetCollection) {
        const profRef = doc(db, targetCollection, sanitizedPhone);
        await setDoc(profRef, updatedFields, { merge: true });
      }

      databaseService.triggerEvolutionUpdate(sanitizedPhone);
      return true;
    } catch (e) {
      console.error("Error activating online announcement directly:", e);
      return false;
    }
  },

  saveOnlineAnnouncementActiveModifications: async (phone: string, adData: any) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(db, 'Inscriptions', sanitizedPhone);
      
      const existingSnap = await getDoc(docRef);
      let previousData: any = {};
      if (existingSnap.exists()) {
        previousData = existingSnap.data() || {};
      }
      
      const updatedData = {
        ...previousData,
        ...adData,
        isOnline: true,
        onlinePending: false,
        onlineRefused: false,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedData, { merge: true });
      
      const profileType = adData.profileType || previousData.profileType || 'Travailleur';
      let targetCollection = '';
      if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
      else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
      else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
      else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

      if (targetCollection) {
        try {
          const profRef = doc(db, targetCollection, sanitizedPhone);
          await setDoc(profRef, {
            ...adData,
            isOnline: true,
            onlinePending: false,
            onlineRefused: false,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn(`Could not sync updated state to professional table:`, dbErr);
        }
      }

      databaseService.triggerEvolutionUpdate(sanitizedPhone);
      return true;
    } catch (e) {
      console.error("Error saving active modifications:", e);
      return false;
    }
  },

  saveOnlineAnnouncement: async (phone: string, adData: any) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(db, 'Inscriptions', sanitizedPhone);
      
      // We read the existing document to generate history of publication
      const existingSnap = await getDoc(docRef);
      let history = [];
      let previousData: any = {};
      if (existingSnap.exists()) {
        const data = existingSnap.data() || {};
        previousData = data;
        history = data.onlineHistory || [];
      }
      
      // Add current subscription details to history
      const currentConfig = {
        startDate: adData.onlineStart,
        endDate: adData.onlineEnd,
        duration: adData.onlineDuration,
        price: adData.onlinePrice,
        timestamp: Date.now()
      };
      
      // Avoid duplicate history entries for exact same start and end timestamps
      if (!history.some((h: any) => h.startDate === adData.onlineStart && h.endDate === adData.onlineEnd)) {
        history.push(currentConfig);
      }

      // Prepare combined update
      const updatedData = {
        ...previousData,
        ...adData,
        onlineHistory: history,
        isActive: true, // ensure visible in search
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedData, { merge: true });
      
      // Also update in respective professional table (Travailleurs, Équipements, Agences immobilières, Entreprises) to keep db sync'd
      const profileType = adData.profileType || previousData.profileType || 'Travailleur';
      let targetCollection = '';
      if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
      else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
      else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
      else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

      if (targetCollection) {
        try {
          const profRef = doc(db, targetCollection, sanitizedPhone);
          await setDoc(profRef, {
            ...adData,
            onlineHistory: history,
            isActive: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn(`Could not sync profile type ${profileType} in professional table:`, dbErr);
        }
      }

      // Trigger evolution update
      databaseService.triggerEvolutionUpdate(sanitizedPhone);
      
      return true;
    } catch (e) {
      console.error("Error saving online announcement:", e);
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
    console.log(`[Upload Debug] uploadFile started for path: ${path}`);
    try {
      // 1. First attempt: Upload to Firebase Storage with a strict 3500ms timeout
      try {
        const fileRef = storageRef(storage, path);
        if (typeof file === 'string') {
          console.log(`[Upload Debug] Input is string (length: ${file.length}). Uploading to Firebase Storage...`);
          await withTimeout(uploadString(fileRef, file, 'data_url'), 3500);
        } else {
          console.log(`[Upload Debug] Input is File/Blob. Uploading to Firebase Storage...`);
          await withTimeout(uploadBytes(fileRef, file), 3500);
        }
        
        const downloadUrl = await withTimeout(getDownloadURL(fileRef), 2000);
        console.log(`[Upload Debug] Firebase Storage success! URL: ${downloadUrl}`);
        return downloadUrl;
      } catch (storageError: any) {
        console.warn(`[Upload Debug] Firebase Storage failed/timed out, falling back to local server upload:`, storageError?.message || storageError);
      }

      // 2. Fallback attempt: Upload to local server /api/upload-base64
      let base64String = '';
      if (typeof file === 'string') {
        base64String = file;
      } else {
        base64String = await convertFileOrBlobToBase64(file);
      }

      // Extract raw filename
      const filename = path.split('/').pop() || `${Date.now()}_upload.jpg`;
      console.log(`[Upload Debug] Dispatching fallback to local server. Target filename: ${filename}`);

      const response = await fetch("/api/upload-base64", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64: base64String,
          filename: filename
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.url) {
          console.log(`[Upload Debug] Local fallback upload success! URL: ${result.url}`);
          return result.url;
        }
      }
      throw new Error(`Local server API responded with status ${response.status}`);
    } catch (e: any) {
      console.error(`[Upload Debug] Both Firebase Storage and local fallback upload failed completely for path: ${path}`, e);
      
      // If input was already a base64 string, return it rather than completely failing
      if (typeof file === 'string') {
        console.warn(`[Upload Debug] Returning raw string as desperate last resort fallback.`);
        return file;
      }
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

  subscribeToScannedContacts: (phone: string, callback: (contacts: SavedContact[]) => void) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const q = query(
      collection(db, 'HistoriqueScans'),
      where('scannerPhone', '==', sanitizedPhone)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          title: item.title || 'Assistant QR',
          name: item.name || 'Prestataire',
          review: item.review || item.city || '',
          phone: item.phone || 'N/A',
          city: item.city || 'Abidjan'
        } as SavedContact;
      });
      callback(docs);
    }, (error) => {
      console.error("Error subscribing to scanned contacts:", error);
    });
  },

  deleteScannedContact: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'HistoriqueScans', id));
      return true;
    } catch (e) {
      console.error("Error deleting scanned contact from Firestore:", e);
      return false;
    }
  },

  clearAllScannedContacts: async (phone: string) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const q = query(
        collection(db, 'HistoriqueScans'),
        where('scannerPhone', '==', sanitizedPhone)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch (e) {
      console.error("Error clearing all scanned contacts from Firestore:", e);
      return false;
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
        
        // Trigger evolution update for BOTH the scanner client and the scanned worker
        if (contact.phone) {
          databaseService.triggerEvolutionUpdate(contact.phone);
        }
        databaseService.triggerEvolutionUpdate(user.phone);

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
      const chatUserId = phone.replace(/\D/g, '');
      databaseService.savePrivateChatMessage(chatUserId, message);
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
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanObject(obj[key]);
        }
      });
      return cleaned;
    };
    try {
      const notifRef = collection(db, 'Clients', sanitizedPhone, 'notifications');
      await addDoc(notifRef, {
        ...cleanObject(notification),
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

  markAllNotificationsAsRead: async (phone: string) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      const notifRef = collection(db, 'Clients', sanitizedPhone, 'notifications');
      const q = query(notifRef, where('isRead', '==', false));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.update(doc.ref, { isRead: true }));
      await batch.commit();
      
      const current = databaseService.getNotifications(phone);
      const updated = current.map(n => ({ ...n, isRead: true }));
      databaseService.saveNotifications(phone, updated);
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
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
    return databaseService.saveTypedChatMessage('Privee', userId, {
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
        status: paymentData.status || 'En attente',
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
      const isDeposit = payment.paymentType === 'Dépôt' || payment.title === 'Dépôt vers le compte principal';
      const successStatus = isDeposit ? 'Dépôt validé' : 'Paiement validé';

      await update(rtdbRef(rtdb, payment.rtdbPath), {
        status: successStatus,
        adminReadStatus: 'LU'
      });

      const userPhone = (payment.userPhone || payment.phone || '').replace(/\D/g, '');
      const userId = (payment.userId || userPhone).replace(/\D/g, '');

      if (isDeposit) {
        // --- LOGIQUE SPÉCIFIQUE DÉPÔT ---
        // Guard against duplicate credit if already validated
        if (payment.status !== 'Dépôt validé' && payment.status !== 'Paiement validé') {
          const amountNum = parseFloat(payment.amount);
          if (!isNaN(amountNum) && amountNum > 0) {
            const walletRef = doc(db, 'Wallets', userPhone);
            
            // 1. Update wallet balance
            await setDoc(walletRef, {
              phone: userPhone,
              name: payment.userName || 'Utilisateur',
              city: payment.city || 'Non spécifiée',
              balance: increment(amountNum),
              updatedAt: serverTimestamp()
            }, { merge: true });

            // 2. Record transaction in account history
            await addDoc(collection(db, 'WalletTransactions'), {
              phone: userPhone,
              userName: payment.userName || 'Utilisateur',
              userCity: payment.city || 'Non spécifiée',
              type: 'DEPOSIT',
              amount: amountNum,
              paymentNumber: payment.waveNumber || 'N/A',
              status: 'SUCCESS',
              timestamp: Date.now(),
              dateStr: new Date().toLocaleString('fr-FR')
            });

            // 3. Send notification to the user
            const msg = {
              text: `🤖 DÉPÔT VALIDÉ : Un dépôt de ${amountNum.toLocaleString('fr-FR')} FCFA a été crédité avec succès sur votre Portefeuille FILANT°225. Votre solde a été mis à jour d'un montant de +${amountNum.toLocaleString('fr-FR')} FCFA.`,
              sender: 'admin',
              timestamp: new Date().toISOString(),
              isRead: false,
              adminReadStatus: 'LU'
            };
            await databaseService.saveTypedChatMessage('Privee', userPhone, msg);

            // 4. Automatic system check and target payment execution
            let pendingPaymentToProcess: any = null;
            if (payment.targetPaymentType) {
              pendingPaymentToProcess = {
                paymentType: payment.targetPaymentType,
                amount: payment.targetAmount,
                title: payment.targetTitle,
                formData: payment.targetFormData,
                serviceRequestId: payment.targetServiceRequestId || null,
                rtdbPath: null
              };
            } else {
              // Retrieve all payments from RTDB to see if any is 'En attente' and not 'Dépôt'
              try {
                const paymentsSnapshot = await get(rtdbRef(rtdb, 'Paiements'));
                if (paymentsSnapshot.exists()) {
                  const allPaymentsObj = paymentsSnapshot.val();
                  // A userKey in the RTDB is generated as sanitizedName + "_" + userPhone
                  // Let's find any userKey that ends with our userPhone
                  const matchingUserKeys = Object.keys(allPaymentsObj).filter(key => {
                    const parts = key.split('_');
                    const phonePart = parts[parts.length - 1];
                    return phonePart === userPhone;
                  });

                  for (const uKey of matchingUserKeys) {
                    const userPayments = allPaymentsObj[uKey];
                    if (userPayments) {
                      // Find the first 'En attente' payment that is not a deposit
                      const foundPushId = Object.keys(userPayments).find(pId => {
                        const payItem = userPayments[pId];
                        return payItem.status === 'En attente' && payItem.paymentType !== 'Dépôt';
                      });

                      if (foundPushId) {
                        const pendingItem = userPayments[foundPushId];
                        pendingPaymentToProcess = {
                          paymentType: pendingItem.paymentType,
                          amount: pendingItem.amount,
                          title: pendingItem.title || pendingItem.serviceType,
                          formData: pendingItem.formData || null,
                          serviceRequestId: pendingItem.serviceRequestId || null,
                          rtdbPath: `Paiements/${uKey}/${foundPushId}`,
                          id: foundPushId
                        };
                        break;
                      }
                    }
                  }
                }
              } catch (rtdbErr) {
                console.error("Error searching for pending payments in RTDB:", rtdbErr);
              }
            }

            if (pendingPaymentToProcess) {
              const targetAmountNum = parseFloat(pendingPaymentToProcess.amount || '0') || 0;
              
              // Verify wallet balance after deposit is sufficient
              const walletSnapCheck = await getDoc(walletRef);
              let updatedBalance = 0;
              if (walletSnapCheck.exists()) {
                updatedBalance = walletSnapCheck.data().balance || 0;
              }

              if (updatedBalance >= targetAmountNum && targetAmountNum > 0) {
                // Deduct from the wallet automatically
                await setDoc(walletRef, {
                  balance: increment(-targetAmountNum),
                  updatedAt: serverTimestamp()
                }, { merge: true });

                // Record transaction in wallet history
                const refCode = `REF-AUTO-${Date.now().toString(36).toUpperCase()}`;
                await addDoc(collection(db, 'WalletTransactions'), {
                  phone: userPhone,
                  userName: payment.userName || 'Utilisateur',
                  userCity: payment.city || 'Non spécifiée',
                  type: 'PAYMENT',
                  amount: -targetAmountNum,
                  paymentNumber: 'FILANT°225 PORTEFEUILLE (AUTO)',
                  description: `Paiement automatique - ${pendingPaymentToProcess.title || pendingPaymentToProcess.paymentType}`,
                  status: 'SUCCESS',
                  timestamp: Date.now(),
                  refCode,
                  dateStr: new Date().toLocaleString('fr-FR')
                });

                // Update original RTDB record to 'Paiement validé' if we found it in RTDB
                if (pendingPaymentToProcess.rtdbPath) {
                  await update(rtdbRef(rtdb, pendingPaymentToProcess.rtdbPath), {
                    status: 'Paiement validé',
                    adminReadStatus: 'LU'
                  });
                } else {
                  // Write virtual successful payment log into RTDB/Admin overview so admin can see the payment
                  await databaseService.savePaymentToRTDB({
                    userId: userPhone,
                    userName: payment.userName || 'Utilisateur',
                    phone: payment.phone || userPhone,
                    city: payment.city || 'Non spécifiée',
                    amount: pendingPaymentToProcess.amount || targetAmountNum.toString(),
                    title: pendingPaymentToProcess.title || `Notification automatique - ${pendingPaymentToProcess.paymentType}`,
                    serviceType: pendingPaymentToProcess.title || pendingPaymentToProcess.paymentType,
                    paymentType: pendingPaymentToProcess.paymentType,
                    waveNumber: 'FILANT°225 PORTEFEUILLE (AUTO)',
                    timestamp: Date.now(),
                    status: 'Paiement validé'
                  });
                }

                // Process specific activation / status logic based on target type
                const pType = pendingPaymentToProcess.paymentType;
                if (pType === 'Inscription' || targetAmountNum === 310) {
                  await databaseService.updateQRCodeActivation(userPhone, {
                    status: "En attente paiement activation (7 100 FCFA)",
                    fraisDossierPayes: true,
                    updatedAt: serverTimestamp()
                  });
                } else if (pType === 'Activation' || targetAmountNum === 7100) {
                  const expiryDate = new Date();
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  await databaseService.updateQRCodeActivation(userPhone, {
                    status: "Code QR Actif",
                    isVerified: true,
                    expiryDate: expiryDate.toISOString(),
                    activationDate: new Date().toISOString(),
                    updatedAt: serverTimestamp()
                  });
                } else if (pType === 'Renouvellement' || targetAmountNum === 500) {
                  const expiryDate = new Date();
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  await databaseService.updateQRCodeActivation(userPhone, {
                    status: "Code QR Actif",
                    expiryDate: expiryDate.toISOString(),
                    updatedAt: serverTimestamp()
                  });
                } else if (pType === 'Mise en ligne') {
                  const isOneMonth = pendingPaymentToProcess.title?.toLowerCase().includes('mois') || pendingPaymentToProcess.title?.toLowerCase().includes('350') || targetAmountNum === 350;
                  const durationMs = isOneMonth ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
                  const onlineStart = Date.now();
                  const onlineEnd = onlineStart + durationMs;

                  const docRef = doc(db, 'Inscriptions', userPhone);
                  const userInscr = await getDoc(docRef);
                  let profileType = 'Travailleur';
                  if (userInscr.exists()) {
                    profileType = userInscr.data()?.profileType || 'Travailleur';
                  }

                  const updatedFields = {
                    isOnline: true,
                    onlinePending: false,
                    onlineApproved: true,
                    onlineRefused: false,
                    onlineStart,
                    onlineEnd,
                    updatedAt: serverTimestamp()
                  };

                  await setDoc(docRef, updatedFields, { merge: true });

                  let targetCollection = '';
                  if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
                  else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
                  else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
                  else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

                  if (targetCollection) {
                    const profRef = doc(db, targetCollection, userPhone);
                    await setDoc(profRef, updatedFields, { merge: true });
                  }

                  databaseService.triggerEvolutionUpdate(userPhone);
                } else if (pType === 'Mise en relation') {
                  if (pendingPaymentToProcess.serviceRequestId) {
                    try {
                      await databaseService.triggerServiceRequestValidationFlow(
                        pendingPaymentToProcess.serviceRequestId,
                        pendingPaymentToProcess.rtdbPath || null
                      );
                    } catch (flowErr) {
                      console.error("Error running triggerServiceRequestValidationFlow in auto-payment:", flowErr);
                    }
                  } else {
                    // Fallback: search for pending service request
                    try {
                      const q = query(
                        collection(db, 'ServiceRequests'),
                        where('phone', '==', userPhone),
                        where('status', '==', 'En attente de paiement'),
                        limit(1)
                      );
                      const snap = await getDocs(q);
                      if (!snap.empty) {
                        const docId = snap.docs[0].id;
                        await databaseService.triggerServiceRequestValidationFlow(
                          docId,
                          pendingPaymentToProcess.rtdbPath || null
                        );
                      }
                    } catch (lookupErr) {
                      console.error("Error looking up service request in auto-payment fallback:", lookupErr);
                    }
                  }
                }

                // If form data or favorites should copy
                if (pendingPaymentToProcess.formData) {
                  try {
                    await databaseService.saveFavorite(userPhone, {
                      title: pendingPaymentToProcess.formData.formTitle,
                      date: new Date().toISOString(),
                      formType: pendingPaymentToProcess.formData.formType,
                      answers: pendingPaymentToProcess.formData.data,
                      userInfo: {
                        phone: payment.phone || userPhone,
                        name: payment.userName || 'Utilisateur',
                        city: payment.city || 'Non spécifiée'
                      },
                      totalPrice: targetAmountNum
                    });
                    
                    await databaseService.saveFormSubmission({
                      userPhone: userPhone,
                      formType: pendingPaymentToProcess.formData.formType,
                      formTitle: pendingPaymentToProcess.formData.formTitle,
                      data: pendingPaymentToProcess.formData.data,
                      whatsappMessage: pendingPaymentToProcess.formData.whatsappMessage
                    });
                  } catch (formErr) {
                    console.error("Error saving automatic form submission:", formErr);
                  }
                }

                // Send unified final confirmation message
                const isMiseEnLigne = pendingPaymentToProcess.paymentType === 'Mise en ligne';
                const autoSuccessMsg = isMiseEnLigne 
                  ? `✅ Félicitations ! Votre demande de mise en ligne d'annonce a été validée d'office. Suite à la validation de votre dépôt de ${amountNum.toLocaleString('fr-FR')} FCFA par l'administrateur, votre portefeuille a été crédité, le prélèvement automatique de l'inscription (${targetAmountNum} FCFA) a été effectué et votre annonce est désormais visible pour tous les utilisateurs.`
                  : `✅ Félicitations ! Suite à la validation de votre dépôt de ${amountNum.toLocaleString('fr-FR')} FCFA par l'administrateur, votre portefeuille a été crédité, le paiement automatique pour le service "${pendingPaymentToProcess.title || pendingPaymentToProcess.paymentType}" (${targetAmountNum} FCFA) a été prélevé et activé automatiquement !`;

                const autoMsg = {
                  text: autoSuccessMsg,
                  sender: 'admin',
                  timestamp: new Date().toISOString(),
                  isRead: false,
                  adminReadStatus: 'LU'
                };
                await databaseService.saveTypedChatMessage('Privee', userPhone, autoMsg);
              }
            }
          }
        }
      } else {
        // --- LOGIQUE DE DÉBLOCAGE PAR TYPE DE PAIEMENT STANDARD ---
        if (userId) {
          // If the payment is manually validated and was in 'En attente' state, deduct from the wallet
          if (payment.status === 'En attente') {
            const amountNum = parseFloat(payment.amount || '0');
            if (!isNaN(amountNum) && amountNum > 0) {
              const walletRef = doc(db, 'Wallets', userId);
              await setDoc(walletRef, {
                phone: userId,
                balance: increment(-amountNum),
                updatedAt: serverTimestamp()
              }, { merge: true });

              await addDoc(collection(db, 'WalletTransactions'), {
                phone: userId,
                userName: payment.userName || 'Utilisateur',
                userCity: payment.city || 'Non spécifiée',
                type: 'PAYMENT',
                amount: -amountNum,
                paymentNumber: 'FILANT°225 PORTEFEUILLE (VALIDATION)',
                description: `Prélèvement de service par Admin - ${payment.title || payment.paymentType}`,
                status: 'SUCCESS',
                timestamp: Date.now(),
                dateStr: new Date().toLocaleString('fr-FR')
              });
            }
          }

          if (payment.paymentType === 'Inscription' || payment.amount === '310') {
            // Étape 2 -> 3
            await databaseService.updateQRCodeActivation(userId, {
              status: "En attente paiement activation (7 100 FCFA)",
              fraisDossierPayes: true,
              updatedAt: serverTimestamp()
            });
          } else if (payment.paymentType === 'Activation' || payment.amount === '7100') {
            // Étape 3 -> 4 (Actif)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            
            await databaseService.updateQRCodeActivation(userId, {
              status: "Code QR Actif",
              isVerified: true,
              expiryDate: expiryDate.toISOString(),
              activationDate: new Date().toISOString(),
              updatedAt: serverTimestamp()
            });
          } else if (payment.paymentType === 'Renouvellement' || payment.amount === '500') {
             const expiryDate = new Date();
             expiryDate.setFullYear(expiryDate.getFullYear() + 1);
             await databaseService.updateQRCodeActivation(userId, {
                status: "Code QR Actif",
                expiryDate: expiryDate.toISOString(),
                updatedAt: serverTimestamp()
             });
          } else if (payment.paymentType === 'Mise en ligne' || payment.title?.includes('Mise en ligne')) {
            const isOneMonth = payment.title?.toLowerCase().includes('mois') || payment.title?.toLowerCase().includes('350') || payment.amount === '350';
            const durationMs = isOneMonth ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
            const onlineStart = Date.now();
            const onlineEnd = onlineStart + durationMs;

            const docRef = doc(db, 'Inscriptions', userId);
            const userInscr = await getDoc(docRef);
            let profileType = 'Travailleur';
            if (userInscr.exists()) {
              profileType = userInscr.data()?.profileType || 'Travailleur';
            }

            const updatedFields = {
              isOnline: true,
              onlinePending: false,
              onlineApproved: true,
              onlineRefused: false,
              onlineStart,
              onlineEnd,
              updatedAt: serverTimestamp()
            };

            await setDoc(docRef, updatedFields, { merge: true });

            let targetCollection = '';
            if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
            else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
            else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
            else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

            if (targetCollection) {
              const profRef = doc(db, targetCollection, userId);
              await setDoc(profRef, updatedFields, { merge: true });
            }

            databaseService.triggerEvolutionUpdate(userId);
          }
        }

        // Send automatic message to user
        if (userId) {
          const isMiseEnLigne = payment.paymentType === 'Mise en ligne' || payment.title?.includes('Mise en ligne');
          const successMsg = isMiseEnLigne 
            ? `✅ Félicitations ! Votre demande de mise en ligne d'annonce a été validée avec succès par l'administrateur. Votre annonce est désormais visible pour tous les utilisateurs.`
            : `✅ Votre paiement de ${payment.amount} FCFA (${payment.title || payment.paymentType}) a été validé avec succès par l'administrateur. L'étape suivante est maintenant débloquée.`;

          const msg = {
            text: successMsg,
            sender: 'admin',
            timestamp: new Date().toISOString(),
            isRead: false,
            adminReadStatus: 'LU'
          };
          await databaseService.saveTypedChatMessage('Privee', userId, msg);
        }

        // Check for serviceRequestId or matching service request to update status to VALIDATED
        if (payment.serviceRequestId) {
          try {
            await databaseService.triggerServiceRequestValidationFlow(payment.serviceRequestId, payment.rtdbPath || null);
          } catch (err) {
            console.error("Error updating ServiceRequest status on validation:", err);
          }
        } else if (userId) {
          // Fallback: look up in Firestore for matching service request from this user
          try {
            const q = query(
              collection(db, 'ServiceRequests'),
              where('phone', '==', payment.phone || payment.userPhone || userId),
              where('status', '==', 'En attente de paiement'),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docId = snap.docs[0].id;
              await databaseService.triggerServiceRequestValidationFlow(docId, payment.rtdbPath || null);
            }
          } catch (lookupErr) {
            console.error("Error in fallback lookup for ServiceRequest:", lookupErr);
          }
        }
      }
    } catch (e) {
      console.error("Error validating payment:", e);
    }
  },

  invalidatePaymentStatus: async (payment: any) => {
    if (!payment.rtdbPath) return;
    try {
      const isDeposit = payment.paymentType === 'Dépôt' || payment.title === 'Dépôt vers le compte principal';
      const failStatus = isDeposit ? 'Dépôt non validé' : 'Paiement non validé';

      await update(rtdbRef(rtdb, payment.rtdbPath), {
        status: failStatus,
        adminReadStatus: 'LU'
      });

      const userPhone = (payment.userPhone || payment.phone || '').replace(/\D/g, '');
      const userId = (payment.userId || userPhone).replace(/\D/g, '');

      // Pour les dépôts, si le statut précédent était validé, on l'annule en retirant le montant du portefeuille de l'utilisateur
      if (isDeposit && (payment.status === 'Dépôt validé' || payment.status === 'Paiement validé')) {
        const amountNum = parseFloat(payment.amount);
        if (!isNaN(amountNum) && amountNum > 0) {
          const walletRef = doc(db, 'Wallets', userPhone);
          
          await setDoc(walletRef, {
            phone: userPhone,
            balance: increment(-amountNum),
            updatedAt: serverTimestamp()
          }, { merge: true });

          // Enregistre l'annulation de transaction
          await addDoc(collection(db, 'WalletTransactions'), {
            phone: userPhone,
            userName: payment.userName || 'Utilisateur',
            userCity: payment.city || 'Non spécifiée',
            type: 'DEPOSIT_CANCELLED',
            amount: -amountNum,
            paymentNumber: payment.waveNumber || 'N/A',
            status: 'CANCELLED',
            timestamp: Date.now(),
            dateStr: new Date().toLocaleString('fr-FR')
          });
        }
      }

      const isMiseEnLigne = payment.paymentType === 'Mise en ligne' || payment.title?.includes('Mise en ligne');
      if (userId && isMiseEnLigne) {
        const docRef = doc(db, 'Inscriptions', userId);
        const userInscr = await getDoc(docRef);
        let profileType = 'Travailleur';
        if (userInscr.exists()) {
          profileType = userInscr.data()?.profileType || 'Travailleur';
        }

        const updatedFields = {
          isOnline: false,
          onlinePending: false,
          onlineRefused: true,
          onlineApproved: false,
          updatedAt: serverTimestamp()
        };

        await setDoc(docRef, updatedFields, { merge: true });

        let targetCollection = '';
        if (profileType === 'Travailleur') targetCollection = 'Travailleurs';
        else if (profileType === 'Propriétaire' || profileType === 'Equipement') targetCollection = 'Équipements';
        else if (profileType === 'Agence' || profileType === 'Agence immobilière') targetCollection = 'Agences immobilières';
        else if (profileType === 'Entreprise') targetCollection = 'Entreprises';

        if (targetCollection) {
          const profRef = doc(db, targetCollection, userId);
          await setDoc(profRef, updatedFields, { merge: true });
        }

        databaseService.triggerEvolutionUpdate(userId);
      }

      if (userId) {
        let msgText = `Votre paiement de ${payment.amount} FCFA (${payment.title || payment.paymentType}) est en cours de traitement. Veuillez patienter jusqu’à la validation finale. Vous recevrez un message une fois la transaction confirmée. En cas de validation, votre paiement sera pris en compte et nous pourrons vous contacter si nécessaire.`;
        
        if (isDeposit) {
          msgText = `❌ Votre demande de dépôt de ${parseFloat(payment.amount).toLocaleString('fr-FR')} FCFA sur votre compte principal n'a pas été validée par l'administrateur. Aucun crédit n'a été ajouté à votre portefeuille.`;
        } else if (isMiseEnLigne) {
          msgText = `❌ Votre demande de mise en ligne d'annonce a été refusée par l'administrateur ou le paiement n'a pas pu être validé. L'annonce restera hors ligne.`;
        }

        const msg = {
          text: msgText,
          sender: 'admin',
          timestamp: new Date().toISOString(),
          isRead: false,
          adminReadStatus: 'LU'
        };
        await databaseService.saveTypedChatMessage('Privee', userId, msg);
      }
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

      // Send automated message after service request submission with 1.25s delay
      const phoneRaw = requestData.phone || '';
      const sanitizedPhone = phoneRaw.replace(/\D/g, '');
      const userId = requestData.userId || sanitizedPhone;

      if (userId) {
        setTimeout(async () => {
          try {
            const autoMsg = {
              text: "Merci pour votre demande. Votre demande est en cours de traitement. Chaque demande est transmise à notre service de mise en relation. Un agent ou un partenaire vous contactera dans les meilleurs délais.",
              sender: 'admin',
              isRead: false,
              adminReadStatus: 'LU'
            };
            await databaseService.saveTypedChatMessage('Privee', userId, autoMsg);
          } catch (msgErr) {
            console.error("Error sending auto message after service request:", msgErr);
          }
        }, 1250);

        // Trigger evolution update
        databaseService.triggerEvolutionUpdate(userId);
      }

      return docRef.id;
    } catch (error) {
      console.error("Error saving service request:", error);
      throw error;
    }
  },

  triggerServiceRequestValidationFlow: async (requestId: string, paymentRtdbPath?: string | null) => {
    try {
      const reqRef = doc(db, 'ServiceRequests', requestId);
      const snap = await getDoc(reqRef);
      if (!snap.exists()) {
        console.error("Service request not found for flow:", requestId);
        return;
      }
      const data = snap.data();
      
      const prestatairePhone = (data.prestatairePhone || '').replace(/\D/g, '');
      const clientPhone = (data.phone || '').replace(/\D/g, '');
      const clientName = data.userName || 'Client';
      const clientCity = data.city || 'Non spécifiée';
      const serviceTitle = data.serviceTitle || 'Demande de service';
      const amount = data.totalPrice || 0;
      const prestataireName = data.prestataireName || 'Prestataire';

      // Update ServiceRequests fields for maximum query compatibility
      const updatedFields = {
        status: 'VALIDATED',
        providerId: prestatairePhone,
        clientId: clientPhone,
        requestId: requestId,
        createdAt: new Date().toISOString(),
        paymentRtdbPath: paymentRtdbPath || data.paymentRtdbPath || null
      };
      await setDoc(reqRef, updatedFields, { merge: true });

      // Notify provider in MessageriePrivee
      if (prestatairePhone) {
        const providerMsg = {
          text: `🔔 NOUVELLE DEMANDE DE SERVICE DE ${clientName} (${clientCity})\n\nService demandé : ${serviceTitle}\nMontant : ${amount} FCFA\n\nVous pouvez gérer cette demande directement en cliquant sur le bouton "Services" (icône sac de shopping) sur votre écran d'accueil !`,
          sender: 'admin',
          timestamp: new Date().toISOString(),
          isRead: false,
          adminReadStatus: 'LU'
        };
        await databaseService.saveTypedChatMessage('Privee', prestatairePhone, providerMsg);
      }

      // Notify client in MessageriePrivee
      if (clientPhone) {
        const clientMsg = {
          text: `✅ Votre paiement de ${amount} FCFA pour la demande de service avec ${prestataireName} a été validé. La demande a été transmise au prestataire pour acceptation. Vous serez notifié dès qu'il aura répondu.`,
          sender: 'admin',
          timestamp: new Date().toISOString(),
          isRead: false,
          adminReadStatus: 'LU'
        };
        await databaseService.saveTypedChatMessage('Privee', clientPhone, clientMsg);
      }

      console.log("Successfully ran triggerServiceRequestValidationFlow for:", requestId);
    } catch (err) {
      console.error("Error in triggerServiceRequestValidationFlow:", err);
    }
  },

  subscribeToProviderServiceRequests: (providerPhone: string, callback: (requests: any[]) => void) => {
    const sanitizedPhone = providerPhone.replace(/\D/g, '');
    const q = query(
      collection(db, 'ServiceRequests'),
      where('prestatairePhone', '==', sanitizedPhone),
      where('status', '==', 'VALIDATED')
    );
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    }, (error) => console.error("Error listening to provider service requests:", error));
  },

  subscribeToProviderServiceRequestsCount: (providerPhone: string, callback: (count: number) => void) => {
    const sanitizedPhone = providerPhone.replace(/\D/g, '');
    const q = query(
      collection(db, 'ServiceRequests'),
      where('prestatairePhone', '==', sanitizedPhone),
      where('status', '==', 'VALIDATED')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    }, (error) => console.error("Error listening to provider service requests count:", error));
  },

  acceptServiceRequest: async (requestId: string, prestatairePhone: string, clientPhone: string) => {
    try {
      const reqRef = doc(db, 'ServiceRequests', requestId);
      await setDoc(reqRef, { status: 'ACCEPTED' }, { merge: true });

      // Format provider phone: +225 XX XX XX XX XX
      const rawPhone = prestatairePhone.replace(/\D/g, '');
      const formattedProviderPhone = rawPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
      
      const clientUserId = clientPhone.replace(/\D/g, '');
      const msg = {
        text: `Votre demande de service a été acceptée par le prestataire.\nVous pouvez maintenant le contacter au :\n+225 ${formattedProviderPhone}`,
        sender: 'admin',
        timestamp: new Date().toISOString(),
        isRead: false,
        adminReadStatus: 'LU'
      };

      await databaseService.saveTypedChatMessage('Privee', clientUserId, msg);
      return true;
    } catch (error) {
      console.error("Error accepting service request:", error);
      return false;
    }
  },

  refuseServiceRequest: async (requestId: string, prestatairePhone: string, clientPhone: string, amount: number, clientName: string, clientCity: string, paymentRtdbPath?: string) => {
    try {
      const reqRef = doc(db, 'ServiceRequests', requestId);
      await setDoc(reqRef, { status: 'REFUSED' }, { merge: true });

      const clientUserId = clientPhone.replace(/\D/g, '');

      // 1. Send automatic notification to client private messages
      const notificationMsg = {
        text: `Désolé, votre demande de service a été refusée par le prestataire car celui-ci n'est pas disponible pour le moment.\n\nLe montant de ${amount} FCFA a été remboursé sur votre Portefeuille FILANT°225.`,
        sender: 'admin',
        timestamp: new Date().toISOString(),
        isRead: false,
        adminReadStatus: 'LU'
      };
      await databaseService.saveTypedChatMessage('Privee', clientUserId, notificationMsg);

      // 2. Perform wallet refund
      if (amount > 0) {
        await databaseService.processWalletRefund(
          clientUserId,
          clientName || 'Utilisateur',
          clientCity || 'Non spécifiée',
          amount,
          "Demande de service refusée par le prestataire"
        );
      }

      // 3. Update the RTDB transaction status if path is available
      if (paymentRtdbPath) {
        await update(rtdbRef(rtdb, paymentRtdbPath), {
          status: 'Service refusé / Paiement remboursé'
        });
      } else {
        // Fallback: lookup in RTDB Paiements to find this request and mark it
        try {
          const paymentsSnapshot = await get(rtdbRef(rtdb, 'Paiements'));
          if (paymentsSnapshot.exists()) {
            const allPaymentsObj = paymentsSnapshot.val();
            for (const userKey of Object.keys(allPaymentsObj)) {
              const userPayments = allPaymentsObj[userKey];
              for (const pId of Object.keys(userPayments)) {
                const payItem = userPayments[pId];
                if (payItem.serviceRequestId === requestId) {
                  await update(rtdbRef(rtdb, `Paiements/${userKey}/${pId}`), {
                    status: 'Service refusé / Paiement remboursé'
                  });
                  break;
                }
              }
            }
          }
        } catch (rtdbErr) {
          console.error("Error looking up and updating RTDB status on refuse:", rtdbErr);
        }
      }

      return true;
    } catch (error) {
      console.error("Error refusing service request:", error);
      return false;
    }
  },

  saveStageApplication: async (applicationData: any) => {
    try {
      await databaseService.ensureAuth();
      const docRef = await addDoc(collection(db, 'Stage'), {
        ...applicationData,
        timestamp: serverTimestamp(),
        adminReadStatus: 'NON LU'
      });

      // Send automated message after stage submission with 1.25s delay
      const phoneRaw = applicationData.phone || '';
      const sanitizedPhone = phoneRaw.replace(/\D/g, '');
      const userId = applicationData.userId || sanitizedPhone;

      if (userId) {
        setTimeout(async () => {
          try {
            const autoMsg = {
              text: "Merci pour votre demande. Votre demande est en cours de traitement. Chaque demande est transmise à notre service de mise en relation. Un agent ou un partenaire vous contactera dans les meilleurs délais.",
              sender: 'admin',
              isRead: false,
              adminReadStatus: 'LU'
            };
            await databaseService.saveTypedChatMessage('Privee', userId, autoMsg);
          } catch (msgErr) {
            console.error("Error sending auto message after stage request:", msgErr);
          }
        }, 1250);

        // Trigger evolution update
        databaseService.triggerEvolutionUpdate(userId);
      }

      return docRef.id;
    } catch (error) {
      console.error("Error saving Stage application:", error);
      throw error;
    }
  },

  saveFormationApplication: async (applicationData: any) => {
    try {
      await databaseService.ensureAuth();
      const docRef = await addDoc(collection(db, 'Formation'), {
        ...applicationData,
        timestamp: serverTimestamp(),
        adminReadStatus: 'NON LU'
      });

      // Send automated message after formation submission with 1.25s delay
      const phoneRaw = applicationData.phone || '';
      const sanitizedPhone = phoneRaw.replace(/\D/g, '');
      const userId = applicationData.userId || sanitizedPhone;

      if (userId) {
        setTimeout(async () => {
          try {
            const autoMsg = {
              text: "Merci pour votre demande. Votre demande est en cours de traitement. Chaque demande est transmise à notre service de mise en relation. Un agent ou un partenaire vous contactera dans les meilleurs délais.",
              sender: 'admin',
              isRead: false,
              adminReadStatus: 'LU'
            };
            await databaseService.saveTypedChatMessage('Privee', userId, autoMsg);
          } catch (msgErr) {
            console.error("Error sending auto message after formation request:", msgErr);
          }
        }, 1250);

        // Trigger evolution update
        databaseService.triggerEvolutionUpdate(userId);
      }

      return docRef.id;
    } catch (error) {
      console.error("Error saving Formation application:", error);
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

  sendAutomatedCongratsMessageAfterScan: async (currentUser: any, parsedInfo: { name: string, title?: string, city?: string, details?: string }) => {
    try {
      if (!parsedInfo.name || !currentUser) return false;
      
      const inscriptions = await databaseService.getInscriptions();
      if (!inscriptions || !Array.isArray(inscriptions)) {
        console.log("No inscriptions found or could not fetch them.");
        return false;
      }

      const normalizeStr = (str: string) => {
        try {
          return (str || '')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
        } catch (e) {
          return (str || '').toLowerCase().trim();
        }
      };

      const targetName = normalizeStr(parsedInfo.name);
      const targetCity = normalizeStr(parsedInfo.city || '');

      // 1. First find any inscription whose name matches normalized
      let candidates = inscriptions.filter((ins: any) => {
        const insName = normalizeStr(ins.name);
        return insName === targetName || insName.includes(targetName) || targetName.includes(insName);
      });

      if (candidates.length === 0) {
        console.log(`No matching inscription found for name: ${parsedInfo.name}`);
        return false;
      }

      // 2. If multiple candidates, filter by city if specified
      let matchedInscr = candidates[0];
      if (candidates.length > 1 && parsedInfo.city) {
        const withCityMatch = candidates.filter((ins: any) => {
          const insCity = normalizeStr(ins.city || ins.agencyCity || ins.companyCity || ins.equipmentCity || '');
          return insCity === targetCity || insCity.includes(targetCity) || targetCity.includes(insCity);
        });
        if (withCityMatch.length > 0) {
          matchedInscr = withCityMatch[0];
        }
      }

      const rawPhone = (matchedInscr as any).id || (matchedInscr as any).phone;
      if (!rawPhone) {
        console.log("Matched inscription has no phone number associated.");
        return false;
      }

      const sanitizedPhone = rawPhone.replace(/\D/g, '');
      if (!sanitizedPhone) return false;

      // Ensure we don't send a congrats message to the scanner themselves if they scanned their own QR code
      const scannerPhone = (currentUser.phone || '').replace(/\D/g, '');
      if (sanitizedPhone === scannerPhone) {
        console.log("Scanner scanned themselves. Skipping automated congrats message.");
        return false;
      }

      const scannerName = currentUser.name || "un utilisateur";
      const autoMsg = {
        text: `Félicitations, vous avez été scanné par ${scannerName} pour une mission.`,
        sender: 'admin',
        isRead: false,
        adminReadStatus: 'LU',
        timestamp: Date.now()
      };

      await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, autoMsg);
      console.log(`Successfully sent congrats message to ${sanitizedPhone} (Scanned by ${scannerName})`);
      return true;
    } catch (err) {
      console.error("Error in sendAutomatedCongratsMessageAfterScan:", err);
      return false;
    }
  },

  onTotalUnreadAdminMessagesCount: (callback: (count: number) => void) => {
    try {
      const qPrivate = query(collection(db, 'MessageriePrivee'), where('adminReadStatus', '==', 'NON LU'));
      
      return onSnapshot(qPrivate, (snap) => {
        callback(snap.size);
      }, (error) => console.error("Error listening to total admin unread count:", error));
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

  uploadImageOrFallback: async (phone: string, base64: string): Promise<string> => {
    try {
      if (!base64) return '';
      if (base64.startsWith('http://') || base64.startsWith('https://') || base64.startsWith('/uploads')) {
        return base64;
      }

      const sanitizedPhone = phone.replace(/\D/g, '') || 'anonymous';
      const uniqName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.jpg`;
      const storagePath = `Announcements/${sanitizedPhone}/${uniqName}`;

      console.log(`[Upload Debug] uploadImageOrFallback calling uploadFile for target: ${storagePath}`);
      return await databaseService.uploadFile(base64, storagePath);
    } catch (err) {
      console.error("Error in uploadImageOrFallback wrapper:", err);
      return base64;
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

  saveSignalement: async (phone: string, reportedProfile: any, reason: string) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const msg = {
        text: `⚠️ SIGNALEMENT : Le profil de "${reportedProfile.name}" (${reportedProfile.phone}) a été signalé. Raison : ${reason}`,
        sender: 'system',
        timestamp: new Date().toISOString(),
        isRead: false,
        adminReadStatus: 'LU'
      };
      await databaseService.saveTypedChatMessage('Privee', sanitizedPhone, msg);
      
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'Signalements'), {
        reporterPhone: sanitizedPhone,
        reportedPhone: reportedProfile.phone || '',
        reportedName: reportedProfile.name || '',
        reportedType: reportedProfile.profileType || 'Non spécifié',
        reason,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error("Error saving signalement:", e);
      return false;
    }
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
  },

  // --- FILANT°225 USER WALLET (PORTEFEUILLE) SYSTEM ---
  getWallet: async (phone: string) => {
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const walletRef = doc(db, 'Wallets', sanitizedPhone);
      const snap = await getDoc(walletRef);
      if (snap.exists()) {
        const walletData = snap.data();
        return {
          phone: sanitizedPhone,
          balance: walletData.balance || 0,
          name: walletData.name || 'Inconnu',
          city: walletData.city || 'Non spécifiée'
        };
      }
      return {
        phone: sanitizedPhone,
        balance: 0,
        name: 'Inconnu',
        city: 'Non spécifiée'
      };
    } catch (error) {
      console.error("Error in getWallet:", error);
      return {
        phone: phone.replace(/\D/g, ''),
        balance: 0,
        name: 'Inconnu',
        city: 'Non spécifiée'
      };
    }
  },

  subscribeToWallet: (phone: string, callback: (wallet: any) => void) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const walletRef = doc(db, 'Wallets', sanitizedPhone);
    return onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const walletData = snap.data();
        callback({
          phone: sanitizedPhone,
          balance: walletData.balance || 0,
          name: walletData.name || 'Inconnu',
          city: walletData.city || 'Non spécifiée'
        });
      } else {
        callback({
          phone: sanitizedPhone,
          balance: 0,
          name: 'Inconnu',
          city: 'Non spécifiée'
        });
      }
    }, (error) => {
      console.error("Error subscribing to wallet:", error);
    });
  },

  subscribeToWalletTransactions: (phone: string, callback: (txs: any[]) => void) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    const q = query(
      collection(db, 'WalletTransactions'),
      where('phone', '==', sanitizedPhone)
    );
    return onSnapshot(q, (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side by timestamp descending to avoid composite index requirement
      txs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
        return timeB - timeA;
      });
      callback(txs);
    }, (error) => {
      console.error("Error subscribing to wallet transactions:", error);
    });
  },

  createDeposit: async (phone: string, name: string, city: string, amount: number, paymentNumber: string) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const walletRef = doc(db, 'Wallets', sanitizedPhone);
      
      await setDoc(walletRef, {
        phone: sanitizedPhone,
        name: name,
        city: city,
        balance: increment(amount),
        updatedAt: serverTimestamp()
      }, { merge: true });

      const txRef = await addDoc(collection(db, 'WalletTransactions'), {
        phone: sanitizedPhone,
        userName: name,
        userCity: city,
        type: 'DEPOSIT',
        amount: amount,
        paymentNumber: paymentNumber,
        status: 'SUCCESS',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('fr-FR')
      });
      return txRef.id;
    } catch (error) {
      console.error("Error in createDeposit:", error);
      throw error;
    }
  },

  processWalletPayment: async (phone: string, name: string, city: string, amount: number, serviceName: string, reference: string) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const walletRef = doc(db, 'Wallets', sanitizedPhone);

      // Check balance
      const snap = await getDoc(walletRef);
      const currentBalance = snap.exists() ? (snap.data().balance || 0) : 0;
      if (currentBalance < amount) {
        return { success: false, error: 'Fonds insuffisants. Veuillez effectuer un dépôt pour poursuivre votre demande.' };
      }

      // Deduct
      await setDoc(walletRef, {
        phone: sanitizedPhone,
        name: name,
        city: city,
        balance: increment(-amount),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Save transaction
      await addDoc(collection(db, 'WalletTransactions'), {
        phone: sanitizedPhone,
        userName: name,
        userCity: city,
        type: 'PAYMENT',
        amount: amount,
        serviceName: serviceName,
        reference: reference,
        status: 'SUCCESS',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('fr-FR')
      });

      return { success: true };
    } catch (error) {
      console.error("Error in processWalletPayment:", error);
      throw error;
    }
  },

  processWalletRefund: async (phone: string, name: string, city: string, amount: number, reason: string) => {
    try {
      await databaseService.ensureAuth();
      const sanitizedPhone = phone.replace(/\D/g, '');
      const walletRef = doc(db, 'Wallets', sanitizedPhone);

      // Add to balance
      await setDoc(walletRef, {
        phone: sanitizedPhone,
        name: name,
        city: city,
        balance: increment(amount),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Save refund transaction
      await addDoc(collection(db, 'WalletTransactions'), {
        phone: sanitizedPhone,
        userName: name,
        userCity: city,
        type: 'REFUND',
        amount: amount,
        reason: reason,
        status: 'SUCCESS',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('fr-FR')
      });

      // Send notifications to both chat databases
      const msgText = `🔔 *Remboursement Portefeuille FILANT°225*\n\nUn remboursement de *${amount} FCFA* a été crédité sur votre compte FILANT°225.\n\n• *Motif :* ${reason}\n\nVotre solde a été mis à jour instantanément.`;
      const adminMsg = {
        text: msgText,
        sender: 'admin' as const,
        timestamp: Date.now(),
        isRead: false,
        adminReadStatus: 'LU'
      };

      await databaseService.savePrivateChatMessage(sanitizedPhone, adminMsg);

      return { success: true };
    } catch (error) {
      console.error("Error in processWalletRefund:", error);
      throw error;
    }
  },

  getAllWallets: async () => {
    try {
      await databaseService.ensureAuth();
      const q = query(collection(db, 'Wallets'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error in getAllWallets:", error);
      return [];
    }
  },

  getAllWalletTransactions: async () => {
    try {
      await databaseService.ensureAuth();
      const q = query(collection(db, 'WalletTransactions'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error in getAllWalletTransactions:", error);
      return [];
    }
  },

  subscribeToAllWallets: (callback: (wallets: any[]) => void) => {
    const q = query(collection(db, 'Wallets'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const wallets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(wallets);
    }, (error) => {
      console.error("Error subscribing to all wallets:", error);
    });
  },

  subscribeToAllWalletTransactions: (callback: (txs: any[]) => void) => {
    const q = query(collection(db, 'WalletTransactions'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(txs);
    }, (error) => {
      console.error("Error subscribing to all wallet transactions:", error);
    });
  },

  getUserProfileType: async (phone: string): Promise<'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise' | 'Client'> => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      // 1. Check in Inscriptions first (since we register with profileType there)
      const inscrRef = doc(db, 'Inscriptions', sanitizedPhone);
      const inscrSnap = await getDoc(inscrRef);
      if (inscrSnap.exists()) {
        const data = inscrSnap.data();
        if (data.profileType) {
          if (data.profileType === 'Propriétaire' || data.profileType === 'Equipement') {
            return 'Propriétaire';
          }
          return data.profileType as any;
        }
      }

      // 2. Check the specific professional collections
      const travSnap = await getDoc(doc(db, 'Travailleurs', sanitizedPhone));
      if (travSnap.exists()) return 'Travailleur';

      const agSnap = await getDoc(doc(db, 'Agences immobilières', sanitizedPhone));
      if (agSnap.exists()) return 'Agence';

      const eqSnap = await getDoc(doc(db, 'Équipements', sanitizedPhone));
      if (eqSnap.exists()) return 'Propriétaire';

      const entSnap = await getDoc(doc(db, 'Entreprises', sanitizedPhone));
      if (entSnap.exists()) return 'Entreprise';

      // 3. Fallback to check user document role
      const clientSnap = await getDoc(doc(db, 'Clients', sanitizedPhone));
      if (clientSnap.exists()) {
        const data = clientSnap.data();
        if (data.role === 'Travailleur') return 'Travailleur';
        if (data.role === 'Agence' || data.role === 'Agence immobilière') return 'Agence';
        if (data.role === 'Propriétaire' || data.role === 'Équipements') return 'Propriétaire';
        if (data.role === 'Entreprise') return 'Entreprise';
      }
    } catch (e) {
      console.error("Error determining profile type:", e);
    }
    return 'Client';
  },

  getUserEvolution: async (phone: string): Promise<any> => {
    if (!phone) return null;
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
      await databaseService.ensureAuth();
      const profileType = await databaseService.getUserProfileType(sanitizedPhone);
      
      let points = 0;
      let maxPoints = 35; // Standard 35 counts to reach 100%
      let percentage = 0;
      let description = '';
      let badge = 'Standard';
      let detailsText = '';

      if (profileType === 'Travailleur') {
        // Query HistoriqueScans where phone == sanitizedPhone (scans received)
        let scansCount = 0;
        try {
          const qScans = query(collection(db, 'HistoriqueScans'), where('phone', '==', sanitizedPhone));
          const snapScans = await getDocs(qScans);
          scansCount = snapScans.size;
        } catch (err) {
          console.warn("Could not query HistoriqueScans for evolution:", err);
        }

        // Query Missions where userId == sanitizedPhone
        let mCount = 0;
        try {
          const qMissions = query(collection(db, 'Missions'), where('userId', '==', sanitizedPhone));
          const snapMissions = await getDocs(qMissions);
          mCount = snapMissions.size;
        } catch (err) {
          console.warn("Could not query Missions for evolution:", err);
        }

        points = scansCount + mCount;
        maxPoints = 35; // Target 35 scans or missions
        percentage = Math.min(100, Math.round((points / maxPoints) * 100));
        
        badge = percentage >= 100 ? 'Travailleur Favori ★' : 'Travailleur Actif';
        description = "Chaque fois que vous êtes sollicité, scanné ou contacté, votre niveau d'évolution augmente.";
        detailsText = `${scansCount} scan(s) reçu(s) et ${mCount} mission(s) effectuée(s).`;
      } 
      else if (profileType === 'Client') {
        let requestsCount = 0;
        try {
          // Query ServiceRequests where userId == sanitizedPhone or phone == sanitizedPhone
          const qRequests1 = query(collection(db, 'ServiceRequests'), where('userId', '==', sanitizedPhone));
          const snapReq1 = await getDocs(qRequests1);
          requestsCount = snapReq1.size;
        } catch (err) {
          console.warn("Could not query ServiceRequests for evolution:", err);
        }
        
        try {
          // Also add stage or formation applications
          const qStage = query(collection(db, 'Stage'), where('userId', '==', sanitizedPhone));
          const snapStage = await getDocs(qStage);
          const qFormation = query(collection(db, 'Formation'), where('userId', '==', sanitizedPhone));
          const snapFormation = await getDocs(qFormation);
          
          requestsCount += snapStage.size + snapFormation.size;
        } catch (err) {
          console.warn("Could not query Stage/Formation for evolution:", err);
        }

        // Also count scans performed by the client
        let scansPerfCount = 0;
        try {
          const qScansTx = query(collection(db, 'HistoriqueScans'), where('scannerPhone', '==', sanitizedPhone));
          const snapScansTx = await getDocs(qScansTx);
          scansPerfCount = snapScansTx.size;
        } catch (err) {
          console.warn("Could not query scans performed for client evolution:", err);
        }

        points = requestsCount + scansPerfCount;
        maxPoints = 35; // Client hits 100% at 35 requests/actions
        percentage = Math.min(100, Math.round((points / maxPoints) * 100));
        
        badge = percentage >= 100 ? 'Client Privilégié ★' : 'Client Actif';
        description = "Chaque demande de service ou scan effectué augmente votre progression d'activité.";
        detailsText = `${requestsCount} demande(s) et ${scansPerfCount} scan(s) effectué(s).`;
      } 
      else {
        // Propriétaire / Agence / Entreprise
        let scansCount = 0;
        try {
          const qScans = query(collection(db, 'HistoriqueScans'), where('phone', '==', sanitizedPhone));
          const snapScans = await getDocs(qScans);
          scansCount = snapScans.size;
        } catch (err) {
          console.warn("Could not query HistoriqueScans for partner evolution:", err);
        }

        let mCount = 0;
        try {
          const qMissions = query(collection(db, 'Missions'), where('userId', '==', sanitizedPhone));
          const snapMissions = await getDocs(qMissions);
          mCount = snapMissions.size;
        } catch (err) {
          console.warn("Could not query Missions for partner evolution:", err);
        }

        points = scansCount + mCount;
        maxPoints = 35; // All partners standard to 35 steps
        percentage = Math.min(100, Math.round((points / maxPoints) * 100));
        
        let labelName = 'Partenaire';
        if (profileType === 'Agence') labelName = 'Agence Immobilière';
        else if (profileType === 'Propriétaire') labelName = 'Propriétaire Équipements';
        else if (profileType === 'Entreprise') labelName = 'Entreprise Partenaire';

        badge = percentage >= 100 ? `${labelName} Certifié ★` : `${labelName} Actif`;
        description = "Votre progression évolue selon l'activité, les scans reçus de vos QR Codes et vos demandes.";
        detailsText = `${scansCount} scan(s) reçu(s) et ${mCount} demande(s)/mission(s) effectuée(s).`;
      }

      const evolutionData = {
        profileType,
        points,
        maxPoints,
        percentage,
        description,
        badge,
        detailsText,
        updatedAt: Date.now()
      };

      // 1. Enregistrement dans les collections correspondantes de profil utilisateur
      const collections = ['Clients', 'Travailleurs', 'Agences immobilières', 'Équipements', 'Entreprises', 'Admin'];
      for (const col of collections) {
        try {
          const userRef = doc(db, col, sanitizedPhone);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const updateObj: Record<string, any> = {
              evolution_succes: evolutionData,
              updatedAt: serverTimestamp()
            };
            if (percentage >= 100) {
              updateObj.status_evolution = 'Favori';
              updateObj.isFavorite = true;
              updateObj.status = 'validé';
            }
            await setDoc(userRef, updateObj, { merge: true });
            break;
          }
        } catch (dbErr) {
          console.error(`Error updating evolution_succes in collection ${col}:`, dbErr);
        }
      }

      // 2. Enregistrement direct également dans Inscriptions pour la synchronisation visuelle de l'admin
      try {
        const inscrRef = doc(db, 'Inscriptions', sanitizedPhone);
        const inscrSnap = await getDoc(inscrRef);
        if (inscrSnap.exists()) {
          const updateObj: Record<string, any> = {
            evolution_succes: evolutionData,
            updatedAt: serverTimestamp()
          };
          if (percentage >= 100) {
            updateObj.status = 'validé';
            updateObj.isFavorite = true;
          }
          await setDoc(inscrRef, updateObj, { merge: true });
        }
      } catch (inscrErr) {
        console.error("Error updating Inscriptions with evolution:", inscrErr);
      }

      // Also store in local cache
      localStorage.setItem(`filant_evolution_${sanitizedPhone}`, JSON.stringify(evolutionData));

      return evolutionData;
    } catch (e) {
      console.error("Error in getUserEvolution:", e);
      // Fallback local calculation
      const cached = localStorage.getItem(`filant_evolution_${sanitizedPhone}`);
      if (cached) return JSON.parse(cached);
      
      return {
        profileType: 'Client',
        points: 0,
        maxPoints: 35,
        percentage: 0,
        description: "Chargement de la progression...",
        badge: 'Standard',
        detailsText: "Aucune interaction enregistrée",
        updatedAt: Date.now()
      };
    }
  },

  triggerEvolutionUpdate: async (phone: string) => {
    if (!phone) return;
    try {
      await databaseService.getUserEvolution(phone);
    } catch (e) {
      console.warn("Silent failure on evolution trigger:", e);
    }
  },

  subscribeToUserProfileType: (phone: string, callback: (profileType: 'Travailleur' | 'Propriétaire' | 'Agence' | 'Entreprise' | 'Client') => void) => {
    if (!phone) {
      callback('Client');
      return () => {};
    }
    const sanitizedPhone = phone.replace(/\D/g, '');
    let isUnsubscribed = false;

    // We can listen to Inscriptions doc in real-time
    const inscrRef = doc(db, 'Inscriptions', sanitizedPhone);
    const unsubInscr = onSnapshot(inscrRef, (snap) => {
      if (isUnsubscribed) return;
      if (snap.exists()) {
        const data = snap.data();
        if (data.profileType) {
          let type = data.profileType;
          if (type === 'Propriétaire' || type === 'Equipement' || type === 'Équipement') {
            callback('Propriétaire');
          } else if (type === 'Agence' || type === 'Agence immobilière') {
            callback('Agence');
          } else {
            callback(type as any);
          }
          return;
        }
      }
      
      // Fallback/check other docs if not found in Inscriptions yet
      getDoc(doc(db, 'Travailleurs', sanitizedPhone)).then(s => {
        if (isUnsubscribed) return;
        if (s.exists()) { callback('Travailleur'); return; }
        getDoc(doc(db, 'Agences immobilières', sanitizedPhone)).then(s => {
          if (isUnsubscribed) return;
          if (s.exists()) { callback('Agence'); return; }
          getDoc(doc(db, 'Équipements', sanitizedPhone)).then(s => {
            if (isUnsubscribed) return;
            if (s.exists()) { callback('Propriétaire'); return; }
            getDoc(doc(db, 'Entreprises', sanitizedPhone)).then(s => {
              if (isUnsubscribed) return;
              if (s.exists()) { callback('Entreprise'); return; }
              callback('Client');
            });
          });
        });
      });
    }, (error) => {
      console.error("Error subscribing to Inscriptions:", error);
    });

    return () => {
      isUnsubscribed = true;
      unsubInscr();
    };
  },

  subscribeToUserEvolution: (phone: string, callback: (evolution: any) => void) => {
    if (!phone) return () => {};
    const sanitizedPhone = phone.replace(/\D/g, '');
    let isUnsubscribed = false;
    let unsubscribeUserDoc: (() => void) | null = null;

    // Load initial cached or calculated data instantly
    databaseService.getUserEvolution(sanitizedPhone).then((initialData) => {
      if (!isUnsubscribed && initialData) {
        callback(initialData);
      }
    });

    // Real-time Firestore profile status listener
    const setupListener = async () => {
      try {
        const profileType = await databaseService.getUserProfileType(sanitizedPhone);
        if (isUnsubscribed) return;

        let targetCol = 'Clients';
        if (profileType === 'Travailleur') targetCol = 'Travailleurs';
        else if (profileType === 'Agence') targetCol = 'Agences immobilières';
        else if (profileType === 'Propriétaire') targetCol = 'Équipements';
        else if (profileType === 'Entreprise') targetCol = 'Entreprises';

        const userRef = doc(db, targetCol, sanitizedPhone);
        unsubscribeUserDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && data.evolution_succes) {
              callback(data.evolution_succes);
            }
          }
        }, (err) => {
          console.error("Error in user doc snapshot:", err);
        });
      } catch (err) {
        console.warn("Could not setup main evolution user snap listener:", err);
      }
    };

    setupListener();

    // Multi-source reactive triggers for real-time recalculation
    const qScansRx = query(collection(db, 'HistoriqueScans'), where('phone', '==', sanitizedPhone));
    const unsubscribeScansRx = onSnapshot(qScansRx, () => {
      databaseService.triggerEvolutionUpdate(sanitizedPhone);
    }, (err) => console.log("Silent scans rx err", err));

    const qScansTx = query(collection(db, 'HistoriqueScans'), where('scannerPhone', '==', sanitizedPhone));
    const unsubscribeScansTx = onSnapshot(qScansTx, () => {
      databaseService.triggerEvolutionUpdate(sanitizedPhone);
    }, (err) => console.log("Silent scans tx err", err));

    const qReqs = query(collection(db, 'ServiceRequests'), where('userId', '==', sanitizedPhone));
    const unsubscribeReqs = onSnapshot(qReqs, () => {
      databaseService.triggerEvolutionUpdate(sanitizedPhone);
    }, (err) => console.log("Silent reqs err", err));

    return () => {
      isUnsubscribed = true;
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeScansRx) unsubscribeScansRx();
      if (unsubscribeScansTx) unsubscribeScansTx();
      if (unsubscribeReqs) unsubscribeReqs();
    };
  }
};
