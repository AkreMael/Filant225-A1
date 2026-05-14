
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import EmbeddedForm from './EmbeddedForm';

// --- ICONS ---
const BackIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MicIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const IvoryCoastFlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className="w-6 h-4 rounded-sm" aria-label="Drapeau Côte d'Ivoire">
        <rect width="10" height="20" x="0" fill="#FF8200" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="20" fill="#009B77" />
    </svg>
);

// Mockup Icons
const PersonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const FlashlightIcon = () => <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L7.5 3H16.5L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6H10V10L7.5 21H16.5L14 10V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.603 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const StarRating = ({ rating }: { rating: number }) => {
    const filledStars = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < filledStars} />
            ))}
            <span className="ml-1 text-[10px] text-gray-400 font-bold">{rating.toFixed(1)}</span>
        </div>
    );
};

const OrangeAvatar: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
    <div className="w-24 h-24 rounded-3xl bg-orange-500 border-2 border-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
        {icon}
    </div>
);

// --- EQUIPMENT & REAL ESTATE IMAGES MAPPING ---
const EQUIPMENT_IMAGES: Record<string, string | string[]> = {
    'Studio à louer': "https://i.supaimg.com/5d6f5d3f-6e64-4291-8ce3-28cebdb6bcec.jpg",
    'Terrain à louer ou à vendre': "https://i.supaimg.com/7c08d763-ce1e-44a5-b093-430cdb072ad2.jpg",
    'Chambre-salon à louer': "https://i.supaimg.com/db2acfbe-b3ca-4b65-9b21-ddb0c7fcb3af.jpg",
    'Villa à louer': [
        "https://i.supaimg.com/7dd280ea-2d80-472d-9997-d6c5b3d3c53c.jpg",
        "https://i.supaimg.com/022ee871-a47c-4a67-94c6-1226de611aa7.jpg"
    ],
    'Petit local à louer': "https://i.supaimg.com/a0a75e1c-8b38-485a-8231-0a213cf10858.jpg",
    'Magasin à louer': "https://i.supaimg.com/dfdc8569-179f-4dc2-aeb9-e0757dfbc5cf.jpg",
    'Table d’événement à louer': "https://i.supaimg.com/6a3225ae-bdd4-40ea-95aa-51511076ec44.jpg",
    'Chaise d’événement à louer': "https://i.supaimg.com/90d4d927-ad54-471b-9238-d57d11233758.jpg",
    'Bâche à louer': "https://i.supaimg.com/bcf4c081-b3ae-4759-83b5-4c79f52989ec.jpg",
    'Équipement mariage à louer': [
        "https://i.supaimg.com/5bbb535f-94c7-4c8a-bf51-7953e69e516e.jpg",
        "https://i.supaimg.com/ea6ed055-cb21-4552-a7c2-ecdf4b3bb2e5.jpg",
        "https://i.supaimg.com/1e14cb24-742a-49d7-8deb-a47c5d316d74.jpg"
    ],
    'Groupe électrogène à louer': [
        "https://i.supaimg.com/2944eab0-2074-4e61-a759-dca478289e4b.jpg",
        "https://i.supaimg.com/5d3807d2-a7db-4b5f-bdcb-26c5b9a8baed.jpg"
    ],
    'Jeux de lumière à louer': "https://i.supaimg.com/acf51f49-b736-4a0c-b377-401e8d3a11b9.jpg",
    'Podium à louer': "https://i.supaimg.com/f5df32b5-34d1-4c8c-ac65-c1f7c7b2fb3b.jpg",
    'Sonorisation à louer': "https://i.supaimg.com/03ee9f0b-9978-48aa-a0c1-a4ee2b0efb74.jpg",
    'Camion de campagne à louer': "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg",
    'Écran géant à louer': "https://i.supaimg.com/cdec5321-e464-4e04-b04e-7b03b2b59500.jpg",
    'Service décoration': [
        "https://i.supaimg.com/427849ce-4fb1-4fd9-91e4-e83a19e86d04.jpg",
        "https://i.supaimg.com/ea544560-1696-462f-bda5-cad9083d89ef.jpg"
    ],
    'Espace d’événement à louer': [
        "https://i.supaimg.com/71f3dfb5-2262-408e-94f5-06700fb94a57.jpg",
        "https://i.supaimg.com/26640f33-a936-4a3c-a910-19ffb1cc8e82.jpg"
    ],
    'Poubelle mobile à louer': "https://i.supaimg.com/5d50ad37-c869-47dd-ab0a-7439425189ca.jpg",
    'Mégaphone à louer': "https://i.supaimg.com/9bbdf54f-ff0f-4290-ad44-4b65e6615b87.jpg",
    'Échelle pliante (petite) à louer': "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg",
    'Corde / rallonge corde à louer': "https://i.supaimg.com/b52890f2-773e-4dbf-9fbb-384abb717ddc.jpg",
    'Nappe de table à louer': "https://i.supaimg.com/8b8a3693-887c-46ca-8407-3385f5797391.jpg",
    'Tapis à louer': "https://i.supaimg.com/327c6247-8170-45a3-87a9-0188227b6160.jpg",
    'Distributeur d’eau à louer': "https://i.supaimg.com/2a8fce06-7284-40d6-9721-42bfa3ece75b.jpg",
    'Plateau de service': "https://i.supaimg.com/4fde8630-fb44-45a2-9579-d21df1774416.jpg",
    'Microphone événement à louer': "https://i.supaimg.com/58dab9a6-0116-44ac-9087-40599ee37a3d.jpg",
    'Haut-parleur / baffle Bluetooth à louer': "https://i.supaimg.com/a6f9700d-7f3f-45ee-b5e8-490beea8bfb9.jpg",
    'Projecteur LED portable à louer': "https://i.supaimg.com/8930c037-58e6-4114-8407-a23ac25b94cb.jpg",
    'Lampe éclairage forte à louer': "https://i.supaimg.com/97ce3a8d-4768-4a67-9939-98fdd67ece99.jpg",
    'Glacière à louer': "https://i.supaimg.com/a2bf7832-311c-40ee-a8ac-c045311105d5.jpg",
    'Tente pliante (petite) à louer': "https://i.supaimg.com/85a7fcdf-42cb-4725-821c-1e209ebabfbc.jpg",
    'Parasol à louer': "https://i.supaimg.com/566f8800-9907-4a76-b623-eb55af66be2e.jpg",
    'Banc à louer': "https://i.supaimg.com/d0e3fa50-b9ce-4812-9ff6-c60ad02adebc.jpg",
    'Chaise pliante à louer': "https://i.supaimg.com/d3aa47ce-cd82-415e-b3f6-83fef44587d2.jpg",
    'Table en bois à louer': "https://i.supaimg.com/b30c95a6-c5c1-421c-9977-0867018a1aa2.jpg",
    'Bâche (petite / moyenne) à louer': "https://i.supaimg.com/774b9edd-9be5-4396-90bc-6211999e7acc.jpg",
    'Matelas une place à louer': "https://i.supaimg.com/8faa86d6-3417-4b28-be02-5f67b136341c.jpg",
};

// --- DATA ---
interface LocationItem {
    id: string;
    title: string;
    description: string;
    rating: number;
    category: 'appartement' | 'equipement';
    proposeUrl: string;
}

const locationData: LocationItem[] = [
    { id: '1', title: 'Studio à louer', description: 'Studios modernes et confortables disponibles dans plusieurs communes.', rating: 4.5, category: 'appartement', proposeUrl: 'https://tally.so/r/A7zJZ0' },
    { id: '2', title: 'Villa à louer', description: 'Villas spacieuses avec jardin et garage, idéales pour les familles.', rating: 4.8, category: 'appartement', proposeUrl: 'https://tally.so/r/1AXK8Q' },
    { id: '3', title: 'Chambre-salon à louer', description: 'Appartements 2 pièces (chambre + salon) bien situés et abordables.', rating: 4.2, category: 'appartement', proposeUrl: 'https://tally.so/r/Y5PON5' },
    { id: '4', title: 'Petit local à louer', description: 'Locaux commerciaux pour boutiques ou bureaux de petite taille.', rating: 4.0, category: 'appartement', proposeUrl: 'https://tally.so/r/PdpEV5' },
    { id: '5', title: 'Terrain à louer ou à vendre', description: 'Vente et location de terrains sécurisés. Trouvez le terrain idéal pour vos projets de construction.', rating: 4.7, category: 'appartement', proposeUrl: 'https://tally.so/r/nPY5eQ' },
    { id: '6', title: 'Magasin à louer', description: 'Espaces commerciaux stratégiquement situés pour votre activité.', rating: 4.3, category: 'appartement', proposeUrl: 'https://tally.so/r/44QkeO' },
    { id: '7', title: 'Table d’événement à louer', description: 'Tables rondes et rectangulaires pour tous vos événements.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/5Bb2KM' },
    { id: '8', title: 'Chaise d’événement à louer', description: 'Chaises VIP, chaises plastiques et housses disponibles.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/rj5EyM' },
    { id: '9', title: 'Bâche à louer', description: 'Bâches de toutes tailles pour mariages, funérailles et fêtes.', rating: 4.4, category: 'equipement', proposeUrl: 'https://tally.so/r/WO20OJ' },
    { id: '10', title: 'Écran géant à louer', description: 'Écrans LED et projecteurs pour une diffusion haute qualité.', rating: 4.9, category: 'equipement', proposeUrl: 'https://tally.so/r/KYz0YM' },
    { id: '11', title: 'Podium à louer', description: 'Scènes et podiums modulables pour concerts et discours.', rating: 4.7, category: 'equipement', proposeUrl: 'https://tally.so/r/dWEPWz' },
    { id: '12', title: 'Équipement mariage à louer', description: 'Décoration, arches et accessoires complets pour mariages.', rating: 4.8, category: 'equipement', proposeUrl: 'https://tally.so/r/ODa0DK' },
    { id: '13', title: 'Groupe électrogène à louer', description: 'Groupes électrogènes puissants pour garantir l’électricité.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/44Qj4b' },
    { id: '14', title: 'Jeux de lumière à louer', description: 'Éclairage professionnel pour spectacles et soirées.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/rj5ED5' },
    { id: '15', title: 'Sonorisation à louer', description: 'Matériel son complet pour une ambiance parfaite.', rating: 4.7, category: 'equipement', proposeUrl: 'https://tally.so/r/Npr0qW' },
    { id: '17', title: 'Camion de campagne à louer', description: 'Camion podium sonorisé pour vos campagnes et caravanes.', rating: 4.8, category: 'equipement', proposeUrl: 'https://tally.so/r/2EXrXA' },
    { id: '18', title: 'Espace d’événement à louer', description: 'Salles et espaces en plein air pour cérémonies et fêtes.', rating: 4.7, category: 'equipement', proposeUrl: 'https://tally.so/r/A7z8zW' },
    { id: '19', title: 'Service décoration', description: 'Décoration complète pour mariages, anniversaires et événements.', rating: 4.9, category: 'equipement', proposeUrl: 'https://tally.so/r/LZ909O' },
    { id: '20', title: 'Poubelle mobile à louer', description: 'Solution mobile pour la gestion des déchets événementiels.', rating: 4.3, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '21', title: 'Mégaphone à louer', description: 'Mégaphone puissant pour guider vos foules et événements.', rating: 4.4, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '22', title: 'Échelle pliante (petite) à louer', description: 'Échelle maniable pour travaux légers en hauteur.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '23', title: 'Corde / rallonge corde à louer', description: 'Cordage robuste pour fixations et délimitations.', rating: 4.2, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '24', title: 'Nappe de table à louer', description: 'Linge de table qualitatif pour réceptions et banquets.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '25', title: 'Tapis à louer', description: 'Tapis de réception pour allées d’honneur ou salons.', rating: 4.7, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '26', title: 'Distributeur d’eau à louer', description: 'Fontaine à eau filtrée pour vos événements.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '27', title: 'Plateau de service', description: 'Plateaux robustes pour service traiteur professionnel.', rating: 4.4, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '28', title: 'Microphone événement à louer', description: 'Système microphone sans fil ou filaire haute qualité.', rating: 4.8, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '29', title: 'Haut-parleur / baffle Bluetooth à louer', description: 'Enceinte autonome bluetooth puissante.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '30', title: 'Projecteur LED portable à louer', description: 'Projecteur de chantier ou d’extérieur portable.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '31', title: 'Lampe éclairage forte à louer', description: 'Spot haute puissance pour éclairage de zone.', rating: 4.4, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '32', title: 'Glacière à louer', description: 'Glacière isotherme pour conservation au frais.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '33', title: 'Tente pliante (petite) à louer', description: 'Barnum pliant facile à monter pour abri rapide.', rating: 4.7, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '34', title: 'Parasol à louer', description: 'Parasol de jardin ou de terrasse avec pied.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '35', title: 'Banc à louer', description: 'Assise collective en bois ou PVC.', rating: 4.3, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '36', title: 'Chaise pliante à louer', description: 'Chaise pratique, légère et pliable.', rating: 4.4, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '37', title: 'Table en bois à louer', description: 'Table robuste en bois pour repas de groupe.', rating: 4.5, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '38', title: 'Bâche (petite / moyenne) à louer', description: 'Bâche de protection ou de couverture standard.', rating: 4.2, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
    { id: '39', title: 'Matelas une place à louer', description: 'Matelas individuel confortable pour couchage d’appoint.', rating: 4.6, category: 'equipement', proposeUrl: 'https://tally.so/r/wQZVJY' },
];

interface LocationCardProps {
  item: LocationItem;
  user: User;
  onPropose: (url: string) => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ item, user, onPropose, onOpenForm }) => {
  const equipmentImgData = EQUIPMENT_IMAGES[item.title];
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
      if (Array.isArray(equipmentImgData) && equipmentImgData.length > 1) {
          const interval = setInterval(() => {
              setCurrentImgIndex(prev => (prev + 1) % equipmentImgData.length);
          }, 3000);
          return () => clearInterval(interval);
      }
  }, [equipmentImgData]);

  const handleDemandeClick = () => {
    const src = Array.isArray(equipmentImgData) ? equipmentImgData[currentImgIndex] : (equipmentImgData || "");
    onOpenForm({
      formType: 'location',
      title: item.title,
      imageUrl: typeof src === 'string' ? src : src[0],
      description: item.description
    });
  };

  const renderVisual = () => {
      return <OrangeAvatar icon={item.category === 'appartement' ? <BuildingIcon /> : <FlashlightIcon />} />;
  };

  return (
    <div className={`bg-white rounded-[2.5rem] p-5 flex flex-col transition-all relative overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-orange-500 shadow-xl`}>
      <div className="flex gap-4">
        {renderVisual()}
        <div className="flex-1 flex flex-col justify-start">
            <h3 className="font-black text-black text-lg leading-none mb-2 uppercase tracking-tighter">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
                <StarRating rating={item.rating} />
            </div>
            <p className="text-gray-600 text-[11px] leading-tight font-medium line-clamp-3">
                {item.description}
            </p>
        </div>
      </div>
      
      {/* Action Buttons as Circular Icons */}
      <div className="flex items-center justify-end gap-3 mt-4">
        <button
          onClick={() => onPropose(item.proposeUrl)}
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Proposer"
        >
          <PersonIcon />
        </button>

        <button
          onClick={handleDemandeClick}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all shadow-md active:scale-90 animate-demande-signal bg-white border-orange-500 text-orange-500`}
          title="Demander"
        >
          <SendIcon />
        </button>

        <a
          href="tel:0705052632"
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Appel"
        >
          <PhoneIcon />
        </a>
      </div>
    </div>
  );
};

interface LocationScreenProps {
  onBack: () => void;
  user: User;
  onPropose: (url: string, title: string) => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
  initialCategory?: 'appartement' | 'equipement';
}

const LocationScreen: React.FC<LocationScreenProps> = ({ onBack, user, onPropose, onOpenForm, initialCategory = 'appartement' }) => {
  const [activeTab, setActiveTab] = useState<'appartement' | 'equipement'>(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  // Update tab if initialCategory changes (from outside navigation)
  useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  const filteredItems = locationData.filter(item => 
      item.category === activeTab &&
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 flex-1 flex flex-col h-full">
      <header className="bg-white pt-2 pb-2 px-4 sticky top-0 z-20 border-b border-gray-100 shadow-sm">
        <div className="flex flex-row items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-xl">F</span>
                </div>
                <h1 className="text-xl font-black text-orange-500 tracking-tight whitespace-nowrap">
                    FILANT<span className="text-lg align-top">°</span>225
                </h1>
            </div>
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs text-center shadow-inner text-black bg-gray-50 font-bold"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <MicIcon className="h-3 w-3 text-gray-400" />
                </div>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <SearchIcon className="h-3 w-3 text-gray-400" />
                </div>
            </div>
            <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0 border border-gray-200 dark:border-slate-600">
                <BackIcon className="h-6 w-6 text-gray-800 dark:text-white" />
            </button>
        </div>
        <div className="flex items-center gap-2 mb-3 px-1">
            <IvoryCoastFlagIcon />
            <p className="text-xs font-bold text-gray-700 truncate">Trouvez rapidement le service dont vous avez besoin</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            <button 
                onClick={() => setActiveTab('appartement')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-tight whitespace-nowrap transition-colors ${
                    activeTab === 'appartement'
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'bg-white text-gray-500 border border-gray-100'
                }`}
            >
                Location d'appartement
            </button>
            <button 
                onClick={() => setActiveTab('equipement')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-tight whitespace-nowrap transition-colors ${
                    activeTab === 'equipement'
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'bg-white text-gray-500 border border-gray-100'
                }`}
            >
                Location d'équipement
            </button>
        </div>
      </header>
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="flex flex-col gap-6">
          {filteredItems.map(item => (
            <LocationCard 
                key={item.id} 
                item={item} 
                user={user}
                onPropose={(url) => onPropose(url, item.title)}
                onOpenForm={onOpenForm}
            />
          ))}
          {filteredItems.length === 0 && (
             <div className="text-center mt-10">
                <p className="text-gray-500 mb-2">Aucun élément trouvé.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LocationScreen;
