const fs = require('fs');

let lines = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8').split('\n');

// 1. Remove Step Tracker
let i = lines.findIndex(l => l.includes('{/* Stepper progress indicator */}'));
if (i !== -1) {
    // 1009 to 1028
    lines.splice(i, 20); 
}

// 2. Change Left Column wrapper
i = lines.findIndex(l => l.includes('lg:col-span-7 relative overflow-hidden bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm lg:h-[calc(100vh-160px)] lg:min-h-[680px] flex flex-col justify-between'));
if (i !== -1) {
    lines[i] = '          <div className="lg:col-span-7 relative bg-transparent space-y-8 flex flex-col">';
}

// 3. Remove AnimatePresence opening
i = lines.findIndex(l => l.includes('<AnimatePresence mode="wait">'));
if (i !== -1) {
    lines.splice(i, 1);
}

// 4. Panel 1: Display Format
// We find {/* STEP 1: SELECT ROUTE & TRAFFIC DIRECTION */}
i = lines.findIndex(l => l.includes('{/* STEP 1: SELECT ROUTE & TRAFFIC DIRECTION */}'));
if (i !== -1) {
    let start = i;
    // We want to delete down to {/* Screen Format Selection */}
    let end = lines.findIndex(l => l.includes('{/* Screen Format Selection */}'));
    if (end !== -1) {
        lines.splice(start, end - start, 
`              {/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Select Display Format</h2>
                  <p className="text-xs text-slate-500 mt-1">Choose between the active display formats installed for this trial run.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">`
        );
    }
}

// 5. Close Panel 1 and remove Direction Selection
// After {/* Screen Format Selection */}, we find {/* Direction Selection */}
i = lines.findIndex(l => l.includes('{/* Direction Selection */}'));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`                </div>
              </div>
`
        );
    }
}

// 6. Remove Step 2
i = lines.findIndex(l => l.includes('{/* STEP 2: ROUTE VISUALIZATION & COVERAGE */}'));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{/* STEP 3: SCHEDULE & TIME SELECTION */}'));
    if (end !== -1) {
        lines.splice(start, end - start);
    }
}

// 7. Panel 2: Schedule & Time
i = lines.findIndex(l => l.includes('{/* STEP 3: SCHEDULE & TIME SELECTION */}'));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{/* Quick Date Presets */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`              {/* PANEL 2: DEFINE SCHEDULE & TIMESLOT */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Define Schedule</h2>
                  <p className="text-xs text-slate-500 mt-1">Select date presets, duration rates, and audience peak traffic times.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
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
`
        );
    }
}

// 8. Fix the ternary for InstantPlay
i = lines.findIndex(l => l.includes(') : ('));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{/* Campaign Duration Selector */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`                    )}
`
        );
    }
}

// 9. Close Panel 2
i = lines.findIndex(l => l.includes('onClick={handleContinueToStep4}'));
if (i !== -1) {
    let start = i;
    while (!lines[start].includes('<div className="pt-4 border-t')) start--;
    let end = lines.findIndex(l => l.includes('{/* STEP 4: UPLOAD CREATIVE */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`                </div>
              </div>
`
        );
    }
}

// 10. Panel 3: Creative Upload
i = lines.findIndex(l => l.includes('{/* STEP 4: UPLOAD CREATIVE */}'));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{error && ('));
    if (end !== -1) {
        lines.splice(start, end - start,
`              {/* PANEL 3: UPLOAD CREATIVE */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Creative Upload</h2>
                  <p className="text-xs text-slate-500 mt-1">Upload your ad asset and validate size constraints.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
`
        );
    }
}

// 11. Close Panel 3
i = lines.findIndex(l => l.includes('onClick={handleContinueToStep5}'));
if (i !== -1) {
    let start = i;
    while (!lines[start].includes('<div className="pt-4 border-t')) start--;
    let end = lines.findIndex(l => l.includes('{/* STEP 5: REVIEW & PAY */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`                </div>
              </div>
`
        );
    }
}

// 12. Panel 4: Review & Launch
i = lines.findIndex(l => l.includes('{/* STEP 5: REVIEW & PAY */}'));
if (i !== -1) {
    let start = i;
    let end = lines.findIndex(l => l.includes('{/* Detailed Summary block */}'));
    if (end !== -1) {
        lines.splice(start, end - start,
`              {/* PANEL 4: REVIEW & LAUNCH */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Review & Launch</h2>
                  <p className="text-xs text-slate-500 mt-1">Verify target traffic metrics and complete booking payment.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
`
        );
    }
}

// 13. Close Panel 4 and remove AnimatePresence closures
i = lines.findIndex(l => l.includes('onClick={() => setStep(4)}'));
if (i !== -1) {
    let start = i;
    while (!lines[start].includes('<div className="pt-4 border-t')) start--;
    
    let end = lines.findIndex(l => l.includes('</AnimatePresence>'));
    if (end !== -1) {
        lines.splice(start, end - start + 1,
`                </div>
              </div>
`
        );
    }
}

fs.writeFileSync('src/pages/LaunchCampaign.tsx', lines.join('\n'), 'utf8');
console.log('Refactoring complete');
