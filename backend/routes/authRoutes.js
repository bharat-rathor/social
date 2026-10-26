const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'social_connect_secret_key_2026', {
    expiresIn: '30d'
  });
};

// Handler for registration
const handleRegister = async (req, res) => {
  try {
    const { name, email, password, age, gender, city, preference, area, bio, interests, image } = req.body;
    const emailLower = (email || '').toLowerCase().trim();

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      customId: String(Date.now()),
      name: (name || '').trim(),
      email: emailLower,
      password: password || 'demo123',
      age: age || null,
      gender: gender || null,
      preference: preference || 'All',
      area: area || '',
      city: city || '',
      bio: bio || '',
      interests: interests || [],
      avatar: image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
      image: image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
      online: true,
      isOnline: true
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handler for login
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      token,
      user: userObj
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/register', handleRegister);
router.post('/login', handleLogin);

module.exports = { router, handleRegister, handleLogin };
