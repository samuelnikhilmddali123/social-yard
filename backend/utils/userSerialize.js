const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function validateIndianPhone(raw) {
  const digits = normalizePhone(raw);
  if (!INDIAN_PHONE_REGEX.test(digits)) {
    return { valid: false, msg: 'Enter a valid 10-digit Indian mobile number.' };
  }
  return { valid: true, value: digits };
}

function serializeUser(user) {
  const u = user.toObject ? user.toObject() : user;
  const phone = u.phone || '';
  const hasPhone = normalizePhone(phone).length === 10;
  const hasName = !!(u.name && u.name.trim());

  let profileCompleted = u.profileCompleted;
  if (profileCompleted === undefined || profileCompleted === null) {
    if (u.authProvider === 'local' || (!u.googleId && u.authProvider !== 'google')) {
      profileCompleted = true;
    } else {
      profileCompleted = hasPhone && hasName;
    }
  }

  return {
    id: u._id?.toString() || u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone,
    profileCompleted: !!profileCompleted,
    authProvider: u.authProvider || (u.googleId ? 'google' : 'local'),
    companyName: u.companyName || '',
    gst: u.gst || '',
    businessType: u.businessType || '',
    profilePic: u.profilePic || '',
    twoFactorEnabled: !!u.twoFactorEnabled,
    hasUsedFreeTrial: !!u.hasUsedFreeTrial,
  };
}

module.exports = {
  serializeUser,
  validateIndianPhone,
  normalizePhone,
};
