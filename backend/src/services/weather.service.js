// Weather widget backend. Uses OpenWeatherMap's Current Weather API when
// OPENWEATHER_API_KEY is set; otherwise returns deterministic demo data so
// the widget is fully testable without a key.

const axios = require('axios');

const DEITY_BY_CONDITION = {
  clear: 'Zeus',
  clouds: 'Hera',
  rain: 'Poseidon',
  drizzle: 'Poseidon',
  thunderstorm: 'Zeus',
  snow: 'Boreas',
  mist: 'Aeolus',
  fog: 'Aeolus',
  haze: 'Aeolus',
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function demoWeather(city) {
  const seed = hashString(city.toLowerCase());
  const conditions = ['clear', 'clouds', 'rain', 'mist', 'thunderstorm'];
  const condition = conditions[seed % conditions.length];
  const tempC = 12 + (seed % 22);
  const humidity = 40 + (seed % 50);
  const windKph = 5 + (seed % 35);
  const descriptions = {
    clear: 'clear sky',
    clouds: 'scattered clouds',
    rain: 'light rain',
    mist: 'misty',
    thunderstorm: 'distant thunder',
  };

  return {
    city,
    tempC,
    description: descriptions[condition],
    humidity,
    windKph,
    deity: DEITY_BY_CONDITION[condition] || 'Zeus',
    demoMode: true,
  };
}

async function getWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return demoWeather(city);

  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: apiKey, units: 'metric' },
      timeout: 6000,
    });

    const conditionMain = (res.data.weather?.[0]?.main || 'clear').toLowerCase();
    const deityKey = Object.keys(DEITY_BY_CONDITION).find((k) => conditionMain.includes(k));

    return {
      city: res.data.name || city,
      country: res.data.sys?.country,
      tempC: Math.round(res.data.main?.temp),
      description: res.data.weather?.[0]?.description || 'unknown',
      humidity: res.data.main?.humidity,
      windKph: Math.round((res.data.wind?.speed || 0) * 3.6),
      deity: DEITY_BY_CONDITION[deityKey] || 'Zeus',
      demoMode: false,
    };
  } catch (err) {
    console.warn('[weather] live call failed, falling back to demo data:', err.message);
    return demoWeather(city);
  }
}

module.exports = { getWeather };
