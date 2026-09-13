const fs = require('fs');

let code = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8');

// 1. Remove step navigation header
code = code.replace(
  /\{\/\* Step Progress Tracker \*\/}.*?\{\/\* Main Split Layout \*\//s,
  '{/* Main Split Layout */}'
);

// 2. Remove the step 1 wrapper and replace with Format selection
code = code.replace(
  /\{\/\* STEP 1: SELECT ROUTE & TRAFFIC DIRECTION \*\/\}\s*\{step === 1 && \(\s*<motion\.div key="step1-route".*?<\/motion\.div>\s*\)\}/s,
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-850">65" Commercial Display</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold mt-2 leading-relaxed">
                      Optimized for dense transit corridors, retail loops, and street-level intersections.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('75-inch');
                      localStorage.setItem('campaign_selectedFormat', '75-inch');
                    }}
                    className={\`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group \${selectedFormat === '75-inch' ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}\`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-850">75" Grand Billboard</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold mt-2 leading-relaxed">
                      Landmark visibility, corporate zones, and maximum exposure exits.
                    </p>
                  </button>
                </div>
              </div>`
);

// 3. Comment out Step 2 (Route Map & Coverage)
code = code.replace(
  /\{\/\* STEP 2: ROUTE VISUALIZATION & COVERAGE \*\/\}\s*\{step === 2 && \(\s*<motion\.div key="step2-coverage".*?<\/motion\.div>\s*\)\}/s,
  `{/* STEP 2: ROUTE VISUALIZATION & COVERAGE - COMMENTED OUT AS PER REQUEST */}
              {/* Route Map and Coverage sections have been removed for the ethree trial run */}`
);

// 4. Remove step 3 wrapper, add Highlighted Instant Play, remove buttons
code = code.replace(/\{\/\* STEP 3: SCHEDULE & TIME SELECTION \*\/\}\s*\{step === 3 && \(\s*<motion\.div key="step3-schedule" [^>]*>/, `{/* PANEL 2: DEFINE SCHEDULE & TIMESLOT */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">`);

// Replace the slot mode toggle with a highly highlighted instant play
code = code.replace(/\{\/\* Slot Mode Toggle \*\/\}.*?\{\/\* Quick Date Presets \*\/\}/s, `
                    {/* HIGHLY HIGHLIGHTED INSTANT PLAY OPTION CARD */}
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

code = code.replace(/<div className="pt-4 border-t border-slate-100 flex items-center justify-between">.*?<\/motion\.div>\s*\)\}/s, `</div>\n`);

// 5. Remove step 4 wrapper
code = code.replace(/\{\/\* STEP 4: UPLOAD CREATIVE \*\/\}\s*\{step === 4 && \(\s*<motion\.div key="step4-creative" [^>]*>/, `{/* PANEL 3: UPLOAD CREATIVE */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">`);
code = code.replace(/<div className="pt-4 border-t border-slate-100 flex items-center justify-between">.*?<\/motion\.div>\s*\)\}/s, `</div>\n`);

// 6. Remove step 5 wrapper
code = code.replace(/\{\/\* STEP 5: REVIEW & PAY \*\/\}\s*\{step === 5 && \(\s*<motion\.div key="step5-launch" [^>]*>/, `{/* PANEL 4: REVIEW & PAY */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">`);
code = code.replace(/<div className="pt-4 border-t border-slate-100 flex items-center justify-between">.*?<\/motion\.div>\s*\)\}/s, `</div>\n`);

// 7. Remove AnimatePresence wrappers
code = code.replace(/<AnimatePresence mode="wait">/g, '');
code = code.replace(/<\/AnimatePresence>/g, '');

// 8. Make sure selectedFormat state exists
if (!code.includes("const [selectedFormat, setSelectedFormat]")) {
  code = code.replace(
    /const \[hasWatermark, setHasWatermark\].*?;\n\s*}\);/s,
    `$&
  const [selectedFormat, setSelectedFormat] = useState<'65-inch' | '75-inch'>(() => {
    return (localStorage.getItem('campaign_selectedFormat') as '65-inch' | '75-inch') || '65-inch';
  });`
  );
}

fs.writeFileSync('src/pages/LaunchCampaign.tsx', code, 'utf8');
console.log('LaunchCampaign refactored successfully.');
