
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService, SavedContact } from '../services/databaseService';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

interface AssistantQRScreenProps {
  onBack: () => void;
  user: User;
  onShowPopup: (msg: string, type: 'alert' | 'confirm', onConfirm?: (close: () => void) => void) => void;
}

const AssistantQRScreen: React.FC<AssistantQRScreenProps> = ({ onBack, user, onShowPopup }) => {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const COMPANY_PHONE = "2250705052632";

  useEffect(() => {
    setContacts(databaseService.getContacts(user.phone));
  }, [user.phone]);

  const handleDelete = (id: string) => {
    onShowPopup("Supprimer ce contact de l'Assistance QR ?", 'confirm', (close) => {
        const updated = contacts.filter(c => c.id !== id);
        setContacts(updated);
        databaseService.saveContacts(user.phone, updated, user);
        close(); // Ferme automatiquement la fenêtre
    });
  };

  const handleClearAll = () => {
    onShowPopup("Voulez-vous vider toute votre liste d'Assistance QR ?", 'confirm', (close) => {
      databaseService.saveContacts(user.phone, [], user);
      setContacts([]);
      close(); // Ferme automatiquement la fenêtre
    });
  };

  const generateWhatsAppUrl = (contact: SavedContact) => {
      const text = `*Contact Assistance QR - FILANT°225*\n\n` +
                   `*Service:* ${contact.title}\n` +
                   `*Nom:* ${contact.name}\n` +
                   `*Ville:* ${contact.city || 'Non spécifiée'}\n` +
                   `*Numéro:* +225 ${contact.phone}\n\n` +
                   `Bonjour FILANT°225, voici les informations pour ma demande.`;
      return `https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(text)}`;
  };

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F3F3] animate-in slide-in-from-right duration-300">
      <header className="p-4 flex items-center bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0 border border-gray-200 dark:border-slate-600">
          <BackIcon className="h-6 w-6 text-gray-800 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center font-black uppercase text-base tracking-tight mr-10 text-gray-900">ASSISTANCE QR</h1>
        {contacts.length > 0 && (
          <button onClick={handleClearAll} className="p-2 text-red-500 active:scale-90 transition-transform">
            <TrashIcon />
          </button>
        )}
      </header>

      <div className="p-4 bg-white shadow-sm border-b border-gray-100">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Rechercher un contact scanné..." 
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 font-bold"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest leading-tight text-gray-500">Aucun contact trouvé dans l'Assistance QR</p>
          </div>
        ) : (
          filtered.map(contact => (
            <div key={contact.id} className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-100 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full w-fit mb-1 shadow-sm tracking-tight">
                    {contact.title}
                  </span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[180px]">{contact.name}</h4>
                </div>
                <div className="bg-blue-50 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-blue-100 shadow-sm">
                  <MapPinIcon />
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-tighter truncate max-w-[80px]">
                    {contact.city || 'Abidjan'}
                  </span>
                </div>
              </div>

              {contact.review && contact.review !== (contact.city || 'Abidjan') && (
                <p className="text-xs text-gray-500 italic leading-snug border-l-2 border-orange-100 pl-3">
                  {contact.review}
                </p>
              )}

              <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact WhatsApp</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-green-600 font-black text-sm tracking-tight">+225 {contact.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => handleDelete(contact.id)} className="p-2.5 bg-red-50 text-red-500 rounded-full active:scale-90 transition-transform shadow-sm">
                    <TrashIcon />
                  </button>
                  <a href={`tel:${COMPANY_PHONE}`} className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </a>
                  <a href={generateWhatsAppUrl(contact)} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#25D366] text-white rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" /></svg>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default AssistantQRScreen;
