/**
 * Service de gestion des SMS pour FILANT°225
 * Solution temporaire : Utilisation de l'application SMS native du téléphone
 */

interface SMSParams {
  to: string;
  message: string;
}

class SMSService {
  /**
   * Ouvre l'application SMS native avec le numéro et le message pré-remplis
   * @param to Numéro de téléphone
   * @param message Contenu du SMS
   */
  async sendNativeSMS({ to, message }: SMSParams): Promise<boolean> {
    // Nettoyage du numéro
    let formattedPhone = to.replace(/\s/g, '').replace('+', '');
    
    // Détection de l'OS pour le séparateur de corps de message (? sur Android, & sur iOS récent)
    // On utilise standard "?" qui fonctionne sur la majorité des navigateurs mobiles modernes
    const smsUrl = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
    
    console.log(`[SMS NATIVE] Ouverture de l'app SMS vers ${formattedPhone}`);
    
    try {
      window.location.href = smsUrl;
      return true;
    } catch (error) {
      console.error("[SMS NATIVE] Erreur lors de l'ouverture de l'application SMS:", error);
      return false;
    }
  }

  // Envoi manuel Administrateur via l'application native
  async sendAdminManualSMS(to: string, message: string) {
    return this.sendNativeSMS({ to, message });
  }

  // Ces méthodes restent pour la structure mais pourraient aussi utiliser le mode natif si besoin
  async sendRegistrationConfirmation(to: string, name: string) {
    const msg = `Bonjour ${name}, bienvenue sur FILANT225 ! Votre inscription a ete recue. Un agent vous contactera apres validation du paiement de 310F.`;
    return this.sendNativeSMS({ to, message: msg });
  }

  async sendRequestNotification(to: string, service: string) {
    const msg = `FILANT225: Votre demande de ${service} a ete enregistree. Veuillez proceder au paiement pour la mise en relation rapide. Merci.`;
    return this.sendNativeSMS({ to, message: msg });
  }

  async sendMemberWelcome(to: string) {
    const msg = `FILANT225: Merci pour votre demande d'adhesion Membre Partenaire. Votre dossier est en cours de traitement par notre equipe.`;
    return this.sendNativeSMS({ to, message: msg });
  }
}

export const smsService = new SMSService();