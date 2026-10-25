import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { showToast } from '../lib/toast.js'

const API = 'http://localhost:5000/api'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function Wayfinder() {
  const token = sessionStorage.getItem('odysseyAccessToken')
  const navigate = useNavigate()

  const [destinations, setDestinations] = useState([])
  const [savedItineraries, setSavedItineraries] = useState([])
  const [destinationId, setDestinationId] = useState('')
  const [days, setDays] = useState(3)
  const [dailyBudgetINR, setDailyBudgetINR] = useState(5000)
  const [travelStyle, setTravelStyle] = useState('Balanced')
  const [request, setRequest] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    async function loadPageData() {
      try {
        const authConfig = {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }

        const [destinationResponse, itineraryResponse] = await Promise.all([
          axios.get(`${API}/destinations`, { signal: controller.signal }),
          axios.get(`${API}/itineraries`, authConfig),
        ])

        setDestinations(destinationResponse.data)
        setSavedItineraries(itineraryResponse.data)
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          sessionStorage.removeItem('odysseyAccessToken')
          sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
          navigate('/login', { replace: true })
          return
        }

        setError(
          requestError.response?.data?.message ||
            'Could not load Wayfinder. Check that the backend is running.',
        )
      }
    }

    loadPageData()
    return () => controller.abort()
  }, [token, navigate])

  async function generateItinerary(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPlan(null)
    setLoading(true)

    try {
      const response = await axios.post(
        `${API}/chat/itinerary`,
        {
          destinationId,
          days: Number(days),
          dailyBudgetINR: Number(dailyBudgetINR),
          travelStyle,
          request,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setPlan(response.data)
      showToast('Your itinerary is ready.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Could not create an itinerary. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function saveItinerary() {
    if (!plan) return

    setError('')
    setMessage('')
    setSaving(true)

    try {
      const response = await axios.post(
        `${API}/itineraries`,
        { destinationId: plan.destinationId, plan },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSavedItineraries((previous) => [
        response.data.itinerary,
        ...previous,
      ])
      setMessage('Itinerary saved to My Journeys.')
      showToast('Itinerary saved to My Journeys.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Could not save the itinerary. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  function exportPdf() {
    window.print()
  }

  return (
    <main className="wayfinder-page">
      <header className="wayfinder-heading">
        <p className="eyebrow dark">YOUR ODYSSEY, CHARTED</p>
        <h1>Wayfinder</h1>
        <p>
          Tell us what kind of trip you want. Wayfinder will draft a day-by-day
          plan.
        </p>
      </header>

      {!token && (
        <p className="error-message" role="alert">
          Please sign in to use Wayfinder and save itineraries.
        </p>
      )}

      {token && (
        <form className="wayfinder-form" onSubmit={generateItinerary}>
          <label>
            Destination
            <select
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              required
            >
              <option value="">Choose a destination</option>
              {destinations.map((place) => (
                <option key={place._id} value={place._id}>
                  {place.name}, {place.country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Days
            <input
              type="number"
              min="1"
              max="10"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              required
            />
          </label>

          <label>
            Daily budget per traveler (₹)
            <input
              type="number"
              min="500"
              max="500000"
              value={dailyBudgetINR}
              onChange={(event) => setDailyBudgetINR(event.target.value)}
              required
            />
          </label>

          <label>
            Travel style
            <select
              value={travelStyle}
              onChange={(event) => setTravelStyle(event.target.value)}
            >
              <option>Balanced</option>
              <option>Culture and history</option>
              <option>Nature and outdoors</option>
              <option>Relaxed</option>
              <option>Food focused</option>
              <option>Family friendly</option>
            </select>
          </label>

          <label className="wayfinder-request">
            What would you like to do?
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              minLength="5"
              maxLength="1000"
              placeholder="For example: include local food, historic places, and a relaxed afternoon."
              required
            />
          </label>

          <button type="submit" disabled={loading || !destinations.length}>
            {loading ? 'Wayfinder is planning…' : 'Create itinerary'}
          </button>
        </form>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="wayfinder-message" role="status">
          {message}
        </p>
      )}

      {plan && (
        <article className="itinerary-print-area">
          <div className="itinerary-actions">
            <button type="button" onClick={saveItinerary} disabled={saving}>
              {saving ? 'Saving…' : 'Save itinerary'}
            </button>
            <button type="button" onClick={exportPdf}>
              Export as PDF
            </button>
          </div>

          <p className="eyebrow dark">{plan.destinationName}</p>
          <h2>{plan.title}</h2>
          <p>{plan.summary}</p>

          {plan.days.map((day) => (
            <section className="itinerary-day" key={day.day}>
              <h3>
                Day {day.day}: {day.theme}
              </h3>
              <div className="itinerary-activities">
                {day.activities.map((activity, index) => (
                  <div
                    className="itinerary-activity"
                    key={`${day.day}-${index}`}
                  >
                    <strong>{activity.time}</strong>
                    <h4>{activity.place}</h4>
                    <p>{activity.description}</p>
                    <small>
                      Estimated cost: {inr.format(activity.estimatedCostINR)}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="itinerary-total">
            Estimated total:{' '}
            <strong>{inr.format(plan.totalEstimatedCostINR)}</strong>
          </p>
          <p>{plan.budgetNote}</p>
          <small>
            Locally generated suggestions and prices are estimates. Check local
            details and current prices before travelling.
          </small>
        </article>
      )}

      <section className="saved-itineraries">
        <h2>Your saved itineraries</h2>

        {savedItineraries.length === 0 ? (
          <p>No saved itineraries yet. Create one and choose Save itinerary.</p>
        ) : (
          savedItineraries.map((itinerary) => (
            <article className="saved-itinerary" key={itinerary._id}>
              <h3>{itinerary.title}</h3>
              <p>
                {itinerary.destinationName} · {itinerary.days.length} days
              </p>
              <p>
                Estimated total:{' '}
                {inr.format(itinerary.totalEstimatedCostINR)}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
