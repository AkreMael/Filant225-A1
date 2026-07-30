import { trackContactWhatsAppEvent } from './analytics';

export const COMPANY_WHATSAPP_PHONE = "2250705052632";

export function formatPaymentAmount(amount: string | number): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0;
  if (!num) return String(amount);
  return num.toLocaleString('fr-FR').replace(/\s/g, ' ');
}

export function getPaymentWhatsAppMessage(
  serviceName: string, 
  amount: string | number,
  paymentRef?: string,
  waveLink?: string
): string {
  const amountStr = formatPaymentAmount(amount);
  const nameLower = (serviceName || '').toLowerCase().trim();
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0;

  let baseMsg = "";
  if (nameLower.includes('inscription') || nameLower.includes('frais de dossier') || numAmount === 310) {
    baseMsg = `Bonjour, je suis en cours de validation de mon inscription FILANT°225 d’un montant de ${amountStr} FCFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  } else if (
    nameLower.includes('carte professionnelle') ||
    nameLower.includes('carte filant') ||
    nameLower.includes('activation') ||
    numAmount === 7100
  ) {
    baseMsg = `Bonjour, je suis en cours de validation de ma carte professionnelle FILANT°225 d’un montant de ${amountStr} FCFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  } else if (nameLower.includes('dépôt') || nameLower.includes('depot') || nameLower.includes('recharge')) {
    baseMsg = `Bonjour, je suis en cours de validation de mon dépôt de compte FILANT°225 d’un montant de ${amountStr} FCFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  } else {
    let cleanedName = serviceName || 'mon service';
    if (cleanedName.toLowerCase().startsWith('service de :')) {
      cleanedName = cleanedName.replace(/^service de\s*:\s*/i, '');
    }
    baseMsg = `Bonjour, je suis en cours de validation de ${cleanedName} FILANT°225 d’un montant de ${amountStr} FCFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  }

  const details: string[] = [];
  if (serviceName) {
    details.push(`• Type de paiement : ${serviceName}`);
  }
  if (amount) {
    details.push(`• Montant : ${amountStr} FCFA`);
  }
  if (paymentRef) {
    details.push(`• Référence : ${paymentRef}`);
  }
  if (waveLink && waveLink.startsWith('http')) {
    details.push(`• Lien Wave / Paiement : ${waveLink}`);
  }

  if (details.length > 0) {
    baseMsg += `\n\n📌 Détails de la demande :\n${details.join('\n')}`;
  }

  return baseMsg;
}

export function openPaymentWhatsAppSupport(
  serviceName: string, 
  amount: string | number,
  paymentRef?: string,
  waveLink?: string
) {
  trackContactWhatsAppEvent(`payment_support_${serviceName}`);
  const message = getPaymentWhatsAppMessage(serviceName, amount, paymentRef, waveLink);
  const url = `https://wa.me/${COMPANY_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
