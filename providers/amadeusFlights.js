const TravelOption = require('../models/TravelOption')

const API_BASE = 'https://test.api.amadeus.com'
let cachedToken = ''
let tokenExpiresAt = 0

async function getAccessToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const response = await fetch(`${API_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!response.ok) throw new Error(`Amadeus authentication failed (${response.status}).`)
  const data = await response.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1000
  return cachedToken
}

function flightTime(value) {
  return value ? new Date(value).toISOString().slice(11, 16) : ''
}

async function searchFlights({ origin, destination, departureDate, adults = 1 }) {
  const token = await getAccessToken()
  if (!token) return null

  const url = new URL(`${API_BASE}/v2/shopping/flight-offers`)
  url.search = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: String(adults),
    currencyCode: 'INR',
    max: '50',
  }).toString()

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Amadeus flight search failed (${response.status}).`)
  const payload = await response.json()
  const carriers = payload.dictionaries?.carriers || {}
  const offers = Array.isArray(payload.data) ? payload.data : []

  const saved = await Promise.all(offers.map(async (offer) => {
    const segments = offer.itineraries?.[0]?.segments || []
    if (!segments.length) return null
    const first = segments[0]
    const last = segments[segments.length - 1]
    const currency = offer.price?.currency || 'INR'
    const priceINR = Number(offer.price?.grandTotal || offer.price?.total)
    if (!Number.isFinite(priceINR) || currency !== 'INR') return null
    const carrier = carriers[first.carrierCode] || first.carrierCode
    const data = {
      kind: 'flights',
      name: `${carrier} ${first.number || ''}`.trim(),
      origin: first.departure?.iataCode || origin,
      destination: last.arrival?.iataCode || destination,
      departureTime: flightTime(first.departure?.at),
      arrivalTime: flightTime(last.arrival?.at),
      departureDate,
      priceINR,
      stops: Math.max(0, segments.length - 1),
      travelClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy',
      rating: 0,
      amenities: ['Live fare estimate', 'Price may change before booking'],
      estimated: false,
      provider: 'amadeus',
      providerOfferId: String(offer.id),
      offerExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }
    return TravelOption.findOneAndUpdate(
      { provider: 'amadeus', providerOfferId: data.providerOfferId },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean()
  }))

  return saved.filter(Boolean)
}

module.exports = { searchFlights }
