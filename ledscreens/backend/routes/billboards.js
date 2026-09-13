const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Billboard = require('../models/Billboard');

// @route   GET api/billboards
// @desc    Get all billboards
router.get('/', async (req, res) => {
  try {
    const billboards = await Billboard.find();
    res.json(billboards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/billboards
// @desc    Add a billboard (Admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  const { location, status, price, lat, lng, image } = req.body;
  try {
    const newBillboard = new Billboard({ location, status, price, lat, lng, image });
    const billboard = await newBillboard.save();
    res.json(billboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
