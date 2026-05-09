
import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref as rtdbRef, onValue } from 'firebase/database';
import { User } from '../types';
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
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  onBack: () => void;
  user: User;
  onOpenChat: (userId: string, userName: string, type: 'Assistant' | 'Privee') => void;
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
  | 'companies';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, user, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({ title: '', message: '' });
  const [viewingConversation, setViewingConversation] = useState<{ id: string, name: string, messages: any[] } | null>(null);
  
  // Data States
  const [data, setData] = useState<Record<string, any[]>>({
    connections: [],
    inscriptions: [],
    qrCodes: [],
    assistant: [],
    privateMsgs: [],
    scanner: [],
    payments: [],
    requests: [],
    missions: []
  });

  useEffect(() => {
    setLoading(true);
    
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
      setData(prev => ({ ...prev, inscriptions: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });

    // 2b. QR Codes
    const unsubQRCodes = onSnapshot(query(collection(db, 'QRCodeActivations'), orderBy('updatedAt', 'desc'), limit(150)), (snap) => {
      setData(prev => ({ ...prev, qrCodes: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });

    // 3. Messagerie Privée (Manual Chats)
    const unsubPrivate = onSnapshot(query(collection(db, 'MessageriePrivee'), orderBy('timestamp', 'desc'), limit(300)), (snap) => {
      setData(prev => ({ ...prev, privateMsgs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });

    // 3. Scanner (RTDB + Firestore History)
    const unsubScans = onSnapshot(query(collection(db, 'HistoriqueScans'), orderBy('syncedAt', 'desc'), limit(200)), (snap) => {
      const firestoreScans = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
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
      setData(prev => ({ ...prev, missions: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
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

  const renderTable = (headers: string[], keys: string[], sourceData: any[], collectionName?: string) => {
    const list = filteredData(sourceData);
    const headersWithStatus = [...headers];
    const keysWithStatus = [...keys];
    
    // Add status column if not present
    if (!keysWithStatus.includes('adminReadStatus') && collectionName) {
      headersWithStatus.push('Statut (Admin)');
      keysWithStatus.push('adminReadStatus');
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                {headersWithStatus.map((h, i) => (
                  <th key={i} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {list.length > 0 ? list.map((item, i) => (
                <tr 
                  key={i} 
                  onClick={() => {
                    if (collectionName) handleUpdateReadStatus(collectionName, item.id, item.adminReadStatus, item.rtdbPath);
                  }}
                  className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${item.adminReadStatus === 'NON LU' ? 'bg-amber-50/30' : ''}`}
                >
                  {keysWithStatus.map((key, j) => {
                    let val = item[key];
                    if (key === 'activity') {
                      const profile = item.profileType;
                      const d = item.details || {};
                      let activityVal = '-';
                      if (profile === 'Travailleur') activityVal = d.job;
                      else if (profile === 'Entreprise') activityVal = d.companyName;
                      else if (profile === 'Agence') activityVal = d.agencyName;
                      else if (profile === 'Propriétaire') activityVal = d.equipmentType;
                      
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
                            onClick={() => {
                              setSelectedItemForDetails(item);
                              if (collectionName) handleUpdateReadStatus(collectionName, item.id, item.adminReadStatus, item.rtdbPath);
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
                    if (key === 'details' && typeof val === 'object' && val !== null) {
                      val = Object.entries(val)
                        .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ');
                    }
                    if (key === 'status') {
                      const s = String(val);
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
    { id: 'qrcodes', label: 'Gestion QR Code', icon: QrCode },
    { id: 'private', label: 'Messagerie Privée', icon: Mail },
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'requests', label: 'Demandes clients', icon: FileText },
    { id: 'missions', label: 'Missions', icon: Send },
    { id: 'workers', label: 'Travailleurs', icon: HardHat },
    { id: 'equipments', label: 'Équipements', icon: Factory },
    { id: 'agencies', label: 'Agences Immobilières', icon: Home },
    { id: 'companies', label: 'Entreprises', icon: Building2 },
  ];

  const handleSendMission = async (status: string) => {
    if (!selectedItemForDetails || !missionForm.title || !missionForm.message) return;
    
    try {
      await addDoc(collection(db, 'Missions'), {
        title: missionForm.title,
        message: missionForm.message,
        userId: selectedItemForDetails.userId || selectedItemForDetails.phone,
        status: status,
        adminReadStatus: 'NON LU',
        timestamp: serverTimestamp()
      });
      
      setShowMissionModal(false);
      setMissionForm({ title: '', message: '' });
      setSelectedItemForDetails(null);
    } catch (error) {
      console.error("Error sending mission:", error);
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
          await updateDoc(docRef, {
            adminReadStatus: 'VU'
          });
        }
      } catch (error) {
        console.error(`Error updating read status for ${collectionName || rtdbPath}:`, error);
      }
    }
  };

  const handleViewRequestDetails = async (req: any) => {
    setSelectedRequest(req);
    handleUpdateReadStatus('ServiceRequests', req.id, req.adminReadStatus);
  };

  const handleOpenConversation = (userId: string, name: string, messages: any[]) => {
    setViewingConversation({ id: userId, name, messages });
    // Update status for all unread messages in this conversation if needed? 
    // Actually the user wants to see if the "information" is read.
    // Let's update the specific messages that are NON LU in MessageriePrivee collection
    messages.forEach(async (msg) => {
      if (msg.adminReadStatus === 'NON LU') {
        handleUpdateReadStatus('MessageriePrivee', msg.id, 'NON LU');
      }
    });
  };



  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-sans">
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
                                onClick={() => handleUpdateReadStatus('Connexions', conn.id, conn.adminReadStatus)}
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
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{(formatDate(conn.timestamp) || '').split(' ')[1] || '-'}</p>
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
                                onClick={() => handleUpdateReadStatus('Paiements', pay.id, pay.adminReadStatus, pay.rtdbPath)}
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
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{(formatDate(pay.timestamp) || '').split(' ')[1] || '-'}</p>
                                    <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                                       pay.status === 'success' || pay.status === 'Complété' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {pay.status}
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
                  
                  // Wrap status in a badge-like object for renderTable to handle if we want
                  // But renderTable handles strings. I'll modify renderTable to handle 'status' specially
                  return {
                    ...q,
                    status: currentStatus
                  };
                }),
                'QRCodeActivations'
              )}

              {activeTab === 'private' && (
                <div className="space-y-6">
                  {Object.entries(
                    filteredData(data.privateMsgs).reduce((acc: Record<string, any[]>, msg) => {
                      const key = msg.userId || msg.phone || 'Inconnu';
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(msg);
                      return acc;
                    }, {})
                  ).map(([userId, messages]: [string, any[]], i) => {
                    const hasUnread = messages.some(m => m.adminReadStatus === 'NON LU');
                    return (
                      <div key={i} className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border overflow-hidden transition-all ${hasUnread ? 'border-amber-400 shadow-amber-500/10' : 'border-gray-100 dark:border-slate-800'}`}>
                        <div className="bg-gray-50/50 dark:bg-slate-800/30 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black ${hasUnread ? 'bg-amber-500 animate-pulse' : 'bg-green-600'}`}>
                               {messages[0]?.userName?.charAt(0) || 'U'}
                             </div>
                           <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    {messages[0]?.userName || 'Utilisateur'}
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
                          <div className="flex items-center gap-4">
                              <div className="relative group">
                                  <button 
                                      onClick={() => {
                                        onOpenChat(userId, messages[0]?.userName || 'Utilisateur', 'Privee');
                                        messages.forEach(m => handleUpdateReadStatus('MessageriePrivee', m.id, m.adminReadStatus));
                                      }}
                                      className="bg-blue-600/10 text-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                  >
                                      <MessageSquare size={14} />
                                      Répondre
                                  </button>
                                  
                                  {messages.length > 0 && (
                                  <button 
                                      onClick={() => handleOpenConversation(userId, messages[0]?.userName || 'Utilisateur', messages)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg"
                                  >
                                      {messages.length}
                                  </button>
                              )}
                          </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'scanner' && renderTable(
            ['Scanné par', 'Nom du contact', 'Numéro contact', 'Ville contact', 'Synchro'],
            ['scannerUser', 'name', 'phone', 'city', 'syncedAt'],
            data.scanner,
            'HistoriqueScans'
          )}

          {activeTab === 'missions' && renderTable(
            ['Titre', 'Message', 'Utilisateur (ID)', 'Statut', 'Date'],
            ['title', 'message', 'userId', 'status', 'timestamp'],
            data.missions,
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

          {activeTab === 'payments' && renderTable(
                ['Nom', 'Numéro', 'Type', 'Montant', 'Statut', 'Date'],
                ['userName', 'userPhone', 'paymentType', 'amount', 'status', 'timestamp'],
                data.payments,
                'Paiements'
              )}

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
                          <tr key={i} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors">
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
                 {/* Personnel Info */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Informations Personnelles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom Complet</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.name}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.phone}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ville Actuelle</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{selectedItemForDetails.city}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date d'envoi</p>
                           <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{formatDate(selectedItemForDetails.timestamp)}</p>
                        </div>
                    </div>
                 </div>

                 {/* Specific Details */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Détails Spécifiques</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {typeof selectedItemForDetails.details === 'object' && selectedItemForDetails.details !== null ? (
                           Object.entries(selectedItemForDetails.details)
                             .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                             .map(([key, val], idx) => (
                               <div key={idx} className="p-5 bg-blue-50/30 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 flex justify-between items-center group hover:bg-blue-50 transition-colors">
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] shrink-0">{key}</span>
                                  <span className="text-xs font-black text-slate-700 dark:text-gray-200 uppercase tracking-tight text-right ml-4">{String(val)}</span>
                               </div>
                             ))
                        ) : (
                          <div className="p-8 text-center text-gray-400 italic font-bold text-sm">
                             Aucun détail supplémentaire.
                          </div>
                        )}
                    </div>
                 </div>

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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-green-600/20"
                  >
                     Message de mission
                  </button>
                 <button 
                   onClick={() => {
                     onOpenChat(selectedItemForDetails.userId || selectedItemForDetails.phone, selectedItemForDetails.name || 'Utilisateur', 'Privee');
                     setSelectedItemForDetails(null);
                   }}
                   className="flex-1 bg-slate-900 dark:bg-slate-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
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
                      onClick={() => handleSendMission('ENVOYÉ')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-green-600/20 flex items-center justify-center gap-3"
                    >
                       <Send size={14} />
                       Envoyer la mission
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSendMission('MISSION EN COURS')}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                      >
                         Mission en cours
                      </button>
                      <button 
                        onClick={() => handleSendMission('MISSION EFFECTUÉE')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
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
