const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { dbConnected } = require('../config/db');

const router = express.Router();

function requireDb(req, res, next) {
  if (!dbConnected()) {
    return res.status(503).json({ message: 'Database unavailable — the mini-game needs it to track one-play-per-user.' });
  }
  next();
}

function discountFor(score) {
  if (score >= 300) return { discountPercent: 20, discountCode: 'SUITOR-SLAYER-20' };
  if (score >= 200) return { discountPercent: 15, discountCode: 'BOWSTRING-15' };
  if (score >= 100) return { discountPercent: 10, discountCode: 'ARROW-10' };
  return { discountPercent: 5, discountCode: 'VOYAGER-5' };
}

router.get('/status', requireDb, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      gamePlayed: user.gamePlayed,
      score: user.gameScore,
      discountCode: user.discountCode,
      discountPercent: user.discountPercent,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/play', requireDb, requireAuth, async (req, res, next) => {
  try {
    const { score } = req.body;
    if (typeof score !== 'number' || score < 0 || score > 300) {
      return res.status(400).json({ message: 'score must be a number between 0 and 300.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.gamePlayed) {
      return res.status(409).json({
        message: 'You have already attempted the Contest of the Bow.',
        gamePlayed: true,
        score: user.gameScore,
        discountCode: user.discountCode,
        discountPercent: user.discountPercent,
      });
    }

    const { discountCode, discountPercent } = discountFor(score);
    user.gamePlayed = true;
    user.gameScore = score;
    user.discountCode = discountCode;
    user.discountPercent = discountPercent;
    await user.save();

    res.json({ gamePlayed: true, score, discountCode, discountPercent });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
