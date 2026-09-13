const https = require('https');

/**
 * Send a notification message via Telegram Bot API.
 * Uses TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.
 * @param {string} message HTML-formatted or plain text message
 */
function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8945142883:AAE2UFeMb6yTpDeSLSGf4bpE4SkQdGYWHVE';
  const chatIdsStr = process.env.TELEGRAM_CHAT_ID || '5339906035,1394203398,8918767093';

  if (!botToken || !chatIdsStr) {
    console.log('ℹ️ Telegram Notification skipped (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)');
    return;
  }

  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(Boolean);

  chatIds.forEach(chatId => {
    try {
      const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });

      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ Telegram Notification sent to ${chatId}`);
          } else {
            console.error(`❌ Telegram API Error for ${chatId} (HTTP ${res.statusCode}):`, body);
          }
        });
      });

      req.on('error', (err) => {
        console.error(`❌ Telegram Network Error for ${chatId}:`, err.message);
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.error(`❌ Telegram Send Exception for ${chatId}:`, err.message);
    }
  });
}

module.exports = { sendTelegramNotification };
