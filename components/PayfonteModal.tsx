
import React, { useState, useEffect } from 'react';
import { payfonteService, PayfonteResponse } from '../services/payfonteService';

interface PayfonteModalProps {
  response: PayfonteResponse;
  onClose: (status: 'success' | 'failed' | 'cancelled') => void;
  onOtpSubmit: (code: string) => void;
}

const PayfonteModal: React.FC<PayfonteModalProps> = ({ response, onClose, onOtpSubmit }) => {
  const [status, setStatus] = useState<'processing' | 'otp' | 'success' | 'failed'>(response.data.action === 'otp' ? 'otp' : 'processing');
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'processing') {
      // Polling simulation
      interval = setInterval(async () => {
        const res = await payfonteService.verifyTransaction(response.data.reference);
        if (res === 'success') {
          setStatus('success');
          clearInterval(interval);
          setTimeout(() => onClose('success'), 2000);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, response.data.reference, onClose]);

  return (
    <div className="absolute inset-0 bg-black/90 z-[600] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-800 border-2 border-orange-500 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        {status === 'processing' && (
          <div className="space-y-6">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-white">Validation en cours...</h2>
            <p className="text-gray-300 text-sm">
              Veuillez vérifier votre téléphone. <br/>
              Une demande de confirmation USSD a été envoyée. Saisissez votre code PIN pour valider les <span className="text-orange-500 font-bold">{response.data.amount} CFA</span>.
            </p>
          </div>
        )}

        {status === 'otp' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Code de sécurité</h2>
            <p className="text-gray-300 text-sm">Entrez le code OTP reçu par SMS pour finaliser le paiement.</p>
            <input 
              type="text" 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center text-2xl tracking-[0.5em] text-white focus:border-orange-500 outline-none"
              placeholder="000000"
            />
            <button 
              onClick={() => onOtpSubmit(otpCode)}
              disabled={otpCode.length < 4}
              className="w-full bg-orange-500 py-4 rounded-xl text-white font-bold disabled:opacity-50"
            >
              Valider le code
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-roll-in">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Paiement Réussi !</h2>
            <p className="text-gray-300">Votre demande a été validée avec succès.</p>
          </div>
        )}

        <button 
          onClick={() => onClose('cancelled')}
          className="mt-8 text-gray-500 hover:text-white text-sm font-medium transition-colors"
        >
          Annuler la transaction
        </button>
      </div>
    </div>
  );
};

export default PayfonteModal;
