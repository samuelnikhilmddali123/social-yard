const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

console.log("isStartTimeValid present?", content.includes("isStartTimeValid"));
console.log("getDurationLabel present?", content.includes("getDurationLabel"));
console.log("isDurationValid present?", content.includes("isDurationValid"));
