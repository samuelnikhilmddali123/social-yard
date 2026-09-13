import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Building2, AlertCircle, CheckCircle2, 
  Timer, BarChart2, Search, Filter, X, MapPin, RotateCcw, Image as ImageIcon,
  Calendar, Clock, Check, Settings, Sparkles, Building, Briefcase, Mail, ArrowRight
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../AuthContext';

const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'https://www.e3di.org/_/backend/api').replace('/api', '').replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusStyles = {
  playing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  approved: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-100/50 border-dashed',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, setAuthData } = useAuth();

  const [rebookingId, setRebookingId] = useState<string | null>(null);

  const handleRebook = async (booking: any) => {
    const rawVideoId = booking.videoId?._id || booking.videoId;
    const rawScreenId = booking.screenId?.deviceId || booking.screenId?._id;

    if (!rawVideoId || !rawScreenId) {
      localStorage.setItem('campaign_selectedScreenIds', JSON.stringify([rawScreenId || 'ethree-65']));
      navigate('/launch');
      return;
    }

    if (!confirm('Rebook this campaign? It will be submitted immediately for Admin approval and live broadcast.')) return;

    setRebookingId(booking._id);
    try {
      const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startH = now.getHours().toString().padStart(2, '0');
      const startM = now.getMinutes().toString().padStart(2, '0');
      const startTimeStr = `${startH}:${startM}`;
      
      const endNow = new Date(now.getTime() + (booking.durationSeconds || 30) * 1000);
      const endH = endNow.getHours().toString().padStart(2, '0');
      const endM = endNow.getMinutes().toString().padStart(2, '0');
      const endTimeStr = `${endH}:${endM}`;

      await API.post('/schedule/campaign', {
        videoId: rawVideoId,
        screenIds: [rawScreenId],
        date: dateStr,
        endDate: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isInstant: true,
        durationSeconds: booking.durationSeconds || 30,
        hasWatermark: booking.hasWatermark !== false,
        format: booking.format || '65-inch'
      });

      alert('⚡ Campaign Re-booked! Sent for Admin Approval.');
      
      const response = await API.get('/schedule');
      setSchedules(response.data);
    } catch (err: any) {
      console.error('Rebooking failed:', err);
      alert(`Rebooking note: ${err.response?.data?.msg || 'Opening Campaign Studio.'}`);
      localStorage.setItem('campaign_selectedScreenIds', JSON.stringify([rawScreenId]));
      navigate('/launch');
    } finally {
      setRebookingId(null);
    }
  };
  
  // Interactive guide state
  const [showIntro, setShowIntro] = useState(!localStorage.getItem('e3di_intro_seen_v2'));
  const [introStep, setIntroStep] = useState(0);

  const introSteps = [
    {
      title: "Welcome to E3Di Platform",
      description: "Welcome to the E3Di command center. This dashboard allows you to manage active campaign bookings, view telemetry logs, and configure profile parameters in real time.",
    },
    {
      title: "Launch Interactive Campaigns",
      description: "Ready to go live? Browse curated corridors and book new digital slots instantly. Upload creative assets and set scheduled loops in less than 5 minutes.",
    },
    {
      title: "Real-Time Ad Telemetry",
      description: "Monitor campaign execution instantly. Observe active loops, schedule states, and check live device connectivity log telemetry.",
    }
  ];

  const handleNextStep = () => {
    if (introStep < introSteps.length - 1) {
      setIntroStep(prev => prev + 1);
    } else {
      setShowIntro(false);
      localStorage.setItem('e3di_intro_seen_v2', 'true');
    }
  };

  const handleSkipIntro = () => {
    setShowIntro(false);
    localStorage.setItem('e3di_intro_seen_v2', 'true');
  };

  // Set default tab from location state or default to bookings
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get('tab') === 'settings' ? 'settings' : 'bookings';
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>(defaultTab);

  // Booking states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Payment Alert State
  const [paymentAlert, setPaymentAlert] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    const payment = queryParams.get('payment');
    if (payment === 'success') {
      setPaymentAlert('success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'failed') {
      setPaymentAlert('failed');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gst, setGst] = useState(user?.gst || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch user bookings
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await API.get('/schedule');
        setSchedules(response.data);
      } catch (err) {
        console.error('Failed to fetch schedules');
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchSchedules();
  }, []);

  // Update form fields if user context updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompanyName(user.companyName || '');
      setGst(user.gst || '');
      setBusinessType(user.businessType || '');
    }
  }, [user]);

  const onPhoneChange = (val: string) => {
    setPhone(val.replace(/\D/g, '').slice(0, 10));
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (phone.length < 10) {
      setFormError('Enter a valid 10-digit mobile number.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await API.post('/auth/complete-profile', {
        name: name.trim(),
        phone,
        companyName: companyName.trim(),
        gst: gst.trim(),
        businessType: businessType.trim(),
      });

      const updatedUser = res.data.user;
      if (token) {
        setAuthData(token, updatedUser);
      }
      setFormSuccess('Profile settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.msg || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = 
      (s.screenId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.videoId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.screenId?.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeSlots = schedules.filter(s => s.status === 'playing').length;
  const upcomingSlots = schedules.filter(s => s.status === 'approved').length;
  const pendingSlots = schedules.filter(s => s.status === 'pending').length;

  return (
    <div className="app-bg min-h-screen pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* User Card Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[30px] p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              {user?.profilePic || user?.photoURL ? (
                <img 
                  src={user.profilePic || user.photoURL} 
                  alt="Profile Avatar" 
                  className="w-20 h-20 rounded-full border-4 border-indigo-100 shadow-md object-cover" 
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                  <User size={36} />
                </div>
              )}
              
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'User'}</h1>
                  <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {user?.role || 'Advertiser'}
                  </span>
                </div>
                
                <div className="space-y-1 text-slate-500 font-medium text-xs md:text-sm">
                  <p className="flex items-center justify-center md:justify-start gap-1.5">
                    <Mail size={14} className="text-slate-400" /> {user?.email}
                  </p>
                  {user?.phone && (
                    <p className="flex items-center justify-center md:justify-start gap-1.5">
                      <Phone size={14} className="text-slate-400" /> +91 {user?.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                onClick={() => {
                  setIntroStep(0);
                  setShowIntro(true);
                }}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles size={14} className="text-yellow-500 animate-pulse" /> Platform Tour
              </button>
              <Link
                to="/launch-campaign"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                Book new slot
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Payment Success/Failure Notification Banner */}
        {paymentAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
              paymentAlert === 'success'
                ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 backdrop-blur-sm'
                : 'bg-rose-50/80 text-rose-800 border-rose-200 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              {paymentAlert === 'success' ? (
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
              )}
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">
                  {paymentAlert === 'success' ? 'Payment Completed Successfully!' : 'Payment Failed'}
                </p>
                <p className="text-xs opacity-85 mt-0.5">
                  {paymentAlert === 'success'
                    ? 'Your campaign slot booking is registered and sent to the administrator for review.'
                    : 'The transaction was declined or cancelled. Feel free to try booking again.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentAlert(null)}
              className="p-1.5 hover:bg-black/5 rounded-lg transition-all text-current opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={16} />
            My Bookings
            {schedules.length > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'bookings' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {schedules.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={16} />
            Profile Settings
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'bookings' ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Active Slots', value: activeSlots.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Upcoming', value: upcomingSlots.toString(), icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Pending Approval', value: pendingSlots.toString(), icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Total bookings', value: schedules.length.toString(), icon: BarChart2, color: 'text-sky-600', bg: 'bg-sky-50' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                      <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center`}>
                        <stat.icon size={16} className={stat.color} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Bookings Table/List */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-5 md:px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search screen or video..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative w-full sm:w-auto">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="playing">Playing</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location & Screen</th>
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Video</th>
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Time</th>
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingBookings ? (
                        <tr>
                          <td colSpan={6} className="px-5 md:px-8 py-20 text-center text-slate-400 font-bold">Loading schedules...</td>
                        </tr>
                      ) : filteredSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 md:px-8 py-20 text-center text-slate-400 font-bold">
                            {searchTerm || statusFilter !== 'all' ? 'No matching bookings found.' : 'No schedules found.'}
                          </td>
                        </tr>
                      ) : filteredSchedules.map((booking) => (
                        <tr 
                          key={booking._id}
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 md:px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                {booking._id.slice(-4).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 mb-0.5">{booking.screenId?.name || 'Unknown Screen'}</p>
                                <p className="text-[10px] text-indigo-600 font-black mb-0.5">
                                  {booking.selectedScreens || booking.selectedScreenCount || 1} Screen{(booking.selectedScreens || booking.selectedScreenCount || 1) !== 1 ? 's' : ''} • {booking.durationSeconds || 30} Sec ({booking.slotMultiplier || Math.ceil((booking.durationSeconds || 30) / 5)} slots) • ₹{(booking.calculatedPrice || booking.totalAmount || 50).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                                  <MapPin size={10} className="text-slate-400" /> {booking.screenId?.location || 'Unknown Location'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 md:px-8 py-5">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Calendar size={13} className="text-slate-400" />
                                {booking.isInstant && booking.status === 'pending'
                                  ? 'Immediate'
                                  : new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                                <Clock size={10} />{' '}
                                {booking.isInstant
                                  ? booking.status === 'pending'
                                    ? `Will begin after approval (${booking.durationSeconds || 30}s)`
                                    : `${booking.startTime} - ${booking.endTime} (${booking.durationSeconds || 30}s)`
                                  : `${booking.startTime} - ${booking.endTime} (${booking.durationSeconds || 30}s)`}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 md:px-8 py-5">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const rawUrl = booking.videoId?.url || booking.videoId?.filePath || '';
                                const mediaUrl = rawUrl ? getMediaUrl(rawUrl) : '';
                                const isVideo = rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.endsWith('.mov');
                                return (
                                  <a 
                                    href={mediaUrl || '#'} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group shadow-sm block hover:ring-2 hover:ring-indigo-500 transition-all"
                                    title="Click to view original asset"
                                  >
                                    {mediaUrl ? (
                                      isVideo ? (
                                        <video 
                                          src={mediaUrl} 
                                          className="w-full h-full object-cover" 
                                          muted 
                                          onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                                          onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                                        />
                                      ) : (
                                        <img 
                                          src={mediaUrl} 
                                          alt={booking.videoId?.title || 'Creative Asset'} 
                                          className="w-full h-full object-cover" 
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      )
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon size={18} />
                                      </div>
                                    )}
                                  </a>
                                );
                              })()}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 mb-0.5 truncate max-w-[160px]" title={booking.videoId?.title}>
                                  {booking.videoId?.title || 'Untitled Creative'}
                                </p>
                                <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                  <BarChart2 size={10} /> {(booking.videoId?.duration || 0)}s duration
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 md:px-8 py-5">
                            <p className="text-sm font-bold text-slate-700 mb-0.5">
                              {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-5 md:px-8 py-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyles[booking.status as keyof typeof statusStyles]}`}>
                              <span className={`w-1 h-1 rounded-full mr-1.5 ${booking.status === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-60'}`} />
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-5 md:px-8 py-5 text-right">
                            <button
                              type="button"
                              disabled={rebookingId === booking._id}
                              onClick={() => handleRebook(booking)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 uppercase tracking-wider active:scale-95 shrink-0 disabled:opacity-50"
                            >
                              <RotateCcw size={12} className={rebookingId === booking._id ? 'animate-spin' : ''} />
                              {rebookingId === booking._id ? 'Rebooking...' : 'Book Again'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-5 md:px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium italic">Showing {filteredSchedules.length} results</p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button 
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-[30px] p-6 md:p-10 shadow-sm relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Profile Details</h2>
              <p className="text-sm text-slate-500 font-medium mb-8">Maintain your professional billing and contact information.</p>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {formError}
                </motion.div>
              )}

              {formSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold"
                >
                  <Check size={18} className="shrink-0" />
                  {formSuccess}
                </motion.div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                        +91
                      </span>
                      <input
                        required
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        className="w-full pl-20 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Company Name <span className="text-slate-300">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Company / Brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      GSTIN <span className="text-slate-300">(optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="GSTIN details"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Business Type <span className="text-slate-300">(optional)</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Retail, Agency, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Settings'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Interactive Introduction Tour */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border border-slate-200/80 rounded-[32px] max-w-lg w-full p-8 md:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
                
                {/* Close Button */}
                <button
                  onClick={handleSkipIntro}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  aria-label="Close tour"
                >
                  <X size={18} />
                </button>

                <div className="relative z-10 flex flex-col gap-6">
                  {/* Step Indicator */}
                  <div className="flex items-center gap-1.5">
                    {introSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === introStep ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      {introSteps[introStep].title}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      {introSteps[introStep].description}
                    </p>
                  </div>

                  {/* Visual Preview / Actions */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                    {introStep === 0 && (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <BarChart2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Unified Workspace</p>
                          <p className="text-[11px] font-semibold text-slate-400">All coordinates, campaigns & settings in one page.</p>
                        </div>
                      </>
                    )}
                    {introStep === 1 && (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0">
                          <Sparkles size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Book Screens</p>
                          <p className="text-[11px] font-semibold text-slate-400">Upload crops & schedule loops instantly.</p>
                        </div>
                      </>
                    )}
                    {introStep === 2 && (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Real-time Telemetry</p>
                          <p className="text-[11px] font-semibold text-slate-400">Observe exact playing loops on digital boards.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={handleSkipIntro}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                    >
                      Skip tour
                    </button>
                    
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5"
                    >
                      <span>{introStep === introSteps.length - 1 ? 'Get Started' : 'Next Step'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
