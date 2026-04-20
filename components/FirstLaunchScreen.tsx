
import React, { useState } from 'react';

interface FirstLaunchScreenProps {
  onComplete: () => void;
}

interface ProfileOption {
  id: number;
  label: string;
  confirmationMessage: string;
  confirmationBold: string;
  icon: React.ReactNode;
}

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const WorkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.67.38m-4.5-8.319v2.25m0-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v2.25m0 2.25v2.25m0-2.25a2.185 2.185 0 01-1.383-.618m0 2.25c.194.165.42.295.67.38m0-2.25c.67.38.194.67.67.38" />
  </svg>
);

const OwnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const AgencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const options: ProfileOption[] = [
  { 
    id: 1, 
    label: "Je suis un Client", 
    confirmationMessage: "Êtes-vous sûr de vouloir vous inscrire en tant que", 
    confirmationBold: "Client en recherche de services",
    icon: <UserIcon />
  },
  { 
    id: 2, 
    label: "Je suis un Travailleur", 
    confirmationMessage: "Êtes-vous sûr de vouloir vous inscrire en tant que", 
    confirmationBold: "Travailleur",
    icon: <WorkerIcon />
  },
  { 
    id: 3, 
    label: "Je suis un Propriétaire d’équipement", 
    confirmationMessage: "Êtes-vous sûr de vouloir vous inscrire en tant que", 
    confirmationBold: "Propriétaire d’équipement",
    icon: <OwnerIcon />
  },
  { 
    id: 4, 
    label: "Je suis une Agence immobilière", 
    confirmationMessage: "Êtes-vous sûr de vouloir vous inscrire en tant que", 
    confirmationBold: "Agence immobilière",
    icon: <AgencyIcon />
  },
  { 
    id: 5, 
    label: "Je suis un Admin 225", 
    confirmationMessage: "Êtes-vous sûr de vouloir vous connecter en tant que", 
    confirmationBold: "Admin 225",
    icon: <AdminIcon />
  },
];

const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<ProfileOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    
    // Save Role Logic
    let roleShort = "Client"; // Default
    if (selectedOption) {
        switch (selectedOption.id) {
            case 1: roleShort = "Client"; break;
            case 2: roleShort = "Travailleur"; break;
            case 3: roleShort = "Propriété"; break;
            case 4: roleShort = "Agence"; break;
            case 5: roleShort = "Admin 225"; break;
            default: roleShort = "Client";
        }
    }
    localStorage.setItem('filant_user_role', roleShort);

    // Loading lasts 5 seconds as requested
    setTimeout(() => {
      onComplete();
    }, 5000);
  };

  const handleCancel = () => {
    setSelectedOption(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-500 to-indigo-900 text-white p-4">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold animate-pulse">Chargement en cours...</h2>
        <p className="text-sm text-white/80 mt-2">Configuration de votre profil</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-500 to-indigo-900 text-white font-sans p-6 overflow-hidden">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-4 drop-shadow-md">
            Bienvenue sur <br/>
            <span className="text-white text-5xl">FILANT°225</span>
          </h1>
          <p className="text-white/90 text-sm leading-relaxed max-w-xs mx-auto">
            Veuillez sélectionner votre profil afin de commencer votre inscription et accéder à nos services.
          </p>
        </header>

        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option)}
              className="w-full p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                      {option.icon}
                  </div>
                  <span className="font-bold text-lg text-white">{option.label}</span>
              </div>
              <div className="pr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70 group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedOption && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border-2 border-orange-500 transform transition-all scale-100 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6 leading-relaxed">
              {selectedOption.confirmationMessage} <br/>
              <span className="text-orange-500">{selectedOption.confirmationBold}</span> ?
            </h3>
            
            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-transform transform hover:scale-105"
              >
                Oui
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstLaunchScreen;
