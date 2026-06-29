import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  getDocs as clientGetDocs, 
  doc as clientDoc, 
  getDoc as clientGetDoc, 
  addDoc as clientAddDoc, 
  updateDoc as clientUpdateDoc, 
  serverTimestamp as clientServerTimestamp 
} from "firebase/firestore";
import { getAuth as getClientAuth, signInAnonymously as clientSignInAnonymously } from "firebase/auth";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));

// Initialize Firestore with Firebase Admin (keep for admin SDK backwards compatibility if any)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID || firebaseConfig.projectId,
  });
}
const firestore = admin.firestore();
console.log("Firestore initialized successfully with project:", admin.app().options.projectId);

// Initialize Client Firebase SDK inside server.ts for authorized database operations (bypassing service account IAM limitation)
const clientApp = initializeClientApp(firebaseConfig);
const clientDb = getClientFirestore(clientApp);
const clientAuth = getClientAuth(clientApp);

async function getClientDb() {
  if (!clientAuth.currentUser) {
    try {
      await clientSignInAnonymously(clientAuth);
      console.log("Client SDK authenticated anonymously for server-side Firestore operations.");
    } catch (authError) {
      console.error("Error signing in anonymously in Client SDK server-side:", authError);
    }
  }
  return clientDb;
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create public/uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload-base64", async (req, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "No base64 image data provided" });
      }

      // Check for base64 prefix and extract clean base64 data
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let dataBuffer: Buffer;
      let extension = "jpg";

      if (matches && matches.length === 3) {
        extension = matches[1].split("/")[1] || "jpg";
        dataBuffer = Buffer.from(matches[2], 'base64');
      } else {
        dataBuffer = Buffer.from(base64, 'base64');
      }

      const uniqName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${extension}`;
      const savePath = path.join(uploadsDir, uniqName);

      fs.writeFileSync(savePath, dataBuffer);
      console.log(`Saved temporary local image upload: /uploads/${uniqName}`);

      res.json({ url: `/uploads/${uniqName}` });
    } catch (err: any) {
      console.error("Error saving base64 uploaded image on server:", err);
      res.status(500).json({ error: "Failed to upload image to server", details: err.message });
    }
  });

  app.use(cookieParser());
  app.use(session({
    secret: "filant-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true 
    }
  }));

  // Lazy initialization of OAuth2 client
  const getOAuth2Client = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn("Google OAuth credentials missing in environment variables.");
      return null;
    }

    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.APP_URL ? `${process.env.APP_URL}/auth/google/callback` : "http://localhost:3000/auth/google/callback"
    );
  };

  // API Routes
  app.post("/api/verify-identity", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Aucune image fournie." });
      }

      // Extract raw base64 and mimeType from data URL (e.g. data:image/jpeg;base64,...)
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;
      
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const aiClient = getGeminiClient();
      if (!aiClient) {
        console.warn("Gemini client not initialized, skipping validation and approving as fallback.");
        return res.json({ isValid: true, reason: "Bypass mode as API key not configured yet" });
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Analyse l'image fournie. Détermine s'il s'agit d'une pièce d'identité (comme une Carte Nationale d'Identité - CNI, Passeport, Permis de Conduire, Carte Professionnelle, ou autre document officiel d'identité et de légitimation en Côte d'Ivoire ou de format administratif officiel général). Réponds avec un JSON contenant isValid (boolean) et reason (string)."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: {
                type: Type.BOOLEAN,
                description: "True if the image looks like an official Ivorian identity card, professional card, passport, driver's license, or general official ID document. False if the image is unrelated."
              },
              reason: {
                type: Type.STRING
              }
            },
            required: ["isValid"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      console.log("Identity validation result from Gemini:", result);
      
      return res.json({
        isValid: !!result.isValid,
        reason: result.reason || ""
      });

    } catch (err: any) {
      console.error("Error in /api/verify-identity:", err);
      // Let's print the actual error if we want, or fall back to true/false
      return res.status(500).json({ error: "Erreur de validation", details: err.message });
    }
  });

  app.post("/api/publish-offer", async (req, res) => {
    console.log("POST /api/publish-offer received:", req.body);
    try {
      const { name, city, price, frequency, service, description, userId, photoUrl, isUnblurred } = req.body;
      
      if (!name || !service) {
        return res.status(400).json({ error: "Nom et Métier sont obligatoires." });
      }

      // Save to Firestore for immediate display
      console.log("Saving to Firestore collection 'Travailleurs'...");
      let docRef;
      try {
        // 1. Save to 'Travailleurs' for immediate display on the page
        const dbInstance = await getClientDb();
        const docRefResult = await clientAddDoc(clientCollection(dbInstance, "Travailleurs"), {
          name,
          city: city || "Non spécifiée",
          price: price || "À discuter",
          frequency: frequency || "mois",
          service,
          description: description || `Disponible pour : ${service}`,
          createdAt: clientServerTimestamp(),
          isVerified: false,
          typeInscription: "Demande d'emploi",
          userId: userId || null,
          photoUrl: photoUrl || null,
          isUnblurred: isUnblurred || false
        });
        console.log("Saved to 'Travailleurs' with ID:", docRefResult.id);
        docRef = docRefResult;
      } catch (firestoreError: any) {
        console.error("Firestore Write Error:", firestoreError);
        return res.status(500).json({ error: "Erreur lors de la sauvegarde dans Firestore.", details: firestoreError.message });
      }

      return res.json({ id: docRef.id, success: true });
    } catch (error: any) {
      console.error("CRITICAL Error in /api/publish-offer:", error);
      return res.status(500).json({ 
        error: "Erreur interne du serveur lors de la publication.", 
        details: error.message 
      });
    }
  });

  app.post("/api/update-offer-blur", async (req, res) => {
    try {
      const { offerId, isUnblurred } = req.body;
      if (!offerId) {
        return res.status(400).json({ error: "Missing offerId" });
      }
      const dbInstance = await getClientDb();
      await clientUpdateDoc(clientDoc(dbInstance, "Travailleurs", offerId), {
        isUnblurred: !!isUnblurred
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating offer blur:", error);
      res.status(500).json({ error: "Failed to update blur", details: error.message });
    }
  });

  app.get("/api/workers", async (req, res) => {
    try {
      // Fetch from multiple collections in parallel to provide a comprehensive list quickly
      const dbInstance = await getClientDb();
      const collections = ["Travailleurs", "Agences immobilières", "Équipements", "Entreprises"];
      
      const snapshots = await Promise.all(
        collections.map(col => clientGetDocs(clientCollection(dbInstance, col)))
      );

      const allDocs: any[] = [];
      
      snapshots.forEach((snapshot, index) => {
        const col = collections[index];
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          
          let name = "Professionnel";
          let description = "";

          // We map the card's main title ('name') to the trade/profession (métier)
          // and keep 'description' as the details of the service.
          if (col === "Travailleurs") {
            name = data.job || data.jobTitle || data.service || "Professionnel";
            description = data.description || `Disponible pour : ${name}`;
          } else if (col === "Agences immobilières") {
            name = data.agencyName || "Agence immobilière";
            description = data.description || data.services?.join(", ") || "Services d'agence immobilière";
          } else if (col === "Équipements") {
            name = data.equipmentType || "Location d'équipements";
            description = data.description || "Location d'équipements et accessoires";
          } else if (col === "Entreprises") {
            name = data.companyName || "Entreprise";
            description = data.description || "Opportunité professionnelle";
          }

          // Fetch highly polished fallback descriptions if standard description is empty or generic
          const nameLower = name.toLowerCase().trim();
          let fallbackDesc = "";
          
          if (nameLower.includes('vendeuse') || nameLower.includes('vendeur')) {
            fallbackDesc = "Assure la vente, l’accueil des clients et la gestion d’une boutique.";
          } else if (nameLower.includes('cuisinier') || nameLower.includes('cuisinière') || nameLower.includes('cuisine')) {
            fallbackDesc = "Prépare les repas pour restaurant, foyer, entreprise ou événements.";
          } else if (nameLower.includes('serveur') || nameLower.includes('serveuse')) {
            fallbackDesc = "Accueille les clients, sert les plats et s’occupe des commandes.";
          } else if (nameLower.includes('coiffeur homme')) {
            fallbackDesc = "Coupes et coiffures masculines, entretien barbe.";
          } else if (nameLower.includes('coiffeuse femme') || nameLower.includes('coiffeuse') || nameLower.includes('coiffeur femme')) {
            fallbackDesc = "Tresses, tissages, tressages africains et soins capillaires féminins.";
          } else if (nameLower.includes('hôtesse d’accueil') || nameLower.includes('hotesse d’accueil')) {
            fallbackDesc = "Accueille les visiteurs, gère les informations et la réception.";
          } else if (nameLower.includes('chauffeur')) {
            fallbackDesc = "(Taxi, VTC, Entreprise) Conduit les clients ou le personnel d’un lieu à un autre.";
          } else if (nameLower.includes('agent d’entretien')) {
            fallbackDesc = "Nettoyeur professionnel de bureaux et locaux.";
          } else if (nameLower.includes('femme de ménage') || nameLower.includes('entretien')) {
            fallbackDesc = "Entretien ménager rigoureux et soins à domicile.";
          } else if (nameLower.includes('caissier') || nameLower.includes('caissière')) {
            fallbackDesc = "Gère les paiements, la caisse et l’accueil dans les commerces.";
          } else if (nameLower.includes('réceptionniste')) {
            fallbackDesc = "Accueille les clients dans hôtels, entreprises ou agences.";
          } else if (nameLower.includes('baby-sitter') || nameLower.includes('nounou')) {
            fallbackDesc = "Garde les enfants de façon ponctuelle ou régulière.";
          } else if (nameLower.includes('jardinier')) {
            fallbackDesc = "Entretient les jardins, pelouses, fleurs et espaces verts.";
          } else if (nameLower.includes('couturier') || nameLower.includes('couturière')) {
            fallbackDesc = "Coupe, confectionne et retouche des vêtements.";
          } else if (nameLower.includes('esthéticienne')) {
            fallbackDesc = "Fait les soins du visage, manucure, pédicure, beauté.";
          } else if (nameLower.includes('magasinier')) {
            fallbackDesc = "Gère les stocks, rangement et réception des marchandises.";
          } else if (nameLower.includes('manutentionnaire')) {
            fallbackDesc = "Charge, décharge et organise les marchandises.";
          } else if (nameLower.includes('agent de sécurité') || nameLower.includes('sécurité') || nameLower.includes('vigile')) {
            fallbackDesc = "Assure la sécurité et la surveillance d’un commerce, bâtiment ou d’une résidence.";
          } else if (nameLower.includes('laveur de vitres')) {
            fallbackDesc = "Nettoyage professionnel de vitres et surfaces vitrées.";
          } else if (nameLower.includes('climatisation') || nameLower.includes('climatiseur')) {
            fallbackDesc = "Entretien, nettoyage et recharge de climatiseurs.";
          } else if (nameLower.includes('caméra') || nameLower.includes('camera')) {
            fallbackDesc = "Installation et configuration de systèmes de vidéosurveillance.";
          } else if (nameLower.includes('pouf') || nameLower.includes('poufs')) {
            fallbackDesc = "Création et réparation de poufs et coussins.";
          } else if (nameLower.includes('fenêtre') || nameLower.includes('fenetre') || nameLower.includes('vitrée')) {
            fallbackDesc = "Pose de menuiserie aluminium et vitrerie.";
          } else if (nameLower.includes('menuisier')) {
            fallbackDesc = "Travaux de menuiserie bois et réparation de meubles.";
          } else if (nameLower.includes('aide à domicile')) {
            fallbackDesc = "Services d’aide à domicile et aide de vie quotidienne.";
          } else if (nameLower.includes('garde malade')) {
            fallbackDesc = "Garde malade de jour comme de nuit pour personnes dépendantes.";
          } else if (nameLower.includes('manucure')) {
            fallbackDesc = "Soin et mise en beauté des mains et des pieds à domicile.";
          } else if (nameLower.includes('massage')) {
            fallbackDesc = "Soins esthétiques du corps, massages de bien-être.";
          } else if (nameLower.includes('maquilleuse') || nameLower.includes('maquillage')) {
            fallbackDesc = "Maquillage professionnel pour mariages, soirées et événements.";
          } else if (nameLower.includes('pâtissier') || nameLower.includes('patissier') || nameLower.includes('pâtissière')) {
            fallbackDesc = "Création et préparation de pâtisseries artisanales pour événements et au quotidien.";
          } else if (nameLower.includes('plombier')) {
            fallbackDesc = "Dépannage plomberie ultra rapide et tuyauterie.";
          } else if (nameLower.includes('électricien') || nameLower.includes('electricien')) {
            fallbackDesc = "Dépannage électricité urgent et installation complète.";
          } else if (nameLower.includes('maçon') || nameLower.includes('macon')) {
            fallbackDesc = "Maçonnerie générale, chapes, dalles et construction de murs.";
          }

          if (fallbackDesc && (!description || description.includes('Disponible pour') || description === 'Professionnel qualifié')) {
            description = fallbackDesc;
          }

          allDocs.push({
            id: `${col}-${docSnap.id}`,
            name: name,
            profileImageUrl: data.profileImageUrl || "",
            phone: data.phone || "",
            rating: data.rating || 4.5,
            description: description,
            category: data.experience || data.typeInscription || "Disponible",
            isVerified: data.isVerified || false
          });
        });
      });

      res.json(allDocs);
    } catch (error: any) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ 
        error: "Failed to fetch workers", 
        details: error.message,
        code: error.code 
      });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const worker = req.body;
      const dbInstance = await getClientDb();
      const docRef = await clientAddDoc(clientCollection(dbInstance, "Travailleurs"), {
        ...worker,
        createdAt: clientServerTimestamp(),
      });
      res.json({ id: docRef.id, success: true });
    } catch (error: any) {
      console.error("Error saving worker:", error);
      res.status(500).json({ error: "Failed to save worker", details: error.message });
    }
  });

  app.post("/api/workers/verify", async (req, res) => {
    try {
      const { workerId, collection, isVerified } = req.body;
      if (!workerId || !collection) {
        return res.status(400).json({ error: "Missing workerId or collection" });
      }
      const dbInstance = await getClientDb();
      await clientUpdateDoc(clientDoc(dbInstance, collection, workerId), {
        isVerified: !!isVerified,
        verifiedAt: clientServerTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error verifying worker:", error);
      res.status(500).json({ error: "Failed to verify worker", details: error.message });
    }
  });

  app.get("/api/offers", async (req, res) => {
    try {
      const dbInstance = await getClientDb();
      const snapshot = await clientGetDocs(clientCollection(dbInstance, "Travailleurs"));
      const offers = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      res.json(offers);
    } catch (error: any) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ error: "Failed to fetch offers", details: error.message });
    }
  });

  app.post("/api/offers", async (req, res) => {
    try {
      const offer = req.body;
      const dbInstance = await getClientDb();
      const docRef = await clientAddDoc(clientCollection(dbInstance, "Travailleurs"), {
        ...offer,
        createdAt: clientServerTimestamp(),
      });
      res.json({ id: docRef.id, success: true });
    } catch (error) {
      console.error("Error saving offer:", error);
      res.status(500).json({ error: "Failed to save offer" });
    }
  });
  app.post("/api/recruitment", async (req, res) => {
    try {
      const data = req.body;
      const dbInstance = await getClientDb();
      const docRef = await clientAddDoc(clientCollection(dbInstance, "Messagerie"), {
        ...data,
        type: 'recruitment',
        createdAt: clientServerTimestamp(),
      });
      res.json({ id: docRef.id, success: true });
    } catch (error) {
      console.error("Error saving recruitment:", error);
      res.status(500).json({ error: "Failed to save recruitment" });
    }
  });

  app.post("/api/placement", async (req, res) => {
    try {
      const data = req.body;
      const dbInstance = await getClientDb();
      const docRef = await clientAddDoc(clientCollection(dbInstance, "Messagerie"), {
        ...data,
        type: 'placement',
        createdAt: clientServerTimestamp(),
      });
      res.json({ id: docRef.id, success: true });
    } catch (error) {
      console.error("Error saving placement:", error);
      res.status(500).json({ error: "Failed to save placement" });
    }
  });

  app.get("/api/auth/google/url", (req, res) => {
    const client = getOAuth2Client();
    if (!client) return res.status(500).json({ error: "OAuth not configured" });

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/contacts"],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const client = getOAuth2Client();
    if (!client) return res.status(500).send("OAuth not configured");

    try {
      const { tokens } = await client.getToken(code as string);
      (req.session as any).tokens = tokens;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentification réussie. Cette fenêtre va se fermer.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/contacts/sync", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
      return res.status(401).json({ error: "Not authenticated with Google" });
    }

    const client = getOAuth2Client();
    if (!client) return res.status(500).json({ error: "OAuth not configured" });

    const { contact } = req.body;
    client.setCredentials(tokens);
    const people = google.people({ version: "v1", auth: client });

    try {
      // Create contact in Google Contacts
      await people.people.createContact({
        requestBody: {
          names: [{ givenName: contact.name }],
          phoneNumbers: [{ value: contact.phone }],
          organizations: contact.type === 'AGENCE' ? [{ name: contact.agencyName }] : [],
          occupations: contact.type === 'TRAVAILLEUR' ? [{ value: contact.job }] : [],
          addresses: [{ city: contact.city }],
          biographies: [{ value: contact.description || contact.equipmentName || "" }]
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating contact in Google", error);
      res.status(500).json({ error: "Failed to sync contact" });
    }
  });

  app.post("/api/notifications/send", async (req, res) => {
    try {
      const { phone, title, body } = req.body;
      if (!phone || !title || !body) {
        return res.status(400).json({ error: "Missing phone, title or body" });
      }

      const sanitizedPhone = phone.replace(/\D/g, '');
      const dbInstance = await getClientDb();
      const userDoc = await clientGetDoc(clientDoc(dbInstance, "Clients", sanitizedPhone));
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.warn(`No FCM token found for user ${sanitizedPhone}`);
        return res.status(404).json({ error: "User FCM token not found" });
      }

      const message = {
        notification: {
          title,
          body,
        },
        token: fcmToken,
        webpush: {
          notification: {
            icon: '/icon.svg',
            badge: '/icon.svg',
          }
        }
      };

      await admin.messaging().send(message);
      console.log(`FCM notification sent to ${sanitizedPhone}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending FCM notification:", error);
      res.status(500).json({ error: "Failed to send notification", details: error.message });
    }
  });

  // Custom router/middleware to intercept HTML requests for sharing preview metadata
  let globalViteInstance: any = null;

  app.get(["/", "/index.html"], async (req, res, next) => {
    // We only intercept if adId is present
    if (!req.query.adId) {
      return next();
    }
    
    try {
      const adId = req.query.adId as string;
      const col = req.query.col as string || "Travailleurs";
      
      let title = "FILANT°225";
      let description = "Trouvez des travailleurs, équipements, agences ou opportunités en Côte d'Ivoire.";
      let imageUrl = "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/2286048e-7c07-4f27-b7c3-d7ce09254214.png";

      try {
        const docSnap = await firestore.collection(col).doc(adId).get();
        if (docSnap.exists) {
          const data = docSnap.data() || {};
          
          const type = (data.profileType === 'Agence immobilière' ? 'Agence' : data.profileType) || 'Travailleur';
          let mainTitle = '';
          let userName = '';

          if (type === 'Travailleur') {
            mainTitle = data.job || 'Travailleur Qualifié';
            userName = data.userName || data.name || 'Prestataire';
          } else if (type === 'Propriétaire') {
            mainTitle = data.equipmentType || data.equipmentCategory || 'Équipement';
            userName = data.ownerName || data.userName || data.name || 'Prestataire';
          } else if (type === 'Agence') {
            mainTitle = data.propertyTypes ? (Array.isArray(data.propertyTypes) ? data.propertyTypes.join(', ') : data.propertyTypes) : '';
            userName = data.agencyName || data.userName || data.name || 'Prestataire';
          } else if (type === 'Entreprise') {
            mainTitle = data.companyName || 'Entreprise';
            userName = data.companyOwner || data.userName || data.name || 'Prestataire';
          } else {
            mainTitle = data.titleOrActivity || 'Prestataire';
            userName = data.userName || data.name || 'Prestataire';
          }

          if (!mainTitle) {
            mainTitle = type === 'Agence' ? 'Immobilier' : (data.titleOrActivity || 'Service');
          }
          if (!userName) userName = data.name || 'Prestataire';

          if (mainTitle.toLowerCase() === userName.toLowerCase()) {
            if (type === 'Agence') {
              mainTitle = data.propertyTypes ? (Array.isArray(data.propertyTypes) ? data.propertyTypes.join(', ') : data.propertyTypes) : 'Immobilier';
              if (!mainTitle || mainTitle.toLowerCase() === userName.toLowerCase()) {
                mainTitle = 'Immobilier';
              }
            } else if (type === 'Propriétaire') {
              mainTitle = data.equipmentCategory || 'Location d\'équipements';
            } else if (type === 'Entreprise') {
              mainTitle = data.companyDomain || 'Services aux Entreprises';
            }
          }

          title = `${mainTitle} - ${userName}`;
          description = data.description || `Découvrez l'annonce de ${userName} sur FILANT°225.`;
          
          let primaryImg = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
          if (data.onlineImages && data.onlineImages.length > 0) {
            primaryImg = data.onlineImages[0];
          } else if (data.images && data.images.length > 0) {
            primaryImg = data.images[0];
          } else if (data.imageLink) {
            primaryImg = data.imageLink;
          } else if (data.photoUrl) {
            primaryImg = data.photoUrl;
          }
          imageUrl = primaryImg;
          if (imageUrl.startsWith("/")) {
            imageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
          }
        }
      } catch (dbErr) {
        console.error("Error reading Firestore document for share metadata:", dbErr);
      }

      // Read template index.html
      let templatePath = path.join(__dirname, process.env.NODE_ENV === "production" ? "dist" : "", "index.html");
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(__dirname, "index.html");
      }

      let html = fs.readFileSync(templatePath, "utf8");

      // In development mode, transform index.html with Vite
      if (process.env.NODE_ENV !== "production" && globalViteInstance) {
        html = await globalViteInstance.transformIndexHtml(req.originalUrl, html);
      }

      const metaTags = `
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta property="og:site_name" content="FILANT°225" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="twitter:image" content="${imageUrl}" />
      `;

      if (html.includes("</head>")) {
        html = html.replace("</head>", `${metaTags}\n</head>`);
      } else {
        html = html + metaTags;
      }

      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    } catch (err) {
      console.error("Error generating dynamic share page:", err);
      return next();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    globalViteInstance = vite;
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
