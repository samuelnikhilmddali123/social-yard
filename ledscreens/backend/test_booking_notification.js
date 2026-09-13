const { sendTelegramNotification } = require('./utils/telegramNotifier');

async function run() {
  console.log('🏁 Triggering background Telegram notifier function manually with INSTANT playback test payload...');
  const bookingDetails = {
    bookedByName: 'Test Customer (Nikhil)',
    bookedByPhone: '+91 70369 23456',
    bookedByEmail: 'sai@example.com',
    format: '75-inch',
    durationSeconds: 15,
    totalAmount: 24999,
    isInstant: true
  };

  try {
    await sendTelegramNotification(bookingDetails);
    console.log('✅ Function executed. Check your Telegram bot @ethreedi_bot!');
  } catch (err) {
    console.error('❌ Function crashed:', err);
  }
}

run();
