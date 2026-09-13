const fs = require('fs');
const path = require('path');

const filePath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the exact block
  // We can do a string split by lines or a regex replace
  const lines = content.split(/\r?\n/);
  let replaced = false;
  
  for (let idx = 500; idx < 550; idx++) {
    if (lines[idx] && lines[idx].includes('</>')) {
      console.log(`Found broken fragment at line ${idx + 1}: ${lines[idx]}`);
      
      const indent = lines[idx].split('</>')[0];
      lines[idx] = `${indent}<div className="hidden lg:block absolute top-full left-0 mt-4 z-[9999] shadow-2xl">\n${indent}  <PremiumCalendar onDateSelect={d => { setStartDate(d); setIsCalendarOpen(false); }} selectedDate={startDate} />\n${indent}</div>`;
      replaced = true;
      break;
    }
  }
  
  if (replaced) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log("Successfully replaced broken fragment and saved the file!");
  } else {
    console.log("Could not find the target broken fragment in the range 500-550.");
  }
} catch (err) {
  console.error("Error reading/writing file:", err);
}
