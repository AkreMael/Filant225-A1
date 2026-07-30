import { trackContactWhatsAppEvent } from './analytics';

export const COMPANY_WHATSAPP_PHONE = "2250705052632";

export function formatPaymentAmount(amount: string | number): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0;
  if (!num) return String(amount);
  return num.toLocaleString('fr-FR').replace(/\s/g, ' ');
}

export function getPaymentWhatsAppMessage(serviceName: string, amount: string | number): string {
  const amountStr = formatPaymentAmount(amount);
  const nameLower = (serviceName || '').toLowerCase().trim();
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0;

  if (nameLower.includes('inscription') || nameLower.includes('frais de dossier') || numAmount === 310) {
    return `Bonjour, je suis en cours de validation de mon inscription FILANT°225 d’un montant de ${amountStr} F CFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  }

  if (
    nameLower.includes('carte professionnelle') ||
    nameLower.includes('carte filant') ||
    nameLower.includes('activation') ||
    numAmount === 7100
  ) {
    return `Bonjour, je suis en cours de validation de ma carte professionnelle FILANT°225 d’un montant de ${amountStr} F CFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  }

  if (nameLower.includes('dépôt') || nameLower.includes('depot') || nameLower.includes('recharge')) {
    return `Bonjour, je suis en cours de validation de mon dépôt de compte FILANT°225 d’un montant de ${amountStr} F CFA. Je souhaite obtenir une assistance concernant mon paiement.`;
  }

  let cleanedName = serviceName || 'mon service';
  if (cleanedName.toLowerCase().startsWith('service de :')) {
    cleanedName = cleanedName.replace(/^service de\s*:\s*/i, '');
  }

  return `Bonjour, je suis en cours de validation de ${cleanedName} FILANT°225 d’un montant de ${amountStr} F CFA. Je souhaite obtenir une assistance concernant mon paiement.`;
}

export function openPaymentWhatsAppSupport(serviceName: string, amount: string | number) {
  trackContactWhatsAppEvent(`payment_support_${serviceName}`);
  const message = getPaymentWhatsAppMessage(serviceName, amount);
  const url = `https://wa.me/${COMPANY_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
