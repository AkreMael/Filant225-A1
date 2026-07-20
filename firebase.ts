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
let messagingInstance = null;
if (typeof window !== 'undefined') {
  try {
    messagingInstance = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging is not supported or failed to initialize in this environment:", error);
  }
}
export const messaging = messagingInstance;

// Initialisation de App Check en mode Debug pour l'environnement de développement / iframe
// REMARQUE: Mettez ENABLE_APP_CHECK à true UNIQUEMENT si vous avez activé et configuré
// App Check et enregistré vos jetons de débogage (Debug Tokens) dans la console Firebase.
// Pour le développement local ou l'iframe de l'AI Studio, il est recommandé de le laisser à false.
const ENABLE_APP_CHECK = false;

if (typeof window !== 'undefined' && ENABLE_APP_CHECK) {
  // Activer le mode debug d'App Check pour générer un jeton de débogage dans la console
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseConfig.measurementId || 'any-dummy-recaptcha-key-for-debug'),
      isTokenAutoRefreshEnabled: true
    });
    console.log("🔥 Firebase App Check a été initialisé en mode DEBUG.");
    console.log("ℹ️ Regardez ci-dessus pour copier le 'App Check debug token' généré par Firebase, puis ajoutez-le dans la console Firebase pour autoriser la base de données.");
  } catch (error) {
    console.warn("⚠️ Impossible d'initialiser App Check :", error);
  }
}

export default app;
