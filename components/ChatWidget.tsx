
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { chatService } from '../services/chatService';
import { databaseService, StoredChatMessage } from '../services/databaseService';
import { audioService } from '../services/audioService';
import { Linkify } from '../utils/textUtils';
import { Tab } from '../types';
import SpeakerIcon from './common/SpeakerIcon';

const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.405 0 4.725.282 6.917.783 3.54.81 6.083 3.894 6.083 7.467 0 2.77-1.935 5.197-4.524 6.359a25.86 25.86 0 01-4.479 1.343.75.75 0 00-.449.374l-1.17 2.641a.75.75 0 01-1.329.124l-.987-1.878a.75.75 0 00-.512-.393c-1.692-.313-3.317-.786-4.876-1.406a8.25 8.25 0 01-4.919-6.338C1.192 7.135 3.033 4.263 4.848 2.771z" clipRule="evenodd" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" />
    </svg>
);

const WAVE_LOGO_URL = "https://i.supaimg.com/ff5dee1c-8ed5-426e-8fb7-eba013e98837.png";
const ASSISTANT_IMAGE_URL = "https://i.supaimg.com/5cd01a23-e101-4415-9e28-ff02a617cd11.png";

interface Message extends StoredChatMessage {
    paymentInfo?: { link: string; amount: string } | null;
    whatsAppPayload?: string;
    userId?: string;
    userName?: string;
}

interface ChatWidgetProps {
    userPhone: string;
    userId?: string;
    userName?: string;
    activeTab: Tab;
    currentMenuView: string;
    unreadChatCount?: number;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ userPhone, userId, userName, activeTab, currentMenuView, unreadChatCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [firebaseMessages, setFirebaseMessages] = useState<Message[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, messageId: string | null}>({show: false, messageId: null});
  
  const [position, setPosition] = useState({ bottom: '100px', left: '20px' });
  const [moveDuration, setMoveDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sanitizedPhone = userPhone.replace(/\D/g, '');
  const chatUserId = sanitizedPhone || userId || `${userName || 'User'}_${sanitizedPhone}`;

  useEffect(() => {
    if (isOpen) return;
    let timeoutId: any;
    const moveButton = () => {
        const paddingBottom = 100; 
        const paddingTop = 150; 
        const paddingX = 20;
        const frameW = Math.min(window.innerWidth, 480);
        const frameH = window.innerHeight;
        const randomY = Math.floor(Math.random() * (frameH - paddingTop - paddingBottom)) + paddingBottom;
        const randomX = Math.floor(Math.random() * (frameW - paddingX * 2 - 64)) + paddingX;
        const duration = Math.random() * 3 + 3; 
        setMoveDuration(duration);
        setPosition({ bottom: `${randomY}px`, left: `${randomX}px` });
        timeoutId = setTimeout(moveButton, (duration * 1000) + (Math.random() * 2000));
    };
    timeoutId = setTimeout(moveButton, 1000);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!userPhone) return;
    const history = databaseService.getChatHistory(userPhone);
    if (history.length > 0) setMessages(history);
    else resetChatWithWelcome();
  }, [userPhone]);

  // Listen to Firebase messages in real-time
  useEffect(() => {
    if (!chatUserId) return;
    
    let unsubscribe: any;
    const setupFirebaseListener = () => {
      unsubscribe = databaseService.onAssistantChatUpdate(chatUserId, (msgs) => {
        // Map RTDB messages to our Message format if needed
        const mappedMsgs = msgs.map(m => ({
          ...m,
          sender: m.sender === 'admin' ? 'ai' : 'user' // Map admin to 'ai' for consistent styling in widget
        }));
        setFirebaseMessages(mappedMsgs);
      });
    };
    
    setupFirebaseListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatUserId]);

  // Merge local and firebase messages
  useEffect(() => {
    if (firebaseMessages.length === 0) return;
    
    setMessages(prev => {
      // Create a map of existing messages by ID or text+timestamp to avoid duplicates
      const existingIds = new Set(prev.map(m => m.id || `${m.text}_${m.timestamp}`));
      const newFromFirebase = firebaseMessages.filter(m => !existingIds.has(m.id || `${m.text}_${m.timestamp}`));
      
      if (newFromFirebase.length === 0) return prev;
      
      const merged = [...prev, ...newFromFirebase].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      return merged;
    });
  }, [firebaseMessages]);

  useEffect(() => {
    if (isOpen && chatUserId && firebaseMessages.length > 0) {
      const lastMsg = firebaseMessages[firebaseMessages.length - 1];
      if (lastMsg.sender === 'admin' && !lastMsg.read) {
        databaseService.markAssistantMessagesAsRead(chatUserId, 'admin');
      }
    }
  }, [isOpen, chatUserId, firebaseMessages]);

  const resetChatWithWelcome = () => {
    const welcomeMsg: Message = { 
        id: 'init-1', 
        text: 'Bonjour ! Je suis l\'assistant FILANT°225. Comment puis-je vous aider aujourd\'hui ?', 
        sender: 'ai',
        timestamp: Date.now()
    };
    setMessages([welcomeMsg]);
    databaseService.saveAssistantChatMessage(chatUserId, welcomeMsg);
  };

  const displayMessages = useMemo(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return messages.filter(msg => (msg.timestamp || Date.now()) > twentyFourHoursAgo);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isOpen]);

  useEffect(() => {
    const handleTrigger = (event: CustomEvent<string | { message: string, phone?: string, name?: string }>) => {
      // If we are already on the UserChat tab, we don't need to open the widget popup
      // because the ChatScreen will handle showing the message via Firebase
      if (activeTab !== Tab.UserChat) {
          setIsOpen(true);
      }
      
      if (typeof event.detail === 'string') {
        handleSend(event.detail);
      } else if (event.detail && typeof event.detail === 'object') {
        handleSend(event.detail.message, event.detail.phone, event.detail.name);
      }
    };
    window.addEventListener('trigger-chat-message' as any, handleTrigger as any);
    return () => {
      window.removeEventListener('trigger-chat-message' as any, handleTrigger as any);
    };
  }, [userPhone]);

  const detectPrice = (text: string) => {
    // Nettoyage Markdown pour la détection
    const cleanText = text.replace(/[\*_]/g, '');

    // Priorité 1: Recherche explicite du Montant Total
    const totalMatch = cleanText.match(/Montant Total à Payer\s*[:]\s*(\d+)/i);
    if (totalMatch && parseInt(totalMatch[1]) > 0) {
        return {
            amount: totalMatch[1],
            link: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${totalMatch[1]}`
        };
    }

    // Priorité 2: Recherche générique du libellé Montant/Frais/Prix
    const amountMatch = cleanText.match(/(?:Montant|Frais|Prix|Tarif|Total)\s*[:]\s*(\d+)/i);
    if (amountMatch && parseInt(amountMatch[1]) > 0) {
        return {
            amount: amountMatch[1],
            link: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amountMatch[1]}`
        };
    }

    // Priorité 3: Chiffre suivi de FCFA/CFA, mais à distance des ID de suivi
    // On ignore les chiffres seuls pour éviter de capturer l'ID
    const currencyMatch = cleanText.match(/(\d+)\s*(?:F|FCFA|CFA)/i);
    if (currencyMatch && parseInt(currencyMatch[1]) > 0 && !cleanText.includes(`ID de suivi: ${currencyMatch[1]}`)) {
        return {
            amount: currencyMatch[1],
            link: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${currencyMatch[1]}`
        };
    }

    // Cas spécial Inscription
    if (text.toLowerCase().includes("inscription") || text.toLowerCase().includes("mise en ligne")) {
        return {
            amount: "310",
            link: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=310"
        };
    }

    // Cas spécial Récupération de carte
    if (text.includes("récupération de carte") || text.includes("7100")) {
        return {
            amount: "7100",
            link: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=7100"
        };
    }

    // Cas spécial Montant d'expédition (saisie manuelle)
    if (text.includes("Montant d’expédition")) {
        return {
            amount: "custom",
            link: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount="
        };
    }

    return null;
  };

  useEffect(() => {
    if (isOpen && chatUserId) {
        databaseService.markAssistantMessagesAsRead(chatUserId, 'admin');
    }
  }, [isOpen, chatUserId]);

  const handleSend = async (overrideText?: any, overridePhone?: string, overrideName?: string) => {
    const textToSend = (typeof overrideText === 'string' ? overrideText : input).trim();
    if (!textToSend) return;

    let detected = detectPrice(textToSend);
    const isFormSubmission = textToSend.includes("Nouvelle demande via FILANT") || textToSend.includes("Nouvelle inscription via FILANT");
    const isCardRecovery = textToSend.includes("récupération de carte");
    
    // Use override phone if provided, otherwise fallback to props
    const effectivePhone = overridePhone || userPhone;
    const effectiveName = overrideName || userName;
    const sanitizedEffectivePhone = effectivePhone.replace(/\D/g, '');
    const effectiveChatUserId = sanitizedEffectivePhone || userId || `${effectiveName || 'User'}_${sanitizedEffectivePhone}`;

    const msgId = Date.now().toString();
    const userMsg: Message = { 
        id: msgId, 
        text: textToSend, 
        sender: 'user',
        timestamp: Date.now(),
        userId: effectiveChatUserId,
        userName: effectiveName || sanitizedEffectivePhone
    };

    // Only update local state if we're not using Firebase sync or to show it immediately
    // The merge logic in useEffect will handle de-duplication if IDs match
    setMessages(prev => {
        const exists = prev.some(m => m.id === msgId);
        if (exists) return prev;
        return [...prev, userMsg];
    });

    // Sync to Firebase if effectiveChatUserId is available
    if (effectiveChatUserId) {
        if (detected || isFormSubmission || isCardRecovery) {
            // Log as a formal request which includes the message text
            databaseService.saveAssistantRequest({
                userId: effectiveChatUserId,
                userName: effectiveName || 'Utilisateur',
                phone: sanitizedEffectivePhone,
                request: textToSend,
                requestText: textToSend,
                amount: detected?.amount || null,
                paymentLink: detected?.link || null,
                isFormSubmission,
                isCardRecovery,
                sender: 'user', // Ensure it's marked as user for chat history
                text: textToSend // Ensure it's displayable as a message
            });
        } else {
            // Simple chat message
            databaseService.saveAssistantChatMessage(effectiveChatUserId, {
                ...userMsg,
                sender: 'user'
            });
        }
    }
    
    if (typeof overrideText !== 'string') setInput('');
    
    let aiResponseText = "";
    let isAILoading = false;

    if (isFormSubmission) {
        aiResponseText = "J'ai bien reçu votre demande via FILANT°225. Voici le récapitulatif ci-dessus.\n\nSouhaitez-vous procéder au paiement maintenant ou contacter un conseiller sur WhatsApp ?";
    } else if (isCardRecovery) {
        aiResponseText = "C'est noté. Pour récupérer et intégrer votre carte FILANT°225, un paiement de 7 100 FCFA est requis. Veuillez utiliser le bouton de paiement ci-dessous, puis transmettez votre demande sur WhatsApp.";
    } else {
        setIsTyping(true);
        isAILoading = true;
        aiResponseText = await chatService.sendMessage(userMsg.text);
        
        // After every normal AI response, if it's not a payment request, we can still add the buttons if needed,
        // but user specifically asked for "After each info send (form, message)".
        // I will ensure any AI response has the buttons if it's about a service or info.
    }
    
    // Si aucun prix n'a été détecté dans le message utilisateur, on cherche dans la réponse de l'IA
    if (!detected) {
        detected = detectPrice(aiResponseText);
    }

    // Si c'est une demande de service/paiement mais toujours pas de prix, on met un montant libre (custom)
    const isPaymentRequest = isFormSubmission || isCardRecovery ||
        /paiement|payer|carte|renouvellement|commander|service|frais|tarif|prix|recrutement|aide|devis/i.test(textToSend) ||
        /paiement|payer|carte|renouvellement|commander|service|frais|tarif|prix|recrutement|aide|devis/i.test(aiResponseText);

    if (!detected && isPaymentRequest) {
        detected = {
            amount: "custom",
            link: "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount="
        };
    }

    // Force WhatsApp buttons for all service interventions or form submissions
    const forceButtons = isFormSubmission || isCardRecovery || isPaymentRequest;
    
    let whatsAppPayload = textToSend;
    if (detected && detected.amount !== "custom") {
        if (!whatsAppPayload.includes(`Montant Total à Payer: ${detected.amount}`)) {
            whatsAppPayload += `\n\n*Montant:* ${detected.amount} FCFA\n*Lien de paiement:* ${detected.link}`;
        }
    }

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = { 
        id: aiMsgId, 
        text: aiResponseText, 
        sender: 'ai',
        timestamp: Date.now(),
        paymentInfo: detected, 
        whatsAppPayload: forceButtons ? (whatsAppPayload || aiResponseText) : undefined, 
        userId: effectiveChatUserId,
        userName: "Assistant FILANT"
    };

    setMessages(prev => {
        const exists = prev.some(m => m.id === aiMsgId);
        if (exists) return prev;
        return [...prev, aiMsg];
    });
    
    if (effectiveChatUserId) {
        databaseService.saveAssistantChatMessage(effectiveChatUserId, aiMsg);
    }
    
    if (isAILoading) {
        setIsTyping(false);
    }

    const textToSpeak = aiResponseText
        .replace(/(https?:\/\/[^\s]+)/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    
    audioService.speak(textToSpeak);
  };

  const handleWhatsAppRedirect = (payload: string) => {
      const url = `https://wa.me/2250705052632?text=${encodeURIComponent(payload)}`;
      window.open(url, '_blank');
  };

  const handleDeleteMessage = async () => {
      if (!deleteConfirm.messageId) return;
      
      // Delete from local state
      const updatedMessages = messages.filter(m => m.id !== deleteConfirm.messageId);
      setMessages(updatedMessages);
      databaseService.saveChatHistory(userPhone, updatedMessages);
      
      // Delete from Firebase if chatUserId is available
      if (chatUserId) {
          await databaseService.deleteAssistantChatMessage(chatUserId, deleteConfirm.messageId);
      }
      
      setDeleteConfirm({show: false, messageId: null});
  };

  const handleDeleteAllMessages = async () => {
      if (!window.confirm("Voulez-vous vraiment supprimer tous les messages ?")) return;
      
      // Clear local state
      setMessages([]);
      databaseService.clearChatHistory(userPhone);
      
      // Clear Firebase if chatUserId is available
      if (chatUserId) {
          await databaseService.clearAssistantChatHistory(chatUserId);
      }

      // Add back the welcome message
      resetChatWithWelcome();
  };

  const handleOpenPaymentView = (paymentInfo: {link: string, amount: string}, messageText: string) => {
      // Détermination intelligente du titre pour l'affichage de confirmation
      let title = "Mise en relation";
      
      if (messageText.includes("récupération de carte")) title = "Récupération Carte Pro";
      else if (messageText.includes("régularisation de carte")) title = "Régularisation Carte Pro";
      else if (messageText.includes("expédition")) title = "Montant d’expédition";
      else {
          const titleMatch = messageText.match(/pour ([^.]+)/i);
          if (titleMatch) title = titleMatch[1].trim();
      }
      
      const event = new CustomEvent('trigger-payment-view', { 
          detail: { waveLink: paymentInfo.link, amount: paymentInfo.amount, title, paymentType: 'Service' } 
      });
      window.dispatchEvent(event);
      setIsOpen(false);
  };

  if (activeTab === Tab.UserChat) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute z-50 group"
          style={{ bottom: position.bottom, left: position.left, transition: `all ${moveDuration}s ease-in-out` }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-orange-800 translate-y-2"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-300 overflow-hidden">
               <img src={ASSISTANT_IMAGE_URL} alt="Assistant" className="w-12 h-12 object-contain animate-pulse" referrerPolicy="no-referrer" />
            </div>
            {unreadChatCount && unreadChatCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg z-20">
                <span className="text-[10px] font-black text-white">{unreadChatCount}</span>
              </div>
            )}
            <span className="absolute bottom-1 right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span></span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="absolute inset-0 z-[2100] flex flex-col bg-white dark:bg-slate-900 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          {/* Header Professionnel */}
          <div className="bg-orange-500 p-5 flex justify-between items-center shadow-lg relative z-10">
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <img src={ASSISTANT_IMAGE_URL} alt="Assistant" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
               </div>
               <div>
                  <h3 className="font-black text-white uppercase text-sm tracking-tight">Assistant FILANT°225</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">En ligne</span>
                  </div>
               </div>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={handleDeleteAllMessages} 
                  className="bg-white/10 text-white px-3 py-2 rounded-full hover:bg-white/20 transition-all flex items-center gap-2"
                  title="Tout supprimer"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Tout supprimer</span>
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-all active:scale-90"
                  title="Fermer"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
            </div>
          </div>

          {/* Zone de messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 scrollbar-hide overscroll-contain">
            {displayMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[90%] p-5 rounded-3xl text-[14px] leading-relaxed relative shadow-sm select-text touch-auto overflow-hidden ${msg.sender === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-slate-700'}`}>
                    <div className="break-words whitespace-pre-wrap">
                      <Linkify text={msg.text || msg.message || msg.whatsappMessage} />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.sender === 'ai' && (
                                <SpeakerIcon text={msg.text || msg.message || msg.whatsappMessage} className="p-1" />
                            )}
                        </div>
                        <button 
                            onClick={() => setDeleteConfirm({show: true, messageId: msg.id || ''})}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${msg.sender === 'user' ? 'text-white/60 hover:bg-white/10' : 'text-slate-400'}`}
                            title="Supprimer ce message"
                        >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Supprimer</span>
                        </button>
                    </div>

                    {msg.sender === 'ai' && (msg.paymentInfo || msg.whatsAppPayload) && (
                        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-700 space-y-4">
                            {msg.paymentInfo && (
                                <button 
                                    onClick={() => handleOpenPaymentView(msg.paymentInfo!, msg.text)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                >
                                    <img 
                                        src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/756a216c-cba5-487d-8e2f-aa9312795945.png" 
                                        alt="Paiement" 
                                        className="w-6 h-6 object-contain" 
                                        referrerPolicy="no-referrer"
                                    />
                                    <span className="uppercase tracking-widest text-[12px]">
                                        {msg.paymentInfo.amount === 'custom' ? 'Payer (Wave)' : `Payer (Wave) – ${msg.paymentInfo.amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} F`}
                                    </span>
                                </button>
                            )}

                            {msg.whatsAppPayload && (
                                <button 
                                    onClick={() => handleWhatsAppRedirect(msg.whatsAppPayload!)} 
                                    className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-4.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    <span className="uppercase tracking-widest text-[12px]">WhatsApp (Conseiller)</span>
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Professionnel */}
          <div className="p-5 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center px-4 border-2 border-transparent focus-within:border-orange-500/30 transition-all">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Écrivez votre message..." 
                  className="flex-1 py-4 bg-transparent outline-none text-sm font-medium dark:text-white" 
                />
              </div>
              <button 
                type="submit" 
                disabled={!input.trim()}
                className="w-14 h-14 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                <SendIcon className="w-7 h-7" />
              </button>
            </form>
          </div>

          {/* Modal de confirmation de suppression */}
          {deleteConfirm.show && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] p-6 w-full max-w-[240px] shadow-2xl text-center animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrashIcon className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-2">Supprimer ?</h3>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed mb-6">
                          Voulez-vous supprimer ce message ?
                      </p>
                      <div className="flex flex-col gap-2">
                          <button 
                              onClick={handleDeleteMessage}
                              className="w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg active:scale-95 transition-transform"
                          >
                              Oui, supprimer
                          </button>
                          <button 
                              onClick={() => setDeleteConfirm({show: false, messageId: null})}
                              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-transform"
                          >
                              Annuler
                          </button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
