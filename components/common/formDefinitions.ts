
// --- TYPES ---
export type AnswerValue = string | null;
export type Answers = Record<string, AnswerValue>;

export interface Question {
  key: string;
  text: (answers: Answers) => string;
  type: 'buttons' | 'text' | 'date' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  condition?: (answers: Answers) => boolean;
  inputType?: string;
}

// --- HELPERS ---
const generateDaysOptions = (max: number) => {
    const options = [];
    for (let i = 1; i <= max; i++) {
        options.push({ label: `${i} jour${i > 1 ? 's' : ''}`, value: `${i} jour${i > 1 ? 's' : ''}` });
    }
    options.push({ label: 'Par mois', value: 'Par mois' });
    return options;
};

const DURATION_DAYS_OPTIONS = generateDaysOptions(14);

// --- IMAGES MAPPING ---
const IMAGES_MAPPING: Record<string, string | string[]> = {
    // Travailleurs
    'Hôtesse d’accueil': "https://i.supaimg.com/ed09fd1b-87c1-4297-bab2-6f5e2f39baf0.jpg",
    'Chauffeur': "https://i.supaimg.com/76102a7e-85d6-464e-892a-a8d3f3dd46fe.jpg",
    'Coiffeur / Coiffeuse': "https://i.supaimg.com/e1a35002-fb22-4999-bd12-ea66e2edeb3b.jpg",
    'Agent d’entretien / Femme de ménage': "https://i.supaimg.com/1a00ed7f-3558-4457-b0df-72817cd28e6b.jpg",
    'Vigile': "https://i.supaimg.com/dc4b2081-005b-4d18-9365-ec9e907da19d.jpg",
    'Couturière / Couturier': "https://i.supaimg.com/f0775ab3-05f0-4988-92be-412be89eb0e8.jpg",
    'Vendeuse / Vendeur': "https://i.supaimg.com/d807a5eb-bd7a-41d4-8ea2-6306c48c2ab2.jpg",
    'Cuisinier / Cuisinière': "https://i.supaimg.com/a11f64e3-46cc-4699-9f1e-74aa787776f1.jpg",
    'Nounou / Baby-sitter': "https://i.supaimg.com/cd0f3a2a-ad0f-4485-8290-f4be3202234f.jpg",
    'Jardinier': "https://i.supaimg.com/9f697c6c-d584-4957-972c-db8ae0ff856e.jpg",
    'Serveur / Serveuse': "https://i.supaimg.com/74d6f946-9e73-42e0-b388-bd9db6cd2810.jpg",
    'Esthéticienne': "https://i.supaimg.com/5d9fc475-4729-4a62-b51c-5532cacbad5a.jpg",
    'Caissière / Caissier': "https://i.supaimg.com/372b060c-b798-4857-b9b7-a4422cb39736.jpg",
    'Réceptionniste': "https://i.supaimg.com/be0cec2e-4385-47cb-9c38-38e89b669813.jpg",
    'Magasinier': "https://i.supaimg.com/66c538ba-3804-4ef9-a31e-f29481528d08.jpg",
    'Manutentionnaire': "https://i.supaimg.com/fa944bb3-6204-4588-80f8-010136729ab7.jpg",
    'Plombier': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg",
    'Électricien': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg",
    'Carreleur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7db163c3-53bc-48ed-b87e-9e5c1df9af2d.jpg",
    'Charpentier': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/0dce445b-e80a-4837-bce1-705e07151696.jpg",
    'Maçon': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7759e2a2-e89b-4f9a-981d-1498c014e9cf.jpg",
    'Soudeur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6a162389-4981-4106-b81b-b0baf5b94254.jpg",
    'Peintre': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg",
    'MANUCURE À DOMICILE RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3a9b4b-f03e-417f-a1ae-69d612bb1de8.jpg",
    'ESTHÉTICIENNE-MASSAGE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e884871d-41ea-40c2-b46a-cb2885c270c8.jpg",
    'MAQUILLEUSE PROFESSIONNELLE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e9355d98-e4a9-4bc9-a0bb-9d314aa40839.jpg",
    'PÂTISSIÈRE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/218add6d-6e21-4628-bfad-06d7b3210e28.jpg",

    // Bâtiment Interv Rapide
    'Plombier rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg",
    'Électricien rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg",
    'Carreleur rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7db163c3-53bc-48ed-b87e-9e5c1df9af2d.jpg",
    'Charpentier rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/0dce445b-e80a-4837-bce1-705e07151696.jpg",
    'Maçon rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7759e2a2-e89b-4f9a-981d-1498c014e9cf.jpg",
    'Soudeur rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6a162389-4981-4106-b81b-b0baf5b94254.jpg",
    'Peintre rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg",
    'Peintre Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg",
    'Laveur de vitres Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/523a7221-efdc-40cb-8854-e2cf0f23b981.jpg",
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
    'Technicien entretien climatisation Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg",
    'Installateur de caméras de surveillance Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/692e8ebb-b3d7-495b-8b43-65148c4f1609.jpg",
    'Installateur de caméras de surveillance rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/692e8ebb-b3d7-495b-8b43-65148c4f1609.jpg",
    'INSTALLATEUR DE CAMÉRAS DE SURVEILLANCE RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/692e8ebb-b3d7-495b-8b43-65148c4f1609.jpg",
    'Fabricant de poufs Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1bd32ba7-1320-4334-bff0-8016ccb6404f.jpg",
    'Fabricant de poufs rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1bd32ba7-1320-4334-bff0-8016ccb6404f.jpg",
    'FABRICANT DE POUFS RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1bd32ba7-1320-4334-bff0-8016ccb6404f.jpg",
    'Installateur de fenêtres et portes vitrées Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5b41e300-53eb-4213-ac32-e07b1d272667.jpg",
    'Installateur de fenêtres et portes vitrées rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5b41e300-53eb-4213-ac32-e07b1d272667.jpg",
    'INSTALLATEUR DE FENÊTRES ET PORTES VITRÉES RAPIDE': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5b41e300-53eb-4213-ac32-e07b1d272667.jpg",
    'Menuisier Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg",

    // New specific requests mapped explicitly to match forms / search / titles precisely:
    'Entretien piscine': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9c3ec760-4dba-41a4-b8cd-c6fe37b1d915.jpg",
    'Entretien jardin': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/a457d9bb-89d8-43c9-9d79-47af16441a96.jpg",
    'Désinfection': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ff1341c6-c0af-45b4-ac13-14be2e99f250.jpg",
    'Lavage automobile': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/94a52205-50dc-405e-a706-890ae4cd782c.jpg",
    'Nettoyage chantier': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/97941791-30f2-4350-91ab-4c19743a8b4b.jpg",
    'Nettoyage bureau': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6d388c33-c0f5-46ed-af04-3ae5c8cbb212.jpg",
    'Sonorisateur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/89e2d5eb-eb0d-4c2d-a61b-88d1d02f56ff.jpg",
    'Organisateur événementiel': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ea085472-d107-4662-868f-c030d139e454.jpg",
    'Déménageur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/7666c637-2d97-400b-a6b1-307eee3b5223.jpg",
    'Transport marchandises': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg",
    'Transport matériaux': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg",
    'Transport déménagement': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/4613b69f-91d6-46c5-9a4a-c505eefd2c63.jpg",
    'Livreur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/48e240f8-04ca-4609-b8e1-908ffd40f430.jpg",
    'Ferrailleur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/5ae09e19-f285-4127-9865-ec7523886c61.jpg",
    'Coffreur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/6be60e9a-394f-4026-90f8-3d9843c98589.jpg",
    'Peintre bâtiment': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/8552d20d-cf9a-4f93-abfe-c9852d6ad79a.jpg",
    'Électricien bâtiment': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/98d8c8c7-868a-4267-b4ca-e8985919e7ec.jpg",
    'Plombier bâtiment': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/bc813433-c44a-4b95-9559-9a1c6fa75705.jpg",
    'Menuisier aluminium': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f7d607f0-05be-43fc-898d-70d7b23b04dd.jpg",
    'Staffeur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3489c362-c1ae-4e34-8ea2-e5b4f37a20de.jpg",
    'Étancheur': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/57313e9c-2768-491d-aaf8-eaec1f0c908a.jpg",
    'Poseur de portail': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/1c9c07d7-c210-4a04-87ae-459b428b4565.jpg",
    'Climatisation bâtiment': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/053eff8b-328c-4314-96fe-1fec715749b3.jpg",
    'Technicien forage': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/42143443-ac35-44bb-994f-dfd03705db32.jpg",
    'Constructeur maison': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3ce0a6b7-4c22-4494-840d-5dcb20755e02.jpg",
    'Finition bâtiment': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/52afd515-de3a-42de-b2a8-6f4f27f5d4af.jpg",
    'FINITIONΝ ΒΑΤΙΜEΝΤ': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/52afd515-de3a-42de-b2a8-6f4f27f5d4af.jpg",

    // Immobilier
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

export const getFormImage = (title: string): string | null => {
    const cleanedTitle = title.replace(/\s\([^)]+\)/g, '').trim();
    const match = IMAGES_MAPPING[cleanedTitle] || IMAGES_MAPPING[title];
    if (match) {
        return Array.isArray(match) ? match[0] : match;
    }
    return null;
};

// --- SEARCH CONSTANTS ---
export const SEARCHABLE_TITLES = [
    { title: "Vendeuse / Vendeur", type: "worker" },
    { title: "Cuisinier / Cuisinière", type: "worker" },
    { title: "Serveur / Serveuse", type: "worker" },
    { title: "Coiffeur / Coiffeuse", type: "worker" },
    { title: "Hôtesse d’accueil", type: "worker" },
    { title: "Chauffeur", type: "worker" },
    { title: "Agent d’entretien / Femme de ménage", type: "worker" },
    { title: "Caissière / Caissier", type: "worker" },
    { title: "Réceptionniste", type: "worker" },
    { title: "Nounou / Baby-sitter", type: "worker" },
    { title: "Jardinier", type: "worker" },
    { title: "Couturière / Couturier", type: "worker" },
    { title: "Esthéticienne", type: "worker" },
    { title: "Magasinier", type: "worker" },
    { title: "Manutentionnaire", type: "worker" },
    { title: "Vigile", type: "worker" },
    { title: "Plombier", type: "worker" },
    { title: "Électricien", type: "worker" },
    { title: "Carreleur", type: "worker" },
    { title: "Charpentier", type: "worker" },
    { title: "Maçon", type: "worker" },
    { title: "Soudeur", type: "worker" },
    { title: "Peintre", type: "worker" },
    { title: "MANUCURE À DOMICILE RAPIDE", type: "worker" },
    { title: "ESTHÉTICIENNE-MASSAGE", type: "worker" },
    { title: "MAQUILLEUSE PROFESSIONNELLE", type: "worker" },
    { title: "PÂTISSIÈRE", type: "worker" },
    { title: "Laveur de vitres Rapide", type: "worker" },
    { title: "Technicien entretien climatisation Rapide", type: "worker" },
    { title: "Installateur de caméras de surveillance Rapide", type: "worker" },
    { title: "Fabricant de poufs Rapide", type: "worker" },
    { title: "Installateur de fenêtres et portes vitrées Rapide", type: "worker" },
    { title: "Menuisier Rapide", type: "worker" },
    { title: "Studio à louer", type: "location" },
    { title: "Villa à louer", type: "location" },
    { title: "Chambre-salon à louer", type: "location" },
    { title: "Petit local à louer", type: "location" },
    { title: "Terrain à louer ou à vendre", type: "location" },
    { title: "Magasin à louer", type: "location" },
    { title: "Sonorisation à louer", type: "location" },
    { title: "Bâche à louer", type: "location" },
    { title: "Groupe électrogène à louer", type: "location" }
];

// --- PRICE CALCULATION ---
export const calculateTotalPrice = (formType: string, answers: Answers, serviceMode?: string, count: number = 1, title: string = ''): number => {
    // 1. Détecter le type de formulaire
    const apartmentTitles = ['Studio à louer', 'Villa à louer', 'Chambre-salon à louer', 'Petit local à louer', 'Magasin à louer'];
    const isAppart = apartmentTitles.some(t => title.includes(t)) || title.toLowerCase().includes('appartement');
    const isEquipment = (formType === 'location' || formType === 'personal_location') && !isAppart;
    const isWorker = formType === 'worker' || formType === 'personal_worker' || formType === 'rapid_building_service';

    // 2. Règle spéciale : Location d'équipement est TOUJOURS à 530 CFA fixe
    if (isEquipment) {
        return 530;
    }

    const duration = answers.serviceDuration || answers.workDuration || answers.duration;

    // 3. Logique pour les Travailleurs (Multiplication automatique selon la demande)
    if (isWorker) {
        let baseFee = 530; // Frais de base par personne

        if (serviceMode === 'Embauche') {
            baseFee = 6530;
        } else if (duration) {
            if (duration === 'Par mois') {
                baseFee = 6530;
            } else {
                const daysMatch = (duration as string).match(/(\d+)/);
                if (daysMatch) {
                    const days = parseInt(daysMatch[1], 10);
                    // 653 CFA par jour par personne, plafonné à 6530 par personne
                    baseFee = Math.min(days * 653, 6530);
                }
            }
        }
        
        return baseFee * count;
    }

    // 4. Logique pour les autres types (Immobilier, Urgences, etc.)
    // On conserve le plafond global de 6530 CFA pour ces cas
    if (duration) {
        if (duration === 'Par mois') {
            return 6530;
        }
        const daysMatch = (duration as string).match(/(\d+)/);
        if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            const calculated = days * 653 * count;
            return Math.min(calculated, 6530);
        }
    }

    if (serviceMode === 'Embauche') {
        return Math.min(6530 * count, 6530);
    }

    return Math.min(530 * count, 6530);
};

// --- FORM QUESTIONS ---

export const workerRapidQuestions: Question[] = [
  { 
    key: 'serviceDuration', 
    text: () => "Pour combien de jours avez-vous besoin de ce service ?", 
    type: 'select', 
    options: DURATION_DAYS_OPTIONS
  },
  { key: 'serviceCity', text: () => "Où le service doit s'exécuter ?", type: 'text', placeholder: 'Ex: Abidjan, Cocody' },
  { key: 'budgetPerDay', text: () => "Quel est votre budget par jour ?", type: 'text', inputType: 'tel', placeholder: "15 000 FCFA", hint: "Exemple: 15 000 FCFA" },
  { key: 'description', text: () => "Veuillez donner des détails sur votre demande", type: 'text', placeholder: 'Détails de la tâche...' },
];

export const workerHireQuestions: Question[] = [
  { key: 'serviceCity', text: () => "Où le travailleur doit-il exercer ?", type: 'text', placeholder: 'Ex: Abidjan, Cocody' },
  { key: 'salary', text: () => "Quel salaire mensuel proposez-vous ?", type: 'text', inputType: 'tel', placeholder: "65 000 FCFA", hint: "Exemple: 65 000 FCFA" },
  { key: 'description', text: () => "Description du poste et des tâches souhaitées", type: 'text', placeholder: 'Détails...' },
];

export const rapidBuildingQuestions: Question[] = [
    { 
        key: 'workDuration', 
        text: () => "Quelle est la durée prévue des travaux (en jours) ?", 
        type: 'select', 
        options: DURATION_DAYS_OPTIONS
    },
    { key: 'workLocation', text: () => "Localité du chantier ?", type: 'text', placeholder: 'Ville / Commune' },
    { key: 'dailyBudget', text: () => "Budget journalier prévu ?", type: 'text', inputType: 'tel', placeholder: "15 000 FCFA", hint: "Exemple: 15 000 FCFA" },
    { key: 'workDescription', text: () => "Détail des travaux à effectuer ?", type: 'text', placeholder: 'Besoins...' },
];

export const apartmentQuestions: Question[] = [
    { key: 'commune', text: () => "Dans quelle commune souhaitez-vous louer ?", type: 'text', placeholder: 'Ex: Cocody, Angré...' },
    { key: 'budget', text: () => "Quel est votre budget mensuel maximum ?", type: 'text', inputType: 'tel', placeholder: "150 000 FCFA", hint: "Exemple: 150 000 FCFA" },
    { key: 'description', text: () => "Précisez le type de bien (ex: 3 pièces, studio...)", type: 'text', placeholder: 'Détails...' },
];

export const equipmentQuestions: Question[] = [
    { key: 'city', text: () => "Ville de location de l'équipement ?", type: 'text', placeholder: 'Ex: Abidjan' },
    { key: 'duration', text: () => "Pour combien de jours ?", type: 'select', options: DURATION_DAYS_OPTIONS },
    { key: 'budget', text: () => "Budget total ou par jour prévu ?", type: 'text', inputType: 'tel', placeholder: "15 000 FCFA", hint: "Exemple: 15 000 FCFA" },
    { key: 'description', text: () => "Matériel spécifique ou options souhaitées ?", type: 'text', placeholder: 'Détails...' },
];

export const terrainQuestions: Question[] = [
    { 
        key: 'operationType', 
        text: () => "Type d'opération souhaitée ?", 
        type: 'buttons', 
        options: [
            { label: 'Terrain à louer', value: 'Terrain à louer' },
            { label: 'Terrain à acheter', value: 'Terrain à acheter' }
        ]
    },
    { key: 'location', text: () => "Localisation souhaitée ?", type: 'text', placeholder: 'Ville / Commune / Quartier' },
    { key: 'area', text: () => "Superficie souhaitée (en m²) ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 500' },
    { key: 'price', text: () => "Quel est votre budget (en francs) ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 5000000', hint: "Exemple: 5 000 000 ou 10 000 000 FCFA" },
    { 
        key: 'usage', 
        text: () => "Usage prévu pour ce terrain ?", 
        type: 'buttons', 
        options: [
            { label: 'Habitation', value: 'Habitation' },
            { label: 'Commerce', value: 'Commerce' },
            { label: 'Agriculture', value: 'Agriculture' },
            { label: 'Autre', value: 'Autre' }
        ]
    },
    { 
        key: 'duration', 
        text: () => "Durée souhaitée (si location) ?", 
        type: 'select', 
        options: DURATION_DAYS_OPTIONS,
        condition: (answers) => answers.operationType === 'Terrain à louer'
    },
    { 
        key: 'isServiced', 
        text: () => "Le terrain doit-il être viabilisé ?", 
        type: 'buttons', 
        options: [
            { label: 'Oui', value: 'Oui' },
            { label: 'Non', value: 'Non' },
            { label: 'Peu importe', value: 'Peu importe' }
        ]
    },
    { 
        key: 'roadAccess', 
        text: () => "Accès à une route principale requis ?", 
        type: 'buttons', 
        options: [
            { label: 'Oui', value: 'Oui' },
            { label: 'Non', value: 'Non' }
        ]
    },
    { key: 'extraInfo', text: () => "Informations complémentaires ?", type: 'text', placeholder: 'Zone libre de texte...' },
];

export const sonorisationQuestions: Question[] = [
    { 
        key: 'interventionType', 
        text: () => "Titre d’intervention ?", 
        type: 'buttons', 
        options: [
            { label: 'Anniversaire', value: 'Anniversaire' },
            { label: 'Baptême', value: 'Baptême' },
            { label: 'Mariage', value: 'Mariage' },
            { label: 'Conseil live', value: 'Conseil live' },
            { label: 'Mini-conseil', value: 'Mini-conseil' },
            { label: 'Sortie en famille', value: 'Sortie en famille' },
            { label: 'Soirée en salle', value: 'Soirée en salle' },
            { label: 'Soirée en plein air', value: 'Soirée en plein air' },
            { label: 'Concert live', value: 'Concert live' },
            { label: 'Mini-concert', value: 'Mini-concert' },
            { label: 'soirée Bar', value: 'soirée Bar' },
            { label: 'Soirée maquis', value: 'Soirée maquis' },
            { label: 'Autre', value: 'Autre' }
        ]
    },
    { key: 'eventDate', text: () => "Date de l’événement ?", type: 'date' },
    { key: 'location', text: () => "Lieu / Commune / Quartier ?", type: 'text', placeholder: 'Ex: Cocody, Angré...' },
    { key: 'duration', text: () => "Durée de prestation ?", type: 'select', options: DURATION_DAYS_OPTIONS },
    { key: 'materialType', text: () => "Type de matériel souhaité ?", type: 'text', placeholder: 'Ex: Micros, Baffles, Console...' },
    { key: 'dailyBudget', text: () => "Budget prévu par jours ?", type: 'text', inputType: 'tel', placeholder: "15 000 FCFA", hint: "Exemple: 15 000 FCFA" },
    { key: 'extraInfo', text: () => "Informations complémentaires ?", type: 'text', placeholder: 'Détails...' },
];

export const getQuestionsForType = (formType: string, title: string, serviceMode?: string): Question[] => {
    if (formType === 'night_service') return [
        { key: 'serviceNeeded', text: () => "Quel service d'urgence recherchez-vous ?", type: 'text', placeholder: 'Ex: Pharmacie, Serrurier...' },
        { key: 'budget', text: () => "Quel est votre budget pour cette intervention ?", type: 'text', inputType: 'tel', defaultValue: "10000" },
    ];
    if (formType === 'personal_worker') return [
        { key: 'workerTitle', text: () => "Quel métier recherchez-vous ?", type: 'text', placeholder: 'Ex: maçon, électricien...' },
        ...(serviceMode === 'Embauche' ? workerHireQuestions : workerRapidQuestions)
    ];
    if (formType === 'rapid_building_service') return rapidBuildingQuestions;
    if (formType === 'worker') return (serviceMode === 'Embauche' ? workerHireQuestions : workerRapidQuestions);
    
    const isTerrain = title.includes('Terrain') || title.toLowerCase().includes('terrain');
    if (isTerrain) return terrainQuestions;

    const isSonorisation = title.includes('Sonorisation') || title.toLowerCase().includes('sonorisation');
    if (isSonorisation) return sonorisationQuestions;

    const apartmentTitles = ['Studio à louer', 'Villa à louer', 'Chambre-salon à louer', 'Petit local à louer', 'Magasin à louer'];
    const isAppart = apartmentTitles.some(t => title.includes(t)) || title.toLowerCase().includes('appartement');
    
    if (isAppart) {
        return apartmentQuestions;
    }
    
    if (formType === 'location' || formType === 'personal_location') {
        return equipmentQuestions;
    }
    return apartmentQuestions;
};

export const generateWhatsAppMessage = (title: string, questions: Question[], answers: Answers, user: {name: string, city: string, phone: string}, totalPrice?: number, mode?: string, count?: number) => {
    let message = `*Nouvelle demande via FILANT°225*\n\n`;
    message += `*Nom:* ${user.name}\n`;
    message += `*Service:* ${title}${mode ? ` (${mode})` : ''}\n`;
    if (count) message += `*Quantité/Personne:* ${count}\n`;
    
    message += `\n--- DÉTAILS ---\n`;
    questions.forEach(q => {
        // On n'inclut que les questions dont la condition est remplie
        if (!q.condition || q.condition(answers)) {
            const answer = answers[q.key];
            if (answer) {
                message += `*${q.text(answers).replace(/\?$/, '')}* : ${answer}\n`;
            }
        }
    });
    
    message += `\n--- CONTACT ---\n`;
    message += `*Ville:* ${user.city}\n`;
    message += `*Téléphone:* ${user.phone}\n`;
    
    if (totalPrice !== undefined && totalPrice > 0) {
        message += `\n*Montant:* ${Math.floor(totalPrice)} FCFA\n`;
        message += `*Lien de paiement:* https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${Math.floor(totalPrice)}\n`;
    }
    return message;
};
