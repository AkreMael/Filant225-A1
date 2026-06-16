
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Worker, User as UserType } from '../types';
import EmbeddedForm from './EmbeddedForm';
import { User } from 'lucide-react';
import { getFormImage } from './common/formDefinitions';

// --- ICONS (Matching the provided mockup) ---
const BackIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MicIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
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

// --- SYNCHRONIZED IMAGE URLS ---
export const HOTESSE_QUALIF_IMAGE = "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg";
export const CHAUFFEUR_QUALIF_IMAGE = "https://i.supaimg.com/76102a7e-85d6-464e-892a-a8d3f3dd46fe.jpg";
export const COIFFURE_QUALIF_IMAGE = "https://i.supaimg.com/e1a35002-fb22-4999-bd12-ea66e2edeb3b.jpg";
export const ENTRETIEN_QUALIF_IMAGE = "https://i.supaimg.com/1a00ed7f-3558-4457-b0df-72817cd28e6b.jpg";
export const VIGILE_QUALIF_IMAGE = "https://i.supaimg.com/dc4b2081-005b-4d18-9365-ec9e907da19d.jpg";
export const COUTURE_QUALIF_IMAGE = "https://i.supaimg.com/f0775ab3-05f0-4988-92be-412be89eb0e8.jpg";
export const VENDEUR_IMAGE = "https://i.supaimg.com/d807a5eb-bd7a-41d4-8ea2-6306c48c2ab2.jpg";
export const CUISINIER_IMAGE = "https://i.supaimg.com/a11f64e3-46cc-4699-9f1e-74aa787776f1.jpg";
export const NOUNOU_IMAGE = "https://i.supaimg.com/cd0f3a2a-ad0f-4485-8290-f4be3202234f.jpg";
export const JARDINIER_IMAGE = "https://i.supaimg.com/9f697c6c-d584-4957-972c-db8ae0ff856e.jpg";
export const SERVEUSE_IMAGE = "https://i.supaimg.com/74d6f946-9e73-42e0-b388-bd9db6cd2810.jpg";
export const ESTHETICIENNE_IMAGE = "https://i.supaimg.com/5d9fc475-4729-4a62-b51c-5532cacbad5a.jpg";
export const CAISSIER_IMAGE = "https://i.supaimg.com/372b060c-b798-4857-b9b7-a4422cb39736.jpg";
export const RECEPTIONNISTE_IMAGE = "https://i.supaimg.com/be0cec2e-4385-47cb-9c38-38e89b669813.jpg";
export const MAGASINIER_IMAGE = "https://i.supaimg.com/66c538ba-3804-4ef9-a31e-f29481528d08.jpg";
export const MANUTENTIONNAIRE_IMAGE = "https://i.supaimg.com/fa944bb3-6204-4588-80f8-010136729ab7.jpg";
export const VENTE_EN_LIGNE_IMAGE = "https://i.supaimg.com/f8359f5e-0db9-41b2-b717-08b02070000e.jpg";
export const GROSSISTE_IMAGE = "https://i.supaimg.com/7b114b92-0a02-4b0c-8135-0562854f888d.jpg";
export const VENTE_VETEMENTS_IMAGE = "https://i.supaimg.com/12e2fe4a-3481-4c3c-af35-ad043f899c13.jpg";
export const DECORATEUR_NEW_IMAGE = "https://i.supaimg.com/071d3fc3-3339-4d7e-bc2c-c1856576a5f2.jpg";
export const PLAFOND_IMAGE = "https://i.supaimg.com/a033c8f7-2ba0-4b85-92f6-c7bff3d8f723.jpg";
export const COMMUNITY_MANAGER_IMAGE = "https://i.supaimg.com/f76371ac-d945-4d9f-8cef-9389835fb07e.jpg";
export const VIDEASTE_IMAGE = "https://i.supaimg.com/0b29471a-3d31-4d69-a4a0-3b254ff72f5a.jpg";
export const AIDE_DOMICILE_IMAGE = "https://i.supaimg.com/c3c14402-3c1f-4484-bfe1-774bcc4ac6de.png";
export const TEACHER_IMAGE = "https://i.supaimg.com/e1505024-e850-4db2-b2d1-6281d7f21dae.jpg";
export const PHOTOGRAPHE_IMAGE = "https://i.supaimg.com/d600fd73-adb7-431b-8414-42a8065299e5.jpg";
export const MAQUILLAGE_IMAGE = "https://i.supaimg.com/f5cb3f59-9518-4703-b187-98901456c91f.jpg";
export const MANUCURE_IMAGE = "https://i.supaimg.com/fad6642a-a767-4442-a038-aca825747fb5.jpg";
export const MASSAGE_IMAGE = "https://i.supaimg.com/eb12af34-45d2-43a5-805f-ae76c582109c.jpg";
export const LAVEUR_VITRES_IMAGE = "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/523a7221-efdc-40cb-8854-e2cf0f23b981.jpg";
const UNIFORM_WORKER_IMAGE = "https://i.supaimg.com/17697fbb-4850-449b-8aae-1e5074f46e78.jpg";

export const getSynchronizedWorkerImage = (name: string) => {
    const nameLower = name.toLowerCase().trim();

    // Check specific user requested overrides first
    if (nameLower.includes('agent d’entretien') || nameLower.includes("agent d'entretien")) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6d388c33-c0f5-46ed-af04-3ae5c8cbb212.jpg";
    if (nameLower.includes('coiffeuse femme') || nameLower.includes('coiffeuse') || nameLower.includes('coiffeur femme')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9c714920-4de5-4419-97f8-9114f9cbb215.jpg";
    if (nameLower.includes('pâtissier') || nameLower.includes('patissier') || nameLower.includes('pâtissière') || nameLower.includes('patissiere')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/218add6d-6e21-4628-bfad-06d7b3210e28.jpg";
    if (nameLower.includes('agent de sécurité') || nameLower.includes('agent de securite')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/28e343d6-95b2-461d-a0c9-5889367b8be4.jpg";
    if (nameLower.includes('manucure à domicile rapide') || nameLower.includes('manucure a domicile rapide')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3a9b4b-f03e-417f-a1ae-69d612bb1de8.jpg";
    if (nameLower.includes('esthéticienne-massage') || nameLower.includes('estheticienne-massage')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e884871d-41ea-40c2-b46a-cb2885c270c8.jpg";
    if (nameLower.includes('maquilleuse professionnelle') || nameLower.includes('maquilleuse professionnel')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e9355d98-e4a9-4bc9-a0bb-9d314aa40839.jpg";

    if (nameLower.includes('entretien piscine')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9c3ec760-4dba-41a4-b8cd-c6fe37b1d915.jpg";
    if (nameLower.includes('entretien jardin')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/a457d9bb-89d8-43c9-9d79-47af16441a96.jpg";
    if (nameLower.includes('désinfection') || nameLower.includes('desinfection')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ff1341c6-c0af-45b4-ac13-14be2e99f250.jpg";
    if (nameLower.includes('lavage automobile')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/94a52205-50dc-405e-a706-890ae4cd782c.jpg";
    if (nameLower.includes('nettoyage chantier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/97941791-30f2-4350-91ab-4c19743a8b4b.jpg";
    if (nameLower.includes('nettoyage bureau')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6d388c33-c0f5-46ed-af04-3ae5c8cbb212.jpg";
    if (nameLower.includes('sonorisateur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/89e2d5eb-eb0d-4c2d-a61b-88d1d02f56ff.jpg";
    if (nameLower.includes('organisateur événementiel') || nameLower.includes('organisateur evenementiel')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ea085472-d107-4662-868f-c030d139e454.jpg";
    if (nameLower.includes('déménageur') || nameLower.includes('demenageur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7666c637-2d97-400b-a6b1-307eee3b5223.jpg";
    if (nameLower.includes('transport marchandises') || nameLower.includes('transport de marchandises')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (nameLower.includes('transport matériaux') || nameLower.includes('transport de materiaux') || nameLower.includes('transport materiaux')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (nameLower.includes('transport déménagement') || nameLower.includes('transport demenagement')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg";
    if (nameLower.includes('livreur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/48e240f8-04ca-4609-b8e1-908ffd40f430.jpg";
    if (nameLower.includes('maçon') || nameLower.includes('macon')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7759e2a2-e89b-4f9a-981d-1498c014e9cf.jpg";
    if (nameLower.includes('ferrailleur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5ae09e19-f285-4127-9865-ec7523886c61.jpg";
    if (nameLower.includes('coffreur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6be60e9a-394f-4026-90f8-3d9843c98589.jpg";
    if (nameLower.includes('carreleur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7db163c3-53bc-48ed-b87e-9e5c1df9af2d.jpg";
    if (nameLower.includes('peintre bâtiment') || nameLower.includes('peintre batiment') || nameLower.includes('peintre')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg";
    if (nameLower.includes('électricien bâtiment') || nameLower.includes('electricien batiment') || nameLower.includes('électricien') || nameLower.includes('electricien')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg";
    if (nameLower.includes('plombier bâtiment') || nameLower.includes('plombier batiment') || nameLower.includes('plombier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg";
    if (nameLower.includes('soudeur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6a162389-4981-4106-b81b-b0baf5b94254.jpg";
    if (nameLower.includes('charpentier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/0dce445b-e80a-4837-bce1-705e07151696.jpg";
    if (nameLower.includes('menuisier aluminium') || nameLower.includes('menuisier')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f7d607f0-05be-43fc-898d-70d7b23b04dd.jpg";
    if (nameLower.includes('staffeur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3489c362-c1ae-4e34-8ea2-e5b4f37a20de.jpg";
    if (nameLower.includes('étancheur') || nameLower.includes('etancheur')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/57313e9c-2768-491d-aaf8-eaec1f0c908a.jpg";
    if (nameLower.includes('poseur de portail')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1c9c07d7-c210-4a04-87ae-459b428b4565.jpg";
    if (nameLower.includes('climatisation bâtiment') || nameLower.includes('climatisation batiment') || nameLower.includes('climatisation')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/053eff8b-328c-4314-96fe-1fec715749b3.jpg";
    if (nameLower.includes('technicien forage')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/42143443-ac35-44bb-994f-dfd03705db32.jpg";
    if (nameLower.includes('constructeur maison')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3ce0a6b7-4c22-4494-840d-5dcb20755e02.jpg";
    if (nameLower.includes('finition bâtiment') || nameLower.includes('finition batiment') || nameLower.includes('finition') || nameLower.includes('βaτιμeντ') || nameLower.includes('βατιμeντ')) return "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/52afd515-de3a-42de-b2a8-6f4f27f5d4af.jpg";

    if (nameLower.includes('chauffeur')) return CHAUFFEUR_QUALIF_IMAGE;
    if (nameLower.includes('vendeur') || nameLower.includes('vendeuse')) return VENDEUR_IMAGE;
    if (nameLower.includes('cuisinier') || nameLower.includes('cuisinière')) return CUISINIER_IMAGE;
    if (nameLower.includes('vigile')) return VIGILE_QUALIF_IMAGE;
    if (nameLower.includes('nounou') || nameLower.includes('baby-sitter')) return NOUNOU_IMAGE;
    if (nameLower.includes('jardinier')) return JARDINIER_IMAGE;
    if (nameLower.includes('serveur') || nameLower.includes('serveuse')) return SERVEUSE_IMAGE;
    if (nameLower.includes('femme de ménage') || nameLower.includes('entretien')) return ENTRETIEN_QUALIF_IMAGE;
    if (nameLower.includes('esthéticienne') || nameLower.includes('estheticienne')) return ESTHETICIENNE_IMAGE;
    if (nameLower.includes('caissière') || nameLower.includes('caissier')) return CAISSIER_IMAGE;
    if (nameLower.includes('réceptionniste')) return RECEPTIONNISTE_IMAGE;
    if (nameLower.includes('magasinier')) return MAGASINIER_IMAGE;
    if (nameLower.includes('manutentionnaire')) return MANUTENTIONNAIRE_IMAGE;
    if (nameLower.includes('vente en ligne')) return VENTE_EN_LIGNE_IMAGE;
    if (nameLower.includes('grossiste')) return GROSSISTE_IMAGE;
    if (nameLower.includes('vêtements')) return VENTE_VETEMENTS_IMAGE;
    if (nameLower.includes('décorateur')) return DECORATEUR_NEW_IMAGE;
    if (nameLower.includes('faux plafond')) return PLAFOND_IMAGE;
    if (nameLower.includes('community manager')) return COMMUNITY_MANAGER_IMAGE;
    if (nameLower.includes('vidéaste') || nameLower.includes('monteur')) return VIDEASTE_IMAGE;
    if (nameLower.includes('garde malade')) return VIGILE_QUALIF_IMAGE;
    if (nameLower.includes('aide à domicile')) return AIDE_DOMICILE_IMAGE;
    if (nameLower.includes('enseignant')) return TEACHER_IMAGE;
    if (nameLower.includes('photographe')) return PHOTOGRAPHE_IMAGE;
    if (nameLower.includes('maquillage')) return MAQUILLAGE_IMAGE;
    if (nameLower.includes('manucure') || nameLower.includes('pédicure')) return MANUCURE_IMAGE;
    if (nameLower.includes('massage')) return MASSAGE_IMAGE;
    if (nameLower.includes('laveur de vitres')) return LAVEUR_VITRES_IMAGE;
    if (nameLower.includes('hôtesse') || nameLower.includes('hotesse')) return HOTESSE_QUALIF_IMAGE;
    if (nameLower.includes('coiffeur') || nameLower.includes('coiffeuse')) return COIFFURE_QUALIF_IMAGE;
    if (nameLower.includes('couturière') || nameLower.includes('couturier')) return COUTURE_QUALIF_IMAGE;

    // Direct mapping fallback from formDefinitions for equipments etc.
    const directImage = getFormImage(name);
    if (directImage) return directImage;

    return UNIFORM_WORKER_IMAGE;
};

// --- VIRTUAL CATEGORIES CONFIG (Reusing categories/titles from Intervention rapide) ---
const VIRTUAL_CATEGORIES = [
  {
    id: 'Dépannage rapide',
    label: 'Dépannage Rapide',
    items: [
      { title: "Plombier rapide", description: "Dépannage plomberie ultra rapide.", formType: "rapid_building_service" as const },
      { title: "Électricien rapide", description: "Dépannage électricité urgent.", formType: "rapid_building_service" as const },
      { title: "Serrurier rapide", description: "Ouverture de porte et serrures rapides.", formType: "rapid_building_service" as const },
      { title: "Vitrier rapide", description: "Changement de vitres et fenêtres.", formType: "rapid_building_service" as const },
      { title: "Réparation climatiseur rapide", description: "Réparation et recharge climatisation.", formType: "rapid_building_service" as const },
      { title: "Réparation frigo rapide", description: "Réparation réfrigérateurs et congél.", formType: "rapid_building_service" as const },
      { title: "Réparation machine à laver rapide", description: "Réparation lave-linge et sèche-linge.", formType: "rapid_building_service" as const },
      { title: "Dépannage parabole rapide", description: "Installation et réglage parabole.", formType: "rapid_building_service" as const },
      { title: "Dépannage auto rapide", description: "Mécanique et électrique auto.", formType: "rapid_building_service" as const }
    ]
  },
  {
    id: 'Services construction',
    label: 'Services Construction',
    items: [
      { title: "Maçon", description: "Maçonnerie générale, chapes et murs.", formType: "rapid_building_service" as const },
      { title: "Ferrailleur", description: "Travaux de ferraillage solides.", formType: "rapid_building_service" as const },
      { title: "Coffreur", description: "Coffrages bois ou métalliques.", formType: "rapid_building_service" as const },
      { title: "Carreleur", description: "Pose de carreaux tous formats.", formType: "rapid_building_service" as const },
      { title: "Peintre bâtiment", description: "Peinture murs et boiseries.", formType: "rapid_building_service" as const },
      { title: "Électricien bâtiment", description: "Installation électrique complète.", formType: "rapid_building_service" as const },
      { title: "Plombier bâtiment", description: "Tuyauterie et réseaux sanitaires.", formType: "rapid_building_service" as const },
      { title: "Soudeur", description: "Soudure et structures métalliques.", formType: "rapid_building_service" as const },
      { title: "Charpentier", description: "Charpentes bois et ossatures.", formType: "rapid_building_service" as const },
      { title: "Menuisier aluminium", description: "Fenêtres, portes et baies vitrées.", formType: "rapid_building_service" as const },
      { title: "Menuisier bois", description: "Portes et placards en bois.", formType: "rapid_building_service" as const },
      { title: "Staffeur", description: "Décoration en plâtre et staff.", formType: "rapid_building_service" as const },
      { title: "Étancheur", description: "Traitement des fuites et infiltration.", formType: "rapid_building_service" as const },
      { title: "Poseur de portail", description: "Installation de portails.", formType: "rapid_building_service" as const },
      { title: "Poseur de caméra", description: "Installation vidéosurveillance.", formType: "rapid_building_service" as const },
      { title: "Climatisation bâtiment", description: "Installation climatisation centrale.", formType: "rapid_building_service" as const },
      { title: "Technicien forage", description: "Forage de puits d'eau.", formType: "rapid_building_service" as const },
      { title: "Constructeur maison", description: "Projet de construction de A à Z.", formType: "rapid_building_service" as const },
      { title: "Finition bâtiment", description: "Enduit, ponçage, finitions fines.", formType: "rapid_building_service" as const }
    ]
  },
  {
    id: 'Nettoyage & Entretien',
    label: 'Nettoyage & Entretien',
    items: [
      { title: "Technicien de surface", description: "Nettoyage sols et surfaces.", formType: "worker" as const },
      { title: "Nettoyage maison", description: "Ménage complet de maisons.", formType: "worker" as const },
      { title: "Nettoyage bureau", description: "Entretien des espaces de travail.", formType: "worker" as const },
      { title: "Nettoyage chantier", description: "Nettoyage de fin de chantier.", formType: "worker" as const },
      { title: "Lavage automobile", description: "Lavage auto à domicile.", formType: "worker" as const },
      { title: "Désinfection", description: "Nettoyage et élimination de germes.", formType: "worker" as const },
      { title: "Entretien jardin", description: "Tonte pelouse et jardinage.", formType: "worker" as const },
      { title: "Entretien piscine", description: "Nettoyage et traitement eau de piscine.", formType: "worker" as const }
    ]
  },
  {
    id: 'Cuisine & Événementiel',
    label: 'Cuisine & Événementiel',
    items: [
      { title: "Cuisinier", description: "Cuisine à domicile ou événement.", formType: "worker" as const },
      { title: "Serveur", description: "Service traiteur ou restaurant.", formType: "worker" as const },
      { title: "Décorateur", description: "Décoration salle et événements.", formType: "worker" as const },
      { title: "DJ", description: "Animation musicale pour fêtes.", formType: "worker" as const },
      { title: "Sonorisateur", description: "Installation et réglage du son.", formType: "worker" as const },
      { title: "Organisateur événementiel", description: "Planification et coordination totale.", formType: "worker" as const },
      { title: "Photographe", description: "Reportage photos professionnel.", formType: "worker" as const },
      { title: "Vidéaste", description: "Captation et montage vidéo.", formType: "worker" as const }
    ]
  },
  {
    id: 'Transport & Livraison',
    label: 'Transport & Livraison',
    items: [
      { title: "Chauffeur", description: "Déplacement sécurisé et rapide.", formType: "worker" as const },
      { title: "Déménageur", description: "Aide pour chargement et emballage.", formType: "worker" as const },
      { title: "Livreur", description: "Livraison colis et repas express.", formType: "worker" as const },
      { title: "Transport marchandises", description: "Camionnette pour fret commercial.", formType: "worker" as const },
      { title: "Transport matériaux", description: "Livraison de ciment, sable, etc.", formType: "worker" as const },
      { title: "Transport déménagement", description: "Grand camion de déménagement.", formType: "worker" as const }
    ]
  }
];

const workerTallyLinks: Record<string, string> = {
    'Vendeuse / Vendeur': 'https://tally.so/r/obEROM',
    'Vendeuse': 'https://tally.so/r/obEROM',
    'Vendeur': 'https://tally.so/r/obEROM',
    'Vigile': 'https://tally.so/r/rj5BRX',
    'Agent de sécurité': 'https://tally.so/r/rj5BRX',
    'Nounou / Baby-sitter': 'https://tally.so/r/ODalqa',
    'Nounou': 'https://tally.so/r/ODalqa',
    'Baby-sitter': 'https://tally.so/r/ODalqa',
    'Caissière / Caissier': 'https://tally.so/r/0Qd7Y9',
    'Caissière': 'https://tally.so/r/0Qd7Y9',
    'Caissier': 'https://tally.so/r/0Qd7Y9',
    'Agent d’entretien / Femme de ménage': 'https://tally.so/r/BzaKYe',
    'Agent d’entretien': 'https://tally.so/r/BzaKYe',
    'Femme de ménage': 'https://tally.so/r/BzaKYe',
    'Chauffeur': 'https://tally.so/r/aQ9e1Z',
    'Coiffeur / Coixeuse': 'https://tally.so/r/9qBXYE',
    'Coiffeur': 'https://tally.so/r/9qBXYE',
    'Coiffeuse': 'https://tally.so/r/9qBXYE',
    'Coiffeur Homme': 'https://tally.so/r/9qBXYE',
    'Coiffeuse Femme': 'https://tally.so/r/9qBXYE',
    'Cuisinier / Cuisinière': 'https://tally.so/r/zxjN4g',
    'Cuisinier': 'https://tally.so/r/zxjN4g',
    'Cuisinière': 'https://tally.so/r/zxjN4g',
    'Réceptionniste': 'https://tally.so/r/D4BKol',
    'Hôtesse d’accueil': 'https://tally.so/r/pbrdN1',
    'Serveur / Serveuse': 'https://tally.so/r/NprDx0',
    'Serveur': 'https://tally.so/r/NprDx0',
    'Serveuse': 'https://tally.so/r/NprDx0',
    'Jardinier': 'https://tally.so/r/J9qlR7',
    'Esthéticienne': 'https://tally.so/r/kdl9jr',
    'Magasinier': 'https://tally.so/r/1AXk0g',
    'Couturière / Couturier': 'https://tally.so/r/WO2rbe',
    'Couturière': 'https://tally.so/r/WO2rbe',
    'Couturier': 'https://tally.so/r/WO2rbe',
    'Manucure / Pédicure': 'https://tally.so/r/9qBXYE',
    'Manucure': 'https://tally.so/r/9qBXYE',
    'Pédicure': 'https://tally.so/r/9qBXYE',
    'Massage': 'https://tally.so/r/9qBXYE',
    'MANUCURE À DOMICILE RAPIDE': 'https://tally.so/r/9qBXYE',
    'ESTHÉTICIENNE-MASSAGE': 'https://tally.so/r/kdl9jr',
    'MAQUILLEUSE PROFESSIONNELLE': 'https://tally.so/r/kdl9jr',
    'PÂTISSIÈRE': 'https://tally.so/r/zxjN4g',
    'Pâtissier': 'https://tally.so/r/zxjN4g'
};

interface WorkerCardProps {
  worker: Worker & { formType?: 'worker' | 'location' | 'night_service' | 'rapid_building_service' };
  user: UserType;
  onScheduleService: (url?: string, title?: string) => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
}

const VerifiedBadge = () => (
  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812 3.066 3.066 0 00.723 1.745 3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  </div>
);

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, user, onScheduleService, onOpenForm }) => {
  const isDisponible = worker.category === 'Disponible';
  const imageSrc = getSynchronizedWorkerImage(worker.name);
  
  // Use the full name as provided in the data
  const displayName = worker.name;

  const handleExigeClick = () => {
      const url = workerTallyLinks[worker.name] || 'https://tally.so/r/obEROM';
      onScheduleService(url, displayName);
  };

  const handleDemandeClick = () => {
    onOpenForm({
      formType: worker.formType || 'worker',
      title: displayName,
      imageUrl: imageSrc,
      description: worker.description
    });
  };

  return (
    <div className={`bg-white rounded-[2.5rem] p-5 flex flex-col transition-all relative overflow-hidden animate-in zoom-in-95 duration-300 shadow-xl`}>
      <div className="flex gap-4">
        {/* Profile Image - Large Rounded Rectangle */}
        <div className="w-24 h-24 rounded-3xl border-2 border-orange-500 overflow-hidden flex-shrink-0 relative bg-gray-50 flex items-center justify-center shadow-inner">
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt={displayName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
            )}
            {worker.isVerified && <VerifiedBadge />}
        </div>
        
        {/* Info Area */}
        <div className="flex-1 flex flex-col justify-start">
            <h3 className="font-black text-black text-lg leading-none mb-2 uppercase tracking-tighter">
              {displayName}
            </h3>
            {isDisponible && (
                <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={worker.rating} />
                </div>
            )}
            <p className="text-gray-600 text-[11px] leading-tight font-medium line-clamp-3">
                {worker.description}
            </p>
        </div>
      </div>
      
      {/* Footer Area with Circular Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4">
        {/* Proposer - Person Icon (Orange Outline) */}
        <button
          onClick={handleExigeClick}
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Proposer"
        >
          <PersonIcon />
        </button>

        {/* Demander - Send/Plane Icon (Orange Outline) */}
        <button
          onClick={handleDemandeClick}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all shadow-md active:scale-90 animate-demande-signal bg-white border-orange-500 text-orange-500`}
          title="Demander"
        >
          <SendIcon />
        </button>

        {/* Appel - Phone Icon (Orange Outline) */}
        <a
          href={`tel:${worker.phone}`}
          className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-md bg-white"
          title="Appel"
        >
          <PhoneIcon />
        </a>
      </div>
      
      {/* Decorative Status Dot */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Disponible</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]"></div>
      </div>
    </div>
  );
};

interface WorkerListScreenProps {
  onBack: () => void;
  user: UserType;
  onScheduleService: (url?: string, title?: string) => void;
  onOpenSiteWorkers: () => void;
  onOpenForm: (context: { formType: 'worker' | 'location' | 'night_service' | 'rapid_building_service', title: string, imageUrl?: string, description?: string }) => void;
}

const WorkerListScreen: React.FC<WorkerListScreenProps> = ({ onBack, user, onScheduleService, onOpenSiteWorkers, onOpenForm }) => {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Disponible');

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        // Only show loading if we don't have workers yet
        if (allWorkers.length === 0) {
          setLoading(true);
        }
        const workers = await databaseService.getWorkers();
        setAllWorkers(workers);
        setError(null);
      } catch (e) {
        setError("Impossible de charger la liste des professionnels.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const getRenderedWorkers = () => {
    if (selectedCategory === 'Disponible') {
      return allWorkers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = w.category === 'Disponible';
        
        // Titles to exclude
        const excludedTitles = [
          'fabricant de poufs',
          'entretien climatisation',
          'caméras de surveillance',
          'fenêtres et portes vitrées',
          'menuisier',
          'garde malade'
        ];
        
        const isExcluded = excludedTitles.some(title => w.name.toLowerCase().includes(title));
        
        return matchesSearch && matchesCategory && !isExcluded;
      });
    }

    const matchedCat = VIRTUAL_CATEGORIES.find(c => c.id === selectedCategory);
    if (!matchedCat) return [];

    return matchedCat.items
      .map((item, index) => ({
        id: `virtual-${selectedCategory}-${index}`,
        name: item.title,
        description: item.description,
        category: selectedCategory,
        rating: 4.5,
        phone: "+2250705052632",
        isVerified: true,
        profileImageUrl: '',
        formType: item.formType
      }))
      .filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredWorkers = getRenderedWorkers();

  return (
    <div className="bg-white flex-1 flex flex-col h-full">
        <header className="bg-white pt-2 pb-2 px-4 sticky top-0 z-20 border-b border-gray-100 shadow-sm">
            <div className="flex flex-row items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-xl shadow-sm">
                        <span className="font-black text-xl">F</span>
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
                        className="w-full pl-8 pr-8 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-orange-500 text-xs text-center shadow-sm text-black bg-gray-50 font-bold"
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

            <div className="flex items-center gap-2 mb-3">
                <IvoryCoastFlagIcon />
                <p className="text-xs font-bold text-black truncate">Trouvez rapidement le service dont vous avez besoin</p>
            </div>

            {/* Horizontally scrollable category tabs --- */}
            <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide w-full max-w-full">
                {/* 1. Disponible category tab */}
                <button 
                    onClick={() => setSelectedCategory('Disponible')}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-black uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-2 relative shadow-md active:scale-95 ${
                        selectedCategory === 'Disponible' 
                            ? 'bg-green-600 text-white border-2 border-white/20' 
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                >
                    <span>Disponible</span>
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                </button>

                {/* 2. Other categories from virtual categories */}
                {VIRTUAL_CATEGORIES.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight whitespace-nowrap transition-all shadow-md active:scale-95 ${
                                isActive
                                    ? 'bg-orange-500 text-white border-2 border-white/10'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {cat.label}
                        </button>
                    );
                })}
            </div>
        </header>
      
      <main className="flex-1 bg-gray-100 p-4 overflow-y-auto pb-24">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        ) : error ? (
            <div className="p-4 text-center text-red-500 h-full">{error}</div>
        ) : (
            <div className="flex flex-col gap-6">
                {filteredWorkers.map(worker => (
                    <WorkerCard 
                        key={worker.id} 
                        worker={worker} 
                        user={user}
                        onScheduleService={onScheduleService}
                        onOpenForm={onOpenForm}
                    />
                ))}
                {filteredWorkers.length === 0 && (
                    <div className="text-center mt-10">
                        <p className="text-gray-500 mb-2">Aucun professionnel trouvé pour cette catégorie.</p>
                        <p className="text-xs text-gray-400">Essayez une autre catégorie ou modifiez votre recherche.</p>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default WorkerListScreen;
