const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { rateLimit } = require('express-rate-limit')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')

const router = express.Router()
const REFRESH_COOKIE = 'odysseyRefreshToken'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
})

function createAccessToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from the backend .env file')
  }

  return jwt.sign(
    { sub: user._id.toString(), email: user.email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  )
}

function createRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET or JWT_SECRET is missing from backend .env')

  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    secret,
    { expiresIn: '30d' },
  )
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function readRefreshCookie(req) {
  const cookies = String(req.headers.cookie || '').split(';')
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${REFRESH_COOKIE}=`))
  return entry ? decodeURIComponent(entry.trim().slice(REFRESH_COOKIE.length + 1)) : ''
}

function setRefreshCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${REFRESH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${Math.floor(REFRESH_TOKEN_TTL_MS / 1000)}${secure}`,
  )
}

function clearRefreshCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${REFRESH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0${secure}`,
  )
}

async function issueSession(user, res) {
  const accessToken = createAccessToken(user)
  const refreshToken = createRefreshToken(user)
  user.refreshTokenHash = hashToken(refreshToken)
  await user.save()
  setRefreshCookie(res, refreshToken)
  return accessToken
}

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must be 2–80 characters.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' })
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be 8–128 characters.' })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    const accessToken = await issueSession(user, res)

    return res.status(201).json({
      message: 'Account created.',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    console.error('Signup failed:', error.message)
    return res.status(500).json({ message: 'Could not create the account.' })
  }
})

router.post('/login', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    const user = await User.findOne({ email }).select('+passwordHash')
    const passwordMatches =
      user && await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email or password is incorrect.' })
    }

    const accessToken = await issueSession(user, res)

    return res.json({
      message: 'Signed in.',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Login failed:', error.message)
    return res.status(500).json({ message: 'Could not sign in.' })
  }
})

router.post('/refresh', authLimiter, async (req, res) => {
  const refreshToken = readRefreshCookie(req)
  if (!refreshToken) {
    clearRefreshCookie(res)
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }

  try {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    const payload = jwt.verify(refreshToken, secret)
    if (payload.type !== 'refresh' || typeof payload.sub !== 'string') {
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Invalid refresh token.' })
    }

    const user = await User.findById(payload.sub).select('+refreshTokenHash')
    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    }

    const accessToken = await issueSession(user, res)
    return res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    clearRefreshCookie(res)
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    }
    console.error('Session refresh failed:', error.message)
    return res.status(500).json({ message: 'Could not refresh your session.' })
  }
})

router.post('/logout', async (req, res) => {
  const refreshToken = readRefreshCookie(req)
  if (refreshToken) {
    await User.updateOne(
      { refreshTokenHash: hashToken(refreshToken) },
      { $unset: { refreshTokenHash: 1 } },
    ).catch((error) => console.error('Could not clear refresh session:', error.message))
  }
  clearRefreshCookie(res)
  return res.json({ message: 'Signed out.' })
})

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('name email travelProfile')

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        travelProfile: user.travelProfile || {
          travelStyle: 'Balanced',
          interests: [],
          dietaryPreference: 'None',
          typicalBudgetPerDayINR: 5000,
          preferredPace: 'Moderate',
          pastTrips: [],
        },
      },
    })
  } catch (error) {
    console.error('Profile lookup failed:', error.message)
    return res.status(500).json({ message: 'Could not load the account.' })
  }
})

router.patch('/travel-profile', authenticate, async (req, res) => {
  try {
    const {
      travelStyle,
      interests,
      dietaryPreference,
      typicalBudgetPerDayINR,
      preferredPace,
      pastTrips,
    } = req.body || {}

    const updateFields = {}

    if (travelStyle) updateFields['travelProfile.travelStyle'] = travelStyle
    if (Array.isArray(interests)) updateFields['travelProfile.interests'] = interests.map((i) => String(i).trim()).filter(Boolean)
    if (dietaryPreference) updateFields['travelProfile.dietaryPreference'] = dietaryPreference
    if (Number.isFinite(typicalBudgetPerDayINR)) {
      updateFields['travelProfile.typicalBudgetPerDayINR'] = Math.max(500, Math.min(500000, Number(typicalBudgetPerDayINR)))
    }
    if (preferredPace) updateFields['travelProfile.preferredPace'] = preferredPace
    if (Array.isArray(pastTrips)) {
      updateFields['travelProfile.pastTrips'] = pastTrips
        .filter((trip) => trip && trip.destination && trip.destination.trim())
        .map((trip) => ({
          destination: String(trip.destination).trim(),
          year: Number(trip.year) || new Date().getFullYear(),
          highlights: String(trip.highlights || '').trim(),
          rating: Math.max(1, Math.min(5, Number(trip.rating) || 5)),
        }))
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: updateFields },
      { new: true, runValidators: true, select: 'name email travelProfile' },
    )

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json({
      message: 'AI Travel Profile saved.',
      travelProfile: user.travelProfile,
    })
  } catch (error) {
    console.error('Updating travel profile failed:', error.message)
    return res.status(500).json({ message: 'Failed to update travel profile.' })
  }
})

router.patch('/me', authenticate, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must be 2–80 characters.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' })
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.auth.userId },
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'That email address is already used by another account.',
      })
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { name, email },
      { new: true, runValidators: true, select: 'name email' },
    )

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json({
      message: 'Profile updated.',
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'That email address is already used by another account.',
      })
    }

    console.error('Profile update failed:', error.message)
    return res.status(500).json({ message: 'Could not update your profile.' })
  }
})

router.patch('/password', authenticate, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '')
    const newPassword = String(req.body.newPassword || '')

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be 8–128 characters.' })
    }

    const user = await User.findById(req.auth.userId).select('+passwordHash')
    if (!user) return res.status(404).json({ message: 'Account not found.' })

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatches) {
      return res.status(400).json({ message: 'Current password is incorrect.' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    user.refreshTokenHash = undefined
    await user.save()
    clearRefreshCookie(res)

    return res.json({ message: 'Password changed successfully.' })
  } catch (error) {
    console.error('Password change failed:', error.message)
    return res.status(500).json({ message: 'Could not change your password.' })
  }
})

module.exports = router

