const { admin, firebaseAdminReady } = require('./firebaseAdmin');
const User = require('../models/User');

/**
 * Sends a push notification to all registered Admin devices when a new booking is created.
 */
const sendFcmAdminNotification = async (bookingDetails) => {
  if (!firebaseAdminReady) {
    console.warn('⚠️ FCM Notification skipped: Firebase Admin SDK is not ready.');
    return;
  }

  try {
    // 1. Fetch all admins with active FCM registration tokens
    const admins = await User.find({
      role: 'admin',
      fcmTokens: { $exists: true, $not: { $size: 0 } }
    }, 'fcmTokens').lean();

    const tokens = [];
    admins.forEach(adminUser => {
      if (Array.isArray(adminUser.fcmTokens)) {
        adminUser.fcmTokens.forEach(t => {
          if (t && !tokens.includes(t)) {
            tokens.push(t);
          }
        });
      }
    });

    if (tokens.length === 0) {
      console.log('ℹ️ FCM Notification skipped: No admin device tokens registered in database.');
      return;
    }

    const payload = {
      notification: {
        title: '🚨 New E3Di Booking Created',
        body: `Ad campaign created by ${bookingDetails.bookedByName || 'Customer'} (Duration: ${bookingDetails.durationSeconds || 15}s). Verify in admin panel!`
      },
      data: {
        click_action: '/admin',
        campaignId: bookingDetails.bookingGroupId || ''
      }
    };

    console.log(`📡 Sending FCM push notifications to ${tokens.length} admin device tokens...`);

    // Send messages to all registration tokens
    const messages = tokens.map(token => ({
      token,
      ...payload
    }));

    const response = await admin.messaging().sendEach(messages);
    console.log(`✅ FCM push notification sent successfully: ${response.successCount} succeeded, ${response.failureCount} failed.`);
  } catch (err) {
    console.error('❌ Failed to send FCM admin notification:', err.message);
  }
};

module.exports = { sendFcmAdminNotification };
