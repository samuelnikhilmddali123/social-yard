const https = require('https');

/**
 * Sends a Telegram notification to each chat ID.
 * Returns a Promise that resolves only after all HTTP requests complete.
 * This is required for Vercel serverless — unawaited calls are killed after res.json().
 */
const sendTelegramNotification = async (bookingDetails) => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8945142883:AAE2UFeMb6yTpDeSLSGf4bpE4SkQdGYWHVE';
  const chatIdsStr = process.env.TELEGRAM_CHAT_ID || '5339906035,1394203398,8918767093';

  if (!token || !chatIdsStr) {
    console.log('ℹ️ Telegram notification skipped: no token/chatId configured.');
    return;
  }

  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(Boolean);

  const isInstant = !!bookingDetails.isInstant;

  const isFreeTrial = !!bookingDetails.isFreeTrial;
  const priceStr = bookingDetails.totalAmount
    ? '₹' + Number(bookingDetails.totalAmount).toLocaleString('en-IN')
    : '₹0';

  let textMessage = '';

  if (bookingDetails.isSOS) {
    const lat = bookingDetails.lat || 16.5062;
    const lng = bookingDetails.lng || 80.6480;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

    const rawPole = bookingDetails.poleId || '';
    const cleanPole = String(rawPole).toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPole2 = cleanPole.includes('p02') || cleanPole.includes('pole2') || cleanPole.endsWith('2') || cleanPole === '2';
    const poleLabel = isPole2 ? 'Smart Pole 2 (ETHREE-P02)' : 'Smart Pole 1 (ETHREE-P01)';
    const camName = isPole2 ? 'Smart Pole 2 Camera (sparsh-main)' : 'Smart Pole 1 Camera (sparsh-cam2)';

    textMessage = `🚨 <b>EMERGENCY ALERT: SOMEONE IS IN DANGER!</b> 🚨\n\n` +
      `⚠️ <b>A citizen has pressed the SOS Emergency Button on the Smart Pole!</b>\n\n` +
      `📍 <b>Location:</b> ${bookingDetails.location || 'Vijayawada MG Road Corridor'}\n` +
      `📌 <b>Smart Pole:</b> ${poleLabel}\n` +
      `📟 <b>Hardware Device:</b> ${bookingDetails.device || 'ESP32-SOS-01'}\n` +
      `🔋 <b>Device Battery:</b> ${bookingDetails.battery || 100}%\n` +
      `⏰ <b>Time of Incident:</b> ${timeStr}\n\n` +
      `🗺️ <b>Live Location Maps Link:</b>\n` +
      `${mapsUrl}\n\n` +
      `📹 <b>CCTV Footage:</b> <i>Latest 30-second camera footage (${camName}) recorded at this timestamp is attached below 👇</i>\n\n` +
      `👉 <b>ACTION REQUIRED:</b> <i>Dispatch security and local emergency patrol immediately!</i>`;
  } else if (isInstant) {
    textMessage = `⚡ <b>NEW INSTANT AD PLAYBACK!</b>\n\n` +
      (isFreeTrial ? `🎁 <b>WELCOME TRIAL APPLIED (10s Free)</b>\n` : '') +
      `👤 <b>Customer:</b> ${bookingDetails.bookedByName || 'N/A'}\n` +
      `📞 <b>Phone:</b> ${bookingDetails.bookedByPhone || 'N/A'}\n` +
      `✉️ <b>Email:</b> ${bookingDetails.bookedByEmail || 'N/A'}\n` +
      `📐 <b>Screen Size:</b> ${bookingDetails.format === '75-inch' ? '5×3 Feet (Pole 2)' : '5×3 Feet (Pole 1)'}\n` +
      `📅 <b>Playback Date:</b> Immediate (Today)\n` +
      `⏰ <b>Playback Time:</b> Active Now\n` +
      `⏱️ <b>Duration:</b> ${bookingDetails.durationSeconds || 0}s\n` +
      `💰 <b>Price:</b> ${priceStr}${isFreeTrial ? ' (Discounted)' : ''}\n\n` +
      `👉 <i>Instant loop triggered — please approve in admin!</i>`;
  } else {
    textMessage = `🚨 <b>NEW E3Di CAMPAIGN BOOKED!</b>\n\n` +
      (isFreeTrial ? `🎁 <b>WELCOME TRIAL APPLIED (10s Free)</b>\n` : '') +
      `👤 <b>Customer:</b> ${bookingDetails.bookedByName || 'N/A'}\n` +
      `📞 <b>Phone:</b> ${bookingDetails.bookedByPhone || 'N/A'}\n` +
      `✉️ <b>Email:</b> ${bookingDetails.bookedByEmail || 'N/A'}\n` +
      `📐 <b>Screen Size:</b> ${bookingDetails.format === '75-inch' ? '5×3 Feet (Pole 2)' : '5×3 Feet (Pole 1)'}\n` +
      `📅 <b>Start Date:</b> ${bookingDetails.date || 'N/A'}\n` +
      `⏰ <b>Time Slot:</b> ${bookingDetails.startTime || 'N/A'} – ${bookingDetails.endTime || 'N/A'}\n` +
      `⏱️ <b>Duration:</b> ${bookingDetails.durationSeconds || 0}s\n` +
      `💰 <b>Price:</b> ${priceStr}${isFreeTrial ? ' (Discounted)' : ''}\n\n` +
      `👉 <i>Please verify and approve in the Admin Dashboard!</i>`;
  }

  // Helper: wrap a single https.request in a Promise so it can be awaited
  const sendToChat = (chatId) => new Promise((resolve, reject) => {
    const postBody = JSON.stringify({
      chat_id: chatId,
      text: textMessage,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) {
            console.log(`✅ Telegram sent to ${chatId}: Message ID ${parsed.result?.message_id}`);
            resolve(parsed);
          } else {
            console.error(`❌ Telegram API error for ${chatId}:`, parsed.description);
            resolve(parsed); // resolve anyway so Promise.allSettled catches it
          }
        } catch (e) {
          console.log(`📡 Telegram raw response for ${chatId}: HTTP ${res.statusCode}`);
          resolve();
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Telegram request failed for ${chatId}:`, err.message);
      reject(err);
    });

    req.write(postBody);
    req.end();
  });

  // Fire all chat IDs in parallel and WAIT for all to complete
  await Promise.allSettled(chatIds.map(sendToChat));
};

module.exports = { sendTelegramNotification };
