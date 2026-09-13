const mongoose = require('mongoose');
const Screen = require('../models/Screen');
const Corridor = require('../models/Corridor');

const DEFAULT_PRICE_PER_SCREEN = 10;

/**
 * Ensure Corridor documents exist for every distinct screen.corridorName.
 */
async function syncCorridorsFromScreens() {
  const names = await Screen.distinct('corridorName', {
    corridorName: { $exists: true, $ne: '' },
  });

  for (const name of names) {
    const existing = await Corridor.findOne({ name });
    if (!existing) {
      const sample = await Screen.findOne({ corridorName: name });
      await Corridor.create({
        name,
        city: sample?.city || 'Vijayawada',
        area: sample?.area || 'MG Road',
        pricePer5Sec: DEFAULT_PRICE_PER_SCREEN,
        pricePer30Sec: DEFAULT_PRICE_PER_SCREEN * 6,
        pricePerScreen: DEFAULT_PRICE_PER_SCREEN,
      });
    }
  }
}

function normalizeCorridorName(name) {
  return (name || 'Vijayawada MG Road Corridor').trim();
}

/** Resolve corridor name from screen fields (legacy seeds used location only). */
function resolveScreenCorridorName(screen) {
  if (screen.corridorName?.trim()) return screen.corridorName.trim();
  const loc = (screen.location || '').trim();
  // "City, Area" is address text — not a corridor name
  if (loc && !loc.includes(',')) return loc;
  return 'Vijayawada MG Road Corridor';
}

/**
 * @param {string[]} screenIds
 * @param {number} [durationSeconds]
 * @returns pricing snapshot for a campaign booking
 */
/**
 * @param {string[]} screenIds
 * @param {number} [durationSeconds]
 * @returns pricing snapshot for a campaign booking
 */
async function calculateCampaignPricing(screenIds, durationSeconds = 5, hasWatermark = true) {
  const secs = Number(durationSeconds || 5);
  if (secs <= 0) {
    throw new Error('Campaign duration must be greater than 0.');
  }

  const slotMultiplier = Math.ceil(secs / 5);
  const durationMultiplier = slotMultiplier / 6;

  if (!screenIds?.length) {
    return {
      selectedScreenCount: 0,
      totalAmount: 0,
      pricePer5Sec: 0,
      pricePer30Sec: 0,
      pricePerScreen: 0,
      durationSeconds: secs,
      slotMultiplier,
      durationMultiplier,
      corridorId: null,
      corridorName: null,
      breakdown: [],
    };
  }

  await syncCorridorsFromScreens();

  function safeObjectId(id) {
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  const validObjectIds = [];
  const stringIds = [];

  for (const id of screenIds) {
    const objId = safeObjectId(id);
    if (objId) {
      validObjectIds.push(objId);
    } else if (id) {
      stringIds.push(String(id));
    }
  }

  let screens = [];
  if (validObjectIds.length > 0) {
    const objScreens = await Screen.find({ _id: { $in: validObjectIds } });
    screens.push(...objScreens);
  }
  if (stringIds.length > 0) {
    const strScreens = await Screen.find({
      $or: [
        { poleId: { $in: stringIds } },
        { deviceId: { $in: stringIds } },
        { name: { $in: stringIds } }
      ]
    });
    screens.push(...strScreens);
  }

  // Fallback: If no screens found in DB or count mismatch, create synthetic fallback entries
  if (screens.length === 0 && screenIds.length > 0) {
    screens = screenIds.map((id, index) => ({
      _id: safeObjectId(id) || new mongoose.Types.ObjectId(),
      name: `Screen ${index + 1}`,
      corridorName: 'Vijayawada MG Road Corridor',
      city: 'Vijayawada',
      area: 'MG Road'
    }));
  }

  const corridors = await Corridor.find({ isActive: { $ne: false } });
  const corridorByName = new Map(
    corridors.map((c) => [normalizeCorridorName(c.name).toLowerCase(), c])
  );

  const buckets = new Map();

  for (const screen of screens) {
    const cName = normalizeCorridorName(resolveScreenCorridorName(screen));
    const key = cName.toLowerCase();
    let corridor = corridorByName.get(key);

    if (!corridor) {
      corridor = await Corridor.create({
        name: cName,
        city: screen.city || 'Vijayawada',
        area: screen.area || 'MG Road',
        pricePer5Sec: DEFAULT_PRICE_PER_SCREEN,
        pricePer30Sec: DEFAULT_PRICE_PER_SCREEN * 6,
        pricePerScreen: DEFAULT_PRICE_PER_SCREEN,
      });
      corridorByName.set(key, corridor);
    }

    let pricePer5Sec = corridor.pricePer5Sec;
    if (!pricePer5Sec) {
      const base = corridor.pricePer30Sec || corridor.pricePerScreen || 50;
      pricePer5Sec = Math.ceil(base / 6);
    }

    if (pricePer5Sec < 1) {
      throw new Error(`Invalid pricing for corridor "${corridor.name}". Contact admin.`);
    }

    if (!buckets.has(key)) {
      buckets.set(key, { corridor, pricePer5Sec, screenCount: 0, screenIds: [] });
    }
    const bucket = buckets.get(key);
    bucket.screenCount += 1;
    bucket.screenIds.push(String(screen._id));
  }

  const breakdown = [];
  let totalAmount = 0;
  const surchargeFactor = hasWatermark ? 1.0 : 1.25; // 25% premium surcharge to remove watermark

  for (const bucket of buckets.values()) {
    const subtotal = Math.ceil(bucket.pricePer5Sec * bucket.screenCount * slotMultiplier * surchargeFactor);
    totalAmount += subtotal;
    breakdown.push({
      corridorId: bucket.corridor._id.toString(),
      corridorName: bucket.corridor.name,
      pricePer5Sec: Math.ceil(bucket.pricePer5Sec * surchargeFactor),
      pricePer30Sec: Math.ceil(bucket.pricePer5Sec * 6 * surchargeFactor),
      pricePerScreen: Math.ceil(bucket.pricePer5Sec * surchargeFactor), // Fallback
      screenCount: bucket.screenCount,
      subtotal,
    });
  }

  breakdown.sort((a, b) => b.screenCount - a.screenCount);
  const primary = breakdown[0] || null;

  return {
    selectedScreenCount: screens.length,
    durationSeconds: secs,
    slotMultiplier,
    durationMultiplier,
    totalAmount,
    pricePer5Sec: primary?.pricePer5Sec ?? 0,
    pricePer30Sec: (primary?.pricePer5Sec ?? 0) * 6,
    pricePerScreen: primary?.pricePer5Sec ?? 0, // Fallback
    corridorId: primary?.corridorId ?? null,
    corridorName: primary?.corridorName ?? null,
    breakdown,
  };
}

function validatePricePerScreen(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    return { valid: false, msg: 'Price per 5 seconds must be at least ₹1.' };
  }
  return { valid: true, value: Math.round(num) };
}

module.exports = {
  DEFAULT_PRICE_PER_SCREEN,
  syncCorridorsFromScreens,
  calculateCampaignPricing,
  validatePricePerScreen,
  normalizeCorridorName,
  resolveScreenCorridorName,
};
