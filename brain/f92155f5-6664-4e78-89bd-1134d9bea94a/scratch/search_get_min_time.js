const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

let pos = content.indexOf("getMinTime");
while (pos !== -1) {
  console.log("Found getMinTime at:", pos);
  console.log(content.slice(pos - 100, pos + 200));
  pos = content.indexOf("getMinTime", pos + 1);
}
