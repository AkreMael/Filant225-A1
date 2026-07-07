import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import SpeakerIcon from './common/SpeakerIcon';
import CityAutocompleteInput from './common/CityAutocompleteInput';
import Typewriter from './common/Typewriter';
import { ADMIN_PHONE } from '../utils/authUtils';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onShowPopup: (msg: string, type: 'alert') => void;
}

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
);

const UserIcon: React.FC<{className: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const CityIcon: React.FC<{className: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const PhoneIcon: React.FC<{className: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>;
const KeyIcon: React.FC<{className: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onShowPopup }) => {
  const [isRegisterView, setIsRegisterView] = useState(true);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // States for Google Association workflow
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  const [googleAuthStep, setGoogleAuthStep] = useState<'associate_new' | 'associate_existing' | 'verify' | null>(null);

  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        setIsKeyboardVisible(window.visualViewport.height < window.innerHeight - 150);
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  useEffect(() => {
    const tempName = localStorage.getItem('filant_temp_name');
    const tempCity = localStorage.getItem('filant_temp_city');
    if (tempName) setName(tempName);
    if (tempCity) setCity(tempCity);
  }, []);
  
  const handleRegister = async () => {
    const sanitizedPhone = phone.replace(/\s/g, '');
    
    if (name.trim() === '' || city.trim() === '' || !/^\d{10}$/.test(sanitizedPhone)) {
      onShowPopup("Veuillez entrer votre nom, votre ville et un numéro à 10 chiffres.", "alert");
      return;
    }

    setIsLoading(true);
    try {
        const { user, error: registerError } = await databaseService.registerUser(name, city, sanitizedPhone);
        if (user) {
          // Clear temp data
          localStorage.removeItem('filant_temp_name');
          localStorage.removeItem('filant_temp_city');
          
          // Move to Google association screen instead of logging in directly
          setRegisteredUser(user);
          setGoogleAuthStep('associate_new');
        } else {
          onShowPopup(registerError || "Erreur lors de l'inscription.", "alert");
        }
    } catch (error) {
        onShowPopup("Une erreur est survenue lors de l'inscription. Veuillez réessayer.", "alert");
        console.error("Une erreur est survenue lors de l'inscription:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const sanitizedPhone = phone.replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(sanitizedPhone)) {
      onShowPopup("Veuillez entrer un numéro à 10 chiffres.", "alert");
      return;
    }
    
    setIsLoading(true);
    try {
        const { user, error: loginError } = await databaseService.loginUser(sanitizedPhone);
        if (user) {
          setPendingLoginUser(user);
          if (!user.googleUid) {
            // No Google account associated yet, must associate it now
            setGoogleAuthStep('associate_existing');
          } else {
            // Already has associated Google account, must verify it
            setGoogleAuthStep('verify');
          }
        } else {
          onShowPopup(loginError || "Erreur de connexion.", "alert");
        }
    } catch (error) {
        onShowPopup("Une erreur est survenue lors de la connexion. Veuillez réessayer.", "alert");
        console.error("Une erreur est survenue lors de la connexion:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleAssociate = async (userToUpdate: User) => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      if (googleUser && googleUser.email) {
        const success = await databaseService.associateGoogleAccount(
          userToUpdate.phone, 
          googleUser.uid, 
          googleUser.email
        );
        
        if (success) {
          const updatedUser = {
            ...userToUpdate,
            googleUid: googleUser.uid,
            googleEmail: googleUser.email
          };
          onLoginSuccess(updatedUser);
        } else {
          onShowPopup("Impossible d'associer votre compte Google. Veuillez réessayer.", "alert");
        }
      } else {
        onShowPopup("Impossible d'obtenir les informations de votre compte Google.", "alert");
      }
    } catch (error: any) {
      console.error("Error linking Google account:", error);
      if (error.code === 'auth/popup-blocked') {
        onShowPopup("La fenêtre de connexion Google a été bloquée. Veuillez autoriser les pop-ups.", "alert");
      } else if (error.code !== 'auth/popup-closed-by-user') {
        onShowPopup("Erreur lors de l'association Google : " + error.message, "alert");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleVerify = async (userToVerify: User) => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      if (googleUser) {
        if (googleUser.uid === userToVerify.googleUid || googleUser.email === userToVerify.googleEmail) {
          // Verification matches perfectly! Proceed to login successfully
          onLoginSuccess(userToVerify);
        } else {
          onShowPopup(`Erreur de sécurité : Le compte Google sélectionné (${googleUser.email}) ne correspond pas au compte Gmail associé à votre compte WhatsApp (${userToVerify.googleEmail}).`, "alert");
        }
      } else {
        onShowPopup("Impossible de valider votre compte Google.", "alert");
      }
    } catch (error: any) {
      console.error("Error during Google verification:", error);
      if (error.code === 'auth/popup-blocked') {
        onShowPopup("La fenêtre de connexion Google a été bloquée. Veuillez autoriser les pop-ups.", "alert");
      } else if (error.code !== 'auth/popup-closed-by-user') {
        onShowPopup("Erreur lors de la validation Google : " + error.message, "alert");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (isRegisterView) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-y-auto">
      <div className={`relative w-full flex-shrink-0 bg-orange-600 transition-all duration-300 flex items-center justify-center overflow-hidden ${isKeyboardVisible ? 'h-0 opacity-0' : 'h-[180px] sm:h-[220px]'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-2.5 border-2 border-orange-500/10">
            <img 
              src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/49d4592c-b74d-4904-b209-a32e8c921f1b.png" 
              alt="FILANT 225 Logo" 
              className="w-full h-full object-contain animate-pulse" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      </div>

      <div className={`flex-1 bg-white rounded-t-[3rem] relative z-10 p-6 sm:p-8 flex flex-col items-center transition-all duration-300 ${isKeyboardVisible ? 'mt-0 rounded-t-none' : '-mt-12'}`}>
        <div className="w-16 h-1.5 bg-gray-100 rounded-full mb-6 sm:mb-8"></div>
        
        <div className="w-full max-w-md space-y-6 sm:space-y-8 pb-12">
          {googleAuthStep ? (
            <div className="space-y-6 text-center animate-fade-in py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-black uppercase tracking-tight">
                  {googleAuthStep === 'verify' ? 'Vérification Google' : 'Association Google'}
                </h3>
                <div className="h-1.5 w-16 bg-orange-500 mx-auto rounded-full"></div>
              </div>

              <p className="text-sm text-gray-600 font-medium px-4 leading-relaxed">
                {googleAuthStep === 'associate_new' && (
                  "Votre inscription est presque terminée ! Pour sécuriser l'accès à votre compte, veuillez associer votre compte Google (Gmail)."
                )}
                {googleAuthStep === 'associate_existing' && (
                  "Une validation de sécurité est requise. Veuillez associer votre compte Google (Gmail) pour sécuriser vos prochaines connexions."
                )}
                {googleAuthStep === 'verify' && (
                  <>
                    Ce compte est protégé. Veuillez vous connecter avec le compte Google associé :
                    <span className="block mt-2 font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl text-center break-all text-sm font-mono">{pendingLoginUser?.googleEmail}</span>
                  </>
                )}
              </p>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (googleAuthStep === 'verify') {
                      handleGoogleVerify(pendingLoginUser!);
                    } else {
                      handleGoogleAssociate(googleAuthStep === 'associate_new' ? registeredUser! : pendingLoginUser!);
                    }
                  }}
                  className="w-full py-4 px-6 rounded-3xl shadow-lg flex items-center justify-center gap-3 font-black text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-80 transition-all min-h-[56px] text-sm uppercase tracking-wider"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google Logo" 
                        className="w-5 h-5 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                      <span>
                        {googleAuthStep === 'verify' ? "Valider avec Google" : "Associer mon compte Google"}
                      </span>
                    </>
                  )}
                </button>

                {googleAuthStep !== 'associate_new' && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setGoogleAuthStep(null);
                      setPendingLoginUser(null);
                    }}
                    className="w-full py-3 px-6 rounded-3xl text-xs font-black text-gray-400 hover:text-orange-500 uppercase tracking-widest transition-colors"
                  >
                    Annuler / Retour
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                  {isRegisterView ? "Inscription" : "Connexion"}
                </h2>
                <div className="h-1.5 w-20 bg-orange-500 mx-auto rounded-full"></div>
                
                <div className="text-sm text-gray-500 font-medium pt-4 px-4">
                  {isRegisterView ? (
                    <Typewriter text="Inscrivez-vous pour profiter pleinement de nos services sur FILANT°225." speed={20} delay={500} />
                  ) : (
                    <Typewriter text="Connectez-vous directement avec votre numéro WhatsApp." speed={20} delay={500} />
                  )}
                </div>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
                {isRegisterView && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Votre Nom *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Ex: Filant Mael" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold placeholder-gray-300 focus:border-orange-500 outline-none transition-all" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <SpeakerIcon text="Entrez votre nom" className="text-orange-500" />
                      </div>
                    </div>
                  </div>
                )}
                
                {isRegisterView && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Votre Ville *</label>
                    <div className="relative">
                      <CityIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <CityAutocompleteInput 
                        id="login-city"
                        value={city} 
                        onChange={setCity} 
                        placeholder="Ex: Abidjan, Cocody..." 
                        inputClassName="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold placeholder-gray-300 focus:border-orange-500 outline-none transition-all text-sm" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <SpeakerIcon text="Entrez votre ville" className="text-orange-500" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro WhatsApp *</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm select-none flex items-center gap-1.5">
                        <span>🇨🇮</span>
                        <span>+225</span>
                    </div>
                    <input 
                        type="tel" 
                        inputMode="tel"
                        pattern="[0-9]*"
                        placeholder="01 02 03 04 05" 
                        value={phone} 
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(val);
                        }} 
                        className="w-full pl-24 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold placeholder-gray-300 focus:border-orange-500 outline-none transition-all text-sm tracking-wide" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <SpeakerIcon text="Entrez votre numéro WhatsApp à 10 chiffres" className="text-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full py-5 px-4 rounded-3xl shadow-xl flex items-center justify-center font-black text-white transition-all transform active:scale-95 bg-orange-500 hover:bg-orange-600 disabled:opacity-80 disabled:cursor-not-allowed min-h-[64px] uppercase tracking-widest text-sm"
                  >
                      {isLoading ? <Spinner /> : (isRegisterView ? 'S\'inscrire maintenant' : 'Se connecter')}
                  </button>
                </div>
              </form>
              
              <div className="flex flex-col items-center space-y-4 pt-4">
                <button 
                  onClick={() => { 
                    setIsRegisterView(!isRegisterView); 
                  }} 
                  className="text-xs font-black text-gray-400 hover:text-orange-500 uppercase tracking-widest transition-colors"
                >
                    {isRegisterView ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
                </button>
              </div>
            </>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-100 w-full">
            <p className="text-[10px] text-gray-400 italic leading-tight text-center px-4">
              FILANT°225 est votre partenaire de confiance pour trouver des professionnels qualifiés en Côte d'Ivoire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
