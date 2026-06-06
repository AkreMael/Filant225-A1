import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { Linkify } from '../utils/textUtils';
import SpeakerIcon from './common/SpeakerIcon';
import { ChevronLeft, Send, Trash2, CreditCard, Check, CheckCheck } from 'lucide-react';

interface ChatMessage {
  id?: string;
  sender: 'admin' | 'user';
  text: string;
  timestamp: number;
  paymentInfo?: { link: string; amount: string } | null;
  whatsAppPayload?: string;
  isRead?: boolean;
  adminReadStatus?: 'LU' | 'NON LU' | 'VU';
}

interface ChatScreenProps {
  currentUser: User;
  targetUser?: User; // Only for admin
  isAdmin: boolean;
  onBack: () => void;
  type?: 'Privee';
}

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" />
  </svg>
);

const QUICK_MESSAGES = [
  { label: 'BIENVENUE', text: "Bonjour ! Bienvenue chez FILANT°225. Nous avons bien reçu votre formulaire. Votre profil est en cours de traitement. Merci de votre confiance !" },
  { label: 'VALIDATION', text: "Félicitations ! Votre inscription sur FILANT°225 est validée. Vous faites officiellement partie de notre réseau. À très bientôt pour des opportunités !" },
  { label: 'CORRECTION', text: "Bonjour, certaines informations de votre formulaire sont incomplètes. Merci de nous préciser les détails manquants ici même dans cette messagerie." }
];

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, targetUser, isAdmin, onBack, type = 'Privee' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, messageId: string | null, isBulk?: boolean}>({show: false, messageId: null});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [viewportHeight, setViewportHeight] = useState<number | string>('100dvh');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewportHeight(height);
      
      // Auto-scroll when keyboard status changes
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (shouldAutoScroll !== isAtBottom) {
      setShouldAutoScroll(isAtBottom);
    }
  };

  const chatUserId = isAdmin && targetUser 
    ? ((targetUser.phone || '').replace(/\D/g, '') || targetUser.userId || targetUser.id || `${targetUser.name}_${(targetUser.phone || '').replace(/\D/g, '')}`)
    : ((currentUser.phone || '').replace(/\D/g, '') || currentUser.userId || currentUser.id || `${currentUser.name}_${(currentUser.phone || '').replace(/\D/g, '')}`);

  const chatTitle = isAdmin && targetUser ? `${targetUser.name}` : `Messagerie (FILANT°225)`;

  // Effect to handle sending our typing status
  useEffect(() => {
    if (!inputText.trim()) {
      databaseService.setTypingStatus('Privee', chatUserId, isAdmin ? 'admin' : 'user', false);
      return;
    }

    databaseService.setTypingStatus('Privee', chatUserId, isAdmin ? 'admin' : 'user', true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      databaseService.setTypingStatus('Privee', chatUserId, isAdmin ? 'admin' : 'user', false);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, chatUserId, isAdmin]);

  useEffect(() => {
    let unsubscribe: any;
    let unsubscribeTyping: any;
    
    const setupChat = async () => {
      setIsLoading(true);
      const onUpdate = databaseService.onPrivateChatUpdate;

      unsubscribe = onUpdate(chatUserId, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
        
        // Mark messages from the OTHER side as read immediately
        const otherSide = isAdmin ? 'user' : 'admin';
        const hasUnreadFromOther = msgs.some(m => 
          m.sender === otherSide && 
          (isAdmin ? m.adminReadStatus === 'NON LU' : m.isRead === false)
        );

        if (hasUnreadFromOther) {
          databaseService.markPrivateMessagesAsRead(chatUserId, otherSide);
        }
      });

      // Listen to the OTHER side's typing status
      unsubscribeTyping = databaseService.onTypingStatusChange(
        'Privee', 
        chatUserId, 
        isAdmin ? 'user' : 'admin', 
        (status) => setIsTyping(status)
      );
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeTyping) unsubscribeTyping();
      // Ensure we clear our typing status on unmount
      databaseService.setTypingStatus('Privee', chatUserId, isAdmin ? 'admin' : 'user', false);
    };
  }, [chatUserId, isAdmin]);

  const displayMessages = useMemo(() => {
    if (isAdmin) return messages;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return messages.filter(msg => msg.timestamp > twentyFourHoursAgo);
  }, [messages, isAdmin]);

  // FIX FOR OUT-OF-ORDER AND SHUFFLING: Sort messages by timestamp ascending on the client!
  const sortedMessages = useMemo(() => {
    return [...displayMessages].sort((a, b) => a.timestamp - b.timestamp);
  }, [displayMessages]);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      const isInitial = sortedMessages.length <= 1;
      messagesEndRef.current.scrollIntoView({ 
        behavior: isInitial ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  }, [sortedMessages, shouldAutoScroll]);

  const handleSendMessage = async (textOverride?: any, senderOverride?: 'user' | 'admin') => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!textToSend) return;

    const sender = senderOverride || (isAdmin ? 'admin' : 'user');
    const msgId = `${sender === 'admin' ? 'admin' : 'user'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: ChatMessage = {
      id: msgId,
      sender: sender,
      text: textToSend,
      timestamp: Date.now()
    };

    // Optimistic update for immediate display
    setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, newMessage];
    });

    try {
      if (typeof textOverride !== 'string') setInputText('');
      await databaseService.savePrivateChatMessage(chatUserId, newMessage);
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
    if (deleteConfirm.isBulk) {
        if (selectedIds.length === 0) return;
        const success = await databaseService.deleteMultipleTypedChatMessages(type as any, chatUserId, selectedIds);
        if (success) {
            setSelectedIds([]);
            setDeleteConfirm({show: false, messageId: null});
        }
        return;
    }

    if (!deleteConfirm.messageId) return;
    
    const success = await databaseService.deletePrivateChatMessage(chatUserId, deleteConfirm.messageId);
    if (success) {
      setDeleteConfirm({show: false, messageId: null});
    }
  };

  const toggleSelection = (id: string) => {
    if (!isAdmin) return;
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Helper to format date label
  const getMessageDateString = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  return (
    <div 
      id="chat_screen_root"
      className="flex flex-col bg-[#efeae2] dark:bg-[#111b21] animate-in fade-in duration-300 w-full overflow-hidden h-full"
      style={{ height: typeof viewportHeight === 'number' ? `${viewportHeight}px` : '100dvh' }}
    >
      {/* WhatsApp Header: Elegant Green for Light Mode, Dark Slate for Dark Mode */}
      <header id="chat_header" className="bg-[#008069] dark:bg-[#1f2c34] text-white py-3 px-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <button id="btn_back_chat" onClick={onBack} className="p-1.5 -ml-1 rounded-full hover:bg-black/10 active:scale-95 transition-all text-white">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center text-white font-black text-sm relative shadow-inner border border-white/10">
              {chatTitle?.charAt(0).toUpperCase()}
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#008069] dark:border-[#1f2c34] absolute bottom-0 right-0 animate-pulse"></div>
            </div>
            
            <div className="flex flex-col">
              <h2 className="text-sm font-black tracking-tight truncate max-w-[160px] sm:max-w-xs">{chatTitle}</h2>
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">En ligne</span>
            </div>
          </div>
        </div>

        {isAdmin && selectedIds.length > 0 && (
          <button 
            id="btn_delete_bulk"
            onClick={() => setDeleteConfirm({show: true, messageId: null, isBulk: true})}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow"
          >
            <Trash2 size={16} />
            <span className="text-[10px] font-black">{selectedIds.length}</span>
          </button>
        )}
      </header>

      {/* Admin Quick Templates Bar */}
      {isAdmin && (
        <div id="quick_templates_container" className="bg-white dark:bg-[#111b21] border-b border-slate-200/20 dark:border-slate-800 p-2 flex gap-1.5 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          {QUICK_MESSAGES.map((msg) => (
            <button
              id={`quick_msg_${msg.label}`}
              key={msg.label}
              onClick={() => handleSendMessage(msg.text, 'admin')}
              className="flex-shrink-0 px-3.5 py-1.5 bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7] dark:bg-[#112d1c] dark:text-[#a5d6a7] dark:border-[#1b5e20] rounded-full text-[10px] font-black uppercase tracking-wider hover:brightness-95 transition-all active:scale-95 shadow-sm"
            >
              {msg.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages Area */}
      <div 
        id="messages_viewport"
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide overscroll-contain bg-[#efeae2] dark:bg-[#111b21] bg-opacity-95"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chargement des messages...</p>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-[#202c33] rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[200px]">
              {isAdmin 
                ? "Envoyez un message privé à cet utilisateur pour démarrer la conversation."
                : "Bienvenue dans votre espace de discussion privée avec FILANT°225. Posez vos questions ici !"}
            </p>
          </div>
        ) : (
          (() => {
            let lastDateStr = '';
            
            return sortedMessages.map((msg, idx) => {
              const isMe = (isAdmin && msg.sender === 'admin') || (!isAdmin && msg.sender === 'user');
              const messageId = msg.id || `msg_${idx}`;
              const isSelected = selectedIds.includes(messageId);
              
              const messageText = msg.text || msg.message || msg.whatsappMessage || "";
              const content: React.ReactNode = <Linkify text={messageText} />;
              
              // Date separator check
              const currentDateStr = getMessageDateString(msg.timestamp);
              const showDateDivider = currentDateStr !== lastDateStr;
              lastDateStr = currentDateStr;

              // Read ticks calculation
              const isReadByOther = isAdmin ? (msg.isRead === true) : (msg.adminReadStatus === 'VU');

              return (
                <div key={messageId} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex justify-center my-4 animate-in fade-in">
                      <div className="bg-[#ffffffb3] dark:bg-[#202c33eb] backdrop-blur text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200/40 dark:border-none px-4 py-1.5 rounded-full uppercase tracking-wider text-center select-none">
                        {currentDateStr}
                      </div>
                    </div>
                  )}

                  <div 
                    onClick={() => isAdmin && toggleSelection(messageId)}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 group ${isAdmin ? 'cursor-pointer' : ''}`}
                  >
                    <div 
                      id={`chat_bubble_${messageId}`}
                      className={`max-w-[85%] rounded-3xl px-4 py-2.5 shadow relative select-text touch-auto overflow-hidden transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 scale-[0.98]' : ''
                      } ${
                        isMe 
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none' 
                          : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none border border-slate-100 dark:border-0'
                      }`}
                    >
                      <div className="text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
                        {content}
                      </div>
                      
                      {!isAdmin && msg.sender === 'admin' && (msg.paymentInfo || msg.whatsAppPayload) && (
                        <div className="mt-4 pt-3.5 border-t border-[#00000010] dark:border-[#ffffff10] flex flex-col gap-2.5">
                          {msg.paymentInfo && (
                            <button 
                              id={`pay_btn_${messageId}`}
                              onClick={() => handleOpenPaymentView(msg.paymentInfo!, msg.text)}
                              className="w-full bg-[#00a884] hover:bg-[#008f72] text-white font-black py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                              <CreditCard className="w-4 h-4 text-white" />
                              <span className="uppercase tracking-wider text-[10px]">
                                {msg.paymentInfo.amount === 'custom' ? 'Payer (Wave)' : `Payer – ${msg.paymentInfo.amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} F`}
                              </span>
                            </button>
                          )}

                          {msg.whatsAppPayload && (
                            <button 
                              id={`wa_btn_${messageId}`}
                              onClick={() => handleWhatsAppRedirect(msg.whatsAppPayload!)} 
                              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                              <WhatsAppIcon />
                              <span className="uppercase tracking-wider text-[10px]">WhatsApp (Conseiller)</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end mt-1.5 gap-2 select-none">
                        <span className={`text-[9px] font-semibold opacity-60 ${isMe ? 'text-[#111b21]' : 'text-slate-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {!isAdmin && msg.sender === 'admin' && (
                          <SpeakerIcon text={msg.text} className="p-0.5 opacity-60" />
                        )}

                        {isMe && (
                          <div className="flex items-center">
                            {isReadByOther ? (
                              <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />
                            ) : (
                              <Check size={14} className="text-slate-400 ml-0.5" />
                            )}
                          </div>
                        )}

                        {isAdmin && (
                          <button 
                            id={`btn_delete_msg_${messageId}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({show: true, messageId: messageId});
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10 ${isMe ? 'text-[#111b21]/60' : 'text-slate-400'}`}
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm flex gap-1 items-center border border-slate-100 dark:border-0">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Style Curved Footer Input Bar */}
      <div id="chat_footer" className="p-3 bg-[#f0f2f5] dark:bg-[#1f2c34] flex items-end gap-2.5 shrink-0 shadow-inner">
        <div className="flex-1 flex items-center min-h-[44px] bg-white dark:bg-[#2a3942] rounded-3xl px-4 py-2 border border-transparent shadow shadow-neutral-100">
          <textarea
            id="chat_input_textarea"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none max-h-24 overflow-y-auto scrollbar-hide focus:outline-none"
            style={{ height: 'auto' }}
          />
        </div>
        
        <button
          id="btn_send_message"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 active:scale-90 ${
            inputText.trim() 
              ? 'bg-[#00a884] text-white hover:brightness-95 hover:shadow-lg' 
              : 'bg-slate-300 dark:bg-slate-750 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Confirmation of suppression Modal */}
      {deleteConfirm.show && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#2a3942] rounded-[2rem] p-8 w-full max-w-xs shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-[#ffffff10]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
              {deleteConfirm.isBulk ? `Supprimer ${selectedIds.length} messages` : 'Supprimer le message'}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {deleteConfirm.isBulk 
                ? "Voulez-vous supprimer ces messages ? Cette action est irréversible." 
                : "Voulez-vous supprimer ce message ? Cette action est irréversible."}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                id="btn_confirm_delete_yes"
                onClick={handleDeleteMessage}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-md active:scale-95 transition-all text-center"
              >
                Oui, supprimer
              </button>
              <button 
                id="btn_confirm_delete_no"
                onClick={() => setDeleteConfirm({show: false, messageId: null, isBulk: false})}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-wider text-[10px] active:scale-95 transition-all text-center"
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
