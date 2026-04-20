
import React from 'react';
import { Tab } from '../types';

interface IconProps {
  className?: string;
}

// Icons
const ProfileIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const SiteIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 00-18 9 9 0 0 0 0 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5M12 2.25a15.75 15.75 0 0 1 0 19.5 15.75 15.75 0 0 1 0-19.5z" /></svg>;
const PaymentIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0118 0z" /></svg>;
const IdCardIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m0 0l-3-3m3 3V15m-2.25-10.5a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
</svg>;
const ScannerIcon: React.FC<IconProps> = ({ className }) => <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H11V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M45 12H53V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 52H11V44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M45 52H53V44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 32H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChatBubbleIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tool: Tab) => void;
  onToggleProfile: () => void;
  isProfileOpen: boolean;
  userRole?: string;
  userPhone?: string;
  isMiseEnRelationActive?: boolean;
  unreadChatCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onToggleProfile, isProfileOpen, userRole, userPhone, isMiseEnRelationActive, unreadChatCount }) => {
  // Définition statique des onglets pour le Client uniquement
  const navItems = [
    { id: Tab.Profile, icon: <ProfileIcon />, label: "Profil" },
    { id: Tab.Menu, icon: <MenuIcon />, label: "Menu" },
    { id: Tab.Offer, icon: <SiteIcon />, label: "Site" },
    { id: Tab.UserChat, icon: <ChatBubbleIcon />, label: "Chat" },
    { id: Tab.Payment, icon: <PaymentIcon />, label: "Paiement" },
  ];

  return (
    <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-2">
      <nav className="bg-[#0f172a]/90 backdrop-blur-md pointer-events-auto rounded-[2.5rem] py-3 px-4 flex items-center justify-center gap-3 sm:gap-5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-white/10 w-fit">
        {navItems.map((item, idx) => {
          const isActive = item.id === Tab.Profile ? isProfileOpen : activeTab === item.id;
          const isRestricted = (item as any).isRestricted;
          const isBlue = (item as any).isBlue;
          const hasUnread = item.id === Tab.UserChat && (unreadChatCount || 0) > 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === Tab.Profile) onToggleProfile();
                else setActiveTab(item.id);
              }}
              className={`group relative flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
            >
              <div 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg mb-1 relative overflow-hidden ${
                  isRestricted
                    ? 'bg-gray-700 grayscale'
                    : hasUnread
                      ? 'animate-blink-red-green'
                      : isActive 
                        ? isBlue ? 'bg-blue-600 ring-4 ring-blue-600/30' : 'bg-[#008000] ring-4 ring-[#008000]/30 animate-pulse-green' 
                        : isBlue ? 'bg-blue-500 opacity-90' : 'bg-[#FF4500] opacity-80 animate-float-subtle'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {React.cloneElement(item.icon as React.ReactElement, { 
                  className: `h-6 w-6 sm:h-7 sm:w-7 transition-colors text-white` 
                })}
                
                {/* Badge pour les messages non lus */}
                {item.id === Tab.UserChat && (unreadChatCount || 0) > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center px-1 bg-red-600 shadow-xl z-20">
                    <span className="text-[9px] font-black text-white leading-none">{unreadChatCount}</span>
                  </div>
                )}

                {/* Croix si restreint */}
                {isRestricted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-red-500 rotate-45 absolute"></div>
                    <div className="w-full h-0.5 bg-red-500 -rotate-45 absolute"></div>
                  </div>
                )}
              </div>
              
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${isActive ? 'text-white' : 'text-white/60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <style>{`
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-float-subtle {
          animation: float-subtle 3s ease-in-out infinite;
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(0, 128, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(0, 128, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 128, 0, 0); }
        }
        .animate-pulse-green {
          animation: pulse-green 2s infinite;
        }
        @keyframes blink-red-green {
            0%, 100% { background-color: #ef4444; }
            50% { background-color: #22c55e; }
        }
        .animate-blink-red-green {
            animation: blink-red-green 0.15s infinite;
        }
      `}</style>
    </div>
  );
};

export default BottomNav;
