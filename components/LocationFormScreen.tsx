
import React, { useState } from 'react';
import SpeakerIcon from './common/SpeakerIcon';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

const cities = [
  'Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 
  'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou'
];

interface LocationFormScreenProps {
  itemTitle: string;
  onBack: () => void;
}

const LocationFormScreen: React.FC<LocationFormScreenProps> = ({ itemTitle, onBack }) => {

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: cities[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.city) {
      console.warn('Veuillez remplir tous les champs.');
      return;
    }
    // In a real application, you would handle form submission logic here.
    console.log(`Votre demande pour "${itemTitle}" a été soumise avec succès ! (Ceci est une simulation)`);
    onBack(); // Go back to the list after submission
  };

  return (
    <div className="p-4 bg-white dark:bg-indigo-900 flex-1 animate-unfold-in">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Retour">
          <BackIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-4">
          Demande de location
        </h1>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-lg">
        <div>
          <label htmlFor="item" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Objet de la location
            <SpeakerIcon text="Quel est l'objet de la location ?" className="text-white" />
          </label>
          <input type="text" id="item" name="item" value={`${itemTitle} à louer`} className="w-full p-3 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg cursor-not-allowed" disabled />
        </div>
      
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Votre Nom
            <SpeakerIcon text="Quel est votre nom ?" className="text-white" />
          </label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-orange-500 focus:border-orange-500" placeholder="Ex: Jean Dupont" required />
        </div>

        <div>
          <label htmlFor="phone" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Numéro de téléphone
            <SpeakerIcon text="Quel est votre numéro de téléphone ?" className="text-white" />
          </label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-orange-500 focus:border-orange-500" placeholder="Ex: 0701020304" required />
        </div>
        
        <div>
          <label htmlFor="city" className="block mb-2 text-sm font-medium text-white flex items-center gap-2">
            Ville recherchée
            <SpeakerIcon text="Quelle est la ville recherchée ?" className="text-white" />
          </label>
          <select id="city" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-orange-500 focus:border-orange-500">
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        
        <div>
          <button type="submit" className="w-full py-3 px-4 rounded-xl shadow-lg flex items-center justify-center text-white font-semibold transition-colors bg-green-600 hover:bg-green-700 animate-custom-green-pulse focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-blue-500">
            Envoyer la demande
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationFormScreen;