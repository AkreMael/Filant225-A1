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
  onGoToMenu?: () => void;
  onShowPopup?: (
    message: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string,
    title?: string
  ) => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
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
        <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98b8035e-bacd-491a-8ff2-81d947531063.png" alt="Wave Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
    <div className="bg-gray-100/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-inner border border-gray-200 mb-3 w-full max-w-[340px] mx-auto">
        <div className="flex items-center justify-center gap-3 w-full">
            <div className="relative flex-shrink-0">
                <img 
                  src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98b8035e-bacd-491a-8ff2-81d947531063.png" 
                  alt="Wave Logo" 
                  className="w-14 h-14 object-contain rounded-full bg-white p-0.5 shadow-sm border border-gray-150" 
                  referrerPolicy="no-referrer" 
                />
            </div>
            
            {!isManual || isValidated ? (
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#16a34a] tracking-tighter animate-in zoom-in-50 duration-300">
                      {parseFloat(amount) ? parseFloat(amount).toLocaleString('fr-FR') : amount}
                    </span>
                    <span className="text-xs font-black text-gray-900">CFA</span>
                </div>
            ) : (
                <div className="flex-1 flex gap-2 animate-in slide-in-from-right-10 duration-500 max-w-[200px]">
                    <input 
                        type="number"
                        inputMode="numeric"
                        placeholder="Montant..."
                        value={amount === "custom" ? "" : amount}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="flex-1 min-w-0 bg-white border-2 border-green-500 rounded-xl px-3 py-1.5 text-base font-black text-green-750 outline-none shadow-sm placeholder-gray-300 animate-pulse"
                    />
                    <button 
                        onClick={onValidate}
                        disabled={!amount || amount === "custom"}
                        className="bg-green-600 text-white font-black px-3 py-1 rounded-xl active:scale-95 transition-all shadow-md disabled:bg-gray-300 uppercase text-[10px] cursor-pointer"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
        {isManual && !isValidated && (
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Saisissez le montant d’expédition</p>
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
    formData,
    onGoToMenu,
    onShowPopup,
    onRegisterBackHandler
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNonValidated, setIsNonValidated] = useState(false);
  const [paymentPath, setPaymentPath] = useState<string | null>(null);
  const [hasAutoPaid, setHasAutoPaid] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const handleBackNavigation = () => {
    // If payment is completed and validated (isSuccess is true), return directly to menu principal
    if (isSuccess) {
      if (onGoToMenu) {
        onGoToMenu();
      } else {
        onBack();
      }
      return true; // handled
    }

    // If payment or deposit is in progress/pending
    const isPendingPayment = isProcessing || !!paymentPath;
    const isPendingDeposit = pendingDepositStatus === 'PENDING' || isDepositing;
    if (isPendingPayment || isPendingDeposit) {
      if (onShowPopup && onGoToMenu) {
        onShowPopup(
          "Votre paiement ou votre dépôt est encore en cours de traitement. Si vous quittez cette page, vous pourrez reprendre l'opération plus tard.",
          "confirm",
          (close) => {
            close();
            onGoToMenu();
          },
          "Quitter",
          "Rester sur la page",
          "Quitter cette page ?"
        );
      } else {
        const confirmExit = window.confirm("Quitter cette page ? Votre paiement ou votre dépôt est encore en cours de traitement.");
        if (confirmExit) {
          if (onGoToMenu) onGoToMenu(); else onBack();
        }
      }
      return true; // handled
    }

    // Otherwise, normal back behavior
    onBack();
    return true; // handled
  };
  
  const storageKey = `filant_wave_number_${user?.phone || 'default'}`;
  const [waveNumber, setWaveNumber] = useState(() => {
    return localStorage.getItem(storageKey) || user?.phone || '';
  });
  const [isEditingWaveNumber, setIsEditingWaveNumber] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return !saved || saved.length !== 10;
  });

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
  const [pendingDepositPath, setPendingDepositPath] = useState<string | null>(null);
  const [pendingDepositStatus, setPendingDepositStatus] = useState<string | null>(null);

  // Automatically save waveNumber to localStorage whenever it reaches 10 digits
  useEffect(() => {
    if (waveNumber.length === 10) {
      localStorage.setItem(storageKey, waveNumber);
    }
  }, [waveNumber, storageKey]);

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

  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(handleBackNavigation);
      return () => {
        onRegisterBackHandler(null);
      };
    }
  }, [onRegisterBackHandler, isSuccess, isProcessing, paymentPath, pendingDepositStatus, isDepositing, onBack, onGoToMenu, onShowPopup]);

  // Listener for pending deposit path
  useEffect(() => {
    if (!pendingDepositPath) return;
    setPendingDepositStatus('PENDING');
    const statusRef = rtdbRef(rtdb, pendingDepositPath);
    const unsub = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.status === 'Paiement validé' || data.status === 'Dépôt validé') {
          setPendingDepositStatus('SUCCESS');
          setShowDepositOverlay(false);
          
          // AUTO-FINALIZE SYSTEM:
          // Since the server-side database validation automatically credits the wallet,
          // deducts the required fee, and activates the profile/postings automatically,
          // we transition the UI immediately to SUCCESS to avoid requiring double validations.
          setIsSuccess(true);
          setIsProcessing(false);
          setIsNonValidated(false);
          if (onSuccess) {
            setTimeout(() => {
              if (paymentType === 'Mise en ligne') {
                (onSuccess as any)(true);
              } else {
                onSuccess();
              }
            }, 1850);
          }
        } else if (data.status === 'Paiement non validé' || data.status === 'Dépôt non validé') {
          if (data.status === 'Dépôt non validé') {
            setPendingDepositStatus('FAILED');
          }
        }
      }
    });
    return () => off(statusRef);
  }, [pendingDepositPath, onSuccess, paymentType]);

  // Standard RTDB subscriber for payments (can be kept for backward comp or sync triggers if needed)
  useEffect(() => {
    if (!paymentPath) return;
    const statusRef = rtdbRef(rtdb, paymentPath);
    const unsub = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.status === 'Paiement validé' || data.status === 'Dépôt validé') {
          setIsSuccess(true);
          setIsProcessing(false);
          setIsNonValidated(false);
          if (onSuccess) setTimeout(onSuccess, 1500);
        } else if (data.status === 'Paiement non validé' || data.status === 'Dépôt non validé') {
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

    if (paymentType === 'Dépôt') {
      if (waveNumber.length !== 10) {
        alert("Veuillez saisir votre numéro Wave à 10 chiffres.");
        return;
      }
      setIsProcessing(true);
      setIsNonValidated(false);
      try {
        const path = await databaseService.savePaymentToRTDB({
          userId: user.phone.replace(/\D/g, ''),
          userName: user.name,
          phone: user.phone,
          city: user.city || 'Non spécifiée',
          amount: currentAmount,
          title: "Dépôt vers le compte principal",
          serviceType: "Dépôt vers le compte principal",
          paymentType: "Dépôt",
          waveNumber: waveNumber,
          timestamp: Date.now(),
          status: 'En attente'
        });

        if (path) {
          setPaymentPath(path);
          const pushId = path.split('/').pop() || '';
          
          if ((window as any).PaiementPro) {
            try {
              const merchantId = (import.meta.env.VITE_PAIEMENTPRO_MERCHANT_ID) || 'PP_F175';
              const payment = new (window as any).PaiementPro(merchantId);
              payment.amount = currentAmount;
              payment.description = "Dépôt Portefeuille FILANT°225";
              payment.channel = "Wave";
              payment.countryCurrencyCode = "952";
              payment.referenceNumber = pushId;
              payment.customerEmail = `${waveNumber}@filant225.com`;
              payment.customerFirstName = user.name || "Client";
              payment.customerLastname = "FILANT";
              payment.customerPhoneNumber = waveNumber;
              payment.notificationURL = `${window.location.origin}/api/payments/webhook`;

              console.log("Launching PaiementPro for paymentType=Dépôt...", payment);
              const response = await payment.init();
              console.log("PaiementPro response:", response);

              if (response && (response.url || response.redirect_url || typeof response === 'string')) {
                const url = response.url || response.redirect_url || (typeof response === 'string' ? response : null);
                if (url) {
                  setIframeUrl(url);
                }
              }
            } catch (sdkErr) {
              console.error("PaiementPro SDK initiation error, falling back to standard Wave link:", sdkErr);
              const link = `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${currentAmount}`;
              window.open(link, '_blank');
            }
          } else {
            console.warn("PaiementPro global class is not present. Falling back to standard Wave link.");
            const link = `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${currentAmount}`;
            window.open(link, '_blank');
          }
        } else {
          alert("Une erreur s'est produite lors de l'enregistrement du dépôt.");
          setIsProcessing(false);
        }
      } catch (err) {
        console.error(err);
        alert("Une erreur s'est produite.");
        setIsProcessing(false);
      }
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

      // 1.5. Update QR Code Activations status instantly if it relates to the activation tunnel
      if (paymentType === 'Inscription' || needed === 310) {
        try {
          await databaseService.updateQRCodeActivation(user.phone, {
            status: "En attente paiement activation (7 100 FCFA)",
            fraisDossierPayes: true,
          });
          console.log("Updated QRCodeActivation to: En attente paiement activation for", user.phone);
        } catch (qrErr) {
          console.error("Error updating QR Code Activation instantly during wallet payment:", qrErr);
        }
      } else if (paymentType === 'Activation' || needed === 7100) {
        try {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          await databaseService.updateQRCodeActivation(user.phone, {
            status: "Code QR Actif",
            isVerified: true,
            expiryDate: expiryDate.toISOString(),
            activationDate: new Date().toISOString(),
          });
          console.log("Updated QRCodeActivation to: Code QR Actif for", user.phone);
        } catch (qrErr) {
          console.error("Error updating QR Code Activation instantly during wallet payment:", qrErr);
        }
      } else if (paymentType === 'Renouvellement' || needed === 500) {
        try {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          await databaseService.updateQRCodeActivation(user.phone, {
            status: "Code QR Actif",
            expiryDate: expiryDate.toISOString(),
          });
          console.log("Updated QRCodeActivation to: Code QR Actif (renewed) for", user.phone);
        } catch (qrErr) {
          console.error("Error updating QR Code Activation instantly during wallet payment:", qrErr);
        }
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
      const isMiseEnLigne = paymentType === 'Mise en ligne';
      if (isMiseEnLigne) {
        try {
          const durationType = (title?.toLowerCase().includes('mois') || title?.toLowerCase().includes('350') || currentAmount === '350') ? '1_month' : '1_week';
          const numAmt = parseFloat(currentAmount) || 0;
          await databaseService.activateOnlineAnnouncementDirectly(user.phone, durationType, numAmt);
        } catch (activeErr) {
          console.error("Error activating online announcement on wallet deduct:", activeErr);
        }
      }

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
        status: 'Paiement validé'
      });

      if (path) {
        setPaymentPath(path);
        try {
          const autoMsg = {
            text: isMiseEnLigne 
              ? `✅ Votre paiement de ${currentAmount} FCFA pour la mise en ligne d'annonce a été débité et validé automatiquement par votre portefeuille. Votre annonce est désormais active et immédiatement en ligne !`
              : `✅ Votre paiement de ${currentAmount} FCFA (${title || paymentType}) a été validé avec succès. L'étape suivante est maintenant débloquée.`,
            sender: 'admin',
            timestamp: new Date().toISOString(),
            isRead: false,
            adminReadStatus: 'LU'
          };
          await databaseService.saveTypedChatMessage('Privee', user.phone, autoMsg);
        } catch (msgErr) {
          console.error("Error sending automatic message for wallet payment:", msgErr);
        }
      }

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
      if (isMiseEnLigne) {
        if (onSuccess) setTimeout(() => (onSuccess as any)(true), 1500);
      } else {
        if (onSuccess) setTimeout(onSuccess, 1500);
      }

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Une erreur s'est produite lors du paiement.");
    }
  };

  // AUTOMATIC CHECK AND PAYMENT EXECUTION (Case 1 & Case 2 reload):
  // When the wallet balance is sufficient, we automatically trigger the payment.
  useEffect(() => {
    if (loadingWallet) return;
    if (paymentType === 'Dépôt') return;
    if (isProcessing || isSuccess || hasAutoPaid) return;

    const needed = parseFloat(currentAmount);
    if (isNaN(needed) || needed <= 0) return;

    if (wallet.balance >= needed) {
      setHasAutoPaid(true);
      handlePay();
    }
  }, [loadingWallet, wallet.balance, currentAmount, paymentType, isProcessing, isSuccess, hasAutoPaid]);

  const handleManualValueChange = (val: string) => {
      setCurrentAmount(val);
  };

  const handleValidate = () => {
      if (currentAmount && currentAmount !== "custom") {
          setIsValidated(true);
      }
  };

  const requiredAmountNum = parseFloat(currentAmount) || 0;
  const isInsufficient = paymentType === 'Dépôt' ? false : (wallet.balance < requiredAmountNum);

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
        const path = await databaseService.savePaymentToRTDB({
          userId: user.phone.replace(/\D/g, ''),
          userName: user.name,
          phone: user.phone,
          city: user.city || 'Non spécifiée',
          amount: depositAmount,
          title: "Dépôt vers le compte principal",
          serviceType: "Dépôt vers le compte principal",
          paymentType: "Dépôt",
          waveNumber: depositPhone,
          timestamp: Date.now(),
          status: 'En attente',
          targetPaymentType: paymentType || null,
          targetAmount: currentAmount || null,
          targetTitle: title || null,
          targetFormData: formData || null
        });

        if (path) {
          localStorage.setItem(storageKey, depositPhone);
          setWaveNumber(depositPhone);
          setIsEditingWaveNumber(false);
          setPendingDepositPath(path);
          setDepositSuccess(true);
          const pushId = path.split('/').pop() || '';

          if ((window as any).PaiementPro) {
            try {
              const merchantId = (import.meta.env.VITE_PAIEMENTPRO_MERCHANT_ID) || 'PP_F175';
              const payment = new (window as any).PaiementPro(merchantId);
              payment.amount = depositAmount;
              payment.description = "Dépôt Portefeuille FILANT°225";
              payment.channel = "Wave";
              payment.countryCurrencyCode = "952";
              payment.referenceNumber = pushId;
              payment.customerEmail = `${depositPhone}@filant225.com`;
              payment.customerFirstName = user.name || "Client";
              payment.customerLastname = "FILANT";
              payment.customerPhoneNumber = depositPhone;
              payment.notificationURL = `${window.location.origin}/api/payments/webhook`;

              console.log("Launching PaiementPro for Deposit Overlay...", payment);
              const response = await payment.init();
              console.log("PaiementPro Deposit response:", response);

              if (response && (response.url || response.redirect_url || typeof response === 'string')) {
                const url = response.url || response.redirect_url || (typeof response === 'string' ? response : null);
                if (url) {
                  setIframeUrl(url);
                }
              }
            } catch (sdkErr) {
              console.error("PaiementPro Deposit SDK initiation error, falling back to Wave link:", sdkErr);
              const link = `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${depositAmount}`;
              window.open(link, '_blank');
            }
          } else {
            console.warn("PaiementPro global class is not present in deposit. Falling back to Wave link.");
            const link = `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${depositAmount}`;
            window.open(link, '_blank');
          }
        } else {
          alert("Erreur lors de l'enregistrement de votre demande.");
        }
      } catch (err) {
        console.error(err);
        alert("Une erreur est survenue lors de l'enregistrement du dépôt.");
      } finally {
        setIsDepositing(false);
      }
    };

    if (depositSuccess) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center h-full max-w-sm mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-150 flex items-center justify-center p-0.5 shadow-sm animate-bounce">
            <img 
              src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98b8035e-bacd-491a-8ff2-81d947531063.png" 
              alt="Wave Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight font-sans">Demande enregistrée</h2>
          <p className="text-slate-600 text-[11px] font-extrabold uppercase leading-relaxed font-sans">
            Votre demande de dépôt de <span className="text-orange-600 font-extrabold">{parseFloat(depositAmount).toLocaleString('fr-FR')} FCFA</span> a été transmise à l'administrateur.
          </p>
          <p className="text-[9px] text-slate-400 font-black uppercase font-sans">
            Le montant restera bloqué en attente de sa validation.
          </p>
          <button
            onClick={() => {
              setShowDepositOverlay(false);
              setDepositSuccess(false);
            }}
            className="w-full bg-slate-950 hover:bg-black text-white font-black py-3 rounded-xl uppercase tracking-wider text-[10px] active:scale-95 transition-all cursor-pointer font-sans"
          >
            Fermer et Patienter
          </button>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-5 max-w-sm mx-auto h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 border-b-2 border-blue-500 pb-1 font-sans">Dépôt de compte</h3>
            <button onClick={() => setShowDepositOverlay(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1 font-sans">Montant à recharger (FCFA) - Auto</label>
              <input 
                type="text"
                readOnly
                value={parseFloat(depositAmount) ? parseFloat(depositAmount).toLocaleString('fr-FR') : depositAmount}
                className="w-full bg-slate-100/80 border-2 border-slate-200 rounded-2xl px-5 py-3 text-base font-black text-slate-850 outline-none font-sans cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1 font-sans">Numéro de paiement Wave</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 select-none flex items-center gap-1">
                  <span>🇨🇮</span>
                  <span>+225</span>
                </span>
                <input 
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={depositPhone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    if (clean.length <= 10) setDepositPhone(clean);
                  }}
                  placeholder="00 00 00 00 00" 
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-20 pr-5 py-3 text-base font-black text-slate-900 outline-none placeholder-slate-200 transition-all font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmDeposit}
          disabled={isDepositing || !depositAmount || depositPhone.length !== 10}
          className={`w-full py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer ${
            isDepositing || !depositAmount || depositPhone.length !== 10
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {isDepositing ? "Envoi de la demande..." : "Confirmer le Dépôt"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 font-sans overflow-hidden relative">
      <header className="p-3 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={handleBackNavigation} className="p-2 -ml-2 active:scale-90 transition-transform">
          <BackIcon />
        </button>
        <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">Paiement</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center relative">
          <div className="text-center mb-3 w-full">
              <h2 className="text-lg font-black text-gray-900 leading-tight">
                  {paymentType === 'Dépôt' ? "Dépôt vers le compte principal" : `service de : ${title}`}
              </h2>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">
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

          {paymentType === 'Dépôt' && (
            isEditingWaveNumber ? (
              <div className="w-full max-w-[340px] px-2 mb-3 font-sans mt-2">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-4 space-y-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Saisir le numéro Wave d'expédition
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 select-none flex items-center gap-1">
                        <span>🇨🇮</span>
                        <span>+225</span>
                      </span>
                      <input 
                        type="tel"
                        inputMode="tel"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={waveNumber}
                        disabled={!!paymentPath}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          if (clean.length <= 10) setWaveNumber(clean);
                        }}
                        placeholder="00 00 00 00 00" 
                        className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-20 pr-3 py-2 text-sm font-black text-slate-900 outline-none placeholder-slate-200 transition-all font-sans"
                      />
                    </div>
                    {!paymentPath && (
                      <button
                        onClick={() => {
                          if (waveNumber.length !== 10) {
                            alert("Veuillez saisir votre numéro Wave à 10 chiffres.");
                            return;
                          }
                          setIsEditingWaveNumber(false);
                        }}
                        className="px-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-[10px] uppercase font-black tracking-wider rounded-2xl transition-all shadow-md shadow-green-600/10 cursor-pointer flex items-center justify-center font-sans font-black"
                      >
                        Valider
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[340px] px-2 mb-3 font-sans mt-2 animate-in fade-in duration-300">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Numéro de paiement Wave
                    </label>
                    <p className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <span className="text-xs">🇨🇮</span>
                      <span className="text-slate-400 font-bold">+225</span> {waveNumber.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}
                    </p>
                  </div>
                  {!paymentPath && (
                    <button
                      onClick={() => setIsEditingWaveNumber(true)}
                      className="px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100 text-blue-600 text-[9px] uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {paymentType === 'Dépôt' ? (
            <div className="w-full max-w-[340px] px-2 mb-3 font-sans">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-[1.5rem] p-3.5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black tracking-widest uppercase text-blue-200 block font-sans">Type d'opération</span>
                  <span className="text-[9px] font-black uppercase text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded-md border border-green-500/30">RECHARGE</span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest font-sans">Mode de dépôt</span>
                    <p className="text-sm font-black text-white">Wave Mobile Money</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest font-sans">Montant d'expédition</span>
                    <p className="text-lg font-black text-green-400 tracking-tight">{(parseFloat(currentAmount) || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-green-300">FCFA</span></p>
                  </div>
                </div>
              </div>
            </div>
          ) : loadingWallet ? (
            <div className="p-4 text-center animate-pulse flex flex-col items-center gap-2 w-full">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Vérification de votre compte...</p>
            </div>
          ) : (
            <div className="w-full max-w-[340px] px-2 mb-3 font-sans">
              {/* Wallet Status Area */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black tracking-widest uppercase text-slate-400 block font-sans">Identité Compte</span>
                  <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">FILANT°225</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-sans">Solde actuel</span>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{wallet.balance.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-500">FCFA</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-sans">Prix du Service</span>
                    <p className="text-lg font-black text-blue-600 tracking-tight">{requiredAmountNum.toLocaleString('fr-FR')} <span className="text-xs font-bold text-blue-500">FCFA</span></p>
                  </div>
                </div>

                {pendingDepositPath ? (
                  pendingDepositStatus === 'PENDING' ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center space-y-1 animate-pulse">
                      <p className="text-[9px] font-black text-orange-600 uppercase tracking-wide font-sans">
                        ⏳ DÉPÔT EN ATTENTE DE VALIDATION
                      </p>
                      <p className="text-[8px] font-extrabold text-orange-800 leading-relaxed font-sans">
                        Votre demande de recharge de <span className="font-black text-[10px] text-orange-700">{(parseFloat(depositAmount) || 0).toLocaleString('fr-FR')} FCFA</span> est en cours de vérification par l'administrateur. Dès validation, votre solde de compte sera mis à jour.
                      </p>
                    </div>
                  ) : pendingDepositStatus === 'SUCCESS' ? (
                    <div className="bg-green-50 border border-green-150 rounded-xl p-3 text-center space-y-2 animate-in zoom-in-95 duration-300">
                      <p className="text-[9.5px] font-black text-green-600 uppercase tracking-wide font-sans">
                        ✅ DÉPÔT VALIDÉ AVEC SUCCÈS !
                      </p>
                      <p className="text-[8.5px] font-extrabold text-green-800 leading-relaxed font-sans">
                        L'administrateur a validé votre dépôt de {(parseFloat(depositAmount) || 0).toLocaleString('fr-FR')} FCFA. Votre nouveau solde est de <span className="font-black text-xs text-green-700">{wallet.balance.toLocaleString('fr-FR')} FCFA</span>.
                      </p>
                      <button
                        onClick={() => {
                          setPendingDepositPath(null);
                          setPendingDepositStatus(null);
                        }}
                        className="w-full py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-[9px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                      >
                        Finaliser le paiement du service
                      </button>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-center space-y-2 animate-in zoom-in-95 duration-300">
                      <p className="text-[9.5px] font-black text-rose-600 uppercase tracking-wide font-sans">
                        ❌ DÉPÔT NON VALIDÉ
                      </p>
                      <p className="text-[8.5px] font-extrabold text-rose-800 leading-relaxed font-sans">
                        Votre demande de recharge de {(parseFloat(depositAmount) || 0).toLocaleString('fr-FR')} FCFA n'a pas été validée par l'administrateur. Aucun crédit n'a été ajouté.
                      </p>
                      <div className="flex gap-2 font-sans">
                        <button
                          onClick={() => {
                            setDepositSuccess(false);
                            setPendingDepositPath(null);
                            setPendingDepositStatus(null);
                            setShowDepositOverlay(true);
                          }}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[9px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer"
                        >
                          Réessayer
                        </button>
                        <button
                          onClick={() => {
                            setPendingDepositPath(null);
                            setPendingDepositStatus(null);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )
                ) : isInsufficient ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center space-y-2 font-sans">
                    <p className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wide leading-relaxed font-sans">
                      Fonds insuffisants. Veuillez effectuer un dépôt pour poursuivre votre demande.
                    </p>
                    <button
                      onClick={() => {
                        setDepositSuccess(false);
                        const savedWave = localStorage.getItem(storageKey) || user.phone || '';
                        setDepositPhone(savedWave);
                        const diff = requiredAmountNum - wallet.balance;
                        setDepositAmount(diff > 0 ? diff.toString() : '');
                        setShowDepositOverlay(true);
                      }}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-[9px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-rose-200 font-sans"
                    >
                      Dépôt
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                    <p className="text-[8px] font-extrabold text-green-700 uppercase tracking-wide">
                      Solde suffisant ! Nouveau solde après achat : <span className="font-black text-[9.5px]">{(wallet.balance - requiredAmountNum).toLocaleString('fr-FR')} FCFA</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 px-2 text-center w-full max-w-[340px] mt-1 font-sans">
              <div className="text-xs font-bold text-gray-900 leading-[1.35]">
                {isSuccess ? (
                  <span className="text-green-600 animate-bounce block">Paiement validé avec succès !</span>
                ) : isProcessing ? (
                  <div className="text-blue-600 block bg-blue-50 p-3 rounded-xl border-2 border-blue-100 animate-pulse space-y-1">
                    <p className="font-black text-[10px] uppercase tracking-wider">Débit du portefeuille en cours</p>
                    <p className="text-[9px] leading-relaxed text-blue-800/80 font-medium">Votre compte est débité en toute sécurité par cryptage local...</p>
                  </div>
                ) : (paymentPath && isNonValidated) ? (
                  <div className="text-rose-600 block bg-rose-50 p-3 rounded-xl border border-rose-150 space-y-2 transition-all">
                    <p className="font-black text-[10px] uppercase tracking-wider font-sans">❌ DÉPÔT NON VALIDÉ</p>
                    <p className="text-[9px] leading-relaxed text-rose-950 font-semibold font-sans">
                      Votre demande de recharge de <span className="font-black text-[11px] text-rose-700">{parseFloat(currentAmount).toLocaleString('fr-FR')} FCFA</span> n'a pas été validée ou n'a pas été détectée par l'administrateur.
                    </p>
                    <button
                      onClick={() => {
                        setPaymentPath(null);
                        setIsNonValidated(false);
                        setIsProcessing(false);
                      }}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[9px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                    >
                      essayer de nouveau
                    </button>
                  </div>
                ) : paymentPath ? (
                  <div className="text-orange-600 block bg-orange-50 p-3 rounded-xl border-2 border-orange-100 space-y-1 transition-all">
                    <p className="font-black text-[10px] uppercase tracking-wider animate-pulse font-sans">Dépôt en attente de validation</p>
                    <p className="text-[9.5px] leading-relaxed text-orange-950 font-semibold font-sans">
                      Votre demande de <span className="font-black text-sm text-orange-700">{parseFloat(currentAmount).toLocaleString('fr-FR')} FCFA</span> a été enregistrée avec succès.
                    </p>
                    <p className="text-[8.5px] leading-relaxed text-slate-500 font-sans">
                      Veuillez patienter pendant que l'administrateur valide votre dépôt. Le solde de votre compte sera rechargé instantanément après confirmation.
                    </p>
                  </div>
                ) : pendingDepositStatus === 'PENDING' ? (
                  <div className="text-orange-600 block bg-orange-50 p-3 rounded-xl border-2 border-orange-100 space-y-1 transition-all">
                    <p className="font-black text-[10px] uppercase tracking-wider animate-pulse font-sans">Dépôt Compte en attente</p>
                    <p className="text-[9px] leading-relaxed text-orange-950 font-semibold font-sans animate-pulse">
                      Votre demande de recharge de <span className="font-black text-sm text-orange-700">{(parseFloat(depositAmount) || 0).toLocaleString('fr-FR')} FCFA</span> est en cours d'examen.
                    </p>
                  </div>
                ) : isInsufficient ? (
                  <span className="text-rose-500 text-[10px] font-black uppercase tracking-wide">Solde insuffisant pour commander ce service.</span>
                ) : (
                  paymentType === 'Dépôt' 
                    ? "Saisissez le montant et confirmez le dépôt pour soumettre à la validation administrative."
                    : "Validez la transaction pour continuer l'opération du service."
                )}
              </div>
          </div>

          <div className="mt-auto w-full pt-3 pb-1 flex items-center justify-between gap-4 font-sans">
              <div className="flex flex-col items-center flex-shrink-0">
                <img 
                  src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98b8035e-bacd-491a-8ff2-81d947531063.png" 
                  alt="Wave Logo" 
                  className="w-8 h-8 object-contain rounded-full bg-white p-0.5 border border-slate-100 shadow-sm" 
                  referrerPolicy="no-referrer" 
                />
                <span className="text-[7.5px] font-black uppercase text-slate-400 mt-1 font-sans">WALLET SECURE</span>
              </div>
              <button 
                onClick={handlePay}
                disabled={isProcessing || isSuccess || !isValidated || loadingWallet || !!paymentPath || pendingDepositStatus === 'PENDING'}
                className={`flex-1 font-black py-3 px-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-base uppercase tracking-wider min-h-[58px] flex items-center justify-center cursor-pointer font-sans ${
                    isSuccess
                        ? 'bg-green-500 text-white shadow-green-200'
                        : isProcessing 
                            ? 'bg-gray-100 cursor-default shadow-none' 
                            : (paymentPath || pendingDepositStatus === 'PENDING')
                                ? 'bg-orange-100 text-orange-500 border-2 border-orange-200 cursor-default shadow-none animate-pulse'
                                : (isValidated && !loadingWallet) 
                                    ? isInsufficient
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isProcessing ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-blue-600 text-sm">TRANSACTION...</span>
                    </div>
                ) : isSuccess ? (
                    <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Validé</span>
                    </div>
                ) : (paymentPath || pendingDepositStatus === 'PENDING') ? (
                    <span className="text-orange-500 text-xs font-black text-center leading-tight">EN ATTENTE ADMIN</span>
                ) : paymentType === 'Dépôt' ? 'Confirmer le dépôt' : isInsufficient ? 'Faire un Dépôt' : 'Payer avec le Portefeuille'}
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

      {/* Embedded Paiement Pro Secure Payment Iframe Overlay */}
      {iframeUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex flex-col animate-in fade-in duration-300">
          <div className="bg-white border-b border-gray-150 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 p-0.5 shadow-sm">
                <img 
                  src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98b8035e-bacd-491a-8ff2-81d947531063.png" 
                  alt="Wave Logo" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight font-sans">Paiement Sécurisé Wave</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase font-sans">FILANT°225 × PAIEMENT PRO</p>
              </div>
            </div>
            <button 
              onClick={() => setIframeUrl(null)} 
              className="text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer font-sans"
            >
              Fermer
            </button>
          </div>
          <div className="flex-1 bg-slate-50 relative">
            <iframe 
              src={iframeUrl} 
              className="w-full h-full border-none"
              title="Paiement Pro Checkout"
              allow="payment"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmationScreen;
