const express = require('express')
const mongoose = require('mongoose')
const Itinerary = require('../models/Itinerary')
const Destination = require('../models/Destination')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.auth.userId })
      .sort({ createdAt: -1 })
      .limit(50)

    return res.json(itineraries)
  } catch (error) {
    console.error('Could not load itineraries:', error.message)
    return res.status(500).json({ message: 'Could not load saved itineraries.' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { destinationId, plan } = req.body

    if (!mongoose.isValidObjectId(destinationId) || !plan || !Array.isArray(plan.days)) {
      return res.status(400).json({ message: 'The itinerary data is invalid.' })
    }

    const destination = await Destination.findById(destinationId)

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    const itinerary = await Itinerary.create({
      user: req.auth.userId,
      destination: destination._id,
      destinationName: destination.name,
      title: String(plan.title || `${destination.name} itinerary`).slice(0, 120),
      summary: String(plan.summary || '').slice(0, 1000),
      days: plan.days,
      totalEstimatedCostINR: Math.max(0, Number(plan.totalEstimatedCostINR) || 0),
      budgetNote: String(plan.budgetNote || '').slice(0, 500),
    })

    return res.status(201).json({ itinerary })
  } catch (error) {
    console.error('Could not save itinerary:', error.message)
    return res.status(500).json({ message: 'Could not save the itinerary.' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid itinerary ID.' })
    }

    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      user: req.auth.userId,
    })

    if (!itinerary) {
      return res.status(404).json({ message: 'Saved itinerary not found.' })
    }

    return res.json({ message: 'Itinerary deleted.' })
  } catch (error) {
    console.error('Could not delete itinerary:', error.message)
    return res.status(500).json({ message: 'Could not delete the itinerary.' })
  }
})

module.exports = router
