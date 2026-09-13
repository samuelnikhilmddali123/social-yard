/**
 * =========================================================================================
 *  E3Di — Virtual ESP32 WiFi-to-BLE K100C Bridge Simulator
 * =========================================================================================
 *  Simulates the ESP32 hardware node on your Mac to test office dashboard commands & SOS.
 * =========================================================================================
 */

const https = require('https');

const DEVICE_ID = process.argv[2] || 'ethree-65';
const CLOUD_API = `https://www.e3di.org/api/screens/${DEVICE_ID}/k100c/poll`;
const SOS_API = `https://www.e3di.org/api/sos/trigger`;

console.log('====================================================================');
console.log(`🚀 [SIMULATOR] Starting Virtual ESP32 Node for Screen: [${DEVICE_ID}]`);
console.log(`📶 [WIFI] Connected to Cloud Gateway: https://www.e3di.org`);
console.log(`🔵 [BLE] Simulating K100C Bluetooth Controller Link (RSSI: -58dBm)`);
console.log('====================================================================');
console.log('👉 Open https://www.e3di.org/admin and click "K100C Control" to test!\n');

let lastPower = true;
let lastBrightness = 100;
let lastMode = 'normal';

function pollCloud() {
  https.get(CLOUD_API, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(raw);
        const power = data.power !== false;
        const brightness = data.brightness ?? 100;
        const mode = data.mode || 'normal';

        if (power !== lastPower || brightness !== lastBrightness || mode !== lastMode) {
          console.log(`\n📥 [NEW COMMAND RECEIVED FROM OFFICE DASHBOARD]`);
          console.log(`   ⚡ Hardware Power:   ${power ? '🟢 ON' : '🔴 OFF (STANDBY)'}`);
          console.log(`   💡 Brightness:       ${brightness}% (Hex: 0x${Math.round(brightness * 2.55).toString(16).toUpperCase()})`);
          console.log(`   🎨 Display Mode:     ${mode.toUpperCase()}`);
          console.log(`   📡 BLE Packet Sent:  [ 0xAA, 0x04, 0x${Math.round(brightness * 2.55).toString(16).toUpperCase()}, 0xFF ]`);
          console.log(`   ⏱️  Timestamp:       ${new Date().toLocaleTimeString('en-IN')}`);

          lastPower = power;
          lastBrightness = brightness;
          lastMode = mode;
        }
      } catch (err) { }
    });
  }).on('error', () => { });
}

// Poll every 2 seconds
setInterval(pollCloud, 2000);
pollCloud();
