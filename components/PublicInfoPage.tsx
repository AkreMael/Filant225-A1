import React from 'react';
import { ArrowLeft, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PublicInfoPageProps {
  type: 'utilisation' | 'conditions';
  onBack?: () => void;
}

export const PublicInfoPage: React.FC<PublicInfoPageProps> = ({ type, onBack }) => {
  const isUtilisation = type === 'utilisation';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <div>
            <span className="font-black text-lg text-slate-900 tracking-tight block">
              FILANT<span className="text-orange-500 font-black">°225</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest block -mt-0.5">
              Service d'information public
            </span>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase tracking-wider border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        )}
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Icon Header */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 mb-8 border border-orange-500/20">
            {isUtilisation ? (
              <BookOpen className="w-7 h-7 text-orange-600" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-8">
            {isUtilisation ? "Informations sur l'utilisation" : "Conditions des services"}
          </h1>

          <div className="space-y-8 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            {isUtilisation ? (
              <>
                <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl">
                  <p className="text-slate-800 font-semibold text-sm sm:text-base">
                    Cette plateforme permet de faciliter la mise en relation entre des clients et des prestataires de services en Côte d'Ivoire.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3.5 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs mt-0.5">
                      1
                    </div>
                    <p className="text-slate-700">
                      L'objectif est de permettre aux utilisateurs de trouver des services adaptés et aux prestataires de proposer leurs services via la plateforme.
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs mt-0.5">
                      2
                    </div>
                    <p className="text-slate-700">
                      La plateforme agit comme un intermédiaire de mise en relation et ne réalise pas directement les prestations.
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs mt-0.5">
                      3
                    </div>
                    <p className="text-slate-700">
                      Chaque utilisateur doit fournir des informations exactes et utiliser la plateforme de manière responsable.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <p className="text-slate-800 font-semibold text-sm sm:text-base">
                    L'utilisation de la plateforme implique le respect des règles suivantes :
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3.5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">
                        Pour les Clients
                      </h3>
                      <p className="text-slate-700 text-sm sm:text-[15px]">
                        Les clients doivent fournir des informations correctes, respecter les prestataires et utiliser les services proposés conformément aux règles de la plateforme.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">
                        Pour les Prestataires
                      </h3>
                      <p className="text-slate-700 text-sm sm:text-[15px]">
                        Les prestataires doivent fournir des informations exactes, proposer des services de qualité, respecter leurs engagements et adopter un comportement professionnel envers les clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">
                        Responsabilité mutuelle
                      </h3>
                      <p className="text-slate-700 text-sm sm:text-[15px]">
                        Chaque partie est responsable de ses échanges et de l'exécution des services convenus. La plateforme facilite uniquement la mise en relation entre les utilisateurs et les prestataires.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                Retour à la plateforme
              </button>
            ) : (
              <div className="w-full sm:w-auto text-slate-400 text-xs font-semibold">
                FILANT°225 • Côte d'Ivoire
              </div>
            )}
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              © TOUS DROITS RÉSERVÉS
            </span>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest border-t border-slate-100">
        FILANT°225 • SERVICE SÉCURITÉ & TRANSPARENCE
      </footer>
    </div>
  );
};
