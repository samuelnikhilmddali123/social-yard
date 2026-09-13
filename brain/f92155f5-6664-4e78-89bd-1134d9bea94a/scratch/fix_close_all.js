const fs = require('fs');
const filePath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `const closeAll = () => { setIsCalendarOpen(false); setIsStartTimeOpen(false); setIsEndTimeOpen(false); };`,
  `const closeAll = () => { setIsCalendarOpen(false); setIsStartTimeOpen(false); };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed closeAll successfully!");
