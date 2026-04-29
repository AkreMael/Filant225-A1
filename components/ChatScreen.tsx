
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { Linkify } from '../utils/textUtils';
import SpeakerIcon from './common/SpeakerIcon';

const WAVE_LOGO_URL = "https://i.supaimg.com/ff5dee1c-8ed5-426e-8fb7-eba013e98837.png";

interface ChatMessage {
  id?: string;
  sender: 'admin' | 'user';
  text: string;
  timestamp: number;
  paymentInfo?: { link: string; amount: string } | null;
  whatsAppPayload?: string;
}

interface ChatScreenProps {
  currentUser: User;
  targetUser?: User; // Only for admin
  isAdmin: boolean;
  onBack: () => void;
  type?: 'Assistant' | 'Privee';
}

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9-7-9-7V7l11 5-11 5v-2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" />
    </svg>
);

const QUICK_MESSAGES = [
  { label: 'BIENVENUE', text: "Bonjour ! Bienvenue chez Filan 225. Nous avons bien reçu votre formulaire. Votre profil est en cours de traitement. Merci de votre confiance !" },
  { label: 'VALIDATION', text: "Félicitations ! Votre inscription sur Filan 225 est validée. Vous faites officiellement partie de notre réseau. À très bientôt pour des opportunités !" },
  { label: 'CORRECTION', text: "Bonjour, certaines informations de votre formulaire sont incomplètes. Merci de nous préciser les détails manquants ici même dans cette messagerie." }
];

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, targetUser, isAdmin, onBack, type = 'Privee' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, messageId: string | null}>({show: false, messageId: null});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatTypeLabel = type === 'Assistant' ? 'Assistant' : 'Privé';
  const chatUserId = isAdmin && targetUser 
    ? ((targetUser.phone || '').replace(/\D/g, '') || targetUser.userId || targetUser.id || `${targetUser.name}_${(targetUser.phone || '').replace(/\D/g, '')}`)
    : ((currentUser.phone || '').replace(/\D/g, '') || currentUser.userId || currentUser.id || `${currentUser.name}_${(currentUser.phone || '').replace(/\D/g, '')}`);

  const chatTitle = isAdmin && targetUser ? `Chat ${chatTypeLabel} avec ${targetUser.name}` : `Message ${chatTypeLabel} (Filant 225)`;

  useEffect(() => {
    let unsubscribe: any;
    
    const setupChat = async () => {
      setIsLoading(true);
      const onUpdate = type === 'Assistant' 
        ? databaseService.onAssistantChatUpdate 
        : databaseService.onPrivateChatUpdate;

      unsubscribe = onUpdate(chatUserId, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
        
        // Mark messages from the other side as read
        const otherSide = isAdmin ? 'user' : 'admin';
        if (type === 'Assistant') {
            databaseService.markAssistantMessagesAsRead(chatUserId, otherSide);
        } else {
            databaseService.markPrivateMessagesAsRead(chatUserId, otherSide);
        }

        // Simulate typing indicator when receiving a message
        if (msgs.length > 0 && msgs[msgs.length - 1].sender !== (isAdmin ? 'admin' : 'user')) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 2000);
        }
      });
    };

    setupChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatUserId, type]);

  const displayMessages = useMemo(() => {
    if (isAdmin) return messages;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return messages.filter(msg => msg.timestamp > twentyFourHoursAgo);
  }, [messages, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSendMessage = async (textOverride?: any, senderOverride?: 'user' | 'admin') => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!textToSend) return;

    const newMessage: ChatMessage = {
      sender: senderOverride || (isAdmin ? 'admin' : 'user'),
      text: textToSend,
      timestamp: Date.now()
    };

    try {
      if (typeof textOverride !== 'string') setInputText('');
      
      const saveFunction = type === 'Assistant'
        ? databaseService.saveAssistantChatMessage
        : databaseService.savePrivateChatMessage;

      const success = await saveFunction(chatUserId, newMessage);
      if (!success) {
        // Optionnel: remettre le texte si l'envoi a échoué
        if (typeof textOverride !== 'string') setInputText(textToSend);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  const handleOpenPaymentView = (paymentInfo: {link: string, amount: string}, messageText: string) => {
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
  };

  const handleWhatsAppRedirect = (payload: string) => {
    window.open(`https://wa.me/2250705052632?text=${encodeURIComponent(payload)}`, '_blank');
  };

  const handleDeleteMessage = async () => {
    if (!deleteConfirm.messageId) return;
    
    const deleteFunction = type === 'Assistant'
        ? databaseService.deleteAssistantChatMessage
        : databaseService.deletePrivateChatMessage;

    const success = await deleteFunction(chatUserId, deleteConfirm.messageId);
    if (success) {
      setDeleteConfirm({show: false, messageId: null});
    }
  };

  const handleWhatsAppContact = (data: any) => {
    const text = `Bonjour, je souhaite recruter le profil suivant :\nNom: ${data.name}\nVille: ${data.city}\nMétier: ${data.service}\nPrix: ${data.price}\nFilant Services`;
    
    // Synchronisation admin
    databaseService.saveFormSubmission({
        userPhone: currentUser.phone,
        userName: currentUser.name,
        formType: 'recruitment_contact',
        formTitle: 'Contact Recrutement - ' + data.name,
        data: data,
        whatsappMessage: text,
        type: 'whatsapp_contact'
    }).catch(e => console.error("Error syncing recruitment contact:", e));

    window.open(`https://wa.me/2250546648058?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    // No auto-reply logic needed for now
  }, [displayMessages, isAdmin]);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300">
      <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest truncate">{chatTitle}</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En ligne</span>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-white border-b border-slate-100 p-3 flex gap-2 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg.label}
              onClick={() => handleSendMessage(msg.text, 'admin')}
              className="flex-shrink-0 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-colors active:scale-95 shadow-sm"
            >
              {msg.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/50 overscroll-contain">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des messages...</p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[200px]">
              {isAdmin 
                ? "Envoyez un message privé à cet utilisateur pour démarrer la conversation."
                : "Bienvenue dans votre espace de discussion privée avec Filant 225. Posez vos questions ici !"}
            </p>
          </div>
        ) : (
          displayMessages.map((msg, idx) => {
            const isMe = (isAdmin && msg.sender === 'admin') || (!isAdmin && msg.sender === 'user');
            const messageId = msg.id || `msg_${idx}`;
            
            // Handle special messages
            const messageText = msg.text || msg.message || msg.whatsappMessage || "";
            let content: React.ReactNode = <Linkify text={messageText} />;
            let specialAction: React.ReactNode = null;

            return (
              <div key={messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 group`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative select-text touch-auto overflow-hidden ${
                  isMe 
                    ? 'bg-orange-500 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {content}
                  </div>
                  
                  {!isAdmin && msg.sender === 'admin' && (msg.paymentInfo || msg.whatsAppPayload) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                          {msg.paymentInfo && (
                              <button 
                                  onClick={() => handleOpenPaymentView(msg.paymentInfo!, msg.text)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                              >
                                  <img 
                                      src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/756a216c-cba5-487d-8e2f-aa9312795945.png" 
                                      alt="Wave" 
                                      className="w-5 h-5 object-contain"
                                      referrerPolicy="no-referrer"
                                  />
                                  <span className="uppercase tracking-widest text-[11px]">
                                      {msg.paymentInfo.amount === 'custom' ? 'Payer (Wave)' : `Payer (Wave) – ${msg.paymentInfo.amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} F`}
                                  </span>
                              </button>
                          )}

                          {msg.whatsAppPayload && (
                              <button 
                                  onClick={() => handleWhatsAppRedirect(msg.whatsAppPayload!)} 
                                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                              >
                                  <WhatsAppIcon />
                                  <span className="uppercase tracking-widest text-[11px]">WhatsApp (Conseiller)</span>
                              </button>
                          )}
                      </div>
                  )}

                  <div className="flex items-center justify-between mt-1.5 gap-4">
                    <div className="flex items-center gap-2">
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {!isAdmin && msg.sender === 'admin' && (
                            <SpeakerIcon text={msg.text} className="p-1 opacity-50" />
                        )}
                    </div>
                    <button 
                      onClick={() => setDeleteConfirm({show: true, messageId: messageId})}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 ${isMe ? 'text-white/40' : 'text-slate-300'}`}
                      title="Supprimer ce message"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 shadow-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2 shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md ${
              inputText.trim() ? 'bg-orange-500 text-white active:scale-90' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrashIcon />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">Supprimer le message</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed mb-8">
              Voulez-vous supprimer ce message ? Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteMessage}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-transform"
              >
                Oui, supprimer
              </button>
              <button 
                onClick={() => setDeleteConfirm({show: false, messageId: null})}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
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

export default ChatScreen;
