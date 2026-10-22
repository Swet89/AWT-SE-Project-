const express = require('express')
const Destination = require('../models/Destination')
const Place = require('../models/Place')

const router = express.Router()

router.get('/autocomplete', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 100)

    if (query.length < 2) {
      return res.json([])
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matchQuery = {
      $or: [
        { name: { $regex: safeQuery, $options: 'i' } },
        { state: { $regex: safeQuery, $options: 'i' } },
        { country: { $regex: safeQuery, $options: 'i' } },
        { city: { $regex: safeQuery, $options: 'i' } },
      ],
    }
    const [destinations, cachedPlaces] = await Promise.all([
      Destination.find({
        $or: [
          { name: { $regex: safeQuery, $options: 'i' } },
          { state: { $regex: safeQuery, $options: 'i' } },
          { country: { $regex: safeQuery, $options: 'i' } },
        ],
      }).select('name state country imageUrl').limit(8).sort({ name: 1 }).lean(),
      Place.find(matchQuery).limit(8).sort({ name: 1 }).lean(),
    ])

    let remotePlaces = []
    try {
      const photonUrl = new URL('https://photon.komoot.io/api/')
      photonUrl.searchParams.set('q', query)
      photonUrl.searchParams.set('limit', '8')
      const photonResponse = await fetch(photonUrl, {
        headers: { 'User-Agent': 'OdysseyTravel/1.0 (place autocomplete)' },
        signal: AbortSignal.timeout(5000),
      })
      if (photonResponse.ok) {
        const photonData = await photonResponse.json()
        const placesToCache = (photonData.features || []).flatMap((feature) => {
          const properties = feature.properties || {}
          const name = String(properties.name || properties.city || '').trim()
          const coordinates = feature.geometry?.coordinates
          const providerId = String(properties.osm_type || 'osm') + ':' + String(properties.osm_id || '')
          if (!name || providerId.endsWith(':') || !Array.isArray(coordinates)) return []
          return [{
            provider: 'photon',
            providerId,
            name,
            city: String(properties.city || properties.name || ''),
            state: String(properties.state || ''),
            country: String(properties.country || ''),
            coordinates: { longitude: Number(coordinates[0]), latitude: Number(coordinates[1]) },
            lastSeenAt: new Date(),
          }]
        })

        if (placesToCache.length) {
          await Place.bulkWrite(placesToCache.map((place) => ({
            updateOne: {
              filter: { provider: place.provider, providerId: place.providerId },
              update: { $set: place },
              upsert: true,
            },
          })), { ordered: false })
          remotePlaces = await Place.find({
            provider: 'photon',
            providerId: { $in: placesToCache.map((place) => place.providerId) },
          }).lean()
        }
      }
    } catch (providerError) {
      console.warn('Photon autocomplete unavailable; using MongoDB cache:', providerError.message)
    }

    const results = new Map()
    for (const place of [...destinations, ...cachedPlaces, ...remotePlaces]) {
      const key = `${place.name}|${place.state || ''}|${place.country || ''}`.toLowerCase()
      if (!results.has(key)) results.set(key, place)
    }
    return res.json(Array.from(results.values()).slice(0, 8))
  } catch (error) {
    console.error('Autocomplete failed:', error.message)
    res.status(500).json({ message: 'Could not search destinations' })
  }
})

module.exports = router
