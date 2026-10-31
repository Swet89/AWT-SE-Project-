const express = require('express')

const TravelOption = require('../models/TravelOption')
const { searchFlights } = require('../providers/amadeusFlights')

const router = express.Router()

const allowedKinds = [
  'flights',
  'trains',
  'buses',
  'cruises',
  'hotels',
  'rentals',
  'hostels',
]

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const departurePeriods = {
  morning: ['05:00', '12:00'],
  afternoon: ['12:00', '17:00'],
  evening: ['17:00', '21:00'],
  night: true,
}

// Dictionary of city names, airport codes, and common aliases
const locationAliases = {
  // Mumbai
  BOM: { code: 'BOM', city: 'Mumbai', aliases: ['BOM', 'MUM', 'MUMBAI', 'BOMBAY'] },
  MUM: { code: 'BOM', city: 'Mumbai', aliases: ['BOM', 'MUM', 'MUMBAI', 'BOMBAY'] },
  MUMBAI: { code: 'BOM', city: 'Mumbai', aliases: ['BOM', 'MUM', 'MUMBAI', 'BOMBAY'] },
  BOMBAY: { code: 'BOM', city: 'Mumbai', aliases: ['BOM', 'MUM', 'MUMBAI', 'BOMBAY'] },

  // Delhi
  DEL: { code: 'DEL', city: 'Delhi', aliases: ['DEL', 'DELHI', 'NEW DELHI', 'NDLS'] },
  DELHI: { code: 'DEL', city: 'Delhi', aliases: ['DEL', 'DELHI', 'NEW DELHI', 'NDLS'] },
  'NEW DELHI': { code: 'DEL', city: 'Delhi', aliases: ['DEL', 'DELHI', 'NEW DELHI', 'NDLS'] },

  // Bengaluru
  BLR: { code: 'BLR', city: 'Bengaluru', aliases: ['BLR', 'BENGALURU', 'BANGALORE'] },
  BENGALURU: { code: 'BLR', city: 'Bengaluru', aliases: ['BLR', 'BENGALURU', 'BANGALORE'] },
  BANGALORE: { code: 'BLR', city: 'Bengaluru', aliases: ['BLR', 'BENGALURU', 'BANGALORE'] },

  // Goa
  GOI: { code: 'GOI', city: 'Goa', aliases: ['GOI', 'GOX', 'GOA', 'DABOLIM', 'MOPA'] },
  GOX: { code: 'GOI', city: 'Goa', aliases: ['GOI', 'GOX', 'GOA', 'DABOLIM', 'MOPA'] },
  GOA: { code: 'GOI', city: 'Goa', aliases: ['GOI', 'GOX', 'GOA', 'DABOLIM', 'MOPA'] },

  // Hyderabad
  HYD: { code: 'HYD', city: 'Hyderabad', aliases: ['HYD', 'HYDERABAD', 'SECUNDERABAD'] },
  HYDERABAD: { code: 'HYD', city: 'Hyderabad', aliases: ['HYD', 'HYDERABAD', 'SECUNDERABAD'] },

  // Kolkata
  CCU: { code: 'CCU', city: 'Kolkata', aliases: ['CCU', 'KOLKATA', 'CALCUTTA'] },
  KOLKATA: { code: 'CCU', city: 'Kolkata', aliases: ['CCU', 'KOLKATA', 'CALCUTTA'] },
  CALCUTTA: { code: 'CCU', city: 'Kolkata', aliases: ['CCU', 'KOLKATA', 'CALCUTTA'] },

  // Chennai
  MAA: { code: 'MAA', city: 'Chennai', aliases: ['MAA', 'CHENNAI', 'MADRAS'] },
  CHENNAI: { code: 'MAA', city: 'Chennai', aliases: ['MAA', 'CHENNAI', 'MADRAS'] },
  MADRAS: { code: 'MAA', city: 'Chennai', aliases: ['MAA', 'CHENNAI', 'MADRAS'] },

  // Ahmedabad
  AMD: { code: 'AMD', city: 'Ahmedabad', aliases: ['AMD', 'AHMEDABAD', 'AHMADABAD'] },
  AHMEDABAD: { code: 'AMD', city: 'Ahmedabad', aliases: ['AMD', 'AHMEDABAD', 'AHMADABAD'] },

  // Pune
  PNQ: { code: 'PNQ', city: 'Pune', aliases: ['PNQ', 'PUNE', 'POONA'] },
  PUNE: { code: 'PNQ', city: 'Pune', aliases: ['PNQ', 'PUNE', 'POONA'] },

  // Jaipur
  JAI: { code: 'JAI', city: 'Jaipur', aliases: ['JAI', 'JAIPUR', 'PINK CITY'] },
  JAIPUR: { code: 'JAI', city: 'Jaipur', aliases: ['JAI', 'JAIPUR', 'PINK CITY'] },

  // Kochi / Kerala
  COK: { code: 'COK', city: 'Kochi', aliases: ['COK', 'KOCHI', 'COCHIN', 'KERALA'] },
  KOCHI: { code: 'COK', city: 'Kochi', aliases: ['COK', 'KOCHI', 'COCHIN', 'KERALA'] },
  COCHIN: { code: 'COK', city: 'Kochi', aliases: ['COK', 'KOCHI', 'COCHIN', 'KERALA'] },
  KERALA: { code: 'COK', city: 'Kochi', aliases: ['COK', 'KOCHI', 'COCHIN', 'KERALA'] },

  // Varanasi
  VNS: { code: 'VNS', city: 'Varanasi', aliases: ['VNS', 'VARANASI', 'BANARAS', 'KASHI'] },
  VARANASI: { code: 'VNS', city: 'Varanasi', aliases: ['VNS', 'VARANASI', 'BANARAS', 'KASHI'] },

  // Agra
  AGR: { code: 'AGR', city: 'Agra', aliases: ['AGR', 'AGRA'] },
  AGRA: { code: 'AGR', city: 'Agra', aliases: ['AGR', 'AGRA'] },

  // Udaipur
  UDR: { code: 'UDR', city: 'Udaipur', aliases: ['UDR', 'UDAIPUR'] },
  UDAIPUR: { code: 'UDR', city: 'Udaipur', aliases: ['UDR', 'UDAIPUR'] },

  // International
  DXB: { code: 'DXB', city: 'Dubai', aliases: ['DXB', 'DUBAI'] },
  DUBAI: { code: 'DXB', city: 'Dubai', aliases: ['DXB', 'DUBAI'] },

  LHR: { code: 'LHR', city: 'London', aliases: ['LHR', 'LONDON', 'HEATHROW'] },
  LONDON: { code: 'LHR', city: 'London', aliases: ['LHR', 'LONDON', 'HEATHROW'] },

  SIN: { code: 'SIN', city: 'Singapore', aliases: ['SIN', 'SINGAPORE', 'CHANGI'] },
  SINGAPORE: { code: 'SIN', city: 'Singapore', aliases: ['SIN', 'SINGAPORE', 'CHANGI'] },

  JFK: { code: 'JFK', city: 'New York', aliases: ['JFK', 'NEW YORK', 'NYC'] },
  'NEW YORK': { code: 'JFK', city: 'New York', aliases: ['JFK', 'NEW YORK', 'NYC'] },
  NYC: { code: 'JFK', city: 'New York', aliases: ['JFK', 'NEW YORK', 'NYC'] },

  CDG: { code: 'CDG', city: 'Paris', aliases: ['CDG', 'PARIS'] },
  PARIS: { code: 'CDG', city: 'Paris', aliases: ['CDG', 'PARIS'] },

  NRT: { code: 'NRT', city: 'Tokyo', aliases: ['NRT', 'TOKYO', 'HND', 'NARITA', 'HANEDA'] },
  TOKYO: { code: 'NRT', city: 'Tokyo', aliases: ['NRT', 'TOKYO', 'HND', 'NARITA', 'HANEDA'] },

  BKK: { code: 'BKK', city: 'Bangkok', aliases: ['BKK', 'BANGKOK', 'SUVARNABHUMI'] },
  BANGKOK: { code: 'BKK', city: 'Bangkok', aliases: ['BKK', 'BANGKOK', 'SUVARNABHUMI'] },
}

function resolveLocation(input) {
  if (!input) return null
  const clean = String(input).trim().toUpperCase()
  return locationAliases[clean] || null
}

function buildLocationPattern(input) {
  if (!input) return null
  const meta = resolveLocation(input)
  if (meta && meta.aliases && meta.aliases.length > 0) {
    return meta.aliases.map(escapeRegex).join('|')
  }
  return escapeRegex(input)
}

function generateRouteOptions(kind, from, to, fromMeta, toMeta) {
  const originCode = fromMeta ? (kind === 'flights' ? fromMeta.code : fromMeta.city) : from
  const destCode = toMeta ? (kind === 'flights' ? toMeta.code : toMeta.city) : to
  const originDisplay = fromMeta?.city || from
  const destDisplay = toMeta?.city || to

  if (kind === 'flights') {
    const airlines = [
      { name: 'IndiGo 6E', code: '6E', base: 4599, rating: 4.4, cls: 'Economy', dep: '06:15', arr: '08:30', stops: 0 },
      { name: 'Air India AI', code: 'AI', base: 5250, rating: 4.2, cls: 'Economy', dep: '09:40', arr: '11:55', stops: 0 },
      { name: 'Vistara UK', code: 'UK', base: 6100, rating: 4.7, cls: 'Economy', dep: '13:45', arr: '16:00', stops: 0 },
      { name: 'Akasa Air QP', code: 'QP', base: 4299, rating: 4.3, cls: 'Economy', dep: '17:30', arr: '19:45', stops: 0 },
      { name: 'Air India Business AI', code: 'AI', base: 14200, rating: 4.8, cls: 'Business', dep: '19:15', arr: '21:30', stops: 0 },
      { name: 'SpiceJet SG', code: 'SG', base: 3950, rating: 4.0, cls: 'Economy', dep: '21:45', arr: '23:55', stops: 0 },
    ]

    return airlines.map((a) => {
      const flightNum = 100 + Math.floor(Math.random() * 899)
      return {
        kind: 'flights',
        name: `${a.name} ${flightNum}`,
        origin: originCode || 'BOM',
        destination: destCode || 'DEL',
        departureTime: a.dep,
        arrivalTime: a.arr,
        priceINR: a.base,
        stops: a.stops,
        travelClass: a.cls,
        rating: a.rating,
        estimated: true,
        provider: 'schedule-engine',
        amenities: a.cls === 'Business'
          ? ['Priority check-in', 'Lounge access', 'Complimentary meals', 'Extra baggage (35 kg)']
          : ['Snacks on board', 'Cabin baggage (7 kg)', 'Check-in baggage (15 kg)', 'Web check-in'],
      }
    })
  }

  if (kind === 'trains') {
    const trains = [
      { name: `${destDisplay} Vande Bharat Express`, dep: '06:00', arr: '12:30', price: 1450, cls: 'CC', rating: 4.8, stops: 3 },
      { name: `${destDisplay} Superfast Express`, dep: '16:30', arr: '07:15', price: 1680, cls: '3A', rating: 4.3, stops: 6 },
      { name: `${destDisplay} Tejas Rajdhani`, dep: '17:00', arr: '08:30', price: 2450, cls: '3A', rating: 4.7, stops: 4 },
      { name: `${destDisplay} Jan Shatabdi Express`, dep: '14:15', arr: '20:45', price: 680, cls: 'CC', rating: 4.2, stops: 5 },
    ]
    return trains.map((t) => ({
      kind: 'trains',
      name: t.name,
      origin: originDisplay || from,
      destination: destDisplay || to,
      departureTime: t.dep,
      arrivalTime: t.arr,
      priceINR: t.price,
      stops: t.stops,
      travelClass: t.cls,
      rating: t.rating,
      estimated: true,
      provider: 'schedule-engine',
      amenities: ['Charging sockets', 'Clean washrooms', 'Pantry service'],
    }))
  }

  if (kind === 'buses') {
    const buses = [
      { name: `${destDisplay} Volvo Multi-Axle AC Sleeper`, dep: '21:30', arr: '06:30', price: 950, cls: 'Volvo AC Sleeper', rating: 4.5, stops: 1 },
      { name: `${destDisplay} Premium BharatBenz AC`, dep: '22:15', arr: '07:00', price: 820, cls: 'Semi-Sleeper', rating: 4.3, stops: 2 },
      { name: `${destDisplay} Intercity Express Volvo`, dep: '07:30', arr: '14:30', price: 750, cls: 'Semi-Sleeper', rating: 4.2, stops: 2 },
    ]
    return buses.map((b) => ({
      kind: 'buses',
      name: b.name,
      origin: originDisplay || from,
      destination: destDisplay || to,
      departureTime: b.dep,
      arrivalTime: b.arr,
      priceINR: b.price,
      stops: b.stops,
      travelClass: b.cls,
      rating: b.rating,
      estimated: true,
      provider: 'schedule-engine',
      amenities: ['Air conditioning', 'Charging point', 'Blanket', 'Water bottle'],
    }))
  }

  return []
}

router.get('/:kind', async (req, res) => {
  try {
    const { kind } = req.params

    if (!allowedKinds.includes(kind)) {
      return res.status(404).json({
        message: 'Search category not found.',
      })
    }

    const filters = { kind }

    const from = String(req.query.from || '')
      .trim()
      .slice(0, 80)

    const to = String(req.query.to || '')
      .trim()
      .slice(0, 80)

    const isAccommodation = [
      'hotels',
      'rentals',
      'hostels',
    ].includes(kind)

    const fromMeta = resolveLocation(from)
    const toMeta = resolveLocation(to)

    if (from && !isAccommodation) {
      filters.origin = {
        $regex: buildLocationPattern(from),
        $options: 'i',
      }
    }

    if (to) {
      filters.destination = {
        $regex: buildLocationPattern(to),
        $options: 'i',
      }
    }

    const minPrice =
      req.query.minPrice === undefined ||
      req.query.minPrice === ''
        ? undefined
        : Number(req.query.minPrice)

    const maxPrice =
      req.query.maxPrice === undefined ||
      req.query.maxPrice === ''
        ? undefined
        : Number(req.query.maxPrice)

    if (
      (minPrice !== undefined &&
        (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice)
    ) {
      return res.status(400).json({
        message: 'Enter a valid minimum and maximum price.',
      })
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.priceINR = {}

      if (minPrice !== undefined) {
        filters.priceINR.$gte = minPrice
      }

      if (maxPrice !== undefined) {
        filters.priceINR.$lte = maxPrice
      }
    }

    if (req.query.minRating) {
      const minRating = Number(req.query.minRating)

      if (
        !Number.isFinite(minRating) ||
        minRating < 0 ||
        minRating > 5
      ) {
        return res.status(400).json({
          message: 'Rating must be between 0 and 5.',
        })
      }

      filters.rating = {
        $gte: minRating,
      }
    }

    if (
      req.query.maxStops !== undefined &&
      req.query.maxStops !== ''
    ) {
      const maxStops = Number(req.query.maxStops)

      if (
        !Number.isInteger(maxStops) ||
        maxStops < 0 ||
        maxStops > 10
      ) {
        return res.status(400).json({
          message: 'Stops must be from 0 to 10.',
        })
      }

      filters.stops = {
        $lte: maxStops,
      }
    }

    const travelClass = String(req.query.travelClass || '')
      .trim()
      .slice(0, 40)

    if (travelClass) {
      filters.travelClass = {
        $regex: `^${escapeRegex(travelClass)}$`,
        $options: 'i',
      }
    }

    const departurePeriod = String(
      req.query.departurePeriod || '',
    )

    if (departurePeriod && !isAccommodation) {
      const period = departurePeriods[departurePeriod]

      if (!period) {
        return res.status(400).json({
          message: 'Choose a valid departure time.',
        })
      }

      filters.departureTime =
        departurePeriod === 'night'
          ? {
              $regex: '^(2[1-3]:|0[0-4]:)',
            }
          : {
              $gte: period[0],
              $lt: period[1],
            }
    }

    const sort = String(req.query.sort || 'price')

    const validSorts = [
      'price',
      'priceDesc',
      'rating',
      'departure',
    ]

    if (
      !validSorts.includes(sort) ||
      (isAccommodation && sort === 'departure')
    ) {
      return res.status(400).json({
        message: 'Choose a valid sort option.',
      })
    }

    const sortBy =
      sort === 'rating'
        ? {
            rating: -1,
            priceINR: 1,
          }
        : sort === 'departure'
          ? {
              departureTime: 1,
              priceINR: 1,
            }
          : sort === 'priceDesc'
            ? {
                priceINR: -1,
                _id: 1,
              }
            : {
                priceINR: 1,
                _id: 1,
              }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1,
    )

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 10,
      ),
    )

    // Amadeus live search integration
    const iataFrom = fromMeta ? fromMeta.code : from.toUpperCase()
    const iataTo = toMeta ? toMeta.code : to.toUpperCase()

    if (
      kind === 'flights' &&
      /^[A-Z]{3}$/.test(iataFrom) &&
      /^[A-Z]{3}$/.test(iataTo) &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        String(req.query.departureDate || ''),
      )
    ) {
      try {
        const liveResults = await searchFlights({
          origin: iataFrom,
          destination: iataTo,
          departureDate: String(req.query.departureDate),
          adults: Math.min(
            9,
            Math.max(
              1,
              Number.parseInt(req.query.adults, 10) || 1,
            ),
          ),
        })

        if (liveResults?.length) {
          const filtered = liveResults.filter((item) => {
            if (
              minPrice !== undefined &&
              item.priceINR < minPrice
            ) {
              return false
            }

            if (
              maxPrice !== undefined &&
              item.priceINR > maxPrice
            ) {
              return false
            }

            if (
              req.query.minRating &&
              Number(req.query.minRating) > 0
            ) {
              return false
            }

            if (
              req.query.maxStops !== undefined &&
              req.query.maxStops !== '' &&
              item.stops > Number(req.query.maxStops)
            ) {
              return false
            }

            if (
              travelClass &&
              !item.travelClass
                .toLowerCase()
                .includes(travelClass.toLowerCase())
            ) {
              return false
            }

            if (
              departurePeriod &&
              departurePeriod !== 'night'
            ) {
              const [start, end] =
                departurePeriods[departurePeriod]

              if (
                item.departureTime < start ||
                item.departureTime >= end
              ) {
                return false
              }
            } else if (
              departurePeriod === 'night' &&
              !/^(2[1-3]:|0[0-4]:)/.test(
                item.departureTime,
              )
            ) {
              return false
            }

            return true
          })

          filtered.sort((a, b) =>
            sort === 'priceDesc'
              ? b.priceINR - a.priceINR
              : sort === 'departure'
                ? a.departureTime.localeCompare(
                    b.departureTime,
                  )
                : a.priceINR - b.priceINR,
          )

          const total = filtered.length

          const results = filtered
            .slice(
              (page - 1) * limit,
              page * limit,
            )
            .map((item) => ({
              ...item,
              status: 'Live',
            }))

          return res.json({
            results,
            page,
            limit,
            total,
            source: 'amadeus',
          })
        }
      } catch (providerError) {
        console.error(
          'Live flight provider unavailable; using estimates:',
          providerError.message,
        )
      }
    }

    let [results, total] = await Promise.all([
      TravelOption.find(filters)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      TravelOption.countDocuments(filters),
    ])

    // Fallback: If 0 options found for route search and origin/destination were specified,
    // dynamically synthesize realistic options so the search never dead-ends.
    if (total === 0 && (from || to) && (kind === 'flights' || kind === 'trains' || kind === 'buses')) {
      const generated = generateRouteOptions(kind, from, to, fromMeta, toMeta)
      if (generated && generated.length > 0) {
        await TravelOption.insertMany(generated, { ordered: false }).catch(() => {})
        ;[results, total] = await Promise.all([
          TravelOption.find(filters)
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          TravelOption.countDocuments(filters),
        ])
      }
    }

    return res.json({
      results: results.map((item) => ({
        ...item,
        status:
          item.estimated === false
            ? 'Live'
            : 'Estimated',
      })),
      page,
      limit,
      total,
    })
  } catch (error) {
    console.error(
      'Travel search failed:',
      error.message,
    )

    return res.status(500).json({
      message: 'Could not search travel options.',
    })
  }
})

module.exports = router
