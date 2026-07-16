import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { Wrench, Check, X, MapPin } from 'lucide-react';

interface ServicesRequestsScreenProps {
  onBack: () => void;
  user: User;
  onShowPopup: (
    msg: string,
    type: 'alert' | 'confirm',
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void
  ) => void;
}

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ServicesRequestsScreen: React.FC<ServicesRequestsScreenProps> = ({ onBack, user, onShowPopup }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const prestatairePhone = (user?.phone || '').replace(/\D/g, '');

  useEffect(() => {
    if (!prestatairePhone) return;
    
    // Subscribe to ServiceRequests for this provider
    const unsub = databaseService.subscribeToProviderServiceRequests(prestatairePhone, (newRequests) => {
      setRequests(newRequests);
      setLoading(false);
      
      // Mark as read in real time if there are any unread ones
      const hasUnread = newRequests.some(req => req.isRead !== true);
      if (hasUnread) {
        databaseService.markServiceRequestsAsRead(prestatairePhone);
      }
    });

    return () => unsub();
  }, [prestatairePhone]);

  const handleAccept = (req: any) => {
    onShowPopup("Accepter cette demande de service ?\nLe client pourra voir votre numéro de téléphone et vous contacter.", 'confirm', async (close, setLoadingPopup) => {
      setLoadingPopup(true);
      try {
        await databaseService.acceptServiceRequest(req.id, prestatairePhone, req.phone);
        close();
      } catch (err) {
        console.error(err);
        alert("Une erreur s'est produite.");
        setLoadingPopup(false);
      }
    });
  };

  const handleRefuse = (req: any) => {
    onShowPopup("Refuser cette demande de service ?\nLe client sera notifié et remboursé automatiquement.", 'confirm', async (close, setLoadingPopup) => {
      setLoadingPopup(true);
      try {
        const amt = parseFloat(req.totalPrice || '0') || 0;
        await databaseService.refuseServiceRequest(
          req.id,
          prestatairePhone,
          req.phone,
          amt,
          req.userName,
          req.city,
          req.paymentRtdbPath
        );
        close();
      } catch (err) {
        console.error(err);
        alert("Une erreur s'est produite.");
        setLoadingPopup(false);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F3F3] animate-in slide-in-from-right duration-300">
      <header className="p-4 flex items-center bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0 border border-gray-200 dark:border-slate-600">
          <BackIcon />
        </button>
        <h1 className="flex-1 text-center font-black uppercase text-base tracking-tight mr-10 text-gray-900">Services</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest leading-tight text-gray-500">AUCUNE DEMANDE DE SERVICE EN COURS</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-100 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="bg-pink-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full w-fit mb-1 shadow-sm tracking-tight">
                    {req.serviceTitle || 'Demande de service'}
                  </span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[180px]">
                    {req.userName || 'Client'}
                  </h4>
                </div>
                <div className="bg-blue-50 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-blue-100 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-tighter truncate max-w-[80px]">
                    {req.city || 'Non spécifiée'}
                  </span>
                </div>
              </div>

              {req.answers && Object.entries(req.answers).filter(([key]) => !['Nom du prestataire', 'Ville du prestataire', 'Activité recherchée', 'Type de profil'].includes(key)).length > 0 && (
                <div className="text-xs text-gray-600 border-l-2 border-pink-100 pl-3 space-y-1">
                  {Object.entries(req.answers)
                    .filter(([key]) => !['Nom du prestataire', 'Ville du prestataire', 'Activité recherchée', 'Type de profil'].includes(key))
                    .map(([k, v]: [string, any]) => (
                      <div key={k}>
                        <span className="font-bold">{k} :</span> {v}
                      </div>
                    ))
                  }
                </div>
              )}

              <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Montant Service</p>
                  <p className="text-pink-600 font-black text-sm tracking-tight">
                    {parseFloat(req.totalPrice || '0').toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                
                <div className="flex gap-2.5">
                  <button 
                    onClick={() => handleRefuse(req)} 
                    className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center border border-red-200"
                    title="Refuser"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleAccept(req)} 
                    className="p-3 bg-green-100 hover:bg-green-200 text-green-600 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center border border-green-200"
                    title="Accepter"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default ServicesRequestsScreen;
