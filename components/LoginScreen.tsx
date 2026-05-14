import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import SpeakerIcon from './common/SpeakerIcon';
import Typewriter from './common/Typewriter';
import { ADMIN_PHONE } from '../utils/authUtils';

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
          onLoginSuccess(user);
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
          onLoginSuccess(user);
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
      <div className="relative h-[180px] sm:h-[220px] w-full flex-shrink-0 bg-orange-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-orange-600 font-black text-5xl">F</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] -mt-12 relative z-10 p-6 sm:p-8 flex flex-col items-center">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full mb-6 sm:mb-8"></div>
        
        <div className="w-full max-w-md space-y-6 sm:space-y-8 pb-12">
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
                  <input 
                    type="text" 
                    placeholder="Ex: Abidjan" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold placeholder-gray-300 focus:border-orange-500 outline-none transition-all" 
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
                <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm select-none">
                    +225
                </div>
                <input 
                    type="tel" 
                    placeholder="0102030405" 
                    value={phone} 
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                    }} 
                    className="w-full pl-[4.5rem] pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold placeholder-gray-300 focus:border-orange-500 outline-none transition-all" 
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
