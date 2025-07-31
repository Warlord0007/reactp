const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Your user mongoose model

// GET all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
