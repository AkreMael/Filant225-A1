
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { getCardType } from '../utils/authUtils';

interface PaymentConfirmationScreenProps {
  title: string;
  amount: string;
  paymentType: string;
  user: User;
  waveLink: string;
  onBack: () => void;
  onSuccess?: () => void;
  formData?: {
    formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service';
    formTitle: string;
    data: any;
    whatsappMessage: string;
  };
}

const Spinner = () => (
    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const WaveLogo = () => (
  <div className="flex flex-col items-center">
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border border-gray-100">
        <img src="https://i.supaimg.com/ff5dee1c-8ed5-426e-8fb7-eba013e98837.png" alt="Wave" className="w-8 h-8 object-contain" />
    </div>
    <span className="text-[10px] font-black uppercase text-blue-400 mt-1">wave</span>
  </div>
);

const CardIconArea = ({ amount, isManual, onValueChange, onValidate, isValidated }: { 
    amount: string, 
    isManual: boolean, 
    onValueChange: (v: string) => void, 
    onValidate: () => void,
    isValidated: boolean 
}) => (
    <div className="bg-gray-100/50 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 shadow-inner border border-gray-200 mb-8 w-full max-w-[340px] mx-auto">
        <div className="flex items-center justify-center gap-4 w-full">
            <div className="relative flex-shrink-0">
                <svg width="80" height="52" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="66" rx="12" fill="#16a34a" />
                    <rect y="12" width="100" height="10" fill="#14532d" fillOpacity="0.15" />
                    <circle cx="72" cy="44" r="14" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="72" cy="44" r="11" fill="white" fillOpacity="0.2" />
                    <path d="M72 38V50M72 38L68 42M72 38L76 42" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            
            {!isManual || isValidated ? (
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-[#16a34a] tracking-tighter animate-in zoom-in-50 duration-300">{amount}</span>
                    <span className="text-lg font-black text-gray-900">CFA</span>
                </div>
            ) : (
                <div className="flex-1 flex gap-2 animate-in slide-in-from-right-10 duration-500">
                    <input 
                        type="number"
                        inputMode="numeric"
                        placeholder="Montant..."
                        value={amount === "custom" ? "" : amount}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="flex-1 bg-white border-2 border-green-500 rounded-xl px-4 py-3 text-xl font-black text-green-700 outline-none shadow-sm placeholder-gray-300"
                    />
                    <button 
                        onClick={onValidate}
                        disabled={!amount || amount === "custom"}
                        className="bg-green-600 text-white font-black px-4 py-2 rounded-xl active:scale-95 transition-all shadow-md disabled:bg-gray-300 uppercase text-xs"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
        {isManual && !isValidated && (
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Saisissez le montant d’expédition</p>
        )}
    </div>
);

const PaymentConfirmationScreen: React.FC<PaymentConfirmationScreenProps> = ({ 
    title, 
    amount: initialAmount, 
    paymentType, 
    user, 
    waveLink, 
    onBack, 
    onSuccess,
    formData
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [isManualMode] = useState(initialAmount === "custom");
  const [isValidated, setIsValidated] = useState(initialAmount !== "custom");

    const handlePay = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        const finalLink = isManualMode ? `${waveLink}${currentAmount}` : waveLink;
        const amountToSave = isManualMode ? currentAmount : initialAmount;

        // 1. Redirection immédiate pour éviter les bloqueurs de pop-up
        // On tente d'ouvrir dans un nouvel onglet pour que l'app reste visible avec l'état "Paiement en cours"
        const paymentWindow = window.open(finalLink, '_blank');
        
        // Si window.open est bloqué (retourne null), on redirige l'onglet actuel
        if (!paymentWindow) {
            window.location.href = finalLink;
        }

        // 2. Sauvegardes en arrière-plan (non bloquantes pour la redirection)
        const saveProcess = async () => {
            try {
                if (paymentType === "Publication" && formData) {
                    try {
                        await fetch('/api/publish-offer', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData.data),
                        });
                    } catch (error) {
                        console.error("Error publishing offer from payment screen:", error);
                    }
                }

                // New Logic for QR Code Activation
                if (amountToSave === "310") {
                    await databaseService.updateQRCodeActivation(user.phone, {
                        name: user.name,
                        phone: user.phone,
                        city: user.city,
                        status: "Frais payés - En attente activation (7 100 FCFA)",
                        fraisDossierPayes: true
                    });
                } else if (amountToSave === "7100" || amountToSave === "500") {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    
                    await databaseService.updateQRCodeActivation(user.phone, {
                        name: user.name,
                        phone: user.phone,
                        city: user.city,
                        status: "Code QR Actif",
                        activationDate: new Date().toISOString(),
                        expiryDate: expiryDate.toISOString(),
                        fraisDossierPayes: true
                    });
                }

                databaseService.savePaymentToRTDB({
                  userId: user.phone.replace(/\D/g, ''),
                  userName: user.name,
                  phone: user.phone,
                  city: user.city,
                  amount: amountToSave,
                  title: title,
                  serviceType: title,
                  paymentType: paymentType,
                  timestamp: Date.now()
                });

                if (formData) {
                    databaseService.saveFavorite(user.phone, {
                        title: formData.formTitle,
                        date: new Date().toISOString(),
                        formType: formData.formType as any,
                        answers: formData.data,
                        userInfo: user,
                        totalPrice: parseInt(amountToSave)
                    });
                    
                    databaseService.saveFormSubmission({
                        userPhone: user.phone,
                        formType: formData.formType,
                        formTitle: formData.formTitle,
                        data: formData.data,
                        whatsappMessage: formData.whatsappMessage
                    });
                }
            } catch (error) {
                console.error("Erreur lors de la sauvegarde du paiement:", error);
            }
        };

        saveProcess();
    };

  const handleManualValueChange = (val: string) => {
      setCurrentAmount(val);
  };

  const handleValidate = () => {
      if (currentAmount && currentAmount !== "custom") {
          setIsValidated(true);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 font-sans overflow-hidden">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 active:scale-90 transition-transform">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-blue-900">Paiement</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="text-center mb-6 w-full">
              <h2 className="text-xl font-black text-gray-900 leading-tight">
                  service de : {title}
              </h2>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                  CLIENT : {user.name} • {paymentType.toUpperCase()}
              </p>
          </div>

          <CardIconArea 
            amount={currentAmount} 
            isManual={isManualMode} 
            onValueChange={handleManualValueChange}
            onValidate={handleValidate}
            isValidated={isValidated}
          />

          <div className="space-y-5 px-1 text-center w-full">
              <p className="text-lg font-bold text-gray-900 leading-[1.35]">
                Cliquez sur le bouton ci-dessous pour procéder au paiement sécurisé via Wave.
              </p>
          </div>

          <div className="mt-auto w-full pt-8 pb-4 flex items-center justify-between gap-6">
              <WaveLogo />
              <button 
                onClick={handlePay}
                disabled={isProcessing || isSuccess || !isValidated}
                className={`flex-1 font-black py-4 px-6 rounded-2xl shadow-xl transform active:scale-95 transition-all text-2xl uppercase tracking-wider min-h-[72px] flex items-center justify-center ${
                    isProcessing 
                    ? 'bg-gray-100 cursor-default' 
                    : isSuccess
                        ? 'bg-green-500 text-white'
                        : isValidated 
                            ? 'bg-[#33C4F3] hover:bg-[#2bb2dd] text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-blue-500 text-lg">Paiement en cours...</span>
                    </div>
                ) : isSuccess ? (
                    <div className="flex items-center gap-3 animate-in zoom-in duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Succès</span>
                    </div>
                ) : 'Payer'}
              </button>
          </div>
      </main>
    </div>
  );
};

export default PaymentConfirmationScreen;
