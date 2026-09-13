import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, MapPin, Search, Play, ShieldAlert, Zap, 
  ArrowRight, Activity, Clock, Layers, Maximize2, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../services/api';

// --- Leaflet Fix for markers ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const statusStyles = {
  playing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  approved: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  rejected: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

// Reuse high-fidelity icon logic from user app
const createPoleIcon = (isASelected: boolean, isBSelected: boolean, isABooked: boolean, isBBooked: boolean, angle: number = 15) => L.divIcon({
  className: 'custom-pole-icon',
  html: `
    <div style="transform: rotate(${angle}deg); position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <!-- Pole Stem -->
      <div style="position: absolute; bottom: 4px; width: 4px; height: 32px; background: ${isASelected || isBSelected || isABooked || isBBooked ? '#facc15' : '#334155'}; border-radius: 2px; transition: all 0.3s; ${isASelected || isBSelected ? 'box-shadow: 0 0 20px rgba(250, 204, 21, 0.6);' : ''}"></div>
      
      <!-- Screen A -->
      <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-110%); width: 14px; height: 10px; background: ${isABooked ? '#ef4444' : isASelected ? '#facc15' : '#22c55e'}; border: 1.5px solid white; border-radius: 2px; display: flex; align-items: center; justify-content: center; z-index: 2; transition: all 0.3s; ${isABooked ? 'box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);' : isASelected ? 'box-shadow: 0 0 15px rgba(250, 204, 21, 0.8);' : ''}">
        <span style="color: ${isASelected ? '#1e293b' : 'white'}; font-size: 7px; font-weight: 900;">A</span>
      </div>
      
      <!-- Screen B -->
      <div style="position: absolute; top: 4px; left: 50%; transform: translateX(10%); width: 14px; height: 10px; background: ${isBBooked ? '#ef4444' : isBSelected ? '#facc15' : '#22c55e'}; border: 1.5px solid white; border-radius: 2px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: all 0.3s; ${isBBooked ? 'box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);' : isBSelected ? 'box-shadow: 0 0 15px rgba(250, 204, 21, 0.8);' : ''}">
        <span style="color: ${isBSelected ? '#1e293b' : 'white'}; font-size: 7px; font-weight: 900;">B</span>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 36]
});

function MapViewHandler({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { 
    map.setView(center, 16); 
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

const GovDashboard = () => {
  const [screens, setScreens] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.5056, 80.6325]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch screens first as they are critical
        const screensRes = await API.get('/screens');
        console.log('📡 GovDashboard - Screens Received:', screensRes.data?.length, screensRes.data);
        setScreens(screensRes.data);
        
        // Then try to fetch schedules (might fail if not authorized for all)
        try {
          const schedulesRes = await API.get('/schedule');
          setSchedules(schedulesRes.data);
        } catch (schedErr) {
          console.warn('⚠️ Could not fetch all schedules (maybe limited permissions):', schedErr);
          // Don't block the whole UI
        }
      } catch (err) {
        console.error('❌ Failed to fetch critical screen data');
      }
    };
    fetchData();
  }, []);


  // Helper to check if a screen is booked right now
  const isBookedNow = (screenId: string) => {
    const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${mins}`;
    const today = now.toISOString().split('T')[0];

    return schedules.some(s => 
      s.screenId?._id === screenId && 
      s.date === today &&
      currentTime >= s.startTime && 
      currentTime <= s.endTime &&
      (s.status === 'playing' || s.status === 'approved')
    );
  };

  // Group screens by pole
  const poles = Array.from(new Set(screens.map(s => s.poleId || s.deviceId))).filter(Boolean).map(poleId => {
    const poleScreens = screens.filter(s => (s.poleId || s.deviceId) === poleId);
    const screenA = poleScreens.find(s => s.side === 'A') || (poleScreens.length === 1 && !poleScreens[0].poleId ? poleScreens[0] : null);
    const screenB = poleScreens.find(s => s.side === 'B');
    const first = poleScreens[0];
    
    if (!first) return null;

    // Use unified booking logic
    const isABooked = screenA ? isBookedNow(screenA._id) : false;
    const isBBooked = screenB ? isBookedNow(screenB._id) : false;

    return {
      id: poleId,
      lat: first.lat || 16.5056,
      lng: first.lng || 80.6325,
      location: first.location || "Unknown Location",
      screenA,
      screenB,
      isABooked,
      isBBooked,
      allScreens: poleScreens
    };
  }).filter((p): p is any => p !== null);

  return (
    <div className="app-bg min-h-screen pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-4"
            >
              <ShieldAlert size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Government Official Portal • MG Road Corridor</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight"
            >
              Network <span className="text-indigo-600">Commander</span>
            </motion.h1>
            <p className="text-slate-500 font-medium mt-4 text-lg">Real-time oversight of the premium LED corridor. Manage deployments, monitor health, and handle emergency protocols.</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-indigo-50 flex items-center justify-center text-[11px] font-black text-indigo-400 shadow-sm">
                    G{i}
                  </div>
                ))}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Officials Online</p>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm font-bold text-slate-700">3 Verified Active</span>
                </div>
             </div>
          </div>
        </header>

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Network Reach', value: '4.2M+', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Daily Impressions' },
            { label: 'Dual-Facing Poles', value: (poles.length).toString(), icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Synchronized Units' },
            { label: 'Active Streams', value: schedules.filter(s => s.status === 'playing').length.toString(), icon: Play, color: 'text-sky-600', bg: 'bg-sky-50', sub: 'Live Deployments' },
            { label: 'System Uptime', value: '99.9%', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Last 30 Days' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Map / Inventory Control */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-xl flex flex-col h-[700px]">
              <div className="px-4 py-6 md:px-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Booking & Network View</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Geographic Inventory Management</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-100 rounded-2xl mr-2">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Available</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Booked / Playing</span>
                     </div>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Map
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      List
                    </button>
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-2" />
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search screens..."
                      className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 w-48 focus:w-64 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  {viewMode === 'map' ? (
                    <motion.div 
                      key="map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-0"
                    >
                      <MapContainer
                        center={mapCenter}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <MapViewHandler center={mapCenter} />
                        
                        {poles.filter(p => (p.location || "").toLowerCase().includes(searchTerm.toLowerCase()) || (p.id || "").toLowerCase().includes(searchTerm.toLowerCase())).map(pole => (
                          <Marker
                            key={pole.id}
                            position={[pole.lat, pole.lng]}
                            icon={createPoleIcon(false, false, pole.isABooked, pole.isBBooked)}
                          >
                            <Popup className="custom-popup">
                              <div className="p-4 w-64">
                                <div className="flex items-center justify-between mb-4">
                                   <div>
                                      <h3 className="text-sm font-black text-slate-900">{pole.id}</h3>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{pole.location}</p>
                                   </div>
                                   <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                      <Maximize2 size={16} />
                                   </div>
                                </div>
                                
                                <div className="space-y-3">
                                   {pole.screenA && (
                                     <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                           <div className={`w-2 h-2 rounded-full ${pole.isABooked ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
                                           <span className="text-xs font-black text-slate-700">Side A</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase ${pole.isABooked ? 'text-red-600' : 'text-green-600'}`}>
                                           {pole.isABooked ? 'BOOKED' : 'AVAILABLE'}
                                        </span>
                                     </div>
                                   )}
                                   {pole.screenB && (
                                     <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                           <div className={`w-2 h-2 rounded-full ${pole.isBBooked ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
                                           <span className="text-xs font-black text-slate-700">Side B</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase ${pole.isBBooked ? 'text-red-600' : 'text-green-600'}`}>
                                           {pole.isBBooked ? 'BOOKED' : 'AVAILABLE'}
                                        </span>
                                     </div>
                                   )}
                                </div>
                                
                                <button className="w-full mt-4 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">
                                   Manage Pole
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="list"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 space-y-4 overflow-y-auto h-full"
                    >
                      {screens.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((screen) => (
                        <div key={screen._id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                              <Monitor size={28} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">{screen.name}</h3>
                                {screen.side !== 'none' && (
                                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">SIDE {screen.side}</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-1 opacity-70 uppercase tracking-widest">
                                <MapPin size={12} /> {screen.location}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network Status</p>
                                <div className="flex items-center justify-end gap-1.5">
                                   <span className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'}`} />
                                   <span className={`text-[10px] font-black uppercase tracking-tighter ${screen.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                     {screen.status}
                                   </span>
                                </div>
                             </div>
                             <button 
                                onClick={() => {
                                  setMapCenter([screen.lat, screen.lng]);
                                  setViewMode('map');
                                }}
                                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all active:scale-95"
                             >
                                <ArrowRight size={20} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Critical Tools */}
          <div className="lg:col-span-4 space-y-6">
            {/* Emergency Broadcast */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-rose-600 rounded-[40px] p-10 text-white shadow-2xl shadow-rose-200 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 group-hover:rotate-12 transition-transform">
                  <ShieldAlert size={36} className="text-rose-100" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">Emergency Override</h3>
                <p className="text-rose-100 text-sm font-medium leading-relaxed mb-8">Instantly broadcast critical alerts, amber alerts, or disaster warnings across all government screens in the network.</p>
                <button className="w-full py-5 bg-white text-rose-600 font-black text-xs uppercase tracking-[0.2em] rounded-[24px] hover:bg-rose-50 transition-all shadow-xl shadow-rose-900/30 active:scale-[0.98]">
                  Activate Protocol
                </button>
              </div>
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-rose-500 rounded-full opacity-30 blur-[80px] group-hover:scale-150 transition-transform duration-700" />
            </motion.div>

            {/* Smart Traffic Routing */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Activity size={36} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">AI Traffic Sync</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Optimize content delivery based on live traffic patterns and pedestrian density across the MG Road corridor.</p>
                
                <div className="space-y-4 mb-8">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Active Corridor</p>
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-white">Benz Circle → M.G. Road</p>
                       <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Optimized</span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20">
                  Configure Engine
                </button>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent opacity-50" />
            </motion.div>
          </div>
        </div>

        {/* Recent Government Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-xl"
        >
          <div className="px-4 md:px-10 py-6 md:py-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Official Deployment Log</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audit Trail & Campaign Monitoring</p>
            </div>
            <button className="flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors">
              Export CSV <ChevronRight size={18} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-4 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Screen</th>
                  <th className="px-4 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Schedule</th>
                  <th className="px-4 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Content Title</th>
                  <th className="px-4 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 md:px-10 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                          <Layers size={32} />
                        </div>
                        <p className="text-slate-400 font-bold">No recent government deployments detected.</p>
                      </div>
                    </td>
                  </tr>
                ) : schedules.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-[10px] group-hover:scale-110 transition-transform">
                          GOV
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{s.screenId?.name || 'Network Screen'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.screenId?.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" /> {s.date}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold ml-6 uppercase">{s.startTime} – {s.endTime}</p>
                      </div>
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.videoId?.title}</p>
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusStyles[s.status as keyof typeof statusStyles]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${s.status === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-60'}`} />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default GovDashboard;
