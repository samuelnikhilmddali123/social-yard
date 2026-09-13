const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

const pos = content.indexOf("{!isInstant ? (");
if (pos !== -1) {
  console.log("=== MATCH FOR `{!isInstant ? (` ===");
  console.log(content.slice(pos - 100, pos + 800));
} else {
  console.log("=== NO MATCH FOR `{!isInstant ? (` ===");
}
