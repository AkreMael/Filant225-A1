import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { databaseService } from '../services/databaseService';
import { User } from '../types';
import { 
  Percent, 
  Sparkles, 
  Award, 
  CheckCircle, 
  RefreshCw, 
  UserCheck, 
  Briefcase, 
  Heart, 
  TrendingUp, 
  Info
} from 'lucide-react';

interface EvolutionScreenProps {
  user: User;
  onClose?: () => void;
}

export const EvolutionScreen: React.FC<EvolutionScreenProps> = ({ user, onClose }) => {
  const [evolution, setEvolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEvolutionData = async (isRefreshed = false) => {
    if (!user?.phone) return;
    if (isRefreshed) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await databaseService.getUserEvolution(user.phone);
      if (data) {
        setEvolution(data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Impossible de récupérer vos données d'évolution pour le moment.");
      }
    } catch (err) {
      console.error("Error loading evolution metrics:", err);
      setErrorMessage("Une erreur s'est produite lors de la mise à jour de la progression.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.phone) return;
    setLoading(true);
    setErrorMessage(null);

    const unsubscribe = databaseService.subscribeToUserEvolution(user.phone, (data) => {
      if (data) {
        setEvolution(data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Impossible de récupérer vos données d'évolution pour le moment.");
      }
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.phone]);

  const handleRefresh = () => {
    fetchEvolutionData(true);
  };

  const getProfileLabel = (type: string) => {
    switch (type) {
      case 'Travailleur': return '👷 Travailleur Professionnel';
      case 'Propriétaire': return '🏠 Propriétaire Équipements';
      case 'Agence': return '🧑💼 Agence Immobilière';
      case 'Entreprise': return '🏢 Entreprise Partenaire';
      default: return '🧑💼 Client FILANT°225';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 text-slate-100 min-h-screen py-6 px-4 pb-28 flex flex-col justify-start relative select-text">
      {/* Background radial soft light decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#008000]/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

      {/* Header section with back button if onClose is provided */}
      <div className="w-full flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#008000] p-2 rounded-xl text-white shadow-lg shadow-[#008000]/30">
            <Percent className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight bg-gradient-to-r from-white via-slate-200 to-green-400 bg-clip-text text-transparent">
              Évolution & Succès
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-[#008000]">
              Mon statut de fidélité
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            id="btn_close_evolution"
            onClick={onClose}
            className="text-xs font-black uppercase text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition duration-200"
          >
            Fermer
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="w-full flex-grow flex flex-col gap-6 z-10">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-[#008000] animate-spin" />
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest">
              Génération du bilan...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl text-center">
            <p className="text-sm text-red-300 font-medium">{errorMessage}</p>
            <button
              id="btn_retry_evolution"
              onClick={() => fetchEvolutionData()}
              className="mt-4 px-4 py-2 bg-red-600 rounded-xl text-white text-xs font-black uppercase"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* User Profile Overview Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-black">
                    {getProfileLabel(evolution?.profileType)}
                  </span>
                  <h2 className="text-lg font-black text-white mt-2">
                    {user?.name || 'Utilisateur'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user?.phone || 'Aucun numéro'} • {user?.city || 'Abidjan'}
                  </p>
                </div>

                <div className="bg-[#008000]/10 border border-[#008000]/40 text-[#5cb85c] px-3 py-2 rounded-2xl flex flex-col items-center">
                  <Award className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px] font-black uppercase tracking-tight">
                    {evolution?.badge || 'Membre'}
                  </span>
                </div>
              </div>

              {/* Progress Tracker Section */}
              <div className="mt-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Niveau Global
                  </span>
                  <span className="text-2xl font-black text-green-400 tracking-tight">
                    {evolution?.percentage || 0}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-3 bg-slate-850 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${evolution?.percentage || 0}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                  />
                </div>

                <div className="flex justify-between mt-2.5 text-[10px] text-slate-500 font-bold uppercase">
                  <span>0% Débutant</span>
                  <span>
                    {evolution?.points || 0} / {evolution?.maxPoints || 100} Activité
                  </span>
                  <span>
                    {evolution?.profileType === 'Client' ? '90% Max' : '100% Expert'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Sub-explanation card depending on role */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-3xl flex flex-col gap-4"
            >
              <div className="flex gap-3">
                <div className="bg-green-500/10 p-2 rounded-xl text-green-400 h-fit">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Comment évoluer ?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {evolution?.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/80 my-1"></div>

              {/* Dynamic stats tracker row */}
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                <span className="text-xs text-slate-400 font-medium">
                  Activité enregistrée :
                </span>
                <span className="text-xs font-black text-white uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  {evolution?.detailsText}
                </span>
              </div>
            </motion.div>

            {/* Special status reward unlocked card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`p-5 rounded-3xl border transition duration-300 ${
                evolution?.percentage >= (evolution?.profileType === 'Client' ? 90 : 100)
                  ? 'bg-gradient-to-b from-[#008000]/20 to-slate-900 border-[#008000]/40'
                  : 'bg-slate-900/20 border-slate-850 opacity-40'
              }`}
            >
              <div className="flex gap-3.5">
                <div className={`p-2.5 rounded-xl h-fit ${
                  evolution?.percentage >= (evolution?.profileType === 'Client' ? 90 : 100)
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-slate-850 text-slate-500'
                }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {evolution?.percentage >= (evolution?.profileType === 'Client' ? 90 : 100)
                      ? 'Statut Privilégié Débloqué !'
                      : 'Niveau d\'Excellence en attente'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                    {evolution?.profileType === 'Travailleur' && (
                      evolution?.percentage >= 100 
                        ? "Félicitations ! Votre défilé régulier et vos scans multiples vous confèrent le statut de Travailleur Favori. Vous êtes sélectionné en priorité côté admin pour les meilleures missions de la région."
                        : "Atteignez 100% de progression (35 scans ou missions) pour déverrouiller le Statut Spécial de Travailleur Favori et bénéficier de bonus et mises en relation de priorité."
                    )}
                    {evolution?.profileType === 'Client' && (
                      evolution?.percentage >= 90
                        ? "Félicitations ! En tant que Client Privilégié (90% d'activité), vos démarches sont traitées instantanément avec un conseiller dédié et des frais administratifs allégés."
                        : "Effectuez régulièrement vos demandes de service, de logement ou de stagiaires pour augmenter votre fidélité jusqu'à 90% et débloquer les traitements prioritaires."
                    )}
                    {evolution?.profileType !== 'Travailleur' && evolution?.profileType !== 'Client' && (
                      evolution?.percentage >= 100
                        ? "Félicitations ! Vos multiples interactions partenaires ont validé votre profil Certifié FILANT°225. Vos annonces et offres s'affichent avec une pastille dorée de recommandation."
                        : "Optimisez vos fiches d'équipements, validez vos inscriptions et enrichissez votre catalogue pour finaliser votre certification partenaire à 100%."
                    )}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Refresh component control */}
            <div className="w-full flex justify-center mt-4">
              <button
                id="btn_refresh_evolution"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition duration-300 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-green-500' : ''}`} />
                {refreshing ? 'Synchronisation...' : 'Rafraîchir Progression'}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Info Notice Box */}
      <div className="mt-8 bg-slate-950 border border-slate-900 p-4 rounded-2xl flex gap-3 text-[11px] text-slate-500 leading-normal z-10 select-none">
        <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          Ce système de progression calcule de façon sécurisée et en temps réel l'ensemble de votre activité, de vos sollicitations et de vos demandes validées au sein de FILANT°225.
        </p>
      </div>

    </div>
  );
};
