// Buses provider — generic HTTP adapter (e.g. Travelopro, Trawex).
// Same pattern as trains.provider.js: fill in BUS_API_URL / BUS_API_KEY and
// adjust the response mapping to your contracted provider's real schema.

const axios = require('axios');
const { generateOptions } = require('./mockData');

async function searchBuses(params) {
  const url = process.env.BUS_API_URL;
  const apiKey = process.env.BUS_API_KEY;

  if (url) {
    try {
      const res = await axios.post(
        url,
        { origin: params.origin, destination: params.destination, date: params.departDate },
        { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, timeout: 8000 },
      );

      if (Array.isArray(res.data?.results) && res.data.results.length > 0) {
        return { demoMode: false, results: res.data.results };
      }
    } catch (err) {
      console.warn('[buses] live provider call failed, falling back to demo data:', err.message);
    }
  }

  return { demoMode: true, results: generateOptions('buses', params) };
}

module.exports = { searchBuses };
