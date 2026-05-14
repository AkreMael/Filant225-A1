
import React, { useState } from 'react';
import WavePaymentScreen from './WavePaymentScreen';
import { CreditCard } from 'lucide-react';

const BackIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

interface PaymentScreenProps {
  onBack: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack }) => {
    const [showWavePayment, setShowWavePayment] = useState(false);

    const handlePaymentClick = (item: string, amountStr: string | null, type: 'Service' | 'Location' = 'Service') => {
        const amount = amountStr ? amountStr.replace(/\D/g, '') : "custom";
        const waveLink = amount === "custom" 
            ? "https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=" 
            : `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${amount}`;

        const event = new CustomEvent('trigger-payment-view', {
            detail: {
                title: item,
                amount: amount,
                waveLink: waveLink,
                paymentType: type
            }
        });
        window.dispatchEvent(event);
    };

    if (showWavePayment) {
        return <WavePaymentScreen onBack={() => setShowWavePayment(false)} />;
    }

    return (
        <div className="flex flex-col h-full bg-cyan-400 dark:bg-cyan-800 text-gray-800 dark:text-white font-sans">
            <header className="flex items-center p-4 bg-cyan-500/50 dark:bg-cyan-900/50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
                <button onClick={onBack} className="p-2.5 bg-white/20 backdrop-blur-md rounded-full shadow-md hover:bg-white/30 transition-all active:scale-95 flex-shrink-0 border border-white/30">
                    <BackIcon className="h-6 w-6 text-white" />
                </button>
                <div className="flex items-center gap-2 ml-4">
                    <h1 className="text-xl font-bold text-white">Paiement</h1>
                    <CreditCard className="w-6 h-6 text-white" />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-center text-white font-medium mb-4 text-sm px-2">
                    Nous avons adopté le paiement par lien Wave afin de protéger nos clients et de faciliter la validation des demandes directement via l'assistant.
                </p>

                {/* Card 1 - Montant d'expédition (Modifié) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="font-bold text-base sm:text-lg">Montant d’expédition</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Le montant dépend de la ville d’où vient le travailleur.</p>
                    </div>
                    <button onClick={() => handlePaymentClick('Montant d’expédition', null, 'Service')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap text-sm sm:text-base transform hover:scale-105 transition-transform flex items-center gap-2">
                        <span>Payer</span>
                        <CreditCard className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Card 2 - Comm service */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                     <div className="flex-1">
                        <h2 className="font-bold text-base sm:text-lg">Tarif Communication service</h2>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg">100 CFA</p>
                    </div>
                    <button onClick={() => handlePaymentClick('Tarif Communication service', '100', 'Service')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-center text-sm sm:text-base transform hover:scale-105 transition-transform flex items-center gap-2">
                        <div className="flex flex-col">
                            <span>Payer</span>
                            <span>100 CFA</span>
                        </div>
                        <CreditCard className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Card 3 - Inscription */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                     <div className="flex-1">
                        <h2 className="font-bold text-base sm:text-lg">Mise en ligne d’inscription</h2>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg">310 CFA</p>
                    </div>
                    <button onClick={() => handlePaymentClick('Mise en ligne d’inscription', '310', 'Service')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-center text-sm sm:text-base transform hover:scale-105 transition-transform flex items-center gap-2">
                        <div className="flex flex-col">
                            <span>Payer</span>
                            <span>310 CFA</span>
                        </div>
                        <CreditCard className="w-5 h-5 text-white" />
                    </button>
                </div>
                
                {/* Card 4 - Carte */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                     <div className="flex-1">
                        <h2 className="font-bold text-base sm:text-lg">Carte (FILANT°225)</h2>
                         <p className="text-green-600 dark:text-green-400 font-bold text-lg">7100 CFA</p>
                    </div>
                    <div className="flex space-x-2">
                         <button onClick={() => handlePaymentClick('Carte FILANT°225', '7100', 'Service')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-center text-sm sm:text-base transform hover:scale-105 transition-transform flex items-center gap-2">
                            <div className="flex flex-col">
                                <span>Payer</span>
                                <span>7100 CFA</span>
                            </div>
                            <CreditCard className="w-5 h-5 text-white" />
                        </button>
                        <button onClick={() => setShowWavePayment(true)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-sm sm:text-base transform hover:scale-105 transition-transform">
                            Autre
                        </button>
                    </div>
                </div>

                {/* Card 5 - Renouvellement Carte */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                     <div className="flex-1">
                        <h2 className="font-bold text-base sm:text-lg">Renouvellement Carte</h2>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg">500 CFA</p>
                    </div>
                    <button onClick={() => handlePaymentClick('Renouvellement Carte FILANT°225', '500', 'Service')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-center text-sm sm:text-base transform hover:scale-105 transition-transform flex items-center gap-2">
                        <div className="flex flex-col">
                            <span>Payer</span>
                            <span>500 CFA</span>
                        </div>
                        <CreditCard className="w-5 h-5 text-white" />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PaymentScreen;
