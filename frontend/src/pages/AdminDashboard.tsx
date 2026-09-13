import { useState, useEffect } from 'react'; // Admin Dashboard v2.1 - Enhanced Analytics & Inventory
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Monitor, IndianRupee, 
  BarChart3, LogOut, User, ChevronRight, ChevronDown, Menu,
  ShieldCheck, CheckCircle, Trash2, Zap, Users, Folder, Video, Shield, Ticket
} from 'lucide-react';
import API from '../services/api';

import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import Approvals from './admin/Approvals';
import Inventory from './admin/Inventory';
import Analytics from './admin/Analytics';
import Pricing from './admin/Pricing';
import Settings from './admin/Settings';
import PartnerRequests from './admin/PartnerRequests';
import LiveCCTV from './admin/LiveCCTV';
import PromoCodeManagement from './admin/PromoCodeManagement';

import AddPoleModal from '../components/admin/AddPoleModal';

const CAMPAIGN_TAB_IDS = ['pending', 'approved', 'upcoming', 'active', 'completed', 'rejected', 'revoked'] as const;
import AddCorridorModal from '../components/admin/AddCorridorModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active tab from URL path (e.g., /admin/pending -> pending)
  const currentPath = location.pathname.split('/').filter(Boolean).pop();
  const activeTab = currentPath === 'admin' ? 'pending' : (currentPath || 'pending');

  const [screens, setScreens] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [counts, setCounts] = useState<any>({
    pending: 0,
    approved: 0,
    rejected: 0,
    upcoming: 0,
    active: 0,
    completed: 0,
    revoked: 0
  });

  const [isAddPoleModalOpen, setIsAddPoleModalOpen] = useState(false);
  const [isAddCorridorModalOpen, setIsAddCorridorModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCampaignExpanded, setIsCampaignExpanded] = useState(true);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string, otpauth: string, qrCodeUrl?: string } | null>(null);
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState('');
  const [profileForm, setProfileForm] = useState({ name: 'E3Di Administrator', email: 'admin@e3di.com', phone: '', twoFactorEnabled: false, currentPassword: '', newPassword: '', confirmPassword: '' });

  const [analyticsData, setAnalyticsData] = useState({
    revenue: 0,
    reach: 0,
    impressions: 0,
    chartData: [] as any[]
  });

  useEffect(() => {
    fetchData();
    setProfileForm(prev => ({
      ...prev,
      name: localStorage.getItem('userName') || 'E3Di Administrator',
      email: localStorage.getItem('userEmail') || 'admin@e3di.com',
      phone: localStorage.getItem('userPhone') || '',
      twoFactorEnabled: localStorage.getItem('user2FA') === 'true'
    }));
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (CAMPAIGN_TAB_IDS.includes(activeTab as typeof CAMPAIGN_TAB_IDS[number])) {
      setIsCampaignExpanded(true);
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [screensRes, plansRes] = await Promise.all([
        API.get('/screens'),
        API.get('/plans').catch(() => ({ data: [] }))
      ]);
      setScreens(screensRes.data);
      setPlans(plansRes.data);

      try {
        const countsRes = await API.get('/admin/campaigns/counts');
        setCounts(countsRes.data);
      } catch (err) {}

      try {
        const schedulesRes = await API.get('/schedule');
        
        const approved = schedulesRes.data.filter((s: any) => ['approved', 'playing', 'completed', 'active', 'upcoming'].includes(s.status));
        const seenGroups = new Set<string>();
        const revenue = approved.reduce((acc: number, s: any) => {
          const groupKey = s.bookingGroupId || s._id;
          if (seenGroups.has(groupKey)) return acc;
          seenGroups.add(groupKey);
          if (typeof s.totalAmount === 'number' && s.totalAmount > 0) return acc + s.totalAmount;
          return acc + (s.pricePerScreen || 50);
        }, 0);
        
        const reach = screensRes.data.length * 48000; 
        const impressions = approved.length * 12500; 
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = days.map(day => ({
          name: day,
          revenue: Math.floor(Math.random() * 5000) + 2000,
          reach: Math.floor(Math.random() * 10000) + 5000
        }));

        setAnalyticsData({ revenue, reach, impressions, chartData });
      } catch (schedErr) { }
    } catch (err) { }
  };



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };



  const handleOpenAddScreenForPole = (_poleData: any) => {
    setIsAddPoleModalOpen(true);
  };

  const handleDeleteScreen = async (ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const isMultiple = idArray.length > 1;
    const msg = isMultiple 
      ? 'Remove this entire pole and ALL associated screens (Side A + B)?' 
      : 'Remove this specific screen side?';
    
    if (!confirm(msg)) return;
    try {
      await Promise.all(idArray.map(id => API.delete(`/screens/${id}`)));
      fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const handleUpdatePrice = async (id: string, currentPrice: number) => {
    const newPrice = prompt('Enter new price per hr (₹):', (currentPrice || 0).toString());
    if (newPrice === null || isNaN(Number(newPrice))) return;
    try {
      await API.put(`/screens/${id}`, { price: Number(newPrice) });
      fetchData();
    } catch (err) { alert('Failed to update price'); }
  };



  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/auth/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('userProfilePic', res.data.imageUrl);
      setProfileForm(prev => ({ ...prev, profilePic: res.data.imageUrl }));
      alert('Profile picture updated!');
    } catch (err) { alert('Upload failed'); }
  };

  const handleUpdateProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      alert("Passwords don't match"); return;
    }
    if (!profileForm.currentPassword) {
      alert("Current password required"); return;
    }
    try {
      const res = await API.put('/auth/profile', {
        ...profileForm,
        newPassword: profileForm.newPassword || undefined
      });
      const u = res.data.user;
      localStorage.setItem('userName', u.name);
      localStorage.setItem('userEmail', u.email);
      localStorage.setItem('userPhone', u.phone || '');
      localStorage.setItem('user2FA', u.twoFactorEnabled?.toString() || 'false');
      alert('Profile updated!');
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { alert(`Error: ${err.response?.data?.msg || 'Update failed'}`); }
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_URL || 'https://www.e3di.org/_/backend').replace('/api', '').replace(/\/$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const uniquePolesCount = new Set(screens.map(s => s.poleId || s.deviceId?.replace(/[AB]$/, '') || 'UNKN')).size;

  const campaignSubItems = [
    { id: 'pending', label: 'Pending Requests', icon: Clock, count: counts.pending },
    { id: 'approved', label: 'Approved Log', icon: ShieldCheck, count: counts.approved },
    { id: 'upcoming', label: 'Upcoming', icon: Clock, count: counts.upcoming },
    { id: 'active', label: 'Active Broadcasts', icon: Zap, count: counts.active },
    { id: 'completed', label: 'Completed Playback', icon: CheckCircle, count: counts.completed },
    { id: 'rejected', label: 'Rejected', icon: Trash2, count: counts.rejected },
    { id: 'revoked', label: 'Revoked', icon: Trash2, count: counts.revoked },
  ];

  const otherMenuItems = [
    { id: 'promo-codes', label: 'Promo Codes', icon: Ticket },
    { id: 'inventory', label: 'Inventory', icon: Monitor, count: uniquePolesCount },
    { id: 'live-cctv', label: 'Live Camera Monitoring', icon: Video },
    { id: 'partner-requests', label: 'Partner Requests', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
  ];

  const isCampaignRouteActive = CAMPAIGN_TAB_IDS.includes(activeTab as typeof CAMPAIGN_TAB_IDS[number]);

  const getPageTitle = () => {
    const found = [...campaignSubItems, ...otherMenuItems].find((i) => i.id === activeTab);
    return found?.label || (activeTab === 'settings' ? 'Profile' : 'Admin');
  };

  const handleTabChange = (tabId: string) => {
    navigate(`/admin/${tabId}`);
    if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-x-hidden">
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden" />
        )}
      </AnimatePresence>

      <motion.aside 
        animate={{ width: sidebarCollapsed ? 96 : 288, x: typeof window !== 'undefined' && window.innerWidth < 1024 ? (isMobileSidebarOpen ? 0 : -320) : 0 }}
        className="bg-[#0f172a] text-white flex flex-col fixed top-0 h-screen z-[70] lg:z-50 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-start transition-all ${sidebarCollapsed ? 'w-16 h-8' : 'w-44 h-10'}`}>
               <img src="/3d.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto">
          <motion.div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  setIsCampaignExpanded(true);
                } else {
                  setIsCampaignExpanded((prev) => !prev);
                }
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                isCampaignRouteActive
                  ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <motion.div className="flex items-center gap-3 min-w-0">
                <Folder size={18} className={isCampaignRouteActive ? 'text-indigo-400' : 'text-slate-500'} />
                {!sidebarCollapsed && <span className="truncate">Campaigns</span>}
              </motion.div>
              {!sidebarCollapsed && (
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-slate-500 transition-transform duration-300 ${isCampaignExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isCampaignExpanded && !sidebarCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pl-3 ml-2 border-l border-slate-700/80 space-y-0.5 py-1">
                    {campaignSubItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                          activeTab === item.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400/50'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon size={16} className={activeTab === item.id ? 'text-white' : 'text-slate-500'} />
                          <span className="truncate text-left">{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span
                            className={`ml-2 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${
                              activeTab === item.id ? 'bg-white text-indigo-600' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="pt-2 space-y-1 border-t border-slate-800/60 mt-2">
            {otherMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-500'} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      activeTab === item.id ? 'bg-white text-indigo-600' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50 space-y-2">
          <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            <User size={18} /> {!sidebarCollapsed && <span>Profile</span>}
          </button>
          <button onClick={handleLogout} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl text-sm font-bold transition-all`}>
            <LogOut size={18} /> {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button 
              onClick={() => window.innerWidth < 1024 ? setIsMobileSidebarOpen(true) : setSidebarCollapsed(!sidebarCollapsed)} 
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 active:scale-95 transition-all shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center"
              aria-label="Toggle Navigation"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 capitalize truncate">
              <span className="truncate">{getPageTitle()}</span>
              <ChevronRight size={14} className="text-slate-300 shrink-0 hidden sm:inline" />
              <span className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest hidden sm:inline">Overview</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-black text-slate-900 max-w-[160px] truncate">{localStorage.getItem('userName') || 'Admin'}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest max-w-[180px] truncate">{localStorage.getItem('userEmail') || 'admin@e3di.org'}</span>
            </div>
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black uppercase text-sm shadow-sm shrink-0">
              {(localStorage.getItem('userName') || 'A')[0]}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 lg:p-10 overflow-x-hidden min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Navigate to="pending" replace />} />
              <Route path="pending" element={<Approvals type="pending" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="approved" element={<Approvals type="approved" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="rejected" element={<Approvals type="rejected" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="upcoming" element={<Approvals type="upcoming" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="active" element={<Approvals type="active" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="completed" element={<Approvals type="completed" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="revoked" element={<Approvals type="revoked" getMediaUrl={getMediaUrl} onActionSuccess={fetchData} />} />
              <Route path="inventory" element={
                <Inventory 
                  screens={screens} 
                  fetchData={fetchData} 
                  setIsAddScreenModalOpen={setIsAddCorridorModalOpen} 
                  handleDeleteScreen={handleDeleteScreen} 
                  handleUpdatePrice={handleUpdatePrice} 
                  handleOpenAddScreenForPole={handleOpenAddScreenForPole}
                />
              } />
              <Route path="analytics" element={
                <Analytics analytics={analyticsData} screensCount={screens.length} />
              } />
              <Route path="live-cctv" element={
                <LiveCCTV />
              } />
              <Route path="partner-requests" element={
                <PartnerRequests />
              } />
              <Route path="promo-codes" element={
                <PromoCodeManagement />
              } />
              <Route path="pricing" element={
                <Pricing plans={plans} />
              } />
              <Route path="settings" element={
                <Settings 
                  profileForm={profileForm} 
                  setProfileForm={setProfileForm} 
                  handleProfilePicUpload={handleProfilePicUpload} 
                  handleUpdateProfile={handleUpdateProfile} 
                  getMediaUrl={getMediaUrl}
                  setTwoFactorSetup={setTwoFactorSetup}
                  setIs2FAModalOpen={setIs2FAModalOpen}
                />
              } />
              <Route path="*" element={<Navigate to="pending" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals remain in Layout for shared state accessibility */}
      <AddPoleModal 
        isOpen={isAddPoleModalOpen} 
        onClose={() => setIsAddPoleModalOpen(false)} 
        onSuccess={() => {
          fetchData();
          setIsAddPoleModalOpen(false);
        }} 
      />

      <AddCorridorModal 
        isOpen={isAddCorridorModalOpen} 
        onClose={() => setIsAddCorridorModalOpen(false)} 
        onSuccess={() => {
          fetchData();
          setIsAddCorridorModalOpen(false);
        }} 
      />

      {is2FAModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIs2FAModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[40px] p-8 flex flex-col items-center shadow-2xl">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Shield size={24} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-1">Google Authenticator MFA</h3>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6 text-center">Scan QR Code or Enter Secret Key</p>

             <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-inner mb-4 flex items-center justify-center">
                <img 
                   src={twoFactorSetup?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetup?.otpauth || '')}`} 
                   alt="Google Authenticator QR Code" 
                   className="w-44 h-44 rounded-xl" 
                />
             </div>

             {twoFactorSetup?.secret && (
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-6 flex items-center justify-between">
                   <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secret Key</div>
                      <div className="font-mono font-black text-slate-800 text-xs tracking-wider">{twoFactorSetup.secret}</div>
                   </div>
                   <button 
                      onClick={() => {
                         navigator.clipboard.writeText(twoFactorSetup.secret);
                         alert('Secret key copied to clipboard!');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all"
                   >
                      Copy
                   </button>
                </div>
             )}

             <input 
                maxLength={6} 
                value={twoFactorVerifyCode} 
                onChange={(e) => setTwoFactorVerifyCode(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="000000" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-center text-2xl tracking-[0.4em] mb-6 outline-none focus:border-indigo-600 focus:bg-white transition-all" 
             />

             <div className="flex gap-3 w-full">
                <button 
                   onClick={() => setIs2FAModalOpen(false)} 
                   className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                   Cancel
                </button>
                <button 
                   onClick={async () => {
                      if (!twoFactorVerifyCode || twoFactorVerifyCode.length !== 6) {
                         alert('Please enter a valid 6-digit code from Google Authenticator.');
                         return;
                      }
                      try {
                         await API.post('/auth/confirm-2fa', { code: twoFactorVerifyCode });
                         setProfileForm(prev => ({ ...prev, twoFactorEnabled: true }));
                         localStorage.setItem('user2FA', 'true');
                         alert('Google Authenticator 2FA enabled successfully!');
                         setIs2FAModalOpen(false);
                         setTwoFactorVerifyCode('');
                      } catch (err: any) { 
                         alert(`Verification Failed: ${err.response?.data?.msg || 'Invalid code'}`); 
                      }
                   }} 
                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                >
                   Link MFA
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
