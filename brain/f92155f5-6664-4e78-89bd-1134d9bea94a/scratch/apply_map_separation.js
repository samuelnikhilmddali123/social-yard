const fs = require('fs');

const launchCampaignPath = "c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\LaunchCampaign.tsx";

try {
  let content = fs.readFileSync(launchCampaignPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Locate the Popup block inside the Marker loop and wrap it with width conditional checks
  const oldPopupPart = `                              <div className="hidden lg:block">
                                <Popup className="premium-popup">`;

  const newPopupPart = `                              {window.innerWidth >= 1024 && (
                                <Popup className="premium-popup">`;

  if (content.includes(oldPopupPart)) {
    content = content.replace(oldPopupPart, newPopupPart);
    console.log("-> replaced starting div tag with conditional window.innerWidth check!");
  } else {
    console.log("-> could not find oldPopupPart!");
  }

  const oldPopupEndPart = `                                </Popup>
                              </div>`;

  const newPopupEndPart = `                                </Popup>
                              )}`;

  if (content.includes(oldPopupEndPart)) {
    content = content.replace(oldPopupEndPart, newPopupEndPart);
    console.log("-> replaced closing div tag with conditional closing tag!");
  } else {
    console.log("-> could not find oldPopupEndPart!");
  }

  fs.writeFileSync(launchCampaignPath, content, 'utf8');
  console.log("✅ Successfully separated desktop popup overlay from mobile map!");

} catch (err) {
  console.error("❌ Error applying map separation:", err);
}
