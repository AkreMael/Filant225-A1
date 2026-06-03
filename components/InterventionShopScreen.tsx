import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSynchronizedWorkerImage } from './WorkerListScreen';
import { User } from '../types';

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
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 a4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>;
const ShopIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632V21a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V6.632l-8.622-5.03zM12 4.457l6.5 3.791V20.25H5.5V8.248l6.5-3.791zM9.5 12.25a2.5 2.5 0 005 0v-1.5a.75.75 0 00-1.5 0v1.5a1 1 0 01-2 0v-1.5a.75.75 0 00-1.5 0v1.5z" /></svg>;

// --- STAR ICON ---
const StarIcon: React.FC<{ filled?: boolean; className?: string; onClick?: (e: React.MouseEvent) => void }> = ({ filled, className = "w-4 h-4", onClick }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${className} ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-none'}`} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2.5}
        onClick={onClick}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.192-.41.761-.41.953 0l2.253 4.8 5.084.774c.433.066.607.61.293.927l-3.682 3.738.87 5.378c.074.457-.38.796-.763.568L12 17.5l-4.545 2.508c-.383.228-.837-.11-.763-.568l.87-5.378-3.682-3.738c-.314-.317-.14-.86.293-.927l5.084-.774 2.253-4.8z" />
    </svg>
);

const StarIconPassive: React.FC<{ title: string }> = ({ title }) => {
    const [isFav, setIsFav] = useState(() => {
        try {
            return localStorage.getItem(`fav_${title}`) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const handleUpdate = () => {
            try {
                setIsFav(localStorage.getItem(`fav_${title}`) === 'true');
            } catch {}
        };
        window.addEventListener('favourites-updated', handleUpdate);
        return () => window.removeEventListener('favourites-updated', handleUpdate);
    }, [title]);

    return (
        <StarIcon filled={isFav} className="w-4 h-4" />
    );
};

// --- EQUIPMENT & REAL ESTATE IMAGES MAPPING ---
const EQUIPMENT_IMAGES: Record<string, string | string[]> = {
    // Services direct images
    'Laveur de vitres Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/523a7221-efdc-40cb-8854-e2cf0f23b981.jpg",
    'LAVEUR DE VITRES RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/523a7221-efdc-40cb-8854-e2cf0f23b981.jpg",
    'Vitrier rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2e206e53-6d2f-407c-afed-ade496273d38.jpg",
    'VITRIER RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2e206e53-6d2f-407c-afed-ade496273d38.jpg",
    'Serrurier rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/875cfb8e-eb8b-41e3-9fd0-1913ecd35ef1.jpg",
    'SERRURIER RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/875cfb8e-eb8b-41e3-9fd0-1913ecd35ef1.jpg",
    'Réparation frigo rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bbaa4d5b-1347-4e3d-9c37-105746cd07b5.jpg",
    'RÉPARATION FRIGO RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bbaa4d5b-1347-4e3d-9c37-105746cd07b5.jpg",
    'Réparation machine à laver rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ded86605-c99d-4249-80a5-c9b7bda7ec53.jpg",
    'RÉPARATION MACHINE À LAVER RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ded86605-c99d-4249-80a5-c9b7bda7ec53.jpg",
    'Dépannage parabole rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f8bc69a2-70c9-46aa-a6c7-46490174fcf1.jpg",
    'DÉPANNAGE PARABOLE RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f8bc69a2-70c9-46aa-a6c7-46490174fcf1.jpg",
    'Dépannage auto rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/598a9736-7060-40b4-950b-4b797a6d91ec.jpg",
    'DÉPANNAGE AUTO RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/598a9736-7060-40b4-950b-4b797a6d91ec.jpg",
    'Poseur de caméra': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/a8ac2931-a784-45ac-815a-8f3c9862fa93.jpg",
    'POSEUR DE CAMÉRA': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/a8ac2931-a784-45ac-815a-8f3c9862fa93.jpg",
    'DJ': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/900783f2-a4ac-4728-a05b-c5dc2257c261.jpg",
    'Technicien de surface': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/eba4b548-31aa-4a5f-b14a-53e3f4459e47.jpg",
    'TECHNICIEN DE SURFACE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/eba4b548-31aa-4a5f-b14a-53e3f4459e47.jpg",
    'Nettoyage maison': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6229a41a-0e9e-4f10-81a6-732897f24998.jpg",
    'NETTOYAGE MAISON': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6229a41a-0e9e-4f10-81a6-732897f24998.jpg",

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

    // Nouveaux équipements
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

const classicCardColors = [
    { bg: "bg-blue-50", border: "border-blue-100" },
    { bg: "bg-orange-50", border: "border-orange-100" },
    { bg: "bg-emerald-50", border: "border-emerald-100" },
    { bg: "bg-indigo-50", border: "border-indigo-100" }
];

// --- APP DATA ---
const batimentIntervItems = [
    { title: 'Plombier rapide', description: 'Réparation fuites d’eau et installations.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Électricien rapide', description: 'Dépannage électrique sécurisé.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Carreleur rapide', description: 'Pose de carreaux tous formats.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Charpentier rapide', description: 'Menuiserie et charpente bois.', img: "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg" },
    { title: 'Maçon rapide', description: 'Maçonnerie et rénovation rapide.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Soudeur rapide', description: 'Travaux de soudure et ferronnerie.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Peintre rapide', description: 'Peinture et finitions intérieures.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/523a7221-efdc-40cb-8854-e2cf0f23b981.jpg" },
    { title: 'Technicien entretien climatisation Rapide', description: 'Entretien et recharge clim.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Installateur de caméras de surveillance Rapide', description: 'Installation vidéosurveillance.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/692e8ebb-b3d7-495b-8b43-65148c4f1609.jpg" },
    { title: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1bd32ba7-1320-4334-bff0-8016ccb6404f.jpg" },
    { title: 'Installateur de fenêtres et portes vitrées Rapide', description: 'Pose menuiserie et vitrerie.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5b41e300-53eb-4213-ac32-e07b1d272667.jpg" },
    { title: 'Menuisier Rapide', description: 'Menuiserie bois et meubles.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg" },
];

const locationRapideIntervItems = [
    { title: 'Camion de campagne à louer', description: 'Camion podium sonorisé pour vos campagnes.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Bâche à louer', description: 'Bâches de toutes tailles pour vos fêtes.', img: EQUIPMENT_IMAGES['Bâche à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Groupe électrogène à louer', description: 'Puissance garantie pour vos événements.', img: (EQUIPMENT_IMAGES['Groupe électrogène à louer'] as string[])[0], price: DESIGNATED_PRICE },
    { title: 'Sonorisation à louer', description: 'Matériel son complet pour ambiance.', img: EQUIPMENT_IMAGES['Sonorisation à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Espace d’événement à louer', description: 'Salles et espaces en plein air.', img: (EQUIPMENT_IMAGES['Espace d’événement à louer'] as string[])[0], price: DESIGNATED_PRICE },
    { title: 'Table d’événement à louer', description: 'Mobilier complet pour réceptions.', img: EQUIPMENT_IMAGES['Table d’événement à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Écran géant à louer', description: 'Écrans LED haute définition.', img: EQUIPMENT_IMAGES['Écran géant à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Podium à louer', description: 'Scènes modulables pour discours.', img: EQUIPMENT_IMAGES['Podium à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Poubelle mobile à louer', description: 'Collecte et gestion des déchets.', img: "https://i.supaimg.com/5d50ad37-c869-47dd-ab0a-7439425189ca.jpg", price: DESIGNATED_PRICE },
    { title: 'Mégaphone à louer', description: 'Amplification sonore mobile.', img: "https://i.supaimg.com/9bbdf54f-ff0f-4290-ad44-4b65e6615b87.jpg", price: DESIGNATED_PRICE },
    { title: 'Échelle pliante (petite) à louer', description: 'Accès en hauteur sécurisé.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Corde / rallonge corde à louer', description: 'Câbles et cordages divers.', img: "https://i.supaimg.com/b52890f2-773e-4dbf-9fbb-384abb717ddc.jpg", price: DESIGNATED_PRICE },
    { title: 'Nappe de table à louer', description: 'Habillage pour tables de réception.', img: "https://i.supaimg.com/8b8a3693-887c-46ca-8407-3385f5797391.jpg", price: DESIGNATED_PRICE },
    { title: 'Tapis à louer', description: 'Revêtement de sol pour allées.', img: "https://i.supaimg.com/327c6247-8170-45a3-87a9-0188227b6160.jpg", price: DESIGNATED_PRICE },
    { title: 'Distributeur d’eau à louer', description: 'Service d’eau fraîche pour invités.', img: "https://i.supaimg.com/2a8fce06-7284-40d6-9721-42bfa3ece75b.jpg", price: DESIGNATED_PRICE },
    { title: 'Plateau de service', description: 'Accessoire indispensable traiteur.', img: "https://i.supaimg.com/4fde8630-fb44-45a2-9579-d21df1774416.jpg", price: DESIGNATED_PRICE },
    { title: 'Microphone événement à louer', description: 'Système microphone haute qualité.', img: "https://i.supaimg.com/58dab9a6-0116-44ac-9087-40599ee37a3d.jpg", price: DESIGNATED_PRICE },
    { title: 'Haut-parleur / baffle Bluetooth à louer', description: 'Sonorisation mobile connectée.', img: "https://i.supaimg.com/a6f9700d-7f3f-45ee-b5e8-490beea8bfb9.jpg", price: DESIGNATED_PRICE },
    { title: 'Projecteur LED portable à louer', description: 'Éclairage puissant et mobile.', img: "https://i.supaimg.com/8930c037-58e6-4114-8407-a23ac25b94cb.jpg", price: DESIGNATED_PRICE },
    { title: 'Lampe éclairage forte à louer', description: 'Éclairage haute intensité.', img: "https://i.supaimg.com/97ce3a8d-4768-4a67-9939-98fdd67ece99.jpg", price: DESIGNATED_PRICE },
    { title: 'Glacière à louer', description: 'Glacière isotherme pour conservation au frais.', img: "https://i.supaimg.com/a2bf7832-311c-40ee-a8ac-c045311105d5.jpg", price: DESIGNATED_PRICE },
    { title: 'Tente pliante (petite) à louer', description: 'Abri rapide contre soleil/pluie.', img: "https://i.supaimg.com/85a7fcdf-42cb-4725-821c-1e209ebabfbc.jpg", price: DESIGNATED_PRICE },
    { title: 'Parasol à louer', description: 'Protection solaire de jardin.', img: "https://i.supaimg.com/566f8800-9907-4a76-b623-eb55af66be2e.jpg", price: DESIGNATED_PRICE },
    { title: 'Banc à louer', description: 'Assises collectives robustes.', img: "https://i.supaimg.com/d0e3fa50-b9ce-4812-9ff6-c60ad02adebc.jpg", price: DESIGNATED_PRICE },
    { title: 'Chaise pliante à louer', description: 'Chaises légères et pratiques.', img: "https://i.supaimg.com/d3aa47ce-cd82-415e-b3f6-83fef44587d2.jpg", price: DESIGNATED_PRICE },
    { title: 'Table en bois à louer', description: 'Table robuste en bois pour repas.', img: "https://i.supaimg.com/b30c95a6-c5c1-421c-9977-0867018a1aa2.jpg", price: DESIGNATED_PRICE },
    { title: 'Bâche (petite / moyenne) à louer', description: 'Protection étanche moyenne.', img: "https://i.supaimg.com/774b9edd-9be5-4396-90bc-6211999e7acc.jpg", price: DESIGNATED_PRICE },
    { title: 'Matelas une place à louer', description: 'Couchage d’appoint confortable.', img: "https://i.supaimg.com/8faa86d6-3417-4b28-be02-5f67b136341c.jpg", price: DESIGNATED_PRICE },
];

const generalWorkerDataList = [
    { title: 'Vendeuse', description: 'Assure la vente, l’accueil des clients et la gestion d’une boutique.', category: 'worker' },
    { title: 'Cuisinier', description: 'Prépare les repas pour restaurant, foyer, entreprise ou événements.', category: 'worker' },
    { title: 'Serveur', description: 'Accueille les clients, sert les plats et s’occupe des commandes.', category: 'worker' },
    { title: 'Coiffeur Homme', description: 'S’occupe des coupes de cheveux homme et barbier.', category: 'worker' },
    { title: 'Coiffeuse Femme', description: 'Tresses, coiffures, tissages et soins capillaires pour dames.', category: 'worker' },
    { title: 'Hôtesse d’accueil', description: 'Réception et orientation visiteurs.', category: 'worker' },
    { title: 'Chauffeur', description: 'Taxi, VTC ou de direction.', category: 'worker' },
    { title: 'Agent d’entretien', description: 'Nettoyeur professionnel bureaux et villas.', category: 'worker' },
    { title: 'Femme de ménage', description: 'Entretien ménager rigoureux de maisons.', category: 'worker' },
    { title: 'Caissier', description: 'Opérations d’encaissement et suivi de caisse.', category: 'worker' },
    { title: 'Réceptionniste', description: 'Accueil hôtels et agences.', category: 'worker' },
    { title: 'Nounou', description: 'Garde éducative d’enfants à domicile.', category: 'worker' },
    { title: 'Baby-sitter', description: 'Garde ponctuelle d’enfants pour vous soulager.', category: 'worker' },
    { title: 'Jardinier', description: 'Entretien jardins et pelouses.', category: 'worker' },
    { title: 'Couturier', description: 'Coupe et couture de vêtements de tout type.', category: 'worker' },
    { title: 'Esthéticienne', description: 'Soins du visage et beauté.', category: 'worker' },
    { title: 'Magasinier', description: 'Gestion des stocks.', category: 'worker' },
    { title: 'Manutentionnaire', description: 'Chargement marchandises.', category: 'worker' },
    { title: 'Agent de sécurité', description: 'Assure la sécurité et la surveillance d’un commerce, bâtiment ou d’une résidence.', category: 'worker' },
    { title: 'MANUCURE À DOMICILE RAPIDE', description: 'Soin et mise en beauté des mains et pieds à domicile.', category: 'worker' },
    { title: 'ESTHÉTICIENNE-MASSAGE', description: 'Soins esthétiques du corps et du visage, massages.', category: 'worker' },
    { title: 'MAQUILLEUSE PROFESSIONNELLE', description: 'Maquillage professionnel de tout type.', category: 'worker' },
    { title: 'Pâtissier', description: 'Création et cuisson de gâteaux et desserts.', category: 'worker' },
];

const generalLocationDataList = [
    { title: 'Studio à louer', description: 'Studios modernes et confortables.', category: 'appartement' },
    { title: 'Villa à louer', description: 'Villas spacieuses avec garage.', category: 'appartement' },
    { title: 'Chambre-salon à louer', description: 'Appartements 2 pièces abordables.', category: 'appartement' },
    { title: 'Petit local à louer', description: 'Locaux commerciaux pour boutiques.', category: 'appartement' },
    { title: 'Terrain à louer ou à vendre', description: 'Vente et location de terrains.', category: 'appartement' },
    { title: 'Magasin à louer', description: 'Espaces commerciaux stratégiques.', category: 'appartement' },
    ...locationRapideIntervItems.map(item => ({ ...item, category: 'equipement' }))
];

// --- MAIN ORGANIZED CATEGORIES CONFIG (Avoiding duplicates) ---
const categoriesConfig = [
    {
        name: "1. DÉPANNAGE RAPIDE",
        items: [
            { title: "Plombier rapide", description: "Dépannage plomberie ultra rapide." },
            { title: "Électricien rapide", description: "Dépannage électricité urgent." },
            { title: "Serrurier rapide", description: "Ouverture de porte et serrures rapides." },
            { title: "Vitrier rapide", description: "Changement de vitres et fenêtres." },
            { title: "Réparation climatiseur rapide", description: "Réparation et recharge climatisation." },
            { title: "Réparation frigo rapide", description: "Réparation réfrigérateurs et congél." },
            { title: "Réparation machine à laver rapide", description: "Réparation lave-linge et sèche-linge." },
            { title: "Réparation fuite d’eau rapide", description: "Détection et réparation fuites." },
            { title: "Dépannage parabole rapide", description: "Installation et réglage parabole." },
            { title: "Dépannage auto rapide", description: "Mécanique et électrique auto." }
        ]
    },
    {
        name: "2. SERVICES CONSTRUCTION",
        items: [
            { title: "Maçon", description: "Maçonnerie générale, chapes et murs." },
            { title: "Ferrailleur", description: "Travaux de ferraillage solides." },
            { title: "Coffreur", description: "Coffrages bois ou métalliques." },
            { title: "Carreleur", description: "Pose de carreaux tous formats." },
            { title: "Peintre bâtiment", description: "Peinture murs et boiseries." },
            { title: "Électricien bâtiment", description: "Installation électrique complète." },
            { title: "Plombier bâtiment", description: "Tuyauterie et réseaux sanitaires." },
            { title: "Soudeur", description: "Soudure et structures métalliques." },
            { title: "Charpentier", description: "Charpentes bois et ossatures." },
            { title: "Menuisier aluminium", description: "Fenêtres, portes et baies vitrées." },
            { title: "Menuisier bois", description: "Portes et placards en bois." },
            { title: "Staffeur", description: "Décoration en plâtre et staff." },
            { title: "Étancheur", description: "Traitement des fuites et infiltration." },
            { title: "Poseur de portail", description: "Installation de portails." },
            { title: "Poseur de caméra", description: "Installation vidéosurveillance." },
            { title: "Climatisation bâtiment", description: "Installation climatisation centrale." },
            { title: "Technicien forage", description: "Forage de puits d'eau." },
            { title: "Constructeur maison", description: "Projet de construction de A à Z." },
            { title: "Finition bâtiment", description: "Enduit, ponçage, finitions fines." }
        ]
    },
    {
        name: "3. NETTOYAGE & ENTRETIEN",
        items: [
            { title: "Technicien de surface", description: "Nettoyage sols et surfaces." },
            { title: "Nettoyage maison", description: "Ménage complet de maisons." },
            { title: "Nettoyage bureau", description: "Entretien des espaces de travail." },
            { title: "Nettoyage chantier", description: "Nettoyage de fin de chantier." },
            { title: "Lavage automobile", description: "Lavage auto à domicile." },
            { title: "Désinfection", description: "Nettoyage et élimination de germes." },
            { title: "Entretien jardin", description: "Tonte pelouse et jardinage." },
            { title: "Entretien piscine", description: "Nettoyage et traitement eau de piscine." }
        ]
    },
    {
        name: "4. CUISINE & ÉVÉNEMENTIEL",
        items: [
            { title: "Cuisinier", description: "Cuisine à domicile ou événement." },
            { title: "Serveur", description: "Service traiteur ou restaurant." },
            { title: "Décorateur", description: "Décoration salle et événements." },
            { title: "DJ", description: "Animation musicale pour fêtes." },
            { title: "Sonorisateur", description: "Installation et réglage du son." },
            { title: "Organisateur événementiel", description: "Planification et coordination totale." },
            { title: "Photographe", description: "Reportage photos professionnel." },
            { title: "Vidéaste", description: "Captation et montage vidéo." }
        ]
    },
    {
        name: "5. TRANSPORT & LIVRAISON",
        items: [
            { title: "Chauffeur", description: "Déplacement sécurisé et rapide." },
            { title: "Déménageur", description: "Aide pour chargement et emballage." },
            { title: "Livreur", description: "Livraison colis et repas express." },
            { title: "Transport marchandises", description: "Camionnette pour fret commercial." },
            { title: "Transport matériaux", description: "Livraison de ciment, sable, etc." },
            { title: "Transport déménagement", description: "Grand camion de déménagement." }
        ]
    },
    {
        name: "6. LOCATION D’ÉQUIPEMENTS",
        items: [
            { title: "Camion benne", description: "Camion benne pour transport lourd." },
            { title: "Camion de campagne", description: "Camion podium sonorisé campagne." },
            { title: "Bâche à louer", description: "Bâches toutes dimensions." },
            { title: "Chaise à louer", description: "Chaises blanches de réception." },
            { title: "Table à louer", description: "Tables rondes ou rectangulaires." },
            { title: "Groupe électrogène", description: "Alimentation électrique autonome." },
            { title: "Bétonnière", description: "Bétonnière électrique ou thermique." },
            { title: "Échafaudage", description: "Échafaudage de chantier sécurisé." },
            { title: "Tracteur", description: "Tracteur agricole ou de chantier." },
            { title: "Mini pelle", description: "Mini pelle pour travaux d’accès." },
            { title: "Pelle mécanique", description: "Excavatrice lourd chantier." },
            { title: "Marteau piqueur", description: "Démolition de béton robuste." },
            { title: "Compresseur", description: "Compresseur d'air professionnel." },
            { title: "Sonorisation", description: "Sonorisation puissante événements." },
            { title: "Tente événementielle", description: "Tente blanche de réception." },
            { title: "Véhicule de transport", description: "Véhicule utilitaire ou de livraison." },
            { title: "Engin de chantier", description: "Engins divers pour BTP." }
        ]
    }
];

// --- HELPER FUNCTION FOR SERVICE IMAGES ---
export const getServiceItemImage = (title: string): string => {
    // 0. Try key mapping back to EQUIPMENT_IMAGES first to prioritize equipment images
    const eqKey = title.replace(/\s*rapide/i, '').replace(/\s*Rapide/i, '').trim();
    const eqImg = EQUIPMENT_IMAGES[title] || EQUIPMENT_IMAGES[eqKey];
    if (eqImg) {
        if (Array.isArray(eqImg)) return eqImg[0];
        return eqImg;
    }

    // 1. Try WorkerListScreen name mapper first
    const workerImg = getSynchronizedWorkerImage(title);
    if (workerImg && !workerImg.includes('placeholder') && workerImg !== "https://i.supaimg.com/17697fbb-4850-449b-8aae-1e5074f46e78.jpg") return workerImg;

    // 2. Try simple mapping of common terms
    const titleLower = title.toLowerCase();
    if (titleLower.includes('entretien piscine')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9c3ec760-4dba-41a4-b8cd-c6fe37b1d915.jpg";
    if (titleLower.includes('entretien jardin')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/a457d9bb-89d8-43c9-9d79-47af16441a96.jpg";
    if (titleLower.includes('désinfection') || titleLower.includes('desinfection')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ff1341c6-c0af-45b4-ac13-14be2e99f250.jpg";
    if (titleLower.includes('lavage automobile')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/94a52205-50dc-405e-a706-890ae4cd782c.jpg";
    if (titleLower.includes('nettoyage chantier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/97941791-30f2-4350-91ab-4c19743a8b4b.jpg";
    if (titleLower.includes('nettoyage bureau')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6d388c33-c0f5-46ed-af04-3ae5c8cbb212.jpg";
    if (titleLower.includes('sonorisateur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/89e2d5eb-eb0d-4c2d-a61b-88d1d02f56ff.jpg";
    if (titleLower.includes('organisateur événementiel') || titleLower.includes('organisateur evenementiel')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ea085472-d107-4662-868f-c030d139e454.jpg";
    if (titleLower.includes('déménageur') || titleLower.includes('demenageur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7666c637-2d97-400b-a6b1-307eee3b5223.jpg";
    if (titleLower.includes('transport marchandises') || titleLower.includes('transport de marchandises')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (titleLower.includes('transport matériaux') || titleLower.includes('transport de materiaux') || titleLower.includes('transport materiaux')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (titleLower.includes('transport déménagement') || titleLower.includes('transport demenagement')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (titleLower.includes('livreur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/48e240f8-04ca-4609-b8e1-908ffd40f430.jpg";
    if (titleLower.includes('maçon') || titleLower.includes('macon')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7759e2a2-e89b-4f9a-981d-1498c014e9cf.jpg";
    if (titleLower.includes('ferrailleur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5ae09e19-f285-4127-9865-ec7523886c61.jpg";
    if (titleLower.includes('coffreur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6be60e9a-394f-4026-90f8-3d9843c98589.jpg";
    if (titleLower.includes('carreleur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7db163c3-53bc-48ed-b87e-9e5c1df9af2d.jpg";
    if (titleLower.includes('peintre bâtiment') || titleLower.includes('peintre batiment') || titleLower.includes('peintre')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg";
    if (titleLower.includes('électricien bâtiment') || titleLower.includes('electricien batiment') || titleLower.includes('électricien') || titleLower.includes('electricien')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg";
    if (titleLower.includes('plombier bâtiment') || titleLower.includes('plombier batiment') || titleLower.includes('plombier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg";
    if (titleLower.includes('soudeur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6a162389-4981-4106-b81b-b0baf5b94254.jpg";
    if (titleLower.includes('charpentier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/0dce445b-e80a-4837-bce1-705e07151696.jpg";
    if (titleLower.includes('menuisier aluminium') || titleLower.includes('menuisier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f7d607f0-05be-43fc-898d-70d7b23b04dd.jpg";
    if (titleLower.includes('staffeur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3489c362-c1ae-4e34-8ea2-e5b4f37a20de.jpg";
    if (titleLower.includes('étancheur') || titleLower.includes('etancheur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/57313e9c-2768-491d-aaf8-eaec1f0c908a.jpg";
    if (titleLower.includes('poseur de portail')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1c9c07d7-c210-4a04-87ae-459b428b4565.jpg";
    if (titleLower.includes('climatisation bâtiment') || titleLower.includes('climatisation batiment') || titleLower.includes('climatisation') || titleLower.includes('clim')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/053eff8b-328c-4314-96fe-1fec715749b3.jpg";
    if (titleLower.includes('technicien forage')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/42143443-ac35-44bb-994f-dfd03705db32.jpg";
    if (titleLower.includes('constructeur maison')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3ce0a6b7-4c22-4494-840d-5dcb20755e02.jpg";
    if (titleLower.includes('finition bâtiment') || titleLower.includes('finition batiment') || titleLower.includes('finition') || titleLower.includes('βaτιμeντ') || titleLower.includes('βατιμeντ')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/52afd515-de3a-42de-b2a8-6f4f27f5d4af.jpg";

    if (titleLower.includes('vitre') || titleLower.includes('vitrier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg";
    if (titleLower.includes('caméra') || titleLower.includes('camera')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/692e8ebb-b3d7-495b-8b43-65148c4f1609.jpg";
    if (titleLower.includes('pouf')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1bd32ba7-1320-4334-bff0-8016ccb6404f.jpg";
    if (titleLower.includes('fenêtre') || titleLower.includes('porte')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5b41e300-53eb-4213-ac32-e07b1d272667.jpg";
    if (titleLower.includes('studio')) return "https://i.supaimg.com/5d6f5d3f-6e64-4291-8ce3-28cebdb6bcec.jpg";
    if (titleLower.includes('agence immobilière') || titleLower.includes('agence immobiliere')) return "https://picsum.photos/seed/immobilier/500/300";
    if (titleLower.includes('villa')) return "https://i.supaimg.com/7dd280ea-2d80-472d-9997-d6c5b3d3c53c.jpg";
    if (titleLower.includes('chambre')) return "https://i.supaimg.com/db2acfbe-b3ca-4b65-9b21-ddb0c7fcb3af.jpg";
    if (titleLower.includes('local')) return "https://i.supaimg.com/a0a75e1c-8b38-485a-8231-0a213cf10858.jpg";
    if (titleLower.includes('terrain')) return "https://i.supaimg.com/7c08d763-ce1e-44a5-b093-430cdb072ad2.jpg";
    if (titleLower.includes('magasin')) return "https://i.supaimg.com/dfdc8569-179f-4dc2-aeb9-e0757dfbc5cf.jpg";
    if (titleLower.includes('bâche') || titleLower.includes('bache')) return "https://i.supaimg.com/bcf4c081-b3ae-4759-83b5-4c79f52989ec.jpg";
    if (titleLower.includes('groupe')) return "https://i.supaimg.com/2944eab0-2074-4e61-a759-dca478289e4b.jpg";
    if (titleLower.includes('sonorisation')) return "https://i.supaimg.com/03ee9f0b-9978-48aa-a0c1-a4ee2b0efb74.jpg";
    if (titleLower.includes('table')) return "https://i.supaimg.com/6a3225ae-bdd4-40ea-95aa-51511076ec44.jpg";
    if (titleLower.includes('chaise')) return "https://i.supaimg.com/90d4d927-ad54-471b-9238-d57d11233758.jpg";

    // 3. Try key mapping back to EQUIPMENT_IMAGES
    const key = title.replace(/\s*rapide/i, '').replace(/\s*Rapide/i, '').trim();
    const directZk = EQUIPMENT_IMAGES[title] || EQUIPMENT_IMAGES[key];
    if (directZk) {
        if (Array.isArray(directZk)) return directZk[0];
        return directZk;
    }

    // Ultimate fallback image
    return "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg";
};

// --- WHATSAPP ROW COMPONENT ---
interface WhatsAppRowProps {
    item: any;
    tabId: string;
    onOpen: () => void;
}

const WhatsAppRow: React.FC<WhatsAppRowProps> = ({ item, tabId, onOpen }) => {
    const image = getServiceItemImage(item.title);
    const desc = item.description || "Service rapide et structuré de confiance.";

    const getRightLabel = () => {
        if (tabId === 'depannage') return "service";
        if (tabId === 'construction') return "service";
        if (item.price) return item.price;
        if (tabId === 'appartements') return "Exclusif";
        if (tabId === 'equipement') return "Tarif Prop.";
        return "Disponible";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onOpen}
            className="flex items-center gap-4 py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/50 active:bg-gray-100/80 transition-all cursor-pointer"
        >
            {/* Rounded avatar image */}
            <div className="relative w-14 h-14 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100/80 shadow-inner bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                        src={image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                </div>
                {/* Active/clock minibadge */}
                <div className="absolute -bottom-0.5 -right-0.5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center w-5.5 h-5.5 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            {/* Chat text contents */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight truncate pr-2">
                        {item.title}
                    </h4>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/30 whitespace-nowrap">
                        {getRightLabel()}
                    </span>
                </div>
                <div className="flex items-center text-gray-400 text-[12.5px] leading-tight font-medium">
                    {/* Read receipt checkmarks */}
                    <span className="text-[#34b7f1] text-xs font-sans font-black mr-1 flex-shrink-0 select-none">✓✓</span>
                    <p className="truncate text-gray-400 font-medium">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// --- TABS LIST ---
const TABS = [
    { id: 'depannage', label: "Dépannage" },
    { id: 'construction', label: "Construction" },
    { id: 'equipement', label: "Équipements" },
    { id: 'travailleurs', label: "Travailleurs" },
    { id: 'appartements', label: "Appartements" },
    { id: 'autres', label: "Services" }
];

interface InterventionShopScreenProps {
    onBack: () => void;
    user: User;
    category: 'intervention' | 'immobilier' | 'equipement' | 'travailleurs';
    onOpenForm: (context: any) => void;
}

const InterventionShopScreen: React.FC<InterventionShopScreenProps> = ({ onBack, user, category, onOpenForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Map initial selected tab based on outer screen context
    const getInitialTabId = (cat: string) => {
        if (cat === 'travailleurs') return 'travailleurs';
        if (cat === 'immobilier') return 'appartements';
        if (cat === 'equipement') return 'equipement';
        return 'depannage';
    };

    const [activeTabId, setActiveTabId] = useState(() => getInitialTabId(category));

    // Compile entire list of items for each tab
    const tabItems = useMemo(() => {
        switch (activeTabId) {
            case 'depannage': {
                return categoriesConfig[0]?.items || [];
            }
            case 'construction': {
                return categoriesConfig[1]?.items || [];
            }
            case 'equipement': {
                return locationRapideIntervItems;
            }
            case 'travailleurs': {
                return generalWorkerDataList;
            }
            case 'appartements': {
                return generalLocationDataList.filter(l => l.category === 'appartement');
            }
            case 'autres': {
                const cat3 = categoriesConfig[2]?.items || [];
                const cat4 = categoriesConfig[3]?.items || [];
                const cat5 = categoriesConfig[4]?.items || [];
                return [...cat3, ...cat4, ...cat5];
            }
            default:
                return [];
        }
    }, [activeTabId]);

    // Construct master flat dataset of ALL items for instant universal search
    const ALL_POSSIBLE_ITEMS = useMemo(() => {
        const list: Array<{ title: string; description: string; tabId: string; tabLabel: string; price?: string }> = [];
        
        // 1. Dépannage
        (categoriesConfig[0]?.items || []).forEach(item => {
            list.push({ ...item, tabId: 'depannage', tabLabel: 'Dépannage' });
        });

        // 2. Construction
        (categoriesConfig[1]?.items || []).forEach(item => {
            list.push({ ...item, tabId: 'construction', tabLabel: 'Construction' });
        });

        // 3. Équipements
        locationRapideIntervItems.forEach(item => {
            list.push({ ...item, tabId: 'equipement', tabLabel: 'Équipement' });
        });

        // 4. Travailleurs
        generalWorkerDataList.forEach(item => {
            list.push({ ...item, tabId: 'travailleurs', tabLabel: 'Travailleur' });
        });

        // 5. Appartements
        generalLocationDataList.filter(l => l.category === 'appartement').forEach(item => {
            list.push({ ...item, tabId: 'appartements', tabLabel: 'Appartement' });
        });

        // 6. Autres services (Nettoyage, Événementiel, Transport)
        const cat3 = categoriesConfig[2]?.items || [];
        const cat4 = categoriesConfig[3]?.items || [];
        const cat5 = categoriesConfig[4]?.items || [];
        [...cat3, ...cat4, ...cat5].forEach(item => {
            list.push({ ...item, tabId: 'autres', tabLabel: 'Service' });
        });

        return list;
    }, []);

    // Filtered items based on active search
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return tabItems.map(item => ({
                ...item,
                tabId: activeTabId,
                tabLabel: TABS.find(t => t.id === activeTabId)?.label || ''
            }));
        }
        const query = searchTerm.toLowerCase().trim();
        return ALL_POSSIBLE_ITEMS.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );
    }, [searchTerm, activeTabId, tabItems, ALL_POSSIBLE_ITEMS]);

    const handleOpenItem = (item: any, finalTabId: string) => {
        let formType: 'rapid_building_service' | 'location' | 'worker' = 'worker';
        if (finalTabId === 'depannage' || finalTabId === 'construction') {
            formType = 'rapid_building_service';
        } else if (finalTabId === 'appartements' || finalTabId === 'equipement') {
            formType = 'location';
        } else {
            formType = 'worker';
        }

        onOpenForm({
            formType,
            title: item.title,
            imageUrl: getServiceItemImage(item.title) || item.img,
            description: item.description,
            price: item.price || (formType === 'location' ? DESIGNATED_PRICE : undefined)
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[500] flex flex-col font-sans overflow-hidden"
        >
            {/* Top Bar Header (WhatsApp style) */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack} 
                        className="p-1 -ml-1 hover:bg-gray-100 rounded-full text-gray-800 transition-all active:scale-95"
                    >
                        <BackIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-[#FF8200] font-black text-2xl tracking-tighter uppercase select-none">
                        FILANT°225
                    </h1>
                </div>
                
                {/* Meta Icons for completeness */}
                <div className="flex items-center gap-4 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </div>
            </div>

            {/* Pill Search Field */}
            <div className="flex-shrink-0 px-4 pt-1 pb-2 bg-white">
                <div className="relative flex items-center bg-gray-50/90 rounded-full px-3.5 py-1.5 border border-gray-100 shadow-sm transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8200]/30 focus-within:shadow">
                    <SearchIcon className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0 transition-colors duration-200" />
                    <input 
                        type="text" 
                        placeholder="Rechercher un service ou un métier..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-transparent border-none text-gray-800 text-[13px] leading-tight focus:outline-none placeholder-gray-400/80 font-medium pr-1" 
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="p-1 -mr-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all active:scale-90 flex items-center justify-center flex-shrink-0 animate-pulse-once"
                            title="Effacer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Chat Conversation List */}
            <div className="flex-1 overflow-y-auto bg-white pb-6 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, index) => (
                        <WhatsAppRow
                            key={`${item.tabId}-${item.title}-${index}`}
                            item={item}
                            tabId={item.tabId}
                            onOpen={() => handleOpenItem(item, item.tabId)}
                        />
                    ))}
                    
                    {filteredItems.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-gray-400"
                        >
                            <span className="text-3xl block mb-2">🔍</span>
                            <p className="font-bold text-sm">Aucun service ou titre trouvé.</p>
                            <p className="text-xs text-gray-400">Veuillez ajuster votre recherche.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Horizon Navigation Tabs */}
            <div className="flex-shrink-0 bg-white border-t border-gray-100 pb-3">
                <div className="flex gap-6 overflow-x-auto px-6 py-3 scrollbar-hide items-center">
                    {TABS.map(tab => {
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setSearchTerm(''); // Reset search on tab change
                                    setActiveTabId(tab.id);
                                }}
                                className="relative flex-shrink-0 pb-1.5 focus:outline-none transition-all active:scale-95"
                            >
                                <span className={`text-[14px] font-black uppercase tracking-tight transition-colors ${isActive ? 'text-[#FF8200]' : 'text-gray-400'}`}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#FF8200] rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default InterventionShopScreen;
