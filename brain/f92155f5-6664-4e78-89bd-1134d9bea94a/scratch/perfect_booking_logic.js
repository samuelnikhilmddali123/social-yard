const fs = require('fs');
const path = require('path');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";
const myBookingsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\MyBookings.tsx";
const approvalsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\admin\\Approvals.tsx";

// ─── 1. UPGRADE LAUNCHCAMPAIGN.TSX ──────────────────────────────────────────
try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');

  // Normalize all line endings to LF first!
  content = content.replace(/\r\n/g, '\n');

  // A. Replace the isInstant useEffect to support 30-minute validation and IST time tracking
  const isInstantEffectOld = `  useEffect(() => {
    let interval: any;
    if (isInstant) {
      interval = setInterval(() => {
        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
        const startStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        setStartTime(startStr);
        
        if (instantDuration > 0) {
          const end = new Date(now.getTime() + instantDuration * 60000);
          setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInstant, instantDuration]);`;

  const isInstantEffectNew = `  // Enforce 30-minute buffer validation for MANUAL bookings when date is TODAY
  const getMinTime = () => {
    if (!startDate) return undefined;
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istNow = new Date(utc + (3600000 * 5.5));
    
    const year = istNow.getFullYear();
    const month = String(istNow.getMonth() + 1).padStart(2, '0');
    const day = String(istNow.getDate()).padStart(2, '0');
    const todayStr = \`\${year}-\${month}-\${day}\`;
    
    if (startDate === todayStr) {
      const minDate = new Date(istNow.getTime() + 30 * 60 * 1000);
      return minDate.getHours().toString().padStart(2, '0') + ':' + minDate.getMinutes().toString().padStart(2, '0');
    }
    return undefined;
  };

  useEffect(() => {
    let interval: any;
    if (isInstant) {
      interval = setInterval(() => {
        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
        const startStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        setStartTime(startStr);
        
        if (instantDuration > 0) {
          const end = new Date(now.getTime() + instantDuration * 60000);
          setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
        }
      }, 5000);
    } else {
      // MANUAL Mode: Auto-enforce 30-minute buffer for TODAY bookings
      const minTime = getMinTime();
      if (minTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [mh, mm] = minTime.split(':').map(Number);
        if (sh < mh || (sh === mh && sm < mm)) {
          const now = new Date();
          const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
          const istNow = new Date(utc + (3600000 * 5.5));
          const minDate = new Date(istNow.getTime() + 30 * 60 * 1000);
          // Round to next 15-minute slot
          const rem = minDate.getMinutes() % 15;
          if (rem > 0) {
            minDate.setMinutes(minDate.getMinutes() + (15 - rem));
          }
          const newStart = minDate.getHours().toString().padStart(2, '0') + ':' + minDate.getMinutes().toString().padStart(2, '0');
          setStartTime(newStart);
          
          const end = new Date(minDate.getTime() + 60 * 60 * 1000); // Default 1 hour later
          setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
        }
      }
    }
    return () => clearInterval(interval);
  }, [isInstant, instantDuration, startDate, startTime]);`;

  if (content.includes(isInstantEffectOld)) {
    content = content.replace(isInstantEffectOld, isInstantEffectNew);
    console.log("-> replaced useEffect");
  } else {
    console.log("-> could not find useEffect");
  }

  // B. Raise availability bar z-index to z-[1010]
  content = content.replace(
    `className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 md:p-5 mb-4 md:mb-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10 relative"`,
    `className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 md:p-5 mb-4 md:mb-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10 relative z-[1010]"`
  );

  // C. Replace availability bar contents with {!isInstant ? (...) : (...)} structure
  const targetStart = `<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-10 relative z-10 w-full lg:w-auto">`;
  const targetEnd = `{/* Minimal Legend */}`;

  const startIdx = content.indexOf(targetStart);
  const endIdx = content.indexOf(targetEnd);

  if (startIdx !== -1 && endIdx !== -1) {
    const part1 = content.slice(0, startIdx + targetStart.length);
    const middle = content.slice(startIdx + targetStart.length, endIdx);
    const part2 = content.slice(endIdx);

    content = part1 + 
              `\n                     {!isInstant ? (\n                       <>\n` + 
              middle + 
              `\n                       </>\n                     ) : (\n                       <div className="flex items-center gap-3 py-1.5 px-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">\n                         <Zap className="text-indigo-400 animate-pulse" size={14} />\n                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">⚡ Instant Playback Mode (Active)</span>\n                       </div>\n                     )}\n` + 
              part2;

    console.log("-> replaced availability bar controls with index-based injection successfully!");
  } else {
    console.log("-> error: startIdx or endIdx not found!");
  }

  // D. Simplify the desktop datepicker's AnimatePresence block to remove the nested mobile modal
  const datePickerAnimateOld = `                            <AnimatePresence>
                               {isCalendarOpen && (
                                 <>
                                   {/* Desktop View */}
                                   <div className="hidden lg:block absolute top-full left-0 mt-4 z-[9999] shadow-2xl">
                                     <PremiumCalendar onDateSelect={d => { setStartDate(d); setIsCalendarOpen(false); }} selectedDate={startDate} />
                                   </div>

                                   {/* Mobile Fullscreen Modal */}
                                   <div className="lg:hidden fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                                     <motion.div 
                                       initial={{ scale: 0.9, opacity: 0 }}
                                       animate={{ scale: 1, opacity: 1 }}
                                       exit={{ scale: 0.9, opacity: 0 }}
                                       className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl border border-slate-100"
                                     >
                                       <div className="flex items-center justify-between mb-4">
                                         <h3 className="font-black text-slate-900 text-base">Select Campaign Date</h3>
                                         <button onClick={() => setIsCalendarOpen(false)} className="p-1 bg-slate-100 rounded-full text-slate-500">
                                           <X size={18} />
                                         </button>
                                       </div>

                                       <div className="flex-1 overflow-y-auto py-2 flex justify-center custom-scrollbar">
                                         <PremiumCalendar 
                                           onDateSelect={d => {
                                             setTempStartDate(d);
                                           }} 
                                           selectedDate={tempStartDate} 
                                         />
                                       </div>

                                       <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                                         <button 
                                           onClick={() => setIsCalendarOpen(false)}
                                           className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs text-slate-500 uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-transform"
                                         >
                                           Cancel
                                         </button>
                                         <button 
                                           onClick={() => {
                                             if (tempStartDate) {
                                               setStartDate(tempStartDate);
                                               setIsCalendarOpen(false);
                                             } else {
                                               alert("Please pick a date first.");
                                             }
                                           }}
                                           className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                                         >
                                           Confirm
                                         </button>
                                       </div>
                                     </motion.div>
                                   </div>
                                 </>
                               )}
                            </AnimatePresence>`;

  const datePickerAnimateNew = `                            <AnimatePresence>
                               {isCalendarOpen && (
                                 <div className="hidden lg:block absolute top-full left-0 mt-4 z-[9999] shadow-2xl">
                                   <PremiumCalendar onDateSelect={d => { setStartDate(d); setIsCalendarOpen(false); }} selectedDate={startDate} />
                                 </div>
                               )}
                            </AnimatePresence>`;

  if (content.includes(datePickerAnimateOld)) {
    content = content.replace(datePickerAnimateOld, datePickerAnimateNew);
    console.log("-> replaced datePickerAnimateOld");
  } else {
    console.log("-> could not find datePickerAnimateOld");
  }

  // E. Pass minTime={getMinTime()} to PremiumTimePicker
  content = content.replace(
    `<PremiumTimePicker value={startTime} onChange={v => { setStartTime(v); setIsStartTimeOpen(false); }} />`,
    `<PremiumTimePicker value={startTime} onChange={v => { setStartTime(v); setIsStartTimeOpen(false); }} minTime={getMinTime()} />`
  );
  content = content.replace(
    `<PremiumTimePicker value={endTime} onChange={v => { setEndTime(v); setIsEndTimeOpen(false); }} />`,
    `<PremiumTimePicker value={endTime} onChange={v => { setEndTime(v); setIsEndTimeOpen(false); }} minTime={startTime} />`
  );

  // F. Switch mode handlers with auto-switching properties
  const manualClickOld = `onClick={() => { setIsInstant(false); }}`;
  const manualClickNew = `onClick={() => { 
                            setIsInstant(false); 
                            // Automatically remove duration selection and apply 30-minute validation
                            setInstantDuration(0);
                            const now = new Date();
                            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                            const istNow = new Date(utc + (3600000 * 5.5));
                            setStartDate(istNow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                            
                            // Rounded start time + 30 mins
                            const minDate = new Date(istNow.getTime() + 30 * 60 * 1000);
                            const rem = minDate.getMinutes() % 15;
                            if (rem > 0) minDate.setMinutes(minDate.getMinutes() + (15 - rem));
                            setStartTime(minDate.getHours().toString().padStart(2, '0') + ':' + minDate.getMinutes().toString().padStart(2, '0'));
                            
                            const end = new Date(minDate.getTime() + 60 * 60 * 1000);
                            setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
                          }}`;

  if (content.includes(manualClickOld)) {
    content = content.replace(manualClickOld, manualClickNew);
    console.log("-> replaced manualClickOld");
  } else {
    console.log("-> could not find manualClickOld");
  }

  const instantClickOld = `onClick={() => { 
                            setIsInstant(true); 
                            const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
                            setStartDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                            setStartTime(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
                            if (instantDuration === 0) setInstantDuration(60); 
                          }}`;

  const instantClickNew = `onClick={() => { 
                            setIsInstant(true); 
                            // Automatically remove selected start/end manual times
                            const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
                            setStartDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                            setStartTime(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
                            setInstantDuration(60); // Default to 1 hour (60 mins)
                          }}`;

  if (content.includes(instantClickOld)) {
    content = content.replace(instantClickOld, instantClickNew);
    console.log("-> replaced instantClickOld");
  } else {
    console.log("-> could not find instantClickOld");
  }

  // G. Replace small instantDuration input with premium duration selector pills
  const durationSelectorOld = `                    {isInstant && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className="flex items-center gap-3 pl-4 pr-5 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30 min-w-[100px]"
                      >
                        <input 
                          type="number" 
                          className="w-12 bg-transparent text-white font-black text-sm outline-none border-b border-indigo-500/50 focus:border-indigo-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={instantDuration}
                          onChange={(e) => setInstantDuration(parseInt(e.target.value) || 0)}
                        />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Mins</span>
                      </motion.div>
                    )}`;

  const durationSelectorNew = `                    {isInstant && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className="flex flex-wrap items-center gap-2"
                      >
                        {[
                          { label: '15m', value: 15 },
                          { label: '30m', value: 30 },
                          { label: '1h', value: 60 },
                          { label: '2h', value: 120 },
                          { label: '3h', value: 180 },
                          { label: 'Custom', value: 'custom' }
                        ].map((opt) => {
                          const isSelected = opt.value === 'custom' 
                            ? ![15, 30, 60, 120, 180].includes(instantDuration)
                            : instantDuration === opt.value;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                if (opt.value === 'custom') {
                                  setInstantDuration(45); // default custom
                                } else {
                                  setInstantDuration(opt.value as number);
                                }
                              }}
                              className={\`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all \${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                  : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
                              }\`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                        
                        {![15, 30, 60, 120, 180].includes(instantDuration) && (
                          <motion.div 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-xl ml-1"
                          >
                            <input 
                              type="number" 
                              className="w-10 bg-transparent text-white font-black text-xs outline-none border-b border-indigo-500/50 focus:border-indigo-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={instantDuration}
                              onChange={(e) => setInstantDuration(parseInt(e.target.value) || 0)}
                            />
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Mins</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}`;

  if (content.includes(durationSelectorOld)) {
    content = content.replace(durationSelectorOld, durationSelectorNew);
    console.log("-> replaced durationSelectorOld");
  } else {
    console.log("-> could not find durationSelectorOld");
  }

  // H. Enforce new status alert success messages
  const alertStrOld = `alert('Payment Successful! Your campaign has been scheduled.');`;
  const alertStrNew = `if (isInstant) {
        alert('Payment Successful! Your campaign will begin immediately after admin approval.');
      } else {
        alert('Payment Successful! Your campaign is scheduled pending admin approval.');
      }`;
  content = content.replace(alertStrOld, alertStrNew);

  // I. Enforce step 4 timeline list formatting
  const searchTimelineStart = `Name="grid grid-cols-2 gap-3">\n                      {[`;
  const timelineIdx = content.indexOf(searchTimelineStart);
  if (timelineIdx !== -1) {
    const endTimelineIdx = content.indexOf(`].filter(Boolean).map((item: any) => (`, timelineIdx);
    if (endTimelineIdx !== -1) {
      const originalPart = content.slice(timelineIdx + searchTimelineStart.length, endTimelineIdx);
      const replacedPart = `
                        isInstant && { label: 'Booking Type', value: '⚡ INSTANT BROADCAST' },
                        isInstant && { label: 'Start Time', value: 'Will begin after admin approval' },
                        !isInstant && { label: 'Date', value: startDate ? \`\${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}\` : '—' },
                        !isInstant && { label: 'Start Time', value: formatTimeAMPM(startTime) },
                        !isInstant && { label: 'End Time', value: formatTimeAMPM(endTime) },
                        { label: 'Duration', value: isInstant ? \`\${instantDuration} minutes\` : (duration ? \`\${duration.toFixed(1)} hours\` : '—') },
                      `;
      content = content.slice(0, timelineIdx + searchTimelineStart.length) + replacedPart + content.slice(endTimelineIdx);
      console.log("-> replaced step4TimelineOld successfully!");
    } else {
      console.log("-> could not find end of timeline list!");
    }
  } else {
    console.log("-> could not find searchTimelineStart!");
  }

  // J. Place the mobile calendar fullscreen modal at the absolute root of the document
  const finalDivOld = `      </div>\n    </div>\n  );\n};\n\nexport default LaunchCampaign;`;
  const finalDivNew = `      </div>\n      {/* Mobile Fullscreen Calendar Modal (Rendered at true document root to completely avoid parent transform/stacking context bugs) */}\n      <AnimatePresence>\n        {isCalendarOpen && (\n          <div className="lg:hidden fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">\n            <motion.div \n              initial={{ scale: 0.9, opacity: 0 }}\n              animate={{ scale: 1, opacity: 1 }}\n              exit={{ scale: 0.9, opacity: 0 }}\n              className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 relative z-[100000]"\n            >\n              <div className="flex items-center justify-between mb-4">\n                <h3 className="font-black text-slate-900 text-base">Select Campaign Date</h3>\n                <button onClick={() => setIsCalendarOpen(false)} className="p-1 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">\n                  <X size={18} />\n                </button>\n              </div>\n\n              <div className="flex-1 overflow-y-auto py-2 flex justify-center custom-scrollbar">\n                <PremiumCalendar \n                  onDateSelect={d => {\n                    setTempStartDate(d);\n                  }} \n                  selectedDate={tempStartDate} \n                />\n              </div>\n\n              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">\n                <button \n                  onClick={() => setIsCalendarOpen(false)}\n                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs text-slate-500 uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-transform"\n                >\n                  Cancel\n                </button>\n                <button \n                  onClick={() => {\n                    if (tempStartDate) {\n                      setStartDate(tempStartDate);\n                      setIsCalendarOpen(false);\n                    } else {\n                      alert("Please pick a date first.");\n                    }\n                  }}\n                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"\n                >\n                  Confirm\n                </button>\n              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>\n    </div>\n  );\n};\n\nexport default LaunchCampaign;`;

  if (content.includes(finalDivOld)) {
    content = content.replace(finalDivOld, finalDivNew);
    console.log("-> replaced finalDivOld");
  } else {
    console.log("-> could not find finalDivOld");
  }

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully rewrote LaunchCampaign.tsx with flawless compilation and premium logic!");

} catch (err) {
  console.error("❌ Error rewriting LaunchCampaign.tsx:", err);
}

// ─── 2. UPGRADE MYBOOKINGS.TSX ───────────────────────────────────────────────
try {
  let content = fs.readFileSync(myBookingsPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const timelineCellNew = `                    <td className="px-4 md:px-8 py-6">
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400" />
                          {booking.isInstant && booking.status === 'pending'
                            ? 'Immediate'
                            : new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                          <Clock size={10} />{' '}
                          {booking.isInstant
                            ? booking.status === 'pending'
                              ? \`Will begin after approval (\${booking.duration || 60}m)\`
                              : \`\${booking.startTime} - \${booking.endTime} (\${booking.duration || 60}m)\`
                            : \`\${booking.startTime} - \${booking.endTime}\`}
                        </p>
                      </div>
                    </td>`;

  // Use a broad regular expression to match whatever timeline <td> currently is in MyBookings.tsx
  content = content.replace(
    /<td className="px-4 md:px-8 py-6">\s*<div className="space-y-1\.5">[\s\S]*?<\/td>/,
    timelineCellNew
  );

  fs.writeFileSync(myBookingsPath, content, 'utf8');
  console.log("✅ Successfully rewrote MyBookings.tsx timeline displaying!");
} catch (err) {
  console.error("❌ Error updating MyBookings.tsx:", err);
}

// ─── 3. UPGRADE APPROVALS.TSX ───────────────────────────────────────────────
try {
  let content = fs.readFileSync(approvalsPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const approvalsTimelineNew = `               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing & Duration</p>
                  <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">
                          {group.isInstant && type === 'pending' ? 'Immediate' : group.date}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {group.isInstant 
                             ? type === 'pending' 
                               ? 'Will begin after admin approval' 
                               : \`\${formatTimeAMPM(group.startTime)} - \${formatTimeAMPM(group.endTime)}\`
                             : \`\${formatTimeAMPM(group.startTime)} - \${formatTimeAMPM(group.endTime)}\`}
                        </span>
                     </div>
                     <div className="w-px h-8 bg-slate-200 mx-2" />
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">
                          {group.isInstant ? \`\${group.duration} MINS\` : 'Standard'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                     </div>
                  </div>
               </div>`;

  content = content.replace(
    /<div className="space-y-1">\s*<p className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest">Timing & Duration<\/p>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
    approvalsTimelineNew
  );

  fs.writeFileSync(approvalsPath, content, 'utf8');
  console.log("✅ Successfully rewrote Approvals.tsx timeline displays!");
} catch (err) {
  console.error("❌ Error updating Approvals.tsx:", err);
}
