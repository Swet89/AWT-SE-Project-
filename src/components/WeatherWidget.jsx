import { useState } from 'react'
import axios from 'axios'

function weatherIcon(code = '') {
  if (code.startsWith('01')) return '☀️'
  if (code.startsWith('02') || code.startsWith('03') || code.startsWith('04')) return '☁️'
  if (code.startsWith('09') || code.startsWith('10')) return '🌧️'
  if (code.startsWith('11')) return '⚡'
  if (code.startsWith('13')) return '❄️'
  return '🌫️'
}

function greekWeatherName(code = '') {
  if (code.startsWith('01')) return 'Helios'
  if (code.startsWith('09') || code.startsWith('10')) return 'Poseidon'
  if (code.startsWith('11')) return 'Zeus'
  if (code.startsWith('13')) return 'Boreas'
  return 'Apollo'
}

export default function WeatherWidget({ destination }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState('')

  async function toggleWeather() {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)
    setError('')

    if (weather) return

    setLoading(true)

    try {
      const response = await axios.get('http://localhost:5000/api/weather', {
        params: { destinationId: destination._id },
      })
      setWeather(response.data)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not load weather. Check the backend and weather API key.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="weather-widget">
      <button
        className="weather-toggle"
        type="button"
        onClick={toggleWeather}
        aria-expanded={open}
      >
        {open ? 'Hide weather' : `Check weather in ${destination.name}`}
      </button>

      {open && (
        <div className="weather-panel">
          {loading && <p>Loading weather…</p>}
          {error && <p className="error-message" role="alert">{error}</p>}

          {weather && !loading && (
            <>
              <div className="weather-current">
                <span className="weather-icon" aria-hidden="true">
                  {weatherIcon(weather.current.icon)}
                </span>
                <div>
                  <strong>{weather.destination} · {weather.current.temperatureC}°C</strong>
                  <p>
                    {greekWeatherName(weather.current.icon)} brings{' '}
                    {weather.current.description}
                  </p>
                  <small>
                    Feels like {weather.current.feelsLikeC}°C · Humidity{' '}
                    {weather.current.humidity}%
                  </small>
                </div>
              </div>

              <div className="weather-forecast">
                {weather.forecast.map((day) => (
                  <div className="weather-day" key={day.date}>
                    <strong>
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                        'en-IN',
                        { weekday: 'short', day: 'numeric' },
                      )}
                    </strong>
                    <span aria-hidden="true">{weatherIcon(day.icon)}</span>
                    <span>{day.max}° / {day.min}°C</span>
                  </div>
                ))}
              </div>
              <small className="weather-source">Weather data: {weather.provider}</small>
            </>
          )}
        </div>
      )}
    </div>
  )
}
