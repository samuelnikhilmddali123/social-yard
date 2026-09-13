const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

// Find all matches for PremiumDatePicker or DatePicker
let pos = content.indexOf("DatePicker");
while (pos !== -1) {
  console.log("Found DatePicker at:", pos);
  console.log(content.slice(pos - 100, pos + 300));
  pos = content.indexOf("DatePicker", pos + 1);
}
