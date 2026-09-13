const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

// Find all indexes of handleContinueToStep3
let pos = content.indexOf("handleContinueToStep3");
while (pos !== -1) {
  console.log("Found at position:", pos);
  console.log(content.slice(pos - 100, pos + 500));
  pos = content.indexOf("handleContinueToStep3", pos + 1);
}
