const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

// Find all matches for "MapContainer"
let pos = content.indexOf("MapContainer");
while (pos !== -1) {
  console.log("Found MapContainer at:", pos);
  console.log(content.slice(pos - 100, pos + 300));
  pos = content.indexOf("MapContainer", pos + 1);
}
