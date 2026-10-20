// Trains provider — generic HTTP adapter.
//
// Rail providers (Rail Europe, SaveATrain, and similar) each have their own
// request/response shape and typically require a signed contract before you
// get real credentials, so this file is a template rather than a finished
// integration: point TRAIN_API_URL at your provider and adjust the request
// body / response mapping below to match their actual docs.

const axios = require('axios');
const { generateOptions } = require('./mockData');

async function searchTrains(params) {
  const url = process.env.TRAIN_API_URL;
  const apiKey = process.env.TRAIN_API_KEY;

  if (url) {
    try {
      const res = await axios.post(
        url,
        {
          origin: params.origin,
          destination: params.destination,
          date: params.departDate,
        },
        { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, timeout: 8000 },
      );

      // TODO: map `res.data` into our TravelOption shape once you know your
      // provider's real response format. Example shape we expect back:
      // { id, provider, carrier, from, to, departTime, arriveTime, duration, stops, price, currency }
      if (Array.isArray(res.data?.results) && res.data.results.length > 0) {
        return { demoMode: false, results: res.data.results };
      }
    } catch (err) {
      console.warn('[trains] live provider call failed, falling back to demo data:', err.message);
    }
  }

  return { demoMode: true, results: generateOptions('trains', params) };
}

module.exports = { searchTrains };
