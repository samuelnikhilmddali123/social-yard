const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

function printMatch(keyword, before = 100, after = 1500) {
  const index = content.indexOf(keyword);
  if (index !== -1) {
    console.log(`=== MATCH FOR "${keyword}" ===`);
    console.log(content.slice(index - before, index + after));
  } else {
    console.log(`=== NO MATCH FOR "${keyword}" ===`);
  }
}

printMatch("handleContinueToStep3", 100, 1500);
