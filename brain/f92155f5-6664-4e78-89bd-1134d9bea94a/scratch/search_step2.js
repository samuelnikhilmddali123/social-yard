const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

// Find where `step === 2` starts rendering
let pos = content.indexOf("step === 2");
while (pos !== -1) {
  console.log("Found step === 2 at:", pos);
  console.log(content.slice(pos - 100, pos + 300));
  pos = content.indexOf("step === 2", pos + 1);
}
