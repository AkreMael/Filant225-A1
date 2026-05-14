
import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { getFormImage } from './common/formDefinitions';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;

interface TallyFormScreenProps {
  formUrl: string;
  formTitle?: string;
  onBack: () => void;
}

const TallyFormScreen: React.FC<TallyFormScreenProps> = ({ formUrl, formTitle = "Service FILANT°225", onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-[600] flex flex-col font-sans overflow-hidden"
    >
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Header Image Section */}
        <motion.div 
          initial={{ y: -50, opacity: 0, scale: 1.1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative h-[200px] w-full flex-shrink-0 bg-orange-600 flex items-center justify-center"
        >
            <FileText className="w-16 h-16 text-white/50" />
            <div className="absolute inset-0 bg-black/10"></div>
            <button 
              onClick={onBack} 
              className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-90 z-20"
            >
                <BackIcon />
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="text-white font-black text-xl tracking-tighter uppercase drop-shadow-lg">FILANT°225</span>
            </div>
        </motion.div>

        {/* Content Section (Rounded Container) */}
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 bg-white rounded-t-[3rem] -mt-12 relative z-10 p-0 flex flex-col overflow-hidden"
        >
            <div className="w-16 h-1.5 bg-gray-100 rounded-full my-4 self-center flex-shrink-0"></div>
            
            <div className="mb-4 flex flex-col items-center flex-shrink-0">
                <h2 className="text-xl font-black text-black uppercase tracking-tight text-center px-6 leading-tight">
                  {formTitle}
                </h2>
                <div className="h-1.5 w-20 bg-orange-500 mt-1 rounded-full"></div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-white overflow-hidden">
                <iframe
                    src={formUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    title={formTitle}
                    loading="lazy"
                    className="w-full h-full border-none outline-none"
                    style={{ display: 'block', height: '100%' }}
                >
                    Chargement du service...
                </iframe>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TallyFormScreen;
