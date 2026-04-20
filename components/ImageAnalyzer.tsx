import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Offer } from '../types';

const OfferScreen: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const fetchedOffers = await databaseService.getOffers();
        setOffers(fetchedOffers);
        setError(null);
      } catch (err) {
        setError('Impossible de charger les offres.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50 dark:bg-indigo-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500 bg-gray-50 dark:bg-indigo-900 h-full">{error}</div>;
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 dark:bg-indigo-900 flex-1">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">Nos Offres</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105">
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{offer.title}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{offer.description}</p>
              <button className="mt-4 w-full py-2 px-4 rounded-lg text-white font-semibold bg-green-500 hover:bg-green-600 transition-colors">
                En savoir plus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfferScreen;