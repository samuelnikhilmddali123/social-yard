const fs = require('fs');
const lines = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8').split('\n');

function replaceBlock(startMarker, endMarker, replacement) {
  const startIndex = lines.findIndex(l => l.includes(startMarker));
  const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes(endMarker));
  if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex + 1, replacement);
    console.log(`Replaced block from ${startMarker} to ${endMarker}`);
  } else {
    console.log(`Failed to find block from ${startMarker} to ${endMarker}`);
  }
}

// 1. Replace Step Tracker
replaceBlock('{/* Step Progress Tracker */}', '</div>', ''); // First div close
replaceBlock('<div className="hidden lg:flex', '</div>', ''); // Second part of tracker
replaceBlock('{/* Main Split Layout */}', '{/* Main Split Layout */}', ''); // Clean up empty space if needed. Actually it's better to just leave it.

// Wait, the tracker ends before {/* Main Split Layout */}
const mainSplitIdx = lines.findIndex(l => l.includes('{/* Main Split Layout */}'));
const trackerStartIdx = lines.findIndex(l => l.includes('{/* Step Progress Tracker */}'));
if (trackerStartIdx !== -1 && mainSplitIdx !== -1) {
  lines.splice(trackerStartIdx, mainSplitIdx - trackerStartIdx);
}

// Remove AnimatePresence
const animateStart = lines.findIndex(l => l.includes('<AnimatePresence mode="wait">'));
if(animateStart !== -1) lines.splice(animateStart, 1);
const animateEnd = lines.findIndex(l => l.includes('</AnimatePresence>'));
if(animateEnd !== -1) lines.splice(animateEnd, 1);

// Remove the fixed height from the left column container
const leftColIdx = lines.findIndex(l => l.includes('lg:h-[calc(100vh-160px)] lg:min-h-[680px]'));
if (leftColIdx !== -1) {
  lines[leftColIdx] = lines[leftColIdx].replace('lg:h-[calc(100vh-160px)] lg:min-h-[680px] flex flex-col justify-between', 'space-y-8');
}

// Replace Step 1 with Format Selector
replaceBlock(
  '{/* STEP 1: SELECT ROUTE & TRAFFIC DIRECTION */}',
  '{/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}',
  `{/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">Select Display Size Format</h2>
                  <p className="text-xs text-slate-400 font-medium">Choose between the active display formats installed for this trial run.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('65-inch');
                      localStorage.setItem('campaign_selectedFormat', '65-inch');
                    }}
                    className={\`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group \${selectedFormat === '65-inch' ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}\`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-850">65" Commercial Display</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('75-inch');
                      localStorage.setItem('campaign_selectedFormat', '75-inch');
                    }}
                    className={\`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group \${selectedFormat === '75-inch' ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}\`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-850">75" Grand Billboard</span>
                    </div>
                  </button>
                </div>
              </div>
              {/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}`
);

// Replace Step 2 with commented out text
replaceBlock(
  '{/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}',
  '{/* STEP 3: SCHEDULE & TIME SELECTION */}',
  `{/* ROUTE MAP AND COVERAGE REMOVED FOR TRIAL RUN */}
              {/* STEP 3: SCHEDULE & TIME SELECTION */}`
);

// Simplify Step 3 (Schedule) wrappers
const step3Start = lines.findIndex(l => l.includes('{/* STEP 3: SCHEDULE & TIME SELECTION */}'));
if (step3Start !== -1) {
  lines[step3Start + 1] = '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-5">';
  // Remove buttons
  replaceBlock('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">', '</motion.div>', '</div>');
  
  // Highlight Instant Play
  replaceBlock('{/* Slot Mode Toggle */}', '{/* Quick Date Presets */}', `
                    <div 
                      onClick={() => {
                        const newIsInstant = !isInstant;
                        setIsInstant(newIsInstant);
                        localStorage.setItem('campaign_isInstant', String(newIsInstant));
                        if (newIsInstant) {
                          const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
                          setStartDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                          setStartTime(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
                          setCampaignDuration(10);
                          setBookingDuration('day');
                        }
                      }}
                      className={\`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none mb-6 \${isInstant ? 'border-amber-400 bg-amber-50/15 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/10' : 'border-slate-200 bg-slate-50/50 hover:border-slate-350'}\`}
                    >
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse">⚡ RECOMMENDED PRESET</span>
                            <h3 className="text-sm font-black text-slate-850">Instant Play Loop Sync</h3>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Lock active playback immediately. Creative gets synced to the two installed E3Di trial monitors within 60 seconds.
                          </p>
                        </div>
                        <div className="pt-1.5">
                          <input type="checkbox" checked={isInstant} readOnly className="w-5 h-5 accent-amber-500 cursor-pointer rounded" />
                        </div>
                      </div>
                    </div>
                    {!isInstant && (
                      <div className="space-y-4">
                        {/* Quick Date Presets */}`);
}

// Simplify Step 4 (Upload) wrappers
const step4Start = lines.findIndex(l => l.includes('{/* STEP 4: UPLOAD CREATIVE */}'));
if (step4Start !== -1) {
  lines[step4Start + 1] = '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-5">';
  // Since we replaced the bottom of step 3, we need to find the bottom of step 4 which ends before step 5
  // But wait, replaceBlock replaces the FIRST occurrence. So we can just call it again.
  replaceBlock('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">', '</motion.div>', '</div>');
}

// Simplify Step 5 (Review & Pay) wrappers
const step5Start = lines.findIndex(l => l.includes('{/* STEP 5: REVIEW & PAY */}'));
if (step5Start !== -1) {
  lines[step5Start + 1] = '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-5">';
  replaceBlock('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">', '</motion.div>', '</div>');
}

// Inject selectedFormat state if missing
const stateIdx = lines.findIndex(l => l.includes('const [hasWatermark, setHasWatermark]'));
if (stateIdx !== -1) {
  lines.splice(stateIdx, 0, `  const [selectedFormat, setSelectedFormat] = useState<'65-inch' | '75-inch'>(() => {
    return (localStorage.getItem('campaign_selectedFormat') as '65-inch' | '75-inch') || '65-inch';
  });`);
}

// Remove trailing `)}` for all steps
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && lines[i - 1] && lines[i - 1].trim() === '</div>') {
    lines[i] = ''; // clear it out
  }
}

fs.writeFileSync('src/pages/LaunchCampaign.tsx', lines.join('\n'), 'utf8');
console.log('LaunchCampaign refactored successfully.');
