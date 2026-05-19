
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Hammer, 
    Droplets, 
    Zap, 
    Paintbrush, 
    Truck, 
    Construction, 
    Scaling, 
    Fence, 
    Key, 
    Satellite, 
    Wifi, 
    Scissors,
    Lightbulb,
    Mic,
    Tv,
    Utensils,
    Trash2,
    Bed,
    Tent,
    Leaf,
    Bug,
    Sparkles,
    ShieldCheck,
    Monitor,
    Wrench,
    Star,
    ZapOff,
    Wind,
    Thermometer,
    Tv2,
    HardDrive,
    Car,
    Trees,
    ChefHat,
    Music,
    Camera,
    Video,
    UserCheck,
    Package,
    Building2,
    Waves
} from 'lucide-react';
import { getSynchronizedWorkerImage } from './WorkerListScreen';
import { User } from '../types';
import EmbeddedForm from './EmbeddedForm';

// --- ICONS ---
const HouseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const ToolIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const BackIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MicIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 a4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>;
const ShopIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632V21a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V6.632l-8.622-5.03zM12 4.457l6.5 3.791V20.25H5.5V8.248l6.5-3.791zM9.5 12.25a2.5 2.5 0 005 0v-1.5a.75.75 0 00-1.5 0v1.5a1 1 0 01-2 0v-1.5a.75.75 0 00-1.5 0v1.5z" /></svg>;

// --- EQUIPMENT & REAL ESTATE IMAGES MAPPING ---
const EQUIPMENT_IMAGES: Record<string, string | string[]> = {
    // Agence Immobilière
    'Studio à louer': "https://i.supaimg.com/5d6f5d3f-6e64-4291-8ce3-28cebdb6bcec.jpg",
    'Terrain à louer ou à vendre': "https://i.supaimg.com/7c08d763-ce1e-44a5-b093-430cdb072ad2.jpg",
    'Chambre-salon à louer': "https://i.supaimg.com/db2acfbe-b3ca-4b65-9b21-ddb0c7fcb3af.jpg",
    'Villa à louer': [
        "https://i.supaimg.com/7dd280ea-2d80-472d-9997-d6c5b3d3c53c.jpg",
        "https://i.supaimg.com/022ee871-a47c-4a67-94c6-1226de611aa7.jpg"
    ],
    'Petit local à louer': "https://i.supaimg.com/a0a75e1c-8b38-485a-8231-0a213cf10858.jpg",
    'Magasin à louer': "https://i.supaimg.com/dfdc8569-179f-4dc2-aeb9-e0757dfbc5cf.jpg",
    
    // Equipements
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

    // Nouveaux équipements ajoutés
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

// --- CONSTANTS ---
const DESIGNATED_PRICE = "Désigné par le propriétaire";

// Fix: Define classicCardColors constant
const classicCardColors = [
    { bg: "bg-blue-50", border: "border-blue-100" },
    { bg: "bg-orange-50", border: "border-orange-100" },
    { bg: "bg-emerald-50", border: "border-emerald-100" },
    { bg: "bg-indigo-50", border: "border-indigo-100" }
];

// --- APP DATA ---
const depannageItems = [
    { title: 'Plombier rapide', description: 'Réparation fuites d’eau et installations.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Électricien rapide', description: 'Dépannage électrique sécurisé.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Serrurier rapide', description: 'Ouverture de porte et serrurerie.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Vitrier rapide', description: 'Remplacement de vitres et miroiterie.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg" },
    { title: 'Réparation climatiseur rapide', description: 'Entretien et recharge clim express.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Réparation frigo rapide', description: 'Dépannage frigo et systèmes froid.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Réparation télévision rapide', description: 'Dépannage TV toutes marques.', img: "https://i.supaimg.com/cdec5321-e464-4e04-b04e-7b03b2b59500.jpg" },
    { title: 'Réparation machine à laver rapide', description: 'Dépannage lave-linge express.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Réparation pompe à eau rapide', description: 'Dépannage pompes hydrauliques.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Réparation fuite d’eau rapide', description: 'Dépannage plomberie express.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Dépannage Internet rapide', description: 'Configuration WiFi et Fibre.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Dépannage parabole rapide', description: 'Réglage antennes satellite.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Dépannage électroménager rapide', description: 'Réparation micro-ondes, fours, etc.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Dépannage groupe électrogène rapide', description: 'Maintenance groupes secours.', img: "https://i.supaimg.com/2944eab0-2074-4e61-a759-dca478289e4b.jpg" },
    { title: 'Dépannage auto rapide', description: 'Assistance mécanique rapide.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
];

const constructionItems = [
    { title: 'Maçon rapide', description: 'Maçonnerie et rénovation rapide.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Ferrailleur rapide', description: 'Travaux de ferraillage bâtiment.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Coffreur rapide', description: 'Réalisation de coffrages béton.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Carreleur rapide', description: 'Pose de carreaux tous formats.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Peintre bâtiment rapide', description: 'Peinture et finitions bâtiment.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Électricien bâtiment rapide', description: 'Installation électrique bâtiment.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Plombier bâtiment rapide', description: 'Plomberie et réseaux bâtiment.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Soudeur rapide', description: 'Soudure aluminium et fer.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Charpentier rapide', description: 'Charpente bois et couverture.', img: "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg" },
    { title: 'Menuisier aluminium rapide', description: 'Menuiserie alu pro.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg" },
    { title: 'Menuisier bois rapide', description: 'Fabrication meubles bois.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg" },
    { title: 'Staffeur rapide', description: 'Décoration staff et plâtre.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Étancheur rapide', description: 'Traitement fuites et humidité.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg" },
    { title: 'Poseur de portail rapide', description: 'Installation portails.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Poseur de caméra rapide', description: 'Installation vidéosurveillance.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Climatisation bâtiment rapide', description: 'Installation systèmes split.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Technicien forage rapide', description: 'Réalisation forages eau.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg" },
    { title: 'Constructeur maison rapide', description: 'Gros œuvre et construction.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Finition bâtiment rapide', description: 'Peinture, carrelage, déco.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
];

const nettoyageItems = [
    { title: 'Technicien de surface rapide', description: 'Entretien pro bureaux.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Nettoyage maison rapide', description: 'Entretien complet domicile.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Nettoyage bureau rapide', description: 'Propreté espaces pro.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Nettoyage chantier rapide', description: 'Nettoyage après travaux.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Lavage automobile rapide', description: 'Lavage complet véhicule.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Désinfection rapide', description: 'Traitement anti-nuisibles.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Entretien jardin rapide', description: 'Jardinage et espaces verts.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Entretien piscine rapide', description: 'Nettoyage et traitement eau.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
];

const evenementielItems = [
    { title: 'Cuisinier rapide', description: 'Service cuisine pour événements.', img: "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg" },
    { title: 'Serveur rapide', description: 'Accueil et service buffet.', img: "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg" },
    { title: 'Décorateur rapide', description: 'Aménagement salles de fête.', img: "https://i.supaimg.com/ea6ed055-cb21-4552-a7c2-ecdf4b3bb2e5.jpg" },
    { title: 'DJ rapide', description: 'Animation musicale live.', img: "https://i.supaimg.com/acf51f49-b736-4a0c-b377-401e8d3a11b9.jpg" },
    { title: 'Sonorisateur rapide', description: 'Installation sono pro.', img: "https://i.supaimg.com/03ee9f0b-9978-48aa-a0c1-a4ee2b0efb74.jpg" },
    { title: 'Organisateur événementiel rapide', description: 'Planning complet fêtes.', img: "https://i.supaimg.com/5bbb535f-94c7-4c8a-bf51-7953e69e516e.jpg" },
    { title: 'Photographe rapide', description: 'Couverture photo pro.', img: "https://i.supaimg.com/cdec5321-e464-4e04-b04e-7b03b2b59500.jpg" },
    { title: 'Vidéaste rapide', description: 'Tournage et montage vidéo.', img: "https://i.supaimg.com/cdec5321-e464-4e04-b04e-7b03b2b59500.jpg" },
];

const transportItems = [
    { title: 'Chauffeur rapide', description: 'Service chauffeur privé.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Déménageur rapide', description: 'Transport et manutention domicile.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Livreur rapide', description: 'Livraison colis et repas.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Transport marchandises rapide', description: 'Logistique marchandises.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Transport matériaux rapide', description: 'Sable, bois, ciment.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
    { title: 'Transport déménagement rapide', description: 'Camions déménagement pro.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg" },
];

const locationRapideIntervItems = [
    { title: 'Camion benne', description: 'Transport sable, gravier pro.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Camion de campagne', description: 'Camion podium sonorisé.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Bâche à louer', description: 'Toutes tailles dispo.', img: EQUIPMENT_IMAGES['Bâche à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Chaise à louer', description: 'Chaises confortables.', img: "https://i.supaimg.com/90d4d927-ad54-471b-9238-d57d11233758.jpg", price: DESIGNATED_PRICE },
    { title: 'Table à louer', description: 'Tables réception pro.', img: "https://i.supaimg.com/6a3225ae-bdd4-40ea-95aa-51511076ec44.jpg", price: DESIGNATED_PRICE },
    { title: 'Groupe électrogène', description: 'Puissance garantie.', img: (EQUIPMENT_IMAGES['Groupe électrogène à louer'] as string[])[0], price: DESIGNATED_PRICE },
    { title: 'Bétonnière', description: 'Mélange efficace BTP.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Échafaudage', description: 'Travaux hauteur safe.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Tracteur', description: 'Labourage agricole.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Mini pelle', description: 'Accès restreint.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Pelle mécanique', description: 'Terrassement pro.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Marteau piqueur', description: 'Démolition béton.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Compresseur', description: 'Outils pneumatiques.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Sonorisation', description: 'Full audio events.', img: EQUIPMENT_IMAGES['Sonorisation à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Tente événementielle', description: 'Grands formats dispo.', img: "https://i.supaimg.com/85a7fcdf-42cb-4725-821c-1e209ebabfbc.jpg", price: DESIGNATED_PRICE },
    { title: 'Véhicule de transport', description: 'Utilitaires déménagement.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Engin de chantier', description: 'BTP lourds.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
];

const generalWorkerDataList = [
    { title: 'Vendeuse / Vendeur', description: 'Assure la vente et gestion boutique.', category: 'worker' },
    { title: 'Cuisinier / Cuisinière', description: 'Prépare repas pour resto ou maison.', category: 'worker' },
    { title: 'Serveur / Serveuse', description: 'Service en salle et accueil.', category: 'worker' },
    { title: 'Coiffeur / Coiffeuse', description: 'Soins capillaires et tresses.', category: 'worker' },
    { title: 'Hôtesse d’accueil', description: 'Réception et orientation visiteurs.', category: 'worker' },
    { title: 'Chauffeur', description: 'Taxi, VTC ou entreprise.', category: 'worker' },
    { title: 'Agent d’entretien / Femme de ménage', description: 'Nettoyeur bureaux et maisons.', category: 'worker' },
    { title: 'Caissière / Caissier', description: 'Gestion des paiements.', category: 'worker' },
    { title: 'Réceptionniste', description: 'Accueil hôtels et agences.', category: 'worker' },
    { title: 'Nounou / Baby-sitter', description: 'Garde d’enfants à domicile.', category: 'worker' },
    { title: 'Jardinier', description: 'Entretien jardins et pelouses.', category: 'worker' },
    { title: 'Couturière / Couturier', description: 'Couture et réparations vêtements.', category: 'worker' },
    { title: 'Esthéticienne', description: 'Soins du visage et beauté.', category: 'worker' },
    { title: 'Magasinier', description: 'Gestion des stocks.', category: 'worker' },
    { title: 'Manutentionnaire', description: 'Chargement marchandises.', category: 'worker' },
    { title: 'Vigile', description: 'Sécurité bâtiments.', category: 'worker' },
];

const generalLocationDataList = [
    { title: 'Studio à louer', description: 'Studios modernes et confortables.', category: 'appartement' },
    { title: 'Villa à louer', description: 'Villas spacieuses avec garage.', category: 'appartement' },
    { title: 'Chambre-salon à louer', description: 'Appartements 2 pièces abordables.', category: 'appartement' },
    { title: 'Petit local à louer', description: 'Locaux commerciaux pour boutiques.', category: 'appartement' },
    { title: 'Terrain à louer ou à vendre', description: 'Vente et location de terrains.', category: 'appartement' },
    { title: 'Magasin à louer', description: 'Espaces commerciaux stratégiques.', category: 'appartement' },

    // Location équipements
    ...locationRapideIntervItems.map(item => ({ ...item, category: 'equipement' }))
];

// --- COMPONENTS ---

const EquipmentVisual: React.FC<{ title: string, fallbackImg?: string, category?: string }> = ({ title, fallbackImg, category }) => {
    const t = title.toLowerCase();
    const iconSize = "w-16 h-16";
    
    // Choose dynamic icon based on keywords
    if (t.includes('plombier') || t.includes('eau') || t.includes('fuite') || t.includes('château') || t.includes('piscine')) 
        return <Waves className={`${iconSize} text-blue-400`} />;
    
    if (t.includes('clim') || t.includes('climatiseur'))
        return <Wind className={`${iconSize} text-cyan-400`} />;

    if (t.includes('frigo') || t.includes('congélateur') || t.includes('réfrigérateur'))
        return <Thermometer className={`${iconSize} text-blue-300`} />;

    if (t.includes('machine à laver') || t.includes('lave-linge'))
        return <Waves className={`${iconSize} text-slate-400`} />;

    if (t.includes('électr') || t.includes('parabole') || t.includes('internet') || t.includes('groupe électrogène')) 
        return <Zap className={`${iconSize} text-yellow-400`} />;
    
    if (t.includes('peintre') || t.includes('déco') || t.includes('finition') || t.includes('staff')) 
        return <Paintbrush className={`${iconSize} text-pink-400`} />;
    
    if (t.includes('maçon') || t.includes('carreleur') || t.includes('beton') || t.includes('construction') || t.includes('bétonnière') || t.includes('pelle') || t.includes('coffreur')) 
        return <Hammer className={`${iconSize} text-orange-400`} />;
    
    if (t.includes('camion') || t.includes('véhicule') || t.includes('tracteur') || t.includes('auto') || t.includes('livreur')) 
        return <Truck className={`${iconSize} text-red-500`} />;
    
    if (t.includes('chantier') || t.includes('forage') || t.includes('piqueur') || t.includes('compresseur') || t.includes('échafaudage') || t.includes('marteau')) 
        return <Construction className={`${iconSize} text-stone-500`} />;
    
    if (t.includes('jardin') || t.includes('gazon') || t.includes('tondeuse') || t.includes('végétaux') || t.includes('broyeur'))
        return <Leaf className={`${iconSize} text-green-500`} />;

    if (t.includes('insecte') || t.includes('termites') || t.includes('rat') || t.includes('désinfection'))
        return <Bug className={`${iconSize} text-amber-900`} />;

    if (t.includes('nettoyage') || t.includes('aspirateur') || t.includes('propreté') || t.includes('laveur') || t.includes('pression') || t.includes('surface'))
        return <Sparkles className={`${iconSize} text-sky-300`} />;

    if (t.includes('sécurité') || t.includes('alarme') || t.includes('vidéosurveillance'))
        return <ShieldCheck className={`${iconSize} text-blue-600`} />;

    if (t.includes('vidéo') || t.includes('écran') || t.includes('projecteur') || t.includes('télévision') || t.includes('tv'))
        return <Monitor className={`${iconSize} text-slate-700`} />;

    if (t.includes('menuisier') || t.includes('soudeur') || t.includes('ferron') || t.includes('charpentier') || t.includes('portail') || t.includes('aluminium') || t.includes('ferrailleur')) 
        return <Scaling className={`${iconSize} text-indigo-400`} />;
    
    if (t.includes('vitr') || t.includes('fenêtre') || t.includes('porte')) 
        return <Fence className={`${iconSize} text-cyan-400`} />;
    
    if (t.includes('serrure') || t.includes('clé') || t.includes('serrurier')) 
        return <Key className={`${iconSize} text-amber-500`} />;

    if (t.includes('camera') || t.includes('surveillance'))
        return <Tv className={`${iconSize} text-slate-600`} />;

    if (t.includes('sono') || t.includes('haut-parleur') || t.includes('baffle') || t.includes('micro') || t.includes('mégaphone') || t.includes('dj'))
        return <Music className={`${iconSize} text-purple-400`} />;

    if (t.includes('cuisinier') || t.includes('chef') || t.includes('traiteur'))
        return <ChefHat className={`${iconSize} text-orange-500`} />;

    if (t.includes('serveur') || t.includes('chaise') || t.includes('table') || t.includes('banc') || t.includes('matelas') || t.includes('nappe'))
        return <Utensils className={`${iconSize} text-emerald-400`} />;

    if (t.includes('photo') || t.includes('camera'))
        return <Camera className={`${iconSize} text-slate-500`} />;

    if (t.includes('vidéaste') || t.includes('tournage'))
        return <Video className={`${iconSize} text-red-500`} />;

    if (t.includes('poubelle'))
        return <Trash2 className={`${iconSize} text-green-600`} />;

    if (t.includes('tente') || t.includes('bâche') || t.includes('parasol'))
        return <Tent className={`${iconSize} text-sky-400`} />;

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            {category === 'appartement' ? <HouseIcon className="w-16 h-16 text-blue-400" /> : <ToolIcon className="w-16 h-16 text-orange-400" />}
        </div>
    );
};

const RapidSectionCard: React.FC<{ 
    item: any, 
    type: 'depannage' | 'construction' | 'nettoyage' | 'evenementiel' | 'transport' | 'location', 
    user: User,
    variant?: 'square' | 'horizontal',
    isFavorite: boolean,
    onToggleFavorite: (e: React.MouseEvent) => void,
    onOpenForm: (context: any) => void
}> = ({ item, type, user, variant = 'square', isFavorite, onToggleFavorite, onOpenForm }) => {
    const handleOpen = () => {
        let formType = 'rapid_building_service';
        if (type === 'location') formType = 'location';
        if (type === 'transport') formType = 'location'; // Transport usually requires details similar to location/service

        onOpenForm({
            formType: formType,
            title: item.title,
            imageUrl: EQUIPMENT_IMAGES[item.title] || item.img,
            description: item.description,
            price: item.price
        });
    };
    
    if (variant === 'horizontal') {
        return (
            <div 
                className="w-full bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col p-3 transition-all relative border border-gray-100/50 active:scale-95 cursor-pointer"
                onClick={handleOpen}
            >
                <div className="flex flex-row items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-500/20 shadow-inner bg-slate-50 relative">
                        <EquipmentVisual title={item.title} fallbackImg={item.img} />
                    </div>
                    <div className="ml-4 flex-1 flex flex-col text-left">
                        <div className="flex justify-between items-start">
                            <h4 className="text-[13px] font-black text-gray-900 uppercase leading-tight mb-0.5 tracking-tight line-clamp-1 pr-6">{item.title}</h4>
                        </div>
                        {type !== 'location' && type !== 'transport' ? (
                            <p className="text-[#ef4444] font-black text-[11px] leading-tight uppercase">
                                H. Descente : <span className="text-black">18H30</span>
                            </p>
                        ) : (
                            <p className="text-[#ef4444] font-black text-[11px] leading-tight uppercase">
                                Prix par jour : <span className="text-black text-[9px] leading-tight">{item.price || "Contactez-nous"}</span>
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
                            <div className="flex items-center gap-1 opacity-40">
                                <ShopIconSmall />
                                <span className="text-[8px] font-black uppercase tracking-wider">Filant Services</span>
                            </div>
                            <button 
                                onClick={onToggleFavorite}
                                className={`p-1 rounded-full transition-colors ${isFavorite ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                                <Star className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="flex-shrink-0 w-[180px] bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col transition-all relative border border-gray-100/50 active:scale-95 cursor-pointer"
            onClick={handleOpen}
        >
            <div className="p-3">
                <div className="h-[120px] w-full rounded-2xl overflow-hidden relative shadow-inner bg-slate-50 flex items-center justify-center border border-gray-100">
                    <EquipmentVisual title={item.title} fallbackImg={item.img} />
                </div>
            </div>
            <div className="px-4 pb-5 flex flex-col flex-1 text-left relative">
                <h4 className="text-[13px] font-black text-gray-900 uppercase leading-tight mb-1.5 tracking-tight line-clamp-1 pr-4">{item.title}</h4>
                {type !== 'location' && type !== 'transport' ? (
                    <p className="text-[#ef4444] font-black text-[12px] leading-tight mb-2 uppercase">
                        Heure de descente : <span className="text-black">18H30</span>
                    </p>
                ) : (
                    <p className="text-[#ef4444] font-black text-[11px] leading-tight mb-2 uppercase">
                        Prix par jour : <br/><span className="text-black text-[10px] leading-tight italic">{item.price || "Désigné par le propriétaire"}</span>
                    </p>
                )}
                <p className="text-[10px] text-gray-400 leading-snug italic line-clamp-2 mt-auto mb-3">
                    {item.description}
                </p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                    <div className="flex items-center gap-1.5 opacity-40">
                        <ShopIconSmall />
                        <span className="text-[9px] font-black uppercase tracking-wider">Filant Services</span>
                    </div>
                    <button 
                        onClick={onToggleFavorite}
                        className={`p-1 rounded-full transition-colors ${isFavorite ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                        <Star className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ClassicCardProps {
    item: any;
    user: User;
    category: string;
    onOpenForm: (context: any) => void;
}

const ClassicCard: React.FC<ClassicCardProps> = ({ item, user, category, onOpenForm }) => {
    const index = Math.floor(Math.random() * 4); // For color rotation
    const colorStyle = classicCardColors[index % classicCardColors.length];
    const isWorker = category === 'travailleurs';
    const img = isWorker ? getSynchronizedWorkerImage(item.title) : (EQUIPMENT_IMAGES[item.title] || undefined);
    
    const handleOpen = () => {
        onOpenForm({
            formType: category === 'immobilier' || category === 'equipement' ? 'location' : 'worker',
            title: item.title,
            imageUrl: img,
            description: item.description,
            price: item.price
        });
    };

    return (
        <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all border border-gray-100 active:scale-95 cursor-pointer"
            onClick={handleOpen}
        >
            <div className="flex flex-col">
                <div className={`aspect-[4/3] w-full flex items-center justify-center relative ${colorStyle.bg} ${colorStyle.border || ''} overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
                    {isWorker ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <UserCircleIcon className="w-16 h-16 text-slate-400" />
                        </div>
                    ) : (
                        <EquipmentVisual title={item.title} category={(item as any).category} />
                    )}
                </div>
                <div className="p-3 flex-1 w-full text-left relative flex flex-col justify-between min-h-[90px]">
                    <div>
                        <span className="text-sm font-bold text-gray-900 leading-tight block mb-1 uppercase truncate">{item.title}</span>
                        <span className="text-xs text-gray-500 leading-tight line-clamp-2">{item.description}</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-100 p-1.5 rounded-full text-orange-600 shadow-sm">
                        <UserCircleIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface InterventionShopScreenProps {
    onBack: () => void;
    user: User;
    category: 'intervention' | 'immobilier' | 'equipement' | 'travailleurs';
    onOpenForm: (context: any) => void;
}

const InterventionShopScreen: React.FC<InterventionShopScreenProps> = ({ onBack, user, category, onOpenForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState<'all' | 'depannage' | 'construction' | 'nettoyage' | 'evenementiel' | 'transport' | 'location'>(category === 'intervention' ? 'all' : 'all');
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('filant_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    
    // Individual section collapses
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        depannage: false,
        construction: false,
        nettoyage: false,
        evenementiel: false,
        transport: false,
        location: false
    });

    useEffect(() => {
        localStorage.setItem('filant_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        setFavorites(prev => 
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const isInterventionView = category === 'intervention';

    // Filters
    const filterItems = (items: any[]) => 
        items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const sections = [
        { id: 'depannage', title: 'DÉPANNAGE RAPIDE', items: depannageItems, btnLabel: 'Tous les dépannages' },
        { id: 'construction', title: 'SERVICES CONSTRUCTION', items: constructionItems, btnLabel: 'Tous les services construction' },
        { id: 'nettoyage', title: 'NETTOYAGE & ENTRETIEN', items: nettoyageItems, btnLabel: 'Tous les services nettoyage' },
        { id: 'evenementiel', title: 'CUISINE & ÉVÉNEMENTIEL', items: evenementielItems, btnLabel: 'Tous les services événementiels' },
        { id: 'transport', title: 'TRANSPORT & LIVRAISON', items: transportItems, btnLabel: 'Tous les services transport' },
        { id: 'location', title: 'LOCATION D’ÉQUIPEMENTS', items: locationRapideIntervItems, btnLabel: 'Tous les équipements' },
    ];

    const classicItems = useMemo(() => {
        if (category === 'travailleurs') return generalWorkerDataList;
        if (category === 'immobilier') return generalLocationDataList.filter(l => l.category === 'appartement');
        if (category === 'equipement') return generalLocationDataList.filter(l => l.category === 'equipement');
        return [];
    }, [category]);

    const filteredClassic = useMemo(() => 
        classicItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [classicItems, searchTerm]);

    const getTitle = () => {
        if (category === 'intervention') return "Intervention Rapide";
        if (category === 'travailleurs') return "Travailleurs Qualifiés";
        if (category === 'immobilier') return "Agence Immobilière";
        if (category === 'equipement') return "Location d'équipements";
        return "";
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[500] flex flex-col font-sans overflow-hidden"
        >
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide">
                
                {/* Header Image Section */}
                <motion.div 
                    initial={{ y: -50, opacity: 0, scale: 1.1 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="relative h-[220px] w-full flex-shrink-0 bg-orange-600 flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <span className="text-white/20 font-black text-6xl">F</span>
                    <button 
                        onClick={onBack} 
                        className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-90 z-20"
                    >
                        <BackIcon />
                    </button>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                        <span className="text-white font-black text-xl tracking-tighter uppercase drop-shadow-lg">FILANT°225</span>
                    </div>
                </motion.div>

                {/* Content Container */}
                <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 bg-white rounded-t-[3rem] -mt-12 relative z-10 p-6 flex flex-col"
                >
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mb-6 self-center"></div>
                    
                    <div className="mb-6 flex flex-col items-center">
                        <h2 className="text-xl font-black text-black uppercase tracking-tight text-center">{getTitle()}</h2>
                        <div className="h-1 w-20 bg-orange-500 mt-1 rounded-full"></div>
                    </div>

                    {/* Category Tabs (Horizontal Scroll) */}
                    {isInterventionView && (
                        <div className="flex gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                            {[
                                { id: 'all', label: 'Tout' },
                                { id: 'depannage', label: 'Dépannage' },
                                { id: 'construction', label: 'Construction' },
                                { id: 'nettoyage', label: 'Nettoyage' },
                                { id: 'evenementiel', label: 'Événementiel' },
                                { id: 'transport', label: 'Transport' },
                                { id: 'location', label: 'Location' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id as any)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-full font-extrabold text-[12px] uppercase transition-all ${
                                        selectedTab === tab.id 
                                        ? 'bg-orange-500 text-white shadow-lg scale-105' 
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 bg-gray-100 border border-transparent rounded-full p-3 text-black shadow-inner focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-400 font-bold text-sm" 
                        />
                    </div>

                    {isInterventionView ? (
                        <div className="space-y-10 pb-24">
                            {sections.filter(s => selectedTab === 'all' || selectedTab === s.id).map(section => {
                                const filtered = filterItems(section.items);
                                if (filtered.length === 0 && searchTerm) return null;
                                
                                const isExpanded = expandedSections[section.id];
                                const displayItems = isExpanded ? filtered : filtered.slice(0, 3);

                                return (
                                    <div key={section.id} className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="bg-[#f97316] px-4 py-1.5 rounded-full shadow-md">
                                                <h2 className="text-[11px] font-black text-white uppercase tracking-tight">
                                                    {section.title}
                                                </h2>
                                            </div>
                                            <button 
                                                onClick={() => toggleSection(section.id)} 
                                                className="text-orange-600 text-[11px] font-black uppercase hover:opacity-80 active:scale-95 transition-all"
                                            >
                                                {isExpanded ? 'Réduire' : 'Plus'}
                                            </button>
                                        </div>
                                        
                                        <div className={`${isExpanded ? 'grid grid-cols-1 gap-4' : 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'}`}>
                                            {displayItems.map((item, idx) => (
                                                <RapidSectionCard 
                                                    key={`${section.id}-${idx}`} 
                                                    item={item} 
                                                    type={section.id as any} 
                                                    user={user}
                                                    variant={isExpanded ? 'horizontal' : 'square'}
                                                    isFavorite={favorites.includes(item.title)}
                                                    onToggleFavorite={(e) => toggleFavorite(e, item.title)}
                                                    onOpenForm={onOpenForm}
                                                />
                                            ))}
                                            {filtered.length === 0 && <p className="text-gray-400 text-xs italic p-4">Aucun résultat.</p>}
                                        </div>
                                        
                                        {!isExpanded && filtered.length > 3 && (
                                            <button 
                                                onClick={() => toggleSection(section.id)}
                                                className="w-full py-2 bg-gray-50 rounded-xl text-orange-500 font-black text-[11px] uppercase border border-dashed border-orange-200 active:scale-[0.98] transition-all"
                                            >
                                                {section.btnLabel}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 pb-24">
                            {filteredClassic.map((item, index) => (
                                <ClassicCard 
                                    key={item.title + index}
                                    item={item}
                                    user={user}
                                    category={category}
                                    onOpenForm={onOpenForm}
                                />
                            ))}
                            {filteredClassic.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500"><p className="font-bold">Aucun résultat.</p></div>}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default InterventionShopScreen;
