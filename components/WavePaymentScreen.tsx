
import React, { useState, useMemo } from 'react';

const BackIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const PAYMENT_LOGO_URL = "https://i.supaimg.com/ff5dee1c-8ed5-426e-8fb7-eba013e98837.png";

interface WavePaymentScreenProps {
  onBack: () => void;
}

interface PaymentOption {
  amount: number;
  serviceName: string;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  { amount: 4500, serviceName: "(Fin Du Service Client)", description: "Travailleur" },
  { amount: 530, serviceName: "(Fin Du Service Client)", description: "Agence Location" },
  { amount: 2000, serviceName: "(Fin Du Service Agence Propriétaire)", description: "" },
  { amount: 500, serviceName: "Renouveler la carte FILANT°225", description: "Ce paiement permet de renouveler la carte professionnelle du service FILANT°225." }
];

const WavePaymentScreen: React.FC<WavePaymentScreenProps> = ({ onBack }) => {
    const [selectedAmount, setSelectedAmount] = useState<number>(4500);
    const [isLoading, setIsLoading] = useState(false);

    const selectedOption = useMemo(() => {
        return paymentOptions.find(p => p.amount === selectedAmount) || paymentOptions[0];
    }, [selectedAmount]);

    const handleStartPayment = () => {
        const event = new CustomEvent('trigger-payment-view', {
            detail: {
                title: selectedOption.serviceName,
                amount: selectedAmount.toString(),
                waveLink: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${selectedAmount}`,
                paymentType: "Service"
            }
        });
        window.dispatchEvent(event);
        onBack();
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1d] text-white font-sans overflow-hidden">
            <header className="flex items-center p-4 bg-[#0a0f1d] border-b border-slate-800">
                <button onClick={onBack} className="p-2.5 bg-slate-800/50 backdrop-blur-md rounded-full shadow-md hover:bg-slate-800/70 transition-all active:scale-95 flex-shrink-0 border border-slate-700">
                    <BackIcon className="h-6 w-6 text-white" />
                </button>
                <div className="flex items-center gap-2 ml-4">
                    <h1 className="text-xl font-bold">Autre Paiement</h1>
                    <img src={PAYMENT_LOGO_URL} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                <div className="w-full max-w-md border-[3px] border-blue-400/40 rounded-[2.5rem] p-1 bg-[#111827] mt-4 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                    <div className="bg-[#111827] rounded-[2.3rem] p-6 space-y-6">
                        <h2 className="text-lg font-bold text-gray-200">Choisissez votre montant :</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {paymentOptions.map((option) => (
                                <button 
                                    key={option.amount}
                                    onClick={() => setSelectedAmount(option.amount)}
                                    className={`p-5 rounded-2xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center h-28 ${
                                        selectedAmount === option.amount 
                                            ? 'bg-orange-500 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                                            : 'bg-[#1f2937] border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <span className="text-2xl font-black">{option.amount}</span>
                                    <span className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">CFA</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                <h3 className="font-bold text-lg text-gray-100">{selectedOption.serviceName}</h3>
                            </div>
                            <p className="text-sm text-gray-400 pl-6 leading-relaxed">
                                {selectedOption.description || "Service professionnel FILANT°225"}
                            </p>
                        </div>

                        <button 
                            onClick={handleStartPayment}
                            disabled={isLoading}
                            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white font-black py-5 rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.3)] flex flex-col items-center justify-center group"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-3xl tracking-tight">{selectedAmount} CFA</span>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">Transmettre à l'assistant</span>
                                        <img src={PAYMENT_LOGO_URL} alt="Logo" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WavePaymentScreen;
