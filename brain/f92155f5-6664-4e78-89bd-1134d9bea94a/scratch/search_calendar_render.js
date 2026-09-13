const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

let pos = content.indexOf("isCalendarOpen");
while (pos !== -1) {
  console.log("Found isCalendarOpen at:", pos);
  console.log(content.slice(pos - 100, pos + 300));
  pos = content.indexOf("isCalendarOpen", pos + 1);
}
