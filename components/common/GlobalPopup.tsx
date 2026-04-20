
import React from 'react';

interface GlobalPopupProps {
  message: string;
  type: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirmLoading?: boolean;
}

const GlobalPopup: React.FC<GlobalPopupProps> = ({ message, type, onConfirm, onCancel, confirmLabel, cancelLabel, isConfirmLoading }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl p-8 max-w-[320px] w-full border-2 border-orange-500 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="mb-8 text-center">
            {type === 'alert' ? (
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            ) : (
                 <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            )}
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                {message}
            </h3>
        </div>

        <div className="flex gap-4 justify-center">
            {type === 'confirm' && (
                <button 
                    onClick={onCancel}
                    disabled={isConfirmLoading}
                    className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-black rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors uppercase text-[11px] tracking-widest disabled:opacity-50"
                >
                    {cancelLabel || 'Non'}
                </button>
            )}
            <button 
                onClick={onConfirm}
                disabled={isConfirmLoading}
                className={`flex-1 py-3 px-4 font-black rounded-xl text-white shadow-lg transition-transform transform active:scale-95 uppercase text-[11px] tracking-widest ${isConfirmLoading ? 'bg-gray-800' : (type === 'confirm' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600')}`}
            >
                {isConfirmLoading ? (
                    <span className="animate-blink-gray">Paiement en cours</span>
                ) : (
                    confirmLabel || (type === 'confirm' ? 'Oui' : 'OK')
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalPopup;
