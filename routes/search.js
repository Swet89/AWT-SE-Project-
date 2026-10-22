const express = require('express')
const TravelOption = require('../models/TravelOption')
const { searchFlights } = require('../providers/amadeusFlights')

const router = express.Router()
const allowedKinds = ['flights', 'trains', 'buses', 'cruises', 'hotels', 'rentals', 'hostels']
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const departurePeriods = {
  morning: ['05:00', '12:00'],
  afternoon: ['12:00', '17:00'],
  evening: ['17:00', '21:00'],
  night: true,
}

router.get('/:kind', async (req, res) => {
  try {
    const { kind } = req.params

    if (!allowedKinds.includes(kind)) {
      return res.status(404).json({ message: 'Search category not found.' })
    }

    const filters = { kind }
    const from = String(req.query.from || '').trim().slice(0, 80)
    const to = String(req.query.to || '').trim().slice(0, 80)

    const isAccommodation = ['hotels', 'rentals', 'hostels'].includes(kind)
    if (from && !isAccommodation) {
      filters.origin = { $regex: escapeRegex(from), $options: 'i' }
    }

    if (to) {
      filters.destination = { $regex: escapeRegex(to), $options: 'i' }
    }

    const minPrice = req.query.minPrice === undefined || req.query.minPrice === ''
      ? undefined
      : Number(req.query.minPrice)
    const maxPrice = req.query.maxPrice === undefined || req.query.maxPrice === ''
      ? undefined
      : Number(req.query.maxPrice)
    if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
        (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
        (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      return res.status(400).json({ message: 'Enter a valid minimum and maximum price.' })
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.priceINR = {}
      if (minPrice !== undefined) filters.priceINR.$gte = minPrice
      if (maxPrice !== undefined) filters.priceINR.$lte = maxPrice
    }

    if (req.query.minRating) {
      const minRating = Number(req.query.minRating)
      if (!Number.isFinite(minRating) || minRating < 0 || minRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 0 and 5.' })
      }
      filters.rating = { $gte: minRating }
    }

    if (req.query.maxStops !== undefined && req.query.maxStops !== '') {
      const maxStops = Number(req.query.maxStops)
      if (!Number.isInteger(maxStops) || maxStops < 0 || maxStops > 10) {
        return res.status(400).json({ message: 'Stops must be from 0 to 10.' })
      }
      filters.stops = { $lte: maxStops }
    }

    const travelClass = String(req.query.travelClass || '').trim().slice(0, 40)
    if (travelClass) filters.travelClass = { $regex: `^${escapeRegex(travelClass)}$`, $options: 'i' }

    const departurePeriod = String(req.query.departurePeriod || '')
    if (departurePeriod && !isAccommodation) {
      const period = departurePeriods[departurePeriod]
      if (!period) return res.status(400).json({ message: 'Choose a valid departure time.' })
      filters.departureTime = departurePeriod === 'night'
        ? { $regex: '^(2[1-3]:|0[0-4]:)' }
        : { $gte: period[0], $lt: period[1] }
    }

    const sort = String(req.query.sort || 'price')
    const validSorts = ['price', 'priceDesc', 'rating', 'departure']
    if (!validSorts.includes(sort) || (isAccommodation && sort === 'departure')) {
      return res.status(400).json({ message: 'Choose a valid sort option.' })
    }

    const sortBy = sort === 'rating'
      ? { rating: -1, priceINR: 1 }
      : sort === 'departure'
        ? { departureTime: 1, priceINR: 1 }
        : sort === 'priceDesc'
          ? { priceINR: -1, _id: 1 }
          : { priceINR: 1, _id: 1 }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))

    // Amadeus requires IATA airport codes and a departure date. When credentials
    // are absent or the live provider is unavailable, the seeded Mongo results remain usable.
    if (kind === 'flights' && /^[A-Z]{3}$/i.test(from) && /^[A-Z]{3}$/i.test(to) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.departureDate || ''))) {
      try {
        const liveResults = await searchFlights({
          origin: from.toUpperCase(),
          destination: to.toUpperCase(),
          departureDate: String(req.query.departureDate),
          adults: Math.min(9, Math.max(1, Number.parseInt(req.query.adults, 10) || 1)),
        })
        if (liveResults?.length) {
          let filtered = liveResults.filter((item) => {
            if (minPrice !== undefined && item.priceINR < minPrice) return false
            if (maxPrice !== undefined && item.priceINR > maxPrice) return false
            if (req.query.minRating && Number(req.query.minRating) > 0) return false
            if (req.query.maxStops !== undefined && req.query.maxStops !== '' && item.stops > Number(req.query.maxStops)) return false
            if (travelClass && !item.travelClass.toLowerCase().includes(travelClass.toLowerCase())) return false
            if (departurePeriod && departurePeriod !== 'night') {
              const [start, end] = departurePeriods[departurePeriod]
              if (item.departureTime < start || item.departureTime >= end) return false
            } else if (departurePeriod === 'night' && !/^(2[1-3]:|0[0-4]:)/.test(item.departureTime)) return false
            return true
          })
          filtered.sort((a, b) => sort === 'priceDesc' ? b.priceINR - a.priceINR :
            sort === 'departure' ? a.departureTime.localeCompare(b.departureTime) : a.priceINR - b.priceINR)
          const total = filtered.length
          const results = filtered.slice((page - 1) * limit, page * limit).map((item) => ({ ...item, status: 'Live' }))
          return res.json({ results, page, limit, total, source: 'amadeus' })
        }
      } catch (providerError) {
        console.error('Live flight provider unavailable; using estimates:', providerError.message)
      }
    }

    const [results, total] = await Promise.all([
      TravelOption.find(filters)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TravelOption.countDocuments(filters),
    ])

    return res.json({
      results: results.map((item) => ({
        ...item,
        status: item.estimated === false ? 'Live' : 'Estimated',
      })),
      page,
      limit,
      total,
    })
  } catch (error) {
    console.error('Travel search failed:', error.message)
    return res.status(500).json({ message: 'Could not search travel options.' })
  }
})

module.exports = router
