
import React, { useState } from 'react';
import SpeakerIcon from './common/SpeakerIcon';
import { databaseService } from '../services/databaseService';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

interface WorkerDetailScreenProps {
  workerName: string;
  onBack: () => void;
}

const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({ workerName, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      workerName,
      name: formData.get('name'),
      city: formData.get('city'),
      phone: formData.get('phone'),
      budget: formData.get('budget'),
      serviceDate: formData.get('service-date'),
      startTime: formData.get('start-time'),
      endTime: formData.get('end-time'),
      message: formData.get('message'),
    };

    try {
      await databaseService.savePlacement(data);
      console.log('Votre demande a été soumise avec succès !');
      onBack();
    } catch (error) {
      console.error("Error submitting placement request", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-indigo-900 flex-1 animate-unfold-in">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Retour">
          <BackIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-4">
          Demande de service: {workerName}
        </h1>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-orange-400 to-orange-500 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-lg">
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Nom et Prénom
            <SpeakerIcon text="Entrez votre nom et prénom" className="text-white" />
          </label>
          <input type="text" id="name" name="name" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Jean Dupont" required />
        </div>

        <div>
          <label htmlFor="city" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Ville
            <SpeakerIcon text="Quelle est votre ville ?" className="text-white" />
          </label>
          <input type="text" id="city" name="city" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Abidjan" required />
        </div>
        
        <div>
          <label htmlFor="phone" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Numéro de téléphone
            <SpeakerIcon text="Quel est votre numéro de téléphone ?" className="text-white" />
          </label>
          <input type="tel" id="phone" name="phone" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 0701020304" required />
        </div>

        <div>
          <label htmlFor="budget" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Budget Estimé (FCFA)
            <SpeakerIcon text="Quel est votre budget estimé ?" className="text-white" />
          </label>
          <input type="number" id="budget" name="budget" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 50000" required />
        </div>
        
        <div>
          <label htmlFor="service-date" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Date du service
            <SpeakerIcon text="Quelle est la date du service ?" className="text-white" />
          </label>
          <input type="date" id="service-date" name="service-date" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
                Heure de début
                <SpeakerIcon text="Quelle est l'heure de début ?" className="text-white" />
              </label>
              <input type="time" id="start-time" name="start-time" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label htmlFor="end-time" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
                Heure de fin
                <SpeakerIcon text="Quelle est l'heure de fin ?" className="text-white" />
              </label>
              <input type="time" id="end-time" name="end-time" className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
            </div>
        </div>

        <div>
          <label htmlFor="message" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Message (facultatif)
            <SpeakerIcon text="Avez-vous un message supplémentaire ?" className="text-white" />
          </label>
          <textarea id="message" name="message" rows={4} className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ajoutez des détails supplémentaires ici..."></textarea>
        </div>
        
        <div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 rounded-xl shadow-lg flex items-center justify-center text-white font-semibold transition-colors bg-green-600 hover:bg-green-700 animate-custom-green-pulse focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-orange-400 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkerDetailScreen;