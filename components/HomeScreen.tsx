
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tab, User } from '../types';
import { History as LucideHistory, Calendar as LucideCalendar, Star as LucideStar, GraduationCap, Search, ArrowLeft, X, ChevronRight, Send } from 'lucide-react';
import MenuBackground from './common/MenuBackground';
import { databaseService, SavedContact } from '../services/databaseService';
import ScannerOverlay from './ScannerOverlay';
import { SEARCHABLE_TITLES } from './common/formDefinitions';
import { audioService } from '../services/audioService';
import { chatService } from '../services/chatService';
import { isAdmin, getCardType } from '../utils/authUtils';
import { getServiceItemImage } from './InterventionShopScreen';
import { motion, AnimatePresence } from 'motion/react';

// --- SVG Icons ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
        {children}
    </div>
);

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SendIconSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);

const InscriptionIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536" /></svg>;
const MapPinIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EmergencyIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const AssistantIcon = () => <svg className="w-6 h-6 text-white" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 12H16C13.7909 12 12 13.7909 12 16V48C12 50.2091 13.7909 52 16 52H42C44.2091 52 46 50.2091 46 48V16C46 13.7909 44.2091 12 42 12Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M29 25C31.2091 25 33 23.2091 33 21C33 18.7909 31.2091 17 29 17C26.7909 17 25 18.7909 25 21C25 23.2091 26.7909 25 29 25Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M38 42C38 37.0294 33.9706 33 29 33C24.0294 33 20 37.0294 20 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 20H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 28H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M46 36H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const SearchBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const NotificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const TikTokIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27.98-1.58 1.72-.45.91-.42 1.91-.04 2.81.37.91 1.07 1.69 1.91 2.15 1.22.69 2.72.71 3.99.14 1.1-.46 1.97-1.39 2.32-2.48.1-.34.15-.7.18-1.07.03-3.14.02-6.28.02-9.42z"/></svg>;

const ServiceRapideIcon: React.FC = () => <IconWrapper className="w-12 h-12 bg-white/20"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></IconWrapper>;
const EquipmentIcon: React.FC = () => <IconWrapper className="w-12 h-12 bg-orange-600/20"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.94-2.197 1.088-3.386l-.738-2.652L3 14l2.652.738c1.19.147 2.35.56 3.386 1.088l3.03-2.496z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21.75l-4.135-4.134a1.21 1.21 0 010-1.707l4.134-4.135a1.21 1.21 0 011.707 0l4.135 4.135a1.21 1.21 0 010 1.707l-4.134 4.135a1.21 1.21 0 01-1.707 0z" /></svg></IconWrapper>;

const StageFormationIcon: React.FC = () => <IconWrapper className="w-12 h-12 bg-orange-600/20"><GraduationCap className="h-7 w-7 text-orange-600" /></IconWrapper>;

// --- Admin Icons ---
const StorageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
const ActivationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const AssociationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const SMSAdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

const IvoryCoastFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className={className} aria-label="Drapeau Côte d'Ivoire">
        <rect width="10" height="20" x="0" fill="#FF8200" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="10" fill="#FFFFFF" />
        <rect width="10" height="20" x="20" fill="#009B77" />
    </svg>
);

const PointerArrow: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const LargeMapPinIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-indigo-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    </IconWrapper>
);

const LargeHouseIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-blue-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    </IconWrapper>
);

const LargeCarteProIcon: React.FC = () => (
    <IconWrapper className="w-14 h-14 bg-orange-600/20 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-4M9 4h6a2 2 0 012v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2zm4 8a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 16H8" />
        </svg>
    </IconWrapper>
);

// Removed ASSISTANT_IMAGE_URL and TIKTOK_IMAGE_URL

// --- DATA TRAVAILLEURS BATIMENT ---
const batimentWorkers = [
    { title: 'Plombier rapide', description: 'Réparation fuites d’eau et installations.', formType: 'rapid_building_service' },
    { title: 'Électricien rapide', description: 'Dépannage électrique sécurisé.', formType: 'rapid_building_service' },
    { title: 'Carreleur rapide', description: 'Pose de carreaux tous formats.', formType: 'rapid_building_service' },
    { title: 'Charpentier rapide', description: 'Menuiserie et charpente bois.', formType: 'rapid_building_service' },
    { title: 'Maçon rapide', description: 'Maçonnerie et rénovation rapide.', formType: 'rapid_building_service' },
    { title: 'Soudeur rapide', description: 'Travaux de soudure et ferronnerie.', formType: 'rapid_building_service' },
    { title: 'Peintre rapide', description: 'Peinture et finitions intérieures.', formType: 'rapid_building_service' },
    { title: 'Laveur de vitres Rapide', description: 'Nettoyage professionnel de vitres.', formType: 'rapid_building_service' },
    { title: 'Technicien entretien climatisation Rapide', description: 'Entretien et recharge clim.', formType: 'rapid_building_service' },
    { title: 'Installateur de caméras de surveillance Rapide', description: 'Installation vidéosurveillance.', formType: 'rapid_building_service' },
    { title: 'Fabricant de poufs Rapide', description: 'Création et réparation de poufs.', formType: 'rapid_building_service' },
    { title: 'Installateur de fenêtres et portes vitrées Rapide', description: 'Pose menuiserie et vitrerie.', formType: 'rapid_building_service' },
    { title: 'Menuisier Rapide', description: 'Menuiserie bois et meubles.', formType: 'rapid_building_service' },
    // Agence Immobilière
    { title: 'Agence Immobilière FILANT', description: 'Trouvez la maison de vos rêves avec notre catalogue exclusif de propriétés.', formType: 'location' },
    // Travailleurs qualifiés
    { title: 'Vendeuse / Vendeur', description: 'Assure la vente, l’accueil des clients et la gestion d’une boutique.', formType: 'worker' },
    { title: 'Cuisinier / Cuisinière', description: 'Prépare les repas quotidiennement pour restaurant, foyer ou entreprise.', formType: 'worker' },
    { title: 'Serveur / Serveuse', description: 'Accueille les clients, sert les plats et s’occupe des commandes.', formType: 'worker' },
    { title: 'Coiffeur / Coiffeuse', description: 'S’occupe des cheveux, coiffure, tresses et soins capillaires.', formType: 'worker' },
    { title: 'Hôtesse d’accueil', description: 'Accueille les visiteurs, gère les informations et la réception.', formType: 'worker' },
    { title: 'Chauffeur', description: '(Taxi, VTC, Entreprise) Conduit les clients ou le personnel d’un lieu à un autre.', formType: 'worker' },
    { title: 'Agent d’entretien / Femme de ménage', description: 'Nettoyeur bureaux et maisons.', formType: 'worker' },
    { title: 'Caissière / Caissier', description: 'Gère les paiements, la caisse et l’accueil dans les commerces.', formType: 'worker' },
    { title: 'Réceptionniste', description: 'Accueille les clients dans hôtels, entreprises ou agences.', formType: 'worker' },
    { title: 'Nounou / Baby-sitter', description: 'Garde les enfants, aide aux devoirs et accompagne la famille.', formType: 'worker' },
    { title: 'Jardinier', description: 'Entretient les jardins, pelouses, fleurs et espaces verts.', formType: 'worker' },
    { title: 'Couturière / Couturier', description: 'Coud, répare et crée des vêtements pour clients.', formType: 'worker' },
    { title: 'Esthéticienne', description: 'Fait les soins du visage, manucure, pédicure, beauté.', formType: 'worker' },
    { title: 'Magasinier', description: 'Gère les stocks, rangement et réception des marchandises.', formType: 'worker' },
    { title: 'Manutentionnaire', description: 'Charge, décharge et organise les marchandises.', formType: 'worker' },
    { title: 'Vigile', description: 'Sécurise l’entrée d’un commerce ou d’un bâtiment.', formType: 'worker' },
    { title: 'Aide à domicile', description: 'Services humains', formType: 'worker' },
    { title: 'Garde malade (jour / nuit)', description: 'Services humains', formType: 'worker' },
    { title: 'MANUCURE À DOMICILE RAPIDE', description: 'Soin et mise en beauté des mains et des pieds à domicile.', formType: 'worker' },
    { title: 'ESTHÉTICIENNE-MASSAGE', description: 'Soins esthétiques du corps et du visage, massages de bien-être.', formType: 'worker' },
    { title: 'MAQUILLEUSE PROFESSIONNELLE', description: 'Maquillage professionnel pour mariages, soirées et événements.', formType: 'worker' },
    { title: 'PÂTISSIÈRE', description: 'Création et préparation de pâtisseries artisanales pour événements et au quotidien.', formType: 'worker' },
    { title: 'Vente en ligne', description: 'Vend des produits via internet.', formType: 'worker' },
    { title: 'Grossiste', description: 'Fournit des produits en grande quantité aux commerçants.', formType: 'worker' },
    { title: 'Vente de vêtements', description: 'Propose des vêtements à la vente aux clients.', formType: 'worker' },
    { title: 'Cuisinier / Restaurateur', description: 'Prépare et cuisine des plats pour les clients.', formType: 'worker' },
    { title: 'Décorateur intérieur', description: 'Aménage et décore des espaces intérieurs.', formType: 'worker' },
    { title: 'Pose de faux plafond', description: 'Installe des plafond suspendus dans les maisons ou bureaux.', formType: 'worker' },
    { title: 'Community manager', description: 'Gère les réseaux sociaux pour les entreprises ou projets.', formType: 'worker' },
    { title: 'Photographe', description: 'Prend des photos pour événements ou projets.', formType: 'worker' },
    { title: 'Vidéaste / Monteur', description: 'Réalise et monte des vidéos.', formType: 'worker' },
    { title: 'Manucure / Pédicure', description: 'S’occupe des soins des mains et pieds.', formType: 'worker' },
    { title: 'Massage', description: 'Pratique des massages pour le bien-être.', formType: 'worker' },
    { title: 'Maquillage professionnel', description: 'Maquille pour événements ou spectacles.', formType: 'worker' },
    { title: 'Enseignant privé', description: 'Donne des cours particuliers aux élèves.', formType: 'worker' }
];

// --- ALL SEARCH CATEGORIES ---
const ALL_SEARCH_CATEGORIES = [
    // --- AGENCES IMMOBILIÈRES & APPARTEMENTS ---

    { 
        title: "Studio à louer", 
        description: "Recherche de studios standing, équipés, meublés ou non dans toutes les communes.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },
    { 
        title: "Villa à louer", 
        description: "Trouvez de superbes villas de standing ou des duplex spacieux pour un confort optimal.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },
    { 
        title: "Chambre-salon à louer", 
        description: "Recherche d'appartements de type 2 pièces bien placés pour étudiants ou jeunes professionnels.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },
    { 
        title: "Petit local à louer", 
        description: "Espaces commerciaux, petits bureaux de travail ou bureaux partagés pour lancer votre business.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },
    { 
        title: "Magasin à louer", 
        description: "Boutiques, magasins d'exposition ou espaces de vente dans des zones commerçantes fluides.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },
    { 
        title: "Terrain à louer ou à vendre", 
        description: "Achat, vente ou location de parcelles approuvées avec documents légaux complets.", 
        formType: 'location', 
        categoryGroup: 'Agences Immobilières' 
    },

    // --- ÉQUIPEMENTS À LOUER ---

    { 
        title: "Camion de campagne à louer", 
        description: "Camion podium équipé d'une sonorisation pour vos campagnes de sensibilisation ou publicitaires.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Bâche à louer", 
        description: "Ensemble de bâches et abris pliants pour protéger vos convives du soleil et de la pluie.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Chaise à louer", 
        description: "Chaises blanches solides et confortables pour vos réceptions, réunions et célébrations.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Table à louer", 
        description: "Sélection de tables de réception de différentes formes pour accueillir convenablement vos hôtes.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Groupe électrogène à louer", 
        description: "Alimentation électrique autonome de secours pour vos grands événements sans interruption.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },

    { 
        title: "Sonorisation à louer", 
        description: "Équipement de sonorisation de haute qualité, micros, baffles et consoles pour vos fêtes.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },

    { 
        title: "Espace d’événement à louer", 
        description: "Salles climatisées prestigieuses ou espaces extérieurs spacieux pour accueillir vos convives.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Table d’événement à louer", 
        description: "Sélection de tables rectangulaires ou rondes avec nappages élégants pour réceptions.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Chaise d’événement à louer", 
        description: "Chaises pliantes, vip ou banquet pour asseoir convenablement tous vos invités.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Écran géant à louer", 
        description: "Écran LED géant pour des présentations de vidéos, de matchs ou de clips d'événements.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Podium à louer", 
        description: "Location d'installations scéniques ou de podiums sécurisés pour artistes et présentations.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Poubelle mobile à louer", 
        description: "Supports de sacs et containers mobiles pour garantir la propreté lors de vos grands rassemblements.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Mégaphone à louer", 
        description: "Mégaphone à sirène et voix forte, idéal pour guider les foules et animer vos ventes de rue.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Échelle pliante (petite) à louer", 
        description: "Échelle télescopique légère à emporter partout pour vos interventions techniques en hauteur.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Corde / rallonge corde à louer", 
        description: "Lignes de cordage solides en nylon et extensions spéciales de suspension de charge pour chantiers.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Nappe de table à louer", 
        description: "Nappes de tissu de grande qualité et chemins de table colorés pour habiller vos buffets.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Tapis à louer", 
        description: "Tapis VIP rouge ou coloré haute densité pour accueillir vos convives dès le hall d'entrée.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Distributeur d’eau à louer", 
        description: "Fontaines d’eau de comptoir ou sur stand distribuant eau fraîche et eau chaude filtrée.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },

    { 
        title: "Microphone événement à louer", 
        description: "Système professionnel double HF micro serre-tête ou micro baladeur pour vos conférences.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Haut-parleur / baffle Bluetooth à louer", 
        description: "Baffle autonome sur batterie avec connexion Bluetooth facile et port USB pour micro.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Projecteur LED portable à louer", 
        description: "Projecteur autonome sur batterie d'éclairage puissant pour chantiers nocturnes ou jardins.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Lampe éclairage forte à louer", 
        description: "Ampoules et installations de haute luminosité suspendues pour vos chantiers ou stands d'accueil.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Glacière à louer", 
        description: "Glacière isotherme à poignées de grande contenance pour conserver vos boissons et glaçons.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Tente pliante (petite) à louer", 
        description: "Barnum pliant léger en aluminium idéal pour protéger vos stands de foire.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Parasol à louer", 
        description: "Parasols larges de terrasse de café adaptés à la protection du soleil en extérieur.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Banc à louer", 
        description: "Bancs de kermesse pliants en bois résistant pour des repas de fête collectifs faciles.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Chaise pliante à louer", 
        description: "Chaises pliables légères faciles à stocker et manipuler pour toutes vos réceptions.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Table en bois à louer", 
        description: "Tables pliantes solides en bois massif avec piétement métallique très stable.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Bâche (petite / moyenne) à louer", 
        description: "Bâche étanche moyenne idéale pour couvrir bois ou équipement sensible du vent.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },
    { 
        title: "Matelas une place à louer", 
        description: "Matelas d'appoint d'une personne propre et désinfecté pour vos visites temporaires.", 
        formType: 'location', 
        categoryGroup: 'Équipements à louer' 
    },

    // --- TRAVAILLEURS QUALIFIÉS (Bâtiment Rapide / Dépannage urgent) ---
    { 
        title: "Plombier rapide", 
        description: "Réparation instantanée des fuites, installation de robinetterie et tuyauteries de salle de bain.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Électricien rapide", 
        description: "Interventions rapides sur court-circuit, installations de luminaires, tableaux et sécurisation.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Carreleur rapide", 
        description: "Pose rapide et impeccable de sols, carreaux, faïence de tout format et mosaïque.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Charpentier rapide", 
        description: "Assemblages de structures bois, charpentes d'habitations et escaliers extérieurs.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Maçon rapide", 
        description: "Construction de cloisons, reprises de murs, coulage de dalles rapides et enduits.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Soudeur rapide", 
        description: "Travaux de ferronnerie, soudure de charpente métallique et sécurité de portail urgents.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Peintre rapide", 
        description: "Application rapide de couches de vernis, peinture intérieure et enduit de finition mural.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Laveur de vitres Rapide", 
        description: "Nettoyage en hauteur ou standard de vos baies vitrées et vitrines de commerces.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Technicien entretien climatisation Rapide", 
        description: "Dépannage, nettoyage complet, décrassage et recharge de fluide pour climatiseurs.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Installateur de caméras de surveillance Rapide", 
        description: "Configuration de kits de caméras et réglages d'applications de monitoring et sécurité.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Fabricant de poufs Rapide", 
        description: "Création, re-remplissage et réparation rapide de fauteuils poires et poufs d'intérieur.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Installateur de fenêtres et portes vitrées Rapide", 
        description: "Remplacement rapide de vitrages brisés et pose de baies et portes fenêtres d'accès.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Menuisier Rapide", 
        description: "Dépannage de meubles brisés, réglage de gonds de portes et charnières de cuisine.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Serrurier rapide", 
        description: "Ouverture de porte bloquée en urgence, blindage simple et changement de cylindre.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Vitrier rapide", 
        description: "Installation, découpe et remplacement urgent de carreaux tous types (simple, double vitrage).", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Réparation climatiseur rapide", 
        description: "Diagnostic de panne, compresseur HS et dépannage urgent de split-système.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Réparation frigo rapide", 
        description: "Désactivation des alarmes de température, recharge de gaz de compresseurs de réfrigérateurs.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Réparation machine à laver rapide", 
        description: "Débouchage de pompe de vidange, changement de tambour et déblocage de hublot.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },

    { 
        title: "Dépannage parabole rapide", 
        description: "Amélioration du signal satellite, réglage ou déplacement d'antenne suite à intempéries.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Dépannage groupe électrogène rapide", 
        description: "Intervention rapide pour démarrage impossible, filtre bouché ou problème d'alternateur.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Dépannage auto rapide", 
        description: "Dépannage de batterie à plat, diagnostic mécanique rapide ou crevaison sur place.", 
        formType: 'rapid_building_service', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },

    // --- OTHER CONSTRUCTION WORKERS ---
    { 
        title: "Ferrailleur", 
        description: "Façonnage et assemblage de fer à béton armé pour semelles, poteaux et linteaux.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Coffreur", 
        description: "Conception de structures temporaires en bois ou métal pour guider le coulage de béton.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Staffeur", 
        description: "Pose d'éléments d'ornement en staff, création de faux-plafonds décoratifs moulés en plâtre.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Étancheur", 
        description: "Prévention des infiltrations de pluie et colmatage de toitures terrasses d'immeubles.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Poseur de portail", 
        description: "Fixation, réglage et calage de portails robustes battants ou coulissants.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Climatisation bâtiment", 
        description: "Réseau global de gaines pour VMC, extraction forces et climatisation globale d'immeubles.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Technicien forage", 
        description: "Creusement de puits d'eau de grande profondeur avec pompes immergées de relevage.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Constructeur maison", 
        description: "Maîtrise d'œuvre générale pour piloter les chantiers de construction de votre future villa.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Finition bâtiment", 
        description: "Ensemble des opérations d'enduits de finition fins et lessivages pour la remise des clés.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },

    // --- NETTOYAGE & ENTRETIEN ---
    { 
        title: "Technicien de surface", 
        description: "Spécialiste de la désinfection des sols à fort passage et de l'astiquage professionnel.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Nettoyage maison", 
        description: "Formule de grand ménage de printemps, lessivage intensif et lavage approfondi à domicile.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Nettoyage bureau", 
        description: "Entretien régulier de bureaux, vidage de corbeilles et nettoyage de matériel de bureau.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Nettoyage chantier", 
        description: "Évacuation de gravats lourds et grattage de traces de colle suite à la pose de carrelage.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Lavage automobile", 
        description: "Soin intérieur et lustrage carrosserie avec aspirateur professionnel de véhicule chez vous.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Désinfection", 
        description: "Pulvérisation de produits bactéricides ou de lutte contre les nuisibles de locaux et maisons.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Entretien jardin", 
        description: "Arrosage soigné, débroussaillage de friches et élagage régulier d'arbres à fleurs et pelouse.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Entretien piscine", 
        description: "Ajustement du taux de chlore, nettoyage du panier de skimmer et brossage de ligne d'eau.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },

    // --- AUTRES SERVICES & MÉTIERS ---
    { 
        title: "Vendeuse / Vendeur", 
        description: "Personnel qualifié pour la vente directe, les caisses de boutiques ou de rayons.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Cuisinier / Cuisinière", 
        description: "Chef à domicile ou cuisinier pour vos événements, buffets et plats quotidiens.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Serveur / Serveuse", 
        description: "Service impeccable de table et accueil professionnel pour restaurants ou soirées.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Coiffeur / Coiffeuse", 
        description: "Soin des cheveux, tresses africaines, coiffure homme ou femme professionnelle.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Hôtesse d’accueil", 
        description: "Service de réception, orientation des invités et assistance événementielle.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Chauffeur", 
        description: "Chauffeur titulaire de permis toutes catégories pour déplacements de personnes.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Agent d’entretien / Femme de ménage", 
        description: "Nettoyage professionnel de maisons, villas ou bureaux à fréquence choisie.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Caissière / Caissier", 
        description: "Agent d'encaissement formé à la gestion des caisses enregistreuses et terminaux.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Réceptionniste", 
        description: "Accueil physique, gestion de standard et coordination de séjours hôteliers.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Esthéticienne", 
        description: "Spécialiste de la beauté de la peau, des ongles et de l'épilation.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Nounou / Baby-sitter", 
        description: "Garde attentive et éducative de vos enfants à domicile, en journée ou en soirée.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Jardinier", 
        description: "Taille de haies, soins des plantes et de la pelouse pour vos villas.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Couturière / Couturier", 
        description: "Stylisme, couture traditionnelle ou moderne et retouches de vêtements.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Magasinier", 
        description: "Rangement de palettes, vérification de bons de commande et surveillance de stocks.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Manutentionnaire", 
        description: "Chargement de camions, manutentions d'objets lourds et assistance physique sur chantiers.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Vigile", 
        description: "Surveillance de jour comme de nuit d'accès physiques, ronde de sûreté d'immeubles.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "MANUCURE À DOMICILE RAPIDE", 
        description: "Soin et mise en beauté rapide de vos mains et ongles directement chez vous.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "ESTHÉTICIENNE-MASSAGE", 
        description: "Soins esthétiques du corps, massages de relaxation et gommages de peau.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "MAQUILLEUSE PROFESSIONNELLE", 
        description: "Maquillages d'événements, mariages, soirées et séances de shooting photo.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "PÂTISSIÈRE", 
        description: "Confection de gâteaux d'anniversaire personnalisés, de pièces montées ou de gaufres.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Décorateur", 
        description: "Mise en scène d'espaces, agencements de rideaux et installations festives hôtelières.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "DJ", 
        description: "Animation musicale tous genres de vos soirées, mariages et fêtes.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Sonorisateur", 
        description: "Régisseur technique son, équilibrage acoustique de scènes ou podiums.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Organisateur événementiel", 
        description: "Coordination et organisation complète de cérémonies, mariages et réceptions complexes.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Photographe", 
        description: "Prises de vues professionnelles et retouche d'images pour immortaliser vos célébrations.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Vidéaste", 
        description: "Réalisation de clips vidéo, montages professionnels et enregistrements d'événements.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Déménageur", 
        description: "Assistance au port des cartons et sécurisation des meubles fragiles lors du transfert.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Livreur", 
        description: "Livreur à moto ou véhicule léger pour acheminer repas ou paquets à Abidjan et partout.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Transport marchandises", 
        description: "Acheminement logistique et livraison routière de marchandises d'entreprises.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Transport matériaux", 
        description: "Livraison de ciment, briques, sable et graviers sur vos chantiers de construction.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Transport déménagement", 
        description: "Solution logistique complète avec grand camion adapté aux déménagements de villas.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Manucure / Pédicure", 
        description: "S’occupe des soins des mains et des pieds pour votre beauté.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Massage", 
        description: "Pratique des massages pour un soulagement ou une récupération musculaire.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Maquillage professionnel", 
        description: "Maquillages artistiques haut de gamme pour vos événements ou séances média.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Enseignant privé", 
        description: "Donne des cours d'appui et soutiens scolaires réguliers dans différentes matières scolaire.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Community Manager", 
        description: "Gestion de vos réseaux sociaux, création de contenu régulier et animation de communauté.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Agent de Vente en ligne", 
        description: "Gestion de commandes e-commerce, relation client digitale et suivi de colis.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Grossiste", 
        description: "Recherche ou relation grossiste pour vos approvisionnements en gros au meilleur prix.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Vendeuse de vêtements", 
        description: "Spécialiste de la vente en boutique de vêtements, conseils en styles et cabines.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Poseur de faux plafond", 
        description: "Conception et installation de faux-plafonds, plaques de plâtre et habillage spots.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    },
    { 
        title: "Aide à domicile / Garde malade", 
        description: "Assistance bienveillante à domicile pour personnes âgées ou malades en convalescence.", 
        formType: 'worker', 
        categoryGroup: 'Travailleurs Qualifiés' 
    }
];

const getCategoryCardImage = (title: string): string => {
    const lower = title.toLowerCase();
    
    if (lower.includes('stage')) {
        return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=500";
    }
    if (lower.includes('formation')) {
        return "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=500";
    }
    
    return getServiceItemImage(title);
};


// --- COMPONENT CAROUSEL ---
const BuildingCarousel: React.FC<{ onSelectItem: (item: any) => void }> = ({ onSelectItem }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isUserInteracting, setIsUserInteracting] = useState(false);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || isUserInteracting) return;

        const scrollStep = () => {
            if (!scrollContainer) return;
            if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth)) {
                scrollContainer.scrollLeft = 0;
            } else {
                scrollContainer.scrollLeft += 0.8; // Vitesse de défilement douce
            }
        };

        const intervalId = window.setInterval(scrollStep, 30);
        return () => window.clearInterval(intervalId);
    }, [isUserInteracting]);

    return (
        <div className="w-full pt-1 pb-4 overflow-hidden">
            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-4 scrollbar-hide"
                onTouchStart={() => setIsUserInteracting(true)}
                onTouchEnd={() => setIsUserInteracting(false)}
                onMouseDown={() => setIsUserInteracting(true)}
                onMouseUp={() => setIsUserInteracting(false)}
                onMouseLeave={() => setIsUserInteracting(false)}
            >
                {batimentWorkers.map((item, idx) => {
                    const imgUrl = getServiceItemImage(item.title);
                    return (
                        <div 
                            key={idx}
                            onClick={() => onSelectItem(item)}
                            className="flex-shrink-0 w-[160px] bg-white rounded-[2rem] overflow-hidden shadow-xl flex flex-col transition-all relative border border-gray-100"
                        >
                            <div className="p-2">
                                <div className="h-[100px] w-full rounded-2xl overflow-hidden relative shadow-inner bg-slate-50 border border-gray-100 flex items-center justify-center">
                                    {imgUrl ? (
                                        <img 
                                            src={imgUrl} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <UserCircleIcon className="w-12 h-12 text-slate-400" />
                                    )}
                                </div>
                            </div>
                            <div className="px-4 pb-4 flex flex-col text-left">
                                <h4 className="text-[12px] font-black text-gray-900 uppercase leading-tight mb-1 tracking-tight truncate">{item.title}</h4>
                                <p className="text-[#ef4444] font-black text-[10px] leading-tight mb-1.5 uppercase">
                                    H. Descente : <span className="text-black font-bold">18h30</span>
                                </p>
                                <p className="text-[9px] text-gray-400 leading-snug italic line-clamp-2 mb-2">
                                    {item.description}
                                </p>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Filant Services</span>
                                    <div className="flex h-2.5 w-2.5 rounded-full border-2 border-white shadow-md animate-flash-green-red"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface HomeScreenProps {
  onNavigate: (view: 'worker_list' | 'location_hub' | 'location_map' | 'notifications' | 'emergency_form' | 'assistant_qr' | 'stage_formation_hub', category?: 'appartement' | 'equipement') => void;
  user: User;
  setActiveTab: (tab: Tab) => void;
  onOpenBuildingService: (item: any) => void;
  onRestrictedAccess: (message?: string) => void;
  onOpenFavorites?: () => void;
  onShowPopup: (
    msg: string, 
    type: 'alert' | 'confirm', 
    onConfirm?: (close: () => void, setLoading: (l: boolean) => void) => void,
    confirmLabel?: string,
    cancelLabel?: string
  ) => void;
  onRegisterDirectly?: (type: string) => void;
  onTriggerClosedNotification?: () => void;
  unreadChatCount?: number;
  unreadNotifCount?: number;
  deferredPrompt: any;
  onInstallPWA: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNavigate, 
  user, 
  setActiveTab, 
  onOpenBuildingService, 
  onRestrictedAccess, 
  onOpenFavorites, 
  onShowPopup, 
  onRegisterDirectly, 
  unreadChatCount = 0,
  unreadNotifCount = 0,
  deferredPrompt,
  onInstallPWA
}) => {
  const isMainServiceOpen = true;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNoOffer, setShowNoOffer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- CONVERSATIONAL ASSISTANT STATES ---
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [matchedResult, setMatchedResult] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState<{ min: number; sec: number } | null>(null);

  const isClientMode = user.role === 'Client';

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const isCardExpired = false;
  const cardData = null;

  const handleMainServiceClick = (view: 'worker_list' | 'location_hub' | 'location_map' | 'notifications' | 'emergency_form' | 'assistant_qr' | 'stage_formation_hub', category?: 'appartement' | 'equipement') => {
      onNavigate(view, category);
  };

  const handleSelectCategory = (item: any) => {
      setIsSearchOverlayOpen(false);
      onOpenBuildingService({
          title: item.title,
          description: item.description,
          formType: item.formType,
          img: getCategoryCardImage(item.title)
      });
  };

  const filteredCategories = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return ALL_SEARCH_CATEGORIES;
      return ALL_SEARCH_CATEGORIES.filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q) ||
          item.categoryGroup.toLowerCase().includes(q)
      );
  }, [searchQuery]);

  const formattedDate = useMemo(() => {
    const dayName = currentTime.toLocaleDateString('fr-FR', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNum = currentTime.toLocaleDateString('fr-FR', { day: '2-digit' });
    return `${capitalizedDay} ${dayNum}`;
  }, [currentTime]);
  
  const isClient = true; // Forcé car l'app est maintenant Client-only
  const isEntreprise = false;
  const isTravailleur = false;
  const isProprietaire = false;
  const isAgence = false;
  
  const isProRole = false;
  const isGroupA = true;

  const menuTitle = "Mise en relation & Solutions";

  const handleScanResult = (data: string) => {
    setShowScanner(false);
    const parseKeyValue = (text: string, key: string) => {
        const regex = new RegExp(`${key}\\s*[:=]\\s*([^\\n]+)`, 'i');
        return text.match(regex)?.[1]?.trim();
    };
    const sanitizePhoneNumber = (phone: string): string => {
        if (!phone) return '';
        let cleanPhone = phone.replace(/[\s-.]/g, '');
        if (cleanPhone.startsWith('+225')) cleanPhone = cleanPhone.slice(4);
        return cleanPhone;
    };

    const title = parseKeyValue(data, 'Poste') || parseKeyValue(data, 'Titre') || 'Assistant QR';
    const name = parseKeyValue(data, 'Nom') || parseKeyValue(data, 'Prénom') || 'Travailleur';
    const phone = parseKeyValue(data, 'Tél') || parseKeyValue(data, 'Phone') || parseKeyValue(data, 'WhatsApp') || parseKeyValue(data, 'Téléphone');
    const city = parseKeyValue(data, 'Ville') || parseKeyValue(data, 'Localité') || parseKeyValue(data, 'Commune') || 'Non spécifiée';
    const details = parseKeyValue(data, 'Details') || parseKeyValue(data, 'Infos') || parseKeyValue(data, 'Détails');

    let info: any = null;
    if (name && phone) {
        info = { name, phone: sanitizePhoneNumber(phone), city, title, details };
    }

    if (info) {
        const currentContacts = databaseService.getContacts(user.phone);
        const newContact: SavedContact = {
            id: Date.now().toString(),
            title: info.title || 'Assistant QR',
            name: info.name,
            phone: info.phone,
            city: info.city,
            review: info.details || info.city 
        };
        const updatedContacts = [...currentContacts, newContact];
        
        // Enregistrement individuel proactif pour garantir la persistence et visibilité admin
        databaseService.saveIndividualScan(user, newContact);
        databaseService.saveContacts(user.phone, updatedContacts, user);
        
        onShowPopup("Information validée et intégrée dans l'Assistance QR !", "alert");
    } else {
        onShowPopup("Le format du code QR n'a pas pu être structuré automatiquement.", "alert");
    }
  };

  const handleSearchSubmit = async () => {
    const val = searchTerm.trim().toLowerCase();
    if (!val) return;

    setIsSearchSubmitted(true);
    setIsAssistantThinking(true);
    setMatchedResult(null);
    setAssistantText(''); 

    const match = SEARCHABLE_TITLES.find(item => 
        val.includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(val)
    );

    const response = await chatService.getHomeAssistantAdvice(searchTerm);
    
    setIsAssistantThinking(false);
    setAssistantText(response);
    audioService.speak(response);

    if (match && val.length > 2) {
        setMatchedResult(match);
    }
    
    setSearchTerm('');
  };

  const handleCancelSearch = () => {
    setIsSearchSubmitted(false);
    setAssistantText('');
    setMatchedResult(null);
    setSearchTerm('');
    audioService.cancel();
  };

  const handleSelectSearchResult = (item: any) => {
    const event = new CustomEvent('trigger-interactive-modal', { 
        detail: { title: item.title, formType: item.type } 
    });
    handleCancelSearch();
    handleMainServiceClick(item.type === 'worker' ? 'worker_list' : 'location_hub');
  };

  const bgClass = isClient ? 'bg-white' : 'bg-orange-500';
  const textClass = isClient ? 'text-slate-900' : 'text-white';

  if (showNoOffer) {
    return (
        <div className="absolute inset-0 z-[600] bg-orange-500 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <button 
                onClick={() => setShowNoOffer(false)}
                className="absolute top-8 left-8 p-3 bg-white/20 rounded-full text-white active:scale-90 transition-transform"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] border border-white/20 shadow-2xl text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-white font-black text-2xl uppercase tracking-tighter leading-tight">
                    Aucune offre disponible pour le moment
                </p>
            </div>
            <p className="mt-8 text-white/60 font-bold uppercase tracking-widest text-[10px]">Filant°225 • Service Client</p>
        </div>
    );
  }

  return (
    <div className={`${bgClass} ${textClass} min-h-full flex flex-col font-sans relative`}>
      
      <MenuBackground />
      
      <div className="relative z-10 flex flex-col w-full">
      
        <header className="pt-5">
            <div className="flex justify-between items-center px-4 h-20">
                <div className="flex items-center gap-1.5 relative flex-1">
                    <div className="flex items-center gap-2">
                         <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-lg border border-orange-500/10 p-0.5 overflow-hidden">
                             <img src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/49d4592c-b74d-4904-b209-a32e8c921f1b.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         </div>
                         <h2 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">FILANT°225</h2>
                    </div>
                </div>

                <div className="flex items-center space-x-1.5">
                    <div className={`px-3 py-1 border-2 border-slate-200 rounded-lg text-sm font-bold ${isClient ? 'text-slate-900 border-slate-200' : 'text-white border-white'} font-mono tracking-wider select-none bg-white/5 shadow-sm`}>
                        {formattedDate}
                    </div>
                    {!isAdmin(user) && (
                        <button 
                            onClick={() => handleMainServiceClick('notifications')}
                            className="relative active:scale-90 transition-transform focus:outline-none"
                            aria-label="Notifications"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                unreadNotifCount > 0 ? 'animate-blink-red-green' : ''
                            }`}>
                                <NotificationIcon />
                            </div>
                            {unreadNotifCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full border border-white shadow-sm">
                                    {unreadNotifCount}
                                </span>
                            )}
                        </button>
                    )}
                    {isAdmin(user) ? (
                        <button 
                            onClick={() => onNavigate('admin_dashboard')}
                            className="active:scale-90 transition-transform shadow-lg focus:outline-none"
                            aria-label="Dashboard Administrateur"
                        >
                            <IvoryCoastFlagIcon className="h-6 w-9 rounded-sm" />
                        </button>
                    ) : (
                        <IvoryCoastFlagIcon className="h-6 w-9 rounded-sm shadow-sm" />
                    )}
                </div>
            </div>

            <div className={`bg-white/10 backdrop-blur-md my-4 p-6 border-y ${isClient ? 'border-slate-200' : 'border-white/10'} overflow-hidden`}>
                <div className="flex flex-col items-center">
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter flex items-center justify-center flex-nowrap whitespace-nowrap">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center bg-orange-600 text-white rounded-2xl shadow-xl mr-3">
                            <span className="font-black text-4xl sm:text-5xl">F</span>
                        </div>
                        <div className="flex">
                            {"FILANT".split("").map((letter, idx) => (
                                <span 
                                    key={idx} 
                                    className="text-green-500 drop-shadow-[0_2px_10px_rgba(34,197,94,0.4)] animate-logo-letter"
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    {letter}
                                </span>
                            ))}
                        </div>
                        <span className="text-white bg-orange-600 rounded-lg px-3 py-1 text-4xl sm:text-5xl ml-2 shadow-xl select-none animate-logo-225">225</span>
                    </h1>
                    <p className={`font-black text-xs mt-3 text-center uppercase tracking-[0.3em] ${isClient ? 'text-slate-400' : 'opacity-80'}`}>{menuTitle}</p>
                </div>
            </div>
            
            <div className="flex justify-between items-end px-4">
            <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Session active</p>
                <p className="text-lg font-bold capitalize">
                    {user.name} <span className="text-xs font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-1">Client</span>
                </p>
                <p className="text-sm font-medium">{user.city} <span className="text-green-400 font-bold animate-pulse ml-2">• EN LIGNE</span></p>
            </div>
            <div className="flex items-start space-x-3">
                <a href="https://www.tiktok.com/@filant225" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center space-y-1 group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-full shadow-lg transform group-hover:scale-110 transition-all duration-300 flex items-center justify-center text-white">
                        <TikTokIcon />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">TikTok</span>
                </a>

                <button 
                    onClick={() => setActiveTab(Tab.UserChat)}
                    className="flex flex-col items-center space-y-1 group relative"
                >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform group-hover:scale-110 relative overflow-hidden ${
                        unreadChatCount > 0 ? 'animate-blink-red-green' : 'bg-blue-600'
                    }`}>
                        <ChatBubbleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Messages</span>
                    {unreadChatCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center px-1 bg-red-600 shadow-xl z-20">
                            <span className="text-[9px] font-black text-white leading-none">{unreadChatCount}</span>
                        </div>
                    )}
                </button>

                <button 
                    onClick={() => handleMainServiceClick('assistant_qr')}
                    className="flex flex-col items-center space-y-1 group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-full shadow-lg transform group-hover:scale-110 transition-transform flex items-center justify-center">
                        <AssistantIcon />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Assistant QR</span>
                </button>

                <button 
                    onClick={() => handleMainServiceClick('emergency_form')}
                    className="flex flex-col items-center space-y-1 group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-600 rounded-full shadow-lg transform group-hover:scale-110 transition-transform border border-red-400 animate-pulse flex items-center justify-center">
                        <EmergencyIcon />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600">Urgence</span>
                </button>
            </div>
            </div>

            <div className="px-4 mt-6">
                <div className={`h-px bg-gradient-to-r from-transparent ${isClient ? 'via-slate-200' : 'via-white/30'} to-transparent`}></div>
            </div>
        </header>

        <main className="w-full p-4 flex flex-col gap-0 pb-12">
            {/* PWA Install Banner */}
            {deferredPrompt && (
                <div className="mb-6 animate-in slide-in-from-top duration-500">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2rem] p-5 shadow-xl border-4 border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                                <span className="text-orange-600 font-black text-3xl">F</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-black text-lg uppercase leading-tight tracking-tighter">Installer l'application</h3>
                                <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mt-0.5">Accès rapide & Notifications</p>
                            </div>
                            <button 
                                onClick={onInstallPWA}
                                className="bg-white text-orange-600 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-90 transition-all hover:bg-orange-50"
                            >
                                Installer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleMainServiceClick('worker_list')} 
                        className={`aspect-square bg-white text-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xl transform active:scale-95 transition-all border-2 border-green-500 relative overflow-hidden group`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="absolute top-[-16px] left-[-16px] right-[-16px] h-1.5 bg-green-500"></div>
                            <ServiceRapideIcon />
                            <span className="text-sm font-black uppercase mt-3 tracking-tight">Travailleurs Qualifiés</span>
                            <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-green-100 text-green-700`}>
                                Disponibles
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => handleMainServiceClick('location_hub', 'appartement')} 
                        className={`aspect-square bg-white text-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xl transform active:scale-95 transition-all border-2 border-blue-500 relative overflow-hidden group`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="absolute top-[-16px] left-[-16px] right-[-16px] h-1.5 bg-blue-600"></div>
                            <LargeHouseIcon />
                            <span className="text-sm font-black uppercase mt-3 tracking-tight">Location d'appartements</span>
                            <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-blue-100 text-blue-700`}>
                                Voir offres
                            </div>
                        </div>
                    </button>
                </div>

                <div 
                    onClick={() => {
                        setIsSearchOverlayOpen(true);
                        setSearchQuery('');
                    }}
                    className="py-2 w-full flex justify-center cursor-pointer active:scale-[0.97] transition-all"
                >
                    <div className="w-64 h-1.5 rounded-full bg-animated-search-border animate-search-border-flow shadow-lg"></div>
                </div>

                {!isSearchSubmitted && (
                    <BuildingCarousel onSelectItem={(item) => onOpenBuildingService(item)} />
                )}

                <button 
                    onClick={() => handleMainServiceClick('location_hub', 'equipement')} 
                    className={`w-full bg-white text-slate-900 rounded-3xl p-5 flex items-center justify-between shadow-xl transform active:scale-[0.98] transition-all border-2 border-green-500`}
                >
                    <div className="flex items-center space-x-4 text-left">
                        <EquipmentIcon />
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-black uppercase tracking-tight leading-none">Location d’équipements</span>
                            <span className="text-[10px] opacity-80 mt-1 font-bold text-gray-500">Matériels, sonorisation, baches et plus</span>
                        </div>
                    </div>
                    <div className={`p-2 rounded-full bg-orange-100 text-orange-600`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>

                <button 
                    onClick={() => handleMainServiceClick('stage_formation_hub')} 
                    className="w-full bg-slate-900 text-white rounded-3xl p-5 flex items-center justify-between shadow-xl transform active:scale-[0.98] transition-all border-2 border-orange-500 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="flex items-center space-x-4 text-left relative z-10">
                        <StageFormationIcon />
                        <div className="flex flex-col items-start font-sans">
                            <span className="text-lg font-black uppercase tracking-tight leading-none text-orange-400">Stage & Formation</span>
                            <span className="text-[10px] text-gray-300 mt-1 font-bold">Devenez plus professionnel dans votre activité</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-full bg-orange-500 text-slate-950 relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-[2.5]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            </div>
        </main>
      </div>

      {showScanner && <ScannerOverlay onScan={handleScanResult} onClose={() => setShowScanner(false)} />}

      {/* --- FLOATING CATEGORIES SEARCH OVERLAY --- */}
      <AnimatePresence>
        {isSearchOverlayOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-0 z-[150] bg-slate-50 flex flex-col overflow-hidden"
          >
            {/* Overlay Header with search bar rising upwards */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 bg-white border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
                <button 
                    onClick={() => {
                        setIsSearchOverlayOpen(false);
                        setSearchQuery('');
                    }}
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 transition-all flex items-center justify-center shadow-inner"
                    aria-label="Retour"
                >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                
                {/* Visual rise/animating search bar */}
                <div className="relative flex-1 h-11 rounded-full p-[2.5px] overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-animated-search-border animate-search-border-flow"></div>
                    <div className="relative w-full h-full bg-[#3d4234] rounded-full flex items-center px-4 gap-2 shadow-inner">
                        <div className="w-1 h-5 bg-white animate-search-cursor-color rounded-full"></div>
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Qu'est-ce que vous recherchez?..."
                                className="bg-transparent border-none outline-none text-white/95 font-bold text-xs tracking-tight truncate w-full placeholder-white/40 lowercase"
                                autoFocus
                            />
                            {searchQuery.trim().length > 0 && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 rounded-full bg-white/20 hover:bg-white/35 text-white/80 active:scale-90 ml-1"
                                >
                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Scroll Categories interface */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-20 scrollbar-none">
                <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {filteredCategories.length} {filteredCategories.length > 1 ? 'catégories trouvées' : 'catégorie trouvée'}
                    </p>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-full transition-colors ml-auto"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>

                {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {filteredCategories.map((item, index) => {
                            const itemImage = getCategoryCardImage(item.title);
                            const isStageOrFormation = item.formType === 'stage' || item.formType === 'formation';
                            const isEquipement = item.categoryGroup === 'Équipements à louer';
                            const isImmobilier = item.categoryGroup === 'Agences Immobilières';
                            
                            const groupColorClass = isStageOrFormation 
                                ? 'text-orange-600 bg-orange-50/95 ring-1 ring-orange-500/10' 
                                : isEquipement 
                                ? 'text-purple-600 bg-purple-50/95 ring-1 ring-purple-500/10'
                                : isImmobilier
                                ? 'text-blue-600 bg-blue-50/95 ring-1 ring-blue-500/10'
                                : 'text-green-600 bg-green-50/95 ring-1 ring-green-500/10';

                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                    className="rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-2.5 flex flex-col justify-between relative overflow-hidden group border-b-[3px] hover:border-b-orange-500"
                                >
                                    {/* Image Container with category group badge overlay at top left */}
                                    {itemImage && (
                                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative shadow-sm flex-shrink-0 bg-slate-50 border border-slate-100">
                                            <img 
                                                src={itemImage} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                referrerPolicy="no-referrer"
                                            />
                                            {/* Badge Overlaid nicely */}
                                            <div className="absolute top-1.5 left-1.5 z-10">
                                                <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs backdrop-blur-md ${groupColorClass} ring-1 ring-white/10`}>
                                                    {item.categoryGroup}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 flex flex-col justify-between pt-2">
                                        <div className="flex flex-col">
                                            <h3 className="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-orange-500 transition-colors duration-300 line-clamp-2 leading-tight min-h-[1.75rem]">
                                                {item.title}
                                            </h3>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1 line-clamp-2 leading-tight min-h-[2.25rem]">
                                                {item.description}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-2.5">
                                            <button
                                                onClick={() => handleSelectCategory(item)}
                                                className="w-full py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xs active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                                            >
                                                <Send className="w-2.5 h-2.5 fill-white stroke-[2.5]" />
                                                <span>Demande</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-tight">Aucun service trouvé</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2 max-w-xs leading-relaxed">
                            Nous n'avons trouvé aucun résultat pour "{searchQuery}". Essayez avec un autre terme comme "plombier" ou "studio".
                        </p>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .text-outline-white {
          text-shadow: 1px 1px 0 #FFFFFF, -1px -1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px 1px 0 #FFFFFF;
        }
        @keyframes fast-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.05); }
        }
        .animate-fast-bounce {
          animation: fast-bounce 0.8s infinite ease-in-out;
        }
        @keyframes pointing-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-pointing-right {
          animation: pointing-right 1s infinite ease-in-out;
        }

        /* LOGO ANIMATIONS */
        @keyframes logo-letter {
          0%, 5% { opacity: 0; transform: scale(0.8) translateY(5px); }
          15%, 85% { opacity: 1; transform: scale(1) translateY(0); }
          95%, 100% { opacity: 0; }
        }
        .animate-logo-letter {
          animation: logo-letter 5s infinite;
          display: inline-block;
          opacity: 0;
        }

        @keyframes logo-225 {
          0%, 25% { opacity: 0; transform: translateX(0); }
          30%, 40% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0; transform: translateX(-150%); }
          51% { opacity: 0; transform: translateX(150%); }
          60%, 85% { opacity: 1; transform: translateX(0); }
          95%, 100% { opacity: 0; }
        }
        .animate-logo-225 {
          animation: logo-225 5s infinite;
          opacity: 0;
        }

        @keyframes scanner-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
        }
        .animate-scanner-float {
            animation: scanner-float 2.5s ease-in-out infinite;
        }

        @keyframes blink-fast {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .animate-blink-fast {
            animation: blink-fast 0.6s step-end infinite;
        }

        @keyframes blink-red-green {
            0%, 100% { background-color: #ef4444; }
            50% { background-color: #22c55e; }
        }
        .animate-blink-red-green {
            animation: blink-red-green 0.15s infinite;
        }

        /* SEARCH BAR ANIMATIONS */
        .bg-animated-search-border {
            background: linear-gradient(90deg, #FFFFFF, #16a34a, #000000, #f97316, #FFFFFF);
            background-size: 400% 100%;
        }
        
        @keyframes search-border-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        .animate-search-border-flow {
            animation: search-border-flow 3s linear infinite;
        }

        @keyframes search-cursor-color {
            0% { background-color: #FFFFFF; }
            25% { background-color: #16a34a; }
            50% { background-color: #000000; }
            75% { background-color: #f97316; }
            100% { background-color: #FFFFFF; }
        }
        .animate-search-cursor-color {
            animation: search-cursor-color 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;
