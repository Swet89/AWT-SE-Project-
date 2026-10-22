const express = require('express')
const Destination = require('../models/Destination')
const Review = require('../models/Review')

const router = express.Router()

// Get all destinations
router.get('/', async (_req, res) => {
  try {
    const [destinations, reviewSummaries] = await Promise.all([
      Destination.find().sort({ name: 1 }).lean(),
      Review.aggregate([
        {
          $group: {
            _id: '$destination',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ])
    const summariesByDestination = new Map(
      reviewSummaries.map((summary) => [String(summary._id), summary]),
    )
    const destinationsWithRatings = destinations.map((destination) => {
      const summary = summariesByDestination.get(String(destination._id))
      return {
        ...destination,
        averageRating: summary
          ? Math.round(summary.averageRating * 10) / 10
          : null,
        reviewCount: summary?.reviewCount || 0,
      }
    })

    return res.json(destinationsWithRatings)
  } catch (error) {
    console.error('Could not load destinations:', error.message)
    return res.status(500).json({ message: 'Could not load destinations.' })
  }
})

// Get one destination by its MongoDB ID
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    return res.json(destination)
  } catch (error) {
    console.error('Destination lookup failed:', error.message)
    return res.status(400).json({ message: 'Invalid destination ID.' })
  }
})

module.exports = router
