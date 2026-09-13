const fs = require('fs');
const lines = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n').split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("const isStartTimeValid")) {
    console.log(`DECLARED isStartTimeValid at line: ${i + 1}`);
  }
  if (line.includes("const getDurationLabel")) {
    console.log(`DECLARED getDurationLabel at line: ${i + 1}`);
  }
  if (line.includes("const isDurationValid")) {
    console.log(`DECLARED isDurationValid at line: ${i + 1}`);
  }
  if (line.includes("isStartTimeValid") && !line.includes("const isStartTimeValid")) {
    console.log(`USED isStartTimeValid at line: ${i + 1}: ${line.trim()}`);
  }
  if (line.includes("getDurationLabel") && !line.includes("const getDurationLabel")) {
    console.log(`USED getDurationLabel at line: ${i + 1}: ${line.trim()}`);
  }
  if (line.includes("isDurationValid") && !line.includes("const isDurationValid")) {
    console.log(`USED isDurationValid at line: ${i + 1}: ${line.trim()}`);
  }
}
