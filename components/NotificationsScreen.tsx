
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { databaseService } from '../services/databaseService';
import { Linkify } from '../utils/textUtils';

const BackIcon = ({ className = "h-6 w-6" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface NotificationsScreenProps {
  onBack: () => void;
  user: User;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = databaseService.onNotificationsUpdate(user.phone, (list) => {
      setNotifications(list);
      setLoading(false);
      
      // Mark all as read when viewing
      list.forEach(n => {
        if (!n.isRead) {
          databaseService.markNotificationAsReadInFirestore(user.phone, n.id);
        }
      });
    });

    return () => unsubscribe();
  }, [user.phone]);

  const handleClear = async () => {
    if (window.confirm("Voulez-vous supprimer toutes vos notifications ?")) {
        setLoading(true);
        await databaseService.clearAllNotificationsFromFirestore(user.phone);
        setNotifications([]);
        setLoading(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    await databaseService.deleteNotificationFromFirestore(user.phone, id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-in fade-in duration-500">
      <header className="p-4 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0 border border-gray-200 dark:border-slate-600">
            <BackIcon className="h-6 w-6 text-gray-800 dark:text-white" />
        </button>
        <h1 className="text-base font-black uppercase tracking-widest text-slate-900">Notifications</h1>
        {notifications.length > 0 ? (
            <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <TrashIcon />
            </button>
        ) : <div className="w-10"></div>}
      </header>

      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <BellIcon />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-400 mb-2">Aucun message</h3>
            <p className="text-xs font-bold max-w-[200px] leading-relaxed uppercase tracking-tighter">
                Vous n'avez pas encore reçu de notifications de la part de FILANT°225.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
             {notifications.map(n => (
                 <div key={n.id} className={`bg-white p-5 rounded-3xl shadow-sm border ${n.isRead ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'} animate-in slide-in-from-bottom-2 relative group`}>
                    <button 
                       onClick={() => handleDeleteOne(n.id)}
                       className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                       title="Supprimer"
                    >
                       <TrashIcon />
                    </button>
                    <div className="flex justify-between items-start mb-2 pr-8">
                        <div className="flex items-center gap-2">
                          {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">{n.title}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(n.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed font-medium break-words whitespace-pre-wrap">
                      <Linkify text={n.message} />
                    </div>
                 </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsScreen;
