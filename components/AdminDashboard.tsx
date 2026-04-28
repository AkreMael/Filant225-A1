
import React, { useState, useEffect } from 'react';
import { db, rtdb, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
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
  BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'locations' | 'companies' | 'chat' | 'payments' | 'qr'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [clients, setClients] = useState<any[]>([]);
  const [travailleurs, setTravailleurs] = useState<any[]>([]);
  const [agences, setAgences] = useState<any[]>([]);
  const [equipements, setEquipements] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // 1. Listen to Firestore Clients & Connections
    const unsubscribeUsers = onSnapshot(query(collection(db, 'Clients'), orderBy('lastConnection', 'desc')), (snapshot) => {
      const allClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(allClients);
    }, (err) => console.error("Admin dashboard users error:", err));

    const unsubscribeConns = onSnapshot(query(collection(db, 'Connexions'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
        setConnections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Listen to Firestore Travailleurs
    const unsubscribeTravailleurs = onSnapshot(collection(db, 'Travailleurs'), (snapshot) => {
      setTravailleurs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen to Firestore Agences immobilières
    const unsubscribeAgences = onSnapshot(collection(db, 'Agences immobilières'), (snapshot) => {
      setAgences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Listen to Firestore Équipements
    const unsubscribeEquipements = onSnapshot(collection(db, 'Équipements'), (snapshot) => {
      setEquipements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Listen to Firestore Entreprises
    const unsubscribeEntreprises = onSnapshot(collection(db, 'Entreprises'), (snapshot) => {
      setEntreprises(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 6. Listen to Firestore Messagerie
    const unsubscribeMessages = onSnapshot(query(collection(db, 'Messagerie'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 7. Listen to RTDB QR Code
    const qrRef = rtdbRef(rtdb, 'QR Code');
    const unsubscribeQR = onValue(qrRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: any[] = [];
        Object.entries(data).forEach(([userKey, userVal]: [string, any]) => {
          if (userVal.contacts) {
            Object.entries(userVal.contacts).forEach(([contactKey, contactVal]: [string, any]) => {
              list.push({
                userKey,
                contactKey,
                ...contactVal
              });
            });
          }
        });
        setQrCodes(list.sort((a, b) => (b.syncedAt || 0) - (a.syncedAt || 0)));
      }
    });

    // 8. Listen to RTDB Paiements
    const paymentsRef = rtdbRef(rtdb, 'Paiements');
    const unsubscribePayments = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: any[] = [];
        Object.entries(data).forEach(([userKey, userVal]: [string, any]) => {
          Object.entries(userVal).forEach(([payKey, payVal]: [string, any]) => {
            list.push({
              userKey,
              payKey,
              ...payVal
            });
          });
        });
        setPayments(list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }
    });

    setLoading(false);

    return () => {
      unsubscribeUsers();
      unsubscribeTravailleurs();
      unsubscribeAgences();
      unsubscribeEquipements();
      unsubscribeEntreprises();
      unsubscribeMessages();
      // Unsub scribing RTDB happens differently in v9, but using onValue with return is generally safe for cleanup if handled by sdk
    };
  }, []);

  const stats = [
    { label: 'Utilisateurs', value: clients.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Travailleurs', value: travailleurs.length, icon: Briefcase, color: 'bg-green-500' },
    { label: 'Agences', value: agences.length, icon: Building2, color: 'bg-purple-500' },
    { label: 'Paiements', value: payments.length, icon: CreditCard, color: 'bg-orange-500' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3 text-white`}>
              <stat.icon size={20} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-tight">Dernières Connexions</h3>
          <BarChart3 className="text-blue-500" size={20} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ville</th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernière vue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {connections.slice(0, 10).map((conn, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors uppercase">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{conn.name}</span>
                      <span className="text-[10px] text-gray-400">{conn.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">{conn.city}</td>
                  <td className="px-6 py-4 text-[10px] font-mono text-blue-500">
                    {conn.lastConnection ? new Date(conn.lastConnection).toLocaleString('fr-FR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTable = (title: string, data: any[], columns: string[]) => (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-black uppercase tracking-tight">{title} ({data.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 uppercase">
            {data.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                {columns.map((col, j) => {
                   const key = col.toLowerCase().replace(/é/g, 'e').replace(/ /g, '');
                   let val = item[key] || item[col] || 'N/A';
                   if (typeof val === 'object' && val?.seconds) {
                       val = new Date(val.seconds * 1000).toLocaleString();
                   }
                   return (
                    <td key={j} className="px-6 py-4 text-xs font-medium">
                        {val.toString()}
                    </td>
                   );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Dashboard Admin</h1>
            <p className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
              <ShieldCheck size={12} /> Live Sync Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base-Default-RTDB</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 overflow-y-auto hidden md:block">
          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'users', label: 'Clients', icon: Users },
              { id: 'workers', label: 'Travailleurs', icon: Briefcase },
              { id: 'locations', label: 'Agences & Loc.', icon: Building2 },
              { id: 'companies', label: 'Entreprises', icon: Building2 },
              { id: 'chat', label: 'Messagerie', icon: MessageSquare },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
              { id: 'qr', label: 'QR Codes Scan', icon: QrCode },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                  activeTab === nav.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <nav.icon size={18} />
                  <span className="text-xs font-black uppercase tracking-tight">{nav.label}</span>
                </div>
                {activeTab === nav.id && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-container">
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderTable('Clients Enregistrés', clients, ['Name', 'Phone', 'City', 'lastConnection'])}
              {activeTab === 'workers' && renderTable('Travailleurs Qualifiés', travailleurs, ['Name', 'Phone', 'Category', 'isVerified'])}
              {activeTab === 'locations' && renderTable('Agences & Locaux', agences, ['Name', 'Phone', 'City'])}
              {activeTab === 'companies' && renderTable('Entreprises Partenaires', entreprises, ['Name', 'Category', 'Phone'])}
              {activeTab === 'chat' && renderTable('Derniers Messages', messages, ['userName', 'role', 'content', 'timestamp'])}
              {activeTab === 'payments' && renderTable('Paiements Wave', payments, ['userName', 'amount', 'status', 'timestamp'])}
              {activeTab === 'qr' && renderTable('Codes QR Scannés', qrCodes, ['name', 'phone', 'city', 'syncedAt'])}
            </>
          )}
        </main>
      </div>

      <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100] flex justify-center">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-white/20 flex gap-1">
             {[
                { id: 'overview', icon: BarChart3 },
                { id: 'users', icon: Users },
                { id: 'chat', icon: MessageSquare },
                { id: 'payments', icon: CreditCard },
                { id: 'qr', icon: QrCode }
             ].map((nav) => (
                <button
                    key={nav.id}
                    onClick={() => setActiveTab(nav.id as any)}
                    className={`p-3 rounded-full transition-all ${
                        activeTab === nav.id ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                >
                    <nav.icon size={20} />
                </button>
             ))}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
