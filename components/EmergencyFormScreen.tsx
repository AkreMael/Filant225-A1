
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const EmergencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

interface EmergencyFormScreenProps {
  onBack: () => void;
  user: User;
}

const options = [
  "Annuler un contrat",
  "Problème paiement WAVE",
  "Trouver un travailleur rapidement",
  "Louer un équipement",
  "Trouver une agence immobilière",
  "Problème avec l’application",
  "Autre"
];

const EmergencyFormScreen: React.FC<EmergencyFormScreenProps> = ({ onBack, user }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !email || (selectedOption === 'Autre' && !otherDetails)) {
        console.warn("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    setIsSending(true);
    
    const finalReason = selectedOption === 'Autre' ? `Autre: ${otherDetails}` : selectedOption;
    
    const emailBody = `URGENCE FILANT°225\n\n` +
                      `Motif: ${finalReason}\n` +
                      `Email de contact: ${email}\n\n` +
                      `--- INFORMATIONS CLIENT ---\n` +
                      `Nom: ${user.name}\n` +
                      `Téléphone: ${user.phone}\n` +
                      `Ville de résidence: ${user.city}\n\n` +
                      `Envoyé via l'application FILANT°225`;

    const subject = `URGENCE FILANT225 - ${finalReason}`;
    const mailtoLink = `mailto:filantmael225@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.href = mailtoLink;
    
    setIsSending(false);
    onBack();
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
          className="relative h-[180px] w-full flex-shrink-0"
        >
            <img src="https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=1000" alt="emergency" className="w-full h-full object-cover grayscale-[0.3]" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-red-900/40"></div>
            <button onClick={onBack} className="absolute top-4 left-4 p-2.5 bg-white/30 backdrop-blur-md rounded-full text-white shadow-lg active:scale-95 z-20 border border-white/40">
                <BackIcon />
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
                <h2 className="text-xl font-black text-red-600 uppercase tracking-tight text-center">Urgence</h2>
                <div className="h-1 w-20 bg-red-500 mt-1 rounded-full"></div>
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <EmergencyIcon />
                </div>
                <p className="text-center text-sm font-bold text-gray-600 uppercase tracking-tight">
                    VEUILLEZ SIGNALER VOTRE PROBLÈME.<br/>
                    UN E-MAIL SERA GÉNÉRÉ POUR NOTRE ÉQUIPE D'URGENCE.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 pb-12">
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sélectionnez le motif *</label>
                <div className="grid grid-cols-1 gap-2">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedOption(opt)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                selectedOption === opt 
                                ? 'bg-red-50 border-red-500 text-red-700 shadow-md' 
                                : 'bg-gray-50 border-gray-100 text-gray-700'
                            }`}
                        >
                            <span className="text-sm font-bold">{opt}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOption === opt ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                                {selectedOption === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {selectedOption === 'Autre' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Précisez votre demande *</label>
                    <textarea
                        required
                        value={otherDetails}
                        onChange={(e) => setOtherDetails(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm text-gray-800 focus:border-red-500 outline-none transition-all h-32"
                        placeholder="Détails de l'urgence..."
                    />
                </div>
            )}

            <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Votre Email (Obligatoire) *</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm text-gray-800 focus:border-red-500 outline-none transition-all"
                    placeholder="exemple@gmail.com"
                />
            </div>

            <button
                type="submit"
                disabled={isSending}
                className="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl transform active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {isSending ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    "Envoyer Urgence"
                )}
            </button>
        </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmergencyFormScreen;
