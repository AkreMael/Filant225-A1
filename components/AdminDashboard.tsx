
import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { ref as rtdbRef, onValue } from 'firebase/database';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { 
  Users, 
  Briefcase, 
  Building2, 
  MessageSquare, 
  QrCode, 
  CreditCard, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Search,
  LayoutDashboard,
  HardHat,
  Home,
  Factory,
  Mail,
  Scan,
  MoreVertical,
  Eye,
  X,
  FileText,
  Send,
  Trash2,
  Bell,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  onBack: () => void;
  user: User;
  onOpenChat: (userId: string, userName: string, type: 'Privee') => void;
  onSwitchToApp?: () => void;
}

type AdminTab = 
  | 'overview' 
  | 'connections' 
  | 'inscriptions'
  | 'qrcodes'
  | 'private' 
  | 'scanner' 
  | 'payments'
  | 'requests'
  | 'missions'
  | 'workers'
  | 'equipments'
  | 'agencies'
  | 'companies'
  | 'wallets'
  | 'notifications';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, user, onOpenChat, onSwitchToApp }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({ title: '', message: '', status: 'MISSION ENVOYÉE' });
  const [sendingMission, setSendingMission] = useState(false);
  const [viewingConversation, setViewingConversation] = useState<{ id: string, name: string, messages: any[] } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collectionName: string, rtdbPath?: string } | null>(null);

  // Photo link states for registrations
  const [localImageLink, setLocalImageLink] = useState('');
  const [isSavingImageLink, setIsSavingImageLink] = useState(false);

  // FILANT°225 Admin wallet states
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [selectedWalletUser, setSelectedWalletUser] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  // Notifications Admin States
  const [notifImageUrl, setNotifImageUrl] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifHasButton, setNotifHasButton] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [sendingCustomNotif, setSendingCustomNotif] = useState(false);
  const [notifButtonRecherche, setNotifButtonRecherche] = useState(false);
  const [notifButtonSimpleDemande, setNotifButtonSimpleDemande] = useState(false);
  const [notifButtonQrCode, setNotifButtonQrCode] = useState(false);
  const [notifButtonPaiement, setNotifButtonPaiement] = useState(false);
  const [notifPaiementAmount, setNotifPaiementAmount] = useState('');
  const [additionalSteps, setAdditionalSteps] = useState<Array<{
    message: string;
    imageUrl: string;
    buttonRecherche: boolean;
    buttonSimpleDemande: boolean;
    buttonQrCode: boolean;
    buttonPaiement: boolean;
    paiementAmount: string;
  }>>([]);
  
  // Data States
  const [data, setData] = useState<Record<string, any[]>>({
    connections: [],
    inscriptions: [],
    qrCodes: [],
    privateMsgs: [],
    scanner: [],
    payments: [],
    requests: [],
    missions: [],
    allUsers: [] // Unified user profile store
  });

  useEffect(() => {
    setLoading(true);
    
    // 0. Unified Profiles (Wait, we'll merge this from connections and inscriptions for now)
    
    // 0. Demandes Clients
    const unsubRequests = onSnapshot(query(collection(db, 'ServiceRequests'), orderBy('timestamp', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, requests: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });
    // 1. Connexions
    const unsubConns = onSnapshot(query(collection(db, 'Connexions'), orderBy('timestamp', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, connections: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });

    // 2. Inscriptions
    const unsubInscriptions = onSnapshot(query(collection(db, 'Inscriptions'), orderBy('timestamp', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, inscriptions: snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) }));
    });

    // 2b. QR Codes
    const unsubQRCodes = onSnapshot(query(collection(db, 'QRCodeActivations'), orderBy('updatedAt', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, qrCodes: snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) }));
    });



    // 3b. Messagerie Privée (Manual Chats)
    const unsubPrivate = onSnapshot(query(collection(db, 'MessageriePrivee'), orderBy('timestamp', 'desc'), limit(300)), (snap) => {
      setData(prev => ({ ...prev, privateMsgs: snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) }));
    });

    // 3. Scanner (RTDB + Firestore History)
    const unsubScans = onSnapshot(query(collection(db, 'HistoriqueScans'), orderBy('syncedAt', 'desc'), limit(200)), (snap) => {
      const firestoreScans = snap.docs.map(doc => ({ 
        ...doc.data(),
        id: doc.id, 
        source: 'Firestore'
      }));
      setData(prev => {
        // Merge with existing logic or just use Firestore as primary history
        return { ...prev, scanner: firestoreScans };
      });
    });

    // 4. Paiements (RTDB)
    const payRef = rtdbRef(rtdb, 'Paiements');
    const unsubPayments = onValue(payRef, (snap) => {
      const val = snap.val();
      if (val) {
        const list: any[] = [];
        Object.entries(val).forEach(([userKey, userPayments]: [string, any]) => {
          Object.entries(userPayments).forEach(([pushId, payment]: [string, any]) => {
            list.push({ ...payment, id: pushId, rtdbPath: `Paiements/${userKey}/${pushId}` });
          });
        });
        setData(prev => ({ ...prev, payments: list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) }));
      }
    });

    // 5. Missions
    const unsubMissions = onSnapshot(query(collection(db, 'Missions'), orderBy('timestamp', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, missions: snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) }));
    });

    // 6. Wallets & Transactions
    const unsubWallets = databaseService.subscribeToAllWallets((walletList) => {
      setWallets(walletList);
    });

    const unsubWalletTxs = databaseService.subscribeToAllWalletTransactions((txList) => {
      setWalletTransactions(txList);
    });

    setLoading(false);

    return () => {
      unsubConns();
      unsubInscriptions();
      unsubPrivate();
      unsubScans();
      unsubPayments();
      unsubRequests();
      unsubMissions();
      unsubQRCodes();
      unsubWallets();
      unsubWalletTxs();
    };
  }, []);

  const getUnreadCount = (tabId: AdminTab) => {
    switch (tabId) {
      case 'connections': return data.connections.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'inscriptions': return data.inscriptions.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'qrcodes': return data.qrCodes.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'private': return data.privateMsgs.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'scanner': return data.scanner.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'payments': return data.payments.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'requests': return data.requests.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'missions': return data.missions.filter(i => i.adminReadStatus === 'NON LU').length;
      case 'workers': return data.inscriptions.filter(i => i.profileType === 'Travailleur' && i.adminReadStatus === 'NON LU').length;
      case 'equipments': return data.inscriptions.filter(i => i.profileType === 'Propriétaire' && i.adminReadStatus === 'NON LU').length;
      case 'agencies': return data.inscriptions.filter(i => i.profileType === 'Agence' && i.adminReadStatus === 'NON LU').length;
      case 'companies': return data.inscriptions.filter(i => i.profileType === 'Entreprise' && i.adminReadStatus === 'NON LU').length;
      default: return 0;
    }
  };

  const stats = [
    { id: 'inscriptions' as AdminTab, label: 'Inscriptions', value: data.inscriptions.length, unread: getUnreadCount('inscriptions'), icon: Briefcase, color: 'text-blue-500' },
    { id: 'private' as AdminTab, label: 'Privé', value: data.privateMsgs.length, unread: getUnreadCount('private'), icon: Mail, color: 'text-green-500' },
    { id: 'payments' as AdminTab, label: 'Paiements', value: data.payments.length, unread: getUnreadCount('payments'), icon: CreditCard, color: 'text-orange-500' },
    { id: 'requests' as AdminTab, label: 'Demandes', value: data.requests.length, unread: getUnreadCount('requests'), icon: FileText, color: 'text-rose-500' },
    { id: 'scanner' as AdminTab, label: 'Scanner', value: data.scanner.length, unread: getUnreadCount('scanner'), icon: Scan, color: 'text-purple-500' },
    { id: 'notifications' as AdminTab, label: 'Notifications', value: 'Créer', unread: 0, icon: Bell, color: 'text-rose-600' },
  ];

  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    if (typeof val === 'number') return new Date(val).toLocaleString('fr-FR');
    if (typeof val === 'string') return new Date(val).toLocaleString('fr-FR');
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleString('fr-FR');
    return String(val);
  };

  const filteredData = (tabData: any[]) => {
    if (!searchTerm) return tabData;
    const term = searchTerm.toLowerCase();
    return tabData.filter(item => 
      Object.entries(item).some(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).some(v => String(v).toLowerCase().includes(term));
        }
        return String(val).toLowerCase().includes(term);
      })
    );
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.rtdbPath) {
        const { remove, ref } = await import('firebase/database');
        await remove(rtdbRef(rtdb, itemToDelete.rtdbPath));
      } else if (itemToDelete.collectionName === 'MessageriePrivee_Thread') {
        const { deleteDoc, doc, getDocs, collection, query, where, writeBatch } = await import('firebase/firestore');
        
        const collectionName = 'MessageriePrivee';
        
        const batch = writeBatch(db);

        // 1. Delete from global overview
        const q = query(collection(db, collectionName), where('userId', '==', itemToDelete.id));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
        
        // Also check phone if userId search was empty or for redundancy
        const q2 = query(collection(db, collectionName), where('phone', '==', itemToDelete.id));
        const snap2 = await getDocs(q2);
        snap2.docs.forEach(d => batch.delete(d.ref));
        
        // 2. Delete the user's subcollection messages (this is what the user actually sees)
        const userMessagesRef = collection(db, collectionName, itemToDelete.id, 'messages');
        const userMessagesSnap = await getDocs(userMessagesRef);
        userMessagesSnap.docs.forEach(d => batch.delete(d.ref));
        
        await batch.commit();
      } else {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, itemToDelete.collectionName, itemToDelete.id));
      }
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleValidatePayment = async (payment: any) => {
    try {
      await databaseService.validatePaymentStatus(payment);
    } catch (error) {
      console.error("Error validating payment:", error);
    }
  };

  const handleInvalidatePayment = async (payment: any) => {
    try {
      await databaseService.invalidatePaymentStatus(payment);
    } catch (error) {
      console.error("Error invalidating payment:", error);
    }
  };

  const renderTable = (headers: string[], keys: string[], sourceData: any[], collectionName?: string) => {
    const list = filteredData(sourceData);
    const headersWithStatus = activeTab === 'connections' ? ['Utilisateur bloqué', ...headers] : [...headers];
    const keysWithStatus = activeTab === 'connections' ? ['actions_select_blocking', ...keys] : [...keys];
    
    // Add status column if not present
    if (!keysWithStatus.includes('adminReadStatus') && collectionName) {
      headersWithStatus.push('Statut (Admin)');
      keysWithStatus.push('adminReadStatus');
    }

    // Add Visibilité column for Inscriptions
    if (collectionName === 'Inscriptions') {
      headersWithStatus.push('Visibilité');
      keysWithStatus.push('actions_toggle_active');
    }

    // Add Mission column for user-centric tabs
    const userTabs = ['connections', 'workers', 'equipments', 'agencies', 'companies', 'inscriptions', 'qrcodes'];
    if (userTabs.includes(activeTab)) {
      headersWithStatus.push('Missions');
      keysWithStatus.push('actions_mission');
    }

    // Add Details column
    headersWithStatus.push('Détails');
    keysWithStatus.push('actions_details');

    // Add Actions column
    headersWithStatus.push('Suppr.');
    keysWithStatus.push('actions_delete');

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="overflow-x-auto scrollbar-hide border-b border-gray-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                {headersWithStatus.map((h, i) => {
                  if (activeTab === 'connections' && h === 'Utilisateur bloqué') {
                    const nonAdminList = list.filter(conn => {
                      const isConnAdmin = conn.phone === '0705052632' || conn.role === 'Admin 225' || (conn.phone || '').replace(/\D/g, '') === '0705052632';
                      return !isConnAdmin;
                    });
                    const allBlocked = nonAdminList.length > 0 && nonAdminList.every(item => !!item.enAttenteTraitement);
                    return (
                      <th key={i} className="px-6 py-4 text-center select-none min-w-[200px]">
                        <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            Bloqué (En attente)
                          </span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                const targetState = !allBlocked;
                                const { doc, writeBatch } = await import('firebase/firestore');
                                const batch = writeBatch(db);
                                nonAdminList.forEach((conn) => {
                                  batch.update(doc(db, 'Connexions', conn.id), { enAttenteTraitement: targetState });
                                });
                                await batch.commit();
                              } catch (err) {
                                console.error("Error bulk updating user block status:", err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 border cursor-pointer ${
                              allBlocked
                                ? 'bg-red-50 text-red-650 border-red-200 hover:bg-red-100'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-200'
                            }`}
                          >
                            {allBlocked ? "Tout débloquer" : "Tout bloquer"}
                          </button>
                        </div>
                      </th>
                    );
                  }
                  return (
                    <th key={i} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {list.length > 0 ? list.map((item, i) => (
                <tr 
                   key={i} 
                   className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors ${item.adminReadStatus === 'NON LU' ? 'bg-amber-50/30' : ''}`}
                >
                  {keysWithStatus.map((key, j) => {
                    if (key === 'actions_select_blocking') {
                      const isBlocked = !!item.enAttenteTraitement;
                      const isItemAdmin = item.phone === '0705052632' || item.role === 'Admin 225' || (item.phone || '').replace(/\D/g, '') === '0705052632';
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          {isItemAdmin ? (
                            <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                              Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const docRef = doc(db, 'Connexions', item.id);
                                  await updateDoc(docRef, { enAttenteTraitement: !isBlocked });
                                } catch (err) {
                                  console.error("Error toggling user block status:", err);
                                }
                              }}
                              className={`w-5 h-5 rounded border-2 mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                isBlocked 
                                  ? 'bg-red-650 border-red-600 text-white' 
                                  : 'bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 text-transparent hover:border-red-405'
                              }`}
                            >
                              <Check size={11} strokeWidth={3} className={isBlocked ? 'block' : 'hidden'} />
                            </button>
                          )}
                        </td>
                      );
                    }

                    if (key === 'actions_mission') {
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForDetails(item);
                              setShowMissionModal(true);
                            }}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all active:scale-90"
                          >
                            <Send size={16} />
                          </button>
                        </td>
                      );
                    }

                    if (key === 'actions_toggle_active') {
                      const isCurrentActive = item.isActive !== false;
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const docRef = doc(db, 'Inscriptions', item.id);
                                await updateDoc(docRef, { isActive: !isCurrentActive });
                              } catch (err) {
                                console.error("Error updating visibility:", err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5 mx-auto border ${
                              isCurrentActive
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isCurrentActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isCurrentActive ? 'Activé' : 'Désactivé'}
                          </button>
                        </td>
                      );
                    }

                    if (key === 'actions_details') {
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(item, collectionName);
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all active:scale-90"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      );
                    }

                    if (key === 'actions_delete') {
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete({ 
                                id: item.id, 
                                collectionName: collectionName || '', 
                                rtdbPath: item.rtdbPath 
                              });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      );
                    }

                    let val = item[key];
                    if (key === 'activity') {
                      const profile = item.profileType;
                      let activityVal = '-';
                      if (profile === 'Travailleur') activityVal = item.job || (item.details && item.details.job);
                      else if (profile === 'Entreprise') activityVal = item.companyName || (item.details && item.details.companyName);
                      else if (profile === 'Agence') activityVal = item.agencyName || (item.details && item.details.agencyName);
                      else if (profile === 'Propriétaire') activityVal = item.equipmentType || (item.details && item.details.equipmentType);
                      
                      return (
                        <td key={j} className="px-6 py-4">
                          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight bg-blue-50 dark:bg-blue-600/10 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            {activityVal || '-'}
                          </span>
                        </td>
                      );
                    }

                    if (key === 'details') {
                      return (
                        <td key={j} className="px-6 py-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(item, collectionName);
                            }}
                            className="bg-blue-600/10 text-blue-600 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90 flex items-center justify-center gap-2"
                          >
                            <Eye size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Voir</span>
                          </button>
                        </td>
                      );
                    }

                    if (key === 'adminReadStatus') {
                      return (
                        <td key={j} className="px-6 py-4">
                          {val === 'NON LU' ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full animate-pulse border border-amber-200">
                              Non lu
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[9px] font-black uppercase rounded-full border border-gray-200">
                              Vu
                            </span>
                          )}
                        </td>
                      );
                    }

                    if (key === 'timestamp' || key === 'lastConnection' || key === 'date' || key === 'syncedAt') {
                      val = formatDate(val);
                    }
                    if (key === 'activationDate' || key === 'expiryDate') {
                      val = val ? new Date(val).toLocaleDateString('fr-FR') : '-';
                    }
                    if (key === 'fraisDossierPayes') {
                      val = val ? 'Payé (310)' : 'En attente';
                    }
                    if (key === 'details') {
                      const profile = item.profileType;
                      const details = item.details || {};
                      let detailsObj: any = {};
                      if (profile === 'Travailleur') detailsObj = { métier: item.job || details.job, dispo: item.availability || details.availability };
                      else if (profile === 'Propriétaire') detailsObj = { type: item.equipmentType || details.equipmentType, prix: item.rentalPrice || details.rentalPrice };
                      else if (profile === 'Agence') detailsObj = { nom: item.agencyName || details.agencyName, ville: item.agencyCity || details.agencyCity };
                      else if (profile === 'Entreprise') detailsObj = { nom: item.companyName || details.companyName, domaine: item.companyDomain || details.companyDomain };
                      else detailsObj = details;

                      val = Object.entries(detailsObj)
                        .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ');
                    }
                    if (key === 'status') {
                      const s = String(val);
                      if (activeTab === 'payments') {
                         const isValidated = s === 'Paiement validé' || s === 'Dépôt validé';
                         const isNotValidated = s === 'Paiement non validé' || s === 'Dépôt non validé';
                         
                         return (
                           <td key={j} className="px-6 py-4">
                             <div className="flex flex-col gap-2 min-w-[160px]">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isValidated) handleValidatePayment(item);
                                  }}
                                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border-2 ${
                                    isValidated 
                                      ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/30 scale-[1.02]' 
                                      : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-green-400 hover:text-green-600'
                                  }`}
                                >
                                  <ShieldCheck size={14} className={isValidated ? 'text-white' : 'text-slate-300'} />
                                  {item.paymentType === 'Dépôt' ? 'Dépôt validé' : 'Paiement validé'}
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isNotValidated) handleInvalidatePayment(item);
                                  }}
                                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border-2 ${
                                    isNotValidated 
                                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 scale-[1.02]' 
                                      : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600'
                                  }`}
                                >
                                  <AlertCircle size={14} className={isNotValidated ? 'text-white' : 'text-slate-300'} />
                                  {item.paymentType === 'Dépôt' ? 'Dépôt non validé' : 'Paiement non validé'}
                                </button>
                             </div>
                           </td>
                         );
                      }
                      
                      let badgeClass = 'bg-gray-100 text-gray-600';
                      if (s === 'Code QR Actif') badgeClass = 'bg-green-100 text-green-600';
                      else if (s.includes('310')) badgeClass = 'bg-orange-100 text-orange-600';
                      else if (s.includes('7 100')) badgeClass = 'bg-blue-100 text-blue-600';
                      else if (s.includes('500')) badgeClass = 'bg-red-100 text-red-600';
                      
                      return (
                        <td key={j} className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badgeClass}`}>
                            {s}
                          </span>
                        </td>
                      );
                    }
                    return (
                        <td key={j} className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                          {String(val || '-')}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              )) : (
                <tr>
                   <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-400 font-bold italic">
                     Aucune donnée trouvée
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const menuItems: { id: AdminTab, label: string, icon: any }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'connections', label: 'Connexions', icon: BarChart3 },
    { id: 'inscriptions', label: 'Inscriptions', icon: Briefcase },
    { id: 'wallets', label: 'Compte des utilisateurs', icon: Users },
    { id: 'qrcodes', label: 'Gestion QR Code', icon: QrCode },
    { id: 'private', label: 'Messagerie Privée', icon: Mail },
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'requests', label: 'Demandes clients', icon: FileText },
    { id: 'missions', label: 'Missions', icon: Send },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'workers', label: 'Travailleurs', icon: HardHat },
    { id: 'equipments', label: 'Équipements', icon: Factory },
    { id: 'agencies', label: 'Agences Immobilières', icon: Home },
    { id: 'companies', label: 'Entreprises', icon: Building2 },
  ];

  const openDetails = (item: any, collectionName: string) => {
    // If it's a mission, try to attach user info from connections or inscriptions
    let enhancedItem = { ...item };
    const userId = item.userId || item.phone;
    
    if (userId) {
      const sanitizedId = userId.replace(/\D/g, '');
      const userProfile = data.connections.find(u => (u.id || u.phone || '').replace(/\D/g, '') === sanitizedId) ||
                         data.inscriptions.find(u => (u.phone || '').replace(/\D/g, '') === sanitizedId) ||
                         data.qrCodes.find(u => (u.phone || '').replace(/\D/g, '') === sanitizedId);
      
      if (userProfile) {
        enhancedItem = { ...userProfile, ...enhancedItem };
      }
    }

    setSelectedItemForDetails(enhancedItem);
    setLocalImageLink(enhancedItem.imageLink || '');
    if (collectionName) {
      handleUpdateReadStatus(collectionName, item.id, item.adminReadStatus, item.rtdbPath);
    }
  };

  const handleSendMission = async (statusOverride?: string) => {
    if (!selectedItemForDetails || !missionForm.title || !missionForm.message) return;
    
    setSendingMission(true);
    try {
      const status = statusOverride || missionForm.status;
      const rawUserPhone = selectedItemForDetails.phone || selectedItemForDetails.userId || selectedItemForDetails.id || '';
      const sanitizedPhone = rawUserPhone.replace(/\D/g, '');
      
      await addDoc(collection(db, 'Missions'), {
        title: missionForm.title,
        message: missionForm.message,
        userId: rawUserPhone,
        userPhone: rawUserPhone,
        sanitizedPhone: sanitizedPhone,
        status: status,
        adminReadStatus: 'NON LU',
        timestamp: serverTimestamp()
      });
      
      setShowMissionModal(false);
      setMissionForm({ title: '', message: '', status: 'MISSION ENVOYÉE' });
      setSelectedItemForDetails(null);
    } catch (error) {
      console.error("Error sending mission:", error);
    } finally {
      setSendingMission(false);
    }
  };

  const handleSendCustomNotification = async () => {
    if (!notifMessage.trim()) {
      alert("Veuillez saisir un message de notification.");
      return;
    }
    if (selectedRecipientIds.length === 0) {
      alert("Veuillez sélectionner au moins un destinataire.");
      return;
    }

    // Validate additional steps
    const emptyStepIdx = additionalSteps.findIndex((st, i) => !st.message.trim());
    if (emptyStepIdx !== -1) {
      alert(`Veuillez saisir le texte du message pour l'étape ${emptyStepIdx + 2}.`);
      return;
    }

    const buttonsList: any[] = [];
    if (notifButtonRecherche) {
      buttonsList.push({ label: "Recherche", action: "recherche" });
    }
    if (notifButtonSimpleDemande) {
      buttonsList.push({ label: "Formulaire de Demande", action: "simple_demande" });
    }
    if (notifButtonQrCode) {
      buttonsList.push({ label: "Voir le code QR", action: "qr_code" });
    }
    if (notifButtonPaiement) {
      const amt = parseFloat(notifPaiementAmount) || 0;
      buttonsList.push({ 
        label: `Paiement (${amt.toLocaleString('fr-FR')} CFA)`, 
        action: "paiement", 
        amount: amt 
      });
    }

    const steps = additionalSteps.map(step => {
      const stepButtons: any[] = [];
      if (step.buttonRecherche) {
        stepButtons.push({ label: "Recherche", action: "recherche" });
      }
      if (step.buttonSimpleDemande) {
        stepButtons.push({ label: "Formulaire de Demande", action: "simple_demande" });
      }
      if (step.buttonQrCode) {
        stepButtons.push({ label: "Voir le code QR", action: "qr_code" });
      }
      if (step.buttonPaiement) {
        const amt = parseFloat(step.paiementAmount) || 0;
        stepButtons.push({ 
          label: `Paiement (${amt.toLocaleString('fr-FR')} CFA)`, 
          action: "paiement", 
          amount: amt 
        });
      }
      return {
        message: step.message.trim(),
        imageUrl: step.imageUrl.trim() || undefined,
        buttons: stepButtons.length > 0 ? stepButtons : undefined
      };
    });

    setSendingCustomNotif(true);
    try {
      const promises = selectedRecipientIds.map(async (phone) => {
        await databaseService.sendNotificationToFirestore(phone, {
          title: "Notification",
          message: notifMessage.trim(),
          imageUrl: notifImageUrl.trim() || undefined,
          hasButton: notifHasButton || buttonsList.length > 0,
          buttons: buttonsList.length > 0 ? buttonsList : undefined,
          steps: steps.length > 0 ? steps : undefined
        });
      });

      await Promise.all(promises);
      alert(`Notification envoyée avec succès à ${selectedRecipientIds.length} utilisateur(s).`);
    } catch (err) {
      console.error("Error sending custom notifications:", err);
      alert("Une erreur est survenue lors de l'envoi de la notification.");
    } finally {
      setSendingCustomNotif(false);
    }
  };

  const handleUpdateReadStatus = async (collectionName: string, docId: string, currentStatus?: string, rtdbPath?: string) => {
    if (currentStatus === 'NON LU') {
      try {
        if (rtdbPath) {
          const { update, ref } = await import('firebase/database');
          await update(ref(rtdb, rtdbPath), {
            adminReadStatus: 'VU'
          });
        } else {
          const docRef = doc(db, collectionName, docId);
          // Use setDoc with merge: true to ensure document exists
          await setDoc(docRef, {
            adminReadStatus: 'VU'
          }, { merge: true });
        }
      } catch (error: any) {
        console.error(`Error updating read status:`, error);
      }
    }
  };

  const handleViewRequestDetails = async (req: any) => {
    setSelectedRequest(req);
    handleUpdateReadStatus('ServiceRequests', req.id, req.adminReadStatus);
  };

  const handleOpenConversation = (userId: string, name: string, messages: any[], type: 'Privee' = 'Privee') => {
    setViewingConversation({ id: userId, name, messages });
    onOpenChat(userId, name, type);
    
    // Use centralized database service to mark all as read
    databaseService.markTypedMessagesAsRead(type, userId, 'user');
  };



  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-sans admin-selectable">
      <style>{`
        .admin-selectable, .admin-selectable * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        .admin-selectable .select-none, .admin-selectable .select-none * {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}</style>
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-[100] border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Administration</h1>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
               <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Base de données en direct</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {onSwitchToApp && (
            <button
              onClick={onSwitchToApp}
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all outline-none border-none flex items-center justify-center gap-2"
            >
              Accéder à l’application
            </button>
          )}
          
          <div className="hidden sm:flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-100 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none ring-0 focus:ring-2 focus:ring-blue-500/50 transition-all w-48 sm:w-64"
                />
             </div>
             <button className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-500">
                <MoreVertical size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 overflow-y-auto hidden lg:block p-6">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4">Menu Principal</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSearchTerm(''); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-400'
                }`}
              >
                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:text-blue-500 transition-colors'} />
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                {getUnreadCount(item.id) > 0 && (
                  <span className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm ${
                    activeTab === item.id ? 'bg-amber-400 text-slate-900 border-blue-600' : 'bg-red-500 text-white'
                  }`}>
                    {getUnreadCount(item.id)}
                  </span>
                )}
                {activeTab === item.id && getUnreadCount(item.id) === 0 && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-slate-900 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                   <ShieldCheck size={80} className="text-white" />
               </div>
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Sécurité</p>
               <h4 className="text-white font-bold text-sm">Mode Supervisé</h4>
               <p className="text-white/50 text-[10px] mt-2 leading-relaxed font-medium">Session sécurisée par authentification biométrique et jeton unique.</p>
          </div>
        </aside>

        {/* content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-container pb-32">
          {/* Mobile Search Bar */}
          <div className="lg:hidden relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher dans cette section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {loading ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4">
                 <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Synchronisation...</p>
             </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vue d'ensemble</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Résumé de l'activité en temps réel</p>
                    </div>
                    <div className="bg-blue-600/10 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-600/20">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, i) => (
                      <div 
                        key={i} 
                        onClick={() => stat.id && setActiveTab(stat.id)}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group"
                      >
                        {stat.unread > 0 && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase animate-bounce">
                            {stat.unread} Non lu
                          </div>
                        )}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.color} bg-current/10 font-bold group-hover:scale-110 transition-transform`}>
                          <stat.icon size={22} className={stat.color} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-1 border border-gray-100 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-xs">Dernières Activités</h3>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <div className="p-4 space-y-4">
                            {data.connections.slice(0, 6).map((conn, i) => (
                              <div 
                                key={i} 
                                onClick={() => openDetails(conn, 'Connexions')}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all group cursor-pointer ${conn.adminReadStatus === 'NON LU' ? 'border-l-4 border-amber-400 bg-amber-50/10' : ''}`}
                              >
                                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 font-black relative">
                                    {conn.name?.charAt(0) || 'U'}
                                    {conn.adminReadStatus === 'NON LU' && (
                                       <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                    )}
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{conn.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{conn.city} • {conn.phone}</p>
                                 </div>
                                 <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{(formatDate(conn.timestamp) || '').split(' ')[1] || '-'}</p>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete({ id: conn.id, collectionName: 'Connexions' });
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                 </div>
                              </div>
                            ))}
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-1 border border-gray-100 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-xs">Derniers Paiements</h3>
                            <CreditCard size={16} className="text-orange-500" />
                        </div>
                        <div className="p-4 space-y-4">
                            {data.payments.slice(0, 6).map((pay, i) => (
                              <div 
                                key={i} 
                                onClick={() => openDetails(pay, 'Paiements')}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer ${pay.adminReadStatus === 'NON LU' ? 'border-l-4 border-amber-400 bg-amber-50/10' : ''}`}
                              >
                                 <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 font-bold relative">
                                    <CreditCard size={18} />
                                    {pay.adminReadStatus === 'NON LU' && (
                                       <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                    )}
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{pay.userName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{pay.paymentType} • {pay.amount} FCFA</p>
                                 </div>
                                 <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{(formatDate(pay.timestamp) || '').split(' ')[1] || '-'}</p>
                                    <div className="flex items-center gap-2">
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setItemToDelete({ id: pay.id, collectionName: 'Paiements', rtdbPath: pay.rtdbPath });
                                         }}
                                         className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                       <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                                          pay.status === 'success' || pay.status === 'Complété' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                       }`}>
                                           {pay.status}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            ))}
                        </div>
                     </div>
                  </div>
                </div>
              )}
              {activeTab === 'connections' && renderTable(
                ['Nom', 'Ville', 'Numéro', 'Date'],
                ['name', 'city', 'phone', 'timestamp'],
                data.connections,
                'Connexions'
              )}

              {activeTab === 'inscriptions' && renderTable(
                ['Profil', 'Activité / Identité', 'Nom', 'Ville', 'Numéro', 'Détails', 'Status', 'Date'],
                ['profileType', 'activity', 'name', 'city', 'phone', 'details', 'status', 'timestamp'],
                data.inscriptions,
                'Inscriptions'
              )}

              {activeTab === 'qrcodes' && renderTable(
                ['Nom', 'Numéro', 'Ville', 'Étape actuelle (Tunnel)', 'Expiration'],
                ['name', 'phone', 'city', 'status', 'expiryDate'],
                data.qrCodes.map(q => {
                  let currentStatus = q.status;
                  const now = new Date();
                  const isExpired = q.expiryDate && now > new Date(q.expiryDate);
                  
                  if (isExpired) {
                    currentStatus = "En attente renouvellement (500 FCFA)";
                  }
                  
                  return {
                    ...q,
                    status: currentStatus
                  };
                }),
                'QRCodeActivations'
              )}



              {activeTab === 'private' && (
                <div className="space-y-6">
                  {(() => {
                    const messagesByUser: Record<string, any[]> = {};
                    data.privateMsgs.forEach(msg => {
                      const key = msg.userId || msg.phone || 'Inconnu';
                      if (!messagesByUser[key]) messagesByUser[key] = [];
                      messagesByUser[key].push(msg);
                    });

                    // Get all unique users from both connections and messages
                    const allUserKeys = Array.from(new Set([
                      ...data.connections.map(c => c.userId || c.phone),
                      ...Object.keys(messagesByUser)
                    ])).filter(key => key && key !== 'Inconnu');

                    return allUserKeys.map(userId => {
                        const messages = messagesByUser[userId] || [];
                        const connection = data.connections.find(k => (k.userId || k.phone) === userId);
                        const userName = connection?.name || messages[0]?.userName || 'Utilisateur';
                        const lastActivity = Math.max(
                          connection?.timestamp ? (typeof connection.timestamp === 'number' ? connection.timestamp : (connection.timestamp?.seconds ? connection.timestamp.seconds * 1000 : 0)) : 0,
                          ...messages.map(m => m.timestamp?.toMillis ? m.timestamp.toMillis() : (m.timestamp || 0))
                        );
                        return { userId, userName, messages, lastActivity };
                      })
                      .filter(u => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return u.userName.toLowerCase().includes(term) || u.userId.toLowerCase().includes(term);
                      })
                      .sort((a, b) => b.lastActivity - a.lastActivity)
                      .map((userGroup, i) => {
                        const { userId, userName, messages } = userGroup;
                        const hasUnread = messages.some(m => m.adminReadStatus === 'NON LU');
                        return (
                          <div 
                            key={i} 
                            onClick={() => handleOpenConversation(userId, userName, messages, 'Privee')}
                            className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border overflow-hidden transition-all cursor-pointer hover:shadow-2xl active:scale-[0.99] ${hasUnread ? 'border-amber-400 shadow-amber-500/10' : 'border-gray-100 dark:border-slate-800'}`}
                          >
                            <div className="bg-gray-50/50 dark:bg-slate-800/30 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black ${hasUnread ? 'bg-amber-500 animate-pulse' : 'bg-green-600'}`}>
                                   {userName?.charAt(0) || 'U'}
                                 </div>
                               <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                        {userName || 'Utilisateur'}
                                      </span>
                                  {hasUnread && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full">
                                      Nouveau
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userId}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="relative group">
                                  <button 
                                      onClick={() => handleOpenConversation(userId, userName, messages, 'Privee')}
                                      className="bg-blue-600/10 text-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                  >
                                      <MessageSquare size={14} />
                                      Répondre
                                  </button>
                                  
                                  {messages.filter(m => m.adminReadStatus === 'NON LU').length > 0 && (
                                  <button 
                                      onClick={() => handleOpenConversation(userId, userName, messages, 'Privee')}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg"
                                  >
                                      {messages.filter(m => m.adminReadStatus === 'NON LU').length}
                                  </button>
                                )}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete({ id: userId, collectionName: 'MessageriePrivee_Thread' });
                                }}
                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                          </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
              </div>
            )}

          {activeTab === 'scanner' && renderTable(
            ['Scanné par', 'Nom du contact', 'Numéro contact', 'Ville contact', 'Synchro'],
            ['scannerUser', 'name', 'phone', 'city', 'syncedAt'],
            data.scanner,
            'HistoriqueScans'
          )}

          {activeTab === 'missions' && renderTable(
            ['Utilisateur', 'Titre', 'Statut', 'Date'],
            ['userName', 'title', 'status', 'timestamp'],
            data.missions.map(m => {
              const sanitizedId = (m.userId || '').replace(/\D/g, '');
              const profile = data.connections.find(c => (c.phone || '').replace(/\D/g, '') === sanitizedId) ||
                              data.inscriptions.find(i => (i.phone || '').replace(/\D/g, '') === sanitizedId);
              return { ...m, userName: profile?.name || m.userId || 'Inconnu' };
            }),
            'Missions'
          )}

          {activeTab === 'workers' && renderTable(
            ['Nom', 'Activité', 'Ville', 'Numéro', 'Date'],
            ['name', 'activity', 'city', 'phone', 'timestamp'],
            data.inscriptions.filter(i => i.profileType === 'Travailleur'),
            'Inscriptions'
          )}

          {activeTab === 'equipments' && renderTable(
            ['Nom', 'Matériel', 'Ville', 'Numéro', 'Date'],
            ['name', 'activity', 'city', 'phone', 'timestamp'],
            data.inscriptions.filter(i => i.profileType === 'Propriétaire'),
            'Inscriptions'
          )}

          {activeTab === 'agencies' && renderTable(
            ['Nom Agence', 'Ville', 'Numéro', 'Date'],
            ['activity', 'city', 'phone', 'timestamp'],
            data.inscriptions.filter(i => i.profileType === 'Agence'),
            'Inscriptions'
          )}

          {activeTab === 'companies' && renderTable(
            ['Nom Entreprise', 'Ville', 'Numéro', 'Date'],
            ['activity', 'city', 'phone', 'timestamp'],
            data.inscriptions.filter(i => i.profileType === 'Entreprise'),
            'Inscriptions'
          )}

          {activeTab === 'wallets' && (() => {
            const handleProcessRefund = async () => {
              if (!selectedWalletUser) return;
              const amountNum = parseFloat(refundAmount);
              if (isNaN(amountNum) || amountNum <= 0) {
                alert("Veuillez saisir un montant valide.");
                return;
              }
              if (!refundReason.trim()) {
                alert("Veuillez spécifier la raison du remboursement.");
                return;
              }

              setIsProcessingRefund(true);
              try {
                await databaseService.processWalletRefund(
                  selectedWalletUser.phone,
                  selectedWalletUser.name || 'Utilisateur',
                  selectedWalletUser.city || 'Non spécifiée',
                  amountNum,
                  refundReason.trim()
                );

                alert("Le remboursement a été validé avec succès et l'utilisateur a été notifié par messagerie.");
                setRefundAmount('');
                setRefundReason('');
                setSelectedWalletUser(prev => prev ? { ...prev, balance: (prev.balance || 0) + amountNum } : null);
              } catch (err: any) {
                console.error(err);
                alert("Une erreur s'est produite lors du remboursement : " + err.message);
              } finally {
                setIsProcessingRefund(false);
              }
            };

            return (
              <div className="space-y-6">
                {!selectedWalletUser ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in duration-300">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Portefeuilles FILANT°225</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Solde et historique de paiement des utilisateurs</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom de l’utilisateur</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ville de l’utilisateur</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Numéro de l’utilisateur</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Solde Actuel</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                          {wallets.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                Aucun portefeuille trouvé
                              </td>
                            </tr>
                          ) : (
                            wallets.filter(w => {
                              if (!searchTerm) return true;
                              const term = searchTerm.toLowerCase();
                              return (w.name || '').toLowerCase().includes(term) || 
                                     (w.city || '').toLowerCase().includes(term) || 
                                     (w.phone || '').includes(term);
                            }).map((w) => (
                              <tr key={w.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-black text-xs uppercase text-slate-800 dark:text-white">{w.name || 'Utilisateur'}</td>
                                <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">{w.city || 'Non spécifiée'}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">+225 {w.phone}</td>
                                <td className="px-6 py-4">
                                  <span className="bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full text-xs font-black text-blue-700 dark:text-blue-300">
                                    {(w.balance || 0).toLocaleString('fr-FR')} FCFA
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setSelectedWalletUser(w)}
                                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10.5px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                  >
                                    Détails
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <header className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <button 
                        onClick={() => {
                          setSelectedWalletUser(null);
                          setRefundAmount('');
                          setRefundReason('');
                        }} 
                        className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl active:scale-90 transition-all text-slate-600 dark:text-slate-400 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">Détails Compes : {selectedWalletUser.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          +225 {selectedWalletUser.phone} • {selectedWalletUser.city}
                        </p>
                      </div>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[8.5px] font-black tracking-widest uppercase text-slate-400 block">Solde Actuel</span>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">
                          {(selectedWalletUser.balance || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[8.5px] font-black tracking-widest uppercase text-slate-400 block">Total Déposé</span>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight mt-1">
                          {walletTransactions
                            .filter(tx => tx.phone === selectedWalletUser.phone && tx.type === 'DEPOSIT')
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                            .toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[8.5px] font-black tracking-widest uppercase text-slate-400 block">Total Dépensé</span>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-1">
                          {walletTransactions
                            .filter(tx => tx.phone === selectedWalletUser.phone && tx.type === 'PAYMENT')
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                            .toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[8.5px] font-black tracking-widest uppercase text-slate-400 block">Total Remboursé</span>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-1">
                          {walletTransactions
                            .filter(tx => tx.phone === selectedWalletUser.phone && tx.type === 'REFUND')
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                            .toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-4">Historique des opérations complet</h4>
                        <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
                          {walletTransactions.filter(tx => tx.phone === selectedWalletUser.phone).length === 0 ? (
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center py-12">Aucune transaction trouvée</p>
                          ) : (
                            walletTransactions
                              .filter(tx => tx.phone === selectedWalletUser.phone)
                              .map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                      {tx.type === 'DEPOSIT' && `Dépôt Wave • +225 ${tx.paymentNumber || ''}`}
                                      {tx.type === 'PAYMENT' && `Achat : ${tx.serviceName || 'Service'}`}
                                      {tx.type === 'REFUND' && `Remboursement`}
                                    </p>
                                    <p className="text-[9.5px] font-medium text-slate-400">
                                      {tx.dateStr || (tx.timestamp ? new Date(tx.timestamp).toLocaleString('fr-FR') : 'Date inconnue')}
                                    </p>
                                    {tx.type === 'REFUND' && tx.reason && (
                                      <p className="text-[9.5px] font-bold text-amber-600 lowercase bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/35 max-w-[280px] inline-block truncate">
                                        motif: {tx.reason}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-black tracking-tight ${
                                      tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'text-green-600' : 'text-rose-600'
                                    }`}>
                                      {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} FCFA
                                    </p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{tx.id.substring(0, 8)}</p>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-400">Formulaire de remboursement</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                            La validation ré-créditera immédiatement le compte de l'utilisateur, écrira une transaction de type REMBOURSEMENT et lui enverra un message automatique de confirmation.
                          </p>

                          <div className="space-y-3 pt-2">
                            <div>
                              <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Montant (FCFA)</label>
                              <input 
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ex: 530" 
                                className="w-full bg-slate-50 dark:bg-slate-805 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Motif / Justification</label>
                              <textarea 
                                rows={3}
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Écrivez la raison du remboursement..." 
                                className="w-full bg-slate-50 dark:bg-slate-805 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none resize-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleProcessRefund}
                          disabled={isProcessingRefund || !refundAmount || !refundReason.trim()}
                          className={`w-full py-4 mt-6 rounded-2xl text-[10.5px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg cursor-pointer ${
                            isProcessingRefund || !refundAmount || !refundReason.trim()
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                          }`}
                        >
                          {isProcessingRefund ? "Validation..." : "Valider le remboursement"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'payments' && renderTable(
                ['Nom', 'Ville', 'Numéro', 'Wave', 'Montant', 'Statut', 'Date'],
                ['userName', 'city', 'userPhone', 'waveNumber', 'amount', 'status', 'timestamp'],
                data.payments,
                'Paiements'
              )}

           {activeTab === 'notifications' && (() => {
            const allUsersCombined = [
              ...(data.connections || []).map((c: any) => ({
                id: (c.phone || c.id || '').replace(/\D/g, ''),
                name: c.name || 'Utilisateur',
                phone: c.phone || c.id,
                city: c.city || 'Non spécifiée'
              })),
              ...(data.inscriptions || []).map((i: any) => ({
                id: (i.phone || i.id || '').replace(/\D/g, ''),
                name: i.name || 'Utilisateur',
                phone: i.phone || i.id,
                city: i.city || 'Non spécifiée'
              }))
            ].filter(u => u.id);

            const uniqueRecipients = Array.from(
              new Map(allUsersCombined.map(u => [u.id, u])).values()
            );

            const filteredRecipients = uniqueRecipients.filter(u => 
              u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              u.phone.includes(searchTerm) || 
              u.city.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const handleToggleSelectAll = () => {
              if (selectedRecipientIds.length === uniqueRecipients.length) {
                setSelectedRecipientIds([]);
              } else {
                setSelectedRecipientIds(uniqueRecipients.map(u => u.id));
              }
            };

            const handleToggleRecipient = (id: string) => {
              setSelectedRecipientIds(prev => 
                prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
              );
            };

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-xl">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Système de Notifications</h2>
                    <p className="text-xs font-bold text-blue-100/80 uppercase tracking-wider mt-1">Diffusez des messages ciblés aux utilisateurs de l'application</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <Bell size={24} className="text-white" />
                  </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Left Column - Form fields (3 cols) */}
                  <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl shadow-md p-6 border border-gray-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-bold text-sm tracking-widest text-slate-400 dark:text-slate-500 uppercase">1. Contenu de la Notification</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-gray-400">Champ de lien universel (Image, site web, formulaire, application)</label>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={notifImageUrl}
                          onChange={e => setNotifImageUrl(e.target.value)}
                          placeholder="Insérer l'URL de l'image, formulaire, de site ou d'application..."
                          className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none ring-0 focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setNotifImageUrl(text);
                            } catch (err) {
                              alert("Veuillez coller le lien de façon manuelle.");
                            }
                          }}
                          className="px-5 bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl text-xs active:scale-95 transition-all outline-none border border-gray-105 dark:border-slate-700"
                        >
                          Coller
                        </button>
                      </div>
                      {notifImageUrl.trim() && (
                        <div className="mt-2 border border-gray-100 dark:border-slate-800 rounded-2xl p-2 bg-gray-50 dark:bg-slate-900 flex justify-center">
                          <img 
                            src={notifImageUrl} 
                            alt="Aperçu" 
                            className="max-h-40 rounded-xl object-contain" 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-gray-400">Texte de la notification</label>
                      <textarea 
                        value={notifMessage}
                        onChange={e => setNotifMessage(e.target.value)}
                        placeholder="Saisissez le texte ou le message à envoyer de façon claire..."
                        rows={5}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none ring-0 focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-805/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <input 
                        type="checkbox" 
                        id="hasButtonCheck"
                        checked={notifHasButton}
                        onChange={e => setNotifHasButton(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="hasButtonCheck" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        Afficher un bouton d’action classique dans la notification ("Compris" pour confirmer)
                      </label>
                    </div>

                    <div className="space-y-4 bg-gray-50 dark:bg-slate-805/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Boutons de redirection dynamique</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">Ajoutez des boutons de redirection directe vers les différentes sections de l'application :</p>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            notifButtonRecherche 
                              ? 'bg-blue-50/10 border-blue-500/35 text-blue-600 dark:text-blue-450 font-bold shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-gray-105 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={notifButtonRecherche}
                              onChange={e => setNotifButtonRecherche(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs font-bold font-mono tracking-tight">Recherche</span>
                          </label>

                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            notifButtonSimpleDemande 
                              ? 'bg-blue-50/10 border-blue-500/35 text-blue-600 dark:text-blue-450 font-bold shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-gray-105 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={notifButtonSimpleDemande}
                              onChange={e => setNotifButtonSimpleDemande(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs font-bold font-mono tracking-tight">Formulaire de demande</span>
                          </label>

                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            notifButtonQrCode 
                              ? 'bg-blue-50/10 border-blue-500/35 text-blue-600 dark:text-blue-450 font-bold shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-gray-105 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={notifButtonQrCode}
                              onChange={e => setNotifButtonQrCode(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs font-bold font-mono tracking-tight">Voir le code QR</span>
                          </label>

                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            notifButtonPaiement 
                              ? 'bg-blue-50/10 border-blue-500/35 text-blue-600 dark:text-blue-450 font-bold shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-gray-105 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={notifButtonPaiement}
                              onChange={e => setNotifButtonPaiement(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs font-bold font-mono tracking-tight">Paiement</span>
                          </label>
                        </div>

                        {notifButtonPaiement && (
                          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-105 dark:border-slate-800 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <label className="text-[10px] font-black uppercase text-gray-400">Montant (CFA)</label>
                            <input 
                              type="number" 
                              value={notifPaiementAmount}
                              onChange={e => setNotifPaiementAmount(e.target.value)}
                              placeholder="Saisissez le montant en CFA (ex: 5000)..."
                              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-steps sequence editor */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Étapes de notification supplémentaires (Pages liées)</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Créez un parcours de plusieurs pages s'affichant l'une après l'autre</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdditionalSteps(prev => [
                            ...prev,
                            {
                              message: '',
                              imageUrl: '',
                              buttonRecherche: false,
                              buttonSimpleDemande: false,
                              buttonQrCode: false,
                              buttonPaiement: false,
                              paiementAmount: ''
                            }
                          ])}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow active:scale-95 transition-all font-mono"
                        >
                          <Plus size={14} /> Étape (+)
                        </button>
                      </div>

                      {additionalSteps.length > 0 && (
                        <div className="space-y-4">
                          {additionalSteps.map((step, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl relative space-y-3">
                              {/* Delete button of the step */}
                              <button
                                type="button"
                                onClick={() => setAdditionalSteps(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>

                              <h5 className="text-xs font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400">Étape {idx + 2} (Page {idx + 2})</h5>

                              {/* Universal Link field for Step */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Lien universel (Image, site, etc.) pour l'étape {idx + 2}</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={step.imageUrl}
                                    onChange={e => {
                                      const newVal = e.target.value;
                                      setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, imageUrl: newVal } : s));
                                    }}
                                    placeholder="Lien de l'image ou de redirection"
                                    className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const text = await navigator.clipboard.readText();
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, imageUrl: text } : s));
                                      } catch (err) {
                                        alert("Veuillez coller le lien manuellement.");
                                      }
                                    }}
                                    className="px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-850 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-xs active:scale-95 transition-all outline-none"
                                  >
                                    Coller
                                  </button>
                                </div>
                              </div>

                              {/* Message field for Step */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Texte du message pour l'étape {idx + 2}</label>
                                <textarea
                                  value={step.message}
                                  onChange={e => {
                                    const newVal = e.target.value;
                                    setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, message: newVal } : s));
                                  }}
                                  placeholder="Saisissez le texte pour cette page..."
                                  rows={3}
                                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                                />
                              </div>

                              {/* Buttons checkboxes for step */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Boutons optionnels pour l'étape {idx + 2}</label>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                  {/* Step Recherche Button */}
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={step.buttonRecherche}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, buttonRecherche: checked } : s));
                                      }}
                                      className="w-3.5 h-3.5 rounded text-blue-600"
                                    />
                                    <span className="text-[10px] font-bold text-gray-650">Recherche</span>
                                  </label>

                                  {/* Step Formulaire de demande Button */}
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={step.buttonSimpleDemande}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, buttonSimpleDemande: checked } : s));
                                      }}
                                      className="w-3.5 h-3.5 rounded text-blue-600"
                                    />
                                    <span className="text-[10px] font-bold text-gray-650">Formulaire de demande</span>
                                  </label>

                                  {/* Step Voir le code QR Button */}
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={step.buttonQrCode}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, buttonQrCode: checked } : s));
                                      }}
                                      className="w-3.5 h-3.5 rounded text-blue-600"
                                    />
                                    <span className="text-[10px] font-bold text-gray-650">Voir le code QR</span>
                                  </label>

                                  {/* Step Paiement Button */}
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={step.buttonPaiement}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, buttonPaiement: checked } : s));
                                      }}
                                      className="w-3.5 h-3.5 rounded text-blue-600"
                                    />
                                    <span className="text-[10px] font-bold text-gray-650">Paiement</span>
                                  </label>
                                </div>

                                {step.buttonPaiement && (
                                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-gray-105 dark:border-slate-850 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <label className="text-[9px] font-black uppercase text-gray-400">Montant pour l'étape {idx + 2} (CFA)</label>
                                    <input 
                                      type="number" 
                                      value={step.paiementAmount}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setAdditionalSteps(prev => prev.map((s, i) => i === idx ? { ...s, paiementAmount: val } : s));
                                      }}
                                      placeholder="Ex: 5000..."
                                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                      <button 
                        onClick={handleSendCustomNotification}
                        disabled={sendingCustomNotif || !notifMessage.trim() || selectedRecipientIds.length === 0}
                        className="w-full bg-blue-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-blue-700 active:scale-95 disabled:bg-gray-200 disabled:dark:bg-slate-805/50 disabled:text-gray-400 disabled:pointer-events-none transition-all text-xs font-mono tracking-widest uppercase flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10"
                      >
                        {sendingCustomNotif ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Envoyer la notification ({selectedRecipientIds.length})
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Recipients selector (2 cols) */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-md p-6 border border-gray-100 dark:border-slate-800 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
                      <h3 className="font-bold text-sm tracking-widest text-slate-400 dark:text-slate-500 uppercase">2. Destinataires</h3>
                      <button 
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-850 hover:underline"
                      >
                        {selectedRecipientIds.length === uniqueRecipients.length ? "Désélectionner tout" : "Tout sélectionner"}
                      </button>
                    </div>

                    {/* Scrollable Recipients list */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                      {filteredRecipients.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                          <AlertCircle size={24} className="mb-2" />
                          <p className="text-xs font-bold uppercase tracking-wider">Aucun utilisateur trouvé</p>
                          {searchTerm && <p className="text-[10px] mt-1">Ajustez votre terme de recherche</p>}
                        </div>
                      ) : (
                        filteredRecipients.map((recipient) => {
                          const isSelected = selectedRecipientIds.includes(recipient.id);
                          return (
                            <div 
                              key={recipient.id}
                              onClick={() => handleToggleRecipient(recipient.id)}
                              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-805/45 border transition-all ${
                                isSelected 
                                  ? 'border-blue-500/30 bg-blue-50/10' 
                                  : 'border-gray-50 dark:border-slate-800'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Swallowed: handeled by container onClick
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{recipient.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mt-0.5">{recipient.city} • {recipient.phone}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        {selectedRecipientIds.length} / {uniqueRecipients.length} Sélectionnés
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

              {activeTab === 'requests' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ville</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Numéro</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                        {filteredData(data.requests).length > 0 ? filteredData(data.requests).map((req, i) => (
                          <tr 
                            key={i} 
                            className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors ${req.adminReadStatus === 'NON LU' ? 'bg-amber-50/30' : ''}`}
                          >
                            <td className="px-6 py-4 font-bold text-xs uppercase text-slate-800 dark:text-gray-200">
                              {req.userName}
                            </td>
                            <td className="px-6 py-4 font-bold text-xs uppercase text-slate-600 dark:text-gray-400">
                              {req.city}
                            </td>
                            <td className="px-6 py-4 font-bold text-xs uppercase text-slate-600 dark:text-gray-400">
                              {req.phone}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase rounded-lg border border-rose-100 dark:border-rose-500/20">
                                {req.serviceTitle}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {req.adminReadStatus === 'NON LU' ? (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full animate-pulse border border-amber-200 shadow-sm">
                                  Non lu
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[9px] font-black uppercase rounded-full border border-gray-200">
                                  Vu
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => {
                                    onOpenChat(req.userId || req.phone, req.userName, 'Privee');
                                    handleUpdateReadStatus('ServiceRequests', req.id, req.adminReadStatus);
                                  }}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                  <MessageSquare size={14} />
                                  Répondre
                                </button>
                                <button 
                                  onClick={() => handleViewRequestDetails(req)}
                                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all active:scale-95"
                                >
                                  <FileText size={14} />
                                  Détails
                                </button>
                                <button 
                                  onClick={() => setItemToDelete({ id: req.id, collectionName: 'ServiceRequests' })}
                                  className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold italic">
                              Aucune demande trouvée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Trigger (Bottom Navigation) */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[1000] flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-2 shadow-2xl border border-white/10 flex gap-1 overflow-x-auto max-w-[90vw] scrollbar-hide">
             {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSearchTerm(''); }}
                    className={`p-3.5 rounded-full transition-all flex-shrink-0 ${
                        activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                >
                    <item.icon size={20} />
                </button>
             ))}
          </div>
      </div>
      
      {/* Mobile Search Overlay */}
      <div className="lg:hidden fixed top-20 right-6 z-[1001]">
           <button 
             onClick={() => {
                const term = prompt("Rechercher dans la base de données...");
                if (term !== null) setSearchTerm(term);
             }}
             className="w-12 h-12 bg-white dark:bg-slate-800 shadow-xl rounded-2xl flex items-center justify-center text-gray-500 border border-gray-100 dark:border-slate-800"
           >
                <Search size={20} />
           </button>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedItemForDetails && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItemForDetails(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
            >
              <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Détails Inscription</h2>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{selectedItemForDetails.profileType}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedItemForDetails(null)}
                   className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                 {/* Header info */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Informations Principales</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedItemForDetails.title && (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 col-span-full">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Titre</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.title}</p>
                          </div>
                        )}
                        {(selectedItemForDetails.name || selectedItemForDetails.userName) && (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom / Utilisateur</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.name || selectedItemForDetails.userName}</p>
                          </div>
                        )}
                        {(selectedItemForDetails.phone || selectedItemForDetails.userPhone) && (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.phone || selectedItemForDetails.userPhone}</p>
                          </div>
                        )}
                        {selectedItemForDetails.city && (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ville</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.city}</p>
                          </div>
                        )}
                        {selectedItemForDetails.timestamp && (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{formatDate(selectedItemForDetails.timestamp)}</p>
                          </div>
                        )}
                    </div>
                 </div>

                 {/* Message/Description for Missions/Requests */}
                 {(selectedItemForDetails.message || selectedItemForDetails.description) && (
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Message / Description</h4>
                     <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 italic text-sm text-slate-600 dark:text-gray-300 leading-relaxed shadow-inner">
                       {selectedItemForDetails.message || selectedItemForDetails.description}
                     </div>
                   </div>
                 )}

                 {/* Identity Documents section */}
                 {(selectedItemForDetails.idCardFront || selectedItemForDetails.idCardBack) && (
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pièce d'Identité</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {selectedItemForDetails.idCardFront && (
                         <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Face Avant</p>
                           <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-zoom-in" onClick={() => window.open(selectedItemForDetails.idCardFront)}>
                             <img src={selectedItemForDetails.idCardFront} alt="ID Front" className="w-full h-full object-cover" />
                           </div>
                         </div>
                       )}
                       {selectedItemForDetails.idCardBack && (
                         <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Face Arrière</p>
                           <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-zoom-in" onClick={() => window.open(selectedItemForDetails.idCardBack)}>
                             <img src={selectedItemForDetails.idCardBack} alt="ID Back" className="w-full h-full object-cover" />
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Specific Details */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Détails Spécifiques</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {(() => {
                           const profile = selectedItemForDetails.profileType;
                           let detailsObj: any = {};
                           const oldD = selectedItemForDetails.details || {};
                           if (profile === 'Travailleur') {
                             detailsObj = {
                               'Métier': selectedItemForDetails.job || oldD.job,
                               'Apprentissage': selectedItemForDetails.learnedFrom || oldD.learnedFrom,
                               'Disponibilité': selectedItemForDetails.availability || oldD.availability,
                               'Zone de déplacement': selectedItemForDetails.movementZone || oldD.movementZone,
                               'Description': selectedItemForDetails.skillsDescription || oldD.skillsDescription
                             };
                           } else if (profile === 'Propriétaire') {
                             detailsObj = {
                               'Type Matériel': selectedItemForDetails.equipmentType || oldD.equipmentType,
                               'Catégorie': selectedItemForDetails.equipmentCategory || oldD.equipmentCategory,
                               'Quantité': selectedItemForDetails.quantity || oldD.quantity,
                               'Ville Matériel': selectedItemForDetails.equipmentCity || oldD.equipmentCity,
                               'Prix Location': selectedItemForDetails.rentalPrice || oldD.rentalPrice,
                               'Description': selectedItemForDetails.equipmentDescription || oldD.equipmentDescription
                             };
                           } else if (profile === 'Agence') {
                             detailsObj = {
                               'Nom Agence': selectedItemForDetails.agencyName || oldD.agencyName,
                               'Ville Agence': selectedItemForDetails.agencyCity || oldD.agencyCity,
                               'Téléphone Agence': selectedItemForDetails.agencyPhone || oldD.agencyPhone,
                               'Types de biens': selectedItemForDetails.propertyTypes || oldD.propertyTypes,
                               'Zone couverte': selectedItemForDetails.agencyZone || oldD.agencyZone
                             };
                           } else if (profile === 'Entreprise') {
                             detailsObj = {
                               'Nom Entreprise': selectedItemForDetails.companyName || oldD.companyName,
                               'Ville Entreprise': selectedItemForDetails.companyCity || oldD.companyCity,
                               'Téléphone Entreprise': selectedItemForDetails.companyPhone || oldD.companyPhone,
                               'Domaine': selectedItemForDetails.companyDomain || oldD.companyDomain,
                               'Services': selectedItemForDetails.companyServices || oldD.companyServices,
                               'Salaire proposé': selectedItemForDetails.proposedSalary || oldD.proposedSalary
                             };
                           } else {
                             detailsObj = oldD;
                           }

                           const validEntries = Object.entries(detailsObj).filter(([_, v]) => v !== '' && v !== null && v !== undefined);

                           return validEntries.length > 0 ? (
                             validEntries.map(([key, val], idx) => (
                               <div key={idx} className="p-5 bg-blue-50/30 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 flex justify-between items-center group hover:bg-blue-50 transition-colors">
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] shrink-0">{key}</span>
                                  <span className="text-xs font-black text-slate-700 dark:text-gray-200 uppercase tracking-tight text-right ml-4">{String(val)}</span>
                               </div>
                             ))
                           ) : (
                             <div className="p-8 text-center text-gray-400 italic font-bold text-sm">
                                Aucun détail supplémentaire.
                             </div>
                           );
                        })()}
                    </div>
                 </div>

                 {/* Admin Image Link Edit Section */}
                 {(selectedItemForDetails.profileType || selectedItemForDetails.typeInscription) && (
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800/90 space-y-3">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       ADMINISTRATEUR : LIEN DE L'IMAGE DU PROFIL
                     </p>
                     <div className="flex gap-2.5">
                       <input
                         type="text"
                         value={localImageLink}
                         onChange={(e) => setLocalImageLink(e.target.value)}
                         placeholder="Collez ici le lien de l'image (ex: https://.../photo.png)"
                         className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white"
                       />
                       <button
                         onClick={async () => {
                           if (!selectedItemForDetails.id) return;
                           setIsSavingImageLink(true);
                           try {
                             const docRef = doc(db, 'Inscriptions', selectedItemForDetails.id);
                             await updateDoc(docRef, { imageLink: localImageLink });
                             
                             // Update selected item in details so UI updates instantly
                             setSelectedItemForDetails((prev: any) => prev ? { ...prev, imageLink: localImageLink } : null);
                             
                             // Update local data list too so user doesn't need to reclick
                             setData((prev: any) => {
                               const updatedInscriptions = (prev.inscriptions || []).map((ins: any) => {
                                 if (ins.id === selectedItemForDetails.id) {
                                   return { ...ins, imageLink: localImageLink };
                                 }
                                 return ins;
                               });
                               return { ...prev, inscriptions: updatedInscriptions };
                             });

                             alert("Lien de l'image mis à jour avec succès !");
                           } catch (err) {
                             console.error("Error setting image link:", err);
                             alert("Erreur lors de la mise à jour du lien d'image.");
                           } finally {
                             setIsSavingImageLink(false);
                           }
                         }}
                         disabled={isSavingImageLink}
                         className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all active:scale-95 shrink-0"
                       >
                         {isSavingImageLink ? 'Enregistrement...' : 'Enregistrer'}
                       </button>
                     </div>
                     <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                       Ce champ permet à l'administrateur d'assigner ou modifier l'image du profil. Si le lien est renseigné, l'image s'affichera sur la carte ; sinon, la mention « Masqué » s'affichera.
                     </p>
                   </div>
                 )}

                 {/* Status info */}
                 <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
                          <LayoutDashboard size={20} />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Statut du dossier</p>
                          <p className="text-xs font-black uppercase">{selectedItemForDetails.status || 'En attente'}</p>
                       </div>
                    </div>
                    <div className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                       ID: {selectedItemForDetails.id?.slice(0, 8)}
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-4">
               <button 
                 onClick={() => setShowMissionModal(true)}
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-[1.5rem] text-[10px] uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-green-600/20"
               >
                 Message de mission
               </button>
               <button 
                 onClick={() => {
                   const userId = selectedItemForDetails.userId || selectedItemForDetails.phone;
                   const name = selectedItemForDetails.userName || selectedItemForDetails.name || 'Utilisateur';
                   if (userId) {
                     onOpenChat(userId, name, 'Privee');
                     setSelectedItemForDetails(null);
                   }
                 }}
                 className="flex-1 bg-slate-900 dark:bg-slate-700 text-white font-black py-4 rounded-[1.5rem] text-[10px] uppercase tracking-[0.1em] transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 <MessageSquare size={14} />
                 Répondre
               </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages Modal */}
      <AnimatePresence>
        {viewingConversation && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingConversation(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
            >
              <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{viewingConversation.name}</h2>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{viewingConversation.id}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setViewingConversation(null)}
                   className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                 {viewingConversation.messages.map((m, idx) => (
                   <div key={idx} className={`p-5 rounded-[2rem] border transition-all ${
                     m.sender === 'admin' 
                       ? 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/10 ml-8' 
                       : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 mr-8'
                   }`}>
                      <div className="flex justify-between items-center mb-2">
                         <span className={`text-[9px] font-black uppercase tracking-widest ${
                           m.sender === 'admin' ? 'text-blue-500' : 'text-green-500'
                         }`}>
                           {m.sender === 'admin' ? 'Admin' : 'Utilisateur'}
                         </span>
                         <span className="text-[9px] font-bold text-gray-400 capitalize">{formatDate(m.timestamp)}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-200 leading-relaxed">
                        {m.text || m.message || 'Contenu vide'}
                      </p>
                   </div>
                 ))}
                 {viewingConversation.messages.length === 0 && (
                    <div className="py-20 text-center">
                       <Mail size={48} className="mx-auto text-gray-200 mb-4" />
                       <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucun message trouvé</p>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
                 <button 
                   onClick={() => {
                     onOpenChat(viewingConversation.id, viewingConversation.name, 'Privee');
                     setViewingConversation(null);
                   }}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                 >
                    Répondre maintenant
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
            >
              <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Détails Demande</h2>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{selectedRequest.serviceTitle}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedRequest(null)}
                   className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Informations Client</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedRequest.userName}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedRequest.phone}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ville</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedRequest.city}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                           <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase">{selectedRequest.totalPrice} CFA</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{formatDate(selectedRequest.timestamp)}</p>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Réponses du Formulaire</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {typeof selectedRequest.answers === 'object' && selectedRequest.answers !== null ? (
                           Object.entries(selectedRequest.answers)
                             .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                             .map(([key, val], idx) => (
                               <div key={idx} className="p-5 bg-rose-50/30 dark:bg-rose-500/5 rounded-2xl border border-rose-100/50 dark:border-rose-500/10 flex justify-between items-center">
                                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.15em] shrink-0">{key}</span>
                                  <span className="text-xs font-black text-slate-700 dark:text-gray-200 uppercase tracking-tight text-right ml-4">{String(val)}</span>
                               </div>
                             ))
                        ) : (
                          <div className="p-8 text-center text-gray-400 italic font-bold text-sm">
                             Aucune information disponible.
                          </div>
                        )}
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-4">
                 <button 
                   onClick={() => {
                     onOpenChat(selectedRequest.userId || selectedRequest.phone, selectedRequest.userName, 'Privee');
                     setSelectedRequest(null);
                   }}
                   className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                 >
                    <MessageSquare size={14} />
                    Répondre
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                  <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                Confirmer la suppression ?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                Cette action est irréversible et l'élément sera définitivement retiré de la base de données.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setItemToDelete(null)}
                   className="py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                 >
                    Non
                 </button>
                 <button 
                    onClick={handleConfirmDelete}
                    className="py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                 >
                    Oui
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
       {/* Mission Popup Modal */}
       <AnimatePresence>
         {showMissionModal && (
           <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowMissionModal(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
             ></motion.div>
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white/10"
             >
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                        <Send size={20} />
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Nouvelle Mission</h3>
                  </div>
                  <button onClick={() => setShowMissionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                     <X size={20} />
                  </button>
               </div>

               <div className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Titre de mission</label>
                     <input 
                        type="text"
                        value={missionForm.title}
                        onChange={(e) => setMissionForm({...missionForm, title: e.target.value})}
                        placeholder="Ex: Mission plombier en cours"
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                     />
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Message</label>
                     <textarea 
                        value={missionForm.message}
                        onChange={(e) => setMissionForm({...missionForm, message: e.target.value})}
                        placeholder="Détails de la mission..."
                        rows={4}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none"
                     ></textarea>
                  </div>

                  <div className="grid gap-3">
                    <button 
                      onClick={() => handleSendMission('MISSION ENVOYÉE')}
                      disabled={sendingMission}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl shadow-green-600/20 flex items-center justify-center gap-3"
                    >
                       {sendingMission ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={18} />}
                       Envoyer la mission
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSendMission('MISSION EN COURS')}
                        disabled={sendingMission}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                      >
                         Mission en cours
                      </button>
                      <button 
                        onClick={() => handleSendMission('MISSION EFFECTUÉE')}
                        disabled={sendingMission}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                         Mission effectuée
                      </button>
                    </div>
                  </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 };

export default AdminDashboard;
