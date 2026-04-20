
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Tu es l'assistant virtuel intelligent de la plateforme FILANT°225.
Ton rôle est d'aider les utilisateurs à valider leurs demandes de services.

--- RÈGLE CRITIQUE : MONTANT DE MISE EN RELATION ---
1. Pour toute demande concernant un APPARTEMENT, STUDIO, VILLA, MAGASIN ou TERRAIN (Location Immobilière), le montant de mise en relation est STRICTEMENT de 530 FCFA.
2. Lorsqu'un utilisateur t'envoie une demande contenant un prix ou un montant (ex: 530 FCFA, 7100 F), tu DOIS impérativement :
   - Identifier ce montant exact dans le texte reçu (souvent dans la section --- FACTURE ---).
   - Le mentionner CLAIREMENT et SANS ERREUR dans ta réponse.
   - Ne jamais inventer un autre prix.

Exemple de réponse attendue pour un appartement : "J'ai bien reçu votre demande pour ce Studio. Le montant de la mise en relation est de 530 FCFA. Vous pouvez procéder au paiement via le bouton ci-dessous."

--- RÈGLE DE RÉSUMÉ ---
Lorsque tu reçois une demande structurée (commençant par "Nouvelle demande via FILANT") :
1. Résume brièvement les informations essentielles.
2. Rappelle le montant exact calculé (530 FCFA pour l'immobilier, 4650 FCFA pour l'embauche, etc.).
3. Explique que l'utilisateur doit payer via le bouton orange de paiement, puis revenir "Transmettre" les informations sur WhatsApp avec son reçu.

--- RÈGLE GÉNÉRALE ---
Sois court, précis et professionnel. Toutes les données écrites par l'utilisateur sont importantes.
`;

const HOME_ASSISTANT_INSTRUCTION = `
Tu es l'assistant de la page d'accueil de FILANT°225.
Oriente naturellement l'utilisateur vers les Travailleurs, le Matériel ou l'Immobilier.
Rappelle-toi : Mise en relation Appartement = 530 FCFA.
`;

class ChatService {
  private chatSession: any;
  private homeAssistantSession: any;

  constructor() {
    this.startNewSession();
  }

  startNewSession() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
          console.error("GEMINI_API_KEY is missing!");
          return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      this.chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        }
      });

      this.homeAssistantSession = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
              systemInstruction: HOME_ASSISTANT_INSTRUCTION,
              temperature: 0.5,
          }
      });
      console.log("AI Chat sessions initialized successfully");
    } catch (error) {
      console.error("Error starting chat session:", error);
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
        this.startNewSession();
    }
    
    if (!this.chatSession) {
        return "Désolé, le service d'assistance est temporairement indisponible. Veuillez réessayer plus tard.";
    }

    try {
      const result = await this.chatSession.sendMessage({
          message: message
      });
      
      if (!result || !result.text) {
          throw new Error("Empty response from AI");
      }
      
      return result.text;
    } catch (error) {
      console.error("Chat Error:", error);
      // Tentative de réinitialisation de la session sur erreur
      this.startNewSession();
      
      try {
         if (!this.chatSession) throw new Error("Session not re-initialized");
         const retryResult = await this.chatSession.sendMessage({
            message: message
         });
         return retryResult.text || "Désolé, j'ai rencontré une petite erreur. Veuillez réessayer.";
      } catch (retryError) {
         console.error("Retry Chat Error:", retryError);
         return "Désolé, j'ai rencontré une petite erreur technique. Veuillez réessayer dans quelques instants.";
      }
    }
  }

  async getHomeAssistantAdvice(userInput: string): Promise<string> {
      if (!this.homeAssistantSession) {
          this.startNewSession();
      }
      try {
          const result = await this.homeAssistantSession.sendMessage({
              message: userInput
          });
          return result.text;
      } catch (error) {
          return "Bonjour ! Je suis là pour vous aider. Que recherchez-vous ?";
      }
  }
}

export const chatService = new ChatService();
