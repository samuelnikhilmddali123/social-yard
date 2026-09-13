const fs = require('fs');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";

try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Define getCampaignDurationInMinutes, getDurationLabel, isDurationValid
  const newHelpers = `  // Enforce 30-minute buffer validation for MANUAL bookings when date is TODAY
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

  const getCampaignDurationInMinutes = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return endMins - startMins;
  };

  const isDurationValid = isInstant || getCampaignDurationInMinutes() >= 1;

  const getDurationLabel = () => {
    if (isInstant) {
      return \`Campaign Duration: \${instantDuration} min\${instantDuration > 1 ? 's' : ''}\`;
    }
    const mins = getCampaignDurationInMinutes();
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

  // Locate the start of getMinTime definition and replace it to include our helpers
  content = content.replace(/\/\/ Enforce 30-minute buffer validation for MANUAL bookings when date is TODAY[\s\S]*?return undefined;\s*};/, newHelpers);

  // 2. Implement rule 6: Auto-update behavior inside the useEffect
  // When startTime changes, automatically set endTime to: startTime + 1 minute
  const searchEffect = `      // MANUAL Mode: Auto-enforce 30-minute buffer for TODAY bookings
      const minTime = getMinTime();`;

  const replaceEffect = `      // MANUAL Mode: Auto-enforce 30-minute buffer for TODAY bookings
      const minTime = getMinTime();
      
      // Auto-update end time to: start time + 1 minute
      if (startTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        let endMins = sh * 60 + sm + 1;
        if (endMins >= 24 * 60) {
          endMins = 23 * 59;
        }
        const h = Math.floor(endMins / 60);
        const m = endMins % 60;
        const autoEndTime = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
        
        // Only set it if end time is currently less than or equal to start time
        const [eh, em] = endTime.split(':').map(Number);
        if (eh * 60 + em <= sh * 60 + sm) {
          setEndTime(autoEndTime);
        }
      }`;

  content = content.replace(searchEffect, replaceEffect);

  // 3. Render the duration preview below start/end time picker in Availability Bar
  const targetParentStart = `<div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">`;
  const startIdx = content.indexOf(targetParentStart);

  if (startIdx !== -1) {
    const subStr = content.slice(startIdx);
    const endTarget = `</AnimatePresence>\n                       </div>\n                    </div>`;
    const endTargetIdx = subStr.indexOf(endTarget);
    
    if (endTargetIdx !== -1) {
      const absoluteEndIdx = startIdx + endTargetIdx + endTarget.length;
      
      const part1 = content.slice(0, startIdx);
      const middle = content.slice(startIdx, absoluteEndIdx);
      const part2 = content.slice(absoluteEndIdx);
      
      const wrappedMiddle = `<div className="flex flex-col items-start gap-1">\n                       ` + 
                            middle + 
                            `\n                       {!isInstant && (\n` + 
                            `                         <div className="mt-1">\n` + 
                            `                           {getCampaignDurationInMinutes() >= 1 ? (\n` + 
                            `                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">\n` + 
                            `                               ⚡ {getDurationLabel()}\n` + 
                            `                             </span>\n` + 
                            `                           ) : (\n` + 
                            `                             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">\n` + 
                            `                               ⚠️ End time must be later than start time.\n` + 
                            `                             </span>\n` + 
                            `                           )}\n` + 
                            `                         </div>\n` + 
                            `                       )}\n` + 
                            `                     </div>`;
                            
      content = part1 + wrappedMiddle + part2;
      console.log("-> replaced Time Window Section with precise index-based wrapping successfully!");
    } else {
      console.log("-> could not find endTarget inside Time Window Section!");
    }
  } else {
    console.log("-> could not find targetParentStart!");
  }

  // 4. Update the Continue buttons' disabled states and label displays
  // Mobile button disabled state and label:
  const searchMobileButton = `                         <button
                           onClick={handleContinueToStep3}
                           disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict)}
                           className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           {isCorridorConflict ? 'Unavailable' : 'Continue'}`;

  const replaceMobileButton = `                         <button
                           onClick={handleContinueToStep3}
                           disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict) || (!isInstant && !isDurationValid)}
                           className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           {!isInstant && !isDurationValid ? 'End time must be later than start time.' : (isCorridorConflict ? 'Unavailable' : 'Continue')}`;

  content = content.replace(searchMobileButton, replaceMobileButton);

  // Desktop button disabled state and label:
  const searchDesktopButton = `                 <button
                    onClick={handleContinueToStep3}
                    disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict)}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                 >
                    {isCorridorConflict ? 'Unavailable' : 'Continue'}`;

  const replaceDesktopButton = `                 <button
                    onClick={handleContinueToStep3}
                    disabled={selectedScreenIds.length === 0 || (bookingType === 'full-corridor' && isCorridorConflict) || (!isInstant && !isDurationValid)}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                 >
                    {!isInstant && !isDurationValid ? 'End time must be later than start time.' : (isCorridorConflict ? 'Unavailable' : 'Continue')}`;

  content = content.replace(searchDesktopButton, replaceDesktopButton);

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully implemented Campaign Duration Validation rules!");

} catch (err) {
  console.error("❌ Error applying duration validations:", err);
}
