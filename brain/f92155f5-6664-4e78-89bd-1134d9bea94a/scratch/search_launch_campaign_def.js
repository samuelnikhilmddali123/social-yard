const fs = require('fs');
const lines = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const LaunchCampaign = () => {")) {
    console.log(`LaunchCampaign starts at line: ${i + 1}`);
    break;
  }
}
