import React from 'react';
import { openPaymentWhatsAppSupport } from '../utils/whatsappUtils';

interface WhatsAppPaymentSupportButtonProps {
  serviceName: string;
  amount: string | number;
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'compact' | 'card';
  paymentRef?: string;
  waveLink?: string;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-white" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.332 5.002l-1.416 5.17 5.289-1.387c1.47 0.8 3.125 1.22 4.78 1.221h.005c5.506 0 9.989-4.478 9.99-9.984 0-2.668-1.039-5.176-2.927-7.064s-4.398-2.942-7.063-2.942zm0 18.257c-1.493 0-2.955-.401-4.233-1.159l-.304-.18-3.146.824.839-3.067-.198-.315c-.833-1.326-1.273-2.868-1.273-4.453 0-4.57 3.719-8.288 8.293-8.288 2.215 0 4.297.863 5.862 2.43 1.565 1.566 2.427 3.649 2.426 5.864 0 4.571-3.719 8.288-8.291 8.288zm4.542-6.208c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.291.187-.54.062-.249-.125-1.052-.388-2.003-1.236-.74-.66-1.24-1.475-1.385-1.724-.145-.249-.015-.384.109-.508.112-.112.249-.291.374-.436.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.436-.062-.125-.56-1.349-.768-1.847-.203-.486-.41-.42-.56-.428l-.478-.009c-.166 0-.436.062-.664.311-.228.249-.872.851-.872 2.075 0 1.224.892 2.407 1.017 2.573.125.166 1.756 2.682 4.254 3.762.594.257 1.058.411 1.42.526.598.19 1.142.163 1.572.099.48-.071 1.472-.602 1.679-1.183.208-.581.208-1.079.145-1.183-.062-.104-.228-.187-.477-.312z" />
  </svg>
);

export const WhatsAppPaymentSupportButton: React.FC<WhatsAppPaymentSupportButtonProps> = ({
  serviceName,
  amount,
  className = '',
  buttonText = 'Contacter le service client pour la validation de votre paiement',
  variant = 'primary',
  paymentRef,
  waveLink
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openPaymentWhatsAppSupport(serviceName, amount, paymentRef, waveLink);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        type="button"
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
        <span className="text-center">{buttonText}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm tracking-wide rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-emerald-400/30 font-sans my-2 ${className}`}
    >
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <WhatsAppIcon className="w-4 h-4 text-white" />
      </div>
      <span className="text-center leading-snug">{buttonText}</span>
    </button>
  );
};

export default WhatsAppPaymentSupportButton;
