
const express = require('express')
const mongoose = require('mongoose')

const User = require('../models/User')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

// Require authentication for all favorites routes
router.use(authenticate)

// Get all saved destinations for the authenticated user
router.get('/', async (req, res) => {
  try {
    // Find the user and populate their saved destination details
    const user = await User.findById(req.auth.userId)
      .populate('favorites')
      .select('favorites')

    // Return an error if the account does not exist
    if (!user) {
      return res.status(404).json({
        message: 'Account not found.',
      })
    }

    // Return the user's saved destinations
    return res.json(user.favorites)
  } catch (error) {
    console.error(
      'Loading favorites failed:',
      error.message,
    )

    return res.status(500).json({
      message: 'Could not load saved destinations.',
    })
  }
})

// Add a destination to the authenticated user's favorites
router.post('/', async (req, res) => {
  try {
    // Extract the destination ID from the request body
    const destinationId = String(
      req.body.destinationId || '',
    )

    // Validate the MongoDB ObjectId
    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({
        message: 'A valid destinationId is required.',
      })
    }

    // Add the destination without creating duplicate entries
    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      {
        $addToSet: {
          favorites: destinationId,
        },
      },
      { new: true },
    ).select('favorites')

    // Return an error if the account does not exist
    if (!user) {
      return res.status(404).json({
        message: 'Account not found.',
      })
    }

    // Return the updated favorites list
    return res.json({
      message: 'Destination saved.',
      favorites: user.favorites,
    })
  } catch (error) {
    console.error(
      'Saving favorite failed:',
      error.message,
    )

    return res.status(500).json({
      message: 'Could not save destination.',
    })
  }
})

// Remove a destination from the authenticated user's favorites
router.delete('/:destinationId', async (req, res) => {
  try {
    // Extract the destination ID from the route parameters
    const { destinationId } = req.params

    // Validate the MongoDB ObjectId
    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({
        message: 'A valid destinationId is required.',
      })
    }

    // Remove the destination from the user's favorites
    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      {
        $pull: {
          favorites: destinationId,
        },
      },
      { new: true },
    ).select('favorites')

    // Return an error if the account does not exist
    if (!user) {
      return res.status(404).json({
        message: 'Account not found.',
      })
    }

    // Return the updated favorites list
    return res.json({
      message: 'Destination removed.',
      favorites: user.favorites,
    })
  } catch (error) {
    console.error(
      'Removing favorite failed:',
      error.message,
    )

    return res.status(500).json({
      message: 'Could not remove destination.',
    })
  }
})

// Export the router for use in the Express application
module.exports = router
