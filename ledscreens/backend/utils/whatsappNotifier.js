const https = require('https');

// Admin members configuration — add coordinators here
const WHATSAPP_MEMBERS = [
  { 
    name: 'Jay (Admin)', 
    phone: process.env.ADMIN_WHATSAPP_PHONE_JAY || '917036923456', 
    apiKey: process.env.CALLMEBOT_API_KEY_JAY || '9513364' 
  },
  { 
    name: 'Admin 2', 
    phone: '919121266269', 
    apiKey: '9513364' 
  },
  { 
    name: 'Admin 3', 
    phone: '919063508918', 
    apiKey: '9513364' 
  }
];

/**
 * Sends WhatsApp alerts to all admin members via CallMeBot.
 * Returns a Promise that resolves only after all HTTP requests complete.
 * Required for Vercel serverless — unawaited calls get killed on res.json().
 */
const sendWhatsAppNotification = async (bookingDetails) => {
  const isInstant = !!bookingDetails.isInstant;

  const priceStr = bookingDetails.totalAmount
    ? '₹' + Number(bookingDetails.totalAmount).toLocaleString('en-IN')
    : '₹0';

  let textMessage = '';
  if (bookingDetails.isSOS) {
    const lat = bookingDetails.lat || 16.5062;
    const lng = bookingDetails.lng || 80.6480;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const cctvUrl = 'https://www.e3di.org/gov';
    const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

    textMessage = `🚨 *EMERGENCY ALERT: SOMEONE IS IN DANGER!* 🚨\n\n` +
      `⚠️ *A citizen has pressed the SOS Emergency Button on the Smart Pole!*\n\n` +
      `📍 *Location:* ${bookingDetails.location || 'Vijayawada MG Road Corridor'}\n` +
      `📌 *Pole ID:* ${bookingDetails.poleId || 'ETHREE-P01'}\n` +
      `📟 *Hardware Device:* ${bookingDetails.device || 'ESP32-SOS-01'}\n` +
      `🔋 *Device Battery:* ${bookingDetails.battery || 100}%\n` +
      `⏰ *Time of Incident:* ${timeStr}\n\n` +
      `🗺️ *Live Location Maps Link:*\n` +
      `${mapsUrl}\n\n` +
      `📹 *Live CCTV Camera & Emergency Command:*\n` +
      `${cctvUrl}\n\n` +
      `👉 *ACTION REQUIRED: Dispatch security and local emergency patrol immediately!*`;
  } else if (isInstant) {
    textMessage = `⚡ *NEW INSTANT AD PLAYBACK!*\n\n` +
      `👤 *Customer:* ${bookingDetails.bookedByName || 'N/A'}\n` +
      `📞 *Phone:* ${bookingDetails.bookedByPhone || 'N/A'}\n` +
      `✉️ *Email:* ${bookingDetails.bookedByEmail || 'N/A'}\n` +
      `📐 *Screen:* ${bookingDetails.format === '75-inch' ? '5×3 Feet (Pole 2)' : '5×3 Feet (Pole 1)'}\n` +
      `📅 *Playback Date:* Immediate (Today)\n` +
      `⏰ *Time:* Active Now\n` +
      `⏱️ *Duration:* ${bookingDetails.durationSeconds || 0}s\n` +
      `💰 *Price:* ${priceStr}\n\n` +
      `👉 _Instant loop triggered — approve in admin!_`;
  } else {
    textMessage = `🚨 *NEW E3Di CAMPAIGN BOOKED!*\n\n` +
      `👤 *Customer:* ${bookingDetails.bookedByName || 'N/A'}\n` +
      `📞 *Phone:* ${bookingDetails.bookedByPhone || 'N/A'}\n` +
      `✉️ *Email:* ${bookingDetails.bookedByEmail || 'N/A'}\n` +
      `📐 *Screen:* ${bookingDetails.format === '75-inch' ? '5×3 Feet (Pole 2)' : '5×3 Feet (Pole 1)'}\n` +
      `📅 *Start Date:* ${bookingDetails.date || 'N/A'}\n` +
      `⏰ *Time:* ${bookingDetails.startTime || 'N/A'} - ${bookingDetails.endTime || 'N/A'}\n` +
      `⏱️ *Duration:* ${bookingDetails.durationSeconds || 0}s\n` +
      `💰 *Price:* ${priceStr}\n\n` +
      `👉 _Please verify and approve in the Admin Dashboard!_`;
  }

  const encodedText = encodeURIComponent(textMessage);

  // Helper: wrap each GET request in a Promise so it can be awaited
  const sendToMember = (member) => new Promise((resolve) => {
    if (!member.phone || !member.apiKey) return resolve();

    const url = `https://api.callmebot.com/whatsapp.php?phone=${member.phone}&text=${encodedText}&apikey=${member.apiKey}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`📡 WhatsApp to ${member.name} (${member.phone}): HTTP ${res.statusCode}`);
        if (data && data.length < 300) console.log('  Response:', data.trim().substring(0, 200));
        resolve();
      });
    }).on('error', (err) => {
      console.error(`❌ WhatsApp failed for ${member.name}:`, err.message);
      resolve(); // resolve so Promise.allSettled doesn't block other notifiers
    });
  });

  // Fire all members in parallel and WAIT for all to complete
  await Promise.allSettled(WHATSAPP_MEMBERS.map(sendToMember));
};

module.exports = { sendWhatsAppNotification };
