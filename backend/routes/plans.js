const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

const mongoose = require('mongoose');

const DEFAULT_PLANS = [
  { _id: 'starter', name: 'Starter', price: '₹24,999', duration: '/week', desc: 'Perfect for brand-building campaigns.', features: ['10s Ads in standard rotation', 'Single Screen placement', 'Standard scheduling', 'Real-time analytics dashboard'], popular: false, order: 1 },
  { _id: 'growth', name: 'Growth', price: '₹79,999', duration: '/month', desc: 'Best for growing businesses looking for sustained visibility.', features: ['15s Ads in prime rotation', 'Dual-Facing Screen placement', 'Prime-time priority slots', 'Real-time analytics dashboard', 'Dedicated account manager'], popular: true, order: 2 },
  { _id: 'enterprise', name: 'Enterprise', price: '₹1,99,999', duration: '/quarter', desc: 'Maximum reach and brand dominance across the city.', features: ['30s Ads in continuous loop', 'All Screens network-wide', 'All-day priority placement', 'Custom emergency broadcast access', 'Real-time analytics dashboard', '24/7 Priority Support'], popular: false, order: 3 }
];

// Get all plans
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const plans = await Plan.find().sort('order');
      if (plans && plans.length > 0) return res.json(plans);
    }
    return res.json(DEFAULT_PLANS);
  } catch (error) {
    return res.json(DEFAULT_PLANS);
  }
});

// Update a plan (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Server error updating plan' });
  }
});

module.exports = router;
