const fs = require('fs');
let lines = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8').split('\n');
const edits = [];
function addEdit(startLine, endLine, replacementLines = []) {
  edits.push({ start: startLine - 1, end: endLine - 1, repl: replacementLines });
}

addEdit(1787, 1804, ['                </div>', '              </div>']);
addEdit(1683, 1708, [
  '              {/* PANEL 3: UPLOAD CREATIVE */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Creative Upload</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Upload your ad asset and validate size constraints.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);
addEdit(1663, 1681, ['                </div>', '              </div>']);
addEdit(1453, 1460, [
  '              {/* PANEL 2: DEFINE SCHEDULE & TIMESLOT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">',
  '                <div>',
  '                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Define Schedule</h2>',
  '                  <p className="text-xs text-slate-500 mt-1">Select date presets, duration rates, and audience peak traffic times.</p>',
  '                </div>',
  '                <div className="flex-1 space-y-6 my-4">'
]);
addEdit(1358, 1387, [
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
addEdit(1175, 1451, ['              {/* ROUTE MAP AND COVERAGE REMOVED */}']);
addEdit(1016, 1173, [
  '              {/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}',
  '              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">',
  '                <div>',
  '                  <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">Select Display Size Format</h2>',
  '                  <p className="text-xs text-slate-400 font-medium">Choose between the active display formats installed for this trial run.</p>',
  '                </div>',
  '                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">',
  '                  <button type="button" onClick={() => { setSelectedFormat(\'65-inch\'); localStorage.setItem(\'campaign_selectedFormat\', \'65-inch\'); }} className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'65-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}>',
  '                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-850">65" Commercial Display</span></div>',
  '                  </button>',
  '                  <button type="button" onClick={() => { setSelectedFormat(\'75-inch\'); localStorage.setItem(\'campaign_selectedFormat\', \'75-inch\'); }} className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === \'75-inch\' ? \'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10\' : \'border-slate-200 hover:border-slate-300\'}`}>',
  '                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-850">75" Grand Billboard</span></div>',
  '                  </button>',
  '                </div>',
  '              </div>'
]);
addEdit(1012, 1014, ['          <div className="lg:col-span-7 relative bg-transparent space-y-8 flex flex-col">']);
addEdit(986, 1006, []); // Step Tracker

edits.sort((a, b) => b.start - a.start);
for (const edit of edits) {
  lines.splice(edit.start, edit.end - edit.start + 1, ...edit.repl);
}

// Just remove AnimatePresence by split join
let code = lines.join('\\n');
code = code.split('<AnimatePresence mode="wait">').join('');
code = code.split('</AnimatePresence>').join('');
fs.writeFileSync('src/pages/LaunchCampaign.tsx', code, 'utf8');
console.log("Refactoring complete");
