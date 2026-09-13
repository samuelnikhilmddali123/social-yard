const crypto = require('crypto');
const PromoCode = require('../models/PromoCode');
const PromoUsage = require('../models/PromoUsage');

// Configurable policy settings (stored in memory/db, default: 1 promo redemption per user)
let promoSettings = {
  onePerUser: true,
  activePoolSize: 3
};

/**
 * Generate a unique secure random promo code
 * Example format: FREE7XK2, FREE9PQA, FREE4MZT
 */
function generateCodeString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
  let code = 'FREE';
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Ensure exactly 3 active unused promo codes exist in the database.
 * Auto-generates replacement codes whenever pool size is below 3.
 * Broadcasts real-time Socket.IO event if io is passed.
 */
async function ensureActivePromoCodes(io = null) {
  try {
    let activeCodes = await PromoCode.find({ 
      status: 'ACTIVE',
      $or: [{ type: 'SYSTEM' }, { type: { $exists: false } }, { type: null }]
    }).sort({ createdAt: -1 });
    
    let newlyCreated = false;
    while (activeCodes.length < promoSettings.activePoolSize) {
      let newCodeStr = generateCodeString();
      
      // Ensure absolute uniqueness across DB
      let exists = await PromoCode.findOne({ code: newCodeStr });
      while (exists) {
        newCodeStr = generateCodeString();
        exists = await PromoCode.findOne({ code: newCodeStr });
      }

      await PromoCode.create({
        code: newCodeStr,
        status: 'ACTIVE',
        type: 'SYSTEM',
        createdByName: 'System Admin',
        createdByEmail: 'admin@jaan.com',
        createdAt: new Date()
      });
      newlyCreated = true;
      activeCodes = await PromoCode.find({ 
        status: 'ACTIVE',
        $or: [{ type: 'SYSTEM' }, { type: { $exists: false } }, { type: null }]
      }).sort({ createdAt: -1 });
    }

    // Always cap active return to pool size
    const currentActive = activeCodes.slice(0, promoSettings.activePoolSize);

    if (io) {
      await broadcastPromoUpdate(io);
    }

    return currentActive;
  } catch (err) {
    console.error('❌ Error ensuring active promo codes:', err.message);
    return [];
  }
}

/**
 * Broadcast real-time Socket.IO update with active promo codes and usage history
 */
async function broadcastPromoUpdate(io) {
  if (!io) return;
  try {
    const activeCodes = await PromoCode.find({ 
      status: 'ACTIVE',
      $or: [{ type: 'SYSTEM' }, { type: { $exists: false } }, { type: null }]
    })
      .sort({ createdAt: -1 })
      .limit(promoSettings.activePoolSize);
      
    const usageHistory = await PromoUsage.find()
      .sort({ usedAt: -1 })
      .limit(100);

    io.emit('PROMO_CODES_UPDATED', {
      activeCodes,
      usageHistory,
      settings: promoSettings
    });
  } catch (err) {
    console.error('⚠️ Broadcast promo update error:', err.message);
  }
}

function getSettings() {
  return promoSettings;
}

function updateSettings(newSettings) {
  promoSettings = { ...promoSettings, ...newSettings };
  return promoSettings;
}

module.exports = {
  generateCodeString,
  ensureActivePromoCodes,
  broadcastPromoUpdate,
  getSettings,
  updateSettings
};
