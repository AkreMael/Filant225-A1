
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
    Tent
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
const batimentIntervItems = [
    { title: 'Plombier rapide', description: 'Réparation fuites d’eau et installations.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Électricien rapide', description: 'Dépannage électrique sécurisé.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Maçon rapide', description: 'Maçonnerie et rénovation rapide.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Carreleur rapide', description: 'Pose de carreaux tous formats.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Peintre bâtiment', description: 'Peinture bâtiment et finitions.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Soudeur rapide', description: 'Travaux de soudure et ferronnerie.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Menuisier aluminium', description: 'Installation portes et fenêtres alu.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg" },
    { title: 'Menuisier bois', description: 'Menuiserie bois et fabrication meubles.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg" },
    { title: 'Vitrier', description: 'Remplacement de vitres et miroiterie.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg" },
    { title: 'Staffeur', description: 'Décoration staff et faux plafonnement.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Réparation climatiseur', description: 'Dépannage et maintenance clim rapide.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg" },
    { title: 'Réparation château d’eau', description: 'Maintenance et étanchéité châteaux d’eau.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg" },
    { title: 'Pose de portail', description: 'Installation de portails et clôtures.', img: "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg" },
    { title: 'Réparation toiture', description: 'Réparation fuites et charpentes.', img: "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg" },
    { title: 'Réparation fuite d’eau', description: 'Dépannage plomberie express.', img: "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg" },
    { title: 'Dépannage maison', description: 'Petits travaux et bricolage maison.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Construction maison', description: 'Gros œuvre et construction complète.', img: "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg" },
    { title: 'Finition bâtiment', description: 'Peinture, carrelage et décoration.', img: "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg" },
    { title: 'Travaux publics', description: 'Travaux de voirie et terrassement.', img: "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg" },
    { title: 'Réparation serrure', description: 'Ouverture de porte et serrurerie.', img: "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg" },
    { title: 'Installation parabole', description: 'Pose et réglage antennes satellite.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Installation Internet maison', description: 'Configuration réseau et WiFi domicile.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Charpentier rapide', description: 'Menuiserie et charpente bois.', img: "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg" },
    { title: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg" },
    { title: 'Installateur de caméras Rapide', description: 'Installation vidéosurveillance.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg" },
    { title: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs.', img: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ebb24cd2-8a14-45c1-b273-0b4a81361c8b.jpg" },
];

const locationRapideIntervItems = [
    { title: 'Camion de campagne à louer', description: 'Camion podium sonorisé pour vos campagnes.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Camion benne à louer', description: 'Transport de sable, gravier et agrégats.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Bâche à louer', description: 'Bâches de toutes tailles pour vos fêtes.', img: EQUIPMENT_IMAGES['Bâche à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Chaise à louer', description: 'Chaises confortables pour événements.', img: "https://i.supaimg.com/90d4d927-ad54-471b-9238-d57d11233758.jpg", price: DESIGNATED_PRICE },
    { title: 'Table à louer', description: 'Tables de réception pour vos invités.', img: "https://i.supaimg.com/6a3225ae-bdd4-40ea-95aa-51511076ec44.jpg", price: DESIGNATED_PRICE },
    { title: 'Groupe électrogène à louer', description: 'Puissance garantie pour vos événements.', img: (EQUIPMENT_IMAGES['Groupe électrogène à louer'] as string[])[0], price: DESIGNATED_PRICE },
    { title: 'Bétonnière à louer', description: 'Mélange efficace pour vos travaux béton.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Échafaudage à louer', description: 'Structure sécurisée pour travaux hauteur.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Tracteur à louer', description: 'Matériel agricole pour labourage.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Mini pelle à louer', description: 'Travaux d’excavation en accès restreint.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Pelle mécanique à louer', description: 'Gros terrassement et démolition.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Sonorisation à louer', description: 'Matériel son complet pour ambiance.', img: EQUIPMENT_IMAGES['Sonorisation à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Tente événementielle à louer', description: 'Tentes grand format pour réceptions.', img: "https://i.supaimg.com/85a7fcdf-42cb-4725-821c-1e209ebabfbc.jpg", price: DESIGNATED_PRICE },
    { title: 'Véhicule de transport', description: 'Location de véhicules pour déménagement.', img: EQUIPMENT_IMAGES['Camion de campagne à louer'] as string, price: DESIGNATED_PRICE },
    { title: 'Engin de chantier', description: 'Divers engins pour chantiers BTP.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Machine de forage', description: 'Équipement pour puits et forages.', img: "https://i.supaimg.com/040c4d7c-ea5a-4489-bfc1-513ae24b4d11.jpg", price: DESIGNATED_PRICE },
    { title: 'Marteau piqueur à louer', description: 'Démolition béton et roches.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Compresseur à louer', description: 'Air comprimé pour outils pneumatiques.', img: "https://i.supaimg.com/247860e7-ea16-4347-a0f5-302a1710806a.jpg", price: DESIGNATED_PRICE },
    { title: 'Espace d’événement à louer', description: 'Salles et espaces en plein air.', img: (EQUIPMENT_IMAGES['Espace d’événement à louer'] as string[])[0], price: DESIGNATED_PRICE },
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
    if (t.includes('plombier') || t.includes('eau') || t.includes('fuite') || t.includes('château')) 
        return <Droplets className={`${iconSize} text-blue-400`} />;
    
    if (t.includes('électr') || t.includes('clim') || t.includes('parabole') || t.includes('internet')) 
        return <Zap className={`${iconSize} text-yellow-400`} />;
    
    if (t.includes('peintre') || t.includes('déco') || t.includes('finition') || t.includes('staff')) 
        return <Paintbrush className={`${iconSize} text-pink-400`} />;
    
    if (t.includes('maçon') || t.includes('carreleur') || t.includes('beton') || t.includes('construction') || t.includes('bétonnière')) 
        return <Hammer className={`${iconSize} text-orange-400`} />;
    
    if (t.includes('camion') || t.includes('véhicule') || t.includes('tracteur') || t.includes('pelle') || t.includes('engin')) 
        return <Truck className={`${iconSize} text-red-500`} />;
    
    if (t.includes('chantier') || t.includes('forage') || t.includes('piqueur') || t.includes('compresseur') || t.includes('échafaudage')) 
        return <Construction className={`${iconSize} text-stone-500`} />;
    
    if (t.includes('menuisier') || t.includes('soudeur') || t.includes('ferron') || t.includes('charpentier') || t.includes('portail')) 
        return <Scaling className={`${iconSize} text-indigo-400`} />;
    
    if (t.includes('vitr') || t.includes('fenêtre') || t.includes('porte')) 
        return <Fence className={`${iconSize} text-cyan-400`} />;
    
    if (t.includes('serrure') || t.includes('clé')) 
        return <Key className={`${iconSize} text-amber-500`} />;

    if (t.includes('camera') || t.includes('surveillance'))
        return <Tv className={`${iconSize} text-slate-600`} />;

    if (t.includes('sono') || t.includes('haut-parleur') || t.includes('baffle') || t.includes('micro') || t.includes('mégaphone'))
        return <Mic className={`${iconSize} text-purple-400`} />;

    if (t.includes('chaise') || t.includes('table') || t.includes('banc') || t.includes('matelas') || t.includes('nappe'))
        return <Utensils className={`${iconSize} text-emerald-400`} />;

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
    type: 'batiment' | 'location', 
    user: User,
    variant?: 'square' | 'horizontal',
    onOpenForm: (context: any) => void
}> = ({ item, type, user, variant = 'square', onOpenForm }) => {
    const handleOpen = () => {
        onOpenForm({
            formType: type === 'batiment' ? 'rapid_building_service' : 'location',
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
                        <h4 className="text-[13px] font-black text-gray-900 uppercase leading-tight mb-0.5 tracking-tight line-clamp-1">{item.title}</h4>
                        {type === 'batiment' ? (
                            <p className="text-[#ef4444] font-black text-[11px] leading-tight uppercase">
                                H. Descente : <span className="text-black">18h30</span>
                            </p>
                        ) : (
                            <p className="text-[#ef4444] font-black text-[11px] leading-tight uppercase">
                                Prix par jour : <span className="text-black text-[9px] leading-tight">{item.price}</span>
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
                            <div className="flex items-center gap-1 opacity-40">
                                <ShopIconSmall />
                                <span className="text-[8px] font-black uppercase tracking-wider">Filant Services</span>
                            </div>
                            <div className="flex h-3 w-3 rounded-full border-2 border-white shadow-lg animate-flash-green-red"></div>
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
                <h4 className="text-[13px] font-black text-gray-900 uppercase leading-tight mb-1.5 tracking-tight line-clamp-1">{item.title}</h4>
                {type === 'batiment' ? (
                    <p className="text-[#ef4444] font-black text-[12px] leading-tight mb-2 uppercase">
                        Heure de descente : <span className="text-black">18h30</span>
                    </p>
                ) : (
                    <p className="text-[#ef4444] font-black text-[11px] leading-tight mb-2 uppercase">
                        Prix par jour : <br/><span className="text-black text-[10px] leading-tight italic">{item.price}</span>
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
                    <div className="flex h-3.5 w-3.5 rounded-full border-2 border-white shadow-lg animate-flash-green-red"></div>
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
    const [showAllBatiment, setShowAllBatiment] = useState(false);
    const [showAllLocation, setShowAllLocation] = useState(false);
    
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const isInterventionView = category === 'intervention';

    const headerImage = useMemo(() => {
        if (category === 'intervention') return "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg";
        if (category === 'travailleurs') return "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg";
        if (category === 'immobilier') return "https://i.supaimg.com/7dd280ea-2d80-472d-9997-d6c5b3d3c53c.jpg";
        if (category === 'equipement') return "https://i.supaimg.com/03ee9f0b-9978-48aa-a0c1-a4ee2b0efb74.jpg";
        return "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg";
    }, [category]);

    const filteredIntervBat = useMemo(() => 
        batimentIntervItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]);
    const filteredIntervLoc = useMemo(() => 
        locationRapideIntervItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]);

    const classicItems = useMemo(() => {
        if (category === 'travailleurs') return generalWorkerDataList;
        if (category === 'immobilier') return generalLocationDataList.filter(l => l.category === 'appartement');
        if (category === 'equipement') return generalLocationDataList.filter(l => l.category === 'equipement');
        return [];
    }, [category]);

    const filteredClassic = useMemo(() => 
        classicItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [classicItems, searchTerm]);

    const displayBat = showAllBatiment ? filteredIntervBat : filteredIntervBat.slice(0, 3);
    const displayLoc = showAllLocation ? filteredIntervLoc : filteredIntervLoc.slice(0, 3);

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
                
                {/* Header Image Section - Matching EmbeddedForm */}
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

                {/* Content Container - Matching EmbeddedForm */}
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
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="bg-[#f97316] px-4 py-1.5 rounded-full shadow-md">
                                        <h2 className="text-[13px] font-bold text-white uppercase tracking-tight">
                                            Service du bâtiment maison rapide
                                        </h2>
                                    </div>
                                    <button onClick={() => setShowAllBatiment(!showAllBatiment)} className="text-orange-600 text-sm font-black uppercase hover:opacity-80 active:scale-95 transition-all">{showAllBatiment ? 'Moins' : 'Plus'}</button>
                                </div>
                                <div className={`${showAllBatiment ? 'grid grid-cols-1 gap-4' : 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'}`}>
                                    {displayBat.map((item, idx) => (
                                        <RapidSectionCard 
                                            key={idx} 
                                            item={item} 
                                            type="batiment" 
                                            user={user}
                                            variant={showAllBatiment ? 'horizontal' : 'square'}
                                            onOpenForm={onOpenForm}
                                        />
                                    ))}
                                    {filteredIntervBat.length === 0 && <p className="text-gray-400 text-xs italic p-4">Aucun résultat.</p>}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="bg-[#f97316] px-4 py-1.5 rounded-full shadow-md">
                                        <h2 className="text-[13px] font-bold text-white uppercase tracking-tight">
                                            Service location équipement rapide
                                        </h2>
                                    </div>
                                    <button onClick={() => setShowAllLocation(!showAllLocation)} className="text-orange-600 text-sm font-black uppercase hover:opacity-80 active:scale-95 transition-all">{showAllLocation ? 'Moins' : 'Plus'}</button>
                                </div>
                                <div className={`${showAllLocation ? 'grid grid-cols-1 gap-4' : 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'}`}>
                                    {displayLoc.map((item, idx) => (
                                        <RapidSectionCard 
                                            key={idx} 
                                            item={item} 
                                            type="location" 
                                            user={user}
                                            variant={showAllLocation ? 'horizontal' : 'square'}
                                            onOpenForm={onOpenForm}
                                        />
                                    ))}
                                    {filteredIntervLoc.length === 0 && <p className="text-gray-400 text-xs italic p-4">Aucun résultat.</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 pb-24">
                            {filteredClassic.map((item, index) => (
                                <ClassicCard 
                                    key={index}
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
