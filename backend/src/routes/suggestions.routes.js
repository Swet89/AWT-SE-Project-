const express = require('express');
const axios = require('axios');
const suggestions = require('../data/suggestions.json');
const places = require('../data/places.json');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(suggestions);
});

router.get('/places', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q) return res.json([]);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      try {
        const r = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
          params: { input: q, types: '(cities)', key: apiKey },
          timeout: 5000,
        });
        const predictions = r.data?.predictions || [];
        if (predictions.length > 0) {
          return res.json(
            predictions.slice(0, 6).map((p) => ({
              name: p.structured_formatting?.main_text || p.description,
              country: p.structured_formatting?.secondary_text || '',
            })),
          );
        }
      } catch (err) {
        console.warn('[places] Google Places call failed, falling back to offline list:', err.message);
      }
    }

    const matches = places.filter((p) => p.name.toLowerCase().includes(q));
    res.json(matches.slice(0, 6));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
