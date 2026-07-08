import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import firebaseConfig from './firebase-applet-config.json';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app, firebaseConfig.storageBucket);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Initialisation de App Check
if (typeof window !== 'undefined') {
  const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('aistudio.google');

  if (debugToken) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    console.log("🔥 [Firebase App Check] Utilisation du jeton de débogage fourni par l'environnement.");
  } else if (isDev) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log("🔥 [Firebase App Check] Mode débogage actif.");
  }

  // Activer App Check pour prendre en charge les projets qui l'imposent
  const ENABLE_APP_CHECK = true;

  if (ENABLE_APP_CHECK) {
    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || "6LdCwCcqAAAAAJ9O7WnS97_Hn3G7B7b6E8Tz1WvA"; // Clé Recaptcha V3 par défaut
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("🔥 Firebase App Check initialisé avec succès !");
      if (debugToken || isDev) {
        console.log("ℹ️ Si vous rencontrez des erreurs d'autorisation, vérifiez que le Debug Token affiché ci-dessus dans la console de votre navigateur est bien enregistré dans votre console Firebase.");
      }
    } catch (error) {
      console.warn("⚠️ Impossible d'initialiser App Check :", error);
    }
  }
}

export default app;
