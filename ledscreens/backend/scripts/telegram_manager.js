const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN || '8945142883:AAE2UFeMb6yTpDeSLSGf4bpE4SkQdGYWHVE';
const envPath = path.join(__dirname, '../.env');

function telegramRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const isPost = Object.keys(params).length > 0;
    const postData = JSON.stringify(params);

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/${endpoint}`,
      method: isPost ? 'POST' : 'GET',
      headers: isPost ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      } : {}
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, error: 'Invalid JSON response', raw: data });
        }
      });
    });

    req.on('error', reject);
    if (isPost) req.write(postData);
    req.end();
  });
}

async function listCurrentChats() {
  const chatIdsStr = process.env.TELEGRAM_CHAT_ID || '5339906035,1394203398,8918767093';
  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(Boolean);

  console.log(`\n📋 Current Configured Telegram Notification Recipients (${chatIds.length}):`);
  console.log('------------------------------------------------------------');

  for (const id of chatIds) {
    const res = await telegramRequest(`getChat?chat_id=${id}`);
    if (res.ok) {
      const chat = res.result;
      const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || 'Unknown';
      const username = chat.username ? `@${chat.username}` : '(no username)';
      console.log(`  • Chat ID: ${id} | Name: ${name} | ${username} [${chat.type}]`);
    } else {
      console.log(`  • Chat ID: ${id} | ❌ Error fetching: ${res.description}`);
    }
  }
  console.log('------------------------------------------------------------\n');
}

async function scanUpdates() {
  console.log('\n🔍 Scanning for recent messages sent to @ethreedi_bot...');
  const res = await telegramRequest('getUpdates');

  if (!res.ok) {
    console.error('❌ Failed to get updates:', res.description);
    return;
  }

  const updates = res.result || [];
  if (updates.length === 0) {
    console.log('ℹ️ No recent messages found. Ask the users to open @ethreedi_bot on Telegram and send a message (or type /start).');
    return;
  }

  console.log(`Found ${updates.length} recent update(s):\n`);
  const seenChats = new Set();

  updates.forEach((u) => {
    const msg = u.message || u.channel_post || u.my_chat_member;
    if (!msg) return;

    const chat = msg.chat;
    if (chat && !seenChats.has(chat.id)) {
      seenChats.add(chat.id);
      const from = msg.from || {};
      const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || chat.title || 'Unknown';
      const username = from.username ? `@${from.username}` : (chat.username ? `@${chat.username}` : '(no username)');
      console.log(`  📌 Sender: ${name} (${username})`);
      console.log(`     Chat ID: ${chat.id}`);
      console.log(`     Chat Type: ${chat.type}`);
      if (msg.text) console.log(`     Last Message: "${msg.text}"`);
      console.log('     --------------------------------------------------');
    }
  });
}

async function addChatId(newId) {
  if (!newId) {
    console.error('❌ Please provide a Chat ID to add. Example: node telegram_manager.js add 123456789');
    return;
  }

  // Validate Chat ID via getChat
  console.log(`Verifying Chat ID ${newId}...`);
  const check = await telegramRequest(`getChat?chat_id=${newId}`);
  if (!check.ok) {
    console.warn(`⚠️ Warning: Telegram API returned: "${check.description}". The user must first message @ethreedi_bot!`);
  } else {
    const chat = check.result;
    const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || 'Unknown';
    console.log(`✅ Valid Chat ID found: ${name} (${chat.type})`);
  }

  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const currentMatch = envContent.match(/^TELEGRAM_CHAT_ID=(.*)$/m);
  let currentIds = currentMatch ? currentMatch[1].split(',').map(s => s.trim()).filter(Boolean) : ['5339906035'];

  if (currentIds.includes(newId.trim())) {
    console.log(`ℹ️ Chat ID ${newId} is already in .env`);
    return;
  }

  currentIds.push(newId.trim());
  const updatedLine = `TELEGRAM_CHAT_ID=${currentIds.join(',')}`;

  if (currentMatch) {
    envContent = envContent.replace(/^TELEGRAM_CHAT_ID=.*$/m, updatedLine);
  } else {
    envContent += `\n${updatedLine}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`🎉 Added! Updated .env line: ${updatedLine}`);
}

async function sendTestMessage(targetId) {
  const { sendTelegramNotification } = require('../utils/telegramNotifier');
  console.log(`🚀 Sending test booking alert${targetId ? ` to chat ${targetId}` : ' to all configured recipients'}...`);

  const mockBooking = {
    bookedByName: 'Test Customer (E3Di Setup)',
    bookedByPhone: '+91 98765 43210',
    bookedByEmail: 'admin@e3di.org',
    format: '65-inch',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    durationSeconds: 30,
    totalAmount: 1499,
    isInstant: false,
    isFreeTrial: false,
  };

  if (targetId) {
    process.env.TELEGRAM_CHAT_ID = targetId;
  }

  await sendTelegramNotification(mockBooking);
  console.log('✅ Test finished.');
}

async function main() {
  const action = process.argv[2] || 'list';
  const param = process.argv[3];

  switch (action) {
    case 'list':
      await listCurrentChats();
      break;
    case 'scan':
    case 'updates':
      await scanUpdates();
      break;
    case 'add':
      await addChatId(param);
      break;
    case 'test':
      await sendTestMessage(param);
      break;
    default:
      console.log('Usage:');
      console.log('  node scripts/telegram_manager.js list         - List configured chat IDs and names');
      console.log('  node scripts/telegram_manager.js scan         - Scan recent messages sent to @ethreedi_bot');
      console.log('  node scripts/telegram_manager.js add <id>     - Add a chat ID to .env');
      console.log('  node scripts/telegram_manager.js test [id]    - Send a test notification');
  }
}

main().catch(console.error);
