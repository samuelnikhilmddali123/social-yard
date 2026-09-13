const User = require('../models/User');

/** Block booking APIs until profileCompleted is true (regular users only). */
module.exports = async function requireProfile(req, res, next) {
  if (req.user.role === 'admin' || req.user.role === 'government') {
    return next();
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const hasPhone = (user.phone || '').replace(/\D/g, '').length >= 10;
    const hasName = !!(user.name && user.name.trim());
    const completed = user.profileCompleted || (hasPhone && hasName && user.authProvider === 'local');

    if (!completed) {
      return res.status(403).json({
        msg: 'Complete profile before booking',
        code: 'PROFILE_INCOMPLETE',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
