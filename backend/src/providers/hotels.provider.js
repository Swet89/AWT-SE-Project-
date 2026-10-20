// Hotels/rentals provider — generic HTTP adapter (e.g. Booking.com Demand
// API, Expedia Rapid API). Same pattern as trains.provider.js: fill in
// HOTEL_API_URL / HOTEL_API_KEY and adjust the response mapping to match
// your contracted provider's real schema.

const axios = require('axios');
const { generateOptions } = require('./mockData');

async function searchHotels(params) {
  const url = process.env.HOTEL_API_URL;
  const apiKey = process.env.HOTEL_API_KEY;

  if (url) {
    try {
      const res = await axios.post(
        url,
        {
          destination: params.destination,
          checkIn: params.departDate,
          checkOut: params.returnDate,
          guests: params.passengers || 1,
        },
        { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, timeout: 8000 },
      );

      if (Array.isArray(res.data?.results) && res.data.results.length > 0) {
        return { demoMode: false, results: res.data.results };
      }
    } catch (err) {
      console.warn('[hotels] live provider call failed, falling back to demo data:', err.message);
    }
  }

  return { demoMode: true, results: generateOptions('hotels', params) };
}

module.exports = { searchHotels };
