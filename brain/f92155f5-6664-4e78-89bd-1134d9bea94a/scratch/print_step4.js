const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx", 'utf8').replace(/\r\n/g, '\n');

const idx = content.indexOf('step === 4');
if (idx !== -1) {
  const sub = content.slice(idx, idx + 5000);
  const durIdx = sub.indexOf('duration ?');
  if (durIdx !== -1) {
    console.log(sub.slice(durIdx - 500, durIdx + 500));
  } else {
    console.log("Could not find duration ? in Step 4");
  }
}
