import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Info, 
  Settings, Save, ChevronRight, 
  ChevronLeft, Eye, CheckCircle2,
  RefreshCw, Map as MapIcon, List, MousePointer2, RotateCcw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import API from '../../services/api';

interface AddCorridorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCorridorModal: React.FC<AddCorridorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [corridorData, setCorridorData] = useState({
    name: 'Vijayawada MG Road Corridor',
    city: 'Vijayawada',
    area: 'MG Road',
    sideAFacing: 'Ambedkar Statue Side',
    sideBFacing: 'Eat Street Side',
    poleCount: 5
  });

  const [poles, setPoles] = useState<any[]>([]); // { lat, lng, sideAEnabled, sideBEnabled, poleName, deviceIdPrefix }
  const [selectionIndex, setSelectionIndex] = useState(0);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Initialize poles when poleCount changes or when reaching step 3
  useEffect(() => {
    if (step === 3 || step === 4) {
      if (poles.length !== corridorData.poleCount) {
        const newPoles = Array.from({ length: corridorData.poleCount }).map((_, i) => ({
          lat: 16.5062,
          lng: 80.6480,
          sideAEnabled: true,
          sideBEnabled: true,
          poleName: `${corridorData.name} Pole ${i + 1}`,
          deviceIdPrefix: `SCR-${String(i + 1).padStart(3, '0')}`
        }));
        setPoles(newPoles);
        setSelectionIndex(0);
      }
    }
  }, [corridorData.poleCount, step]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.post('/screens/corridor', { corridorData, poles });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Failed to save corridor: ${err.response?.data?.msg || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  function MapSelectionHandler() {
    useMapEvents({
      click(e) {
        if (selectionIndex < poles.length) {
          const newPoles = [...poles];
          newPoles[selectionIndex] = { ...newPoles[selectionIndex], lat: e.latlng.lat, lng: e.latlng.lng };
          setPoles(newPoles);
          setSelectionIndex(prev => prev + 1);
        }
      },
    });
    return (
      <>
        {poles.map((p, i) => (
          <React.Fragment key={i}>
            <Marker position={[p.lat, p.lng]} icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-8 h-8 ${i === selectionIndex ? 'bg-indigo-600 scale-125' : (i < selectionIndex ? 'bg-emerald-500' : 'bg-slate-800')} rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg transition-all">${i + 1}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })} />
            <Circle center={[p.lat, p.lng]} radius={8} pathOptions={{ color: i === selectionIndex ? '#4f46e5' : '#1e293b', fillOpacity: 0.1 }} />
          </React.Fragment>
        ))}
      </>
    );
  }

  const sections = [
    { id: 1, title: 'Corridor Info', icon: Info },
    { id: 2, title: 'Flow Labels', icon: RefreshCw },
    { id: 3, title: 'Pole Quantity', icon: List },
    { id: 4, title: 'Map Selection', icon: MapPin },
    { id: 5, title: 'Screen Config', icon: Settings },
    { id: 6, title: 'Final Preview', icon: Eye },
    { id: 7, title: 'Deploy', icon: CheckCircle2 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-6xl bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] max-h-[900px]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <MapIcon size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Rapid Corridor Provisioning</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Batch Asset Generation Engine</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden md:flex w-64 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-2 overflow-y-auto shrink-0 no-scrollbar">
            {sections.map(s => (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${step === s.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 border border-indigo-50' : 'text-slate-300'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400'}`}>
                   <s.icon size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-10 bg-white no-scrollbar">
             <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-3xl mx-auto space-y-10 pb-10">
                  
                  {step === 1 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Step 1 — Create Corridor</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Establish the primary administrative identity of your new LED network.</p>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corridor Name</label>
                             <input value={corridorData.name} onChange={e => setCorridorData(prev => ({...prev, name: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. MG Road Corridor" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                <input value={corridorData.city} onChange={e => setCorridorData(prev => ({...prev, city: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Vijayawada" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area / Route</label>
                                <input value={corridorData.area} onChange={e => setCorridorData(prev => ({...prev, area: e.target.value}))} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="MG Road" />
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Step 2 — Define Direction Labels</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Set traffic facing locations once. Reference the map below to identify landmarks.</p>
                       </div>

                       <div className="h-[250px] rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner relative mb-8">
                          <MapContainer center={[16.5062, 80.6480]} zoom={15} maxZoom={21} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" maxZoom={21} maxNativeZoom={19} />
                          </MapContainer>
                          <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-slate-100">
                             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Orientation Map</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 space-y-4">
                             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">A</div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">SIDE A FACING</label>
                                <input value={corridorData.sideAFacing} onChange={e => setCorridorData(prev => ({...prev, sideAFacing: e.target.value}))} className="w-full bg-white px-4 py-3 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ambedkar Statue Side" />
                             </div>
                          </div>
                          <div className="p-8 bg-slate-900 rounded-[40px] space-y-4">
                             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black">B</div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SIDE B FACING</label>
                                <input value={corridorData.sideBFacing} onChange={e => setCorridorData(prev => ({...prev, sideBFacing: e.target.value}))} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Eat Street Side" />
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Step 3 — Pole Quantity</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">How many physical poles are installed in this corridor?</p>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="flex-1">
                             <input type="range" min="1" max="50" value={corridorData.poleCount} onChange={e => setCorridorData(prev => ({...prev, poleCount: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                          </div>
                          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-white">
                             <span className="text-3xl font-black">{corridorData.poleCount}</span>
                             <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Poles</span>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-8 flex flex-col h-full">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black text-slate-900 tracking-tight">Step 4 — Map Placement</h3>
                             <p className="text-sm text-slate-500 font-medium">Tap {corridorData.poleCount} locations on the map sequentially.</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={() => setSelectionIndex(prev => Math.max(0, prev - 1))}
                               className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                             >
                               <RotateCcw size={14} /> Undo Last
                             </button>
                             <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                               Placement: {selectionIndex + 1} / {poles.length}
                             </div>
                          </div>
                       </div>
                       <div className="h-[450px] rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner relative group">
                          <MapContainer center={[16.5062, 80.6480]} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" maxZoom={21} maxNativeZoom={19} />
                            <MapSelectionHandler />
                          </MapContainer>
                          {selectionIndex >= poles.length && (
                            <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm flex flex-col items-center justify-center z-[1000]">
                               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-2xl mb-4">
                                  <CheckCircle2 size={40} />
                               </div>
                               <p className="text-xl font-black text-white drop-shadow-lg">All Locations Captured!</p>
                               <button onClick={() => setSelectionIndex(0)} className="mt-4 px-6 py-2 bg-white text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                                 <RotateCcw size={14} /> Reset Selection
                               </button>
                            </div>
                          )}
                          <div className="absolute top-6 right-6 z-[1000]">
                             <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                                <MousePointer2 size={16} className="text-indigo-600" />
                                <span className="text-[10px] font-black text-slate-900 uppercase">Click Divider Center</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Step 5 — Screen Configuration</h3>
                          <p className="text-sm text-slate-500 font-medium">Select screen availability for each generated pole.</p>
                       </div>
                       <div className="grid grid-cols-1 gap-4">
                          {poles.map((p, i) => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between hover:bg-indigo-50 transition-all group">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">{i+1}</div>
                                  <div className="space-y-0.5">
                                     <p className="text-xs font-black text-slate-900">{p.poleName}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID Prefix: {p.deviceIdPrefix}</p>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => {
                                    const next = [...poles];
                                    next[i].sideAEnabled = !next[i].sideAEnabled;
                                    setPoles(next);
                                  }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.sideAEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Side A</button>
                                  
                                  <button onClick={() => {
                                    const next = [...poles];
                                    next[i].sideBEnabled = !next[i].sideBEnabled;
                                    setPoles(next);
                                  }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.sideBEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Side B</button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-8">
                       <div className="space-y-2 text-center">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Final Preview</h3>
                          <p className="text-sm text-slate-500 font-medium">Validation of road alignment and traffic facing directions.</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-900 rounded-[40px] p-8 space-y-6">
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Traffic Flow A</h4>
                             <div className="flex flex-col gap-6">
                                {poles.filter(p => p.sideAEnabled).slice(0, 5).map((_, i) => (
                                  <div key={i} className="flex items-center gap-4">
                                     <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white text-[10px]">{i+1}</div>
                                     <div className="flex-1 h-2 bg-indigo-500/20 rounded-full relative overflow-hidden">
                                        <motion.div animate={{ x: [-20, 100] }} transition={{ repeat: Infinity, duration: 2, delay: i*0.3 }} className="absolute inset-y-0 w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                     </div>
                                     <span className="text-[10px] text-white/50 font-bold">{corridorData.sideAFacing}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traffic Flow B</h4>
                             <div className="flex flex-col gap-6">
                                {poles.filter(p => p.sideBEnabled).slice(0, 5).map((_, i) => (
                                  <div key={i} className="flex items-center gap-4">
                                     <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 text-[10px]">{i+1}</div>
                                     <div className="flex-1 h-2 bg-slate-200 rounded-full relative overflow-hidden">
                                        <motion.div animate={{ x: [100, -20] }} transition={{ repeat: Infinity, duration: 2, delay: i*0.3 }} className="absolute inset-y-0 w-8 bg-slate-400" />
                                     </div>
                                     <span className="text-[10px] text-slate-400 font-bold">{corridorData.sideBFacing}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-8 flex flex-col items-center text-center py-10">
                       <div className="w-24 h-24 bg-indigo-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 mb-4">
                          <CheckCircle2 size={48} />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Deploying {corridorData.name}</h3>
                          <p className="text-sm text-slate-500 font-medium max-w-sm">This will provision {poles.length} poles and approximately {poles.reduce((acc, p) => acc + (p.sideAEnabled ? 1 : 0) + (p.sideBEnabled ? 1 : 0), 0)} screens.</p>
                       </div>
                       
                       <div className="w-full max-w-md bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-left space-y-4 mt-4">
                          <div className="flex justify-between border-b border-slate-200 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</span>
                             <span className="text-xs font-black text-slate-900">{corridorData.city}, {corridorData.area}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poles</span>
                             <span className="text-xs font-black text-slate-900">{poles.length}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assets</span>
                             <span className="text-xs font-black text-indigo-600">{poles.reduce((acc, p) => acc + (p.sideAEnabled ? 1 : 0) + (p.sideBEnabled ? 1 : 0), 0)} Screens</span>
                          </div>
                       </div>

                       <div className="flex flex-col w-full max-w-md gap-4 mt-8">
                          <button disabled={loading} onClick={handleSave} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            {loading ? <RefreshCw size={24} className="animate-spin" /> : <Save size={20} />}
                            Finalize & Push Corridor
                          </button>
                       </div>
                    </div>
                  )}

                </motion.div>
             </AnimatePresence>
          </div>
        </div>

        <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
           <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-6 py-3 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all">
             <ChevronLeft size={18} /> Back
           </button>
           
           <div className="flex items-center gap-1.5">
              {sections.map(s => (
                <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${step === s.id ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`} />
              ))}
           </div>

           {step < 7 ? (
             <button onClick={nextStep} disabled={step === 4 && selectionIndex < poles.length} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-30">
               Next Step <ChevronRight size={18} />
             </button>
           ) : <div className="w-[180px]" />}
        </div>
      </motion.div>
    </div>
  );
};

export default AddCorridorModal;
