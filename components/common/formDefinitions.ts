
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
    'Plombier': "https://i.supaimg.com/2f48ca38-bff5-4ebb-9ac5-d72553710d0e.jpg",
    'Électricien': "https://i.supaimg.com/9f041925-62aa-4975-8ac1-1c8c2b8cddbc.jpg",
    'Carreleur': "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg",
    'Charpentier': "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg",
    'Maçon': "https://i.supaimg.com/ddaa37a0-cc8d-4cdd-a857-8d1eb4f72383.jpg",
    'Soudeur': "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg",
    'Peintre': "https://i.supaimg.com/8e6037b9-ce46-45e4-b620-0a04e4cf657d.jpg",

    // Bâtiment Interv Rapide
    'Plombier rapide': "https://i.supaimg.com/bf0970ed-7dcd-44cb-9de3-62334cdf346a.jpg",
    'Électricien rapide': "https://i.supaimg.com/8c410fb6-878b-44ec-84ed-2b5a4a864a78.jpg",
    'Carreleur rapide': "https://i.supaimg.com/06e7bd93-4222-4631-aeee-6516870145ef.jpg",
    'Charpentier rapide': "https://i.supaimg.com/017f0261-3cac-4fa3-b519-c5e93cdc1dd1.jpg",
    'Maçon rapide': "https://i.supaimg.com/dfd8a52a-a25c-4e93-a3c9-329a8a9ee255.jpg",
    'Soudeur rapide': "https://i.supaimg.com/891653b3-5444-44d7-abb6-cbbdd1f4b5bd.jpg",
    'Peintre rapide': "https://i.supaimg.com/da9c5439-08c6-45b6-a6c4-772d20bbe1da.jpg",
    'Laveur de vitres Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e7f7c3c8-89f3-4893-b163-c21f955e5e81.jpg",
    'Technicien entretien climatisation Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/e079b93f-a2ab-4aa5-8be3-a6923b189f86.jpg",
    'Installateur de caméras de surveillance Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2f8ca35b-fcf3-40ad-82fa-63742864e4ec.jpg",
    'Fabricant de poufs Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/ebb24cd2-8a14-45c1-b273-0b4a81361c8b.jpg",
    'Installateur de fenêtres et portes vitrées Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/9b3f3e05-c4d1-4687-9039-8d371e6a166c.jpg",
    'Menuisier Rapide': "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/f34061d0-a1bf-43fd-8043-e872aaab3759.jpg",

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
    // Nouvelle règle : Location d'équipement est TOUJOURS à 530 CFA fixe
    const apartmentTitles = ['Studio à louer', 'Villa à louer', 'Chambre-salon à louer', 'Petit local à louer', 'Magasin à louer'];
    const isAppart = apartmentTitles.some(t => title.includes(t)) || title.toLowerCase().includes('appartement');
    const isEquipment = (formType === 'location' || formType === 'personal_location') && !isAppart;

    if (isEquipment) {
        return 530;
    }

    // On cherche si un champ de durée existe dans les réponses
    const duration = answers.serviceDuration || answers.workDuration || answers.duration;
    
    if (duration) {
        if (duration === 'Par mois') {
            return 4650; // Plafond pour le mois aussi
        }
        // Extraire le nombre de jours (ex: "3 jours" -> 3)
        const daysMatch = (duration as string).match(/(\d+)/);
        if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            // Nouvelle règle : 465 francs par jour, plafonné à 4 650 francs au total
            const basePrice = days * 465 * count;
            return Math.min(basePrice, 4650);
        }
    }

    // --- LOGIQUE POUR LES CAS SANS DURÉE ---
    
    // Cas spécifique : Embaucher (Prix fixe)
    if (serviceMode === 'Embaucher') {
        const basePrice = 4650 * count;
        return Math.min(basePrice, 4650); // On applique aussi le plafond ici par cohérence si nécessaire, ou on laisse à 4650? 
        // L'utilisateur dit "Le total ne doit jamais dépasser 4 650 francs".
    }

    // Cas par défaut (Immobilier, Urgences, etc. sans durée sélectionnée)
    return Math.min(530 * count, 4650);
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
  { key: 'budgetPerDay', text: () => "Quel est votre budget par jour ?", type: 'text', inputType: 'tel', defaultValue: "5000" },
  { key: 'description', text: () => "Veuillez donner des détails sur votre demande", type: 'text', placeholder: 'Détails de la tâche...' },
];

export const workerHireQuestions: Question[] = [
  { key: 'serviceCity', text: () => "Où le travailleur doit-il exercer ?", type: 'text', placeholder: 'Ex: Abidjan, Cocody' },
  { key: 'salary', text: () => "Quel salaire mensuel proposez-vous ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 60000' },
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
    { key: 'dailyBudget', text: () => "Budget journalier prévu ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 10000' },
    { key: 'workDescription', text: () => "Détail des travaux à effectuer ?", type: 'text', placeholder: 'Besoins...' },
];

export const apartmentQuestions: Question[] = [
    { key: 'commune', text: () => "Dans quelle commune souhaitez-vous louer ?", type: 'text', placeholder: 'Ex: Cocody, Angré...' },
    { key: 'budget', text: () => "Quel est votre budget mensuel maximum ?", type: 'text', inputType: 'tel', defaultValue: "150000" },
    { key: 'description', text: () => "Précisez le type de bien (ex: 3 pièces, studio...)", type: 'text', placeholder: 'Détails...' },
];

export const equipmentQuestions: Question[] = [
    { key: 'city', text: () => "Ville de location de l'équipement ?", type: 'text', placeholder: 'Ex: Abidjan' },
    { key: 'duration', text: () => "Pour combien de jours ?", type: 'select', options: DURATION_DAYS_OPTIONS },
    { key: 'budget', text: () => "Budget total ou par jour prévu ?", type: 'text', inputType: 'tel', defaultValue: "15000" },
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
    { key: 'price', text: () => "Quel est votre budget (en francs) ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 5000000' },
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
    { key: 'dailyBudget', text: () => "Budget prévu par jours ?", type: 'text', inputType: 'tel', placeholder: 'Ex: 50000' },
    { key: 'extraInfo', text: () => "Informations complémentaires ?", type: 'text', placeholder: 'Détails...' },
];

export const getQuestionsForType = (formType: string, title: string, serviceMode?: string): Question[] => {
    if (formType === 'night_service') return [
        { key: 'serviceNeeded', text: () => "Quel service d'urgence recherchez-vous ?", type: 'text', placeholder: 'Ex: Pharmacie, Serrurier...' },
        { key: 'budget', text: () => "Quel est votre budget pour cette intervention ?", type: 'text', inputType: 'tel', defaultValue: "10000" },
    ];
    if (formType === 'personal_worker') return [
        { key: 'workerTitle', text: () => "Quel métier recherchez-vous ?", type: 'text', placeholder: 'Ex: maçon, électricien...' },
        ...(serviceMode === 'Embaucher' ? workerHireQuestions : workerRapidQuestions)
    ];
    if (formType === 'rapid_building_service') return rapidBuildingQuestions;
    if (formType === 'worker') return (serviceMode === 'Embaucher' ? workerHireQuestions : workerRapidQuestions);
    
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
