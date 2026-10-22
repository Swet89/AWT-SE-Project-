const express = require('express')
const mongoose = require('mongoose')
const Destination = require('../models/Destination')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

function buildLocalItinerary({ destination, days, dailyBudgetINR, travelStyle, request }) {
  const attractions = Array.isArray(destination.attractions)
    ? destination.attractions.filter(Boolean)
    : []

  const destinationName = destination.name
  const interests = request.trim()
  const style = String(travelStyle || 'Balanced').trim()
  const dailyEstimate = Math.round(dailyBudgetINR * 0.8)
  const morningCost = Math.round(dailyEstimate * 0.35)
  const afternoonCost = Math.round(dailyEstimate * 0.4)
  const eveningCost = dailyEstimate - morningCost - afternoonCost

  const planDays = Array.from({ length: days }, (_, index) => {
    const attraction = attractions.length
      ? attractions[index % attractions.length]
      : destinationName + ' local highlights'

    return {
      day: index + 1,
      theme: index === 0 ? style + ' introduction' : style + ' day in ' + destinationName,
      activities: [
        {
          time: 'Morning',
          place: attraction,
          description:
            'Explore this suggested highlight. Check current opening hours, access, and entry fees before visiting.',
          estimatedCostINR: morningCost,
        },
        {
          time: 'Afternoon',
          place: 'Local food and neighbourhood exploration',
          description:
            'Look for local food and places matching your interest in ' +
            interests +
            '. Choose options that fit your budget.',
          estimatedCostINR: afternoonCost,
        },
        {
          time: 'Evening',
          place: 'Relaxed evening in ' + destinationName,
          description:
            'Leave time to rest or explore nearby public areas. Confirm local transport and safety information.',
          estimatedCostINR: eveningCost,
        },
      ],
    }
  })

  const totalEstimatedCostINR = planDays.reduce(
    (total, day) =>
      total +
      day.activities.reduce(
        (dayTotal, activity) => dayTotal + activity.estimatedCostINR,
        0,
      ),
    0,
  )

  return {
    title: days + '-day ' + destinationName + ' itinerary',
    summary:
      'A locally generated ' +
      days +
      '-day ' +
      style.toLowerCase() +
      ' plan for ' +
      destinationName +
      ', shaped around: ' +
      interests +
      '.',
    days: planDays,
    totalEstimatedCostINR,
    budgetNote:
      'This is a rough local estimate based on 80% of your entered daily budget per traveler. Transport, accommodation, tickets, and actual prices may differ.',
  }
}

router.post('/itinerary', authenticate, async (req, res) => {
  try {
    const { destinationId, days, dailyBudgetINR, travelStyle, request } =
      req.body

    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({
        message: 'Please select a valid destination.',
      })
    }

    const numberOfDays = Number(days)
    const dailyBudget = Number(dailyBudgetINR)

    if (
      !Number.isInteger(numberOfDays) ||
      numberOfDays < 1 ||
      numberOfDays > 10
    ) {
      return res.status(400).json({
        message: 'Choose between 1 and 10 days.',
      })
    }

    if (
      !Number.isFinite(dailyBudget) ||
      dailyBudget < 500 ||
      dailyBudget > 500000
    ) {
      return res.status(400).json({
        message: 'Enter a valid daily budget in rupees.',
      })
    }

    if (
      typeof request !== 'string' ||
      request.trim().length < 5 ||
      request.length > 1000
    ) {
      return res.status(400).json({
        message: 'Describe the trip you want in at least 5 characters.',
      })
    }

    const destination = await Destination.findById(destinationId)

    if (!destination) {
      return res.status(404).json({
        message: 'Destination not found.',
      })
    }

    const itinerary = buildLocalItinerary({
      destination,
      days: numberOfDays,
      dailyBudgetINR: dailyBudget,
      travelStyle,
      request,
    })

    return res.json({
      destinationId: String(destination._id),
      destinationName: destination.name,
      ...itinerary,
    })
  } catch (error) {
    console.error('Local itinerary generation failed:', error.message)
    return res.status(500).json({
      message: 'Could not create the itinerary.',
    })
  }
})

module.exports = router
