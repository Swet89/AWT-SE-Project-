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

// AI Natural Language Search & Discovery endpoint
router.post('/smart-search', async (req, res) => {
  try {
    const { query } = req.body || {}
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Please provide a search prompt.' })
    }

    const rawQuery = query.trim()
    const lower = rawQuery.toLowerCase()

    // 1. Extract budget constraints (e.g. "under 40000", "under ₹40,000", "below 5000", "budget 30k")
    let maxBudget = null
    let maxDailyBudget = null

    // Look for explicit total trip budget (e.g., "under 40,000" or "under 40k")
    const totalBudgetMatch = lower.match(/(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand|lakh)?/i)
    if (totalBudgetMatch) {
      let num = Number(totalBudgetMatch[1].replace(/,/g, ''))
      const unit = totalBudgetMatch[2]?.toLowerCase()
      if (unit === 'k' || unit === 'thousand') num *= 1000
      else if (unit === 'lakh') num *= 100000
      maxBudget = num
      // Approximate 5-7 day trip to derive daily budget threshold
      maxDailyBudget = Math.round(maxBudget / 5)
    }

    // 2. Extract Month / Season
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const monthAbbreviations = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    let targetMonth = null
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i]) || new RegExp(`\\b${monthAbbreviations[i]}\\b`, 'i').test(lower)) {
        targetMonth = months[i]
        break
      }
    }

    // 3. Extract Theme / Environment Tags
    const tags = []
    if (lower.includes('beach') || lower.includes('coastal') || lower.includes('sea') || lower.includes('ocean') || lower.includes('island')) tags.push('beach')
    if (lower.includes('mountain') || lower.includes('hill') || lower.includes('himalaya') || lower.includes('trek') || lower.includes('snow') || lower.includes('valley')) tags.push('mountain')
    if (lower.includes('heritage') || lower.includes('historic') || lower.includes('culture') || lower.includes('temple') || lower.includes('palace') || lower.includes('fort')) tags.push('heritage')
    if (lower.includes('nature') || lower.includes('wildlife') || lower.includes('safari') || lower.includes('forest') || lower.includes('jungle')) tags.push('nature')
    if (lower.includes('desert') || lower.includes('dunes') || lower.includes('sand')) tags.push('desert')
    if (lower.includes('peace') || lower.includes('quiet') || lower.includes('relax') || lower.includes('backwater') || lower.includes('wellness')) tags.push('relaxed')

    // Fetch all destinations with reviews
    const destinations = await Destination.find().lean()
    const reviews = await Review.aggregate([
      { $group: { _id: '$destination', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ])
    const reviewsMap = new Map(reviews.map((r) => [String(r._id), r]))

    // Score and filter destinations based on extracted semantic intent
    const scored = destinations.map((dest) => {
      let score = 0
      const reasons = []
      const textCorpus = `${dest.name} ${dest.state || ''} ${dest.country} ${dest.description} ${(dest.attractions || []).join(' ')} ${dest.bestTimeToVisit || ''}`.toLowerCase()

      // Tag matching (Primary filter weight)
      if (tags.length > 0) {
        let matchedPrimaryTag = false
        if (tags.includes('beach') && /beach|coast|island|lagoon|sea|ocean|cove/i.test(textCorpus)) {
          score += 60
          reasons.push('Renowned coastal & beach landscape')
          matchedPrimaryTag = true
        }
        if (tags.includes('mountain') && /mountain|hill station|himalay|altitude|valley|ridge|peak|cedar/i.test(textCorpus)) {
          score += 60
          reasons.push('Scenic mountain elevations and trails')
          matchedPrimaryTag = true
        }
        if (tags.includes('heritage') && /palace|fort|monument|temple|unesco|heritage|ancient|ruin|ghat/i.test(textCorpus)) {
          score += 50
          reasons.push('Rich historical & monument heritage')
          matchedPrimaryTag = true
        }
        if (tags.includes('nature') && /wildlife|reserve|national park|tea garden|forest|sanctuary|lake/i.test(textCorpus)) {
          score += 50
          reasons.push('Abundant wildlife and pristine nature')
          matchedPrimaryTag = true
        }
        if (tags.includes('desert') && /desert|sand|dune|salt marsh/i.test(textCorpus)) {
          score += 60
          reasons.push('Desert terrain & dune vistas')
          matchedPrimaryTag = true
        }
        if (tags.includes('relaxed') && /relaxed|backwater|tea|garden|boat|quiet|peace|lakeside/i.test(textCorpus)) {
          score += 45
          reasons.push('Peaceful and restorative pace')
          matchedPrimaryTag = true
        }

        // If specific geographic/activity tags were requested and destination doesn't match any, heavily demote
        if (!matchedPrimaryTag) {
          score -= 50
        }
      }

      // Season / Month match
      if (targetMonth) {
        if ((dest.bestTimeToVisit || '').toLowerCase().includes(targetMonth)) {
          score += 35
          reasons.push(`Ideal timing: Best time includes ${targetMonth.charAt(0).toUpperCase() + targetMonth.slice(1)}`)
        }
      }

      // Budget match
      if (maxDailyBudget) {
        if (dest.averageDailyBudgetINR && dest.averageDailyBudgetINR <= maxDailyBudget) {
          score += 30
          reasons.push(`Budget friendly: ₹${dest.averageDailyBudgetINR.toLocaleString('en-IN')}/day fits under target`)
        } else if (dest.averageDailyBudgetINR && dest.averageDailyBudgetINR > maxDailyBudget * 1.3) {
          score -= 40
        }
      }
      if (tags.includes('nature')) {
        if (/wildlife|reserve|national park|tea garden|forest|sanctuary|lake/i.test(textCorpus)) {
          score += 25
          reasons.push('Abundant wildlife and pristine nature')
        }
      }
      if (tags.includes('desert')) {
        if (/desert|sand|dune|salt marsh/i.test(textCorpus)) {
          score += 35
          reasons.push('Desert terrain & dune vistas')
        }
      }
      if (tags.includes('relaxed')) {
        if (/relaxed|backwater|tea|garden|boat|quiet|peace|lakeside/i.test(textCorpus)) {
          score += 20
          reasons.push('Peaceful and restorative pace')
        }
      }

      // Keyword direct boost
      const queryWords = lower.split(/\s+/).filter((w) => w.length > 2 && !['trip', 'tour', 'under', 'with', 'best', 'places', 'want', 'need', 'give', 'show'].includes(w))
      for (const word of queryWords) {
        if (textCorpus.includes(word)) score += 15
      }

      const rev = reviewsMap.get(String(dest._id))
      return {
        ...dest,
        score,
        matchReasons: reasons,
        averageRating: rev ? Math.round(rev.averageRating * 10) / 10 : null,
        reviewCount: rev?.reviewCount || 0,
      }
    })

    // Filter to positive matches and sort by relevance score
    const results = scored
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)

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
    console.error('Smart search error:', err.message)
    return res.status(500).json({ message: 'Smart search encountered an issue.' })
  }
})

// Get one destination by its MongoDB ID or name slug
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose')
    let destination = null

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      destination = await Destination.findById(req.params.id)
    }

    if (!destination) {
      const cleanName = req.params.id.replace(/[-_]/g, ' ').trim()
      destination = await Destination.findOne({
        name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      })
    }

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    return res.json(destination)
  } catch (error) {
    console.error('Destination lookup failed:', error.message)
    return res.status(500).json({ message: 'Error retrieving destination.' })
  }
})

module.exports = router
