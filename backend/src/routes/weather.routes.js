const express = require('express');
const { getWeather } = require('../services/weather.service');

const router = express.Router();

router.get('/:city', async (req, res, next) => {
  try {
    const data = await getWeather(req.params.city);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
