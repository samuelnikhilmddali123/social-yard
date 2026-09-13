const fs = require('fs');
const path = require('path');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";
const myBookingsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\MyBookings.tsx";
const approvalsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\admin\\Approvals.tsx";

// ─── 1. FIX LAUNCHCAMPAIGN.TSX ───────────────────────────────────────────────
try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');

  // Enforce 30-minute buffer logic on TODAY date selection in useEffect
  // Find where isInstant useEffect is
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

  // We want to add the 30-minute buffer logic to this block as well as today validation
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
          
          const end = new Date(minDate.getTime() + 60 * 60 * 1000); // Default 1 hour
          setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
        }
      }
    }
    return () => clearInterval(interval);
  }, [isInstant, instantDuration, startDate, startTime]);`;

  if (content.includes('const [isInstant, setIsInstant] = useState(false);')) {
    // Replace the useEffect
    content = content.replace(/useEffect\(\(\) => \{[\s\S]*?clearInterval\(interval\);\s*\}, \[isInstant, instantDuration\]\);/, isInstantEffectNew);
  }

  // Update success alert message
  const alertStrOld = `alert('Payment Successful! Your campaign has been scheduled.');`;
  const alertStrNew = `if (isInstant) {
        alert('Payment Successful! Your campaign will begin immediately after admin approval.');
      } else {
        alert('Payment Successful! Your campaign is scheduled pending admin approval.');
      }`;
  content = content.replace(alertStrOld, alertStrNew);

  // Update step 4 summary layout items
  const step4TimelineOld = `                    {[
                      { label: 'Date', value: startDate ? \`\${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}\` : '—' },
                      !isInstant && { label: 'Start Time', value: formatTimeAMPM(startTime) },
                      !isInstant && { label: 'End Time', value: formatTimeAMPM(endTime) },
                      { label: 'Duration', value: isInstant ? \`\${instantDuration} minutes\` : (duration ? \`\${duration.toFixed(1)} hours\` : '—') },
                    ].filter(Boolean).map((item: any) => (`;

  const step4TimelineNew = `                    {[
                      isInstant && { label: 'Booking Type', value: '⚡ INSTANT BROADCAST' },
                      isInstant && { label: 'Start Time', value: 'Will begin after admin approval' },
                      !isInstant && { label: 'Date', value: startDate ? \`\${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}\` : '—' },
                      !isInstant && { label: 'Start Time', value: formatTimeAMPM(startTime) },
                      !isInstant && { label: 'End Time', value: formatTimeAMPM(endTime) },
                      { label: 'Duration', value: isInstant ? \`\${instantDuration} minutes\` : (duration ? \`\${duration.toFixed(1)} hours\` : '—') },
                    ].filter(Boolean).map((item: any) => (`;

  content = content.replace(step4TimelineOld, step4TimelineNew);

  // Now, let's adjust the Availability Bar UI:
  // HIDE Date picker & Time pickers in Instant Mode!
  // We'll wrap the date selector section and the time section with {!isInstant && (...)}
  // Let's locate the columns inside availability bar

  // Find the exact Availability Bar structure
  const barWrapperOldStart = `              <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 md:p-5 mb-4 md:mb-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10 relative z-[1010]">
                 {/* Background Subtle Glow */}
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-10 relative z-10 w-full lg:w-auto">
                    {/* Date Picker Section */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">`;

  // We want it to be:
  const barWrapperNewStart = `              <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 md:p-5 mb-4 md:mb-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10 relative z-[1010]">
                 {/* Background Subtle Glow */}
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-10 relative z-10 w-full lg:w-auto">
                    {!isInstant && (
                      <>
                        {/* Date Picker Section */}
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">`;

  content = content.replace(barWrapperOldStart, barWrapperNewStart);

  // Close the {!isInstant && ( ... )} wrapper after the Time picker section ends, and before the legend
  const barWrapperOldEnd = `                     </div>
                  </div>
 
                  {/* Mode & Duration Section */}`;

  const barWrapperNewEnd = `                     </div>
                      </>
                    )}

                    {isInstant && (
                      <div className="flex items-center gap-3 py-1 px-2">
                        <Zap className="text-indigo-400 animate-pulse" size={16} />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Instant Booking Mode Enabled</span>
                      </div>
                    )}
                  </div>
 
                  {/* Mode & Duration Section }`;

  // Note: the end pattern might vary slightly, let's search and replace carefully
  const endPattern = `                     {/* Minimal Legend */}
                     <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 py-2 px-4 bg-white/5 rounded-full border border-white/5 w-full md:w-auto mt-2 md:mt-0">`;
  
  if (content.includes(endPattern)) {
    content = content.replace(endPattern, `                     </>\n                    )}\n` + endPattern);
  }

  // Now, pass minTime={getMinTime()} to PremiumTimePicker
  content = content.replace(
    `<PremiumTimePicker value={startTime} onChange={v => { setStartTime(v); setIsStartTimeOpen(false); }} />`,
    `<PremiumTimePicker value={startTime} onChange={v => { setStartTime(v); setIsStartTimeOpen(false); }} minTime={getMinTime()} />`
  );
  content = content.replace(
    `<PremiumTimePicker value={endTime} onChange={v => { setEndTime(v); setIsEndTimeOpen(false); }} />`,
    `<PremiumTimePicker value={endTime} onChange={v => { setEndTime(v); setIsEndTimeOpen(false); }} minTime={startTime} />`
  );

  // Replace mode duration selector with premium duration pills
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
                                  setInstantDuration(opt.value);
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

  content = content.replace(durationSelectorOld, durationSelectorNew);

  // AUTO-SWITCHING behavior inside mode switcher onClick handlers:
  // MANUAL -> INSTANT: Clear startDate, startTime, endTime (or set them to today's date / approved times for query compatibility, but remove duration selection in MANUAL)
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
  
  content = content.replace(manualClickOld, manualClickNew);

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

  content = content.replace(instantClickOld, instantClickNew);

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully updated LaunchCampaign.tsx with Manual/Instant duration logic & 30-min buffers!");

} catch (err) {
  console.error("❌ Error updating LaunchCampaign.tsx:", err);
}

// ─── 2. FIX MYBOOKINGS.TSX ───────────────────────────────────────────────────
try {
  let content = fs.readFileSync(myBookingsPath, 'utf8');

  const timelineCellOld = `                    <td className="px-4 md:px-8 py-6">
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                          <Clock size={10} /> {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </td>`;

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

  if (content.includes(timelineCellOld)) {
    content = content.replace(timelineCellOld, timelineCellNew);
  } else {
    // If spaces vary slightly, let's use a regex replace
    content = content.replace(
      /<td className="px-4 md:px-8 py-6">\s*<div className="space-y-1\.5">[\s\S]*?<\/td>/,
      timelineCellNew
    );
  }

  fs.writeFileSync(myBookingsPath, content, 'utf8');
  console.log("✅ Successfully updated MyBookings.tsx timeline displaying!");
} catch (err) {
  console.error("❌ Error updating MyBookings.tsx:", err);
}

// ─── 3. FIX APPROVALS.TSX ───────────────────────────────────────────────────
try {
  let content = fs.readFileSync(approvalsPath, 'utf8');

  const approvalsTimelineOld = `               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing & Duration</p>
                  <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{group.date}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {group.isInstant ? 'LIVE NOW' : \`\${formatTimeAMPM(group.startTime)} - \${formatTimeAMPM(group.endTime)}\`}
                        </span>
                     </div>
                     <div className="w-px h-8 bg-slate-200 mx-2" />
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">{group.isInstant ? \`\${group.duration} MINS\` : 'Standard'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                     </div>
                  </div>
               </div>`;

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

  if (content.includes(approvalsTimelineOld)) {
    content = content.replace(approvalsTimelineOld, approvalsTimelineNew);
  } else {
    // Fallback regex in case formatting differs slightly
    content = content.replace(
      /<div className="space-y-1">\s*<p className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest">Timing & Duration<\/p>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
      approvalsTimelineNew
    );
  }

  fs.writeFileSync(approvalsPath, content, 'utf8');
  console.log("✅ Successfully updated Approvals.tsx timeline display for Instant vs Manual bookings!");
} catch (err) {
  console.error("❌ Error updating Approvals.tsx:", err);
}
