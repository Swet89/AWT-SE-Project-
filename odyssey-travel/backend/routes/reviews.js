const express = require('express')
const mongoose = require('mongoose')
const Review = require('../models/Review')
const Destination = require('../models/Destination')
const authenticate = require('../middleware/authenticate')
const router = express.Router()

router.get('/:destinationId', async (req, res) => {
  try {
    const { destinationId } = req.params
    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: 'Invalid destination ID.' })
    }

    const destinationExists = await Destination.exists({ _id: destinationId })
    if (!destinationExists) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    const reviews = await Review.find({ destination: destinationId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean()
    const averageRating = reviews.length
      ? Math.round((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length) * 10) / 10
      : null

    return res.json({ reviews, averageRating, count: reviews.length })
  } catch (error) {
    console.error('Loading destination reviews failed:', error.message)
    return res.status(500).json({ message: 'Could not load destination reviews.' })
  }
})
router.put('/:destinationId', authenticate, async (req, res) => {
  try {
    const { destinationId } = req.params
    const rating = Number(req.body.rating)
    const comment = String(req.body.comment || '').trim()

    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: 'Invalid destination ID.' })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' })
    }
    if (comment.length < 5 || comment.length > 1000) {
      return res.status(400).json({ message: 'Review must be 5–1000 characters.' })
    }

    const destinationExists = await Destination.exists({ _id: destinationId })
    if (!destinationExists) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    const review = await Review.findOneAndUpdate(
      { destination: destinationId, user: req.auth.userId },
      { $set: { rating, comment } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate('user', 'name')

    return res.json({ message: 'Your review has been saved.', review })
  } catch (error) {
    console.error('Saving destination review failed:', error.message)
    return res.status(500).json({ message: 'Could not save your review.' })
  }
})

module.exports = router
