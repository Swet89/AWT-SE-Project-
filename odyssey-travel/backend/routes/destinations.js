
const express = require('express')

const Destination = require('../models/Destination')
const Review = require('../models/Review')

const router = express.Router()

// Get all destinations with their average ratings and review counts
router.get('/', async (_req, res) => {
  try {
    // Fetch destinations and calculate review summaries simultaneously
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

    // Create a map for quickly accessing review summaries by destination ID
    const summariesByDestination = new Map(
      reviewSummaries.map((summary) => [
        String(summary._id),
        summary,
      ]),
    )

    // Attach rating information to every destination
    const destinationsWithRatings = destinations.map(
      (destination) => {
        const summary = summariesByDestination.get(
          String(destination._id),
        )

        return {
          ...destination,

          averageRating: summary
            ? Math.round(summary.averageRating * 10) / 10
            : null,

          reviewCount: summary?.reviewCount || 0,
        }
      },
    )

    return res.json(destinationsWithRatings)
  } catch (error) {
    console.error(
      'Could not load destinations:',
      error.message,
    )

    return res.status(500).json({
      message: 'Could not load destinations.',
    })
  }
})

// AI-powered natural language search and destination discovery
router.post('/smart-search', async (req, res) => {
  try {
    // Extract the search prompt from the request body
    const { query } = req.body || {}

    // Validate the search prompt
    if (
      !query ||
      typeof query !== 'string' ||
      !query.trim()
    ) {
      return res.status(400).json({
        message: 'Please provide a search prompt.',
      })
    }

    const rawQuery = query.trim()
    const lower = rawQuery.toLowerCase()

    // Extract budget constraints from the search prompt
    // Examples: "under 40000", "under ₹40,000", "below 5000", "budget 30k"
    let maxBudget = null
    let maxDailyBudget = null

    // Identify the maximum total trip budget
    const totalBudgetMatch = lower.match(
      /(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand|lakh)?/i,
    )

    if (totalBudgetMatch) {
      let num = Number(
        totalBudgetMatch[1].replace(/,/g, ''),
      )

      const unit = totalBudgetMatch[2]?.toLowerCase()

      // Convert the detected budget unit into rupees
      if (unit === 'k' || unit === 'thousand') {
        num *= 1000
      } else if (unit === 'lakh') {
        num *= 100000
      }

      maxBudget = num

      // Estimate the daily budget using an approximate five-day trip
      maxDailyBudget = Math.round(maxBudget / 5)
    }

    // Extract the requested month or travel season
    const months = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ]

    const monthAbbreviations = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ]

    let targetMonth = null

    // Match full month names or their abbreviations
    for (let i = 0; i < months.length; i++) {
      if (
        lower.includes(months[i]) ||
        new RegExp(
          `\\b${monthAbbreviations[i]}\\b`,
          'i',
        ).test(lower)
      ) {
        targetMonth = months[i]
        break
      }
    }

    // Extract destination themes and environmental preferences
    const tags = []

    if (
      lower.includes('beach') ||
      lower.includes('coastal') ||
      lower.includes('sea') ||
      lower.includes('ocean') ||
      lower.includes('island')
    ) {
      tags.push('beach')
    }

    if (
      lower.includes('mountain') ||
      lower.includes('hill') ||
      lower.includes('himalaya') ||
      lower.includes('trek') ||
      lower.includes('snow') ||
      lower.includes('valley')
    ) {
      tags.push('mountain')
    }

    if (
      lower.includes('heritage') ||
      lower.includes('historic') ||
      lower.includes('culture') ||
      lower.includes('temple') ||
      lower.includes('palace') ||
      lower.includes('fort')
    ) {
      tags.push('heritage')
    }

    if (
      lower.includes('nature') ||
      lower.includes('wildlife') ||
      lower.includes('safari') ||
      lower.includes('forest') ||
      lower.includes('jungle')
    ) {
      tags.push('nature')
    }

    if (
      lower.includes('desert') ||
      lower.includes('dunes') ||
      lower.includes('sand')
    ) {
      tags.push('desert')
    }

    if (
      lower.includes('peace') ||
      lower.includes('quiet') ||
      lower.includes('relax') ||
      lower.includes('backwater') ||
      lower.includes('wellness')
    ) {
      tags.push('relaxed')
    }

    // Fetch all destinations from the database
    const destinations = await Destination.find().lean()

    // Calculate average ratings and review counts for each destination
    const reviews = await Review.aggregate([
      {
        $group: {
          _id: '$destination',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ])

    // Map review information to destination IDs
    const reviewsMap = new Map(
      reviews.map((review) => [
        String(review._id),
        review,
      ]),
    )

    // Score destinations according to the user's search intent
    const scored = destinations.map((dest) => {
      let score = 0
      const reasons = []

      // Combine destination information into searchable text
      const textCorpus = `
        ${dest.name}
        ${dest.state || ''}
        ${dest.country}
        ${dest.description}
        ${(dest.attractions || []).join(' ')}
        ${dest.bestTimeToVisit || ''}
      `.toLowerCase()

      // Match the destination against the requested themes
      if (tags.length > 0) {
        let matchedPrimaryTag = false

        // Match beach and coastal destinations
        if (
          tags.includes('beach') &&
          /beach|coast|island|lagoon|sea|ocean|cove/i.test(
            textCorpus,
          )
        ) {
          score += 60
          reasons.push(
            'Renowned coastal & beach landscape',
          )
          matchedPrimaryTag = true
        }

        // Match mountain destinations
        if (
          tags.includes('mountain') &&
          /mountain|hill station|himalay|altitude|valley|ridge|peak|cedar/i.test(
            textCorpus,
          )
        ) {
          score += 60
          reasons.push(
            'Scenic mountain elevations and trails',
          )
          matchedPrimaryTag = true
        }

        // Match historical and cultural destinations
        if (
          tags.includes('heritage') &&
          /palace|fort|monument|temple|unesco|heritage|ancient|ruin|ghat/i.test(
            textCorpus,
          )
        ) {
          score += 50
          reasons.push(
            'Rich historical & monument heritage',
          )
          matchedPrimaryTag = true
        }

        // Match nature and wildlife destinations
        if (
          tags.includes('nature') &&
          /wildlife|reserve|national park|tea garden|forest|sanctuary|lake/i.test(
            textCorpus,
          )
        ) {
          score += 50
          reasons.push(
            'Abundant wildlife and pristine nature',
          )
          matchedPrimaryTag = true
        }

        // Match desert destinations
        if (
          tags.includes('desert') &&
          /desert|sand|dune|salt marsh/i.test(textCorpus)
        ) {
          score += 60
          reasons.push('Desert terrain & dune vistas')
          matchedPrimaryTag = true
        }

        // Match peaceful and relaxing destinations
        if (
          tags.includes('relaxed') &&
          /relaxed|backwater|tea|garden|boat|quiet|peace|lakeside/i.test(
            textCorpus,
          )
        ) {
          score += 45
          reasons.push(
            'Peaceful and restorative pace',
          )
          matchedPrimaryTag = true
        }

        // Demote destinations that do not match the requested themes
        if (!matchedPrimaryTag) {
          score -= 50
        }
      }

      // Increase the score when the requested month matches
      // the destination's recommended visiting period
      if (targetMonth) {
        if (
          (dest.bestTimeToVisit || '')
            .toLowerCase()
            .includes(targetMonth)
        ) {
          score += 35

          reasons.push(
            `Ideal timing: Best time includes ${
              targetMonth.charAt(0).toUpperCase() +
              targetMonth.slice(1)
            }`,
          )
        }
      }

      // Evaluate the destination against the user's budget
      if (maxDailyBudget) {
        if (
          dest.averageDailyBudgetINR &&
          dest.averageDailyBudgetINR <= maxDailyBudget
        ) {
          score += 30

          reasons.push(
            `Budget friendly: ₹${dest.averageDailyBudgetINR.toLocaleString('en-IN')}/day fits under target`,
          )
        } else if (
          dest.averageDailyBudgetINR &&
          dest.averageDailyBudgetINR > maxDailyBudget * 1.3
        ) {
          score -= 40
        }
      }

      // Apply additional relevance points for nature preferences
      if (tags.includes('nature')) {
        if (
          /wildlife|reserve|national park|tea garden|forest|sanctuary|lake/i.test(
            textCorpus,
          )
        ) {
          score += 25
          reasons.push(
            'Abundant wildlife and pristine nature',
          )
        }
      }

      // Apply additional relevance points for desert preferences
      if (tags.includes('desert')) {
        if (/desert|sand|dune|salt marsh/i.test(textCorpus)) {
          score += 35
          reasons.push('Desert terrain & dune vistas')
        }
      }

      // Apply additional relevance points for relaxing destinations
      if (tags.includes('relaxed')) {
        if (
          /relaxed|backwater|tea|garden|boat|quiet|peace|lakeside/i.test(
            textCorpus,
          )
        ) {
          score += 20
          reasons.push(
            'Peaceful and restorative pace',
          )
        }
      }

      // Give additional points when destination text contains
      // important words from the original search prompt
      const queryWords = lower
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 2 &&
            ![
              'trip',
              'tour',
              'under',
              'with',
              'best',
              'places',
              'want',
              'need',
              'give',
              'show',
            ].includes(word),
        )

      for (const word of queryWords) {
        if (textCorpus.includes(word)) {
          score += 15
        }
      }

      // Attach review information to the scored destination
      const rev = reviewsMap.get(String(dest._id))

      return {
        ...dest,
        score,
        matchReasons: reasons,

        averageRating: rev
          ? Math.round(rev.averageRating * 10) / 10
          : null,

        reviewCount: rev?.reviewCount || 0,
      }
    })

    // Keep positive matches, sort by score, and return up to 12 results
    const results = scored
      .filter((destination) => destination.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)

    // Return the search query, extracted preferences, and matching results
    return res.json({
      query: rawQuery,

      parsedIntent: {
        maxBudget,
        maxDailyBudget,
        targetMonth,
        tags,
      },

      matchCount: results.length,
      results,
    })
  } catch (err) {
    console.error(
      'Smart search error:',
      err.message,
    )

    return res.status(500).json({
      message: 'Smart search encountered an issue.',
    })
  }
})

// Get a single destination by MongoDB ID or destination name
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose')

    let destination = null

    // First, attempt to find the destination by its MongoDB ID
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      destination = await Destination.findById(
        req.params.id,
      )
    }

    // If no ID match exists, search using the destination name
    if (!destination) {
      const cleanName = req.params.id
        .replace(/[-_]/g, ' ')
        .trim()

      destination = await Destination.findOne({
        name: {
          $regex: new RegExp(`^${cleanName}$`, 'i'),
        },
      })
    }

    // Return a 404 response when the destination does not exist
    if (!destination) {
      return res.status(404).json({
        message: 'Destination not found.',
      })
    }

    return res.json(destination)
  } catch (error) {
    console.error(
      'Destination lookup failed:',
      error.message,
    )

    return res.status(500).json({
      message: 'Error retrieving destination.',
    })
  }
})

// Export the router for use in the Express application
module.exports = router
