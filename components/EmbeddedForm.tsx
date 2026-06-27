
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import SpeakerIcon from './common/SpeakerIcon';
import CityAutocompleteInput from './common/CityAutocompleteInput';
import { getQuestionsForType, generateWhatsAppMessage, calculateTotalPrice, Answers, AnswerValue, getFormImage } from './common/formDefinitions';
import { databaseService } from '../services/databaseService';
import { audioService } from '../services/audioService';

import { Phone } from 'lucide-react';

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
);

const formatPhoneNumber = (digits: string) => {
  const parts = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  return parts.join(' ');
};

interface EmbeddedFormProps {
  title: string;
  formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service' | 'stage' | 'formation' | 'simple_demande';
  user: User;
  onClose: () => void;
  description?: string;
  imageUrl?: string | string[];
  isBlurredImage?: boolean;
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

const EmbeddedForm: React.FC<EmbeddedFormProps> = ({ 
  title, 
  formType, 
  user, 
  onClose,
  description,
  imageUrl,
  isBlurredImage,
  onShowPopup,
  onGoToMenu,
  onRegisterBackHandler
}) => {
  const isRapidTitle = title.toLowerCase().endsWith('rapide');

  const [serviceMode, setServiceMode] = useState<'Embauche' | 'Service rapide'>(() => {
    if (isBlurredImage) return 'Embauche';
    return 'Service rapide';
  });

  const questions = useMemo(() => getQuestionsForType(formType, title, serviceMode), [formType, title, serviceMode]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const isLoaded = useRef(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  // Persistance des données
  const storageKey = useMemo(() => `form_data_${user.phone || user.id}_${title}_${serviceMode}`, [user.id, user.phone, title, serviceMode]);

  useEffect(() => {
    isLoaded.current = false;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setStep(parsed.step || 0);
      } catch (e) {
        console.error("Error loading saved form data:", e);
        setAnswers({});
        setStep(0);
      }
    } else {
      setStep(0);
      setAnswers({});
    }
    isLoaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (isLoaded.current) {
       localStorage.setItem(storageKey, JSON.stringify({ answers, step }));
    }
  }, [answers, step, storageKey]);

  const [inputValue, setInputValue] = useState('');
  const [count, setCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingNext, setIsWaitingNext] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = questions[step];

  const currentAnswers = useMemo(() => {
    if (currentQuestion) {
      return { ...answers, [currentQuestion.key]: inputValue };
    }
    return answers;
  }, [answers, currentQuestion, inputValue]);

  useEffect(() => {
    if (currentQuestion) {
        setInputValue((answers[currentQuestion.key] as string) || currentQuestion.defaultValue || '');
    }
  }, [step, currentQuestion, answers]);

  const totalPrice = useMemo(() => calculateTotalPrice(formType, currentAnswers, serviceMode, count, title), [formType, currentAnswers, serviceMode, count, title]);
  const isWorker = formType === 'worker' || formType === 'personal_worker' || formType === 'rapid_building_service';
  
  const apartmentTitles = ['Studio à louer', 'Villa à louer', 'Chambre-salon à louer', 'Petit local à louer', 'Magasin à louer'];
  const isAppart = !isWorker && (apartmentTitles.some(t => title.includes(t)) || title.toLowerCase().includes('appartement'));
  const isEquipment = (formType === 'location' || formType === 'personal_location') && !isAppart;

  const answeredCount = Object.keys(answers).length;
  const remainingFields = questions.length - answeredCount;
  const isFormComplete = step >= questions.length;

  const resolvedImage = useMemo(() => {
    if (imageUrl) {
        return Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
    }
    return getFormImage(title);
  }, [imageUrl, title]);

  const handleNext = (val?: string) => {
    const valueToSave = val !== undefined ? val : inputValue;
    if (!valueToSave.trim()) return;

    setIsWaitingNext(true);
    setTimeout(() => {
        const newAnswers = { ...answers, [currentQuestion.key]: valueToSave };
        setAnswers(newAnswers);
        
        let nextStep = step + 1;
        while (nextStep < questions.length) {
            const nextQ = questions[nextStep];
            if (!nextQ.condition || nextQ.condition(newAnswers)) {
                break;
            }
            nextStep++;
        }

        if (nextStep < questions.length) {
            setStep(nextStep);
            setInputValue('');
        } else {
            // On marque le formulaire comme complet en dépassant l'index
            setStep(questions.length);
        }
        setIsWaitingNext(false);
    }, 400);
  };

  const handleInputClick = () => {
    if (inputRef.current && inputValue.endsWith(' CFA')) {
        const pos = Math.max(0, inputValue.length - 4);
        if (inputRef.current.selectionStart && inputRef.current.selectionStart > pos) {
            inputRef.current.setSelectionRange(pos, pos);
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const isAmountField = currentQuestion && 
      (currentQuestion.key.toLowerCase().includes('budget') || 
       currentQuestion.key.toLowerCase().includes('price') || 
       currentQuestion.key.toLowerCase().includes('salary') ||
       currentQuestion.text({}).toLowerCase().includes('budget') ||
       currentQuestion.text({}).toLowerCase().includes('prix') ||
       currentQuestion.text({}).toLowerCase().includes('salaire'));

    if (currentQuestion?.inputType === 'tel' && isAmountField) {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) {
            setInputValue('CFA');
            // On force le curseur au début si vide
            setTimeout(() => {
                if (inputRef.current) inputRef.current.setSelectionRange(0, 0);
            }, 0);
            return;
        }
        
        const formatted = new Intl.NumberFormat('fr-FR').format(parseInt(numeric)) + ' CFA';
        
        // Calculer la position du curseur par rapport à la fin (pour éviter les sauts)
        const oldLength = inputValue.length;
        const oldPos = e.target.selectionStart || 0;
        const suffixLength = 4; // " CFA"
        
        setInputValue(formatted);

        // Ajuster le curseur pour qu'il reste avant le suffixe si on tape à la fin
        setTimeout(() => {
            if (inputRef.current) {
                const newPos = Math.min(oldPos, formatted.length - suffixLength);
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    } else {
        setInputValue(val);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBackWithConfirmation = () => {
    const hasStarted = Object.keys(answers).length > 0;
    if (hasStarted && !showConfirmation) {
      if (onShowPopup && onGoToMenu) {
        onShowPopup(
          "Les informations non enregistrées seront perdues.",
          "confirm",
          (close) => {
            close();
            // Clear draft
            localStorage.removeItem(storageKey);
            onGoToMenu();
          },
          "Quitter",
          "Continuer la saisie",
          "Quitter ce formulaire ?"
        );
      } else {
        const confirmExit = window.confirm("Quitter ce formulaire ? Les informations non enregistrées seront perdues.");
        if (confirmExit) {
          localStorage.removeItem(storageKey);
          if (onGoToMenu) onGoToMenu(); else onClose();
        }
      }
      return true; // handled
    }
    onClose();
    return true; // handled
  };

  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(handleBackWithConfirmation);
      return () => {
        onRegisterBackHandler(null);
      };
    }
  }, [onRegisterBackHandler, answers, showConfirmation, onShowPopup, onGoToMenu, storageKey, onClose]);

  const handleAction = async (target: 'whatsapp' | 'assistant' | 'validate') => {
    if (!isFormComplete) {
      showToast(`${remainingFields} champs à remplir`);
      return;
    }
    
    setIsSending(true);
    
    // Preparation immédiate du message
    const message = generateWhatsAppMessage(title, questions, answers, user, totalPrice, serviceMode, count);

    // Build the submission message text based on requested format
    let customText = "";
    if (formType === 'simple_demande') {
        customText = `📝 *Nouveau Formulaire de Demande Soumis*\n\n`;
        customText += `• *Notification d'origine :* ${title}\n\n`;
        customText += `--- DÉTAILS DE LA DEMANDE ---\n`;
        
        questions.forEach(q => {
            const answer = answers[q.key];
            if (answer !== undefined && answer !== null) {
                customText += `• *${q.text(answers).replace(/\?$/, '')} :* ${answer}\n`;
            }
        });

        customText += `\n--- IDENTITÉ DE L'UTILISATEUR ---\n`;
        customText += `• *Nom :* ${user.name || 'Non spécifié'}\n`;
        customText += `• *Ville de l'utilisateur :* ${user.city || 'Non spécifiée'}\n`;
        customText += `• *Numéro de téléphone enregistré :* ${user.phone || 'Non spécifié'}\n`;
    } else {
        customText = `Nouveau formulaire soumis : ${title}\n\n${message}`;
    }

    // Sauvegarde directe dans la messagerie privée sans ouvrir le chat
    const sanitizedPhone = user.phone.replace(/\D/g, '');
    const chatUserId = sanitizedPhone || user.userId || user.id || `${user.name}_${sanitizedPhone}`;
    
    const chatMsg = {
        sender: 'user',
        text: customText,
        timestamp: Date.now(),
        type: 'form_submission',
        formData: {
            title,
            formType,
            answers,
            totalPrice: totalPrice
        }
    };

    try {
        // Save the user's detailed message in the private chat first
        await databaseService.savePrivateChatMessage(chatUserId, chatMsg);

        // Save as a stage, formation or service request depending on the formType
        if (formType === 'stage') {
            await databaseService.saveStageApplication({
                userId: chatUserId,
                userName: user.name || 'Utilisateur',
                phone: user.phone,
                city: user.city || 'Non spécifiée',
                category: 'Stage',
                domain: title.replace(/^Stage en /i, ''),
                title: title,
                answers: answers,
                adminReadStatus: 'NON LU'
            });
        } else if (formType === 'formation') {
            await databaseService.saveFormationApplication({
                userId: chatUserId,
                userName: user.name || 'Utilisateur',
                phone: user.phone,
                city: user.city || 'Non spécifiée',
                category: 'Formation',
                domain: title.replace(/^Formation en /i, ''),
                title: title,
                answers: answers,
                adminReadStatus: 'NON LU'
            });
        } else if (formType !== 'simple_demande') {
            // Save as a service request for the admin dashboard (this triggers the automated response)
            await databaseService.saveServiceRequest({
                userId: chatUserId,
                userName: user.name || 'Utilisateur',
                phone: user.phone,
                city: user.city || 'Non spécifiée',
                serviceTitle: title,
                formType,
                answers,
                totalPrice,
                readStatus: 'NON LU'
            });
        }
        
        // Note: We keep the form data fixed as per user request, so we don't clear localStorage here
        // localStorage.removeItem(storageKey);
        
        // Si on a explicitement demandé WhatsApp, on l'ouvre
        if (target === 'whatsapp') {
            window.open(`https://wa.me/2250705052632?text=${encodeURIComponent(message)}`, '_blank');
        }

        if (formType === 'simple_demande') {
            const payAmount = 100;
            const payMessage = generateWhatsAppMessage("Paiement des frais de communication", questions, answers, user, payAmount, serviceMode, count);
            window.dispatchEvent(new CustomEvent('trigger-payment-view', { 
              detail: {
                title: "Paiement des frais de communication",
                amount: payAmount.toString(),
                paymentType: 'simple_demande',
                waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${payAmount}`,
                formData: {
                    formType: 'simple_demande',
                    formTitle: "Paiement des frais de communication",
                    data: answers,
                    whatsappMessage: payMessage
                }
              }
            }));
            onClose();
        } else {
            // Afficher l'écran de confirmation
            setShowConfirmation(true);
        }
    } catch (error) {
        console.error("Error saving form to private chat:", error);
        showToast("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
        setIsSending(false);
    }
  };

  if (showConfirmation) {
    if (formType === 'simple_demande') {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white z-[700] flex flex-col font-sans p-8 items-center justify-center text-center animate-in fade-in duration-300"
        >
          <div className="w-full max-w-[320px] flex flex-col items-center">
              {/* Logo area */}
              <div className="relative w-48 h-48 mb-8">
                  <div className="w-full h-full bg-white rounded-[2.3rem] shadow-2xl border-4 border-orange-50 flex items-center justify-center p-2.5 overflow-hidden">
                      <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/49d4592c-b74d-4904-b209-a32e8c921f1b.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
              </div>

              <div className="space-y-6 mb-12">
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                      Votre demande a été envoyée avec succès !
                  </p>
                  
                  <p className="text-[14px] font-semibold text-gray-400 leading-relaxed">
                      Les détails de votre demande ont été transmis directement à l'administrateur dans votre messagerie privée.
                  </p>
              </div>

              <div className="w-full">
                  <button 
                    onClick={onClose}
                    className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4 rounded-2xl text-lg shadow-xl active:scale-[0.98] transition-all"
                  >
                      Compris
                  </button>
              </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white z-[700] flex flex-col font-sans p-8 items-center justify-center text-center"
      >
        <div className="w-full max-w-[320px] flex flex-col items-center">
            {/* Logo area from the image */}
            <div className="relative w-48 h-48 mb-8">
                <div className="w-full h-full bg-white rounded-[2.3rem] shadow-2xl border-4 border-orange-50 flex items-center justify-center p-2.5 overflow-hidden">
                    <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/49d4592c-b74d-4904-b209-a32e8c921f1b.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
            </div>

            <div className="space-y-6 mb-12">
                <p className="text-xl font-bold text-gray-900 leading-tight">
                    Nous avons bien reçu votre demande de recherche de
                </p>
                
                <p className="text-2xl font-black text-orange-600 uppercase tracking-tight">
                    {title.replace(/ Rapide$/i, '').toUpperCase()}{title.toLowerCase().endsWith('s') ? '' : 'S'}.
                </p>

                {(formType === 'stage' || formType === 'formation') ? (
                  <div className="space-y-4">
                    <p className="text-lg font-bold text-gray-900 leading-snug">
                        Dès que vous procéderez au paiement, un conseiller vous contactera dans les plus brefs délais.
                    </p>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 shadow-sm">
                      <p className="text-[13px] font-black text-orange-700 uppercase tracking-wide">
                        Frais de communication du service : 100 CFA
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-gray-900 leading-snug">
                      Dès que vous procéderez au paiement de mise en relation, un agent vous contactera dans les plus brefs délais.
                  </p>
                )}
            </div>

            <div className="w-full space-y-4">
                <button 
                  onClick={() => {
                    const message = generateWhatsAppMessage(title, questions, answers, user, totalPrice, serviceMode, count);
                    window.dispatchEvent(new CustomEvent('trigger-payment-view', { 
                      detail: {
                        title: title,
                        amount: totalPrice.toString(),
                        paymentType: formType,
                        waveLink: "https://pay.wave.com/m/M_filant/c/ci",
                        formData: {
                            formType,
                            formTitle: title,
                            data: answers,
                            whatsappMessage: message
                        }
                      }
                    }));
                    onClose();
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl text-xl shadow-xl active:scale-[0.98] transition-all"
                >
                    Frais {totalPrice} FCFA
                </button>

                <button 
                  onClick={() => {
                    const message = generateWhatsAppMessage(title, questions, answers, user, totalPrice, serviceMode, count);
                    window.open(`https://wa.me/2250705052632?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4 rounded-2xl text-xl shadow-xl active:scale-[0.98] transition-all"
                >
                    Agence WhatsApp
                </button>
            </div>
            
            <button 
                onClick={onClose}
                className="mt-12 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600"
            >
                Fermer
            </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-[600] flex flex-col font-sans overflow-hidden"
    >
      
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide">
        
        <motion.div 
          initial={{ y: -50, opacity: 0, scale: 1.1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={`relative w-full flex-shrink-0 bg-orange-600 overflow-hidden flex items-center justify-center transition-all duration-300 ${isKeyboardVisible ? 'h-[56px]' : 'h-[220px]'}`}
        >
            {resolvedImage ? (
                <img 
                  src={resolvedImage} 
                  alt={title} 
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-350 ${isBlurredImage ? 'blur-md opacity-40' : ''} ${isKeyboardVisible ? 'opacity-10' : ''}`}
                  referrerPolicy="no-referrer"
                />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25"></div>
            {!resolvedImage && <span className="text-white/20 font-black text-8xl relative z-0 mt-4">F</span>}
            {isBlurredImage && !isKeyboardVisible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-white text-lg font-black uppercase tracking-[0.3em] drop-shadow-lg">MASQUÉ</span>
                </div>
            )}
            <button 
              onClick={handleBackWithConfirmation} 
              className={`absolute p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-90 z-20 transition-all duration-300 ${isKeyboardVisible ? 'top-2.5 left-4' : 'top-4 left-4'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className={`absolute z-20 transition-all duration-300 ${isKeyboardVisible ? 'top-4 left-1/2 -translate-x-1/2' : 'top-4 left-1/2 -translate-x-1/2'}`}>
                <span className={`text-white font-black tracking-tighter uppercase drop-shadow-lg transition-all duration-300 ${isKeyboardVisible ? 'text-sm' : 'text-xl'}`}>FILANT°225</span>
            </div>
        </motion.div>

        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`flex-1 bg-white rounded-t-[3rem] relative z-10 p-6 flex flex-col items-center transition-all duration-300 ${isKeyboardVisible ? 'mt-0 rounded-t-none' : '-mt-12'}`}
        >
            <div className="w-16 h-1.5 bg-gray-100 rounded-full mb-6"></div>
            
            <div className="mb-6 flex flex-col items-center">
                <h2 className="text-xl font-black text-black uppercase tracking-tight text-center">{title}</h2>
                <div className="h-1 w-20 bg-orange-500 mt-1 rounded-full"></div>
            </div>

            {formType === 'simple_demande' ? (
                <div className="w-full max-w-sm flex-1 flex flex-col items-center">
                    {/* Le cadre de formulaire simple */}
                    <div className="w-full bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-5 my-2">
                        {/* Ville de la demande */}
                        <div className="flex flex-col gap-1.5 w-full text-left align-left items-start">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5 ml-1">
                                Ville de la demande
                                <SpeakerIcon text="Ville de la demande" className="text-orange-500 animate-pulse" />
                            </label>
                            <div className="bg-gray-50 border-2 border-slate-100 focus-within:border-orange-500 rounded-xl flex items-center px-4 py-0.5 transition-all w-full">
                                <CityAutocompleteInput 
                                    value={(answers['city'] as string) || ''}
                                    onChange={(val) => {
                                        setAnswers(prev => ({ ...prev, city: val }));
                                    }}
                                    placeholder="Saisissez la ville concernée (ex: Abidjan, Cocody)..."
                                    inputClassName="bg-transparent w-full py-3.5 text-sm font-bold text-gray-800 outline-none"
                                />
                            </div>
                        </div>

                        {/* Numéro de téléphone du correspondant */}
                        <div className="flex flex-col gap-1.5 w-full text-left align-left items-start">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5 ml-1">
                                Numéro de téléphone du correspondant
                                <SpeakerIcon text="Numéro de téléphone du correspondant" className="text-orange-500 animate-pulse" />
                            </label>
                            <div className="bg-gray-50 border-2 border-slate-100 focus-within:border-orange-500 rounded-xl flex items-center px-4 py-0.5 transition-all w-full">
                                <span className="text-sm font-extrabold text-orange-600 bg-orange-50/50 px-2.5 py-1 rounded-lg border border-orange-200/40 mr-2.5 select-none shrink-0 font-mono">
                                    +225
                                </span>
                                <input 
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={14} // 10 digits + 4 spaces
                                    value={formatPhoneNumber(((answers['contact_phone'] as string) || ''))}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const cleaned = raw.replace(/\D/g, '').slice(0, 10);
                                        setAnswers(prev => ({ ...prev, contact_phone: cleaned }));
                                    }}
                                    placeholder="07 05 05 26 32"
                                    className="bg-transparent w-full py-3.5 text-sm font-extrabold text-gray-800 outline-none font-mono tracking-wider"
                                />
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold italic ml-1">
                                Restreint au format de 10 chiffres (ex: 07 05 05 26 32)
                            </p>
                        </div>
                    </div>

                    {/* Envoyer Button */}
                    <div className="w-full mt-4">
                        <button 
                            onClick={async () => {
                                const city = ((answers['city'] as string) || '').trim();
                                const phone = ((answers['contact_phone'] as string) || '').replace(/\D/g, '');
                                if (!city) {
                                    showToast("Veuillez saisir la ville de la demande");
                                    return;
                                }
                                if (phone.length !== 10) {
                                    showToast("Veuillez saisir un numéro de téléphone à 10 chiffres");
                                    return;
                                }
                                // Envoyer!
                                setIsSending(true);
                                
                                // Preparation immédiate du message
                                const message = generateWhatsAppMessage(title, questions, answers, user, totalPrice, serviceMode, count);

                                let customText = `📝 *Nouveau Formulaire de Demande Soumis*\n\n`;
                                customText += `• *Notification d'origine :* ${title}\n\n`;
                                customText += `--- DÉTAILS DE LA DEMANDE ---\n`;
                                customText += `• *Ville de la demande :* ${city}\n`;
                                customText += `• *Numéro de téléphone du correspondant :* +225 ${formatPhoneNumber(phone)}\n\n`;
                                customText += `--- IDENTITÉ DE L'UTILISATEUR ---\n`;
                                customText += `• *Nom :* ${user.name || 'Non spécifié'}\n`;
                                customText += `• *Ville de l'utilisateur :* ${user.city || 'Non spécifiée'}\n`;
                                customText += `• *Numéro de téléphone enregistré :* ${user.phone || 'Non spécifié'}\n`;

                                const sanitizedPhone = user.phone.replace(/\D/g, '');
                                const chatUserId = sanitizedPhone || user.userId || user.id || `${user.name}_${sanitizedPhone}`;
                                
                                const chatMsg = {
                                    sender: 'user',
                                    text: customText,
                                    timestamp: Date.now(),
                                    type: 'form_submission',
                                    formData: {
                                        title,
                                        formType,
                                        answers,
                                        totalPrice: totalPrice
                                    }
                                };

                                try {
                                    await databaseService.savePrivateChatMessage(chatUserId, chatMsg);
                                    
                                    const payAmount = 100;
                                    const payMessage = generateWhatsAppMessage("Paiement des frais de communication", questions, answers, user, payAmount, serviceMode, count);
                                    window.dispatchEvent(new CustomEvent('trigger-payment-view', { 
                                      detail: {
                                        title: "Paiement des frais de communication",
                                        amount: payAmount.toString(),
                                        paymentType: 'simple_demande',
                                        waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${payAmount}`,
                                        formData: {
                                            formType: 'simple_demande',
                                            formTitle: "Paiement des frais de communication",
                                            data: answers,
                                            whatsappMessage: payMessage
                                        }
                                      }
                                    }));
                                    onClose();
                                } catch (error) {
                                    console.error("Error submitting simple demand form:", error);
                                    showToast("Erreur lors de la soumission. Réessayez.");
                                } finally {
                                    setIsSending(false);
                                }
                            }}
                            disabled={isSending}
                            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[56px] cursor-pointer"
                        >
                            {isSending ? <Spinner /> : <span>Envoyer la demande</span>}
                        </button>
                    </div>

                    <p className="text-gray-400 text-xs leading-relaxed text-center px-4 mt-6">
                        {description || "Service professionnel de mise en relation FILANT°225. Nous garantissons la compétence et la fiabilité de nos prestataires."}
                    </p>

                    {/* Toast Alert */}
                    {toastMessage && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 bg-black/90 text-white font-bold text-xs uppercase tracking-wide rounded-full shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300 z-50 whitespace-nowrap">
                            {toastMessage}
                        </div>
                    )}
                </div>
            ) : (
                <>
                {isWorker && !isBlurredImage && !isRapidTitle && (
                  <div className="flex gap-3 mb-8">
                      <button 
                        onClick={() => setServiceMode('Embauche')}
                        className={`px-5 py-2 rounded-full font-black text-[10px] uppercase transition-all border-2 ${serviceMode === 'Embauche' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                      >
                          Embauche
                      </button>
                      <button 
                        onClick={() => setServiceMode('Service rapide')}
                        className={`px-5 py-2 rounded-full font-black text-[10px] uppercase transition-all border-2 ${serviceMode === 'Service rapide' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                      >
                          Service rapide
                      </button>
                  </div>
                )}

                {formType !== 'simple_demande' && (
                  <div className="flex flex-col items-center mb-8 bg-orange-50 px-8 py-3 rounded-2xl border border-orange-100 shadow-sm">
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">
                          {isBlurredImage ? "Dépôt de candidature (Embauche)" : (isRapidTitle ? "Intervention Immédiate" : (formType === 'stage' || formType === 'formation') ? "Frais de communication du service" : "Frais de mise en relation")}
                      </span>
                      <span className="text-2xl font-black text-orange-600">{totalPrice} CFA</span>
                  </div>
                )}

                {formType !== 'simple_demande' && formType !== 'stage' && formType !== 'formation' && !isAppart && (
                  <div className="flex flex-col items-center mb-8">
                      <span className="text-[11px] font-black uppercase text-gray-800 mb-3">{isWorker ? 'Personne' : 'Quantité'}</span>
                      <div className="flex items-center gap-6">
                          <button onClick={() => setCount(Math.max(1, count - 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold active:bg-gray-50">-</button>
                          <span className="text-3xl font-black text-black w-8 text-center">{count}</span>
                          <button onClick={() => setCount(count + 1)} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold active:bg-gray-50">+</button>
                      </div>
                  </div>
                )}

                {!isFormComplete && currentQuestion && (
                    <div className="w-full max-w-sm mb-10 animate-in fade-in slide-in-from-right duration-500 delay-300">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <p className="text-center font-bold text-gray-900 text-base">{currentQuestion.text(answers)}</p>
                          <SpeakerIcon text={currentQuestion.text(answers)} className="text-orange-500" />
                        </div>

                        {currentQuestion.type === 'buttons' ? (
                            <div className="grid grid-cols-2 gap-2">
                                {currentQuestion.options?.map((opt) => (
                                    <button
                                      key={opt.value}
                                      disabled={isWaitingNext}
                                      onClick={() => handleNext(opt.value)}
                                      className="bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-xl p-2.5 text-[11px] font-black uppercase text-gray-700 active:scale-95 transition-all flex items-center justify-center min-h-[40px] tracking-tight"
                                    >
                                        {isWaitingNext ? <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div> : opt.label}
                                    </button>
                                ))}
                            </div>
                        ) : currentQuestion.type === 'date' ? (
                            <div className="flex gap-2 items-stretch">
                                <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 border-2 border-slate-100 focus-within:border-orange-500 transition-all">
                                    <input 
                                        type="date" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="bg-transparent w-full py-3 text-sm font-bold text-gray-800 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleNext()}
                                        disabled={isWaitingNext || !inputValue}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[90px] h-[52px]"
                                    >
                                        {isWaitingNext ? <Spinner /> : <span>Suivant</span>}
                                    </button>
                                    {step > 0 && (
                                        <button 
                                            onClick={() => setStep(prev => prev - 1)}
                                            className="text-gray-400 font-bold text-[9px] uppercase tracking-widest py-1"
                                        >
                                            Retour
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : currentQuestion.type === 'select' ? (
                            <div className="flex gap-2 items-stretch">
                                <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 border-2 border-slate-100 focus-within:border-orange-500 transition-all">
                                    <select 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="bg-transparent w-full py-3 text-sm font-bold text-gray-800 outline-none appearance-none"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {currentQuestion.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleNext()}
                                        disabled={isWaitingNext || !inputValue}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[90px] h-[52px]"
                                    >
                                        {isWaitingNext ? <Spinner /> : <span>Suivant</span>}
                                    </button>
                                    {step > 0 && (
                                        <button 
                                            onClick={() => setStep(prev => prev - 1)}
                                            className="text-gray-400 font-bold text-[9px] uppercase tracking-widest py-1"
                                        >
                                            Retour
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                          <div className="flex gap-2 items-stretch">
                              <div className="flex-1 flex flex-col gap-2">
                                  <div className="bg-gray-50 rounded-2xl flex items-center px-4 border-2 border-slate-100 focus-within:border-orange-500 transition-all w-full">
                                      {(currentQuestion.key === 'city' || currentQuestion.key === 'workLocation' || currentQuestion.key === 'location' || currentQuestion.key === 'serviceCity' || currentQuestion.key === 'commune') ? (
                                        <CityAutocompleteInput
                                          value={inputValue}
                                          onChange={setInputValue}
                                          placeholder={currentQuestion.placeholder || "..."}
                                          inputClassName="bg-transparent w-full py-3 text-sm font-bold text-gray-800 outline-none"
                                        />
                                      ) : (
                                        <input 
                                            ref={inputRef}
                                            type={currentQuestion.inputType === 'tel' ? 'text' : (currentQuestion.inputType || 'text')} 
                                            inputMode={currentQuestion.inputType === 'tel' ? 'numeric' : undefined}
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onClick={handleInputClick}
                                            onFocus={handleInputClick}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                            className="bg-transparent w-full py-3 text-sm font-bold text-gray-800 outline-none"
                                            placeholder={currentQuestion.placeholder || "..."}
                                        />
                                      )}
                                  </div>
                                  {currentQuestion.hint && (
                                    <p className="text-[10px] text-gray-400 font-bold italic ml-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                      {currentQuestion.hint}
                                    </p>
                                  )}
                              </div>
                              <div className="flex flex-col gap-2">
                                  <button 
                                      onClick={() => handleNext()}
                                      disabled={isWaitingNext}
                                      className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[90px] h-[52px]"
                                  >
                                      {isWaitingNext ? <Spinner /> : <span>Suivant</span>}
                                  </button>
                                  {step > 0 && (
                                    <button 
                                        onClick={() => setStep(prev => prev - 1)}
                                        className="text-gray-400 font-bold text-[9px] uppercase tracking-widest py-1"
                                    >
                                        Retour
                                    </button>
                                  )}
                              </div>
                          </div>
                        )}
                    </div>
                )}

                {isFormComplete && (
                    <div className="w-full max-w-sm mb-10 animate-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="w-full bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                                <span className="text-[10px] font-black uppercase text-gray-400">Résumé de votre demande</span>
                                <button 
                                    onClick={() => setStep(questions.length - 1)}
                                    className="text-orange-500 font-black text-[10px] uppercase"
                                >
                                    Modifier
                                </button>
                            </div>
                            {questions.map((q, i) => {
                                if (q.condition && !q.condition(answers)) return null;
                                return (
                                    <div key={q.key} className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">{q.text(answers).replace(/\?$/, '')}</span>
                                        <span className="text-sm font-black text-gray-900 leading-tight">{answers[q.key] || 'Non renseigné'}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                          onClick={() => handleAction('assistant')}
                          disabled={isSending}
                          className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-5 rounded-3xl text-xl uppercase tracking-wider shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[68px] cursor-pointer"
                        >
                            {isSending ? <Spinner /> : <span>{formType === 'simple_demande' ? 'Envoyer la demande' : 'Confirmé'}</span>}
                        </button>
                        
                        <button 
                            onClick={() => {
                                localStorage.removeItem(storageKey);
                                setAnswers({});
                                setStep(0);
                                setInputValue('');
                            }}
                            className="mt-4 text-gray-400 font-bold text-[9px] uppercase tracking-widest py-1 cursor-pointer"
                        >
                            Recommencer le formulaire
                        </button>
                    </div>
                )}

                <p className="text-gray-400 text-xs leading-relaxed text-center px-4 mb-12">
                  {description || "Service professionnel de mise en relation FILANT°225. Nous garantissons la compétence et la fiabilité de nos prestataires."}
                </p>

                <div className="mt-auto mb-6 relative w-full flex justify-center">
                    {toastMessage && (
                        <div className="absolute bottom-full mb-4 px-6 py-2 bg-white text-orange-500 font-black text-xs uppercase tracking-widest rounded-full shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300 border border-orange-100">
                            {toastMessage}
                        </div>
                    )}
                    
                    <div className="flex items-center gap-10 py-2">
                        <button 
                          onClick={() => handleAction('assistant')}
                          disabled={isSending}
                          className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform overflow-hidden p-1.5 cursor-pointer"
                        >
                            {isSending ? <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div> : <div className="w-full h-full bg-orange-600 rounded-full flex items-center justify-center text-white"><span className="font-black text-xl">F</span></div>}
                        </button>
                        
                        <span className="text-gray-400 font-black text-[9px] uppercase tracking-tighter w-24 text-center leading-tight">
                          {isFormComplete ? "Prêt à transmettre" : `${remainingFields} champs à remplir`}
                        </span>

                        {formType !== 'simple_demande' ? (
                          <button 
                            onClick={() => handleAction('whatsapp')}
                            disabled={isSending}
                            className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform p-3 cursor-pointer"
                          >
                              {isSending ? <Spinner /> : <Phone className="w-full h-full text-white" fill="currentColor" />}
                          </button>
                        ) : (
                          <div className="w-14"></div>
                        )}
                    </div>
                </div>
                </>
            )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmbeddedForm;
