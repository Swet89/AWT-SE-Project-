const express = require('express');
const { searchFlights } = require('../providers/flights.provider');
const { searchTrains } = require('../providers/trains.provider');
const { searchBuses } = require('../providers/buses.provider');
const { searchCruises } = require('../providers/cruises.provider');
const { searchHotels } = require('../providers/hotels.provider');

const router = express.Router();

const HANDLERS = {
  flights: searchFlights,
  trains: searchTrains,
  buses: searchBuses,
  cruises: searchCruises,
  hotels: searchHotels,
};

router.get('/search', async (req, res, next) => {
  try {
    const { mode, origin, destination, departDate, returnDate, passengers } = req.query;

    if (!mode || !HANDLERS[mode]) {
      return res.status(400).json({ message: `mode must be one of: ${Object.keys(HANDLERS).join(', ')}` });
    }
    if (!destination) {
      return res.status(400).json({ message: 'destination is required.' });
    }

    const { demoMode, results } = await HANDLERS[mode]({
      origin,
      destination,
      departDate,
      returnDate,
      passengers: passengers ? Number(passengers) : undefined,
    });

    res.json({ mode, demoMode, count: results.length, results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
