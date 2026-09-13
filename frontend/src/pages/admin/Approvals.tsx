import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Zap, SlidersHorizontal, 
  Image as ImageIcon, Video, ExternalLink, 
  Trash2, Check, ArrowRight, ShieldCheck, 
  CheckCircle, AlertCircle, RefreshCw, X
} from 'lucide-react';
import API from '../../services/api';



interface ApprovalsProps {
  type: 'pending' | 'approved' | 'rejected' | 'upcoming' | 'active' | 'completed' | 'revoked';
  getMediaUrl: (path: string) => string;
  onActionSuccess: () => void;
}

// Intelligent Pole ID Parser
const getPoleId = (s: any) => {
  if (!s) return 'UNK';
  if (s.poleId && s.poleId !== '') return s.poleId.replace('POLE-', '');
  const nameMatch = s.name?.match(/pole\s*(\d+)/i);
  if (nameMatch) return nameMatch[1];
  const devMatch = s.deviceId?.match(/SCR-(\d+)/i);
  if (devMatch) return devMatch[1];
  return 'UNK';
};

// Intelligent Side Parser
const getSide = (s: any) => {
  if (!s) return 'A';
  if (s.side && s.side !== 'none') return s.side;
  if (s.deviceId && s.deviceId.endsWith('A')) return 'A';
  if (s.deviceId && s.deviceId.endsWith('B')) return 'B';
  return 'A';
};

// Retrieve visual label and color coding for booking modes
const getBookingMode = (screens: any[]) => {
  if (screens.length === 1) return { label: 'SINGLE SCREEN', icon: MapPin, color: 'bg-blue-600' };
  const poleIds = Array.from(new Set(screens.map(s => getPoleId(s))));
  if (poleIds.length === 1 && screens.length === 2) {
     return { label: 'SINGLE POLE', icon: Zap, color: 'bg-amber-500' };
  }
  const sides = Array.from(new Set(screens.map(s => getSide(s))));
  if (screens.length >= 10 && (sides.length === 1 || screens.length >= 18)) {
     return { label: 'FULL CORRIDOR', icon: ShieldCheck, color: 'bg-emerald-600' };
  }
  return { label: 'MULTI POLE', icon: SlidersHorizontal, color: 'bg-indigo-600' };
};

const formatTimeAMPM = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getNumericPoleNumber = (poleStr: string): number => {
  if (!poleStr) return 0;
  const match = poleStr.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
};

// corridorState: { [screenId]: { state: 'pending'|'booked', poleId, side, deviceId } }
// currentScreenIds: Set of screen IDs in the card being rendered (shown as PINK)
const MiniRouteMap = ({
  selectedScreens,
  corridorState,
  currentScreenIds
}: {
  selectedScreens: any[];
  corridorState: Record<string, any>;
  currentScreenIds: Set<string>;
}) => {
  const poles = Array.from({ length: 10 }, (_, i) => i + 1);

  // Build lookup: "poleNumber-side" -> state from corridorState
  const poleStateMap: Record<string, string> = {};
  Object.entries(corridorState).forEach(([sid, info]) => {
    const poleNum = getNumericPoleNumber(info.poleId || '');
    if (poleNum > 0) {
      const key = `${poleNum}-${info.side}`;
      // pending from current card = 'current', pending from others = 'pending', booked = 'booked'
      const isCurrent = currentScreenIds.has(sid);
      const resolved = isCurrent ? 'current' : info.state;
      const existing = poleStateMap[key];
      // Priority: booked > current > pending
      const priority: Record<string, number> = { booked: 3, current: 2, pending: 1 };
      if (!existing || (priority[resolved] || 0) > (priority[existing] || 0)) {
        poleStateMap[key] = resolved;
      }
    }
  });

  // Also mark screens in selectedScreens that may not be in corridorState yet
  if (selectedScreens && selectedScreens.length > 0) {
    selectedScreens.forEach(s => {
      if (!s) return;
      const poleNum = getNumericPoleNumber(s.poleId || s.name || '');
      const side = getSide(s);
      if (poleNum > 0) {
        const key = `${poleNum}-${side}`;
        if (!poleStateMap[key]) poleStateMap[key] = 'current';
      }
    });
  }

  const getBlockStyles = (p: number, side: 'A' | 'B') => {
    const key = `${p}-${side}`;
    const state = poleStateMap[key];

    if (state === 'current') {
      return 'bg-fuchsia-600 border-fuchsia-400 text-white animate-pulse shadow-[0_0_10px_rgba(240,70,250,0.6)] font-black';
    }
    if (state === 'booked') {
      return 'bg-red-600 border-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.4)] font-black';
    }
    if (state === 'pending') {
      return 'bg-amber-500 border-amber-400 text-white shadow-[0_0_6px_rgba(245,158,11,0.4)] font-black';
    }
    return 'bg-slate-900 border-slate-800 text-slate-600 font-bold';
  };

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 py-3 px-4 sm:py-4 sm:px-6 bg-slate-950 rounded-2xl sm:rounded-[24px] border border-slate-800 shadow-2xl shrink-0 w-full sm:w-[440px] max-w-full overflow-hidden select-none">
       <div className="flex items-center justify-between text-[9px] font-black text-slate-500 tracking-wider">
          <span>AMBEDKAR STATUE</span>
          <span className="text-indigo-400 tracking-[0.15em] flex items-center gap-1">CORRIDOR STATUS VISUALIZATION <Zap size={10} className="fill-indigo-400/20" /></span>
          <span>EAT STREET</span>
       </div>
       
       <div className="flex items-center justify-between gap-2 mt-1 sm:mt-2">
          {/* Row A Labels */}
          <div className="flex flex-col gap-1.5 justify-center shrink-0 w-6 sm:w-8 text-[8px] sm:text-[9px] font-black text-slate-500 leading-none">
             <span>ROW</span>
             <span>A</span>
          </div>

          {/* Grid Blocks */}
          <div className="flex-1 flex justify-between gap-1 sm:gap-1.5">
             {poles.map(p => {
                const styles = getBlockStyles(p, 'A');
                return (
                  <div key={`A-${p}`} className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border text-[9px] sm:text-[10px] flex items-center justify-center transition-all duration-300 ${styles}`} title={`Pole ${p} - Side A`}>
                     A
                  </div>
                );
             })}
          </div>
       </div>

       <div className="flex items-center justify-between gap-2 mt-1">
          {/* Row B Labels */}
          <div className="flex flex-col gap-1.5 justify-center shrink-0 w-6 sm:w-8 text-[8px] sm:text-[9px] font-black text-slate-500 leading-none">
             <span>ROW</span>
             <span>B</span>
          </div>

          {/* Grid Blocks */}
          <div className="flex-1 flex justify-between gap-1 sm:gap-1.5">
             {poles.map(p => {
                const styles = getBlockStyles(p, 'B');
                return (
                  <div key={`B-${p}`} className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border text-[9px] sm:text-[10px] flex items-center justify-center transition-all duration-300 ${styles}`} title={`Pole ${p} - Side B`}>
                     B
                  </div>
                );
             })}
          </div>
       </div>

       {/* Pole Numbers */}
       <div className="flex items-center justify-between gap-2">
          <div className="w-6 sm:w-8 shrink-0" />
          <div className="flex-1 flex justify-between gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-bold text-slate-600 text-center">
             {poles.map(p => (
                <div key={`num-${p}`} className="w-5 sm:w-7">P{p}</div>
             ))}
          </div>
       </div>

       <div className="w-full h-px bg-slate-800/80 my-1" />

       {/* Legend */}
       <div className="flex flex-wrap items-center justify-between gap-y-2 text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-slate-900 border border-slate-800" />
                <span>Available</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-red-600" />
                <span>Booked</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-fuchsia-600 animate-pulse" />
                <span>This Request</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-500" />
                <span>Other Pending</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span>Row A → Outbound</span>
             <span>Row B ← Inbound</span>
          </div>
       </div>
    </div>
  );
};

const ScreenSummary = ({ screens }: { screens: any[] }) => {
  const poleGroups: any = {};
  screens.forEach(s => {
     const pId = getPoleId(s);
     if (!poleGroups[pId]) poleGroups[pId] = [];
     poleGroups[pId].push(getSide(s));
  });

  const mode = getBookingMode(screens);

  if (mode.label === 'FULL CORRIDOR') {
     const sides = Array.from(new Set(screens.map(s => getSide(s))));
     return (
        <div className="space-y-1">
           <p className="text-xs font-black text-slate-900">ALL SIDE {sides.join(' + ')} SCREENS</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{Object.keys(poleGroups).length} Poles • {screens.length} Screens</p>
        </div>
     );
  }

  return (
     <div className="flex flex-wrap gap-2 max-w-full">
        {Object.entries(poleGroups).map(([pid, sides]: [string, any]) => (
           <div key={pid} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl max-w-full min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-[150px] sm:max-w-none">
                 Pole {pid}
              </span>
              <span className="w-px h-3 bg-slate-300 shrink-0" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">
                 {sides.sort().join(' + ')}
              </span>
           </div>
        ))}
     </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate, targetTime, label }: { targetDate: string, targetTime: string, label: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istNow = new Date(utc + (3600000 * 5.5));
      
      const targetStr = `${targetDate}T${targetTime}`;
      const target = new Date(targetStr);
      
      const diffMs = target.getTime() - istNow.getTime();
      if (diffMs <= 0) {
        setTimeLeft('Completed');
        return;
      }
      
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      if (diffHrs > 0) {
        setTimeLeft(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
      } else if (diffMins > 0) {
        setTimeLeft(`${diffMins}m ${diffSecs}s`);
      } else {
        setTimeLeft(`${diffSecs}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <span className="text-sm font-black text-indigo-600 animate-pulse">{timeLeft}</span>
    </div>
  );
};

const RequestCard = ({ 
  group, 
  type, 
  getMediaUrl, 
  handleApprove, 
  handleRejectClick, 
  handleRevokeClick, 
  corridorState 
}: { 
  group: any, 
  type: string, 
  getMediaUrl: any, 
  handleApprove: any, 
  handleRejectClick: any, 
  handleRevokeClick: any, 
  corridorState: Record<string, any> 
}) => {
  const currentScreenIds = new Set<string>(
    (group.screens || []).map((s: any) => s?._id?.toString?.() || s?._id || '').filter(Boolean)
  );
  const dates = group.dates?.length ? group.dates : [group.date];
  const dateDisplay = dates.length > 1
    ? `${dates[0]} to ${dates[dates.length - 1]}`
    : group.date;
  const mode = getBookingMode(group.screens);
  const isVideo = group.videoId?.url?.match(/\.(mp4|webm|mov)$/i);
  const sideA = group.screens.some((s: any) => getSide(s) === 'A');
  const sideB = group.screens.some((s: any) => getSide(s) === 'B');
  
  let directionLabel = 'Both Directions';
  let directionArrows = <><ArrowRight size={14} /><ArrowRight size={14} className="rotate-180" /></>;
  
  if (sideA && !sideB) {
     directionLabel = 'Ambedkar Statue → Eat Street';
     directionArrows = <ArrowRight size={14} />;
  }
  if (!sideA && sideB) {
     directionLabel = 'Eat Street → Ambedkar Statue';
     directionArrows = <ArrowRight size={14} className="rotate-180" />;
  }

  const durationSeconds = group.durationSeconds || (group.duration ? group.duration * 60 : 5);
  const slotMultiplier = group.slotMultiplier || Math.ceil(durationSeconds / 5);
  const storedPricePer5Sec = group.pricePer5Sec || Math.ceil((group.pricePer30Sec || group.pricePerScreen || 50) / 6);

  const totalCost = group.isFreeTrialBooking
    ? 0
    : (group.totalAmount ??
       (group.selectedScreenCount && storedPricePer5Sec
         ? group.selectedScreenCount * storedPricePer5Sec * slotMultiplier
         : group.screens.reduce((acc: number, s: any) => acc + Math.ceil((s?.price || 50) / 6), 0) * slotMultiplier));
  const storedScreenCount = group.selectedScreenCount ?? group.screens?.length ?? 0;

  const isTakeover = group.isInstant || group.duration >= 1200 || group.dates?.length >= 7;
  let baseRateLabel = '₹3,571 / screen / day';
  if (group.dates?.length >= 30) {
    baseRateLabel = '₹79,999 / month package';
  } else if (group.dates?.length >= 7) {
    baseRateLabel = '₹24,999 / week package';
  }

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-6 mb-6 overflow-hidden">
       {/* HEADER */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-6">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign</p>
                <p className="text-sm font-black text-slate-900">{group.videoId?.title || 'Untitled Creative'}</p>
             </div>
             <div className="w-px h-6 bg-slate-200 hidden sm:block" />
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested By</p>
                <p className="text-[13px] font-bold text-slate-700">
                  {group.bookedByName || group.userId?.name || 'N/A'}
                </p>
                {(group.bookedByPhone || group.userId?.phone) && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    +91 {(group.bookedByPhone || group.userId?.phone || '').replace(/\D/g, '').slice(-10)}
                  </p>
                )}
                {(group.bookedByEmail || group.userId?.email) && (
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                    {group.bookedByEmail || group.userId?.email}
                  </p>
                )}
             </div>
             <div className="w-px h-6 bg-slate-200 hidden sm:block" />
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested At</p>
                <p className="text-[13px] font-bold text-slate-700">{new Date(group.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <span className={`px-2.5 py-1 ${mode.color} text-white rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                <mode.icon size={12} /> {mode.label}
             </span>
             <span className={`px-2.5 py-1 ${group.isInstant ? 'bg-indigo-600' : 'bg-slate-900'} text-white rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                {group.isInstant ? <Zap size={12} className="fill-white" /> : <Clock size={12} />} {group.isInstant ? 'INSTANT' : 'SCHEDULED'}
             </span>
             {/* Watermark Badge */}
             <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
               group.hasWatermark
                 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                 : 'bg-amber-50 text-amber-700 border-amber-200'
             }`}>
               {group.hasWatermark ? '✦ E3Di Watermark' : '⊘ No Watermark (+25%)'}
             </span>
             {group.isFreeTrialBooking && (
                <span className="px-2.5 py-1 bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-amber-600">
                   🎁 WELCOME TRIAL
                </span>
             )}
             <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
                {type}
             </span>
          </div>
       </div>

       {/* MAIN BODY */}
       <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-5">
             <div className="relative aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 w-full max-w-[220px] mx-auto">
                {group.videoId?.url ? (
                  isVideo ? 
                  <video src={getMediaUrl(group.videoId.url)} className="w-full h-full object-contain" autoPlay muted loop /> :
                  <img src={getMediaUrl(group.videoId.url)} className="w-full h-full object-contain" alt="preview" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-100">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                   <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1 border border-white/10">
                      {isVideo ? <Video size={9} /> : <ImageIcon size={9} />}
                      {isVideo ? 'VIDEO' : 'IMAGE'}
                   </span>
                </div>
                {/* E3Di Watermark Overlay on preview */}
                {group.hasWatermark && (
                  <>
                    <div className="absolute top-2 right-2 px-3 py-1.5 bg-[#0A0D2A]/95 rounded-lg border border-[#6C47FF]/80 shadow-xl z-20 pointer-events-none select-none">
                      <span className="text-base font-black tracking-wide text-white leading-none">
                        E3<span className="text-yellow-400">Di</span>
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 py-2.5 bg-[#FFD600] flex items-center justify-center z-20 pointer-events-none select-none border-t-2 border-yellow-600/50">
                      <span className="text-sm font-black tracking-widest text-black lowercase">www.e3di.org</span>
                    </div>
                  </>
                )}
                {!group.hasWatermark && (
                  <div className="absolute bottom-0 left-0 right-0 py-2 bg-amber-500/90 flex items-center justify-center z-20 pointer-events-none select-none">
                    <span className="text-xs font-black tracking-widest text-white uppercase">No Watermark (+25%)</span>
                  </div>
                )}
                <a href={group.videoId?.url ? getMediaUrl(group.videoId.url) : '#'} target="_blank" rel="noreferrer" className="absolute top-2 right-10 p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl text-white transition-all z-30">
                  <ExternalLink size={12} />
                </a>
             </div>

             {/* Billing / Info Summary */}
             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                      <p className="font-semibold text-slate-800">{durationSeconds} sec</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Screens</p>
                      <p className="font-semibold text-slate-800">{storedScreenCount}</p>
                   </div>
                   <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direction</p>
                      <p className="font-semibold text-slate-800 truncate">{directionLabel}</p>
                   </div>
                   <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                      {isTakeover ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Type</p>
                            <p className="font-semibold text-indigo-650 text-[11px] uppercase tracking-wider">Flat Rate Takeover</p>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate</p>
                            <p className="font-semibold text-slate-800">{baseRateLabel}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slot Billing</p>
                            <p className="font-semibold text-slate-800">{slotMultiplier} × 5 sec</p>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                            <p className="font-semibold text-slate-800">₹{storedPricePer5Sec.toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between mt-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Watermark</p>
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                           group.hasWatermark
                             ? 'bg-emerald-50 text-emerald-700'
                             : 'bg-amber-50 text-amber-700'
                         }`}>
                           {group.hasWatermark ? 'E3Di (Standard)' : 'None (+25%)'}
                         </span>
                      </div>
                   </div>
                </div>
                <div className="mt-1 pt-3 border-t border-slate-200 flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                   <p className="text-[15px] font-black text-indigo-600">
                      ₹{totalCost.toLocaleString()}
                      {group.isFreeTrialBooking && (
                        <span className="text-[10px] text-amber-600 font-extrabold uppercase ml-2 tracking-wider">
                          (Trial Applied)
                        </span>
                      )}
                    </p>
                </div>
             </div>

             {/* Actions */}
             <div className="flex items-center gap-3 mt-auto">
                {type === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleRejectClick(group.id)}
                      className="flex-1 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Trash2 size={14} /> Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(group.id)}
                      className="flex-1 py-3 border-2 border-indigo-600 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Check size={16} /> Approve
                    </button>
                  </>
                )}
                {(type === 'active' || type === 'upcoming' || type === 'approved') && (
                  <button 
                    onClick={() => handleRevokeClick(group.id)}
                    className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Trash2 size={14} /> Revoke Broadcast
                  </button>
                )}
             </div>
          </div>

          {/* RIGHT COLUMN (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
             
             {/* Card 1 - Screen Details */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Screen Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-[13px]">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corridor</p>
                      <p className="font-semibold text-slate-800 truncate">{group.corridorName || 'Vijayawada MG Road'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Playback</p>
                      <p className="font-semibold text-slate-800 truncate">{group.isInstant ? 'Instant Broadcast' : 'Scheduled'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="font-semibold text-[#6C47FF] truncate">{dateDisplay}</p>
                   </div>
                   {/* Timings */}
                   <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                      <p className="font-semibold text-slate-800">
                         {group.isInstant && type === 'pending' ? 'Pending Approval' : `${formatTimeAMPM(group.startTime)} - ${formatTimeAMPM(group.endTime)}`}
                      </p>
                   </div>
                   <div className="col-span-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Direction</p>
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                         <div className="text-slate-400">{directionArrows}</div>
                         <span>{directionLabel}</span>
                      </div>
                   </div>
                   <div className="col-span-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Poles</p>
                      <ScreenSummary screens={group.screens} />
                   </div>
                </div>

                {/* Additional Status Context if needed */}
                {(type === 'active' || type === 'upcoming' || type === 'completed' || type === 'rejected' || type === 'revoked' || type === 'approved') && (
                   <div className="mt-2 pt-4 border-t border-slate-200">
                      {type === 'active' && (
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                               <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Playing
                            </p>
                            <CountdownTimer targetDate={dates[dates.length - 1]} targetTime={group.endTime} label="Remaining Time" />
                         </div>
                      )}
                      {type === 'upcoming' && (
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Start</p>
                               <span className="text-xs font-black text-indigo-600">{dateDisplay} @ {formatTimeAMPM(group.startTime)}</span>
                            </div>
                            <CountdownTimer targetDate={dates[0]} targetTime={group.startTime} label="Time Till Start" />
                         </div>
                      )}
                      {type === 'completed' && (
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Playback Completed</p>
                               <span className="text-xs font-bold text-slate-600 block">
                                  {group.completedAt ? new Date(group.completedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'End Time Passed'}
                               </span>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Runtime</p>
                               <span className="text-xs font-black text-indigo-600 block uppercase">
                                  {group.durationSeconds || (group.duration ? group.duration * 60 : 30)} SEC Complete
                               </span>
                            </div>
                         </div>
                      )}
                      {type === 'rejected' && (
                         <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Rejection Reason</p>
                            <span className="text-xs font-bold text-rose-600 block bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 italic mt-1">
                               "{group.rejectionReason || 'No reason provided.'}"
                            </span>
                         </div>
                      )}
                      {type === 'revoked' && (
                         <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Revocation Reason</p>
                            <span className="text-xs font-bold text-rose-600 block bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 italic mt-1">
                               "{group.revokedReason || 'No reason provided.'}"
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Revoked By: <span className="text-slate-800">{group.revokedBy || 'System Admin'}</span></p>
                         </div>
                      )}
                      {type === 'approved' && (
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved At</p>
                               <span className="text-[13px] font-black text-slate-900 block">
                                  {group.approvedAt ? new Date(group.approvedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'N/A'}
                               </span>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                               <span className="text-[13px] font-black uppercase text-indigo-600 block">
                                  {group.status}
                               </span>
                            </div>
                         </div>
                      )}
                   </div>
                )}
             </div>

             {/* Card 2 - Corridor Status Visualization */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corridor Status</p>
                <div className="flex justify-start sm:justify-center transform scale-75 sm:scale-[0.8] origin-top-left sm:origin-top w-full -mt-2 -mb-8">
                   <MiniRouteMap
                     selectedScreens={group.screens}
                     corridorState={corridorState}
                     currentScreenIds={currentScreenIds}
                   />
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};

const Approvals: React.FC<ApprovalsProps> = ({ 
  type,
  getMediaUrl,
  onActionSuccess
}) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [corridorState, setCorridorState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Group schedules back to high-level unified campaigns
  const groupSchedules = (schedules: any[]) => {
    const groups: any = {};
    schedules.forEach(s => {
      const cDate = new Date(s.createdAt);
      const timeKey = `${cDate.getFullYear()}-${cDate.getMonth()}-${cDate.getDate()}-${cDate.getHours()}-${cDate.getMinutes()}`;
      const key = s.bookingGroupId
        ? `bg-${s.bookingGroupId}`
        : `${s.videoId?._id || s.videoId}-${s.date}-${s.startTime}-${s.endTime}-${timeKey}-${s.isInstant ? 'inst' : 'sched'}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          userId: s.userId,
          bookedByName: s.bookedByName,
          bookedByPhone: s.bookedByPhone,
          bookedByEmail: s.bookedByEmail,
          videoId: s.videoId,
          date: s.date,
          dates: [],
          startTime: s.startTime,
          endTime: s.endTime,
          isInstant: s.isInstant === true || s.isInstant === 'true',
          duration: s.duration || 60,
          durationSeconds: s.durationSeconds || (s.duration ? s.duration * 60 : 30),
          createdAt: s.createdAt,
          screens: [],
          status: s.status,
          approvedAt: s.approvedAt,
          rejectedAt: s.rejectedAt,
          revokedAt: s.revokedAt,
          completedAt: s.completedAt,
          rejectionReason: s.rejectionReason,
          revokedReason: s.revokedReason,
          revokedBy: s.revokedBy,
          totalAmount: s.totalAmount,
          pricePerScreen: s.pricePerScreen,
          selectedScreenCount: s.selectedScreenCount,
          pricingBreakdown: s.pricingBreakdown,
          corridorName: s.corridorName,
          hasWatermark: s.hasWatermark !== false,
          isFreeTrialBooking: s.isFreeTrialBooking,
          ids: [] 
        };
      }
      
      const screenAlreadyAdded = groups[key].screens.some(
        (existingScreen: any) => (existingScreen?._id?.toString() || existingScreen?._id) === (s.screenId?._id?.toString() || s.screenId?._id)
      );
      if (!screenAlreadyAdded) {
        groups[key].screens.push(s.screenId);
      }

      if (!groups[key].dates.includes(s.date)) {
        groups[key].dates.push(s.date);
      }

      groups[key].ids.push(s._id);
    });

    Object.values(groups).forEach((group: any) => {
      group.dates.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  };

  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      // Fetch specific lifecycle category
      const res = await API.get(`/admin/campaigns/${type}`);
      
      // Fetch live corridor state: { [screenId]: { state, poleId, side, ... } }
      const corridorRes = await API.get('/admin/campaigns/corridor-state').catch(() => ({ data: {} }));
      
      setCampaigns(groupSchedules(res.data));
      setCorridorState(corridorRes.data);
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.msg || 'Failed to fetch campaigns.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(() => {
      fetchCampaigns(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [type]);

  const handleApprove = async (groupKey: string) => {
    const selectedGroup = campaigns.find(c => c.id === groupKey);
    if (!selectedGroup) return;

    // Optimistic UI Update
    setCampaigns(prev => prev.filter(c => c.id !== groupKey));
    onActionSuccess();

    try {
      // Approve all screens of this grouped campaign silently
      await Promise.all(selectedGroup.ids.map((id: string) => 
        API.patch(`/admin/campaigns/${id}/approve`)
      ));
      fetchCampaigns(true);
    } catch (err: any) {
      alert(`Approval Failed: ${err.response?.data?.msg || 'Error'}`);
      setCampaigns(prev => [selectedGroup, ...prev]); // Rollback
      fetchCampaigns(true);
    }
  };

  const handleRejectConfirm = async () => {
    if (!showRejectDialog) return;
    const groupKey = showRejectDialog;
    const selectedGroup = campaigns.find(c => c.id === groupKey);
    if (!selectedGroup) return;

    setShowRejectDialog(null);
    setReason('');
    
    // Optimistic UI Update
    setCampaigns(prev => prev.filter(c => c.id !== groupKey));
    onActionSuccess();

    try {
      await Promise.all(selectedGroup.ids.map((id: string) => 
        API.patch(`/admin/campaigns/${id}/reject`, { reason })
      ));
      fetchCampaigns(true);
    } catch (err: any) {
      alert(`Rejection Failed: ${err.response?.data?.msg || 'Error'}`);
      setCampaigns(prev => [selectedGroup, ...prev]); // Rollback
      fetchCampaigns(true);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!showRevokeDialog) return;
    const groupKey = showRevokeDialog;
    const selectedGroup = campaigns.find(c => c.id === groupKey);
    if (!selectedGroup) return;

    setShowRevokeDialog(null);
    setReason('');

    // Optimistic UI Update
    setCampaigns(prev => prev.filter(c => c.id !== groupKey));
    onActionSuccess();

    try {
      await Promise.all(selectedGroup.ids.map((id: string) => 
        API.patch(`/admin/campaigns/${id}/revoke`, { reason })
      ));
      fetchCampaigns(true);
    } catch (err: any) {
      alert(`Revocation Failed: ${err.response?.data?.msg || 'Error'}`);
      setCampaigns(prev => [selectedGroup, ...prev]); // Rollback
      fetchCampaigns(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
      {/* Category Container */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <Clock size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">{type} Campaigns</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{campaigns.length} Campaigns Found</p>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-4">
             <RefreshCw size={40} className="text-indigo-600 animate-spin" />
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Campaigns...</p>
          </div>
        ) : error ? (
          <div className="p-32 flex flex-col items-center justify-center text-center gap-4">
             <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <AlertCircle size={32} />
             </div>
             <p className="text-lg font-black text-slate-900">Fetch Failed</p>
             <p className="text-sm text-slate-400 font-bold max-w-md">{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">Section is Clear</p>
            <p className="text-sm text-slate-400 font-bold uppercase mt-2">No campaigns found in this status category</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((group: any) => (
              <RequestCard 
                key={group.id} 
                group={group} 
                type={type} 
                getMediaUrl={getMediaUrl} 
                handleApprove={handleApprove} 
                handleRejectClick={setShowRejectDialog} 
                handleRevokeClick={setShowRevokeDialog} 
                corridorState={corridorState} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Dialog Modal */}
      <AnimatePresence>
        {showRejectDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectDialog(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-black text-slate-900">Campaign Rejection</h3>
                   <button onClick={() => setShowRejectDialog(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={18} /></button>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">Provide a reason for rejecting this campaign request (optional):</p>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="Creative contains invalid sizes, mismatch formatting, or scheduling conflict..." 
                  className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 outline-none text-sm placeholder:text-slate-400 font-medium resize-none focus:border-indigo-600 focus:bg-white transition-all"
                />
                <div className="flex gap-4 mt-6">
                   <button onClick={() => { setShowRejectDialog(null); setReason(''); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                   <button onClick={handleRejectConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/25 transition-all">Reject Campaign</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Reason Dialog Modal */}
      <AnimatePresence>
        {showRevokeDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRevokeDialog(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-black text-slate-900">Revoke Campaign</h3>
                   <button onClick={() => setShowRevokeDialog(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={18} /></button>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">Provide a reason for revoking this active/upcoming broadcast:</p>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="Government scheduling overwrite, payment revocation, hardware failure..." 
                  className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 outline-none text-sm placeholder:text-slate-400 font-medium resize-none focus:border-indigo-600 focus:bg-white transition-all"
                />
                <div className="flex gap-4 mt-6">
                   <button onClick={() => { setShowRevokeDialog(null); setReason(''); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                   <button onClick={handleRevokeConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/25 transition-all">Confirm Revocation</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Approvals;
