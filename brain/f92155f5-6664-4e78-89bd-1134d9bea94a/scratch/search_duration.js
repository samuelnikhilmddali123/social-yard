const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

let pos = content.indexOf("duration");
while (pos !== -1) {
  console.log("Found duration at:", pos);
  console.log(content.slice(pos - 50, pos + 150));
  pos = content.indexOf("duration", pos + 1);
}
