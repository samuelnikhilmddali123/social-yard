const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

const pos = content.indexOf("{/* Minimal Legend */}");
if (pos !== -1) {
  console.log("=== MATCH FOR `{/* Minimal Legend */}` ===");
  console.log(content.slice(pos - 600, pos + 100));
} else {
  console.log("=== NO MATCH FOR `{/* Minimal Legend */}` ===");
}
