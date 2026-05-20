import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import firebaseConfig from './firebase-applet-config.json';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const rtdb = getDatabase(app);
export const storage = getStorage(app, firebaseConfig.storageBucket);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Initialisation de Firebase App Check (reCAPTCHA Enterprise)
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || (firebaseConfig as any).recaptchaSiteKey || (firebaseConfig as any).siteKey;

  if (siteKey) {
    try {
      // Initialise App Check avec le siteKey s'il est configuré
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("[App Check] Initialisation réussie avec succès.");
    } catch (err) {
      console.warn("[App Check] Erreur lors de l'initialisation de App Check :", err);
    }
  } else {
    console.log("[App Check] Non activé. Pour l'activer, configurez VITE_RECAPTCHA_SITE_KEY.");
  }
}

export default app;

