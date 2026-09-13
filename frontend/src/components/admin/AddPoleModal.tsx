import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Monitor, Zap, Info, 
  Settings, Save, Plus, ChevronRight, 
  ChevronLeft, ArrowRight, Eye, CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import API from '../../services/api';

interface AddPoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPoleModal: React.FC<AddPoleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [poleData, setPoleData] = useState({
    corridorName: 'Vijayawada MG Road Corridor',
    poleId: 'POLE-01',
    city: 'Vijayawada',
    area: 'MG Road',
    poleType: 'Dual-Sided Divider Pole',
    lat: 16.5062,
    lng: 80.6480,
    sideA: {
      deviceId: 'SCR-001A',
      facingLocation: 'Ambedkar Statue Side',
      orientation: 'Facing East',
      price: 500,
      resolution: '1920x1080',
      width: '10ft',
      height: '10ft',
      status: 'online'
    },
    sideB: {
      deviceId: 'SCR-001B',
      facingLocation: 'Eat Street Side',
      orientation: 'Facing West',
      price: 500,
      resolution: '1920x1080',
      width: '10ft',
      height: '10ft',
      status: 'online'
    },
    device: {
      type: 'Android Player',
      deviceId: 'SCR-001-DEV',
      cameraUrl: '',
      playbackUrl: ''
    }
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 9));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.post('/screens/pole', poleData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Failed to save: ${err.response?.data?.msg || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  function MapPicker() {
    useMapEvents({
      click(e) {
        setPoleData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
      },
    });
    return (
      <>
        <Marker position={[poleData.lat, poleData.lng]} />
        <Circle center={[poleData.lat, poleData.lng]} radius={10} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.2 }} />
      </>
    );
  }

  const sections = [
    { id: 1, title: 'Basic Details', icon: Info },
    { id: 2, title: 'Pole Location', icon: MapPin },
    { id: 3, title: 'Side A Config', icon: Monitor },
    { id: 4, title: 'Side B Config', icon: Monitor },
    { id: 5, title: 'Device Connection', icon: Zap },
    { id: 6, title: 'Map Preview', icon: Eye },
    { id: 7, title: 'Booking Modes', icon: Settings },
    { id: 8, title: 'Corridor Group', icon: Plus },
    { id: 9, title: 'Save & Deploy', icon: CheckCircle2 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="relative w-full max-w-6xl bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] max-h-[900px]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <Plus size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Provision New LED Pole</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Section Configuration Flow</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="hidden md:flex w-64 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-2 overflow-y-auto shrink-0 no-scrollbar">
            {sections.map(s => (
              <button 
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${step === s.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 border border-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-200 text-slate-500'}`}>
                   <s.icon size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-5 md:p-10 bg-white no-scrollbar">
             <AnimatePresence mode="wait">
                <motion.div 
                  key={step} 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="max-w-3xl mx-auto space-y-10 pb-10"
                >
                  {/* Step 1: Basic Details */}
                  {step === 1 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 1 — Basic Details</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Define the primary administrative identity of this LED pole.</p>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corridor Name</label>
                             <input value={poleData.corridorName} onChange={e => setPoleData(prev => ({...prev, corridorName: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Vijayawada MG Road Corridor" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pole ID</label>
                                <input value={poleData.poleId} onChange={e => setPoleData(prev => ({...prev, poleId: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="POLE-01" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                <select value={poleData.city} onChange={e => setPoleData(prev => ({...prev, city: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                   <option>Vijayawada</option>
                                   <option>Guntur</option>
                                   <option>Visakhapatnam</option>
                                   <option>Hyderabad</option>
                                </select>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area / Route</label>
                                <input value={poleData.area} onChange={e => setPoleData(prev => ({...prev, area: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="MG Road" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pole Type</label>
                                <select value={poleData.poleType} onChange={e => setPoleData(prev => ({...prev, poleType: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                   <option>Dual-Sided Divider Pole</option>
                                   <option>Single Pole</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 2: Pole Location */}
                  {step === 2 && (
                    <div className="space-y-8 h-full flex flex-col">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 2 — Pole Location</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Admin selects exact pole placement. Tap on the road divider.</p>
                       </div>
                       <div className="h-[400px] rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner relative">
                           <MapContainer 
                             center={[poleData.lat, poleData.lng]} 
                             zoom={18} 
                             maxZoom={21}
                             style={{ height: '100%', width: '100%' }}
                           >
                             <TileLayer 
                               url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" 
                               maxZoom={21}
                               maxNativeZoom={19}
                             />
                             <MapPicker />
                           </MapContainer>
                          <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Precise Placement</p>
                             <p className="text-sm font-black text-white tracking-tight">{poleData.lat.toFixed(7)}, {poleData.lng.toFixed(7)}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                             <input type="number" step="any" value={poleData.lat} onChange={e => setPoleData(prev => ({...prev, lat: parseFloat(e.target.value)}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                             <input type="number" step="any" value={poleData.lng} onChange={e => setPoleData(prev => ({...prev, lng: parseFloat(e.target.value)}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 3: Side A Config */}
                  {step === 3 && (
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight tracking-tight uppercase">Side A — Traffic Targeting</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Configure targeting and physical specs for the primary screen.</p>
                          </div>
                          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-600/20">A</div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Screen A ID</label>
                                <input value={poleData.sideA.deviceId} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, deviceId: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="SCR-001A" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facing Location (Traffic Source)</label>
                                <input value={poleData.sideA.facingLocation} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, facingLocation: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Ambedkar Statue Side" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orientation</label>
                                <input value={poleData.sideA.orientation} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, orientation: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Facing East" />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolution</label>
                                   <input value={poleData.sideA.resolution} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, resolution: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="1920x1080" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price / hr</label>
                                   <input type="number" value={poleData.sideA.price} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, price: parseInt(e.target.value)}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Width</label>
                                   <input value={poleData.sideA.width} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, width: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="10ft" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height</label>
                                   <input value={poleData.sideA.height} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, height: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="10ft" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                                <select value={poleData.sideA.status} onChange={e => setPoleData(prev => ({...prev, sideA: {...prev.sideA, status: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none">
                                   <option value="online">Active / Online</option>
                                   <option value="maintenance">Maintenance</option>
                                   <option value="offline">Offline</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 4: Side B Config */}
                  {step === 4 && (
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Side B — Traffic Targeting</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Configure targeting and physical specs for the secondary screen.</p>
                          </div>
                          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl">B</div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Screen B ID</label>
                                <input value={poleData.sideB.deviceId} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, deviceId: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="SCR-001B" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facing Location (Traffic Source)</label>
                                <input value={poleData.sideB.facingLocation} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, facingLocation: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Eat Street Side" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orientation</label>
                                <input value={poleData.sideB.orientation} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, orientation: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Facing West" />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolution</label>
                                   <input value={poleData.sideB.resolution} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, resolution: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="1920x1080" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price / hr</label>
                                   <input type="number" value={poleData.sideB.price} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, price: parseInt(e.target.value)}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Width</label>
                                   <input value={poleData.sideB.width} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, width: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="10ft" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height</label>
                                   <input value={poleData.sideB.height} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, height: e.target.value}}))} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="10ft" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                                <select value={poleData.sideB.status} onChange={e => setPoleData(prev => ({...prev, sideB: {...prev.sideB, status: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none">
                                   <option value="online">Active / Online</option>
                                   <option value="maintenance">Maintenance</option>
                                   <option value="offline">Offline</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 5: Live Device Connection */}
                  {step === 5 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 5 — Live Device Connection</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Connect the pole hardware to the E3Di cloud player system.</p>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Type</label>
                                <select value={poleData.device.type} onChange={e => setPoleData(prev => ({...prev, device: {...prev.device, type: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none">
                                   <option>Android Player</option>
                                   <option>Smart TV</option>
                                   <option>Raspberry Pi</option>
                                   <option>Web Player</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Hub ID</label>
                                <input value={poleData.device.deviceId} onChange={e => setPoleData(prev => ({...prev, device: {...prev.device, deviceId: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="SCR-001-DEV" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Camera Stream URL (Optional)</label>
                             <input value={poleData.device.cameraUrl} onChange={e => setPoleData(prev => ({...prev, device: {...prev.device, cameraUrl: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="rtsp://admin:pass@ip:port/stream" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Playback / Stream Node URL</label>
                             <input value={poleData.device.playbackUrl} onChange={e => setPoleData(prev => ({...prev, device: {...prev.device, playbackUrl: e.target.value}}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none" placeholder="https://stream.e3di.com/live/..." />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 6: Map Preview */}
                  {step === 6 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 6 — Real-time Preview</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Visual validation of road alignment and traffic facing directions.</p>
                       </div>
                       <div className="h-[350px] bg-slate-900 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                          {/* Simulated Map Preview with Flow Arrows */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-12">
                             {/* Side A Flow */}
                             <div className="flex flex-col items-center gap-4">
                                <div className="flex gap-4">
                                   {[1,2,3].map(i => <motion.div key={i} animate={{ x: [0, 20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.4 }} className="text-indigo-400"><ArrowRight size={24} /></motion.div>)}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{poleData.sideA.facingLocation}</span>
                             </div>

                             {/* The Pole */}
                             <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full bg-slate-700 shadow-xl" />
                                <div className="flex flex-col items-center">
                                   <div className="w-48 h-4 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400 flex items-center justify-center">
                                      <span className="text-[8px] font-black text-white">SIDE A</span>
                                   </div>
                                   <div className="w-1 h-8 bg-slate-800" />
                                   <div className="w-48 h-4 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center">
                                      <span className="text-[8px] font-black text-white/50">SIDE B</span>
                                   </div>
                                </div>
                             </div>

                             {/* Side B Flow */}
                             <div className="flex flex-col items-center gap-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{poleData.sideB.facingLocation}</span>
                                <div className="flex gap-4 rotate-180">
                                   {[1,2,3].map(i => <motion.div key={i} animate={{ x: [0, 20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.4 }} className="text-slate-400"><ArrowRight size={24} /></motion.div>)}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 7: Booking Modes */}
                  {step === 7 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 7 — Booking Configuration</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Enable or disable specific booking strategies for this asset.</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'single', label: 'Single Screen', desc: 'Allow A or B individually' },
                            { id: 'pole', label: 'Single Pole', desc: 'Sync A+B together always' },
                            { id: 'multi', label: 'Multi Pole', desc: 'Part of custom campaigns' },
                            { id: 'corridor', label: 'Full Corridor', desc: 'Sync with 10+ pole sets' },
                          ].map(mode => (
                            <div key={mode.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between hover:bg-indigo-50 transition-all cursor-pointer group">
                               <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{mode.label}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mode.desc}</p>
                               </div>
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 shadow-sm">
                                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Step 8: Corridor Grouping */}
                  {step === 8 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Section 8 — Corridor Grouping</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Assign this pole to a corridor and set its sequence order.</p>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Corridor Group</label>
                             <select className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none">
                                <option>{poleData.corridorName}</option>
                                <option>+ Create New Corridor...</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pole Order in Corridor</label>
                             <input type="number" defaultValue="1" className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold outline-none" />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 9: Save & Deploy */}
                  {step === 9 && (
                    <div className="space-y-8 flex flex-col items-center text-center py-10">
                       <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-600 mb-4">
                          <CheckCircle2 size={48} />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ready to Deploy</h3>
                          <p className="text-sm text-slate-500 font-medium max-w-sm">Confirming this action will provision POLE-01 and create two active screen instances (SCR-001A & SCR-001B).</p>
                       </div>
                       
                       <div className="w-full max-w-md bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-left space-y-4 mt-4">
                          <div className="flex justify-between border-b border-slate-200 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pole Identity</span>
                             <span className="text-xs font-black text-slate-900">{poleData.poleId}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corridor</span>
                             <span className="text-xs font-black text-slate-900">{poleData.corridorName}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Impact</span>
                             <span className="text-xs font-black text-indigo-600">2 screens (A+B)</span>
                          </div>
                       </div>

                       <div className="flex flex-col w-full max-w-md gap-4 mt-8">
                          <button 
                            disabled={loading}
                            onClick={handleSave}
                            className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                          >
                            {loading ? <RefreshCw size={24} className="animate-spin" /> : <Save size={20} />}
                            Save & Deploy Pole
                          </button>
                          <button className="w-full py-5 bg-white border border-slate-200 text-slate-600 font-black rounded-3xl hover:bg-slate-50 transition-all">
                             Save & Add Another Pole
                          </button>
                       </div>
                    </div>
                  )}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
           <button 
             onClick={prevStep} 
             disabled={step === 1}
             className="flex items-center gap-2 px-6 py-3 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all"
           >
             <ChevronLeft size={18} /> Previous Section
           </button>
           
           <div className="flex items-center gap-1.5">
              {sections.map(s => (
                <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${step === s.id ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`} />
              ))}
           </div>

           {step < 9 ? (
             <button 
               onClick={nextStep}
               className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98]"
             >
               Next Section <ChevronRight size={18} />
             </button>
           ) : (
             <div className="w-[180px]" /> /* Placeholder to keep layout */
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddPoleModal;
