const fs = require('fs');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";
const myBookingsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\MyBookings.tsx";
const approvalsPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\admin\\Approvals.tsx";

// ─── 1. UPGRADE LAUNCHCAMPAIGN.TSX ──────────────────────────────────────────
try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // A. Replace all state and helper references of instantDuration/setInstantDuration with campaignDuration/setCampaignDuration
  content = content.replace(/instantDuration/g, 'campaignDuration');
  content = content.replace(/setInstantDuration/g, 'setCampaignDuration');

  // Set the default campaign duration to 60 (instead of 0) so that there's always a valid initial duration
  content = content.replace(
    `const [campaignDuration, setCampaignDuration] = useState(0);`,
    `const [campaignDuration, setCampaignDuration] = useState(60);`
  );

  // B. Define the exact duration validation helpers using ONLY getMinTime as the search target!
  const getMinTimeTarget = `  // Enforce 30-minute buffer validation for MANUAL bookings when date is TODAY
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
  };`;

  const newMinTimeAndHelpers = `  // Enforce 30-minute buffer validation for MANUAL bookings when date is TODAY
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

  const isStartTimeValid = (() => {
    if (isInstant) return true;
    const minTime = getMinTime();
    if (!minTime) return true;
    const [sh, sm] = startTime.split(':').map(Number);
    const [mh, mm] = minTime.split(':').map(Number);
    return (sh > mh || (sh === mh && sm >= mm));
  })();

  const isDurationValid = campaignDuration > 0 && isStartTimeValid;

  const getDurationLabel = () => {
    const mins = campaignDuration;
    if (mins <= 0) return "";
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    
    let label = "Campaign Duration: ";
    if (hrs > 0) {
      label += \`\${hrs} hr\${hrs > 1 ? 's' : ''}\`;
      if (remMins > 0) {
        label += \` \${remMins} min\${remMins > 1 ? 's' : ''}\`;
      }
    } else {
      label += \`\${remMins} min\${remMins > 1 ? 's' : ''}\`;
    }
    return label;
  };`;

  if (content.includes(getMinTimeTarget)) {
    content = content.replace(getMinTimeTarget, newMinTimeAndHelpers);
    console.log("-> replaced getMinTime and injected helpers successfully!");
  } else {
    console.log("-> could not find getMinTimeTarget!");
  }

  // C. Update the realtime calculation of endTime in the useEffect
  const oldUseEffect = `  useEffect(() => {
    let interval: any;
    if (isInstant) {
      interval = setInterval(() => {
        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
        const startStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        setStartTime(startStr);
        
        if (campaignDuration > 0) {
          const end = new Date(now.getTime() + campaignDuration * 60000);
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
  }, [isInstant, campaignDuration, startDate, startTime]);`;

  const newUseEffect = `  useEffect(() => {
    let interval: any;
    if (isInstant) {
      interval = setInterval(() => {
        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
        const startStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        setStartTime(startStr);
        
        if (campaignDuration > 0) {
          const end = new Date(now.getTime() + campaignDuration * 60000);
          setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
        }
      }, 5000);
    } else {
      // MANUAL Mode: Enforce 30-minute buffer and auto-calculate endTime
      const minTime = getMinTime();
      if (minTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [mh, mm] = minTime.split(':').map(Number);
        if (sh < mh || (sh === mh && sm < mm)) {
          setStartTime(minTime);
        }
      }
      
      if (startTime && campaignDuration > 0) {
        const [sh, sm] = startTime.split(':').map(Number);
        let endMins = sh * 60 + sm + campaignDuration;
        if (endMins >= 24 * 60) {
          endMins = 23 * 59;
        }
        const h = Math.floor(endMins / 60);
        const m = endMins % 60;
        setEndTime(h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0'));
      }
    }
    return () => clearInterval(interval);
  }, [isInstant, campaignDuration, startDate, startTime]);`;

  if (content.includes(oldUseEffect)) {
    content = content.replace(oldUseEffect, newUseEffect);
    console.log("-> replaced useEffect calculation block!");
  } else {
    console.log("-> could not find oldUseEffect!");
  }

  // D. Update the duration variable that is used for cost calculation
  // (In manual bookings it previously calculated end - start. Now it should simply be campaignDuration / 60!)
  const oldDurationCalc = `  const duration = (() => {
    if (!startDate) return 0;
    const diff = (new Date(\`\${startDate}T\${endTime}\`).getTime() - new Date(\`\${startDate}T\${startTime}\`).getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  })();`;

  const newDurationCalc = `  const duration = campaignDuration / 60;`;

  content = content.replace(oldDurationCalc, newDurationCalc);

  // E. Replace step 4 reviews: pass campaignDuration to all createBooking triggers
  content = content.replace(
    `duration: isInstant ? campaignDuration : undefined`,
    `duration: campaignDuration`
  );

  // F. Clean up unused state `isEndTimeOpen`
  content = content.replace(
    `const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);`,
    `// const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);`
  );

  // G. Replace Availability Bar's layout to remove End Time section and replace with the unified Duration Selector
  const targetParentStart = `w items-start sm:items-center gap-4 lg:gap-10 relative z-10 w-full lg:w-auto">`;
  const startIdx = content.indexOf(targetParentStart);

  if (startIdx !== -1) {
    const subStr = content.slice(startIdx);
    const endTarget = `                     )}\n{/* Minimal Legend */}`;
    const endTargetIdx = subStr.indexOf(endTarget);
    
    if (endTargetIdx !== -1) {
      const absoluteEndIdx = startIdx + endTargetIdx + endTarget.length;
      
      const part1 = content.slice(0, startIdx + targetParentStart.length);
      const part2 = content.slice(absoluteEndIdx);
      
      const newInnerSection = `\n                     {/* Unified Playback Section */}\n` + 
                            `                     <div className="flex flex-col items-start gap-1.5 w-full lg:w-auto">\n` + 
                            `                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8 w-full lg:w-auto">\n` + 
                            `                           \n` + 
                            `                           {!isInstant && (\n` + 
                            `                             <>\n` + 
                            `                               {/* Date Picker Section */}\n` + 
                            `                               <div className="flex items-center justify-between w-full sm:w-auto gap-4">\n` + 
                            `                                 <div className="flex items-center gap-3 md:gap-5">\n` + 
                            `                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-indigo-500/20 group cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }}>\n` + 
                            `                                       <CalendarIcon className="text-indigo-400 group-hover:scale-110 transition-transform" size={18} />\n` + 
                            `                                    </div>\n` + 
                            `                                    <div className="relative">\n` + 
                            `                                       <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Campaign Date</p>\n` + 
                            `                                       <button onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }} className="text-white font-black text-xs md:text-sm hover:text-indigo-400 transition-colors flex items-center gap-2">\n` + 
                            `                                          {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}\n` + 
                            `                                       </button>\n` + 
                            `                                    </div>\n` + 
                            `                                 </div>\n` + 
                            `                               </div>\n` + 
                            `\n` + 
                            `                               <div className="hidden lg:block h-10 w-px bg-white/10" />\n` + 
                            `\n` + 
                            `                               {/* Start Time Section */}\n` + 
                            `                               <div className="relative">\n` + 
                            `                                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Start Time</p>\n` + 
                            `                                  <button onClick={() => { closeAll(); setIsStartTimeOpen(!isStartTimeOpen); }} className="text-white font-black text-xs md:text-sm hover:text-indigo-400 transition-colors">\n` + 
                            `                                     {formatTimeAMPM(startTime)}\n` + 
                            `                                  </button>\n` + 
                            `                                  <AnimatePresence>\n` + 
                            `                                    {isStartTimeOpen && (\n` + 
                            `                                      <div className="absolute top-full left-0 mt-4 z-[9999] shadow-2xl">\n` + 
                            `                                        <PremiumTimePicker value={startTime} onChange={v => { setStartTime(v); setIsStartTimeOpen(false); }} minTime={getMinTime()} />\n` + 
                            `                                      </div>\n` + 
                            `                                    )}\n` + 
                            `                                  </AnimatePresence>\n` + 
                            `                               </div>\n` + 
                            `\n` + 
                            `                               <div className="hidden lg:block h-10 w-px bg-white/10" />\n` + 
                            `                             </>\n` + 
                            `                           )}\n` + 
                            `\n` + 
                            `                           {isInstant && (\n` + 
                            `                             <div className="flex items-center gap-3 py-1.5 px-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">\n` + 
                            `                               <Zap className="text-indigo-400 animate-pulse" size={14} />\n` + 
                            `                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">⚡ Instant Playback Mode (Active)</span>\n` + 
                            `                             </div>\n` + 
                            `                           )}\n` + 
                            `\n` + 
                            `                           {/* Unified Duration Picker Section */}\n` + 
                            `                           <div className="flex flex-col gap-1 w-full lg:w-auto">\n` + 
                            `                              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Campaign Duration</p>\n` + 
                            `                              <div className="flex flex-wrap items-center gap-2">\n` + 
                            `                                {(isInstant \n` + 
                            `                                  ? [\n` + 
                            `                                      { label: '15m', value: 15 },\n` + 
                            `                                      { label: '30m', value: 30 },\n` + 
                            `                                      { label: '1h', value: 60 },\n` + 
                            `                                      { label: '2h', value: 120 },\n` + 
                            `                                      { label: '3h', value: 180 },\n` + 
                            `                                      { label: 'Custom', value: 'custom' }\n` + 
                            `                                    ]\n` + 
                            `                                  : [\n` + 
                            `                                      { label: '1m', value: 1 },\n` + 
                            `                                      { label: '5m', value: 5 },\n` + 
                            `                                      { label: '15m', value: 15 },\n` + 
                            `                                      { label: '30m', value: 30 },\n` + 
                            `                                      { label: '1h', value: 60 },\n` + 
                            `                                      { label: '2h', value: 120 },\n` + 
                            `                                      { label: 'Custom', value: 'custom' }\n` + 
                            `                                    ]\n` + 
                            `                                ).map((opt) => {\n` + 
                            `                                  const isSelected = opt.value === 'custom'\n` + 
                            `                                    ? !(isInstant \n` + 
                            `                                        ? [15, 30, 60, 120, 180].includes(campaignDuration)\n` + 
                            `                                        : [1, 5, 15, 30, 60, 120].includes(campaignDuration))\n` + 
                            `                                    : campaignDuration === opt.value;\n` + 
                            `                                  return (\n` + 
                            `                                    <button\n` + 
                            `                                      key={opt.label}\n` + 
                            `                                      type="button"\n` + 
                            `                                      onClick={() => {\n` + 
                            `                                        if (opt.value === 'custom') {\n` + 
                            `                                          setCampaignDuration(45);\n` + 
                            `                                        } else {\n` + 
                            `                                          setCampaignDuration(opt.value as number);\n` + 
                            `                                        }\n` + 
                            `                                      }}\n` + 
                            `                                      className={\`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all \${\n` + 
                            `                                        isSelected \n` + 
                            `                                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' \n` + 
                            `                                          : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'\n` + 
                            `                                      }\`}\n` + 
                            `                                    >\n` + 
                            `                                      {opt.label}\n` + 
                            `                                    </button>\n` + 
                            `                                  );\n` + 
                            `                                })}\n` + 
                            `\n` + 
                            `                                {!(isInstant \n` + 
                            `                                    ? [15, 30, 60, 120, 180].includes(campaignDuration)\n` + 
                            `                                    : [1, 5, 15, 30, 60, 120].includes(campaignDuration)) && (\n` + 
                            `                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-lg ml-1">\n` + 
                            `                                    <input \n` + 
                            `                                      type="number" \n` + 
                            `                                      className="w-10 bg-transparent text-white font-black text-xs outline-none border-b border-indigo-500/50 focus:border-indigo-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"\n` + 
                            `                                      value={campaignDuration}\n` + 
                            `                                      onChange={(e) => setCampaignDuration(parseInt(e.target.value) || 0)}\n` + 
                            `                                    />\n` + 
                            `                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Mins</span>\n` + 
                            `                                  </div>\n` + 
                            `                                )}\n` + 
                            `                              </div>\n` + 
                            `                           </div>\n` + 
                            `\n` + 
                            `                        </div>\n` + 
                            `\n` + 
                            `                        {/* Realtime calculations preview (Ends At, Campaign Duration, Error Alerts) */}\n` + 
                            `                        <div className="mt-1 flex flex-wrap items-center gap-3">\n` + 
                            `                           {campaignDuration > 0 ? (\n` + 
                            `                             <>\n` + 
                            `                               {!isInstant && (\n` + 
                            `                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">\n` + 
                            `                                    🏁 Campaign Ends At: {formatTimeAMPM(endTime)}\n` + 
                            `                                 </span>\n` + 
                            `                               )}\n` + 
                            `                               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">\n` + 
                            `                                 ⚡ {getDurationLabel()}\n` + 
                            `                               </span>\n` + 
                            `                             </>\n` + 
                            `                           ) : (\n` + 
                            `                             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">\n` + 
                            `                               ⚠️ Campaign duration must be greater than 0.\n` + 
                            `                             </span>\n` + 
                            `                           )}\n` + 
                            `                           \n` + 
                            `                           {!isInstant && !isStartTimeValid && (\n` + 
                            `                             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">\n` + 
                            `                               ⚠️ Start time must be at least 30 mins from now.\n` + 
                            `                             </span>\n` + 
                            `                           )}\n` + 
                            `                        </div>\n` + 
                            `                     </div>\n` + 
                            `                     {/* Minimal Legend */}`;
      
      content = part1 + newInnerSection + part2;
      console.log("-> replaced Availability Bar layout successfully!");
    } else {
      console.log("-> could not find endTarget inside Availability Bar!");
    }
  } else {
    console.log("-> could not find targetParentStart!");
  }

  // G. Update mobile / desktop button disabling and labeling states
  // Mobile button disabled state:
  const searchMobileButton = `                         <button
                           onClick={handleContinueToStep3}
                           disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict) || (!isInstant && !isDurationValid)}
                           className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           {isCorridorConflict ? 'Unavailable' : 'Continue'}`;

  const replaceMobileButton = `                         <button
                           onClick={handleContinueToStep3}
                           disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict) || !isDurationValid}
                           className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           {!isDurationValid ? (!isStartTimeValid ? 'Start time must be at least 30 mins from now.' : 'Duration must be greater than 0.') : (isCorridorConflict ? 'Unavailable' : 'Continue')}`;

  content = content.replace(searchMobileButton, replaceMobileButton);

  // Desktop button disabled state:
  const searchDesktopButton = `                 <button
                    onClick={handleContinueToStep3}
                    disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict)}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                 >
                    {isCorridorConflict ? 'Unavailable' : 'Continue'}`;

  const replaceDesktopButton = `                 <button
                    onClick={handleContinueToStep3}
                    disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict) || !isDurationValid}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                 >
                    {!isDurationValid ? (!isStartTimeValid ? 'Start time is too early' : 'Invalid Duration') : (isCorridorConflict ? 'Unavailable' : 'Continue')}`;

  content = content.replace(searchDesktopButton, replaceDesktopButton);

  // H. Replace step 4 timeline list formatting
  const step4TimelineOld = `                    {[
                      isInstant && { label: 'Booking Type', value: '⚡ INSTANT BROADCAST' },
                      isInstant && { label: 'Start Time', value: 'Will begin after admin approval' },
                      !isInstant && { label: 'Date', value: startDate ? \`\${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}\` : '—' },
                      !isInstant && { label: 'Start Time', value: formatTimeAMPM(startTime) },
                      !isInstant && { label: 'End Time', value: formatTimeAMPM(endTime) },
                      { label: 'Duration', value: isInstant ? \`\${campaignDuration} minutes\` : (duration ? \`\${duration.toFixed(1)} hours\` : '—') },
                    ].filter(Boolean).map((item: any) => (`;

  const step4TimelineNew = `                    {[
                      isInstant && { label: 'Booking Type', value: '⚡ INSTANT BROADCAST' },
                      isInstant && { label: 'Start Time', value: 'Will begin after admin approval' },
                      !isInstant && { label: 'Date', value: startDate ? \`\${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}\` : '—' },
                      !isInstant && { label: 'Start Time', value: formatTimeAMPM(startTime) },
                      !isInstant && { label: 'Auto End Time', value: formatTimeAMPM(endTime) },
                      { label: 'Campaign Duration', value: \`\${campaignDuration} min\${campaignDuration > 1 ? 's' : ''}\` },
                    ].filter(Boolean).map((item: any) => (`;

  content = content.replace(step4TimelineOld, step4TimelineNew);

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully upgraded LaunchCampaign.tsx to Duration-based booking!");

} catch (err) {
  console.error("❌ Error upgrading LaunchCampaign.tsx:", err);
}

// ─── 2. UPGRADE MYBOOKINGS.TSX ───────────────────────────────────────────────
try {
  let content = fs.readFileSync(myBookingsPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Insert calculateDuration helper right after standard top imports
  const targetImport = `import { motion } from 'framer-motion';`;
  const newImports = `import { motion } from 'framer-motion';

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
};`;

  content = content.replace(targetImport, newImports);

  // Update timeline duration displays to show dynamic duration for manual bookings too!
  const oldTimelineClock = `                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                          <Clock size={10} />{' '}
                          {booking.isInstant
                            ? booking.status === 'pending'
                              ? \`Will begin after approval (\${booking.duration || 60}m)\`
                              : \`\${booking.startTime} - \${booking.endTime} (\${booking.duration || 60}m)\`
                            : \`\${booking.startTime} - \${booking.endTime}\`}
                        </p>`;

  const newTimelineClock = `                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                          <Clock size={10} />{' '}
                          {booking.isInstant
                            ? booking.status === 'pending'
                              ? \`Will begin after approval (\${booking.duration || 60}m)\`
                              : \`\${booking.startTime} - \${booking.endTime} (\${booking.duration || 60}m)\`
                            : \`\${booking.startTime} - \${booking.endTime} (\${booking.duration || calculateDuration(booking.startTime, booking.endTime)}m)\`}
                        </p>`;

  content = content.replace(oldTimelineClock, newTimelineClock);

  fs.writeFileSync(myBookingsPath, content, 'utf8');
  console.log("✅ Successfully updated MyBookings.tsx manual duration displays!");
} catch (err) {
  console.error("❌ Error updating MyBookings.tsx:", err);
}

// ─── 3. UPGRADE APPROVALS.TSX ───────────────────────────────────────────────
try {
  let content = fs.readFileSync(approvalsPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Insert calculateDuration helper right after standard top imports
  const targetImport = `import React from 'react';`;
  const newImports = `import React from 'react';

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
};`;

  content = content.replace(targetImport, newImports);

  // Update approvals timeline display
  const oldApprovalsClock = `                     <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">
                          {group.isInstant ? \`\${group.duration} MINS\` : 'Standard'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                     </div>`;

  const newApprovalsClock = `                     <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">
                          {group.isInstant ? \`\${group.duration} MINS\` : \`\${group.duration || calculateDuration(group.startTime, group.endTime)} MINS\`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                     </div>`;

  content = content.replace(oldApprovalsClock, newApprovalsClock);

  fs.writeFileSync(approvalsPath, content, 'utf8');
  console.log("✅ Successfully updated Approvals.tsx manual duration displays!");
} catch (err) {
  console.error("❌ Error updating Approvals.tsx:", err);
}
