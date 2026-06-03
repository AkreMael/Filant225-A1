import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { getCardType } from '../utils/authUtils';
import { rtdb } from '../firebase';
import { ref as rtdbRef, onValue, off } from 'firebase/database';
import { CreditCard } from 'lucide-react';

interface PaymentConfirmationScreenProps {
  title: string;
  amount: string;
  paymentType: string;
  user: User;
  waveLink: string;
  onBack: () => void;
  onSuccess?: () => void;
  onModify?: () => void;
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
    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border border-gray-100 p-0.5">
        <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/73da4ae5-abba-4c0a-8da6-c3d9b2ca23e2.png" alt="Wave Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
    </div>
    <span className="text-[10px] font-black uppercase text-[#33C4F3] mt-1">Wave</span>
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
                        className="flex-1 bg-white border-2 border-green-500 rounded-xl px-4 py-3 text-xl font-black text-green-700 outline-none shadow-sm placeholder-gray-300 animate-pulse"
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
    onModify,
    formData
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNonValidated, setIsNonValidated] = useState(false);
  const [paymentPath, setPaymentPath] = useState<string | null>(null);
  const [waveNumber, setWaveNumber] = useState('');
  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [isManualMode] = useState(initialAmount === "custom");
  const [isValidated, setIsValidated] = useState(initialAmount !== "custom");

  // FILANT°225 wallet states
  const [wallet, setWallet] = useState<{ phone: string; balance: number; name: string; city: string }>({
    phone: user.phone || '',
    balance: 0,
    name: user.name || '',
    city: user.city || ''
  });
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Deposit Overlay state
  const [showDepositOverlay, setShowDepositOverlay] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState(user.phone || '');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    let unsubWallet = () => {};
    if (user?.phone) {
      setLoadingWallet(true);
      unsubWallet = databaseService.subscribeToWallet(user.phone, (walletData) => {
        setWallet(walletData);
        setLoadingWallet(false);
      });
    }
    return () => unsubWallet();
  }, [user?.phone]);

  // Standard RTDB subscriber for payments (can be kept for backward comp or sync triggers if needed)
  useEffect(() => {
    if (!paymentPath) return;
    const statusRef = rtdbRef(rtdb, paymentPath);
    const unsub = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.status === 'Paiement validé') {
          setIsSuccess(true);
          setIsProcessing(false);
          setIsNonValidated(false);
          if (onSuccess) setTimeout(onSuccess, 1500);
        } else if (data.status === 'Paiement non validé') {
          setIsNonValidated(true);
          setIsProcessing(false);
        } else {
          setIsNonValidated(false);
        }
      }
    });
    return () => off(statusRef);
  }, [paymentPath, onSuccess]);

  const handlePay = async () => {
    if (isProcessing) return;
    
    // Calculate numeric amount needed
    const needed = parseFloat(currentAmount);
    if (isNaN(needed) || needed <= 0) {
      alert("Montant invalide.");
      return;
    }

    // Check balance
    if (wallet.balance < needed) {
      // Balance is insufficient, we open deposit flow
      setShowDepositOverlay(true);
      // Auto-suggest the difference or the exact required amount
      const diff = needed - wallet.balance;
      setDepositAmount(diff > 0 ? diff.toString() : '');
      setDepositPhone(user.phone || '');
      setDepositSuccess(false);
      return;
    }

    setIsProcessing(true);
    setIsNonValidated(false);

    try {
      // 1. Process wallet payment deduct
      const refCode = `REF-${Date.now().toString(36).toUpperCase()}`;
      const res = await databaseService.processWalletPayment(
        user.phone,
        user.name,
        user.city || 'Non spécifiée',
        needed,
        `Débit de service - ${title}`,
        refCode
      );

      if (!res.success) {
        alert(res.error || "Une erreur s'est produite.");
        setIsProcessing(false);
        return;
      }

      // 2. Publish offer if requested
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
          console.error("Error publishing offer:", error);
        }
      }

      // 3. Write validated payment log into RTDB / Admin overview
      const path = await databaseService.savePaymentToRTDB({
        userId: user.phone.replace(/\D/g, ''),
        userName: user.name,
        phone: user.phone,
        city: user.city,
        amount: currentAmount,
        title: title,
        serviceType: title,
        paymentType: paymentType,
        waveNumber: 'FILANT°225 PORTEFEUILLE',
        timestamp: Date.now(),
        status: 'Paiement validé' // Approved instantly!
      });

      if (path) setPaymentPath(path);

      // 4. Save to user favorites and form submissions
      if (formData) {
        await databaseService.saveFavorite(user.phone, {
          title: formData.formTitle,
          date: new Date().toISOString(),
          formType: formData.formType as any,
          answers: formData.data,
          userInfo: user,
          totalPrice: needed
        });
        
        await databaseService.saveFormSubmission({
          userPhone: user.phone,
          formType: formData.formType,
          formTitle: formData.formTitle,
          data: formData.data,
          whatsappMessage: formData.whatsappMessage
        });
      }

      setIsSuccess(true);
      setIsProcessing(false);
      if (onSuccess) setTimeout(onSuccess, 1500);

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Une erreur s'est produite lors du paiement.");
    }
  };

  const handleManualValueChange = (val: string) => {
      setCurrentAmount(val);
  };

  const handleValidate = () => {
      if (currentAmount && currentAmount !== "custom") {
          setIsValidated(true);
      }
  };

  const requiredAmountNum = parseFloat(currentAmount) || 0;
  const isInsufficient = wallet.balance < requiredAmountNum;

  const renderDepositOverlayContent = () => {
    const handleConfirmDeposit = async () => {
      const depAmtNum = parseFloat(depositAmount);
      if (isNaN(depAmtNum) || depAmtNum <= 0) {
        alert("Montant invalide.");
        return;
      }
      if (depositPhone.length < 10) {
        alert("Numéro Wave invalide.");
        return;
      }

      setIsDepositing(true);
      try {
        await databaseService.createDeposit(
          user.phone,
          user.name || 'Utilisateur',
          user.city || 'Non spécifiée',
          depAmtNum,
          depositPhone
        );
        setDepositSuccess(true);
      } catch (err) {
        console.error(err);
        alert("Une erreur est survenue lors de l'enregistrement du dépôt.");
      } finally {
        setIsDepositing(false);
      }
    };

    if (depositSuccess) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center h-full max-w-sm mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center text-green-600 animate-bounce">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Dépôt effectué !</h2>
          <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed">
            Votre dépôt de <span className="text-green-600 font-extrabold">{parseFloat(depositAmount).toLocaleString('fr-FR')} FCFA</span> est validé. Votre solde a été mis à jour automatiquement.
          </p>
          <button
            onClick={() => {
              setShowDepositOverlay(false);
              setDepositSuccess(false);
              setDepositAmount('');
            }}
            className="w-full bg-slate-950 hover:bg-black text-white font-black py-4 rounded-2xl uppercase tracking-wider text-xs active:scale-95 transition-all cursor-pointer"
          >
            Retour au paiement
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6 max-w-sm mx-auto h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 border-b-2 border-blue-500 pb-1">Dépôt de compte</h3>
            <button onClick={() => setShowDepositOverlay(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Montant à recharger (FCFA)</label>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 530" 
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-base font-black text-slate-900 outline-none placeholder-slate-200 transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Numéro de paiement Wave</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">🇲🇱 +225</span>
                <input 
                  type="text"
                  maxLength={10}
                  value={depositPhone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    if (clean.length <= 10) setDepositPhone(clean);
                  }}
                  placeholder="00 00 00 00 00" 
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-20 pr-5 py-3.5 text-base font-black text-slate-900 outline-none placeholder-slate-200 transition-all font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmDeposit}
          disabled={isDepositing || !depositAmount || depositPhone.length !== 10}
          className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer ${
            isDepositing || !depositAmount || depositPhone.length !== 10
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {isDepositing ? "Traitement..." : "Confirmer le Dépôt"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 font-sans overflow-hidden relative">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 active:scale-90 transition-transform">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-blue-900">Paiement</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center relative">
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

          {loadingWallet ? (
            <div className="p-6 text-center animate-pulse flex flex-col items-center gap-3 w-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Vérification de votre compte...</p>
            </div>
          ) : (
            <div className="w-full max-w-[340px] px-2 mb-6 font-sans">
              {/* Wallet Status Area */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 block font-sans">Identité Compte</span>
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">FILANT°225</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Solde actuel</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{wallet.balance.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Prix du Service</span>
                    <p className="text-xl font-black text-blue-600 tracking-tight">{requiredAmountNum.toLocaleString('fr-FR')} <span className="text-xs font-bold text-blue-500">FCFA</span></p>
                  </div>
                </div>

                {isInsufficient ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center space-y-3 font-sans">
                    <p className="text-[9.5px] font-extrabold text-rose-600 uppercase tracking-wide leading-relaxed font-sans">
                      Fonds insuffisants. Veuillez effectuer un dépôt pour poursuivre votre demande.
                    </p>
                    <button
                      onClick={() => {
                        setDepositSuccess(false);
                        setDepositPhone(user.phone || '');
                        const diff = requiredAmountNum - wallet.balance;
                        setDepositAmount(diff > 0 ? diff.toString() : '');
                        setShowDepositOverlay(true);
                      }}
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-[10px] uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-rose-200"
                    >
                      Dépôt
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
                    <p className="text-[9px] font-extrabold text-green-700 uppercase tracking-wide">
                      Solde suffisant ! Nouveau solde après achat : <span className="font-black text-[11px]">{(wallet.balance - requiredAmountNum).toLocaleString('fr-FR')} FCFA</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 px-4 text-center w-full max-w-[340px]">
              <div className="text-base font-bold text-gray-900 leading-[1.35]">
                {isSuccess ? (
                  <span className="text-green-600 animate-bounce block">Paiement validé avec succès !</span>
                ) : isProcessing ? (
                  <div className="text-blue-600 block bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 animate-pulse space-y-2">
                    <p className="font-black text-xs uppercase tracking-wider">Débit du portefeuille en cours</p>
                    <p className="text-[10px] leading-relaxed text-blue-800/80 font-medium">Votre compte est débité en toute sécurité par cryptage local...</p>
                  </div>
                ) : isInsufficient ? (
                  <span className="text-rose-500 text-xs font-black uppercase tracking-wide">Solde insuffisant pour commander ce service.</span>
                ) : (
                  "Validez la transaction pour continuer l'opération du service."
                )}
              </div>
          </div>

          <div className="mt-auto w-full pt-8 pb-4 flex items-center justify-between gap-6">
              <div className="flex flex-col items-center">
                <CreditCard className="w-10 h-10 text-blue-500" />
                <span className="text-[8px] font-black uppercase text-slate-400 mt-1 font-sans">WALLET SECURE</span>
              </div>
              <button 
                onClick={handlePay}
                disabled={isProcessing || isSuccess || !isValidated || isInsufficient || loadingWallet}
                className={`flex-1 font-black py-4 px-6 rounded-2xl shadow-xl transform active:scale-95 transition-all text-xl uppercase tracking-wider min-h-[72px] flex items-center justify-center cursor-pointer font-sans ${
                    isSuccess
                        ? 'bg-green-500 text-white shadow-green-200'
                        : isProcessing 
                            ? 'bg-gray-100 cursor-default shadow-none' 
                            : (isValidated && !isInsufficient && !loadingWallet) 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isProcessing ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-blue-600 text-base">TRANSACTION...</span>
                    </div>
                ) : isSuccess ? (
                    <div className="flex items-center gap-3 animate-in zoom-in duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Validé</span>
                    </div>
                ) : 'Payer avec le Portefeuille'}
              </button>
          </div>
      </main>

      {/* Floating Deposit overlay for immediate reloading right on the spot */}
      {showDepositOverlay && (
        <div className="absolute inset-0 bg-black/60 z-[200] flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] w-full max-w-md h-[440px] shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {renderDepositOverlayContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmationScreen;
