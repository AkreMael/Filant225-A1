import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';

interface EmergencyFormScreenProps {
  onBack: () => void;
  user: User;
  onShowPopup?: (
    message: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string,
    title?: string
  ) => void;
  onGoToMenu?: () => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
}

const emergencyOptions = [
  "Problème de paiement / Transaction Wave bloquée",
  "Annuler un contrat ou régler un litige",
  "Trouver un travailleur qualifié en urgence",
  "Besoin urgent de location d'équipement",
  "Accident / Problème de sécurité sur chantier",
  "Problème d'accès à l'application",
  "Autre urgence"
];

const nationalNumbers = [
  { name: "SAMU (Secours Médicaux)", number: "185", phoneUrl: "tel:185", color: "bg-red-500", desc: "Urgences médicales & ambulances" },
  { name: "Police Secours", number: "111", phoneUrl: "tel:111", color: "bg-blue-600", desc: "Secours & sécurité publique" },
  { name: "Sapeurs-Pompiers (GSPM)", number: "180", phoneUrl: "tel:180", color: "bg-orange-600", desc: "Incendies, secours & accidents" },
  { name: "Assistance Filant°225", number: "07 05 05 26 32", phoneUrl: "tel:+2250705052632", color: "bg-emerald-600", desc: "Ligne directe assistance 24/7" },
];

const EmergencyFormScreen: React.FC<EmergencyFormScreenProps> = ({ 
  onBack, 
  user,
  onShowPopup,
  onGoToMenu,
  onRegisterBackHandler
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState('');
  const [contactInfo, setContactInfo] = useState(user?.phone || '');
  const [emailInfo, setEmailInfo] = useState(user?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleBackWithConfirmation = () => {
    const hasStarted = selectedOption !== '' || otherDetails !== '';
    if (hasStarted && !isSubmitted) {
      if (onShowPopup && onGoToMenu) {
        onShowPopup(
          "Les informations non enregistrées seront perdues.",
          "confirm",
          (close) => {
            close();
            onGoToMenu();
          },
          "Quitter",
          "Continuer",
          "Quitter la page d'urgence ?"
        );
      } else {
        const confirmExit = window.confirm("Quitter ce formulaire ? Les informations non enregistrées seront perdues.");
        if (confirmExit) {
          if (onGoToMenu) onGoToMenu(); else onBack();
        }
      }
      return true;
    }
    onBack();
    return true;
  };

  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(handleBackWithConfirmation);
      return () => {
        onRegisterBackHandler(null);
      };
    }
  }, [onRegisterBackHandler, selectedOption, otherDetails, contactInfo, isSubmitted, onBack, onGoToMenu, onShowPopup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];
    if (!selectedOption) newErrors.push('reason');
    if (!contactInfo) newErrors.push('contact');
    if (selectedOption === 'Autre urgence' && !otherDetails) newErrors.push('details');
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSending(true);
    
    const finalReason = selectedOption === 'Autre urgence' ? `Autre: ${otherDetails}` : selectedOption;
    
    const reportText = `🚨 *URGENCE FILANT°225*\n\n` +
                       `*Motif d'urgence:* ${finalReason}\n` +
                       `*Détails complémentaires:* ${otherDetails || 'Aucun'}\n` +
                       `*Téléphone:* ${contactInfo}\n` +
                       `*E-mail:* ${emailInfo || 'Non renseigné'}\n\n` +
                       `--- INFORMATIONS UTILISATEUR ---\n` +
                       `*Nom:* ${user?.name || 'Client'}\n` +
                       `*Ville:* ${user?.city || 'Abidjan'}\n` +
                       `*Date:* ${new Date().toLocaleString('fr-FR')}\n\n` +
                       `Envoyé depuis l'application FILANT°225`;

    try {
      const sanitizedPhone = (user?.phone || contactInfo).replace(/\D/g, '');

      // 1. Sauvegarde dans Realtime Database / Messagerie Privee
      await databaseService.saveFormSubmission({
        userPhone: sanitizedPhone,
        userName: user?.name || 'Client',
        email: emailInfo,
        formType: 'emergency',
        formTitle: 'URGENCE - ' + finalReason,
        data: {
          reason: finalReason,
          details: otherDetails,
          contactInfo,
          email: emailInfo,
          city: user?.city || 'Abidjan'
        },
        whatsappMessage: reportText,
        type: 'emergency_submission'
      });

      // 2. Sauvegarde dans la collection Firestore ServiceRequests (Suivi Administrateur)
      await databaseService.saveServiceRequest({
        userId: sanitizedPhone,
        userName: user?.name || 'Client',
        phone: contactInfo,
        email: emailInfo,
        city: user?.city || 'Abidjan',
        serviceTitle: `Signalement d'Urgence : ${finalReason}`,
        formType: 'emergency',
        answers: {
          "Motif d'urgence": finalReason,
          "Détails complémentaires": otherDetails || 'Aucun',
          "Numéro de contact": contactInfo,
          "Adresse E-mail": emailInfo || 'Non renseigné',
          "Ville": user?.city || 'Abidjan'
        },
        totalPrice: 0,
        readStatus: 'NON LU',
        status: 'Urgent'
      });

      // 3. Redirection directe vers le WhatsApp Support
      const whatsappUrl = `https://wa.me/2250705052632?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappUrl, '_blank');

      setIsSubmitted(true);
      if (onShowPopup) {
        onShowPopup(
          "Votre signalement d'urgence a été transmis à l'équipe FILANT°225. Un conseiller vous contacte dans les plus brefs délais.",
          "alert",
          (close) => {
            close();
          },
          "D'accord"
        );
      }
    } catch (err) {
      console.error("Erreur d'envoi de l'urgence:", err);
      // Fallback vers WhatsApp direct
      const whatsappUrl = `https://wa.me/2250705052632?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappUrl, '_blank');
      setIsSubmitted(true);
    } finally {
      setIsSending(false);
    }
  };

  const openDirectWhatsApp = () => {
    const text = `🚨 *ASSISTANCE URGENCE FILANT°225*\nBonjour, j'ai besoin d'une assistance immédiate.\nNom: ${user?.name || ''}\nTéléphone: ${user?.phone || ''}`;
    window.open(`https://wa.me/2250705052632?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900 z-[600] flex flex-col font-sans overflow-hidden text-slate-100"
    >
      {/* Header SOS Header */}
      <header className="relative bg-red-600 px-4 py-4 sm:py-6 text-white shadow-xl flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackWithConfirmation} 
            className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white shadow-md active:scale-95 transition-all flex items-center justify-center border border-white/30"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-white font-black text-lg tracking-tighter uppercase drop-shadow-md">FILANT°225</span>
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-0.5 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              <span className="text-[9px] font-black uppercase text-white tracking-widest">CENTRE D'URGENCE 24/7</span>
            </div>
          </div>

          <button 
            onClick={openDirectWhatsApp}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 backdrop-blur-md rounded-2xl text-white shadow-md active:scale-95 transition-all flex items-center justify-center border border-white/30"
            title="WhatsApp Urgence"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-6 pb-20">
        
        {/* Urgent Call Hero Banner */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-5 shadow-2xl border border-red-500/30 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                Service d'Intervention d'Urgence
              </h1>
              <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed">
                Assistance immédiate pour vos litiges, paiements bloqués, accidents ou besoins d'ouvriers en urgence.
              </p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
            <a 
              href="tel:+2250705052632"
              className="py-3 px-4 bg-white text-red-600 hover:bg-red-50 active:scale-95 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-4 h-4 text-red-600 shrink-0" />
              <span>Appeler 24/7</span>
            </a>

            <button 
              onClick={openDirectWhatsApp}
              className="py-3 px-4 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-white shrink-0" />
              <span>WhatsApp SOS</span>
            </button>
          </div>
        </div>

        {/* National Emergency Contacts Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Numéros d'Urgence Nationale (Côte d'Ivoire)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nationalNumbers.map((item, idx) => (
              <a
                key={idx}
                href={item.phoneUrl}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-md active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.color} text-white flex items-center justify-center shadow-md font-black text-xs`}>
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>

                <div className="bg-slate-800 group-hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1">
                  <span className="text-xs font-black text-green-400">{item.number}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Declaration Form Card */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-tight">Formulaire de Signalement</h3>
              <p className="text-[11px] text-slate-400 font-bold">Transmettez votre problème directement au centre de sécurité</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs">
              SOS
            </div>
          </div>

          {isSubmitted ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase">Signalement Enregistré !</h4>
                <p className="text-xs text-emerald-200 mt-1">
                  Votre message a été transmis aux agents d'intervention FILANT°225. Un conseiller s'occupe de votre cas immédiatement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="py-3 px-6 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
              >
                Faire un autre signalement
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Option Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Motif de l'urgence *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {emergencyOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedOption(opt);
                        if (errors.includes('reason')) setErrors(errors.filter(e => e !== 'reason'));
                      }}
                      className={`w-full text-left py-3 px-4 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedOption === opt 
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-md' 
                          : errors.includes('reason')
                          ? 'bg-red-950/30 border-red-800 text-red-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase">{opt}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedOption === opt ? 'border-red-500 bg-red-600' : 'border-slate-700'}`}>
                        {selectedOption === opt && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other details text area */}
              {selectedOption === 'Autre urgence' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Précisions obligatoires *
                  </label>
                  <textarea
                    required
                    value={otherDetails}
                    onChange={(e) => {
                      setOtherDetails(e.target.value);
                      if (errors.includes('details')) setErrors(errors.filter(e => e !== 'details'));
                    }}
                    className={`w-full bg-slate-950 border rounded-2xl py-3 px-4 text-xs text-white font-medium focus:border-red-500 outline-none transition-all h-24 ${
                      errors.includes('details') ? 'border-red-500 bg-red-950/20' : 'border-slate-800'
                    }`}
                    placeholder="Décrivez précisément votre problème urgent..."
                  />
                </div>
              )}

              {/* Phone or Contact Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Numéro de Téléphone pour rappel *
                </label>
                <input
                  type="tel"
                  required
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    if (errors.includes('contact')) setErrors(errors.filter(e => e !== 'contact'));
                  }}
                  className={`w-full bg-slate-950 border rounded-2xl py-3.5 px-4 text-xs text-white font-bold focus:border-red-500 outline-none transition-all ${
                    errors.includes('contact') ? 'border-red-500 bg-red-950/20' : 'border-slate-800'
                  }`}
                  placeholder="Ex: 0705052632"
                />
              </div>

              {/* Email Address Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Adresse E-mail pour suivi
                </label>
                <input
                  type="email"
                  value={emailInfo}
                  onChange={(e) => setEmailInfo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-xs text-white font-bold focus:border-red-500 outline-none transition-all"
                  placeholder="Ex: exemple@email.com"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:from-red-500 hover:to-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-red-500/30"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-white" />
                    <span>Transmettre le Signalement d'Urgence</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyFormScreen;
