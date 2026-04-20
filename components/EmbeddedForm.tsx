
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import SpeakerIcon from './common/SpeakerIcon';
import { getQuestionsForType, generateWhatsAppMessage, calculateTotalPrice, Answers, AnswerValue, getFormImage } from './common/formDefinitions';
import { databaseService } from '../services/databaseService';
import { audioService } from '../services/audioService';

const LOGO_URL = "https://i.supaimg.com/5cd01a23-e101-4415-9e28-ff02a617cd11.png";
const WHATSAPP_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
);

interface EmbeddedFormProps {
  title: string;
  formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service';
  user: User;
  onClose: () => void;
  description?: string;
  imageUrl?: string | string[];
  isBlurredImage?: boolean;
}

const EmbeddedForm: React.FC<EmbeddedFormProps> = ({ 
  title, 
  formType, 
  user, 
  onClose,
  description,
  imageUrl,
  isBlurredImage
}) => {
  const isRapidTitle = title.toLowerCase().endsWith('rapide');

  const [serviceMode, setServiceMode] = useState<'Embaucher' | 'Service rapide'>(() => {
    if (isBlurredImage) return 'Embaucher';
    return 'Service rapide';
  });

  const questions = useMemo(() => getQuestionsForType(formType, title, serviceMode), [formType, title, serviceMode]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [inputValue, setInputValue] = useState('');
  const [count, setCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingNext, setIsWaitingNext] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStep(0);
    setAnswers({});
    setInputValue('');
  }, [serviceMode]);

  const currentQuestion = questions[step];

  const currentAnswers = useMemo(() => {
    if (currentQuestion) {
      return { ...answers, [currentQuestion.key]: inputValue };
    }
    return answers;
  }, [answers, currentQuestion, inputValue]);

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

  useEffect(() => {
    if (currentQuestion) {
        if (currentQuestion.type === 'text' || currentQuestion.type === 'date' || currentQuestion.type === 'select') {
            setInputValue((answers[currentQuestion.key] as string) || currentQuestion.defaultValue || '');
        }
    }
  }, [step, currentQuestion, answers]);

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

  const handleAction = (target: 'whatsapp' | 'assistant' | 'validate') => {
    if (!isFormComplete) {
      showToast(`${remainingFields} champs à remplir`);
      return;
    }
    
    // Preparation immédiate du message
    const message = generateWhatsAppMessage(title, questions, answers, user, totalPrice, serviceMode, count);

    // Envoi à l'assistant pour traitement (Paiement, Récapitulatif, etc.)
    window.dispatchEvent(new CustomEvent('trigger-chat-message', { 
        detail: {
            message: message,
            phone: user.phone,
            name: user.name
        }
    }));

    // Si on a explicitement demandé WhatsApp, on l'ouvre aussi
    if (target === 'whatsapp') {
        window.open(`https://wa.me/2250705052632?text=${encodeURIComponent(message)}`, '_blank');
    }

    // Sauvegarde en arrière-plan sans bloquer l'UI
    databaseService.saveFormSubmission({ 
        userPhone: user.phone, 
        formType, 
        formTitle: title, 
        data: answers, 
        whatsappMessage: message 
    }).catch(err => console.error("Error background saving form:", err));

    // Fermeture immédiate du formulaire pour voir la messagerie
    onClose();
  };

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
          className="relative h-[220px] w-full flex-shrink-0"
        >
            <img 
              src={resolvedImage || "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg"} 
              alt="header" 
              className={`w-full h-full object-cover grayscale-[0.2] ${isBlurredImage ? 'blur-[15px]' : ''}`} 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40"></div>
            {isBlurredImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/60 text-lg font-black uppercase tracking-[0.3em] drop-shadow-lg">MASQUÉ</span>
                </div>
            )}
            <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-90 z-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="text-white font-black text-xl tracking-tighter uppercase drop-shadow-lg">FILANT°225</span>
            </div>
        </motion.div>

        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 bg-white rounded-t-[3rem] -mt-12 relative z-10 p-6 flex flex-col items-center"
        >
            <div className="w-16 h-1.5 bg-gray-100 rounded-full mb-6"></div>
            
            <div className="mb-6 flex flex-col items-center">
                <h2 className="text-xl font-black text-black uppercase tracking-tight text-center">{title}</h2>
                <div className="h-1 w-20 bg-orange-500 mt-1 rounded-full"></div>
            </div>

            {isWorker && !isBlurredImage && !isRapidTitle && (
              <div className="flex gap-3 mb-8">
                  <button 
                    onClick={() => setServiceMode('Embaucher')}
                    className={`px-5 py-2 rounded-full font-black text-[10px] uppercase transition-all border-2 ${serviceMode === 'Embaucher' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                  >
                      Embaucher
                  </button>
                  <button 
                    onClick={() => setServiceMode('Service rapide')}
                    className={`px-5 py-2 rounded-full font-black text-[10px] uppercase transition-all border-2 ${serviceMode === 'Service rapide' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                  >
                      Service rapide
                  </button>
              </div>
            )}

            <div className="flex flex-col items-center mb-8 bg-orange-50 px-8 py-3 rounded-2xl border border-orange-100 shadow-sm">
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">
                    {isBlurredImage ? "Dépôt de candidature (Embauche)" : (isRapidTitle ? "Intervention Immédiate" : "Frais de mise en relation")}
                </span>
                <span className="text-2xl font-black text-orange-600">{totalPrice} CFA</span>
            </div>

            {!isAppart && (
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
                                  className="bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-700 active:scale-95 transition-all flex items-center justify-center min-h-[44px]"
                                >
                                    {isWaitingNext ? <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div> : opt.label}
                                </button>
                            ))}
                        </div>
                    ) : currentQuestion.type === 'date' ? (
                        <div className="flex gap-2 items-stretch">
                            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-6 border-2 border-transparent focus-within:border-orange-200 shadow-inner">
                                <input 
                                    type="date" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="bg-transparent w-full py-4 text-sm font-bold text-gray-800 outline-none"
                                />
                            </div>
                            <button 
                                onClick={() => handleNext()}
                                disabled={isWaitingNext || !inputValue}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]"
                            >
                                {isWaitingNext ? <Spinner /> : <span>Suivant</span>}
                            </button>
                        </div>
                    ) : currentQuestion.type === 'select' ? (
                        <div className="flex gap-2 items-stretch">
                            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-6 border-2 border-transparent focus-within:border-orange-200 shadow-inner">
                                <select 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="bg-transparent w-full py-4 text-sm font-bold text-gray-800 outline-none appearance-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {currentQuestion.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={() => handleNext()}
                                disabled={isWaitingNext || !inputValue}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]"
                            >
                                {isWaitingNext ? <Spinner /> : <span>Suivant</span>}
                            </button>
                        </div>
                    ) : (
                      <div className="flex gap-2 items-stretch">
                          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-6 border-2 border-transparent focus-within:border-orange-200 shadow-inner">
                              <input 
                                  ref={inputRef}
                                  type={currentQuestion.inputType === 'tel' ? 'text' : (currentQuestion.inputType || 'text')} 
                                  inputMode={currentQuestion.inputType === 'tel' ? 'numeric' : undefined}
                                  value={inputValue}
                                  onChange={handleInputChange}
                                  onClick={handleInputClick}
                                  onFocus={handleInputClick}
                                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                  className="bg-transparent w-full py-4 text-sm font-bold text-gray-800 outline-none"
                                  placeholder="..."
                              />
                          </div>
                          <button 
                              onClick={() => handleNext()}
                              disabled={isWaitingNext}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]"
                          >
                              {isWaitingNext ? <Spinner /> : <span>{remainingFields} suivant</span>}
                          </button>
                      </div>
                    )}
                </div>
            )}

            {isFormComplete && (
                <div className="w-full max-w-sm mb-10 animate-in zoom-in-95 duration-500">
                    <button 
                      onClick={() => handleAction('assistant')}
                      disabled={isSending}
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-5 rounded-3xl text-xl uppercase tracking-wider shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[68px]"
                    >
                        {isSending ? <Spinner /> : <span>Confirmé</span>}
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
                      className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform overflow-hidden p-1.5"
                    >
                        {isSending ? <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div> : <img src={LOGO_URL} alt="Assistant" className="w-full h-full object-contain" referrerPolicy="no-referrer" />}
                    </button>
                    
                    <span className="text-gray-400 font-black text-[9px] uppercase tracking-tighter w-24 text-center leading-tight">
                      {isFormComplete ? "Prêt à transmettre" : `${remainingFields} champs à remplir`}
                    </span>

                    <button 
                      onClick={() => handleAction('whatsapp')}
                      disabled={isSending}
                      className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform p-3"
                    >
                        {isSending ? <Spinner /> : <img src={WHATSAPP_LOGO_URL} alt="WhatsApp" className="w-full h-full object-contain brightness-0 invert" referrerPolicy="no-referrer" />}
                    </button>
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmbeddedForm;
