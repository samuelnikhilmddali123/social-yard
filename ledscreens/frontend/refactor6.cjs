const fs = require('fs');
let lines = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8').split('\n');
const edits = [];

function findAndReplace(startString, endString, repl) {
  const start = lines.findIndex(l => l.includes(startString));
  if (start === -1) { console.log('Failed start: ' + startString); return; }
  const end = lines.findIndex((l, i) => i > start && l.includes(endString));
  if (end === -1) { console.log('Failed end: ' + endString); return; }
  edits.push({ start, end, repl });
}

// 1. Step tracker
findAndReplace('{/* Stepper progress indicator */}', '</div>', []);

// 2. Left col wrapper
findAndReplace('<div className="lg:col-span-7 relative overflow-hidden', 'justify-between">', [
  '          <div className="lg:col-span-7 relative bg-transparent space-y-8 flex flex-col">'
]);

// 3. Step 1 -> Format Selection
findAndReplace('{/* STEP 1: SELECT ROUTE & TRAFFIC DIRECTION */}', '              )}', [
  '              {/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">',
  '                <div>',
  '                  <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">Select Display Size Format</h2>',
  '                  <p className="text-xs text-slate-400 font-medium">Choose between the active display formats installed for this trial run.</p>',
  '                </div>',
  '                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">',
  '                  <button type="button" onClick={() => { setSelectedFormat(\'65-inch\'); localStorage.setItem(\'campaign_selectedFormat\', \'65-inch\'); }} className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'65-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}>',
  '                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-850">65" Commercial Display</span></div>',
  '                    <p className="text-[11px] text-slate-500 font-semibold mt-2">Optimized for dense transit corridors, retail loops, and street-level intersections.</p>',
  '                  </button>',
  '                  <button type="button" onClick={() => { setSelectedFormat(\'75-inch\'); localStorage.setItem(\'campaign_selectedFormat\', \'75-inch\'); }} className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'75-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}>',
  '                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-850">75" Grand Billboard</span></div>',
  '                    <p className="text-[11px] text-slate-500 font-semibold mt-2">Landmark visibility, corporate zones, and maximum exposure exits.</p>',
  '                  </button>',
  '                </div>',
  '              </div>'
]);

// 4. Step 2 -> Empty
findAndReplace('{/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}', '              )}', [
  '              {/* ROUTE MAP AND COVERAGE REMOVED FOR ETHREE TRIAL RUN */}'
]);

// 5. Step 3 Schedule
findAndReplace('{/* STEP 3: SCHEDULE & TIME SELECTION */}', '                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6 my-4">', [
  '              {/* PANEL 2: DEFINE SCHEDULE & TIMESLOT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Define Schedule</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Select date presets, duration rates, and audience peak traffic times.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);
findAndReplace('{/* Slot Mode Toggle */}', '{/* Quick Date Presets */}', [
  '                  {/* HIGHLY HIGHLIGHTED INSTANT PLAY OPTION CARD */}',
  '                  <div ',
  '                    onClick={() => {',
  '                      const newIsInstant = !isInstant;',
  '                      setIsInstant(newIsInstant);',
  '                      localStorage.setItem(\'campaign_isInstant\', String(newIsInstant));',
  '                      if (newIsInstant) {',
  '                        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));',
  '                        setStartDate(now.toLocaleDateString(\'en-CA\', { timeZone: \'Asia/Kolkata\' }));',
  '                        setStartTime(now.getHours().toString().padStart(2, \'0\') + \':\' + now.getMinutes().toString().padStart(2, \'0\'));',
  '                        setCampaignDuration(10);',
  '                        setBookingDuration(\'day\');',
  '                      }',
  '                    }}',
  '                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none mb-6 ${isInstant ? \'border-amber-400 bg-amber-50/15 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/10\' : \'border-slate-200 bg-slate-50/50 hover:border-slate-350\'}`}',
  '                  >',
  '                    <div className="flex items-start justify-between gap-4 relative z-10">',
  '                      <div className="space-y-1.5 flex-1">',
  '                        <div className="flex items-center gap-2">',
  '                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse">⚡ RECOMMENDED PRESET</span>',
  '                          <h3 className="text-sm font-black text-slate-850">Instant Play Loop Sync</h3>',
  '                        </div>',
  '                        <p className="text-xs text-slate-500 font-medium leading-relaxed">',
  '                          Lock active playback immediately. Creative gets synced to the two installed E3Di trial monitors within 60 seconds.',
  '                        </p>',
  '                      </div>',
  '                      <div className="pt-1.5">',
  '                        <input type="checkbox" checked={isInstant} readOnly className="w-5 h-5 accent-amber-500 cursor-pointer rounded" />',
  '                      </div>',
  '                    </div>',
  '                  </div>',
  '                  {!isInstant && (',
  '                    <div className="space-y-4">',
  '                      {/* Quick Date Presets */}',
]);
findAndReplace('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">', '              )}', [
  '                </div>',
  '              </div>'
]);

// 6. Step 4
findAndReplace('{/* STEP 4: UPLOAD CREATIVE */}', '                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6 my-4">', [
  '              {/* PANEL 3: UPLOAD CREATIVE */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Creative Upload</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Upload your ad asset and validate size constraints.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);
// Use start index to search from step 4 location to avoid hitting earlier replaced buttons
const s4 = lines.findIndex(l => l.includes('{/* STEP 4: UPLOAD CREATIVE */}'));
if (s4 !== -1) {
  const b4 = lines.findIndex((l, i) => i > s4 && l.includes('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">'));
  const e4 = lines.findIndex((l, i) => i > b4 && l.includes('              )}'));
  if (b4 !== -1 && e4 !== -1) edits.push({ start: b4, end: e4, repl: ['                </div>', '              </div>'] });
}

// 7. Step 5
findAndReplace('{/* STEP 5: REVIEW & PAY */}', '                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6 my-4">', [
  '              {/* PANEL 4: REVIEW & PAY */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Review & Launch</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Verify target traffic metrics and complete booking payment.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);
const s5 = lines.findIndex(l => l.includes('{/* STEP 5: REVIEW & PAY */}'));
if (s5 !== -1) {
  const b5 = lines.findIndex((l, i) => i > s5 && l.includes('<div className="pt-4 border-t border-slate-100 flex items-center justify-between">'));
  const e5 = lines.findIndex((l, i) => i > b5 && l.includes('              )}'));
  if (b5 !== -1 && e5 !== -1) edits.push({ start: b5, end: e5, repl: ['                </div>', '              </div>'] });
}

// Ensure state for selectedFormat exists
if (!lines.some(l => l.includes('selectedFormat'))) {
  const hW = lines.findIndex(l => l.includes('const [hasWatermark, setHasWatermark]'));
  if (hW !== -1) {
    const hWe = lines.findIndex((l, i) => i > hW && l.includes('});'));
    edits.push({ start: hWe, end: hWe, repl: [
      lines[hWe],
      `  const [selectedFormat, setSelectedFormat] = useState<'65-inch' | '75-inch'>(() => {
    return (localStorage.getItem('campaign_selectedFormat') as '65-inch' | '75-inch') || '65-inch';
  });`
    ] });
  }
}

// Ensure formatting logic exists
if (!lines.some(l => l.includes('formatMultiplier'))) {
  const useCorr = lines.findIndex(l => l.includes('const {'));
  const useCorrEnd = lines.findIndex((l, i) => i > useCorr && l.includes('} = useCorridorPricing('));
  if (useCorrEnd !== -1) {
     const nextLine = lines.findIndex((l, i) => i > useCorrEnd && l.includes('const totalAmount ='));
     if (nextLine !== -1) {
         edits.push({ start: nextLine - 2, end: nextLine, repl: [
           '  const formatMultiplier = selectedFormat === \'75-inch\' ? 1.3 : 1.0;',
           '  const priceWithWatermark = Math.ceil(baseTotalAmount * formatMultiplier);',
           '  const priceWithoutWatermark = Math.ceil(baseTotalAmount * 1.25 * formatMultiplier);',
           '  const totalAmount = hasWatermark ? priceWithWatermark : priceWithoutWatermark;'
         ] });
     }
  }
}

edits.sort((a, b) => b.start - a.start);
for (const edit of edits) {
  lines.splice(edit.start, edit.end - edit.start + 1, ...edit.repl);
}

let code = lines.join('\n');
code = code.split('<AnimatePresence mode="wait">').join('');
code = code.split('</AnimatePresence>').join('');
fs.writeFileSync('src/pages/LaunchCampaign.tsx', code, 'utf8');
console.log("Refactoring complete");
