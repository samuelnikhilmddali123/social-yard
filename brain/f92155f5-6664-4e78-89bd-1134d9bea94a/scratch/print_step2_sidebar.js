const fs = require('fs');
const lines = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n').split('\n');

for (let i = 1250; i <= 1400; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
