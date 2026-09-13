import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Plus, Layers, Trash2, 
  WifiOff, Camera, Loader2, ArrowLeft,
  MapPin, IndianRupee, Volume2, VolumeX, Bluetooth
} from 'lucide-react';
import { io } from 'socket.io-client';
import API, { getFullStreamUrl } from '../../services/api';
import HlsPlayer from '../../components/HlsPlayer';
import WebRtcPlayer from '../../components/WebRtcPlayer';
import K100cControllerModal from '../../components/admin/K100cControllerModal';

interface InventoryProps {
  screens: any[];
  fetchData: () => void;
  setIsAddScreenModalOpen: (open: boolean) => void;
  handleDeleteScreen: (ids: string | string[]) => void;
  handleUpdatePrice: (id: string, currentPrice: number) => void;
  handleOpenAddScreenForPole?: (poleData: any) => void;
}

const LiveCamPreview = ({ screen, fetchData }: { screen: any, fetchData: () => void }) => {
  const [remoteFrame, setRemoteFrame] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [cctvSessionUrl, setCctvSessionUrl] = useState<string | null>(null);

  const handleStartStream = async () => {
    setIsStartingStream(true);
    try {
      await API.post(`/screens/${screen._id}/start-stream`);
      fetchData(); 
    } catch (err) {
      console.error('Failed to start stream');
    } finally {
      setIsStartingStream(false);
    }
  };

  // Target CCTV Camera ID for Side A / ethree-65
  const targetCctvId = screen.cctvCameraId || (screen.deviceId === 'ethree-65' || (screen.side === 'A' && screen.poleId === 'ETHREE-P01') ? 'sparsh-main' : null);

  useEffect(() => {
    let isMounted = true;

    if (targetCctvId) {
      API.post(`/admin/cameras/${targetCctvId}/session`)
        .then((res) => {
          if (isMounted && res.data?.streamUrl) {
            setCctvSessionUrl(res.data.streamUrl);
          }
        })
        .catch((err) => {
          console.warn('CCTV session init warning for inventory card:', err);
        });

      const hbTimer = setInterval(() => {
        API.post(`/admin/cameras/${targetCctvId}/heartbeat`).catch(() => {});
      }, 15000);

      return () => {
        isMounted = false;
        clearInterval(hbTimer);
      };
    }
  }, [targetCctvId]);

  useEffect(() => {
    if (cctvSessionUrl) return;
    if (screen.cameraStreamUrl && !screen.cameraStreamUrl.startsWith('http') && !screen.liveStreamUrl && !isStartingStream) {
      handleStartStream();
    }
    if (screen.liveStreamUrl) return;

    let isMounted = true;
    let socket: any = null;
    const lastSeenRef = { current: Date.now() };
    const getSocketOrigin = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://www.e3di.org/_/backend/api';
      try {
        const u = new URL(apiUrl);
        return u.origin;
      } catch (e) {
        return window.location.origin;
      }
    };
    const socketBase = getSocketOrigin();

    const updateFrame = (frame: string) => {
      if (isMounted) {
        setRemoteFrame(frame);
        setIsOffline(false);
        lastSeenRef.current = Date.now();
      }
    };

    try {
      socket = io(socketBase, { transports: ['websocket', 'polling'] });
      socket.emit('join-screen', screen.deviceId);
      socket.on('remote-frame', (data: { deviceId: string, frame: string }) => {
        if (data.deviceId === screen.deviceId) updateFrame(data.frame);
      });
    } catch (err) { }

    const watchdog = setInterval(() => {
      if (isMounted && Date.now() - lastSeenRef.current > 10000) {
        setIsOffline(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
      clearInterval(watchdog);
    };
  }, [screen.deviceId, screen.liveStreamUrl, cctvSessionUrl]);

  if (cctvSessionUrl && targetCctvId) {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <WebRtcPlayer cameraId={targetCctvId} className="w-full h-full" />
      </div>
    );
  }

  if (screen.cameraStreamUrl && screen.cameraStreamUrl.startsWith('http')) {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <iframe src={screen.cameraStreamUrl} className="w-full h-full border-0 scale-[1.5] origin-center" allow="autoplay; fullscreen" title="Camera Feed" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-rose-500/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-wider">LIVE FEED</span>
        </div>
      </div>
    );
  }

  if (screen.liveStreamUrl) {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <HlsPlayer url={getFullStreamUrl(screen.liveStreamUrl)} />
      </div>
    );
  }

  if (!remoteFrame && !screen.cameraStreamUrl) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-center gap-3">
        <WifiOff size={24} className="text-slate-600" />
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Camera Link</p>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Check Device Settings</p>
        </div>
      </div>
    );
  }

  if (!remoteFrame && screen.cameraStreamUrl && !screen.liveStreamUrl) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-center gap-4">
         <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 animate-pulse">
            <Camera size={24} />
         </div>
         <button onClick={handleStartStream} disabled={isStartingStream} className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">
           {isStartingStream ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
           Initialize Live Link
         </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden flex items-center justify-center">
      {remoteFrame ? (
        <img src={remoteFrame} className={`w-full h-full object-cover grayscale brightness-125 contrast-125 transition-opacity duration-700 ${isOffline ? 'opacity-40' : 'opacity-100'}`} alt="Remote Feed" />
      ) : (
        <div className="flex flex-col items-center gap-3">
           <Loader2 size={24} className="text-indigo-500 animate-spin" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Waking Remote Feed...</span>
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-rose-500/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg">
        <div className={`w-1.5 h-1.5 bg-white rounded-full ${!isOffline ? 'animate-pulse' : 'opacity-50'}`} />
        <span className="text-[8px] font-black text-white uppercase tracking-wider">REMOTE REC</span>
      </div>
    </div>
  );
};

const Inventory: React.FC<InventoryProps> = ({ 
  screens, 
  fetchData, 
  setIsAddScreenModalOpen, 
  handleDeleteScreen, 
  handleOpenAddScreenForPole
}) => {
  const [corridors, setCorridors] = useState<any[]>([]);
  const [loadingCorridors, setLoadingCorridors] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState<any | null>(null);
  const [selectedK100cScreen, setSelectedK100cScreen] = useState<any | null>(null);

  const fetchCorridors = async () => {
    setLoadingCorridors(true);
    try {
      const res = await API.get('/corridors');
      setCorridors(res.data);
    } catch (err) {
      console.error('Failed to load corridors:', err);
    } finally {
      setLoadingCorridors(false);
    }
  };

  useEffect(() => {
    fetchCorridors();
  }, [screens]);

  const handleWipeCorridor = async (corridorName: string) => {
    if (confirm(`CRITICAL: This will PERMANENTLY DELETE ALL SCREENS and POLES in the "${corridorName}" corridor. Continue?`)) {
      if (confirm('Are you absolutely sure you want to WIPE this corridor? This action is irreversible.')) {
        try {
          await API.delete(`/screens/corridor/${encodeURIComponent(corridorName)}`);
          alert('Corridor wiped successfully.');
          setSelectedCorridor(null);
          fetchData();
          fetchCorridors();
        } catch (err) {
          alert('Failed to wipe corridor');
        }
      }
    }
  };

  // Group screens inside selected corridor by poleId
  const getCorridorPoles = () => {
    if (!selectedCorridor) return [];
    const filtered = screens.filter(s => s.corridorName === selectedCorridor.corridorName);
    const groups = filtered.reduce((acc: any, s) => {
      const pid = s.poleId || s.deviceId?.replace(/[AB]$/, '') || 'UNKN';
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(s);
      return acc;
    }, {});
    return Object.entries(groups) as [string, any[]][];
  };

  return (
    <AnimatePresence mode="wait">
      {!selectedCorridor ? (
        <motion.div 
          key="overview"
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -15 }} 
          className="space-y-10"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-6 sm:pb-8">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">LED Corridor Network</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your global screen infrastructure</p>
            </div>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <button 
                onClick={fetchCorridors}
                className="px-4 sm:px-5 py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
              >
                <RefreshCw size={14} className={loadingCorridors ? 'animate-spin' : ''} /> Refresh
              </button>
              <button 
                onClick={() => setIsAddScreenModalOpen(true)}
                className="px-5 sm:px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
              >
                <Plus size={16} /> Provision Corridor
              </button>
            </div>
          </div>

          {/* Corridor Cards Grid */}
          {loadingCorridors ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Corridors...</p>
            </div>
          ) : corridors.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-200 p-16 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Layers size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">No Corridors Provisioned</h4>
                <p className="text-sm text-slate-400 font-medium">Get started by rapid provisioning a brand new LED corridor network across the city.</p>
              </div>
              <button 
                onClick={() => setIsAddScreenModalOpen(true)}
                className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 inline-flex items-center gap-2"
              >
                <Plus size={14} /> Setup Corridor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {corridors.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-300 transition-all group flex flex-col justify-between h-[360px]"
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-wider rounded-full border border-emerald-100">
                          {c.isActive ? 'Active' : 'Offline'}
                        </span>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight pt-2 uppercase line-clamp-1">{c.corridorName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <MapPin size={10} className="text-slate-400 shrink-0" /> {c.location}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Poles</p>
                        <p className="text-lg font-black text-slate-800">{c.totalPoles}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Screens</p>
                        <p className="text-lg font-black text-slate-800">{c.totalScreens}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Corridor Price</span>
                      <span className="text-lg font-black text-indigo-600 flex items-center gap-0.5">
                        <IndianRupee size={16} />{c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6)} <span className="text-[10px] font-bold text-slate-400">/ screen / 5s</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedCorridor(c)}
                      className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 group-hover:scale-105 active:scale-95"
                    >
                      Open Corridor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          key="detail"
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -15 }} 
          className="space-y-10"
        >
          {/* Corridor Details Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCorridor(null)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase tracking-widest transition-all mb-2"
              >
                <ArrowLeft size={12} /> Back to Corridors
              </button>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{selectedCorridor.corridorName}</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                {selectedCorridor.totalPoles} poles • {selectedCorridor.totalScreens} screens • {selectedCorridor.location}
              </p>
            </div>
            
            {/* Corridor Level Actions */}
            <div className="flex gap-3">
              <button 
                onClick={fetchData}
                className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
              >
                <RefreshCw size={14} /> Refresh Poles
              </button>
              <button 
                onClick={() => handleWipeCorridor(selectedCorridor.corridorName)}
                className="px-5 py-3.5 bg-white border-2 border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-2 active:scale-95"
              >
                <Trash2 size={14} /> Wipe Corridor
              </button>
              {handleOpenAddScreenForPole && (
                <button 
                  onClick={() => handleOpenAddScreenForPole({ corridorName: selectedCorridor.corridorName, city: selectedCorridor.city, area: selectedCorridor.area })}
                  className="px-6 py-3.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} /> Provision New Pole
                </button>
              )}
            </div>
          </div>

          {/* Pricing Info bar */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/10">
                <IndianRupee size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Corridor Standard Pricing</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Central pricing applied to all screens in this corridor</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">₹{selectedCorridor.pricePer5Sec || Math.ceil((selectedCorridor.pricePer30Sec || selectedCorridor.pricePerScreen || 50) / 6)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">/ screen / 5s</span>
              </div>
              <a href="/admin/pricing" className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md">
                Configure Pricing
              </a>
            </div>
          </div>

          {/* Grid of Poles */}
          {getCorridorPoles().length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-200 p-16 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Layers size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">No Poles in Corridor</h4>
                <p className="text-sm text-slate-400 font-medium">Add physical divider poles with screens A/B into this corridor network.</p>
              </div>
              {handleOpenAddScreenForPole && (
                <button 
                  onClick={() => handleOpenAddScreenForPole({ corridorName: selectedCorridor.corridorName, city: selectedCorridor.city, area: selectedCorridor.area })}
                  className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Add First Pole
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getCorridorPoles().map(([poleId, poleScreens]) => {
                const first = poleScreens[0];
                let sideA = poleScreens.find(s => s.side === 'A' || (s.deviceId && s.deviceId.endsWith('A')));
                let sideB = poleScreens.find(s => s.side === 'B' || (s.deviceId && s.deviceId.endsWith('B')));
                
                if (!sideA && poleScreens.length > 0 && !sideB) {
                  sideA = poleScreens[0]; 
                }

                return (
                  <div key={poleId} className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col gap-6 lg:col-span-1">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-none">{poleId.startsWith('POLE') ? poleId : `Pole ${poleId}`}</h4>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{first.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(!sideA || !sideB) && handleOpenAddScreenForPole && (
                          <button onClick={() => handleOpenAddScreenForPole({ ...first, missingSide: !sideA ? 'A' : 'B' })} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title={`Add missing side`}>
                            <Plus size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteScreen(poleScreens.map(s => s._id))} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Entire Pole (A+B)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className={`grid ${sideA && sideB ? 'grid-cols-2 gap-0 relative' : 'grid-cols-1 gap-4'}`}>
                      {sideA && sideB && (
                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-100 -translate-x-1/2 z-0" />
                      )}
                      
                      {/* Side A */}
                      {sideA && (
                        <div className={`${sideA && sideB ? 'pr-4' : ''} flex flex-col gap-3 z-10 w-full`}>
                          {/* Portrait screen + Preview link side by side */}
                          <div className="flex items-start gap-3">
                            {/* Portrait LED preview */}
                            <div className="w-20 flex-shrink-0 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-lg" style={{ aspectRatio: '9/16', minHeight: '112px' }}>
                              <LiveCamPreview screen={sideA} fetchData={fetchData} />
                            </div>
                            {/* Info + Preview link on the right */}
                            <div className="flex flex-col justify-between flex-1 h-full min-h-[112px]">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black text-slate-900">{sideA.side === 'none' ? 'Screen' : 'Side A'}</span>
                                  <button 
                                    onClick={() => handleDeleteScreen(sideA._id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete Side A Only"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{sideA.name}</p>
                                {sideA.facingLocation && (
                                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mt-0.5">{sideA.facingLocation}</p>
                                )}
                                <div className="mt-1.5">
                                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                    ₹{selectedCorridor.pricePerScreen}
                                  </span>
                                </div>
                              </div>
                              <a href={`/screen/${sideA.deviceId}`} target="_blank" rel="noreferrer" className="mt-2 w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all text-center shadow-md block">
                                Preview
                              </a>
                              <button
                                onClick={async () => {
                                  const next = !sideA.soundEnabled;
                                  await API.patch(`/device/${sideA.deviceId}/audio`, { soundEnabled: next });
                                  fetchData();
                                }}
                                title={sideA.soundEnabled ? 'Mute Screen' : 'Unmute Screen'}
                                className={`mt-1.5 w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border ${
                                  sideA.soundEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {sideA.soundEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                                {sideA.soundEnabled ? 'Sound On' : 'Sound Off'}
                              </button>
                              <button
                                onClick={() => setSelectedK100cScreen(sideA)}
                                title="K100C Bluetooth Hardware Remote Controller"
                                className="mt-1.5 w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              >
                                <Bluetooth size={10} className="animate-pulse text-indigo-600" />
                                K100C Control
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Side B */}
                      {sideB && (
                        <div className={`${sideA && sideB ? 'pl-4' : ''} flex flex-col gap-3 z-10 w-full`}>
                          {/* Portrait screen + Preview link side by side */}
                          <div className="flex items-start gap-3">
                            {/* Portrait LED preview */}
                            <div className="w-20 flex-shrink-0 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-lg" style={{ aspectRatio: '9/16', minHeight: '112px' }}>
                              <LiveCamPreview screen={sideB} fetchData={fetchData} />
                            </div>
                            {/* Info + Preview link on the right */}
                            <div className="flex flex-col justify-between flex-1 h-full min-h-[112px]">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black text-slate-900">Side B</span>
                                  <button 
                                    onClick={() => handleDeleteScreen(sideB._id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete Side B Only"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{sideB.name}</p>
                                {sideB.facingLocation && (
                                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mt-0.5">{sideB.facingLocation}</p>
                                )}
                                <div className="mt-1.5">
                                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                    ₹{selectedCorridor.pricePerScreen}
                                  </span>
                                </div>
                              </div>
                              <a href={`/screen/${sideB.deviceId}`} target="_blank" rel="noreferrer" className="mt-2 w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all text-center shadow-md block">
                                Preview
                              </a>
                              <button
                                onClick={async () => {
                                  const next = !sideB.soundEnabled;
                                  await API.patch(`/device/${sideB.deviceId}/audio`, { soundEnabled: next });
                                  fetchData();
                                }}
                                title={sideB.soundEnabled ? 'Mute Screen' : 'Unmute Screen'}
                                className={`mt-1.5 w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border ${
                                  sideB.soundEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {sideB.soundEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                                {sideB.soundEnabled ? 'Sound On' : 'Sound Off'}
                              </button>
                              <button
                                onClick={() => setSelectedK100cScreen(sideB)}
                                title="K100C Bluetooth Hardware Remote Controller"
                                className="mt-1.5 w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              >
                                <Bluetooth size={10} className="animate-pulse text-indigo-600" />
                                K100C Control
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* K100C Bluetooth Controller Modal */}
          {selectedK100cScreen && (
            <K100cControllerModal
              isOpen={!!selectedK100cScreen}
              onClose={() => setSelectedK100cScreen(null)}
              screen={selectedK100cScreen}
              onSuccess={fetchData}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Inventory;
