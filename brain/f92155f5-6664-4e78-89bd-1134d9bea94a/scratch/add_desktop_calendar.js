const fs = require('fs');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";

try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Locate the Date Picker section and add `relative` to the container and the `<AnimatePresence>` for the desktop calendar
  const oldDatePickerSection = `                               {/* Date Picker Section */}
                               <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                 <div className="flex items-center gap-3 md:gap-5">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-indigo-500/20 group cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }}>
                                       <CalendarIcon className="text-indigo-400 group-hover:scale-110 transition-transform" size={18} />
                                    </div>
                                    <div className="relative">
                                       <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Campaign Date</p>
                                       <button onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }} className="text-white font-black text-xs md:text-sm hover:text-indigo-400 transition-colors flex items-center gap-2">
                                          {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                                       </button>
                                    </div>
                                 </div>
                               </div>`;

  const newDatePickerSection = `                               {/* Date Picker Section */}
                               <div className="flex items-center justify-between w-full sm:w-auto gap-4 relative">
                                 <div className="flex items-center gap-3 md:gap-5">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-indigo-500/20 group cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }}>
                                       <CalendarIcon className="text-indigo-400 group-hover:scale-110 transition-transform" size={18} />
                                    </div>
                                    <div className="relative">
                                       <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Campaign Date</p>
                                       <button onClick={() => { closeAll(); setTempStartDate(startDate); setIsCalendarOpen(!isCalendarOpen); }} className="text-white font-black text-xs md:text-sm hover:text-indigo-400 transition-colors flex items-center gap-2">
                                          {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                                       </button>
                                    </div>
                                 </div>
                                 <AnimatePresence>
                                   {isCalendarOpen && (
                                     <div className="hidden lg:block absolute top-full left-0 mt-4 z-[9999] shadow-2xl bg-white rounded-3xl p-5 border border-slate-100 min-w-[320px]">
                                       <PremiumCalendar 
                                         onDateSelect={d => {
                                           setStartDate(d);
                                           setIsCalendarOpen(false);
                                         }} 
                                         selectedDate={startDate} 
                                       />
                                     </div>
                                   )}
                                 </AnimatePresence>
                               </div>`;

  if (content.includes(oldDatePickerSection)) {
    content = content.replace(oldDatePickerSection, newDatePickerSection);
    console.log("-> replaced Date Picker Section with the desktop calendar container successfully!");
  } else {
    console.log("-> could not find oldDatePickerSection!");
  }

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully updated LaunchCampaign.tsx with a premium responsive calendar!");

} catch (err) {
  console.error("❌ Error adding desktop calendar:", err);
}
