const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId)
      .populate('favorites')
      .select('favorites')

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json(user.favorites)
  } catch (error) {
    console.error('Loading favorites failed:', error.message)
    return res.status(500).json({ message: 'Could not load saved destinations.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const destinationId = String(req.body.destinationId || '')

    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: 'A valid destinationId is required.' })
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $addToSet: { favorites: destinationId } },
      { new: true },
    ).select('favorites')

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json({ message: 'Destination saved.', favorites: user.favorites })
  } catch (error) {
    console.error('Saving favorite failed:', error.message)
    return res.status(500).json({ message: 'Could not save destination.' })
  }
})

router.delete('/:destinationId', async (req, res) => {
  try {
    const { destinationId } = req.params

    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: 'A valid destinationId is required.' })
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $pull: { favorites: destinationId } },
      { new: true },
    ).select('favorites')

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    return res.json({ message: 'Destination removed.', favorites: user.favorites })
  } catch (error) {
    console.error('Removing favorite failed:', error.message)
    return res.status(500).json({ message: 'Could not remove destination.' })
  }
})

module.exports = router