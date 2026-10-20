const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { dbConnected } = require('../config/db');

const router = express.Router();

function requireDb(req, res, next) {
  if (!dbConnected()) {
    return res.status(503).json({
      message: 'The database is not connected. Start MongoDB and set MONGO_URI, then restart the server.',
    });
  }
  next();
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/signup', requireDb, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Name, email, and a password of 6+ characters are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    res.status(201).json({ token: issueToken(user), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.post('/login', requireDb, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    res.json({ token: issueToken(user), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireDb, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
