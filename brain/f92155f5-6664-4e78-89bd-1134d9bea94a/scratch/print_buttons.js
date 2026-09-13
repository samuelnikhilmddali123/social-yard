const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

function printAround(pos, before = 150, after = 500) {
  console.log(`=== POSITION ${pos} ===`);
  console.log(content.slice(pos - before, pos + after));
}

printAround(81523);
printAround(83224);
