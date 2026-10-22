const express = require('express')
const mongoose = require('mongoose')
const Destination = require('../models/Destination')

const router = express.Router()

function weatherDescription(code) {
  if (code === 0) return 'clear sky'
  if ([1, 2].includes(code)) return 'partly cloudy'
  if (code === 3) return 'overcast'
  if ([45, 48].includes(code)) return 'fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'thunderstorm'
  return 'weather conditions unavailable'
}

function weatherIcon(code) {
  if (code === 0) return '01d'
  if (code === 1) return '02d'
  if (code === 2) return '03d'
  if (code === 3) return '04d'
  if ([45, 48].includes(code)) return '50d'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '10d'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '13d'
  if ([95, 96, 99].includes(code)) return '11d'
  return '02d'
}

function formatOpenWeather(current, forecast) {
  const byDate = new Map()
  for (const item of forecast.list || []) {
    const date = item.dt_txt?.split(' ')[0]
    if (!date) continue
    const entry = byDate.get(date) || {
      date,
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
      icon: item.weather?.[0]?.icon || '02d',
      description: item.weather?.[0]?.description || 'Weather unavailable',
    }
    entry.max = Math.max(entry.max, item.main.temp_max)
    entry.min = Math.min(entry.min, item.main.temp_min)
    if (item.dt_txt?.includes('12:00:00')) {
      entry.icon = item.weather?.[0]?.icon || entry.icon
      entry.description = item.weather?.[0]?.description || entry.description
    }
    byDate.set(date, entry)
  }

  return {
    current: {
      temperatureC: Math.round(current.main.temp),
      feelsLikeC: Math.round(current.main.feels_like),
      description: current.weather?.[0]?.description || 'Weather unavailable',
      icon: current.weather?.[0]?.icon || '02d',
      humidity: current.main.humidity,
      windSpeed: current.wind?.speed,
    },
    forecast: Array.from(byDate.values()).slice(0, 5).map((day) => ({
      ...day,
      max: Math.round(day.max),
      min: Math.round(day.min),
    })),
    provider: 'OpenWeatherMap',
  }
}

async function getOpenMeteoWeather(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', latitude)
  url.searchParams.set('longitude', longitude)
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m')
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('forecast_days', '5')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await response.json()
  if (!response.ok || data.error) {
    throw new Error(data.reason || 'Open-Meteo could not return weather data.')
  }

  const current = data.current || {}
  const daily = data.daily || {}
  return {
    current: {
      temperatureC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      description: weatherDescription(Number(current.weather_code)),
      icon: weatherIcon(Number(current.weather_code)),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
    },
    forecast: (daily.time || []).map((date, index) => ({
      date,
      max: Math.round(daily.temperature_2m_max?.[index]),
      min: Math.round(daily.temperature_2m_min?.[index]),
      description: weatherDescription(Number(daily.weather_code?.[index])),
      icon: weatherIcon(Number(daily.weather_code?.[index])),
    })),
    provider: 'Open-Meteo',
  }
}

async function getOpenWeatherMapWeather(latitude, longitude, apiKey) {
  const currentUrl = new URL('https://api.openweathermap.org/data/2.5/weather')
  const forecastUrl = new URL('https://api.openweathermap.org/data/2.5/forecast')
  for (const url of [currentUrl, forecastUrl]) {
    url.searchParams.set('lat', latitude)
    url.searchParams.set('lon', longitude)
    url.searchParams.set('appid', apiKey)
    url.searchParams.set('units', 'metric')
  }

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl, { signal: AbortSignal.timeout(10000) }),
    fetch(forecastUrl, { signal: AbortSignal.timeout(10000) }),
  ])
  const [current, forecast] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ])

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error(current.message || forecast.message || 'OpenWeatherMap request failed.')
  }
  return formatOpenWeather(current, forecast)
}

router.get('/', async (req, res) => {
  try {
    const { destinationId } = req.query
    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: 'Please select a valid destination.' })
    }

    const destination = await Destination.findById(destinationId).lean()
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    const { latitude, longitude } = destination.coordinates || {}
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'This destination does not have coordinates for weather lookup.' })
    }

    let weather
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (apiKey) {
      try {
        weather = await getOpenWeatherMapWeather(latitude, longitude, apiKey)
      } catch (providerError) {
        console.warn('OpenWeatherMap unavailable; trying Open-Meteo:', providerError.message)
      }
    }

    if (!weather) {
      weather = await getOpenMeteoWeather(latitude, longitude)
    }

    return res.json({ destination: destination.name, ...weather })
  } catch (error) {
    console.error('Weather lookup failed:', error.message)
    return res.status(502).json({ message: 'Weather providers could not return data right now.' })
  }
})

module.exports = router
