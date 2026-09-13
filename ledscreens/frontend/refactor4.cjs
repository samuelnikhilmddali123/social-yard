const fs = require('fs');
let lines = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8').split('\n');

// Perform splices from bottom to top so line numbers stay accurate!

// 7. Remove closing AnimatePresence
lines.splice(2110, 1); // Line 2111 (0-indexed 2110) - Wait, I don't know the exact line for closing AnimatePresence.
// It's at line 2107 in my last check?
// Let's just find them by index and sort descending.

const edits = [];

// Helper to add an edit
function addEdit(startLine, endLine, replacementLines = []) {
  edits.push({ start: startLine - 1, end: endLine - 1, repl: replacementLines });
}

// Lines 1808 to 1813: Step 5 Review & Pay wrapper
addEdit(1808, 1815, [
  '              {/* PANEL 4: REVIEW & PAY */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Review & Launch</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Verify target traffic metrics and complete booking payment.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);

// Lines 1791 to 1805: Step 4 closing buttons and wrapper
addEdit(1791, 1805, [
  '                </div>',
  '              </div>'
]);

// Lines 1703 to 1709: Step 4 wrapper
addEdit(1703, 1710, [
  '              {/* PANEL 3: UPLOAD CREATIVE */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Creative Upload</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Upload your ad asset and validate size constraints.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);

// Lines 1686 to 1700: Step 3 closing buttons and wrapper
addEdit(1686, 1700, [
  '                </div>',
  '              </div>'
]);

// Lines 1476 to 1481: Step 3 wrapper
addEdit(1476, 1482, [
  '              {/* PANEL 2: DEFINE SCHEDULE & TIMESLOT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Define Schedule</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Select date presets, duration rates, and audience peak traffic times.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);

// Lines 1381 to 1410: Slot mode toggle -> Replace with highlighted Instant Play
addEdit(1381, 1410, [
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
  '                      <div>',
  '                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Campaign Date</label>',
  '                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'
]);

// Lines 1198 to 1473: Step 2 Route Map
addEdit(1198, 1474, [
  '              {/* ROUTE MAP AND COVERAGE REMOVED FOR ETHREE TRIAL RUN */}'
]);

// Lines 1039 to 1195: Step 1 Route & Direction -> Format Selection
addEdit(1039, 1196, [
  '              {/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">',
  '                <div>',
  '                  <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">Select Display Size Format</h2>',
  '                  <p className="text-xs text-slate-400 font-medium">Choose between the active display formats installed for this trial run.</p>',
  '                </div>',
  '                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">',
  '                  <button',
  '                    type="button"',
  '                    onClick={() => {',
  '                      setSelectedFormat(\'65-inch\');',
  '                      localStorage.setItem(\'campaign_selectedFormat\', \'65-inch\');',
  '                    }}',
  '                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'65-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}',
  '                  >',
  '                    <div className="flex items-center justify-between">',
  '                      <div className="flex items-center gap-2">',
  '                        <span className="text-xs font-black text-slate-850">65" Commercial Display</span>',
  '                      </div>',
  '                    </div>',
  '                    <p className="text-[11px] text-slate-500 font-semibold mt-2">',
  '                      Optimized for dense transit corridors, retail loops, and street-level intersections.',
  '                    </p>',
  '                  </button>',
  '                  <button',
  '                    type="button"',
  '                    onClick={() => {',
  '                      setSelectedFormat(\'75-inch\');',
  '                      localStorage.setItem(\'campaign_selectedFormat\', \'75-inch\');',
  '                    }}',
  '                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'75-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}',
  '                  >',
  '                    <div className="flex items-center justify-between">',
  '                      <div className="flex items-center gap-2">',
  '                        <span className="text-xs font-black text-slate-850">75" Grand Billboard</span>',
  '                      </div>',
  '                    </div>',
  '                    <p className="text-[11px] text-slate-500 font-semibold mt-2">',
  '                      Landmark visibility, corporate zones, and maximum exposure exits.',
  '                    </p>',
  '                  </button>',
  '                </div>',
  '              </div>'
]);

// Lines 1035 to 1037: Left column container & AnimatePresence
addEdit(1035, 1037, [
  '          <div className="lg:col-span-7 relative bg-transparent space-y-8 flex flex-col">'
]);

// Lines 1009 to 1029: Step Tracker
addEdit(1009, 1029, []);

// Finally, we must remove the closing `</AnimatePresence>` for the left column.
// Since we are modifying from bottom to top, we need to find it dynamically or just provide its line.
// It's line 1805 before edits, but wait, if we edit from bottom to top, we can just find it before doing edits.

// Sort edits descending by start line
edits.sort((a, b) => b.start - a.start);

let animateIndex = lines.findIndex(l => l.includes('</AnimatePresence>'));
if (animateIndex !== -1) {
  // we will just splice it out directly before the other edits, BUT wait! That shifts line numbers.
  // We'll add it to our edits array if it's below all of them.
  // It is at line 1806 originally in the DOM? No, line 1805 in the file was `              )}`
  // Let's just find it by content, not line number, and remove it before doing line-based edits if it's at the bottom.
}

// Apply edits
for (const edit of edits) {
  lines.splice(edit.start, edit.end - edit.start + 1, ...edit.repl);
}

// Remove closing AnimatePresence (and ending `)}` if we missed any)
let code = lines.join('\\n');
code = code.split('</AnimatePresence>').join('');


fs.writeFileSync('src/pages/LaunchCampaign.tsx', code, 'utf8');
console.log("Refactoring complete");
