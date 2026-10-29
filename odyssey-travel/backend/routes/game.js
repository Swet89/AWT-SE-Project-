const crypto = require('crypto')
const express = require('express')
const { rateLimit } = require('express-rate-limit')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')

const router = express.Router()
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many score submissions. Please try again later.' },
})

router.use(authenticate)

router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select(
      'gamePlayed gameScore gameCouponCode gameDiscountPercent gameCouponRedeemedAt',
    )
    if (!user) return res.status(404).json({ message: 'Account not found.' })

    const hasCoupon = Boolean(user.gameCouponCode)
    return res.json({
      canPlay: !user.gamePlayed,
      gamePlayed: user.gamePlayed,
      score: user.gameScore,
      coupon: hasCoupon
        ? {
            code: user.gameCouponCode,
            discountPercent: user.gameDiscountPercent,
            redeemed: Boolean(user.gameCouponRedeemedAt),
          }
        : null,
    })
  } catch (error) {
    console.error('Loading game status failed:', error.message)
    return res.status(500).json({ message: 'Could not load game status.' })
  }
})

router.post('/submit', submitLimiter, async (req, res) => {
  const score = Number(req.body.score)
  const durationMs = Number(req.body.durationMs)

  if (!Number.isInteger(score) || score < 0 || score > 12) {
    return res.status(400).json({ message: 'Score must be a whole number from 0 to 12.' })
  }
  if (!Number.isInteger(durationMs) || durationMs < 3000 || durationMs > 300000) {
    return res.status(400).json({ message: 'The game session duration is invalid.' })
  }

  const discountPercent = [5, 8, 12, 15][Math.min(3, Math.floor(score / 3))]
  const couponCode = `ODYSSEY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.auth.userId, gamePlayed: { $ne: true } },
      {
        $set: {
          gamePlayed: true,
          gameScore: score,
          gameCouponCode: couponCode,
          gameDiscountPercent: discountPercent,
          gameCouponRedeemedAt: null,
          gameCouponBookingId: null,
        },
      },
      { new: true, projection: 'gameScore gameCouponCode gameDiscountPercent' },
    )

    if (!user) {
      return res.status(409).json({ message: 'Your one game has already been played.' })
    }

    return res.status(201).json({
      message: 'Score recorded. Your discount coupon is ready.',
      score: user.gameScore,
      coupon: {
        code: user.gameCouponCode,
        discountPercent: user.gameDiscountPercent,
      },
    }
  )

  } catch (error) {
    console.error('Submitting game score failed:', error.message)
    return res.status(500).json({ message: 'Could not record your game score.' })
  }
})

module.exports = router
