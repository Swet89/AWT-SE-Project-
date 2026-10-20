// Flights provider — Amadeus for Developers self-service API.
// https://developers.amadeus.com/self-service/category/flights
//
// Falls back to demo data automatically if AMADEUS_CLIENT_ID / SECRET are
// unset, or if anything about the live call fails.

const axios = require('axios');
const { generateOptions } = require('./mockData');

// Amadeus flight search needs IATA codes, not free-text city names. This is
// a small demo lookup for a handful of well-known cities — swap it for a
// real call to Amadeus's "Airport & City Search" API for full coverage.
const IATA_LOOKUP = {
  athens: 'ATH',
  london: 'LON',
  paris: 'PAR',
  rome: 'ROM',
  'new york': 'NYC',
  'los angeles': 'LAX',
  tokyo: 'TYO',
  istanbul: 'IST',
  santorini: 'JTR',
  crete: 'HER',
  malta: 'MLA',
  sicily: 'CTA',
  dubrovnik: 'DBV',
  barcelona: 'BCN',
};

function toIata(place) {
  if (!place) return null;
  const key = place.trim().toLowerCase();
  if (IATA_LOOKUP[key]) return IATA_LOOKUP[key];
  if (/^[A-Za-z]{3}$/.test(place.trim())) return place.trim().toUpperCase();
  return null;
}

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken(baseUrl) {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  const res = await axios.post(
    `${baseUrl}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedToken = res.data.access_token;
  cachedTokenExpiry = Date.now() + (res.data.expires_in - 30) * 1000;
  return cachedToken;
}

function mapAmadeusOffers(offers, dictionaries) {
  return offers.slice(0, 6).map((offer, idx) => {
    const itinerary = offer.itineraries[0];
    const firstSeg = itinerary.segments[0];
    const lastSeg = itinerary.segments[itinerary.segments.length - 1];
    const carrierCode = firstSeg.carrierCode;
    const carrierName = dictionaries?.carriers?.[carrierCode] || carrierCode;

    return {
      id: offer.id || `amadeus-${idx}`,
      provider: 'Amadeus',
      carrier: carrierName,
      from: firstSeg.departure.iataCode,
      to: lastSeg.arrival.iataCode,
      departTime: firstSeg.departure.at?.slice(11, 16),
      arriveTime: lastSeg.arrival.at?.slice(11, 16),
      duration: itinerary.duration?.replace('PT', '').toLowerCase(),
      stops: itinerary.segments.length - 1,
      price: Number(offer.price.total),
      currency: offer.price.currency,
    };
  });
}

async function searchFlights(params) {
  const hasCreds = process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET;
  const originCode = toIata(params.origin);
  const destCode = toIata(params.destination);

  if (hasCreds && originCode && destCode && params.departDate) {
    const baseUrl =
      process.env.AMADEUS_ENV === 'production'
        ? 'https://api.amadeus.com'
        : 'https://test.api.amadeus.com';

    try {
      const token = await getAccessToken(baseUrl);
      const res = await axios.get(`${baseUrl}/v2/shopping/flight-offers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          originLocationCode: originCode,
          destinationLocationCode: destCode,
          departureDate: params.departDate,
          returnDate: params.returnDate || undefined,
          adults: params.passengers || 1,
          max: 6,
        },
      });

      const offers = res.data?.data || [];
      if (offers.length > 0) {
        return { demoMode: false, results: mapAmadeusOffers(offers, res.data.dictionaries) };
      }
    } catch (err) {
      console.warn('[flights] Amadeus call failed, falling back to demo data:', err.message);
    }
  }

  return { demoMode: true, results: generateOptions('flights', params) };
}

module.exports = { searchFlights };
