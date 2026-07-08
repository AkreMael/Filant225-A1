import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import firebaseConfig from './firebase-applet-config.json';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app, firebaseConfig.storageBucket);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

/* 
================================================================================
🔒 CONFIGURATION DE FIREBASE APP CHECK (DESACTIVÉ POUR LE DÉVELOPPEMENT)
================================================================================
Pour réactiver Firebase App Check plus tard en production, suivez ces étapes :

1. Décommentez l'importation au début du fichier :
   import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

2. Décommentez le bloc de code ci-dessous.
3. Configurez vos clés de site Google ReCAPTCHA v3 dans votre console Firebase et .env.

if (typeof window !== 'undefined') {
  const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('aistudio.google');

  if (debugToken) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  } else if (isDev) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || "VOTRE_CLE_RECAPTCHA_ICI";
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("🔥 Firebase App Check réactivé avec succès !");
  } catch (error) {
    console.warn("⚠️ Impossible d'initialiser App Check :", error);
  }
}
================================================================================
*/

export default app;
